import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const AGENT_SERVER_URL = "https://agent.rainchek.org";
const AGENT_SERVER_SECRET = process.env.AGENT_SERVER_SECRET || "";

/**
 * POST /api/agent/approve — Approve a pending tool use
 * Body: { id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

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

    const vpsResponse = await fetch(
      `${AGENT_SERVER_URL}/APPROVE?id=${encodeURIComponent(id)}`,
      {
        method: "POST",
        headers: {
          "x-agent-secret": AGENT_SERVER_SECRET,
        },
      }
    );

    if (!vpsResponse.ok) {
      const err = await vpsResponse.text();
      return NextResponse.json(
        { error: err || "Approve failed" },
        { status: vpsResponse.status }
      );
    }

    const data = await vpsResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Agent approve error:", error);
    return NextResponse.json(
      { error: "Failed to approve" },
      { status: 500 }
    );
  }
}
