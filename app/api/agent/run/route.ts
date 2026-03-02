import { NextRequest, NextResponse } from "next/server";
import type {
  StartResponse,
  SessionStatus,
  SessionPhase,
  LogEntry,
} from "@/lib/terminal/types";

const AGENT_SERVER_URL =
  process.env.AGENT_SERVER_URL || "http://127.0.0.1:3847";

/**
 * POST /api/agent/run
 * Initiates a new agent session by forwarding the command to the Agent Server.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const command = body?.command;

    if (!command || typeof command !== "string" || command.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or empty command" },
        { status: 400 }
      );
    }

    // Sanitize: reject commands that try to access secrets
    const blocked = [".env", "secrets", "credentials", "ANTHROPIC_BASE_URL"];
    const lower = command.toLowerCase();
    for (const term of blocked) {
      if (lower.includes(term.toLowerCase())) {
        return NextResponse.json(
          { error: `Blocked: command references "${term}"` },
          { status: 403 }
        );
      }
    }

    const id = crypto.randomUUID();

    const agentRes = await fetch(`${AGENT_SERVER_URL}/START`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, command: command.trim() }),
    });

    if (!agentRes.ok) {
      return NextResponse.json(
        { error: "Agent server unavailable" },
        { status: 502 }
      );
    }

    const response: StartResponse = { id, status: "running" };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to start agent session" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/run?id={sessionId}
 * Server-Sent Events stream that polls the Agent Server every 1.5s
 * and relays output lines to the client.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let active = true;

      const poll = async () => {
        while (active) {
          try {
            const res = await fetch(
              `${AGENT_SERVER_URL}/POLL?id=${encodeURIComponent(id)}`
            );

            if (!res.ok) {
              const errEntry: LogEntry = {
                timestamp: Date.now(),
                output: `[system] Agent server returned ${res.status}`,
                type: "system",
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(errEntry)}\n\n`)
              );
              active = false;
              controller.close();
              return;
            }

            const data = (await res.json()) as {
              line: string | null;
              status: SessionStatus;
              phase: SessionPhase;
            };

            if (data.line) {
              const entry: LogEntry = {
                timestamp: Date.now(),
                output: data.line,
                type:
                  data.status === "awaiting_approval"
                    ? "approval_request"
                    : "stdout",
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(entry)}\n\n`)
              );
            }

            if (
              data.status === "completed" ||
              data.status === "error" ||
              data.status === "terminated"
            ) {
              const doneEntry: LogEntry = {
                timestamp: Date.now(),
                output: `[system] Session ${data.status}`,
                type: "system",
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(doneEntry)}\n\n`)
              );
              active = false;
              controller.close();
              return;
            }
          } catch {
            const errEntry: LogEntry = {
              timestamp: Date.now(),
              output: "[system] Connection to agent server lost",
              type: "system",
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(errEntry)}\n\n`)
            );
            active = false;
            controller.close();
            return;
          }

          // Poll every 1.5 seconds
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      };

      poll();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
