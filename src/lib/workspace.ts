import type { User, Workspace, BillingAccount } from "@prisma/client";

export type WorkspaceWithRelations = Workspace & {
  owner: User;
  billingAccount: BillingAccount | null;
};
