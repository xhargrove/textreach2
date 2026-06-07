"use client";

import { useFormState } from "react-dom";
import { createListAction, updateListAction } from "@/lib/actions/lists";
import { Button } from "@/components/ui/button";
import { FormActionError } from "@/components/ui/form-action-error";
import { getActionError } from "@/lib/actions/action-result";

type ListFormProps = {
  mode: "create" | "edit";
  defaultValues?: {
    listId?: string;
    name?: string;
    description?: string | null;
  };
};

export function ListForm({ mode, defaultValues }: ListFormProps) {
  const action = mode === "create" ? createListAction : updateListAction;
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && defaultValues?.listId && (
        <input type="hidden" name="listId" value={defaultValues.listId} />
      )}

      <FormActionError error={getActionError(state)} />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          List name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ""}
          placeholder="e.g. VIP List, Event Attendees"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Who is on this list and when do you message them?"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit">
          {mode === "create" ? "Create List" : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          href={
            mode === "edit" && defaultValues?.listId
              ? `/lists/${defaultValues.listId}`
              : "/lists"
          }
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
