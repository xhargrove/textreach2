import { describe, expect, it } from "vitest";
import {
  canCreateMessages,
  roleHasPermission,
} from "@/lib/auth/permissions";
import {
  canReplyToInbox,
  getPagePermissions,
} from "@/lib/auth/page-permissions";
import type { AuthContext } from "@/lib/auth/authorization";
import { ForbiddenError } from "@/lib/auth/errors";
import { catchActionError } from "@/lib/actions/action-result";

function memberContext(
  canCreateMessagesFlag = false
): AuthContext {
  return {
    userId: "user_1",
    workspaceId: "ws_1",
    role: "member",
    canCreateMessages: canCreateMessagesFlag,
    user: {
      id: "user_1",
      email: "member@example.com",
      name: "Member",
      clerkId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    workspace: {
      id: "ws_1",
      name: "Test",
      ownerId: "owner_1",
      plan: "starter",
      businessName: null,
      supportEmail: null,
      supportPhone: null,
      privacyPolicyUrl: null,
      termsUrl: null,
      messageFrequencyDescription: null,
      defaultComplianceFooter: null,
      defaultHelpResponse: null,
      physicalAddress: null,
      marketingSmsEnabled: true,
      quietHoursEnabled: false,
      quietHoursTimezone: null,
      twilioPhoneNumber: null,
      twilioMessagingSid: null,
      twilioAccountSid: null,
      twilioStatus: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: {} as AuthContext["workspace"]["owner"],
      billingAccount: null,
    },
    membership: {
      id: "mem_1",
      workspaceId: "ws_1",
      userId: "user_1",
      role: "member",
      canCreateMessages: canCreateMessagesFlag,
      createdAt: new Date(),
    },
  };
}

describe("RBAC page access", () => {
  it("member cannot create campaigns by default", () => {
    const ctx = memberContext(false);
    const perms = getPagePermissions(ctx);

    expect(canCreateMessages("member", ctx.canCreateMessages)).toBe(false);
    expect(perms.canCreateMessages).toBe(false);
    expect(perms.canManageMessages).toBe(false);
    expect(roleHasPermission("member", "manage_messages")).toBe(false);
  });

  it("member with canCreateMessages flag may create but not manage messages", () => {
    const ctx = memberContext(true);
    const perms = getPagePermissions(ctx);

    expect(canCreateMessages("member", true)).toBe(true);
    expect(perms.canCreateMessages).toBe(true);
    expect(perms.canManageMessages).toBe(false);
  });

  it("member cannot reply in inbox without manage_inbox", () => {
    const ctx = memberContext(false);

    expect(canReplyToInbox(ctx)).toBe(false);
    expect(roleHasPermission("member", "manage_inbox")).toBe(false);
    expect(getPagePermissions(ctx).canManageInbox).toBe(false);
  });

  it("admin can manage inbox and messages", () => {
    expect(roleHasPermission("admin", "manage_inbox")).toBe(true);
    expect(roleHasPermission("admin", "manage_messages")).toBe(true);
  });
});

describe("RBAC server action errors", () => {
  it("returns user-friendly message for ForbiddenError, not raw 500", () => {
    const result = catchActionError(new ForbiddenError());
    expect(result).toEqual({
      ok: false,
      error: "You do not have permission to perform this action.",
    });
  });
});
