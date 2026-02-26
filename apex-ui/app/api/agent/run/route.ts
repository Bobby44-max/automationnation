/**
 * Vercel API Route: /api/agent/run
 *
 * Handles authentication, initiates agent sessions on the VPS,
 * polls for output, and streams results back via Server-Sent Events (SSE).
 *
 * Flow:
 *   Browser → this route → Traefik (VPS:443) → agent-server.js (:3847)
 *   agent-server.js writes JSONL → this route polls every 1.5s → SSE to browser
 */

import { NextRequest } from "next/server";

const AGENT_WEBHOOK_URL =
  process.env.AGENT_WEBHOOK_URL || "https://n8n.srv1021380.hstgr.cloud/agent-webhook";
const AGENT_SHARED_SECRET = process.env.AGENT_SHARED_SECRET || "";

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_DURATION_MS = 5 * 60 * 1000; // 5 minute timeout

async function agentRequest(action: string, body: Record<string, unknown>) {
  const res = await fetch(AGENT_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AGENT_SHARED_SECRET
        ? { Authorization: `Bearer ${AGENT_SHARED_SECRET}` }
        : {}),
    },
    body: JSON.stringify({ action, ...body }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Agent server error (${res.status}): ${text}`);
  }

  return res.json();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST /api/agent/run
 *
 * Body: { prompt: string, action?: "start" | "approve" | "cancel", sessionId?: string }
 *
 * For "start": initiates a new session and streams output via SSE
 * For "approve": upgrades a session to write access and streams output
 * For "cancel": kills a running session
 */
export async function POST(req: NextRequest) {
  // TODO: Add Clerk auth check here for production
  // const { userId } = auth();
  // if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { prompt, action = "start", sessionId } = body;

  // Handle cancel — no streaming needed
  if (action === "cancel") {
    if (!sessionId) {
      return Response.json({ error: "sessionId required for cancel" }, { status: 400 });
    }
    const result = await agentRequest("cancel", { sessionId });
    return Response.json(result);
  }

  // Handle approve — no streaming needed, just upgrade the session
  if (action === "approve") {
    if (!sessionId) {
      return Response.json({ error: "sessionId required for approve" }, { status: 400 });
    }
    const result = await agentRequest("approve", { sessionId });
    return Response.json(result);
  }

  // Handle start — stream output via SSE
  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  // Start the session on the VPS
  const startResult = await agentRequest("start", { prompt });
  const sid = startResult.sessionId;

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial session info
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "session_start", sessionId: sid, phase: "investigate" })}\n\n`
        )
      );

      let afterLine = 0;
      const startTime = Date.now();

      // Poll loop
      while (Date.now() - startTime < MAX_POLL_DURATION_MS) {
        try {
          const poll = await agentRequest("poll", {
            sessionId: sid,
            afterLine,
          });

          // Send new lines to the client
          for (const line of poll.lines) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(line)}\n\n`)
            );
          }

          afterLine = poll.totalLines;

          // Check if session ended
          if (
            poll.status === "completed" ||
            poll.status === "failed" ||
            poll.status === "cancelled"
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "stream_end", status: poll.status, phase: poll.phase })}\n\n`
              )
            );
            break;
          }

          // If session is running and has proposed changes, signal approval needed
          const hasProposal = poll.lines.some(
            (l: { type: string; content?: string }) =>
              l.type === "output" &&
              typeof l.content === "string" &&
              (l.content.includes('"type":"tool_use"') ||
                l.content.includes("proposed changes"))
          );

          if (hasProposal && poll.phase === "investigate") {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "approval_needed", sessionId: sid })}\n\n`
              )
            );
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: err instanceof Error ? err.message : "Poll failed" })}\n\n`
            )
          );
        }

        await sleep(POLL_INTERVAL_MS);
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Session-Id": sid,
    },
  });
}
