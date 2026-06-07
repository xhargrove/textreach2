-- CreateTable
CREATE TABLE "TrackedLink" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "contactId" TEXT,
    "originalUrl" TEXT NOT NULL,
    "trackingUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedLink_pkey" PRIMARY KEY ("id")
);

-- Drop old LinkClick and recreate with tracking fields
DROP TABLE IF EXISTS "LinkClick";

CREATE TABLE "LinkClick" (
    "id" TEXT NOT NULL,
    "trackedLinkId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "contactId" TEXT,
    "originalUrl" TEXT NOT NULL,
    "trackingUrl" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "LinkClick_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TrackedLink_messageId_idx" ON "TrackedLink"("messageId");
CREATE INDEX "LinkClick_messageId_idx" ON "LinkClick"("messageId");
CREATE INDEX "LinkClick_trackedLinkId_idx" ON "LinkClick"("trackedLinkId");

ALTER TABLE "TrackedLink" ADD CONSTRAINT "TrackedLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrackedLink" ADD CONSTRAINT "TrackedLink_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrackedLink" ADD CONSTRAINT "TrackedLink_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LinkClick" ADD CONSTRAINT "LinkClick_trackedLinkId_fkey" FOREIGN KEY ("trackedLinkId") REFERENCES "TrackedLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LinkClick" ADD CONSTRAINT "LinkClick_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LinkClick" ADD CONSTRAINT "LinkClick_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LinkClick" ADD CONSTRAINT "LinkClick_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
