"use client";

import { SignOutButton } from "@clerk/nextjs";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import type { WorkspaceRole } from "@prisma/client";

type WorkspaceOption = {
  id: string;
  name: string;
  role: WorkspaceRole;
};

type AppWorkspaceBarProps = {
  workspaceName: string;
  userName: string | null;
  useClerk: boolean;
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string;
};

export function AppWorkspaceBar({
  workspaceName,
  userName,
  useClerk,
  workspaces,
  activeWorkspaceId,
}: AppWorkspaceBarProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Workspace
          </p>
          <p className="text-sm font-semibold text-gray-900">{workspaceName}</p>
          {userName && (
            <p className="text-xs text-gray-500">Signed in as {userName}</p>
          )}
        </div>
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
        />
      </div>
      {useClerk ? (
        <SignOutButton redirectUrl="/">
          <Button type="button" variant="ghost" size="sm">
            Log out
          </Button>
        </SignOutButton>
      ) : (
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Log out
          </Button>
        </form>
      )}
    </div>
  );
}
