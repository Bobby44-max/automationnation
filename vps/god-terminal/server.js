/**
 * Rain Check God Terminal — Express Server (CLI Edition)
 *
 * Spawns Claude CLI processes with stream-json output.
 * The CLI has access to Bash, file read/write, and uses CLAUDE.md
 * for weather operations context (API keys, endpoints, contacts).
 *
 * Endpoints:
 *   POST /api/run           — Start a new session, returns sessionId
 *   GET  /api/stream?sessionId=X — SSE event stream (replay + live)
 *   POST /api/approve       — Send approval to CLI stdin
 *   GET  /health            — Server health check
 *
 * Deploy: /opt/rc/vps/god-terminal/ on VPS
 * Port: 3848
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { spawn } = require("child_process");
const path = require("path");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 3848;
const AGENT_SECRET = process.env.AGENT_SERVER_SECRET;
const MAX_CONCURRENT = 5;
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

// The working directory for Claude CLI — it reads CLAUDE.md from here
const CLI_CWD = path.resolve(__dirname);

// ---------------------------------------------------------------------------
// Session Store (in-memory — fine for demo)
// ---------------------------------------------------------------------------

const sessions = new Map();

/**
 * Session shape:
 * {
 *   id: string,
 *   state: "running" | "waiting_approval" | "completed" | "error",
 *   events: Array<{ event: string, data: object }>,
 *   sseClients: Set<Response>,
 *   process: ChildProcess | null,
 *   createdAt: number,
 *   lastActivity: number,
 * }
 */

// ---------------------------------------------------------------------------
// Express App
// ---------------------------------------------------------------------------

const app = express();
app.use(cors());
app.use(express.json());

// --- Auth Middleware ---

function requireAuth(req, res, next) {
  if (!AGENT_SECRET) {
    return res.status(503).json({ error: "Server not configured — missing AGENT_SERVER_SECRET" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  // Also accept x-agent-secret header for backwards compat
  const legacySecret = req.headers["x-agent-secret"];

  if (token !== AGENT_SECRET && legacySecret !== AGENT_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Health check is public
app.get("/health", (req, res) => {
  const activeSessions = [...sessions.values()].filter(
    (s) => s.state === "running" || s.state === "waiting_approval"
  ).length;

  res.json({
    status: "ok",
    uptime: process.uptime(),
    activeSessions,
    totalSessions: sessions.size,
    maxConcurrent: MAX_CONCURRENT,
    version: "2.1.0-cli",
  });
});

// All other routes require auth
app.use("/api", requireAuth);

// ---------------------------------------------------------------------------
// POST /api/run — Start a new CLI session
// ---------------------------------------------------------------------------

app.post("/api/run", (req, res) => {
  const { message, businessId } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required (string)" });
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

  const sessionId = crypto.randomUUID();

  const session = {
    id: sessionId,
    state: "running",
    events: [],
    sseClients: new Set(),
    process: null,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  sessions.set(sessionId, session);

  // Return sessionId immediately — client connects to SSE next
  res.json({ sessionId, state: "running" });

  // Spawn Claude CLI in background
  spawnCLI(session, message, businessId);
});

// ---------------------------------------------------------------------------
// GET /api/stream?sessionId=X — SSE event stream
// ---------------------------------------------------------------------------

app.get("/api/stream", (req, res) => {
  const { sessionId } = req.query;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Set up SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Replay buffered events
  for (const evt of session.events) {
    res.write(`event: ${evt.event}\ndata: ${JSON.stringify(evt.data)}\n\n`);
  }

  // If session is already done, close immediately
  if (session.state === "completed" || session.state === "error") {
    res.write(`event: done\ndata: ${JSON.stringify({ state: session.state })}\n\n`);
    res.end();
    return;
  }

  // Register this client for live events
  session.sseClients.add(res);
  session.lastActivity = Date.now();

  // Clean up on disconnect
  req.on("close", () => {
    session.sseClients.delete(res);
  });
});

// ---------------------------------------------------------------------------
// POST /api/approve — Send approval to CLI stdin
// ---------------------------------------------------------------------------

app.post("/api/approve", (req, res) => {
  const { sessionId, approved } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.state !== "waiting_approval") {
    return res.status(400).json({ error: "Session not waiting for approval" });
  }

  if (!session.process || !session.process.stdin.writable) {
    return res.status(400).json({ error: "CLI process not accepting input" });
  }

  const isApproved = approved !== false;

  if (isApproved) {
    session.process.stdin.write("y\n");
  } else {
    session.process.stdin.write("n\n");
  }

  session.state = "running";
  session.lastActivity = Date.now();

  emitEvent(session, "approval_resolved", {
    approved: isApproved,
    message: isApproved ? "Approved by user" : "Denied by user",
  });

  res.json({ ok: true, approved: isApproved });
});

// ---------------------------------------------------------------------------
// SSE Event Emitter
// ---------------------------------------------------------------------------

function emitEvent(session, event, data) {
  const evt = { event, data };
  session.events.push(evt);
  session.lastActivity = Date.now();

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of session.sseClients) {
    try {
      client.write(payload);
    } catch {
      session.sseClients.delete(client);
    }
  }
}

// ---------------------------------------------------------------------------
// Spawn Claude CLI
// ---------------------------------------------------------------------------

function spawnCLI(session, message, businessId) {
  // Build the prompt — include business context
  const prompt = businessId
    ? `[Business ID: ${businessId}]\n\n${message}`
    : message;

  const proc = spawn("claude", ["-p", prompt, "--output-format", "stream-json"], {
    cwd: CLI_CWD,
    env: { ...process.env },
    stdio: ["pipe", "pipe", "pipe"],
  });

  session.process = proc;

  // Parse stream-json from stdout (newline-delimited JSON)
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
        emitEvent(session, "text", { text: line });
      }
    }
  });

  // Capture stderr
  proc.stderr.on("data", (chunk) => {
    const text = chunk.toString().trim();
    if (text) {
      console.error(`[${session.id}] stderr: ${text}`);
      // Don't emit noisy stderr to clients unless it's meaningful
      if (text.includes("Error") || text.includes("error")) {
        emitEvent(session, "error", { message: text });
      }
    }
  });

  // Process exit
  proc.on("close", (code) => {
    session.process = null;

    // Flush any remaining buffer
    if (buffer.trim()) {
      try {
        const event = JSON.parse(buffer.trim());
        handleStreamEvent(session, event);
      } catch {
        emitEvent(session, "text", { text: buffer.trim() });
      }
      buffer = "";
    }

    if (session.state === "running" || session.state === "waiting_approval") {
      session.state = code === 0 ? "completed" : "error";
    }

    emitEvent(session, "done", {
      state: session.state,
      exitCode: code,
    });
  });

  proc.on("error", (err) => {
    console.error(`[${session.id}] Process error:`, err.message);
    session.state = "error";
    session.process = null;
    emitEvent(session, "error", { message: `CLI process error: ${err.message}` });
    emitEvent(session, "done", { state: "error" });
  });

  // Auto-kill after TTL
  setTimeout(() => {
    if (sessions.has(session.id) && (session.state === "running" || session.state === "waiting_approval")) {
      killSession(session);
      emitEvent(session, "error", { message: "Session timed out (10 min limit)" });
      emitEvent(session, "done", { state: "error" });
    }
  }, SESSION_TTL_MS);
}

