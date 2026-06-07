"use client";

import { useFormState } from "react-dom";
import { inviteMemberFormAction } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { getActionError } from "@/lib/actions/action-result";
import { FormActionError } from "@/components/ui/form-action-error";

export function InviteMemberForm() {
  const [state, formAction] = useFormState(inviteMemberFormAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <FormActionError error={getActionError(state)} className="sm:col-span-full" />
      {state && "success" in state && state.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 sm:col-span-full">
          {state.success}
        </div>
      )}
      <div className="flex-1">
        <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          placeholder="teammate@company.com"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          id="invite-role"
          name="role"
          defaultValue="member"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <Button type="submit" size="sm">
        Invite member
      </Button>
    </form>
  );
}
