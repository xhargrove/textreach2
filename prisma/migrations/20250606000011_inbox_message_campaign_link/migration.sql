-- AlterTable
ALTER TABLE "InboxMessage" ADD COLUMN "relatedMessageId" TEXT;

-- CreateIndex
CREATE INDEX "InboxMessage_relatedMessageId_idx" ON "InboxMessage"("relatedMessageId");

-- CreateIndex
CREATE INDEX "InboxMessage_workspaceId_contactId_createdAt_idx" ON "InboxMessage"("workspaceId", "contactId", "createdAt");

-- AddForeignKey
ALTER TABLE "InboxMessage" ADD CONSTRAINT "InboxMessage_relatedMessageId_fkey" FOREIGN KEY ("relatedMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
