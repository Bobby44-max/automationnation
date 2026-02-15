import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { businessId, date } = await req.json();

  if (!businessId) {
    return NextResponse.json(
      { error: "businessId is required" },
      { status: 400 }
    );
  }

  const n8nUrl = process.env.N8N_WEBHOOK_BASE_URL;
  if (!n8nUrl) {
    return NextResponse.json(
      { error: "N8N_WEBHOOK_BASE_URL not configured" },
      { status: 500 }
    );
  }

  const response = await fetch(`${n8nUrl}/webhook/weather-check-now`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessId,
      date: date || new Date().toISOString().split("T")[0],
    }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}
