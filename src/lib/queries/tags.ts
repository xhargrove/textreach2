import { prisma } from "@/lib/prisma";

export async function getTags(workspaceId: string) {
  return prisma.tag.findMany({
    where: { workspaceId },
    include: { _count: { select: { contactTags: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getTagById(workspaceId: string, tagId: string) {
  return prisma.tag.findFirst({
    where: { id: tagId, workspaceId },
    include: { _count: { select: { contactTags: true } } },
  });
}

export async function isTagNameTaken(
  workspaceId: string,
  name: string,
  excludeTagId?: string
) {
  const existing = await prisma.tag.findFirst({
    where: {
      workspaceId,
      name: { equals: name, mode: "insensitive" },
      ...(excludeTagId ? { NOT: { id: excludeTagId } } : {}),
    },
    select: { id: true },
  });
  return !!existing;
}

export const TAG_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#64748b",
] as const;
