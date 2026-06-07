import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contact: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    optOut: { deleteMany: vi.fn() },
    listContact: { upsert: vi.fn() },
    keywordOptIn: { findUnique: vi.fn(), create: vi.fn() },
    keyword: { updateMany: vi.fn() },
  },
}));

vi.mock("@/lib/queries/keywords", () => ({
  findActiveKeywordMatch: vi.fn(),
}));

vi.mock("@/lib/twilio/service", () => ({
  sendSms: vi.fn(),
}));

vi.mock("@/lib/consent/record-event", () => ({
  recordConsentEvent: vi.fn(),
}));

vi.mock("@/lib/keywords/auto-reply", () => ({
  buildKeywordAutoReply: vi.fn((body: string) => body),
}));

import { prisma } from "@/lib/prisma";
import { findActiveKeywordMatch } from "@/lib/queries/keywords";
import { recordConsentEvent } from "@/lib/consent/record-event";
import { processKeywordOptIn } from "@/lib/twilio/keyword-handler";

describe("processKeywordOptIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findActiveKeywordMatch).mockResolvedValue({
      id: "kw_1",
      keyword: "JOIN",
      listId: "list_1",
      autoReply: "Welcome!",
    } as never);
    vi.mocked(prisma.contact.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.contact.create).mockImplementation(async ({ data }) => ({
      id: "contact_1",
      ...data,
    }) as never);
    vi.mocked(prisma.keywordOptIn.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.keywordOptIn.create).mockResolvedValue({} as never);
    vi.mocked(prisma.keyword.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.listContact.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.optOut.deleteMany).mockResolvedValue({ count: 0 });
  });

  it("creates subscribed contact with consent timestamp and keyword source", async () => {
    const handled = await processKeywordOptIn(
      "ws_1",
      "+15551234567",
      "JOIN",
      "+14045551111"
    );

    expect(handled).toBe(true);
    expect(prisma.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: "keyword",
          consentStatus: "subscribed",
          consentSource: "keyword:JOIN",
          consentPhoneNumber: "+14045551111",
          status: "active",
        }),
      })
    );

    const createData = vi.mocked(prisma.contact.create).mock.calls[0][0].data;
    expect(createData.consentTimestamp).toBeInstanceOf(Date);

    expect(recordConsentEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "keyword_opt_in",
        source: "keyword:JOIN",
      })
    );
  });
});
