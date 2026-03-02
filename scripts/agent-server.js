#!/usr/bin/env node

/**
 * Agent Server (Component 4)
 * Port: 3847
 *
 * Zero-external-dependency Node.js server that orchestrates the Claude CLI
 * using the spawn API and manages session state via local JSONL files.
 *
 * Endpoints:
 *   POST /START    - Start a new Claude CLI session
 *   GET  /POLL     - Poll for new output from a session
 *   POST /APPROVE  - Send approval signal for write operations
 *   POST /CANCEL   - Terminate a running session
 *   GET  /HEALTH   - Health check
 *
 * Usage:
 *   node scripts/agent-server.js
 *
 * Environment:
 *   PORT            - Server port (default: 3847)
 *   SESSION_DIR     - Session log directory (default: /tmp/agent-sessions)
 *   ALLOWED_ORIGINS - Comma-separated allowed CORS origins
 */

const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.PORT || "3847", 10);
const SESSION_DIR = process.env.SESSION_DIR || "/tmp/agent-sessions";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

// Ensure session directory exists
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

/** @type {Record<string, { process: import('child_process').ChildProcess, logPath: string, lastLine: number, status: string, phase: string }>} */
const sessions = {};

/**
 * Parse JSON body from incoming request
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      // Prevent excessively large payloads (1MB limit)
      if (data.length > 1048576) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * Send JSON response
 */
function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

/**
 * Validate session ID format (UUID v4)
 */
function isValidSessionId(id) {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    )
  );
}

/**
 * Append a log entry to the session JSONL file
 */
function appendLog(logPath, output, type = "stdout") {
  const entry = JSON.stringify({
    timestamp: Date.now(),
    output,
    type,
  });
  fs.appendFileSync(logPath, entry + "\n");
}

/**
 * POST /START - Start a new Claude CLI session
 */
