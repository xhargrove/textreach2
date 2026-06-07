import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contact: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    inboxMessage: { create: vi.fn() },
    optOut: { upsert: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock("@/lib/twilio/workspace-lookup", () => ({
  getWorkspaceByTwilioToNumber: vi.fn(),
}));

vi.mock("@/lib/twilio/keyword-handler", () => ({
  processKeywordOptIn: vi.fn(),
}));

vi.mock("@/lib/twilio/service", () => ({
  normalizePhoneNumber: vi.fn((raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return null;
  }),
  sendSms: vi.fn(),
}));

vi.mock("@/lib/consent/record-event", () => ({
  recordConsentEvent: vi.fn(),
}));

vi.mock("@/lib/queries/compliance-settings", () => ({
  getComplianceSettings: vi.fn(),
}));

vi.mock("@/lib/queries/message-replies", () => ({
  findRelatedMessageIdForInbound: vi.fn().mockResolvedValue(null),
}));

import { prisma } from "@/lib/prisma";
import { getWorkspaceByTwilioToNumber } from "@/lib/twilio/workspace-lookup";
import { processKeywordOptIn } from "@/lib/twilio/keyword-handler";
import { sendSms } from "@/lib/twilio/service";
import { recordConsentEvent } from "@/lib/consent/record-event";
import { handleInboundSms } from "@/lib/twilio/inbound-handler";

describe("handleInboundSms routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(processKeywordOptIn).mockResolvedValue(false);
    vi.mocked(prisma.contact.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.contact.create).mockImplementation(async ({ data }) => ({
      id: "contact_1",
      ...data,
    }) as never);
    vi.mocked(prisma.inboxMessage.create).mockResolvedValue({} as never);
    vi.mocked(prisma.optOut.upsert).mockResolvedValue({} as never);
  });

  it("routes inbound to workspace A when To matches workspace A number", async () => {
    vi.mocked(getWorkspaceByTwilioToNumber).mockResolvedValue({
      id: "ws_a",
    } as never);

    const result = await handleInboundSms({
      From: "+15551111111",
      To: "+14045551111",
      Body: "Hello",
    });

    expect(result.ok).toBe(true);
    expect(getWorkspaceByTwilioToNumber).toHaveBeenCalledWith("+14045551111");
    expect(prisma.inboxMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ workspaceId: "ws_a" }),
      })
    );
  });

  it("routes inbound to workspace B when To matches workspace B number", async () => {
    vi.mocked(getWorkspaceByTwilioToNumber).mockResolvedValue({
      id: "ws_b",
    } as never);

    await handleInboundSms({
      From: "+15552222222",
      To: "+14045552222",
      Body: "Hi there",
    });

    expect(prisma.inboxMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ workspaceId: "ws_b" }),
      })
    );
  });

  it("does not create a contact when To number is unknown", async () => {
    vi.mocked(getWorkspaceByTwilioToNumber).mockResolvedValue(null);

    const result = await handleInboundSms({
      From: "+15553333333",
      To: "+19998887777",
      Body: "Hello",
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("No workspace for Twilio number");
    expect(prisma.contact.create).not.toHaveBeenCalled();
    expect(prisma.inboxMessage.create).not.toHaveBeenCalled();
  });
});

describe("handleInboundSms consent behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWorkspaceByTwilioToNumber).mockResolvedValue({
      id: "ws_1",
    } as never);
    vi.mocked(processKeywordOptIn).mockResolvedValue(false);
    vi.mocked(prisma.contact.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.contact.create).mockImplementation(async ({ data }) => ({
      id: "contact_1",
      ...data,
    }) as never);
    vi.mocked(prisma.inboxMessage.create).mockResolvedValue({} as never);
    vi.mocked(prisma.optOut.upsert).mockResolvedValue({} as never);
    vi.mocked(sendSms).mockResolvedValue(undefined as never);
  });

  it("STOP from unknown number opts out and does not subscribe", async () => {
    await handleInboundSms({
      From: "+15554444444",
      To: "+14045551111",
      Body: "STOP",
    });

    expect(prisma.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          consentStatus: "unsubscribed",
          consentTimestamp: null,
          status: "opted_out",
        }),
      })
    );
    expect(prisma.optOut.upsert).toHaveBeenCalled();
    expect(recordConsentEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "stop" })
    );
  });

  it("plain inbound creates unknown-consent contact without subscribing", async () => {
    await handleInboundSms({
      From: "+15555555555",
      To: "+14045551111",
      Body: "Who is this?",
    });

    expect(prisma.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          consentStatus: "unknown",
          consentTimestamp: null,
          consentSource: null,
          status: "active",
        }),
      })
    );
    expect(prisma.inboxMessage.create).toHaveBeenCalled();
    expect(recordConsentEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "inbound_message" })
    );
  });
});
