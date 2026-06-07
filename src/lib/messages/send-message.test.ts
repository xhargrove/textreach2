import { describe, expect, it } from "vitest";
import { classifyContactForSend } from "@/lib/messages/send-message";

describe("classifyContactForSend", () => {
  it("queues subscribed contacts with valid phones", () => {
    const result = classifyContactForSend({
      status: "active",
      phone: "+15551234567",
      consentStatus: "subscribed",
      consentTimestamp: new Date(),
    });
    expect(result.status).toBe("queued");
  });

  it("skips contacts without marketing consent", () => {
    const result = classifyContactForSend({
      status: "active",
      phone: "+15551234567",
      consentStatus: "unknown",
      consentTimestamp: null,
    });
    expect(result.status).toBe("skipped");
    expect(result.errorMessage).toBe("Missing marketing consent");
  });

  it("skips opted-out contacts", () => {
    const result = classifyContactForSend({
      status: "opted_out",
      phone: "+15551234567",
      consentStatus: "unsubscribed",
    });
    expect(result.status).toBe("opted_out");
  });

  it("skips invalid contacts", () => {
    const result = classifyContactForSend({
      status: "invalid",
      phone: "+15551234567",
    });
    expect(result.status).toBe("skipped");
  });

  it("skips contacts with bad phone numbers", () => {
    const result = classifyContactForSend({
      status: "active",
      phone: "not-a-phone",
      consentStatus: "subscribed",
      consentTimestamp: new Date(),
    });
    expect(result.status).toBe("skipped");
  });
});
