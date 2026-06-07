import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import {
  getClerkWebhookSigningSecret,
} from "@/lib/clerk/invitations";
import { handleClerkWebhookEvent } from "@/lib/clerk/webhook-handlers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const signingSecret = getClerkWebhookSigningSecret();

  if (!signingSecret) {
    return NextResponse.json(
      { error: "Clerk webhook not configured" },
      { status: 503 }
    );
  }

  let event;
  try {
    event = await verifyWebhook(request, { signingSecret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await handleClerkWebhookEvent(event);
  } catch (err) {
    console.error("Clerk webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
