import twilio from "twilio";
import type { NextRequest } from "next/server";

export async function parseTwilioFormBody(
  request: NextRequest
): Promise<Record<string, string>> {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}

export function validateTwilioWebhook(
  request: NextRequest,
  params: Record<string, string>
): boolean {
  if (process.env.TWILIO_WEBHOOK_SKIP_VERIFY === "true") {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "TWILIO_WEBHOOK_SKIP_VERIFY is set in production — rejecting webhook"
      );
      return false;
    }
    return true;
  }

  const authToken =
    process.env.TWILIO_WEBHOOK_AUTH_TOKEN?.trim() ||
    process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return false;

  const url = getWebhookUrl(request);
  return twilio.validateRequest(authToken, signature, url, params);
}

function getWebhookUrl(request: NextRequest): string {
  const configured = process.env.TWILIO_WEBHOOK_BASE_URL;
  if (configured) {
    return `${configured.replace(/\/$/, "")}${request.nextUrl.pathname}`;
  }
  return request.url;
}

export function twilioEmptyResponse(): Response {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
