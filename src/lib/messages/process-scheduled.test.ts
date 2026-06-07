import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/messages/send-message", () => ({
  createMessageRecipients: vi.fn(),
  deliverMessageViaTwilio: vi.fn(),
}));

vi.mock("@/lib/billing/limits", () => ({
  checkMessageLimit: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/billing/subscription", () => ({
  checkBillingAllowsSend: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/twilio/service", () => ({
  isWorkspaceTwilioReady: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/queries/compliance-settings", () => ({
  getComplianceSettings: vi.fn(),
}));

vi.mock("@/lib/logging/send-failures", () => ({
  logSendFailure: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    message: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    messageRecipient: {
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  createMessageRecipients,
  deliverMessageViaTwilio,
} from "@/lib/messages/send-message";
import { getComplianceSettings } from "@/lib/queries/compliance-settings";
import { checkBillingAllowsSend } from "@/lib/billing/subscription";
import { logSendFailure } from "@/lib/logging/send-failures";
import * as quietHours from "@/lib/compliance/quiet-hours";
import {
  processAllDueScheduledMessages,
  processScheduledMessage,
} from "@/lib/messages/process-scheduled";

const queuedRecipient = {
  messageId: "msg_1",
  contactId: "contact_1",
  phone: "+15551234567",
  status: "queued" as const,
};

function mockScheduledPreview(
  id: string,
  scheduledAt = new Date("2026-06-06T16:00:00.000Z")
) {
  return {
    id,
    workspaceId: "ws_1",
    status: "scheduled" as const,
    scheduledAt,
  };
}

function mockClaimedMessage(id: string, body: string) {
  return {
    id,
    workspaceId: "ws_1",
    listId: "list_1",
    body,
  };
}

describe("processScheduledMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getComplianceSettings).mockResolvedValue({
      quietHoursEnabled: false,
      quietHoursTimezone: "",
    } as never);
    vi.mocked(createMessageRecipients).mockResolvedValue([queuedRecipient]);
    vi.mocked(prisma.message.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.messageRecipient.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(deliverMessageViaTwilio).mockResolvedValue({
      sentCount: 1,
      failedCount: 0,
      skippedCount: 0,
    });
    vi.mocked(checkBillingAllowsSend).mockResolvedValue({ ok: true });
  });

  it("logs and fails when billing blocks send", async () => {
    vi.mocked(prisma.message.findUnique)
      .mockResolvedValueOnce(mockScheduledPreview("msg_1"))
      .mockResolvedValueOnce(mockClaimedMessage("msg_1", "Hello"));
    vi.mocked(checkBillingAllowsSend).mockResolvedValue({
      ok: false,
      error: "Your subscription is canceled. Reactivate billing before sending messages.",
    });

    const outcome = await processScheduledMessage("msg_1");

    expect(outcome).toBe("failed");
    expect(logSendFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "scheduled_send",
        workspaceId: "ws_1",
        messageId: "msg_1",
      })
    );
  });

  it("defers scheduled sends during quiet hours", async () => {
    const withinSpy = vi.spyOn(quietHours, "isWithinQuietHours").mockReturnValue(true);
    const nextSpy = vi.spyOn(quietHours, "getNextAllowedSendTime").mockReturnValue(
      new Date("2026-01-15T13:00:00.000Z")
    );
    vi.mocked(prisma.message.findUnique).mockResolvedValueOnce(
      mockScheduledPreview("msg_1", new Date("2026-01-15T03:00:00.000Z"))
    );

    const outcome = await processScheduledMessage("msg_1");

    expect(outcome).toBe("deferred");
    expect(prisma.message.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "msg_1", status: "scheduled" }),
        data: expect.objectContaining({ scheduledAt: expect.any(Date) }),
      })
    );
    expect(deliverMessageViaTwilio).not.toHaveBeenCalled();

    withinSpy.mockRestore();
    nextSpy.mockRestore();
  });
});

describe("processAllDueScheduledMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getComplianceSettings).mockResolvedValue({
      quietHoursEnabled: false,
      quietHoursTimezone: "",
    } as never);
    vi.mocked(createMessageRecipients).mockResolvedValue([queuedRecipient]);
    vi.mocked(prisma.message.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "msg_1" }, { id: "msg_2" }]);
    vi.mocked(checkBillingAllowsSend).mockResolvedValue({ ok: true });
    vi.mocked(prisma.message.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.message.findUnique)
      .mockResolvedValueOnce(mockScheduledPreview("msg_1"))
      .mockResolvedValueOnce(mockClaimedMessage("msg_1", "One"))
      .mockResolvedValueOnce(mockScheduledPreview("msg_2"))
      .mockResolvedValueOnce(mockClaimedMessage("msg_2", "Two"));
    vi.mocked(prisma.messageRecipient.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(deliverMessageViaTwilio)
      .mockRejectedValueOnce(new Error("Twilio failed"))
      .mockResolvedValueOnce({
        sentCount: 1,
        failedCount: 0,
        skippedCount: 0,
      });
  });

  it("processes due jobs and counts sent/failed outcomes", async () => {
    const result = await processAllDueScheduledMessages();

    expect(result.processed).toBe(2);
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    expect(deliverMessageViaTwilio).toHaveBeenCalledTimes(2);
  });

  it("continues processing after one job fails", async () => {
    await processAllDueScheduledMessages();

    expect(deliverMessageViaTwilio).toHaveBeenNthCalledWith(1, "msg_1", "One");
    expect(deliverMessageViaTwilio).toHaveBeenNthCalledWith(2, "msg_2", "Two");
  });
});
