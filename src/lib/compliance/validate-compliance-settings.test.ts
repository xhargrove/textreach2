import { describe, expect, it } from "vitest";
import {
  hasOptOutLanguage,
  isValidHttpUrl,
  isValidTimezone,
  validateComplianceSettings,
} from "@/lib/compliance/validate-compliance-settings";

const validBase = {
  businessName: "Acme Co",
  supportEmail: "support@acme.com",
  supportPhone: "",
  privacyPolicyUrl: "https://acme.com/privacy",
  termsUrl: "https://acme.com/terms",
  messageFrequencyDescription: "",
  defaultComplianceFooter: "Reply STOP to unsubscribe.",
  defaultHelpResponse: "Reply HELP for help.",
  physicalAddress: "123 Main St, Atlanta, GA 30303",
  marketingSmsEnabled: true,
  quietHoursEnabled: false,
  quietHoursTimezone: "",
};

describe("validateComplianceSettings", () => {
  it("accepts valid marketing SMS settings", () => {
    expect(validateComplianceSettings(validBase)).toBeNull();
  });

  it("requires business name", () => {
    expect(
      validateComplianceSettings({ ...validBase, businessName: "A" })
    ).toMatch(/business name/i);
  });

  it("requires valid support email", () => {
    expect(
      validateComplianceSettings({ ...validBase, supportEmail: "not-an-email" })
    ).toMatch(/support email/i);
  });

  it("requires physical address when marketing SMS is enabled", () => {
    expect(
      validateComplianceSettings({ ...validBase, physicalAddress: "short" })
    ).toMatch(/physical mailing address/i);
  });

  it("requires opt-out language in footer", () => {
    expect(
      validateComplianceSettings({
        ...validBase,
        defaultComplianceFooter: "Thanks for subscribing!",
      })
    ).toMatch(/opt-out/i);
  });

  it("validates privacy and terms URLs", () => {
    expect(
      validateComplianceSettings({
        ...validBase,
        privacyPolicyUrl: "not-a-url",
      })
    ).toMatch(/privacy policy url/i);
  });

  it("validates quiet hours timezone when enabled", () => {
    expect(
      validateComplianceSettings({
        ...validBase,
        quietHoursEnabled: true,
        quietHoursTimezone: "Invalid/Zone",
      })
    ).toMatch(/timezone/i);
  });
});

describe("compliance helpers", () => {
  it("detects opt-out language", () => {
    expect(hasOptOutLanguage("Reply STOP to unsubscribe")).toBe(true);
    expect(hasOptOutLanguage("Hello world")).toBe(false);
  });

  it("validates http(s) URLs", () => {
    expect(isValidHttpUrl("https://example.com/privacy")).toBe(true);
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
  });

  it("validates IANA timezones", () => {
    expect(isValidTimezone("America/New_York")).toBe(true);
    expect(isValidTimezone("Not/A_Real_Zone")).toBe(false);
  });
});
