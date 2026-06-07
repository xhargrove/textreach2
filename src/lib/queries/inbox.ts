import { prisma } from "@/lib/prisma";
import { formatContactName } from "@/lib/validation/phone";

export type InboxConversation = {
  contactId: string;
  contactName: string;
  phone: string;
  lastMessageBody: string;
  lastMessageDirection: "inbound" | "outbound";
  lastMessageAt: Date;
  unreadCount: number;
};

export async function getInboxConversations(
  workspaceId: string
): Promise<InboxConversation[]> {
  const messages = await prisma.inboxMessage.findMany({
    where: { workspaceId },
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });

  if (messages.length === 0) return [];

  const unreadByContact = await prisma.inboxMessage.groupBy({
    by: ["contactId"],
    where: {
      workspaceId,
      read: false,
      direction: "inbound",
    },
    _count: { _all: true },
  });

  const unreadMap = new Map(
    unreadByContact.map((row) => [row.contactId, row._count._all])
  );

  const seen = new Set<string>();
  const conversations: InboxConversation[] = [];

  for (const message of messages) {
    if (seen.has(message.contactId)) continue;
    seen.add(message.contactId);

    conversations.push({
      contactId: message.contactId,
      contactName: formatContactName(
        message.contact.firstName,
        message.contact.lastName
      ),
      phone: message.phone,
      lastMessageBody: message.body,
      lastMessageDirection: message.direction,
      lastMessageAt: message.createdAt,
      unreadCount: unreadMap.get(message.contactId) ?? 0,
    });
  }

  return conversations;
}

export async function getConversationMessages(
  workspaceId: string,
  contactId: string
) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, workspaceId },
  });

  if (!contact) return null;

  const messages = await prisma.inboxMessage.findMany({
    where: { workspaceId, contactId },
    orderBy: { createdAt: "asc" },
  });

  return { contact, messages };
}

export async function getInboxUnreadCount(workspaceId: string) {
  return prisma.inboxMessage.count({
    where: { workspaceId, read: false, direction: "inbound" },
  });
}
