-- CreateEnum
CREATE TYPE "WorkspaceMemberStatus" AS ENUM ('pending', 'active');

-- AlterTable
ALTER TABLE "WorkspaceMember"
ADD COLUMN "status" "WorkspaceMemberStatus" NOT NULL DEFAULT 'active',
ADD COLUMN "clerkInvitationId" TEXT;
