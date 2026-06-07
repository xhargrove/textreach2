import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const listContactInclude = {
  contact: {
    include: {
      contactTags: { include: { tag: true } },
    },
  },
} satisfies Prisma.ListContactInclude;

export async function getListsWithCounts(workspaceId: string) {
  return prisma.list.findMany({
    where: { workspaceId },
    include: { _count: { select: { listContacts: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getListById(workspaceId: string, listId: string) {
  return prisma.list.findFirst({
    where: { id: listId, workspaceId },
    include: { _count: { select: { listContacts: true } } },
  });
}

export async function getListContacts(
  workspaceId: string,
  listId: string,
  query?: string
) {
  const list = await getListById(workspaceId, listId);
  if (!list) return null;

  const phoneQuery = query?.replace(/\D/g, "") ?? "";

  const listContacts = await prisma.listContact.findMany({
    where: {
      listId,
      ...(query?.trim()
        ? {
            contact: {
              OR: [
                { firstName: { contains: query.trim(), mode: "insensitive" } },
                { lastName: { contains: query.trim(), mode: "insensitive" } },
                { email: { contains: query.trim(), mode: "insensitive" } },
                ...(phoneQuery.length > 0
                  ? [{ phone: { contains: phoneQuery } }]
                  : []),
              ],
            },
          }
        : {}),
    },
    include: listContactInclude,
    orderBy: { createdAt: "desc" },
  });

  return { list, listContacts };
}

export async function getAvailableContactsForList(
  workspaceId: string,
  listId: string,
  query?: string
) {
  const phoneQuery = query?.replace(/\D/g, "") ?? "";

  return prisma.contact.findMany({
    where: {
      workspaceId,
      listContacts: { none: { listId } },
      ...(query?.trim()
        ? {
            OR: [
              { firstName: { contains: query.trim(), mode: "insensitive" } },
              { lastName: { contains: query.trim(), mode: "insensitive" } },
              { email: { contains: query.trim(), mode: "insensitive" } },
              ...(phoneQuery.length > 0
                ? [{ phone: { contains: phoneQuery } }]
                : []),
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function isListNameTaken(
  workspaceId: string,
  name: string,
  excludeListId?: string
) {
  const existing = await prisma.list.findFirst({
    where: {
      workspaceId,
      name: { equals: name, mode: "insensitive" },
      ...(excludeListId ? { NOT: { id: excludeListId } } : {}),
    },
    select: { id: true },
  });
  return !!existing;
}
