import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = process.env.NEXT_PUBLIC_CONVEX_URL
  ? new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)
  : null;

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  const payload = await req.json();

  // TODO: In production, verify webhook signature with svix
  // Install svix: npm i svix
  // const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  // wh.verify(JSON.stringify(payload), {
  //   "svix-id": svix_id,
  //   "svix-timestamp": svix_timestamp,
  //   "svix-signature": svix_signature,
  // });

  if (!convex) {
    return NextResponse.json(
      { error: "Convex not configured" },
      { status: 500 }
    );
  }

  const { type, data } = payload;

  try {
    switch (type) {
      case "user.created": {
        const email =
          data.email_addresses?.[0]?.email_address ?? "";
        const name =
          [data.first_name, data.last_name].filter(Boolean).join(" ") ||
          email.split("@")[0];
        const phone = data.phone_numbers?.[0]?.phone_number;

        await convex.mutation(api.users.createBusinessAndOwner, {
          clerkId: data.id,
          email,
          name,
          phone,
        });
        break;
      }

      case "user.updated": {
        const email = data.email_addresses?.[0]?.email_address;
        const name =
          [data.first_name, data.last_name].filter(Boolean).join(" ") ||
          undefined;
        const phone = data.phone_numbers?.[0]?.phone_number;

        await convex.mutation(api.users.syncUserFromClerk, {
          clerkId: data.id,
          email,
          name,
          phone,
        });
        break;
      }

      case "user.deleted": {
        await convex.mutation(api.users.deactivateUser, {
          clerkId: data.id,
        });
        break;
      }
    }
  } catch (err) {
    console.error(`Clerk webhook error (${type}):`, err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
