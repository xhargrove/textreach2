import { describe, expect, it } from "vitest";
import {
  canReceiveMarketing,
  subscribedConsentUpdate,
  unsubscribedConsentUpdate,
  unknownInboundContactData,
} from "@/lib/consent/contact-consent";

describe("canReceiveMarketing", () => {
  it("allows subscribed contacts with consent timestamp", () => {
    expect(
      canReceiveMarketing({
        consentStatus: "subscribed",
        consentTimestamp: new Date(),
        status: "active",
      })
    ).toBe(true);
  });

  it("blocks unknown consent", () => {
    expect(
      canReceiveMarketing({
        consentStatus: "unknown",
        consentTimestamp: null,
        status: "active",
      })
    ).toBe(false);
  });

  it("blocks unsubscribed contacts", () => {
    expect(
      canReceiveMarketing({
        consentStatus: "unsubscribed",
        consentTimestamp: null,
        status: "opted_out",
      })
    ).toBe(false);
  });

  it("blocks subscribed without timestamp", () => {
    expect(
      canReceiveMarketing({
        consentStatus: "subscribed",
        consentTimestamp: null,
        status: "active",
      })
    ).toBe(false);
  });
});

describe("consent update helpers", () => {
  it("subscribedConsentUpdate sets source and clears opt-out", () => {
    const update = subscribedConsentUpdate({
      consentSource: "keyword:JOIN",
      consentPhoneNumber: "+14045551234",
    });

    expect(update.consentStatus).toBe("subscribed");
    expect(update.consentSource).toBe("keyword:JOIN");
    expect(update.consentPhoneNumber).toBe("+14045551234");
    expect(update.status).toBe("active");
    expect(update.optedOutAt).toBeNull();
  });

  it("unsubscribedConsentUpdate clears consent timestamp", () => {
    const update = unsubscribedConsentUpdate();
    expect(update.consentStatus).toBe("unsubscribed");
    expect(update.consentTimestamp).toBeNull();
    expect(update.status).toBe("opted_out");
    expect(update.optedOutAt).toBeInstanceOf(Date);
  });

  it("unknownInboundContactData never sets consent timestamp", () => {
    const data = unknownInboundContactData();
    expect(data.consentStatus).toBe("unknown");
    expect(data.consentTimestamp).toBeNull();
    expect(data.consentSource).toBeNull();
  });
});
