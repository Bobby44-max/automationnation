import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300; // SSE streams can be long-lived

const AGENT_SERVER_URL =
  process.env.AGENT_SERVER_URL || "http://72.60.170.65:3848";
const AGENT_SERVER_SECRET = process.env.AGENT_SERVER_SECRET || "";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

/**
 * POST /api/agent — Start a new agent session
 * Body: { command: string, businessId: string }
 * Verifies plan tier server-side via Convex, then forwards to God Server.
 * Returns: { sessionId: string, state: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { command, businessId } = await request.json();

    if (!command || typeof command !== "string" || !command.trim()) {
      return NextResponse.json(
        { error: "Command is required" },
        { status: 400 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    if (!AGENT_SERVER_SECRET) {
      return NextResponse.json(
        { error: "Agent server not configured" },
        { status: 503 }
      );
    }

    // Server-side tier verification via Convex HTTP API
    const tierCheck = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "weatherScheduling:getMyBusiness",
        args: {},
      }),
    });

    if (tierCheck.ok) {
      const business = await tierCheck.json();
      const planTier = business?.value?.planTier || "starter";

      if (planTier !== "pro" && planTier !== "business") {
        return NextResponse.json(
          {
            error:
              "Agent Terminal requires All Clear ($129/mo) or Storm Command ($199/mo) plan",
            upgrade: true,
          },
          { status: 403 }
        );
      }
    }

    // Forward to God Server — note: God Server expects "message" not "command"
    const vpsResponse = await fetch(`${AGENT_SERVER_URL}/api/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AGENT_SERVER_SECRET}`,
      },
      body: JSON.stringify({
        message: command.trim(),
        businessId,
      }),
    });

    if (!vpsResponse.ok) {
      let errorMessage = "Agent server error";
      try {
        const errData = await vpsResponse.json();
        errorMessage = errData.error || errorMessage;
      } catch {
        errorMessage = (await vpsResponse.text()) || errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: vpsResponse.status }
      );
    }

    const data = await vpsResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Agent POST error:", error);
    return NextResponse.json(
      { error: "Failed to start agent session" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent?sessionId=X — SSE stream proxy
 * Proxies the SSE event stream from God Server to the browser client.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  if (!AGENT_SERVER_SECRET) {
    return NextResponse.json(
      { error: "Agent server not configured" },
      { status: 503 }
    );
  }

  try {
    const vpsResponse = await fetch(
      `${AGENT_SERVER_URL}/api/stream?sessionId=${encodeURIComponent(sessionId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AGENT_SERVER_SECRET}`,
          Accept: "text/event-stream",
        },
      }
    );

    if (!vpsResponse.ok) {
      const err = await vpsResponse.text();
      return NextResponse.json(
        { error: err || "Stream failed" },
        { status: vpsResponse.status }
      );
    }

    // Pipe the SSE stream through to the client
    const body = vpsResponse.body;
    if (!body) {
      return NextResponse.json(
        { error: "No stream body from server" },
        { status: 502 }
      );
    }

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Agent SSE proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to agent stream" },
      { status: 500 }
    );
  }
}
