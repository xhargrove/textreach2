-- AlterTable
ALTER TABLE "User" ADD COLUMN "clerkId" TEXT;

CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- AlterTable
ALTER TABLE "WorkspaceMember" ADD COLUMN "canCreateMessages" BOOLEAN NOT NULL DEFAULT false;

-- Owners/admins can create messages via role checks; enable for existing owners
UPDATE "WorkspaceMember" SET "canCreateMessages" = true WHERE "role" IN ('owner', 'admin');
