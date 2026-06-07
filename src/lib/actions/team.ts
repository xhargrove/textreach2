"use server";

import { revalidatePath } from "next/cache";
import type { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorization";
import { isValidEmail } from "@/lib/validation/phone";
import { isClerkConfigured } from "@/lib/auth/clerk-config";
import {
  sendWorkspaceClerkInvitation,
  revokeClerkInvitation,
} from "@/lib/clerk/invitations";
import {
  actionFailure,
  runAction,
  type ActionFailure,
} from "@/lib/actions/action-result";
import { requireMutationCount } from "@/lib/db/workspace-mutations";

type ActionResult = ActionFailure | { success?: string } | null;

const MANAGEABLE_ROLES: WorkspaceRole[] = ["admin", "member"];

async function requireTeamManager() {
  return requirePermission("manage_team");
}

export async function inviteMemberAction(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await requireTeamManager();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const role = formData.get("role") as WorkspaceRole;

    if (!email) {
      return actionFailure("Email is required");
    }
    if (!isValidEmail(email)) {
      return actionFailure("Enter a valid email address");
    }
    if (!MANAGEABLE_ROLES.includes(role)) {
      return actionFailure("Role must be admin or member");
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const name = email.split("@")[0] ?? email;
      user = await prisma.user.create({
        data: { email, name },
      });
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: ctx.workspaceId,
        },
      },
    });
    if (existing) {
      if (existing.status === "pending") {
        return actionFailure("An invitation is already pending for this email");
      }
      return actionFailure("This person is already a workspace member");
    }

    let clerkInvitationId: string | null = null;
    let memberStatus: "pending" | "active" = "active";

    if (isClerkConfigured()) {
      try {
        const invitation = await sendWorkspaceClerkInvitation({
          email,
          workspaceId: ctx.workspaceId,
          role,
        });
        clerkInvitationId = invitation?.invitationId ?? null;
        memberStatus = user.clerkId ? "active" : "pending";
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to send Clerk invitation email";
        return actionFailure(message);
      }
    }

    await prisma.workspaceMember.create({
      data: {
        workspaceId: ctx.workspaceId,
        userId: user.id,
        role,
        status: memberStatus,
        clerkInvitationId,
        canCreateMessages: role === "admin",
      },
    });

    revalidatePath("/settings/team");

    if (memberStatus === "pending") {
      return {
        success: `Invitation email sent to ${email}. They'll get access after signing up.`,
      };
    }

    return { success: `Added ${email} as ${role}` };
  });
}

export async function updateMemberRoleAction(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await requireTeamManager();
    const memberId = formData.get("memberId") as string;
    const role = formData.get("role") as WorkspaceRole;

    if (!memberId) {
      return actionFailure("Member is required");
    }
    if (!MANAGEABLE_ROLES.includes(role)) {
      return actionFailure("Role must be admin or member");
    }

    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId: ctx.workspaceId, status: "active" },
    });
    if (!member) {
      return actionFailure("Member not found");
    }
    if (member.role === "owner") {
      return actionFailure("Cannot change the workspace owner role");
    }
    if (member.userId === ctx.userId) {
      return actionFailure("You cannot change your own role");
    }

    const updated = await prisma.workspaceMember.updateMany({
      where: {
        id: memberId,
        workspaceId: ctx.workspaceId,
        role: { not: "owner" },
        status: "active",
      },
      data: {
        role,
        canCreateMessages: role === "admin" ? true : member.canCreateMessages,
      },
    });

    const check = requireMutationCount(updated, "Member");
    if (!check.ok) return actionFailure(check.error);

    revalidatePath("/settings/team");
    return null;
  });
}

export async function removeMemberAction(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await requireTeamManager();
    const memberId = formData.get("memberId") as string;

    if (!memberId) {
      return actionFailure("Member is required");
    }

    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId: ctx.workspaceId },
    });
    if (!member) {
      return actionFailure("Member not found");
    }
    if (member.role === "owner") {
      return actionFailure("Cannot remove the workspace owner");
    }
    if (member.userId === ctx.userId) {
      return actionFailure("You cannot remove yourself");
    }

    if (member.clerkInvitationId) {
      await revokeClerkInvitation(member.clerkInvitationId);
    }

    const deleted = await prisma.workspaceMember.deleteMany({
      where: {
        id: memberId,
        workspaceId: ctx.workspaceId,
        role: { not: "owner" },
      },
    });

    const check = requireMutationCount(deleted, "Member");
    if (!check.ok) return actionFailure(check.error);

    revalidatePath("/settings/team");
    return null;
  });
}

export async function inviteMemberFormAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return inviteMemberAction(formData);
}

export async function updateMemberRoleFormAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return updateMemberRoleAction(formData);
}

export async function removeMemberFormAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return removeMemberAction(formData);
}
