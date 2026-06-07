-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "physicalAddress" TEXT,
ADD COLUMN "marketingSmsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "quietHoursTimezone" TEXT;
