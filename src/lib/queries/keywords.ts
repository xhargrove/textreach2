import { prisma } from "@/lib/prisma";

export async function getKeywordsWithList(workspaceId: string) {
  return prisma.keyword.findMany({
    where: { workspaceId },
    include: { list: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getKeywordById(workspaceId: string, keywordId: string) {
  return prisma.keyword.findFirst({
    where: { id: keywordId, workspaceId },
    include: { list: true },
  });
}

export async function isKeywordTaken(
  workspaceId: string,
  keyword: string,
  excludeId?: string
) {
  const existing = await prisma.keyword.findUnique({
    where: { workspaceId_keyword: { workspaceId, keyword } },
  });
  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;
  return true;
}

export async function getRecentKeywordOptIns(
  workspaceId: string,
  keywordId: string,
  limit = 10
) {
  return prisma.keywordOptIn.findMany({
    where: { workspaceId, keywordId },
    include: { contact: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function findActiveKeywordMatch(
  workspaceId: string,
  normalizedBody: string
) {
  return prisma.keyword.findFirst({
    where: {
      workspaceId,
      keyword: normalizedBody,
      status: "active",
    },
    include: { list: true },
  });
}
