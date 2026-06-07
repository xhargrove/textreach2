import { normalizePhone } from "@/lib/validation/phone";

export type TwilioSeedConfig = {
  twilioPhoneNumber: string;
  twilioMessagingSid: string | null;
  twilioAccountSid: string | null;
  twilioStatus: "configured";
};

/**
 * Development-only: assign platform env Twilio credentials to the demo workspace.
 * Production workspaces must configure numbers explicitly in Settings.
 */
export function getDevTwilioSeedConfig(): TwilioSeedConfig | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const rawPhone = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!rawPhone) {
    return null;
  }

  const normalized = normalizePhone(rawPhone);
  if (!normalized.ok) {
    return null;
  }

  return {
    twilioPhoneNumber: normalized.phone,
    twilioMessagingSid: process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() || null,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID?.trim() || null,
    twilioStatus: "configured",
  };
}
