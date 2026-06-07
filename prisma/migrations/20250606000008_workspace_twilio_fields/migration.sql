-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "twilioPhoneNumber" TEXT,
ADD COLUMN "twilioMessagingSid" TEXT,
ADD COLUMN "twilioAccountSid" TEXT,
ADD COLUMN "twilioStatus" TEXT DEFAULT 'not_configured';

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_twilioPhoneNumber_key" ON "Workspace"("twilioPhoneNumber");
