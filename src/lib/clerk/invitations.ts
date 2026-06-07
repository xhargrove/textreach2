import { clerkClient } from "@clerk/nextjs/server";
import type { WorkspaceRole } from "@prisma/client";
import { getAppBaseUrl } from "@/lib/app-url";
import { isClerkConfigured } from "@/lib/auth/clerk-config";

export type WorkspaceInviteMetadata = {
  workspaceId: string;
  role: WorkspaceRole;
  invitedAs: "workspace_member";
};

export function getClerkWebhookSigningSecret(): string | null {
  return (
    process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim() ||
    process.env.CLERK_WEBHOOK_SECRET?.trim() ||
    null
  );
}

export async function sendWorkspaceClerkInvitation(input: {
  email: string;
  workspaceId: string;
  role: WorkspaceRole;
}): Promise<{ invitationId: string } | null> {
  if (!isClerkConfigured()) {
    return null;
  }

  const baseUrl = getAppBaseUrl();
  const client = await clerkClient();
  const invitation = await client.invitations.createInvitation({
    emailAddress: input.email,
    redirectUrl: `${baseUrl}/sign-up`,
    publicMetadata: {
      workspaceId: input.workspaceId,
      role: input.role,
      invitedAs: "workspace_member",
    } satisfies WorkspaceInviteMetadata,
  });

  return { invitationId: invitation.id };
}

export async function revokeClerkInvitation(invitationId: string): Promise<void> {
  if (!isClerkConfigured() || !invitationId) return;
  try {
    const client = await clerkClient();
    await client.invitations.revokeInvitation(invitationId);
  } catch {
    // Invitation may already be accepted or revoked.
  }
}
