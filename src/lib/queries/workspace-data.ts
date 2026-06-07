import {
  MessageStatus,
  RecipientStatus,
  KeywordStatus,
  InboxDirection,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getDashboardStats(workspaceId: string) {
  const [
    totalContacts,
    activeLists,
    messagesSent,
    replies,
    optOuts,
    scheduledMessages,
  ] = await Promise.all([
    prisma.contact.count({ where: { workspaceId, status: "active" } }),
    prisma.list.count({ where: { workspaceId } }),
    prisma.message.count({
      where: { workspaceId, status: MessageStatus.sent },
    }),
    prisma.inboxMessage.count({
      where: { workspaceId, direction: InboxDirection.inbound },
    }),
    prisma.optOut.count({ where: { workspaceId } }),
    prisma.message.count({
      where: { workspaceId, status: MessageStatus.scheduled },
    }),
  ]);

  return {
    totalContacts,
    activeLists,
    messagesSent,
    replies,
    optOuts,
    scheduledMessages,
  };
}

export async function getRecentMessages(workspaceId: string, limit = 5) {
  const messages = await prisma.message.findMany({
    where: { workspaceId },
    include: {
      list: true,
      recipients: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return messages.map((msg) => ({
    id: msg.id,
    name: msg.name,
    list: msg.list?.name ?? "—",
    status: msg.status,
    recipients: msg.recipients.length,
    replies: 0,
    sentAt: msg.sentAt,
  }));
}

export async function getActiveKeywords(workspaceId: string, limit = 5) {
  return prisma.keyword.findMany({
    where: { workspaceId, status: KeywordStatus.active },
    orderBy: { optInCount: "desc" },
    take: limit,
  });
}

export async function getRecentReplies(workspaceId: string, limit = 5) {
  const messages = await prisma.inboxMessage.findMany({
    where: { workspaceId, direction: InboxDirection.inbound },
    include: { contact: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return messages.map((msg) => ({
    id: msg.id,
    contact: [msg.contact.firstName, msg.contact.lastName]
      .filter(Boolean)
      .join(" ") || "Unknown",
    phone: msg.phone,
    message: msg.body,
    receivedAt: msg.createdAt,
  }));
}

export async function getContacts(workspaceId: string) {
  return prisma.contact.findMany({
    where: { workspaceId },
    include: {
      listContacts: { include: { list: true } },
      contactTags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLists(workspaceId: string) {
  const lists = await prisma.list.findMany({
    where: { workspaceId },
    include: { _count: { select: { listContacts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    description: list.description,
    contactCount: list._count.listContacts,
    createdAt: list.createdAt,
  }));
}

export async function getMessages(workspaceId: string) {
  const messages = await prisma.message.findMany({
    where: { workspaceId },
    include: {
      list: true,
      recipients: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return messages.map((msg) => {
    const delivered = msg.recipients.filter(
      (r) => r.status === RecipientStatus.delivered || r.status === RecipientStatus.sent
    ).length;

    return {
      id: msg.id,
      name: msg.name,
      body: msg.body,
      list: msg.list?.name ?? "—",
      status: msg.status,
      recipients: msg.recipients.length,
      delivered,
      replies: 0,
      scheduledAt: msg.scheduledAt,
      sentAt: msg.sentAt,
    };
  });
}

export async function getKeywords(workspaceId: string) {
  return prisma.keyword.findMany({
    where: { workspaceId },
    include: { list: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInboxMessages(workspaceId: string) {
  return prisma.inboxMessage.findMany({
    where: { workspaceId, direction: InboxDirection.inbound },
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getResultsData(workspaceId: string) {
  const [stats, messages, optOutCount] = await Promise.all([
    getDashboardStats(workspaceId),
    getMessages(workspaceId),
    prisma.optOut.count({ where: { workspaceId } }),
  ]);

  const sentMessages = messages.filter((m) => m.status === MessageStatus.sent);
  const totalRecipients = sentMessages.reduce((s, m) => s + m.recipients, 0);
  const totalDelivered = sentMessages.reduce((s, m) => s + m.delivered, 0);
  const totalReplies = stats.replies;

  const deliveryRate =
    totalRecipients > 0
      ? Math.round((totalDelivered / totalRecipients) * 100)
      : 0;
  const replyRate =
    totalDelivered > 0 ? Math.round((totalReplies / totalDelivered) * 100) : 0;

  return {
    stats,
    messages,
    optOutCount,
    deliveryRate,
    replyRate,
    totalReplies,
  };
}

export async function getBillingData(workspaceId: string) {
  const [workspace, billing, contactCount, listCount, keywordCount, messagesSent] =
    await Promise.all([
      prisma.workspace.findUniqueOrThrow({
        where: { id: workspaceId },
        include: { owner: true, billingAccount: true },
      }),
      prisma.billingAccount.findUnique({ where: { workspaceId } }),
      prisma.contact.count({ where: { workspaceId } }),
      prisma.list.count({ where: { workspaceId } }),
      prisma.keyword.count({ where: { workspaceId } }),
      prisma.message.count({
        where: { workspaceId, status: MessageStatus.sent },
      }),
    ]);

  return {
    workspace,
    billing,
    contactCount,
    listCount,
    keywordCount,
    messagesSent,
  };
}
