-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "businessName" TEXT,
ADD COLUMN "supportEmail" TEXT,
ADD COLUMN "supportPhone" TEXT,
ADD COLUMN "privacyPolicyUrl" TEXT,
ADD COLUMN "termsUrl" TEXT,
ADD COLUMN "messageFrequencyDescription" TEXT,
ADD COLUMN "defaultComplianceFooter" TEXT,
ADD COLUMN "defaultHelpResponse" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN "sentBody" TEXT;

-- AlterTable
ALTER TABLE "MessageRecipient" ADD COLUMN "sentBody" TEXT;

-- CreateTable
CREATE TABLE "ComplianceArchive" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "messageBody" TEXT NOT NULL,
    "listId" TEXT,
    "listName" TEXT,
    "senderNumber" TEXT,
    "totalRecipients" INTEGER NOT NULL,
    "sentCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "skippedOptOuts" INTEGER NOT NULL,
    "skippedInvalid" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceArchive_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ComplianceArchive_messageId_key" ON "ComplianceArchive"("messageId");
CREATE INDEX "ComplianceArchive_workspaceId_idx" ON "ComplianceArchive"("workspaceId");

ALTER TABLE "ComplianceArchive" ADD CONSTRAINT "ComplianceArchive_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplianceArchive" ADD CONSTRAINT "ComplianceArchive_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
