import type { MessageStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validatePhoneNumber } from "@/lib/twilio/service";
import { canReceiveMarketing } from "@/lib/consent/contact-consent";

const messageInclude = {
  list: true,
  recipients: true,
} satisfies Prisma.MessageInclude;

export type MessageWithRelations = Prisma.MessageGetPayload<{
  include: typeof messageInclude;
}>;

export type MessageTab = "drafts" | "scheduled" | "sent" | "failed";

const TAB_STATUS: Record<MessageTab, MessageStatus> = {
  drafts: "draft",
  scheduled: "scheduled",
  sent: "sent",
  failed: "failed",
};

export function tabToStatus(tab: MessageTab): MessageStatus {
  return TAB_STATUS[tab];
}

export async function getMessagesByTab(
  workspaceId: string,
  tab: MessageTab = "sent"
) {
  return prisma.message.findMany({
    where: { workspaceId, status: tabToStatus(tab) },
    include: messageInclude,
    orderBy:
      tab === "scheduled"
        ? { scheduledAt: "asc" }
        : { updatedAt: "desc" },
  });
}

export async function getUpcomingScheduledMessages(workspaceId: string) {
  return prisma.message.findMany({
    where: {
      workspaceId,
      status: "scheduled",
      scheduledAt: { gte: new Date() },
    },
    include: messageInclude,
    orderBy: { scheduledAt: "asc" },
  });
}

export async function getAllScheduledMessages(workspaceId: string) {
  return prisma.message.findMany({
    where: { workspaceId, status: "scheduled" },
    include: messageInclude,
    orderBy: { scheduledAt: "asc" },
  });
}

export async function getMessageCounts(workspaceId: string) {
  const [drafts, scheduled, sent, failed] = await Promise.all([
    prisma.message.count({ where: { workspaceId, status: "draft" } }),
    prisma.message.count({ where: { workspaceId, status: "scheduled" } }),
    prisma.message.count({ where: { workspaceId, status: "sent" } }),
    prisma.message.count({ where: { workspaceId, status: "failed" } }),
  ]);
  return { drafts, scheduled, sent, failed };
}

export async function getMessageById(workspaceId: string, messageId: string) {
  return prisma.message.findFirst({
    where: { id: messageId, workspaceId },
    include: {
      list: true,
      recipients: {
        include: { contact: true },
      },
    },
  });
}

export type ListAudienceStats = {
  listId: string;
  listName: string;
  totalOnList: number;
  activeCount: number;
  optedOutCount: number;
  invalidCount: number;
  missingConsentCount: number;
  willSendCount: number;
};

export async function getListAudienceStats(
  workspaceId: string,
  listId: string
): Promise<ListAudienceStats | null> {
  const list = await prisma.list.findFirst({
    where: { id: listId, workspaceId },
    include: {
      listContacts: {
        include: { contact: true },
      },
    },
  });

  if (!list) return null;

  let activeCount = 0;
  let optedOutCount = 0;
  let invalidCount = 0;
  let missingConsentCount = 0;

  for (const lc of list.listContacts) {
    const contact = lc.contact;

    if (contact.status === "opted_out") {
      optedOutCount++;
      continue;
    }

    if (contact.status === "invalid") {
      invalidCount++;
      continue;
    }

    if (!contact.phone?.trim() || !validatePhoneNumber(contact.phone)) {
      invalidCount++;
      continue;
    }

    activeCount++;
    if (
      !canReceiveMarketing({
        consentStatus: contact.consentStatus,
        consentTimestamp: contact.consentTimestamp,
        status: contact.status,
      })
    ) {
      missingConsentCount++;
    }
  }

  const willSendCount = list.listContacts.filter((lc) =>
    canReceiveMarketing({
      consentStatus: lc.contact.consentStatus,
      consentTimestamp: lc.contact.consentTimestamp,
      status: lc.contact.status,
    })
  ).length;

  return {
    listId: list.id,
    listName: list.name,
    totalOnList: list.listContacts.length,
    activeCount,
    optedOutCount,
    invalidCount,
    missingConsentCount,
    willSendCount,
  };
}

export function getRecipientStats(
  recipients: { status: string }[]
) {
  return {
    sent: recipients.filter((r) => r.status === "sent" || r.status === "delivered").length,
    delivered: recipients.filter((r) => r.status === "delivered").length,
    skipped: recipients.filter((r) => r.status === "skipped").length,
    optedOut: recipients.filter((r) => r.status === "opted_out").length,
    failed: recipients.filter((r) => r.status === "failed" || r.status === "undelivered").length,
    undelivered: recipients.filter((r) => r.status === "undelivered").length,
    queued: recipients.filter((r) => r.status === "queued").length,
    total: recipients.length,
  };
}