function handleStart(body, res) {
  const { id, command } = body;

  if (!isValidSessionId(id)) {
    return sendJson(res, 400, { error: "Invalid session ID" });
  }

  if (!command || typeof command !== "string") {
    return sendJson(res, 400, { error: "Missing command" });
  }

  if (sessions[id]) {
    return sendJson(res, 409, { error: "Session already exists" });
  }

  const logPath = path.join(SESSION_DIR, `${id}.jsonl`);

  // Start Claude CLI in prompt mode
  const proc = spawn("claude", ["-p", command], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      // Prevent API key override attacks (CVE-2026-21852)
      ANTHROPIC_BASE_URL: undefined,
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  sessions[id] = {
    process: proc,
    logPath,
    lastLine: 0,
    status: "running",
    phase: "investigate",
  };

  // Log initial system message
  appendLog(logPath, `Session started: ${command}`, "system");

  proc.stdout.on("data", (data) => {
    const text = data.toString();
    appendLog(logPath, text, "stdout");

    // Detect approval requests
    if (
      text.includes("Allow?") ||
      text.includes("Approve?") ||
      text.includes("(y/n)")
    ) {
      sessions[id].status = "awaiting_approval";
      sessions[id].phase = "approve";
      appendLog(logPath, "[APPROVAL REQUIRED] Agent requests write access", "approval_request");
    }
  });

  proc.stderr.on("data", (data) => {
    appendLog(logPath, data.toString(), "stderr");
  });

  proc.on("close", (code) => {
    if (sessions[id]) {
      sessions[id].status = code === 0 ? "completed" : "error";
      appendLog(
        logPath,
        `Process exited with code ${code}`,
        "system"
      );
    }
  });

  proc.on("error", (err) => {
    if (sessions[id]) {
      sessions[id].status = "error";
      appendLog(logPath, `Process error: ${err.message}`, "system");
    }
  });

  sendJson(res, 200, { id, status: "running" });
}

/**
 * GET /POLL - Poll for new output lines
 */
function handlePoll(id, res) {
  if (!isValidSessionId(id)) {
    return sendJson(res, 400, { error: "Invalid session ID" });
  }

  const session = sessions[id];
  if (!session) {
    return sendJson(res, 404, { error: "Session not found" });
  }

  try {
    if (!fs.existsSync(session.logPath)) {
      return sendJson(res, 200, {
        line: null,
        status: session.status,
        phase: session.phase,
      });
    }

    const content = fs.readFileSync(session.logPath, "utf8").trim();
    if (!content) {
      return sendJson(res, 200, {
        line: null,
        status: session.status,
        phase: session.phase,
      });
    }

    const lines = content.split("\n");
    const newLines = lines.slice(session.lastLine);
    session.lastLine = lines.length;

    // Return the latest new line, or null if no new output
    const latestLine =
      newLines.length > 0
        ? newLines.map((l) => {
            try {
              return JSON.parse(l).output;
            } catch {
              return l;
            }
          }).join("\n")
        : null;

    sendJson(res, 200, {
      line: latestLine,
      status: session.status,
      phase: session.phase,
    });
  } catch {
    sendJson(res, 200, {
      line: null,
      status: session.status,
      phase: session.phase,
    });
  }
}

/**
 * POST /APPROVE - Send approval signal (Phase 2)
 */
function handleApprove(body, res) {
  const { id } = body;

  if (!isValidSessionId(id)) {
    return sendJson(res, 400, { error: "Invalid session ID" });
  }

  const session = sessions[id];
  if (!session) {
    return sendJson(res, 404, { error: "Session not found" });
  }

  if (session.status !== "awaiting_approval") {
    return sendJson(res, 400, { error: "Session not awaiting approval" });
  }

  try {
    session.process.stdin.write("Yes\n");
    session.status = "running";
    session.phase = "approve";
    appendLog(session.logPath, "[APPROVED] Write access granted", "system");
    sendJson(res, 200, { status: "approved" });
  } catch {
    sendJson(res, 500, { error: "Failed to send approval" });
  }
}

/**
 * POST /CANCEL - Terminate a running session
 */
function handleCancel(body, res) {
  const { id } = body;

  if (!isValidSessionId(id)) {
    return sendJson(res, 400, { error: "Invalid session ID" });
  }

  const session = sessions[id];
  if (!session) {
    return sendJson(res, 404, { error: "Session not found" });
  }

  try {
    session.process.kill("SIGKILL");
    session.status = "terminated";
    appendLog(session.logPath, "Session terminated by user", "system");
    sendJson(res, 200, { status: "terminated" });
  } catch {
    sendJson(res, 500, { error: "Failed to terminate session" });
  }
}

/**
 * Main HTTP server
 */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  try {
    // POST /START
    if (req.method === "POST" && pathname === "/START") {
      const body = await parseBody(req);
      return handleStart(body, res);
    }

    // GET /POLL
    if (req.method === "GET" && pathname === "/POLL") {
      const id = url.searchParams.get("id");
      return handlePoll(id, res);
    }

    // POST /APPROVE
    if (req.method === "POST" && pathname === "/APPROVE") {
      const body = await parseBody(req);
      return handleApprove(body, res);
    }

    // POST /CANCEL
    if (req.method === "POST" && pathname === "/CANCEL") {
      const body = await parseBody(req);
      return handleCancel(body, res);
    }

    // GET /HEALTH
    if (req.method === "GET" && pathname === "/HEALTH") {
      return sendJson(res, 200, {
        status: "ok",
        activeSessions: Object.keys(sessions).length,
        uptime: process.uptime(),
      });
    }

    // 404
    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    sendJson(res, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Agent Server listening on http://127.0.0.1:${PORT}`);
  console.log(`Session logs: ${SESSION_DIR}`);
  console.log("Endpoints: /START, /POLL, /APPROVE, /CANCEL, /HEALTH");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down agent server...");
  // Kill all active sessions
  for (const [id, session] of Object.entries(sessions)) {
    try {
      session.process.kill("SIGTERM");
    } catch {
      // Process may already be dead
    }
  }
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  process.emit("SIGTERM");
});
