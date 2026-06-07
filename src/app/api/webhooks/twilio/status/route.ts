import type { NextRequest } from "next/server";
import {
  parseTwilioFormBody,
  twilioEmptyResponse,
  validateTwilioWebhook,
} from "@/lib/twilio/webhook-verify";
import { handleDeliveryStatusCallback } from "@/lib/twilio/status-handler";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const params = await parseTwilioFormBody(request);

    if (!validateTwilioWebhook(request, params)) {
      return new Response("Invalid Twilio signature", { status: 403 });
    }

    await handleDeliveryStatusCallback({
      MessageSid: params.MessageSid ?? "",
      MessageStatus: params.MessageStatus ?? "",
      ErrorCode: params.ErrorCode,
      ErrorMessage: params.ErrorMessage,
    });

    return twilioEmptyResponse();
  } catch (error) {
    const { logWebhookError } = await import("@/lib/logging/send-failures");
    logWebhookError("twilio", error, { route: "status" });
    return new Response("Webhook handler error", { status: 500 });
  }
}
