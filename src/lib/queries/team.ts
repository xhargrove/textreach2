import { prisma } from "@/lib/prisma";

export async function getWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}
