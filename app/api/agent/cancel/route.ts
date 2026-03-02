import { NextRequest, NextResponse } from "next/server";

const AGENT_SERVER_URL =
  process.env.AGENT_SERVER_URL || "http://127.0.0.1:3847";

/**
 * POST /api/agent/cancel
 * Terminates a running agent session via SIGKILL.
 */
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing session id" },
        { status: 400 }
      );
    }

    const res = await fetch(`${AGENT_SERVER_URL}/CANCEL`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to cancel session" },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Cancel request failed" },
      { status: 500 }
    );
  }
}
