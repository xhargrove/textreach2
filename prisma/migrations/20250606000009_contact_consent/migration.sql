-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('unknown', 'subscribed', 'unsubscribed');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'unknown',
ADD COLUMN "consentSource" TEXT,
ADD COLUMN "consentPhoneNumber" TEXT,
ADD COLUMN "optedOutAt" TIMESTAMP(3);

-- Backfill consent status from existing data
UPDATE "Contact" SET "consentStatus" = 'unsubscribed' WHERE "status" = 'opted_out';
UPDATE "Contact" SET "consentStatus" = 'subscribed' WHERE "consentTimestamp" IS NOT NULL AND "status" != 'opted_out';

-- CreateTable
CREATE TABLE "ConsentEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "contactId" TEXT,
    "phone" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "source" TEXT,
    "toNumber" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentEvent_workspaceId_phone_idx" ON "ConsentEvent"("workspaceId", "phone");
CREATE INDEX "ConsentEvent_contactId_idx" ON "ConsentEvent"("contactId");

-- AddForeignKey
ALTER TABLE "ConsentEvent" ADD CONSTRAINT "ConsentEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentEvent" ADD CONSTRAINT "ConsentEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
