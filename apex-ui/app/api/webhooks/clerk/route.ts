import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const headerPayload = headers();
  const svix_id = (await headerPayload).get("svix-id");
  const svix_timestamp = (await headerPayload).get("svix-timestamp");
  const svix_signature = (await headerPayload).get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  // TODO: Verify webhook signature with Clerk webhook secret
  // const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  // const evt = wh.verify(body, { "svix-id": svix_id, "svix-timestamp": svix_timestamp, "svix-signature": svix_signature });

  const { type } = payload;

  switch (type) {
    case "user.created":
      // TODO: Create business record in Convex
      break;
    case "user.updated":
      // TODO: Sync user updates to Convex
      break;
    case "user.deleted":
      // TODO: Handle user deletion
      break;
  }

  return NextResponse.json({ received: true });
}
