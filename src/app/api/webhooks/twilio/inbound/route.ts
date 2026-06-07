import type { NextRequest } from "next/server";
import {
  parseTwilioFormBody,
  twilioEmptyResponse,
  validateTwilioWebhook,
} from "@/lib/twilio/webhook-verify";
import { handleInboundSms } from "@/lib/twilio/inbound-handler";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const params = await parseTwilioFormBody(request);

    if (!validateTwilioWebhook(request, params)) {
      return new Response("Invalid Twilio signature", { status: 403 });
    }

    await handleInboundSms({
      From: params.From ?? "",
      To: params.To ?? "",
      Body: params.Body ?? "",
      MessageSid: params.MessageSid,
    });

    return twilioEmptyResponse();
  } catch (error) {
    const { logWebhookError } = await import("@/lib/logging/send-failures");
    logWebhookError("twilio", error, { route: "inbound" });
    return new Response("Webhook handler error", { status: 500 });
  }
}
