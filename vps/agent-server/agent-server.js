/**
 * Rain Check Agent Server
 *
 * Express server that spawns Claude CLI sessions and exposes them
 * via REST endpoints for the Vercel frontend to consume.
 *
 * Endpoints:
 *   POST /START        — Spawn a new Claude CLI session
 *   GET  /POLL?id&since — Long-poll for new output lines
 *   POST /APPROVE?id   — Send approval (y\n) to stdin
 *   POST /CANCEL?id    — Kill a session
 *   GET  /STATUS?id    — Get session state
 *
 * Deploy: /opt/rain-check-agent/ on VPS (195.35.11.41 / srv1021380.hstgr.cloud)
 * Port: 3848 (EduPrep agent already uses 3847)
 */

require("dotenv").config();
const express = require("express");
const { spawn } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3848;
const AGENT_SECRET = process.env.AGENT_SERVER_SECRET;
const MAX_CONCURRENT = 3;
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LONG_POLL_TIMEOUT_MS = 30 * 1000; // 30 seconds

// --- Session Store ---

const sessions = new Map();

/**
 * Session shape:
 * {
 *   id: string,
 *   process: ChildProcess | null,
 *   state: "running" | "waiting_approval" | "completed" | "error" | "cancelled",
 *   lines: Array<{ type: string, text: string }>,
 *   createdAt: number,
 *   lastActivity: number,
 *   logPath: string,
 *   waiters: Array<{ resolve, timer }>,
 * }
 */

// --- Auth Middleware ---

