"use client";

import { useTransition } from "react";
import { switchWorkspaceFormAction } from "@/lib/actions/workspace";
import { roleLabel } from "@/lib/auth/permissions";
import type { WorkspaceRole } from "@prisma/client";

type WorkspaceOption = {
  id: string;
  name: string;
  role: WorkspaceRole;
};

type WorkspaceSwitcherProps = {
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string;
};

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: WorkspaceSwitcherProps) {
  const [pending, startTransition] = useTransition();

  if (workspaces.length <= 1) {
    return null;
  }

  return (
    <form
      action={(formData) => {
        startTransition(() => switchWorkspaceFormAction(formData));
      }}
      className="flex items-center gap-2"
    >
      <label htmlFor="workspace-switcher" className="sr-only">
        Switch workspace
      </label>
      <select
        id="workspace-switcher"
        name="workspaceId"
        defaultValue={activeWorkspaceId}
        disabled={pending}
        onChange={(event) => {
          event.currentTarget.form?.requestSubmit();
        }}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name} ({roleLabel(workspace.role)})
          </option>
        ))}
      </select>
    </form>
  );
}
