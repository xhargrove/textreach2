export type SendFailureSource =
  | "outbound_send"
  | "scheduled_send"
  | "inbox_reply"
  | "twilio_status"
  | "twilio_inbound";

export type SendFailurePayload = {
  source: SendFailureSource;
  workspaceId?: string;
  messageId?: string;
  recipientId?: string;
  contactId?: string;
  phone?: string;
  twilioSid?: string;
  errorCode?: string;
  errorMessage: string;
};

export function logSendFailure(payload: SendFailurePayload) {
  console.error(
    JSON.stringify({
      level: "error",
      type: "textreach_send_failure",
      timestamp: new Date().toISOString(),
      ...payload,
    })
  );
}

export function logWebhookError(
  provider: "twilio" | "stripe",
  error: unknown,
  context?: Record<string, string>
) {
  console.error(
    JSON.stringify({
      level: "error",
      type: "textreach_webhook_error",
      provider,
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    })
  );
}