function requireAuth(req, res, next) {
  const secret = req.headers["x-agent-secret"];
  if (!AGENT_SECRET) {
    return res.status(503).json({ error: "Server not configured" });
  }
  if (secret !== AGENT_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.use(requireAuth);

// --- Endpoints ---

app.post("/START", (req, res) => {
  const { command, businessId } = req.body;

  if (!command || typeof command !== "string") {
    return res.status(400).json({ error: "Command is required" });
  }

  // Check concurrent limit
  const activeSessions = [...sessions.values()].filter(
    (s) => s.state === "running" || s.state === "waiting_approval"
  );
  if (activeSessions.length >= MAX_CONCURRENT) {
    return res.status(429).json({
      error: `Max ${MAX_CONCURRENT} concurrent sessions. Try again later.`,
    });
  }

  const id = crypto.randomUUID();
  const logPath = path.join("/tmp", `rain-check-agent-${id}.jsonl`);

  // Build the prompt with business context
  const prompt = [
    `Business ID: ${businessId || "unknown"}`,
    `User command: ${command}`,
    "",
    "Execute this command using the available tools. Be concise in your output.",
  ].join("\n");

  // Spawn Claude CLI
  const proc = spawn("claude", ["-p", prompt, "--output-format", "stream-json"], {
    cwd: "/opt/rain-check-agent",
    env: {
      ...process.env,
      CLAUDE_CONFIG_DIR: "/opt/rain-check-agent/.claude",
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  const session = {
    id,
    process: proc,
    state: "running",
    lines: [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
    logPath,
    waiters: [],
  };

  sessions.set(id, session);

  // Parse stdout (stream-json format)
  let buffer = "";
  proc.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        handleStreamEvent(session, event);
      } catch {
        // Plain text fallback
        appendLine(session, "stdout", line);
      }
    }
  });

  proc.stderr.on("data", (chunk) => {
    const text = chunk.toString().trim();
    if (text) {
      appendLine(session, "stderr", text);
    }
  });

  proc.on("close", (code) => {
    session.process = null;
    if (session.state === "running" || session.state === "waiting_approval") {
      session.state = code === 0 ? "completed" : "error";
      appendLine(
        session,
        "exit",
        code === 0 ? "Session completed." : `Session exited with code ${code}`
      );
    }
    flushWaiters(session);
  });

  proc.on("error", (err) => {
    session.state = "error";
    appendLine(session, "system", `Process error: ${err.message}`);
    session.process = null;
    flushWaiters(session);
  });

  // Auto-kill after TTL
  setTimeout(() => {
    if (sessions.has(id) && (session.state === "running" || session.state === "waiting_approval")) {
      killSession(session);
      appendLine(session, "system", "Session timed out (5 min limit).");
    }
  }, SESSION_TTL_MS);

  res.json({ id, state: "running" });
});

app.get("/POLL", (req, res) => {
  const { id, since } = req.query;
  const session = sessions.get(id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const offset = parseInt(since) || 0;
  const newLines = session.lines.slice(offset);

  // If we have new lines or session is done, respond immediately
  if (
    newLines.length > 0 ||
    session.state === "completed" ||
    session.state === "error" ||
    session.state === "cancelled"
  ) {
    session.lastActivity = Date.now();
    return res.json({
      lines: newLines,
      state: session.state,
      offset: session.lines.length,
    });
  }

  // Long-poll: wait for new data
  const timer = setTimeout(() => {
    session.waiters = session.waiters.filter((w) => w.resolve !== resolve);
    res.json({
      lines: [],
      state: session.state,
      offset: session.lines.length,
    });
  }, LONG_POLL_TIMEOUT_MS);

  function resolve() {
    clearTimeout(timer);
    const freshLines = session.lines.slice(offset);
    session.lastActivity = Date.now();
    res.json({
      lines: freshLines,
      state: session.state,
      offset: session.lines.length,
    });
  }

  session.waiters.push({ resolve, timer });
});

app.post("/APPROVE", (req, res) => {
  const id = req.query.id || req.body?.id;
  const session = sessions.get(id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (!session.process || !session.process.stdin.writable) {
    return res.status(400).json({ error: "Session not accepting input" });
  }

  session.process.stdin.write("y\n");
  session.state = "running";
  appendLine(session, "system", "Approved by user.");

  res.json({ ok: true });
});

app.post("/CANCEL", (req, res) => {
  const id = req.query.id || req.body?.id;
  const session = sessions.get(id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  killSession(session);
  res.json({ ok: true, state: "cancelled" });
});

app.get("/STATUS", (req, res) => {
  const { id } = req.query;
  const session = sessions.get(id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json({
    id: session.id,
    state: session.state,
    lineCount: session.lines.length,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
  });
});

// --- Helpers ---

function appendLine(session, type, text) {
  session.lines.push({ type, text });
  session.lastActivity = Date.now();

  // Write to log
  try {
    fs.appendFileSync(
      session.logPath,
      JSON.stringify({ type, text, ts: Date.now() }) + "\n"
    );
  } catch {
    // Non-critical
  }

  flushWaiters(session);
}

function flushWaiters(session) {
  const waiters = session.waiters.splice(0);
  for (const w of waiters) {
    try {
      w.resolve();
    } catch {
      // Ignore already-sent responses
    }
  }
}

function handleStreamEvent(session, event) {
  // Claude stream-json events
  switch (event.type) {
    case "assistant":
      if (event.message?.content) {
        for (const block of event.message.content) {
          if (block.type === "text" && block.text) {
            appendLine(session, "stdout", block.text);
          } else if (block.type === "tool_use") {
            appendLine(
              session,
              "system",
              `[Tool: ${block.name}]`
            );
          }
        }
      }
      break;

    case "content_block_delta":
      if (event.delta?.type === "text_delta" && event.delta.text) {
        appendLine(session, "stdout", event.delta.text);
      }
      break;

    case "result":
      if (event.result) {
        appendLine(session, "stdout", event.result);
      }
      if (event.is_error) {
        session.state = "error";
      }
      break;

    case "system":
      if (event.message) {
        appendLine(session, "system", event.message);
      }
      // Check for approval requests
      if (event.subtype === "tool_use_permission") {
        session.state = "waiting_approval";
        appendLine(
          session,
          "approval_required",
          `Permission requested: ${event.tool_name || "tool use"} — ${event.description || "Approve or deny this action."}`
        );
      }
      break;

    default:
      // Unknown event — log as-is if it has text
      if (event.text) {
        appendLine(session, "stdout", event.text);
      }
      break;
  }
}

function killSession(session) {
  session.state = "cancelled";
  if (session.process) {
    try {
      session.process.kill("SIGTERM");
      // Force kill after 3s
      setTimeout(() => {
        try {
          session.process?.kill("SIGKILL");
        } catch {
          // Already dead
        }
      }, 3000);
    } catch {
      // Already dead
    }
  }
  flushWaiters(session);

  // Clean up after 60s
  setTimeout(() => {
    sessions.delete(session.id);
    try {
      fs.unlinkSync(session.logPath);
    } catch {
      // Non-critical
    }
  }, 60000);
}

// --- Cleanup stale sessions every 60s ---

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    const age = now - session.lastActivity;

    // Clean up terminal sessions after 2 min of inactivity
    if (
      (session.state === "completed" || session.state === "error" || session.state === "cancelled") &&
      age > 120000
    ) {
      sessions.delete(id);
      try { fs.unlinkSync(session.logPath); } catch { /* Non-critical */ }
      continue;
    }

    // Kill zombie sessions stuck in "running" or "waiting_approval" past TTL
    // This catches processes that crash without firing the 'close' event
    if (
      (session.state === "running" || session.state === "waiting_approval") &&
      age > SESSION_TTL_MS
    ) {
      console.warn(`Reaping zombie session ${id} (stuck ${Math.round(age / 1000)}s)`);
      killSession(session);
      appendLine(session, "system", "Session reaped — exceeded TTL with no activity.");
    }
  }
}, 60000);

// --- Start ---

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Rain Check Agent Server running on http://0.0.0.0:${PORT}`);
  console.log(`Max concurrent sessions: ${MAX_CONCURRENT}`);
  console.log(`Session TTL: ${SESSION_TTL_MS / 1000}s`);
});
