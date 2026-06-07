import type { ContactSource, ContactStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ContactFilters = {
  q?: string;
  status?: ContactStatus;
  source?: ContactSource;
};

const contactInclude = {
  listContacts: { include: { list: true } },
  contactTags: { include: { tag: true } },
} satisfies Prisma.ContactInclude;

export type ContactWithRelations = Prisma.ContactGetPayload<{
  include: typeof contactInclude;
}>;

function buildWhereClause(
  workspaceId: string,
  filters: ContactFilters
): Prisma.ContactWhereInput {
  const where: Prisma.ContactWhereInput = { workspaceId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.source) {
    where.source = filters.source;
  }

  const query = filters.q?.trim();
  if (query) {
    const phoneQuery = query.replace(/\D/g, "");
    where.OR = [
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      ...(phoneQuery.length > 0 ? [{ phone: { contains: phoneQuery } }] : []),
    ];
  }

  return where;
}

export async function searchContacts(
  workspaceId: string,
  filters: ContactFilters = {}
): Promise<ContactWithRelations[]> {
  return prisma.contact.findMany({
    where: buildWhereClause(workspaceId, filters),
    include: contactInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getContactById(
  workspaceId: string,
  contactId: string
): Promise<ContactWithRelations | null> {
  return prisma.contact.findFirst({
    where: { id: contactId, workspaceId },
    include: contactInclude,
  });
}

export async function getContactDetail(workspaceId: string, contactId: string) {
  return prisma.contact.findFirst({
    where: { id: contactId, workspaceId },
    include: {
      ...contactInclude,
      messageRecipients: {
        include: { message: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      inboxMessages: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function getContactFormOptions(workspaceId: string) {
  const [lists, tags] = await Promise.all([
    prisma.list.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.tag.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
  ]);

  return { lists, tags };
}

export async function isDuplicatePhone(
  workspaceId: string,
  phone: string,
  excludeContactId?: string
): Promise<boolean> {
  const existing = await prisma.contact.findFirst({
    where: {
      workspaceId,
      phone,
      ...(excludeContactId ? { NOT: { id: excludeContactId } } : {}),
    },
    select: { id: true },
  });
  return !!existing;
}
