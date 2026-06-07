import { roleHasPermission } from "@/lib/auth/permissions";
import type { AuthContext } from "@/lib/auth/authorization";

export type PagePermissions = {
  canManageContacts: boolean;
  canManageLists: boolean;
  canManageMessages: boolean;
  canCreateMessages: boolean;
  canManageKeywords: boolean;
  canManageInbox: boolean;
  canManageSettings: boolean;
  canManageBilling: boolean;
  canManageTeam: boolean;
};

export function getPagePermissions(ctx: AuthContext): PagePermissions {
  const { role, canCreateMessages } = ctx;

  return {
    canManageContacts: roleHasPermission(role, "manage_contacts"),
    canManageLists: roleHasPermission(role, "manage_lists"),
    canManageMessages: roleHasPermission(role, "manage_messages"),
    canCreateMessages,
    canManageKeywords: roleHasPermission(role, "manage_keywords"),
    canManageInbox: roleHasPermission(role, "manage_inbox"),
    canManageSettings: roleHasPermission(role, "manage_settings"),
    canManageBilling: roleHasPermission(role, "manage_billing"),
    canManageTeam: roleHasPermission(role, "manage_team"),
  };
}

export function canReplyToInbox(ctx: AuthContext): boolean {
  return roleHasPermission(ctx.role, "manage_inbox");
}

export function canManageTags(ctx: AuthContext): boolean {
  return (
    roleHasPermission(ctx.role, "manage_contacts") ||
    roleHasPermission(ctx.role, "manage_settings")
  );
}
