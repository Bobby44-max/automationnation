/**
 * Claude Code Agent Server
 *
 * Custom Node.js server (port 3847) that replaces n8n for orchestrating
 * Claude Code CLI sessions. Handles 4 actions: start, approve, poll, cancel.
 *
 * Two-phase security:
 *   Phase 1 (Investigate): Claude has read-only access
 *   Phase 2 (Approve): Write access granted only after explicit user approval
 */

const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.AGENT_SERVER_PORT || 3847;
const SESSION_DIR = "/tmp/agent-sessions";
const SHARED_SECRET = process.env.AGENT_SHARED_SECRET || "";
const PROJECT_ROOT = process.env.AGENT_PROJECT_ROOT || "/home/user/automationnation";

// Active sessions: id -> { process, phase, status, createdAt }
const sessions = new Map();

// Ensure session directory exists
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

function generateId() {
  return crypto.randomBytes(12).toString("hex");
}

function jsonResponse(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

function verifyAuth(req) {
  if (!SHARED_SECRET) return true;
  const auth = req.headers["authorization"];
  return auth === `Bearer ${SHARED_SECRET}`;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * START — Spawn a new Claude Code CLI session in read-only mode
 *
 * Body: { prompt: string, allowedTools?: string[] }
 * Returns: { sessionId, status: "running" }
 */
function handleStart(body) {
  const { prompt, allowedTools } = body;

  if (!prompt || typeof prompt !== "string") {
    return { status: 400, data: { error: "prompt is required" } };
  }

  const sessionId = generateId();
  const outputFile = path.join(SESSION_DIR, `${sessionId}.jsonl`);

  // Initialize the output file with session metadata
  const meta = {
    type: "session_start",
    sessionId,
    prompt,
    phase: "investigate",
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(outputFile, JSON.stringify(meta) + "\n");

  // Build CLI args — read-only by default (Phase 1: Investigate)
  const args = [
    "--print",
    "--output-format", "json",
    "--max-turns", "50",
    "--allowedTools", allowedTools
      ? allowedTools.join(",")
      : "Read,Glob,Grep,WebSearch,WebFetch",
  ];

  // Spawn Claude Code CLI
  const proc = spawn("claude", [...args, prompt], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      CLAUDE_CODE_ENTRYPOINT: "agent-server",
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Stream stdout to JSONL file
  proc.stdout.on("data", (chunk) => {
    const lines = chunk.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      const entry = {
        type: "output",
        content: line,
        timestamp: new Date().toISOString(),
      };
      fs.appendFileSync(outputFile, JSON.stringify(entry) + "\n");
    }
  });

  // Stream stderr to JSONL file
  proc.stderr.on("data", (chunk) => {
    const entry = {
      type: "stderr",
      content: chunk.toString(),
      timestamp: new Date().toISOString(),
    };
    fs.appendFileSync(outputFile, JSON.stringify(entry) + "\n");
  });

  // Handle process exit
  proc.on("close", (code) => {
    const session = sessions.get(sessionId);
    if (session) {
      session.status = code === 0 ? "completed" : "failed";
      session.exitCode = code;
    }
    const entry = {
      type: "session_end",
      exitCode: code,
      status: code === 0 ? "completed" : "failed",
      timestamp: new Date().toISOString(),
    };
    fs.appendFileSync(outputFile, JSON.stringify(entry) + "\n");
  });

  sessions.set(sessionId, {
    process: proc,
    phase: "investigate",
    status: "running",
    outputFile,
    prompt,
    createdAt: new Date().toISOString(),
  });

  return {
    status: 200,
    data: { sessionId, status: "running", phase: "investigate" },
  };
}

/**
 * APPROVE — Upgrade session to write access (Phase 2)
 *
 * Kills the read-only process and restarts with write tools enabled.
 * Body: { sessionId: string }
 * Returns: { sessionId, status: "running", phase: "execute" }
 */
function handleApprove(body) {
  const { sessionId } = body;

  if (!sessionId) {
    return { status: 400, data: { error: "sessionId is required" } };
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return { status: 404, data: { error: "Session not found" } };
  }

  if (session.phase === "execute") {
    return { status: 400, data: { error: "Session already in execute phase" } };
  }

  // Log approval
  const approvalEntry = {
    type: "phase_change",
    from: "investigate",
    to: "execute",
    timestamp: new Date().toISOString(),
  };
  fs.appendFileSync(session.outputFile, JSON.stringify(approvalEntry) + "\n");

  // Kill the read-only process
  if (session.process && !session.process.killed) {
    session.process.kill("SIGTERM");
  }

  // Restart with full tool access (Phase 2: Execute)
  const args = [
    "--print",
    "--output-format", "json",
    "--max-turns", "50",
    "--allowedTools",
    "Read,Glob,Grep,Edit,Write,Bash,WebSearch,WebFetch",
  ];

  const continuePrompt = `Continue the previous analysis and now EXECUTE the proposed changes. Original prompt: ${session.prompt}`;

  const proc = spawn("claude", [...args, continuePrompt], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      CLAUDE_CODE_ENTRYPOINT: "agent-server",
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  proc.stdout.on("data", (chunk) => {
    const lines = chunk.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      const entry = {
        type: "output",
        content: line,
        phase: "execute",
        timestamp: new Date().toISOString(),
      };
      fs.appendFileSync(session.outputFile, JSON.stringify(entry) + "\n");
    }
  });

  proc.stderr.on("data", (chunk) => {
    const entry = {
      type: "stderr",
      content: chunk.toString(),
      phase: "execute",
      timestamp: new Date().toISOString(),
    };
    fs.appendFileSync(session.outputFile, JSON.stringify(entry) + "\n");
  });

  proc.on("close", (code) => {
    const s = sessions.get(sessionId);
    if (s) {
      s.status = code === 0 ? "completed" : "failed";
      s.exitCode = code;
    }
    const entry = {
      type: "session_end",
      exitCode: code,
      status: code === 0 ? "completed" : "failed",
      phase: "execute",
      timestamp: new Date().toISOString(),
    };
    fs.appendFileSync(session.outputFile, JSON.stringify(entry) + "\n");
  });

  session.process = proc;
  session.phase = "execute";
  session.status = "running";

  return {
    status: 200,
    data: { sessionId, status: "running", phase: "execute" },
  };
}

/**
 * POLL — Read new output lines from a session's JSONL file
 *
 * Body: { sessionId: string, afterLine?: number }
 * Returns: { lines: object[], totalLines: number, status, phase }
 */
function handlePoll(body) {
  const { sessionId, afterLine = 0 } = body;

  if (!sessionId) {
    return { status: 400, data: { error: "sessionId is required" } };
  }

  const session = sessions.get(sessionId);
  const outputFile = path.join(SESSION_DIR, `${sessionId}.jsonl`);

  if (!fs.existsSync(outputFile)) {
    return { status: 404, data: { error: "Session output not found" } };
  }

  const allLines = fs
    .readFileSync(outputFile, "utf-8")
    .split("\n")
    .filter(Boolean);

  const newLines = allLines.slice(afterLine).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return { type: "raw", content: line };
    }
  });

  return {
    status: 200,
    data: {
      lines: newLines,
      totalLines: allLines.length,
      status: session ? session.status : "unknown",
      phase: session ? session.phase : "unknown",
    },
  };
}

