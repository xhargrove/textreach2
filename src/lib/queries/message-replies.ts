import { InboxDirection, RecipientStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const REPLY_ATTRIBUTION_DAYS = 30;

export type MessageReplyStats = {
  totalReplies: number;
  uniqueContacts: number;
  isPartialAttribution: boolean;
  attributionNote: string;
  recentReplies: {
    id: string;
    body: string;
    createdAt: Date;
    contactId: string;
    contactName: string;
    phone: string;
  }[];
};

function contactDisplayName(contact: {
  firstName: string | null;
  lastName: string | null;
  phone: string;
}): string {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  return name || contact.phone;
}

export async function findRelatedMessageIdForInbound(
  workspaceId: string,
  contactId: string
): Promise<string | null> {
  const recipient = await prisma.messageRecipient.findFirst({
    where: {
      contactId,
      status: { in: [RecipientStatus.sent, RecipientStatus.delivered] },
      message: {
        workspaceId,
        status: "sent",
        sentAt: { not: null },
      },
    },
    orderBy: { message: { sentAt: "desc" } },
    select: {
      messageId: true,
      message: { select: { sentAt: true } },
    },
  });

  if (!recipient?.message.sentAt) return null;

  const windowEnd = new Date(recipient.message.sentAt);
  windowEnd.setDate(windowEnd.getDate() + REPLY_ATTRIBUTION_DAYS);
  if (new Date() > windowEnd) return null;

  return recipient.messageId;
}

export async function getMessageReplyStats(
  workspaceId: string,
  messageId: string,
  sentAt: Date | null,
  recipientContactIds: string[]
): Promise<MessageReplyStats> {
  const empty: MessageReplyStats = {
    totalReplies: 0,
    uniqueContacts: 0,
    isPartialAttribution: false,
    attributionNote: "",
    recentReplies: [],
  };

  if (!sentAt || recipientContactIds.length === 0) {
    return empty;
  }

  const windowEnd = new Date(sentAt);
  windowEnd.setDate(windowEnd.getDate() + REPLY_ATTRIBUTION_DAYS);

  const replies = await prisma.inboxMessage.findMany({
    where: {
      workspaceId,
      direction: InboxDirection.inbound,
      OR: [
        { relatedMessageId: messageId },
        {
          relatedMessageId: null,
          contactId: { in: recipientContactIds },
          createdAt: { gte: sentAt, lte: windowEnd },
        },
      ],
    },
    include: {
      contact: {
        select: { id: true, firstName: true, lastName: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const uniqueContactIds = new Set(replies.map((r) => r.contactId));
  const linkedCount = replies.filter((r) => r.relatedMessageId === messageId).length;
  const isPartialAttribution =
    replies.length > 0 && linkedCount < replies.length;

  return {
    totalReplies: replies.length,
    uniqueContacts: uniqueContactIds.size,
    isPartialAttribution,
    attributionNote: isPartialAttribution
      ? "Replies from campaign recipients who replied within 30 days of send. Some replies may not be directly linked to this message."
      : replies.length > 0
        ? "Replies linked to this campaign message."
        : "",
    recentReplies: replies.slice(0, 10).map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt,
      contactId: r.contactId,
      contactName: contactDisplayName(r.contact),
      phone: r.phone,
    })),
  };
}
