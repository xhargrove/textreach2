import { describe, expect, it } from "vitest";
import {
  isStrictE164,
  validateMessagingServiceSid,
  validateTwilioAccountSid,
  validateTwilioPhone,
  validateTwilioSettingsInput,
} from "@/lib/validation/twilio-config";

describe("validateTwilioPhone", () => {
  it("accepts normalized US numbers as E.164", () => {
    const result = validateTwilioPhone("(404) 555-1234");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.phone).toBe("+14045551234");
      expect(isStrictE164(result.phone)).toBe(true);
    }
  });

  it("rejects empty phone numbers", () => {
    expect(validateTwilioPhone("").ok).toBe(false);
  });

  it("rejects invalid phone numbers", () => {
    expect(validateTwilioPhone("abc").ok).toBe(false);
  });
});

describe("validateMessagingServiceSid", () => {
  it("accepts valid MG SIDs", () => {
    const result = validateMessagingServiceSid("MG1234567890abcdef1234567890ab");
    expect(result.ok).toBe(true);
  });

  it("rejects SIDs that do not start with MG", () => {
    expect(validateMessagingServiceSid("AC123").ok).toBe(false);
  });

  it("allows empty optional SID", () => {
    const result = validateMessagingServiceSid("");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sid).toBeNull();
    }
  });
});

describe("validateTwilioAccountSid", () => {
  it("accepts valid AC SIDs", () => {
    const result = validateTwilioAccountSid("AC1234567890abcdef1234567890ab");
    expect(result.ok).toBe(true);
  });

  it("rejects SIDs that do not start with AC", () => {
    expect(validateTwilioAccountSid("MG123").ok).toBe(false);
  });
});

describe("validateTwilioSettingsInput", () => {
  it("validates all fields together", () => {
    const result = validateTwilioSettingsInput({
      twilioPhoneNumber: "+14045551234",
      twilioMessagingSid: "MG1234567890abcdef1234567890ab",
      twilioAccountSid: "AC1234567890abcdef1234567890ab",
    });

    expect(result.ok).toBe(true);
  });
});
