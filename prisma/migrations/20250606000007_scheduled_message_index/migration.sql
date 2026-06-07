-- CreateIndex
CREATE INDEX "Message_status_scheduledAt_idx" ON "Message"("status", "scheduledAt");
