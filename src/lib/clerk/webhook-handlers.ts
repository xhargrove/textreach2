import type { WebhookEvent } from "@clerk/nextjs/server";
import type { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { setActiveWorkspaceSelection } from "@/lib/auth/active-workspace";
import type { WorkspaceInviteMetadata } from "@/lib/clerk/invitations";

function primaryEmailFromUser(data: {
  email_addresses?: { id: string; email_address: string }[];
  primary_email_address_id?: string | null;
}): string | null {
  const emails = data.email_addresses ?? [];
  const primary = emails.find(
    (entry) => entry.id === data.primary_email_address_id
  );
  return (
    primary?.email_address ??
    emails[0]?.email_address ??
    null
  )?.toLowerCase() ?? null;
}

function nameFromUser(data: {
  first_name?: string | null;
  last_name?: string | null;
}): string | null {
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
  return name || null;
}

async function upsertUserFromClerk(data: {
  id: string;
  email_addresses?: { id: string; email_address: string }[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}) {
  const email = primaryEmailFromUser(data);
  if (!email) return null;

  const name = nameFromUser(data);
  let user = await prisma.user.findUnique({ where: { clerkId: data.id } });

  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { clerkId: data.id, name: name ?? byEmail.name },
      });
    }
  }

  if (!user) {
    user = await prisma.user.create({
      data: { clerkId: data.id, email, name },
    });
  } else if (name && user.name !== name) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });
  }

  return user;
}

async function activatePendingMemberships(userId: string, email: string) {
  await prisma.workspaceMember.updateMany({
    where: {
      userId,
      status: "pending",
    },
    data: { status: "active" },
  });

  const placeholderUsers = await prisma.user.findMany({
    where: {
      email,
      NOT: { id: userId },
      clerkId: null,
    },
    select: { id: true },
  });

  for (const placeholder of placeholderUsers) {
    const pendingMemberships = await prisma.workspaceMember.findMany({
      where: { userId: placeholder.id, status: "pending" },
    });

    for (const membership of pendingMemberships) {
      const duplicate = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: membership.workspaceId,
          },
        },
      });

      if (duplicate) {
        await prisma.workspaceMember.delete({ where: { id: membership.id } });
        continue;
      }

      await prisma.workspaceMember.update({
        where: { id: membership.id },
        data: { userId, status: "active" },
      });
    }

    await prisma.user.delete({ where: { id: placeholder.id } }).catch(() => undefined);
  }
}

async function activateMembershipFromMetadata(
  userId: string,
  metadata: WorkspaceInviteMetadata | null | undefined
) {
  if (!metadata?.workspaceId || metadata.invitedAs !== "workspace_member") {
    return;
  }

  await prisma.workspaceMember.updateMany({
    where: {
      workspaceId: metadata.workspaceId,
      userId,
    },
    data: {
      status: "active",
      role: metadata.role as WorkspaceRole,
      canCreateMessages: metadata.role === "admin",
    },
  });

  await setActiveWorkspaceSelection(userId, metadata.workspaceId).catch(() => undefined);
}

export async function handleClerkWebhookEvent(event: WebhookEvent): Promise<void> {
  switch (event.type) {
    case "user.created": {
      const data = event.data;
      const user = await upsertUserFromClerk(data);
      if (!user) return;

      const email = primaryEmailFromUser(data);
      if (email) {
        await activatePendingMemberships(user.id, email);
      }

      const metadata = data.public_metadata as WorkspaceInviteMetadata | undefined;
      await activateMembershipFromMetadata(user.id, metadata);
      break;
    }

    case "user.updated": {
      const user = await upsertUserFromClerk(event.data);
      if (!user) return;
      const email = primaryEmailFromUser(event.data);
      if (email) {
        await activatePendingMemberships(user.id, email);
      }
      break;
    }

    default:
      break;
  }
}
