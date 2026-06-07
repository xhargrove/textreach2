-- Migrate WorkspacePlan enum: free/starter/pro/business -> starter/growth/pro
CREATE TYPE "WorkspacePlan_new" AS ENUM ('starter', 'growth', 'pro');

ALTER TABLE "Workspace" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "BillingAccount" ALTER COLUMN "plan" DROP DEFAULT;

ALTER TABLE "Workspace"
  ALTER COLUMN "plan" TYPE "WorkspacePlan_new"
  USING (
    CASE "plan"::text
      WHEN 'free' THEN 'starter'
      WHEN 'starter' THEN 'starter'
      WHEN 'pro' THEN 'growth'
      WHEN 'business' THEN 'pro'
      ELSE 'starter'
    END
  )::"WorkspacePlan_new";

ALTER TABLE "BillingAccount"
  ALTER COLUMN "plan" TYPE "WorkspacePlan_new"
  USING (
    CASE "plan"::text
      WHEN 'free' THEN 'starter'
      WHEN 'starter' THEN 'starter'
      WHEN 'pro' THEN 'growth'
      WHEN 'business' THEN 'pro'
      ELSE 'starter'
    END
  )::"WorkspacePlan_new";

DROP TYPE "WorkspacePlan";
ALTER TYPE "WorkspacePlan_new" RENAME TO "WorkspacePlan";

ALTER TABLE "Workspace" ALTER COLUMN "plan" SET DEFAULT 'starter';
ALTER TABLE "BillingAccount" ALTER COLUMN "plan" SET DEFAULT 'starter';
