import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  signSessionCookie,
  verifySessionCookie,
} from "@/lib/auth/session-cookie";
import { getSessionSecret } from "@/lib/auth/session-secret";
import type { Session } from "@/lib/auth/session";

export const ACTIVE_WORKSPACE_COOKIE = "textreach_workspace";

export async function getActiveWorkspaceSelection(): Promise<Session | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  const cookieStore = await cookies();
  const raw = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  if (!raw) return null;

  return verifySessionCookie(raw);
}

export async function setActiveWorkspaceSelection(
  userId: string,
  workspaceId: string
): Promise<void> {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error(
      "SESSION_SECRET must be set to at least 32 characters to switch workspaces."
    );
  }

  const cookieStore = await cookies();
  const value = await signSessionCookie({ userId, workspaceId });

  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearActiveWorkspaceSelection(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_WORKSPACE_COOKIE);
}

export async function resolveMembershipForUser(
  userId: string,
  preferredWorkspaceId?: string | null
) {
  if (preferredWorkspaceId) {
    const preferred = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId: preferredWorkspaceId,
        status: "active",
      },
    });
    if (preferred) return preferred;
  }

  return prisma.workspaceMember.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "asc" },
  });
}

export async function listActiveWorkspacesForUser(userId: string) {
  return prisma.workspaceMember.findMany({
    where: { userId, status: "active" },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
}
