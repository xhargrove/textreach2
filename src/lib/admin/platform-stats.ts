import { prisma } from "@/lib/prisma";

export type PlatformStats = {
  totalUsers: number;
  totalWorkspaces: number;
  totalContacts: number;
  totalMessagesSent: number;
  failedRecipients: number;
  activeSubscriptions: number;
  recentSignups: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  }[];
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalWorkspaces,
    totalContacts,
    totalMessagesSent,
    failedRecipients,
    activeSubscriptions,
    recentSignups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.contact.count(),
    prisma.message.count({ where: { status: "sent" } }),
    prisma.messageRecipient.count({ where: { status: "failed" } }),
    prisma.billingAccount.count({ where: { status: "active" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    totalUsers,
    totalWorkspaces,
    totalContacts,
    totalMessagesSent,
    failedRecipients,
    activeSubscriptions,
    recentSignups: recentSignups.filter((user) => user.createdAt >= thirtyDaysAgo),
  };
}
