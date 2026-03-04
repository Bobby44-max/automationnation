import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const AGENT_SERVER_URL = "https://agent.rainchek.org";
const AGENT_SERVER_SECRET = process.env.AGENT_SERVER_SECRET || "";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

/**
 * POST /api/agent — Start a new agent session
 * Body: { command: string, businessId: string }
 * Verifies plan tier server-side via Convex, then forwards to VPS.
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
            error: "Agent Terminal requires All Clear ($129/mo) or Storm Command ($199/mo) plan",
            upgrade: true,
          },
          { status: 403 }
        );
      }
    }

    // Forward to VPS agent server
    const vpsResponse = await fetch(`${AGENT_SERVER_URL}/START`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-secret": AGENT_SERVER_SECRET,
      },
      body: JSON.stringify({
        command: command.trim(),
        businessId,
      }),
    });

    if (!vpsResponse.ok) {
      const err = await vpsResponse.text();
      return NextResponse.json(
        { error: err || "Agent server error" },
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
 * GET /api/agent — Long-poll for session output
 * Query: ?id=<sessionId>&since=<offset>
 * Polls VPS for up to 30s, returns new lines + state.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const since = searchParams.get("since") || "0";

  if (!id) {
    return NextResponse.json(
      { error: "Session ID is required" },
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
      `${AGENT_SERVER_URL}/POLL?id=${encodeURIComponent(id)}&since=${encodeURIComponent(since)}`,
      {
        method: "GET",
        headers: {
          "x-agent-secret": AGENT_SERVER_SECRET,
        },
        signal: AbortSignal.timeout(35000), // 35s timeout (30s long-poll + 5s buffer)
      }
    );

    if (!vpsResponse.ok) {
      const err = await vpsResponse.text();
      return NextResponse.json(
        { error: err || "Poll failed" },
        { status: vpsResponse.status }
      );
    }

    const data = await vpsResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    // Timeout is expected for long-poll — return empty
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return NextResponse.json({ lines: [], state: "running", offset: parseInt(since) });
    }
    console.error("Agent GET error:", error);
    return NextResponse.json(
      { error: "Failed to poll agent" },
      { status: 500 }
    );
  }
}
