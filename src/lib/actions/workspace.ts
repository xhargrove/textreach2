"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuthContext } from "@/lib/auth/authorization";
import {
  listActiveWorkspacesForUser,
  setActiveWorkspaceSelection,
} from "@/lib/auth/active-workspace";
import {
  actionFailure,
  runAction,
  type ActionFailure,
} from "@/lib/actions/action-result";

export async function listUserWorkspacesAction() {
  return runAction(async () => {
    const ctx = await requireAuthContext();
    const memberships = await listActiveWorkspacesForUser(ctx.userId);
    return {
      ok: true as const,
      workspaces: memberships.map((membership) => ({
        id: membership.workspaceId,
        name: membership.workspace.name,
        role: membership.role,
      })),
      activeWorkspaceId: ctx.workspaceId,
    };
  });
}

export async function switchWorkspaceAction(
  workspaceId: string
): Promise<ActionFailure | { ok: true; workspaceId: string }> {
  return runAction(async () => {
    const ctx = await requireAuthContext();

    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: ctx.userId,
        workspaceId,
        status: "active",
      },
    });

    if (!membership) {
      return actionFailure("You do not have access to that workspace");
    }

    await setActiveWorkspaceSelection(ctx.userId, workspaceId);
    revalidatePath("/", "layout");
    return { ok: true, workspaceId };
  });
}

export async function switchWorkspaceFormAction(formData: FormData) {
  const workspaceId = formData.get("workspaceId");
  if (typeof workspaceId !== "string" || !workspaceId.trim()) {
    redirect("/dashboard?error=workspace");
  }

  const result = await switchWorkspaceAction(workspaceId);
  if ("ok" in result && result.ok === false) {
    redirect(`/dashboard?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard");
}