// ---------------------------------------------------------------------------
// Parse Claude CLI stream-json events → SSE events
// ---------------------------------------------------------------------------

function handleStreamEvent(session, event) {
  switch (event.type) {
    // Full assistant message (contains text + tool_use blocks)
    case "assistant":
      if (event.message?.content) {
        for (const block of event.message.content) {
          if (block.type === "text" && block.text) {
            emitEvent(session, "text", { text: block.text });
          } else if (block.type === "tool_use") {
            emitEvent(session, "tool_use", {
              toolUseId: block.id,
              toolName: block.name,
              input: block.input,
            });
          }
        }
      }
      break;

    // Streaming text deltas
    case "content_block_delta":
      if (event.delta?.type === "text_delta" && event.delta.text) {
        emitEvent(session, "text", { text: event.delta.text });
      }
      break;

    // Content block start (can contain tool_use info)
    case "content_block_start":
      if (event.content_block?.type === "tool_use") {
        emitEvent(session, "tool_use", {
          toolUseId: event.content_block.id,
          toolName: event.content_block.name,
          input: event.content_block.input,
        });
      }
      break;

    // Tool result
    case "tool_result":
      emitEvent(session, "tool_result", {
        toolUseId: event.tool_use_id,
        toolName: event.name,
        result: event.content || event.output,
      });
      break;

    // Final result
    case "result":
      if (event.result) {
        emitEvent(session, "text", { text: event.result });
      }
      if (event.is_error) {
        session.state = "error";
      }
      break;

    // System messages (including approval requests)
    case "system":
      if (event.subtype === "tool_use_permission") {
        session.state = "waiting_approval";
        emitEvent(session, "approval_required", {
          toolName: event.tool_name || "tool use",
          message: event.description || `Permission requested: ${event.tool_name || "tool use"}`,
        });
      } else if (event.message) {
        // System info — emit as text for visibility
        emitEvent(session, "system", { message: event.message });
      }
      break;

    default:
      // Unknown event — emit text if available
      if (event.text) {
        emitEvent(session, "text", { text: event.text });
      }
      break;
  }
}

// ---------------------------------------------------------------------------
// Kill Session
// ---------------------------------------------------------------------------

function killSession(session) {
  if (session.process) {
    try {
      session.process.kill("SIGTERM");
      // Force kill after 3s
      setTimeout(() => {
        try {
          session.process?.kill("SIGKILL");
        } catch { /* already dead */ }
      }, 3000);
    } catch { /* already dead */ }
  }
  session.state = "error";
}

// ---------------------------------------------------------------------------
// Session Cleanup (every 60s)
// ---------------------------------------------------------------------------

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    const age = now - session.lastActivity;

    // Clean up completed/errored sessions after 5 min of inactivity
    if (
      (session.state === "completed" || session.state === "error") &&
      age > 5 * 60 * 1000
    ) {
      for (const client of session.sseClients) {
        try { client.end(); } catch { /* ignore */ }
      }
      sessions.delete(id);
      continue;
    }

    // Kill sessions that exceed TTL
    if (
      (session.state === "running" || session.state === "waiting_approval") &&
      age > SESSION_TTL_MS
    ) {
      console.warn(`[cleanup] Session ${id} exceeded TTL (${Math.round(age / 1000)}s idle)`);
      killSession(session);
      emitEvent(session, "error", { message: "Session timed out" });
      emitEvent(session, "done", { state: "error" });
    }
  }
}, 60000);

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Rain Check God Terminal v2.1.0 (CLI Edition)`);
  console.log(`Listening on http://0.0.0.0:${PORT}`);
  console.log(`CLI working dir: ${CLI_CWD}`);
  console.log(`Max concurrent sessions: ${MAX_CONCURRENT}`);
  console.log(`Session TTL: ${SESSION_TTL_MS / 1000}s`);
});
