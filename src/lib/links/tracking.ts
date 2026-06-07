import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/app-url";
import { extractUrls, replaceUrlsInBody } from "@/lib/links/detect-urls";

export function getTrackingBaseUrl(): string | null {
  try {
    return getAppBaseUrl();
  } catch {
    return null;
  }
}

export function buildTrackingUrl(trackingId: string): string {
  const base = getTrackingBaseUrl();
  if (!base) {
    throw new Error(
      "Set NEXT_PUBLIC_APP_URL for link tracking redirects to work."
    );
  }
  return `${base}/r/${trackingId}`;
}

type TrackedLinkRecord = {
  originalUrl: string;
  trackingUrl: string;
};

export async function createTrackedLinksForRecipient(
  workspaceId: string,
  messageId: string,
  contactId: string,
  body: string
): Promise<{ bodyWithTracking: string; links: TrackedLinkRecord[] }> {
  const urls = extractUrls(body);
  if (urls.length === 0) {
    return { bodyWithTracking: body, links: [] };
  }

  const baseUrl = getTrackingBaseUrl();
  if (!baseUrl) {
    return { bodyWithTracking: body, links: [] };
  }

  const replacements: TrackedLinkRecord[] = [];

  for (const originalUrl of urls) {
    const tracked = await prisma.trackedLink.create({
      data: {
        workspaceId,
        messageId,
        contactId,
        originalUrl,
        trackingUrl: "", // set after id is known
      },
    });

    const trackingUrl = `${baseUrl}/r/${tracked.id}`;

    await prisma.trackedLink.update({
      where: { id: tracked.id },
      data: { trackingUrl },
    });

    replacements.push({ originalUrl, trackingUrl });
  }

  return {
    bodyWithTracking: replaceUrlsInBody(body, replacements),
    links: replacements,
  };
}

export async function recordLinkClick(
  trackingId: string,
  meta: { userAgent?: string; ipHash?: string }
) {
  const tracked = await prisma.trackedLink.findUnique({
    where: { id: trackingId },
  });

  if (!tracked) return null;

  await prisma.linkClick.create({
    data: {
      trackedLinkId: tracked.id,
      workspaceId: tracked.workspaceId,
      messageId: tracked.messageId,
      contactId: tracked.contactId,
      originalUrl: tracked.originalUrl,
      trackingUrl: tracked.trackingUrl,
      userAgent: meta.userAgent,
      ipHash: meta.ipHash,
    },
  });

  return tracked.originalUrl;
}
