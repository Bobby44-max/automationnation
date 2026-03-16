/**
 * Rain Check God Terminal — Express Server (SDK Edition)
 *
 * Anthropic SDK agentic loop with SSE streaming and Notion logging.
 *
 * Endpoints:
 *   POST /api/run           — Start a new session, returns sessionId
 *   GET  /api/stream?sessionId=X — SSE event stream (replay + live)
 *   POST /api/approve       — Approve a pending tool execution
 *   GET  /health            — Server health check
 *
 * Deploy: /opt/rc/vps/god-terminal/ on VPS
 * Port: 3848
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Anthropic = require("@anthropic-ai/sdk");

const { toolDefinitions, executeTool, requiresApproval } = require("./tools");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 3848;
const AGENT_SECRET = process.env.AGENT_SERVER_SECRET;
const MAX_CONCURRENT = 5;
const MAX_TOOL_ROUNDS = 25;
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Dynamic date for system prompt
function getSystemPrompt() {
  const today = new Date().toISOString().split("T")[0];
  return `You are Riley — the Rain Check Weather Operations AI. An elite weather intelligence system built for contractors.

You help roofing, painting, landscaping, and concrete contractors manage weather-impacted schedules. You are concise, professional, and action-oriented.

CRITICAL RULES:
- NEVER ask for clarification. Make reasonable assumptions and execute immediately.
- Default location: Boston, MA (zip: 02101) unless specified otherwise.
- Today's date: ${today}
- After EVERY operation, call log_to_notion to record what you did.
- Be direct and results-oriented. Contractors don't have time for back-and-forth.

AVAILABLE TOOLS:
- weather_check: Get real-time weather forecast for any zip code. Returns hourly data with temp, wind, precipitation, humidity.
- send_email: Send professional HTML emails via SendGrid. Use clean Rain Check branding with dark header, weather data, job impact, and recommendations.
- send_sms: Send SMS notifications via Twilio. Keep under 320 chars. Be direct and actionable.
- check_jobs: Query today's scheduled jobs from Convex. Returns job details with client info, crew lead, trade type, weather status (GREEN/YELLOW/RED).
- reschedule_job: Reschedule a weather-impacted job (requires user approval). Always provide the reason.
- log_to_notion: Log your operations to the Rain Check Notion page. Call this after every action you take.
- web_search: Search the web for weather news, storm alerts, contractor safety bulletins, or any relevant information.
- get_trade_safety: Look up OSHA and industry safety guidelines for a specific trade and weather condition. Use this to provide authoritative safety recommendations.
- calculate_revenue_impact: Calculate the financial impact of weather delays — revenue at risk, crew idle costs, total exposure, and recommendations.

KEY CONTACTS:
- Tommy Brochu: tommy.brochu@alu-rex.com (Operations Lead)
- Marie-Andree Vezina: marie-andree.vezina@alu-rex.com (Project Manager)
- Kevin Brochu: kevin.brochu@alu-rex.com (Field Supervisor)
- Jeff: jeff@alu-rex.com (Crew Lead)

TRADE KNOWLEDGE:
- Roofing: Cannot work in winds >25mph, rain >30% probability, or temps <35°F. Shingle adhesion fails in cold.
- Exterior Painting: Cannot work in rain >20%, humidity >85%, or temps <50°F. Paint won't cure properly.
- Concrete: Cannot pour in rain >40%, temps <40°F (won't set), or >95°F (cracks). Wind >20mph dries surface too fast.
- Landscaping: Can work in light rain. Stop for lightning, heavy rain >60%, or winds >35mph.
- Pressure Washing: Can work in most conditions. Stop for lightning or freezing temps.

EMAIL STYLE:
When sending emails, use premium HTML with:
- Dark header (#1a1a2e) with white text and Rain Check branding
- Weather summary section with key metrics (temp, wind, precip, humidity)
- Job impact assessment with GREEN/YELLOW/RED status indicators
- Clear action items and recommendations
- Professional footer with contact info
- Mobile-responsive design

BUSINESS: Apex Roofing & Exteriors
LOCATIONS: Queen Creek, AZ (85142) / Boston, MA (02101, demo primary)

Remember: Execute first, log to Notion, then report back. No clarification questions.`;
}

// ---------------------------------------------------------------------------
// Anthropic Client
// ---------------------------------------------------------------------------

const anthropic = new Anthropic();

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
 *   messages: Array<{role, content}>,
 *   pendingApproval: { toolUseId, toolName, input, resolve } | null,
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
    version: "3.0.0-sdk-notion",
  });
});

// All other routes require auth
app.use("/api", requireAuth);

// ---------------------------------------------------------------------------
// POST /api/run — Start a new agentic session
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
    messages: [{ role: "user", content: message }],
    pendingApproval: null,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  sessions.set(sessionId, session);

  // Return sessionId immediately — client connects to SSE next
  res.json({ sessionId, state: "running" });

  // Run the agentic loop in background
  runAgentLoop(session).catch((err) => {
    console.error(`[${sessionId}] Agent loop error:`, err.message);
    session.state = "error";
    emitEvent(session, "error", { message: err.message });
    emitEvent(session, "done", {});
  });
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
// POST /api/approve — Approve or deny a pending tool execution
// ---------------------------------------------------------------------------

app.post("/api/approve", (req, res) => {
  const { sessionId, approved } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (!session.pendingApproval) {
    return res.status(400).json({ error: "No pending approval for this session" });
  }

  const isApproved = approved !== false; // default true
  session.pendingApproval.resolve(isApproved);
  session.pendingApproval = null;
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
// Agentic Loop
// ---------------------------------------------------------------------------

async function runAgentLoop(session) {
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    // Call Anthropic API with streaming
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8096,
      system: getSystemPrompt(),
      tools: toolDefinitions,
      messages: session.messages,
    });

    // Stream text chunks to SSE as they arrive
    stream.on("text", (text) => {
      emitEvent(session, "text", { text });
    });

    // Wait for the full message
    const response = await stream.finalMessage();

    // Build the assistant content blocks from the response
    const assistantContent = response.content;

    // Collect tool_use blocks
    const toolUseBlocks = [];
    for (const block of assistantContent) {
      if (block.type === "tool_use") {
        toolUseBlocks.push(block);
      }
    }

    // Append assistant message to conversation
    session.messages.push({ role: "assistant", content: assistantContent });

    // If stop_reason is "end_turn" or no tool calls, we're done
    if (response.stop_reason === "end_turn" || toolUseBlocks.length === 0) {
      session.state = "completed";
      emitEvent(session, "done", { state: "completed" });
      return;
    }

    // Process tool calls
    const toolResults = [];

    for (const toolBlock of toolUseBlocks) {
      const { id: toolUseId, name: toolName, input } = toolBlock;

      emitEvent(session, "tool_use", {
        toolUseId,
        toolName,
        input,
        requiresApproval: requiresApproval(toolName),
      });

      // Check if this tool requires approval
      if (requiresApproval(toolName)) {
        session.state = "waiting_approval";

        emitEvent(session, "approval_required", {
          toolUseId,
          toolName,
          input,
          message: `Approve "${toolName}"? ${JSON.stringify(input)}`,
        });

        // Wait for user approval
        const approved = await waitForApproval(session, toolUseId, toolName, input);

        if (!approved) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUseId,
            content: JSON.stringify({
              error: "User denied this action",
              message: "The user chose not to approve this tool execution.",
            }),
          });
          emitEvent(session, "tool_result", {
            toolUseId,
            toolName,
            result: { denied: true },
          });
          continue;
        }
      }

      // Execute the tool
      try {
        const result = await executeTool(toolName, input);

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUseId,
          content: JSON.stringify(result),
        });

        emitEvent(session, "tool_result", {
          toolUseId,
          toolName,
          result,
        });
      } catch (err) {
        const errorResult = { error: err.message };

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUseId,
          content: JSON.stringify(errorResult),
          is_error: true,
        });

        emitEvent(session, "tool_result", {
          toolUseId,
          toolName,
          result: errorResult,
          isError: true,
        });
      }
    }

    // Append tool results as a user message and continue the loop
    session.messages.push({ role: "user", content: toolResults });
  }

  // If we hit max rounds
  session.state = "completed";
  emitEvent(session, "text", {
    text: "\n\n[Reached maximum tool rounds — stopping.]",
  });
  emitEvent(session, "done", { state: "completed" });
}

// ---------------------------------------------------------------------------
// Approval Wait (Promise-based)
// ---------------------------------------------------------------------------

function waitForApproval(session, toolUseId, toolName, input) {
  return new Promise((resolve) => {
    session.pendingApproval = { toolUseId, toolName, input, resolve };

    // Auto-deny after 5 minutes
    setTimeout(() => {
      if (session.pendingApproval?.toolUseId === toolUseId) {
        session.pendingApproval = null;
        emitEvent(session, "approval_timeout", { toolUseId, toolName });
        resolve(false);
      }
    }, 5 * 60 * 1000);
  });
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
      // Close any lingering SSE connections
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
      session.state = "error";
      emitEvent(session, "error", { message: "Session timed out" });
      emitEvent(session, "done", { state: "error" });

      // Reject any pending approval
      if (session.pendingApproval) {
        session.pendingApproval.resolve(false);
        session.pendingApproval = null;
      }
    }
  }
}, 60000);

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Rain Check God Terminal v3.0.0 (SDK + Notion)`);
  console.log(`Listening on http://0.0.0.0:${PORT}`);
  console.log(`Max concurrent sessions: ${MAX_CONCURRENT}`);
  console.log(`Session TTL: ${SESSION_TTL_MS / 1000}s`);
  console.log(`Max tool rounds: ${MAX_TOOL_ROUNDS}`);
  console.log(`Anthropic API key: ${process.env.ANTHROPIC_API_KEY ? "configured" : "MISSING"}`);
  console.log(`Notion API token: ${process.env.NOTION_API_TOKEN ? "configured" : "MISSING"}`);
});
