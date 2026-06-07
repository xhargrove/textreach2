import { redirect } from "next/navigation";
import type { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  getActiveWorkspaceSelection,
  resolveMembershipForUser,
  setActiveWorkspaceSelection,
} from "@/lib/auth/active-workspace";
import { isLegacyAuthAllowed } from "@/lib/production-guards";
import {
  DEMO_USER_EMAIL,
  DEMO_WORKSPACE_NAME,
} from "@/lib/auth/constants";
import { isClerkConfigured } from "@/lib/auth/clerk-config";
import { ensureAppUser } from "@/lib/auth/sync-user";
import {
  canCreateMessages,
  roleHasPermission,
  type Permission,
} from "@/lib/auth/permissions";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth/errors";
import type { User, WorkspaceMember } from "@prisma/client";
import type { WorkspaceWithRelations } from "@/lib/workspace";

export type AuthContext = {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  canCreateMessages: boolean;
  user: User;
  workspace: WorkspaceWithRelations;
  membership: WorkspaceMember;
};

async function loadMembership(
  userId: string,
  workspaceId: string
): Promise<(AuthContext & { membership: WorkspaceMember }) | null> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
    include: {
      user: true,
      workspace: { include: { owner: true, billingAccount: true } },
    },
  });

  if (!membership || membership.status !== "active") return null;

  return {
    userId: membership.userId,
    workspaceId: membership.workspaceId,
    role: membership.role,
    canCreateMessages: canCreateMessages(
      membership.role,
      membership.canCreateMessages
    ),
    user: membership.user,
    workspace: membership.workspace,
    membership,
  };
}

async function getDemoAuthContext(): Promise<AuthContext | null> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
  });
  if (!user) return null;

  const workspace = await prisma.workspace.findFirst({
    where: { name: DEMO_WORKSPACE_NAME },
    include: { owner: true, billingAccount: true },
  });
  if (!workspace) return null;

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: user.id, workspaceId: workspace.id },
    },
  });
  if (!membership) return null;

  return {
    userId: user.id,
    workspaceId: workspace.id,
    role: membership.role,
    canCreateMessages: canCreateMessages(
      membership.role,
      membership.canCreateMessages
    ),
    user,
    workspace,
    membership,
  };
}

export async function getAuthContext(): Promise<AuthContext | null> {
  if (isClerkConfigured()) {
    const ensured = await ensureAppUser();
    if (!ensured) return null;
    return loadMembership(ensured.user.id, ensured.membership.workspaceId);
  }

  const session = isLegacyAuthAllowed() ? await getSession() : null;
  if (session) {
    const preferred = await getActiveWorkspaceSelection();
    const workspaceId =
      preferred?.userId === session.userId
        ? preferred.workspaceId
        : session.workspaceId;

    const membership = await resolveMembershipForUser(
      session.userId,
      workspaceId
    );

    if (membership) {
      try {
        await setActiveWorkspaceSelection(session.userId, membership.workspaceId);
      } catch {
        // Ignore when SESSION_SECRET is unavailable.
      }
      const ctx = await loadMembership(session.userId, membership.workspaceId);
      if (ctx) return ctx;
    }
  }

  if (!isClerkConfigured() && process.env.NODE_ENV === "development") {
    return getDemoAuthContext();
  }

  return null;
}

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new UnauthorizedError();
  }
  return ctx;
}

export async function requirePermission(
  permission: Permission
): Promise<AuthContext> {
  const ctx = await requireAuthContext();
  if (!roleHasPermission(ctx.role, permission)) {
    throw new ForbiddenError();
  }
  return ctx;
}

export async function requireCanCreateMessages(): Promise<AuthContext> {
  const ctx = await requireAuthContext();
  if (!ctx.canCreateMessages) {
    throw new ForbiddenError();
  }
  return ctx;
}

export async function requirePageCanCreateMessages(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }
  if (!ctx.canCreateMessages) {
    redirect("/forbidden");
  }
  return ctx;
}

export async function requirePagePermission(
  permission: Permission
): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }
  if (!roleHasPermission(ctx.role, permission)) {
    redirect("/forbidden");
  }
  return ctx;
}
