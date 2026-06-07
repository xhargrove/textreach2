import {
  MessageStatus,
  RecipientStatus,
  InboxDirection,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { countByDay, percent } from "@/lib/results/chart-utils";
import { getRecipientStats } from "@/lib/queries/messages";
import {
  getMessageLinkStats,
  getWorkspaceClickCount,
  type MessageLinkStats,
} from "@/lib/queries/link-clicks";
import {
  getMessageReplyStats,
  type MessageReplyStats,
} from "@/lib/queries/message-replies";

const CHART_DAYS = 14;

export type ResultsOverview = {
  messagesSent: number;
  deliveryRate: number;
  failedMessages: number;
  failedRecipients: number;
  replies: number;
  optOuts: number;
  clicks: number;
  newContacts: number;
  topLists: { id: string; name: string; messageCount: number }[];
  topKeywords: { id: string; keyword: string; optInCount: number }[];
  charts: {
    newContacts: { label: string; value: number }[];
    messagesSent: { label: string; value: number }[];
    replies: { label: string; value: number }[];
    keywordOptIns: { label: string; value: number }[];
  };
};

export async function getResultsOverview(
  workspaceId: string
): Promise<ResultsOverview> {
  const since = new Date();
  since.setDate(since.getDate() - (CHART_DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const [
    sentMessages,
    allRecipients,
    replies,
    optOuts,
    newContacts,
    newContactDates,
    sentMessageDates,
    replyDates,
    optInDates,
    lists,
    keywords,
    clickCount,
  ] = await Promise.all([
    prisma.message.findMany({
      where: { workspaceId, status: MessageStatus.sent },
      include: { recipients: true },
    }),
    prisma.messageRecipient.findMany({
      where: { message: { workspaceId, status: MessageStatus.sent } },
    }),
    prisma.inboxMessage.count({
      where: { workspaceId, direction: InboxDirection.inbound },
    }),
    prisma.optOut.count({ where: { workspaceId } }),
    prisma.contact.count({
      where: { workspaceId, createdAt: { gte: since } },
    }),
    prisma.contact.findMany({
      where: { workspaceId, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.message.findMany({
      where: {
        workspaceId,
        status: MessageStatus.sent,
        sentAt: { gte: since },
      },
      select: { sentAt: true },
    }),
    prisma.inboxMessage.findMany({
      where: {
        workspaceId,
        direction: InboxDirection.inbound,
        createdAt: { gte: since },
      },
      select: { createdAt: true },
    }),
    prisma.keywordOptIn.findMany({
      where: { workspaceId, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.list.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { messages: { _count: "desc" } },
      take: 5,
    }),
    prisma.keyword.findMany({
      where: { workspaceId },
      orderBy: { optInCount: "desc" },
      take: 5,
    }),
    getWorkspaceClickCount(workspaceId),
  ]);

  const totalRecipients = allRecipients.length;
  const delivered = allRecipients.filter(
    (r) =>
      r.status === RecipientStatus.delivered ||
      r.status === RecipientStatus.sent
  ).length;
  const failedRecipients = allRecipients.filter(
    (r) =>
      r.status === RecipientStatus.failed ||
      r.status === RecipientStatus.undelivered
  ).length;

  const failedMessages = sentMessages.filter((m) =>
    m.recipients.some(
      (r) =>
        r.status === RecipientStatus.failed ||
        r.status === RecipientStatus.undelivered
    )
  ).length;

  return {
    messagesSent: sentMessages.length,
    deliveryRate: percent(delivered, totalRecipients),
    failedMessages,
    failedRecipients,
    replies,
    optOuts,
    clicks: clickCount,
    newContacts,
    topLists: lists.map((l) => ({
      id: l.id,
      name: l.name,
      messageCount: l._count.messages,
    })),
    topKeywords: keywords.map((k) => ({
      id: k.id,
      keyword: k.keyword,
      optInCount: k.optInCount,
    })),
    charts: {
      newContacts: countByDay(
        newContactDates.map((c) => c.createdAt),
        CHART_DAYS
      ),
      messagesSent: countByDay(
        sentMessageDates
          .map((m) => m.sentAt)
          .filter((d): d is Date => d !== null),
        CHART_DAYS
      ),
      replies: countByDay(
        replyDates.map((r) => r.createdAt),
        CHART_DAYS
      ),
      keywordOptIns: countByDay(
        optInDates.map((o) => o.createdAt),
        CHART_DAYS
      ),
    },
  };
}

export type MessageResults = {
  messageId: string;
  name: string;
  listName: string | null;
  status: string;
  sentAt: Date | null;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  undelivered: number;
  skipped: number;
  optedOut: number;
  replies: number;
  replyStats: MessageReplyStats;
  clicks: number;
  clickThroughRate: number;
  linkStats: MessageLinkStats;
  deliveryRate: number;
  failureRate: number;
};

export async function getMessageResults(
  workspaceId: string,
  messageId: string
): Promise<MessageResults | null> {
  const message = await prisma.message.findFirst({
    where: { id: messageId, workspaceId },
    include: { list: true, recipients: true },
  });

  if (!message) return null;

  const stats = getRecipientStats(message.recipients);
  const failedOnly = message.recipients.filter(
    (r) => r.status === RecipientStatus.failed
  ).length;
  const undeliveredOnly = message.recipients.filter(
    (r) => r.status === RecipientStatus.undelivered
  ).length;
  const attempted = stats.total - stats.skipped - stats.optedOut;
  const deliveredCount = stats.delivered + stats.sent;
  const linkStats = await getMessageLinkStats(
    workspaceId,
    messageId,
    deliveredCount
  );
  const recipientContactIds = [
    ...new Set(message.recipients.map((r) => r.contactId)),
  ];
  const replyStats = await getMessageReplyStats(
    workspaceId,
    messageId,
    message.sentAt,
    recipientContactIds
  );

  return {
    messageId: message.id,
    name: message.name,
    listName: message.list?.name ?? null,
    status: message.status,
    sentAt: message.sentAt,
    total: stats.total,
    sent: stats.sent,
    delivered: stats.delivered,
    failed: failedOnly,
    undelivered: undeliveredOnly,
    skipped: stats.skipped,
    optedOut: stats.optedOut,
    replies: replyStats.totalReplies,
    replyStats,
    clicks: linkStats.totalClicks,
    clickThroughRate: linkStats.clickThroughRate,
    linkStats,
    deliveryRate: percent(stats.delivered + stats.sent, attempted),
    failureRate: percent(failedOnly + undeliveredOnly, attempted),
  };
}

export async function getAllMessageResults(workspaceId: string) {
  const messages = await prisma.message.findMany({
    where: { workspaceId, status: MessageStatus.sent },
    include: { list: true, recipients: true },
    orderBy: { sentAt: "desc" },
  });

  return Promise.all(
    messages.map(async (message) => {
      const stats = getRecipientStats(message.recipients);
      const failedOnly = message.recipients.filter(
        (r) => r.status === RecipientStatus.failed
      ).length;
      const undeliveredOnly = message.recipients.filter(
        (r) => r.status === RecipientStatus.undelivered
      ).length;
      const attempted = stats.total - stats.skipped - stats.optedOut;
      const recipientContactIds = [
        ...new Set(message.recipients.map((r) => r.contactId)),
      ];
      const replyStats = await getMessageReplyStats(
        workspaceId,
        message.id,
        message.sentAt,
        recipientContactIds
      );

      return {
        id: message.id,
        name: message.name,
        listName: message.list?.name ?? null,
        sentAt: message.sentAt,
        total: stats.total,
        delivered: stats.delivered + stats.sent,
        failed: failedOnly + undeliveredOnly,
        deliveryRate: percent(stats.delivered + stats.sent, attempted),
        replies: replyStats.totalReplies,
      };
    })
  );
}

export type KeywordResults = {
  keywordId: string;
  keyword: string;
  listName: string | null;
  totalOptIns: number;
  optInsThisWeek: number;
  recentOptIns: {
    id: string;
    contactName: string;
    phone: string;
    createdAt: Date;
  }[];
};

export async function getKeywordResults(
  workspaceId: string,
  keywordId: string
): Promise<KeywordResults | null> {
  const keyword = await prisma.keyword.findFirst({
    where: { id: keywordId, workspaceId },
    include: { list: true },
  });

  if (!keyword) return null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [optInsThisWeek, recentOptIns] = await Promise.all([
    prisma.keywordOptIn.count({
      where: { keywordId, workspaceId, createdAt: { gte: weekAgo } },
    }),
    prisma.keywordOptIn.findMany({
      where: { keywordId, workspaceId },
      include: { contact: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return {
    keywordId: keyword.id,
    keyword: keyword.keyword,
    listName: keyword.list?.name ?? null,
    totalOptIns: keyword.optInCount,
    optInsThisWeek,
    recentOptIns: recentOptIns.map((o) => ({
      id: o.id,
      contactName:
        [o.contact.firstName, o.contact.lastName].filter(Boolean).join(" ") ||
        "Unknown",
      phone: o.contact.phone,
      createdAt: o.createdAt,
    })),
  };
}

export type ListResults = {
  listId: string;
  name: string;
  totalContacts: number;
  activeContacts: number;
  optedOutContacts: number;
  messagesSent: number;
  replies: number;
};

export async function getListResults(
  workspaceId: string,
  listId: string
): Promise<ListResults | null> {
  const list = await prisma.list.findFirst({
    where: { id: listId, workspaceId },
    include: {
      listContacts: { include: { contact: true } },
    },
  });

  if (!list) return null;

  const contactIds = list.listContacts.map((lc) => lc.contactId);

  let activeContacts = 0;
  let optedOutContacts = 0;
  for (const lc of list.listContacts) {
    if (lc.contact.status === "active") activeContacts++;
    else if (lc.contact.status === "opted_out") optedOutContacts++;
  }

  const [messagesSent, replies] = await Promise.all([
    prisma.message.count({
      where: { workspaceId, listId, status: MessageStatus.sent },
    }),
    contactIds.length > 0
      ? prisma.inboxMessage.count({
          where: {
            workspaceId,
            direction: InboxDirection.inbound,
            contactId: { in: contactIds },
          },
        })
      : 0,
  ]);

  return {
    listId: list.id,
    name: list.name,
    totalContacts: list.listContacts.length,
    activeContacts,
    optedOutContacts,
    messagesSent,
    replies,
  };
}

export async function getDashboardCharts(workspaceId: string) {
  const overview = await getResultsOverview(workspaceId);
  return overview.charts;
}
