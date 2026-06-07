import type { WorkspaceRole } from "@prisma/client";

export type Permission =
  | "view_contacts"
  | "manage_contacts"
  | "view_lists"
  | "manage_lists"
  | "view_messages"
  | "manage_messages"
  | "view_keywords"
  | "manage_keywords"
  | "view_inbox"
  | "manage_inbox"
  | "view_results"
  | "manage_billing"
  | "manage_settings"
  | "invite_members"
  | "manage_team";

const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [
    "view_contacts",
    "manage_contacts",
    "view_lists",
    "manage_lists",
    "view_messages",
    "manage_messages",
    "view_keywords",
    "manage_keywords",
    "view_inbox",
    "manage_inbox",
    "view_results",
    "manage_billing",
    "manage_settings",
    "invite_members",
    "manage_team",
  ],
  admin: [
    "view_contacts",
    "manage_contacts",
    "view_lists",
    "manage_lists",
    "view_messages",
    "manage_messages",
    "view_keywords",
    "manage_keywords",
    "view_inbox",
    "manage_inbox",
    "view_results",
    "manage_settings",
    "manage_team",
  ],
  member: [
    "view_contacts",
    "view_lists",
    "view_messages",
    "view_keywords",
    "view_inbox",
    "view_results",
  ],
};

export function roleHasPermission(
  role: WorkspaceRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canCreateMessages(
  role: WorkspaceRole,
  memberCanCreateMessages: boolean
): boolean {
  if (role === "owner" || role === "admin") return true;
  return memberCanCreateMessages;
}

export function roleLabel(role: WorkspaceRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "member":
      return "Member";
  }
}