/**
 * CANCEL — Kill a running session
 *
 * Body: { sessionId: string }
 * Returns: { sessionId, status: "cancelled" }
 */
function handleCancel(body) {
  const { sessionId } = body;

  if (!sessionId) {
    return { status: 400, data: { error: "sessionId is required" } };
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return { status: 404, data: { error: "Session not found" } };
  }

  if (session.process && !session.process.killed) {
    session.process.kill("SIGTERM");
  }

  session.status = "cancelled";

  const entry = {
    type: "session_cancelled",
    timestamp: new Date().toISOString(),
  };
  fs.appendFileSync(session.outputFile, JSON.stringify(entry) + "\n");

  return {
    status: 200,
    data: { sessionId, status: "cancelled" },
  };
}

// Route handler
const ACTIONS = {
  start: handleStart,
  approve: handleApprove,
  poll: handlePoll,
  cancel: handleCancel,
};

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    jsonResponse(res, 200, {});
    return;
  }

  if (req.method !== "POST") {
    jsonResponse(res, 405, { error: "Method not allowed" });
    return;
  }

  // Auth check
  if (!verifyAuth(req)) {
    jsonResponse(res, 401, { error: "Unauthorized" });
    return;
  }

  try {
    const body = await parseBody(req);
    const { action } = body;

    if (!action || !ACTIONS[action]) {
      jsonResponse(res, 400, {
        error: `Invalid action. Valid actions: ${Object.keys(ACTIONS).join(", ")}`,
      });
      return;
    }

    const result = ACTIONS[action](body);
    jsonResponse(res, result.status, result.data);
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Agent server running on port ${PORT}`);
  console.log(`Session output: ${SESSION_DIR}`);
  console.log(`Project root: ${PROJECT_ROOT}`);
  console.log(`Auth: ${SHARED_SECRET ? "enabled" : "disabled (no AGENT_SHARED_SECRET)"}`);
});

// Graceful shutdown — kill all active sessions
process.on("SIGTERM", () => {
  for (const [id, session] of sessions) {
    if (session.process && !session.process.killed) {
      session.process.kill("SIGTERM");
    }
  }
  server.close();
  process.exit(0);
});
