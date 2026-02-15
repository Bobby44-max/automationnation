import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
  }

  // TODO: Verify Stripe webhook signature
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

  // TODO: Handle subscription events
  // switch (event.type) {
  //   case "checkout.session.completed":
  //   case "customer.subscription.updated":
  //   case "customer.subscription.deleted":
  // }

  return NextResponse.json({ received: true });
}
