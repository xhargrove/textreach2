"use client";

import { useFormState } from "react-dom";
import type { WorkspaceRole } from "@prisma/client";
import {
  removeMemberFormAction,
  updateMemberRoleFormAction,
} from "@/lib/actions/team";
import { getActionError } from "@/lib/actions/action-result";
import { Button } from "@/components/ui/button";

type TeamMemberRoleSelectProps = {
  memberId: string;
  role: WorkspaceRole;
};

export function TeamMemberRoleSelect({
  memberId,
  role,
}: TeamMemberRoleSelectProps) {
  const [state, formAction] = useFormState(updateMemberRoleFormAction, null);

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="memberId" value={memberId} />
        <select
          name="role"
          defaultValue={role}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
      </form>
      {getActionError(state) && (
        <p className="mt-1 max-w-xs text-xs text-red-600">{getActionError(state)}</p>
      )}
    </div>
  );
}

type TeamMemberRemoveButtonProps = {
  memberId: string;
};

export function TeamMemberRemoveButton({ memberId }: TeamMemberRemoveButtonProps) {
  const [state, formAction] = useFormState(removeMemberFormAction, null);

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="memberId" value={memberId} />
        <Button type="submit" variant="ghost" size="sm">
          Remove
        </Button>
      </form>
      {getActionError(state) && (
        <p className="mt-1 max-w-xs text-right text-xs text-red-600">
          {getActionError(state)}
        </p>
      )}
    </div>
  );
}
