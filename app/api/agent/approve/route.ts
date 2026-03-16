import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const AGENT_SERVER_URL =
  process.env.AGENT_SERVER_URL || "http://72.60.170.65:3848";
const AGENT_SERVER_SECRET = process.env.AGENT_SERVER_SECRET || "";

/**
 * POST /api/agent/approve — Approve or deny a pending tool execution
 * Body: { sessionId: string, approved: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId, approved } = await request.json();

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

    const vpsResponse = await fetch(`${AGENT_SERVER_URL}/api/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AGENT_SERVER_SECRET}`,
      },
      body: JSON.stringify({
        sessionId,
        approved: approved !== false,
      }),
    });

    if (!vpsResponse.ok) {
      let errorMessage = "Approve failed";
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
    console.error("Agent approve error:", error);
    return NextResponse.json(
      { error: "Failed to send approval" },
      { status: 500 }
    );
  }
}
