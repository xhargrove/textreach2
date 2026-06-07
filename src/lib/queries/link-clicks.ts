import { prisma } from "@/lib/prisma";
import { percent } from "@/lib/results/chart-utils";

export type MessageLinkStats = {
  totalClicks: number;
  uniqueClicks: number;
  clickThroughRate: number;
  topLinks: {
    originalUrl: string;
    totalClicks: number;
    uniqueClicks: number;
  }[];
};

export async function getMessageLinkStats(
  workspaceId: string,
  messageId: string,
  deliveredCount: number
): Promise<MessageLinkStats> {
  const clicks = await prisma.linkClick.findMany({
    where: { workspaceId, messageId },
    select: {
      trackedLinkId: true,
      contactId: true,
      originalUrl: true,
    },
  });

  const uniqueTrackedLinks = new Set(clicks.map((c) => c.trackedLinkId));
  const uniqueContacts = new Set(
    clicks.map((c) => c.contactId).filter(Boolean)
  );

  const uniqueClicks =
    uniqueContacts.size > 0 ? uniqueContacts.size : uniqueTrackedLinks.size;

  const byUrl = new Map<
    string,
    { totalClicks: number; trackedLinkIds: Set<string>; contactIds: Set<string> }
  >();

  for (const click of clicks) {
    const entry = byUrl.get(click.originalUrl) ?? {
      totalClicks: 0,
      trackedLinkIds: new Set<string>(),
      contactIds: new Set<string>(),
    };
    entry.totalClicks++;
    entry.trackedLinkIds.add(click.trackedLinkId);
    if (click.contactId) entry.contactIds.add(click.contactId);
    byUrl.set(click.originalUrl, entry);
  }

  const topLinks = Array.from(byUrl.entries())
    .map(([originalUrl, data]) => ({
      originalUrl,
      totalClicks: data.totalClicks,
      uniqueClicks:
        data.contactIds.size > 0
          ? data.contactIds.size
          : data.trackedLinkIds.size,
    }))
    .sort((a, b) => b.totalClicks - a.totalClicks);

  return {
    totalClicks: clicks.length,
    uniqueClicks,
    clickThroughRate: percent(uniqueClicks, deliveredCount),
    topLinks,
  };
}

export async function getWorkspaceClickCount(workspaceId: string) {
  return prisma.linkClick.count({ where: { workspaceId } });
}
