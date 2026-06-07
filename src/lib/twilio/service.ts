import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/validation/phone";
import { getSmsStats } from "@/lib/messages/sms-utils";
import {
  isPlatformSenderFallbackEnabled,
  isWorkspaceTwilioSenderConfigured,
  resolveSendFromOptionsForWorkspace,
  type WorkspaceTwilioSender,
} from "@/lib/twilio/workspace-sender";

export type SendSmsResult =
  | { ok: true; sid: string }
  | { ok: false; error: string };

export type SendSmsOptions = {
  workspaceId: string;
};

export function isTwilioConfigured(): boolean {
  return (
    !!process.env.TWILIO_ACCOUNT_SID?.trim() &&
    !!process.env.TWILIO_AUTH_TOKEN?.trim()
  );
}

export function normalizePhoneNumber(phone: string): string | null {
  const result = normalizePhone(phone);
  return result.ok ? result.phone : null;
}

export function validatePhoneNumber(phone: string): boolean {
  if (!phone?.trim()) return false;
  return normalizePhone(phone).ok;
}

export function calculateSmsSegments(body: string): number {
  return getSmsStats(body).segments;
}

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN."
    );
  }

  return twilio(accountSid, authToken);
}

export async function getWorkspaceTwilioSender(
  workspaceId: string
): Promise<WorkspaceTwilioSender> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      twilioPhoneNumber: true,
      twilioMessagingSid: true,
    },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return workspace;
}

export async function isWorkspaceTwilioReady(workspaceId: string): Promise<boolean> {
  if (!isTwilioConfigured()) return false;
  const sender = await getWorkspaceTwilioSender(workspaceId);
  if (isWorkspaceTwilioSenderConfigured(sender)) return true;
  return isPlatformSenderFallbackEnabled();
}

export function getTwilioSenderNumber(): string | null {
  return (
    process.env.TWILIO_PHONE_NUMBER ??
    process.env.TWILIO_MESSAGING_SERVICE_SID ??
    null
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientTwilioError(message: string): boolean {
  return /429|502|503|504|timeout|ECONNRESET|temporarily unavailable|rate limit/i.test(
    message
  );
}

export async function sendSms(
  to: string,
  body: string,
  options: SendSmsOptions
): Promise<SendSmsResult> {
  const normalizedTo = normalizePhoneNumber(to);
  if (!normalizedTo) {
    return { ok: false, error: "Invalid phone number" };
  }

  const sender = await getWorkspaceTwilioSender(options.workspaceId);
  let sendFromOptions;
  try {
    sendFromOptions = resolveSendFromOptionsForWorkspace(sender);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Workspace Twilio sender is not configured";
    return { ok: false, error: message };
  }

  const maxAttempts = 3;
  let lastError = "Failed to send SMS via Twilio";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = getTwilioClient();
      const statusCallback = getStatusCallbackUrl();
      const message = await client.messages.create({
        to: normalizedTo,
        body,
        ...sendFromOptions,
        ...(statusCallback ? { statusCallback } : {}),
      });

      return { ok: true, sid: message.sid };
    } catch (err) {
      lastError =
        err instanceof Error ? err.message : "Failed to send SMS via Twilio";

      if (!isTransientTwilioError(lastError) || attempt === maxAttempts) {
        return { ok: false, error: lastError };
      }

      await sleep(attempt * 500);
    }
  }

  return { ok: false, error: lastError };
}

function getStatusCallbackUrl(): string | undefined {
  const base =
    process.env.TWILIO_WEBHOOK_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/api/webhooks/twilio/status`;
}
