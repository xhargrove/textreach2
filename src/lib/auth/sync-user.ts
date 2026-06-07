import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { isClerkConfigured } from "@/lib/auth/clerk-config";
import {
  getActiveWorkspaceSelection,
  resolveMembershipForUser,
  setActiveWorkspaceSelection,
} from "@/lib/auth/active-workspace";
import type { User, WorkspaceMember } from "@prisma/client";

export type EnsuredUser = {
  user: User;
  membership: WorkspaceMember;
};

async function createWorkspaceForUser(user: User): Promise<WorkspaceMember> {
  const baseName = user.name?.split(" ")[0] ?? "My";
  const workspace = await prisma.workspace.create({
    data: {
      name: `${baseName}'s Workspace`,
      ownerId: user.id,
      plan: "starter",
      members: {
        create: {
          userId: user.id,
          role: "owner",
          canCreateMessages: true,
          status: "active",
        },
      },
      billingAccount: {
        create: {
          plan: "starter",
          status: "trialing",
        },
      },
    },
  });

  return prisma.workspaceMember.findUniqueOrThrow({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
  });
}

async function resolvePreferredWorkspaceId(userId: string): Promise<string | null> {
  const activeSelection = await getActiveWorkspaceSelection();
  if (activeSelection?.userId === userId) {
    return activeSelection.workspaceId;
  }

  const session = await getSession();
  if (session?.userId === userId) {
    return session.workspaceId;
  }

  return null;
}

export async function ensureAppUser(): Promise<EnsuredUser | null> {
  if (!isClerkConfigured()) return null;

  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses.find(
      (entry) => entry.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("Clerk account must have an email address.");
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    null;

  let user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { clerkId, name: name ?? byEmail.name },
      });

      await prisma.workspaceMember.updateMany({
        where: { userId: byEmail.id, status: "pending" },
        data: { status: "active" },
      });
    }
  }

  if (!user) {
    user = await prisma.user.create({
      data: { clerkId, email, name },
    });
  } else if (name && user.name !== name) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });
  }

  if (user.clerkId) {
    await prisma.workspaceMember.updateMany({
      where: { userId: user.id, status: "pending" },
      data: { status: "active" },
    });
  }

  const preferredWorkspaceId = await resolvePreferredWorkspaceId(user.id);
  let membership = await resolveMembershipForUser(user.id, preferredWorkspaceId);

  if (!membership) {
    membership = await createWorkspaceForUser(user);
  }

  if (membership.status === "active") {
    try {
      await setActiveWorkspaceSelection(user.id, membership.workspaceId);
    } catch {
      // SESSION_SECRET may be unset in local dev without workspace switching.
    }
  }

  return { user, membership };
}
