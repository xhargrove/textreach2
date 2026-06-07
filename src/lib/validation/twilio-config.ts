import { normalizePhone } from "@/lib/validation/phone";

export type TwilioSettingsInput = {
  twilioPhoneNumber: string;
  twilioMessagingSid: string;
  twilioAccountSid: string;
};

export function isStrictE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

export function validateTwilioPhone(
  raw: string
): { ok: true; phone: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Twilio phone number is required" };
  }

  const normalized = normalizePhone(trimmed);
  if (!normalized.ok) {
    return { ok: false, error: normalized.error };
  }

  if (!isStrictE164(normalized.phone)) {
    return {
      ok: false,
      error: "Phone number must be in E.164 format (e.g. +14045551234)",
    };
  }

  return { ok: true, phone: normalized.phone };
}

export function validateMessagingServiceSid(
  raw: string
): { ok: true; sid: string | null } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, sid: null };
  }

  if (!trimmed.startsWith("MG")) {
    return {
      ok: false,
      error: "Messaging Service SID must start with MG",
    };
  }

  return { ok: true, sid: trimmed };
}

export function validateTwilioAccountSid(
  raw: string
): { ok: true; sid: string | null } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, sid: null };
  }

  if (!trimmed.startsWith("AC")) {
    return {
      ok: false,
      error: "Account SID must start with AC",
    };
  }

  return { ok: true, sid: trimmed };
}

export function validateTwilioSettingsInput(
  input: TwilioSettingsInput
):
  | {
      ok: true;
      data: {
        twilioPhoneNumber: string;
        twilioMessagingSid: string | null;
        twilioAccountSid: string | null;
      };
    }
  | { ok: false; error: string } {
  const phoneResult = validateTwilioPhone(input.twilioPhoneNumber);
  if (!phoneResult.ok) {
    return phoneResult;
  }

  const messagingResult = validateMessagingServiceSid(input.twilioMessagingSid);
  if (!messagingResult.ok) {
    return messagingResult;
  }

  const accountResult = validateTwilioAccountSid(input.twilioAccountSid);
  if (!accountResult.ok) {
    return accountResult;
  }

  return {
    ok: true,
    data: {
      twilioPhoneNumber: phoneResult.phone,
      twilioMessagingSid: messagingResult.sid,
      twilioAccountSid: accountResult.sid,
    },
  };
}
