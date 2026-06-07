"use client";

import { useFormState } from "react-dom";
import {
  createKeywordAction,
  updateKeywordAction,
} from "@/lib/actions/keywords";
import { Button } from "@/components/ui/button";
import { FormActionError } from "@/components/ui/form-action-error";
import { getActionError } from "@/lib/actions/action-result";
import { KEYWORD_COMPLIANCE_FOOTER } from "@/lib/keywords/auto-reply";

type ListOption = { id: string; name: string };

type KeywordFormProps = {
  mode: "create" | "edit";
  lists: ListOption[];
  defaultValues?: {
    keywordId?: string;
    keyword?: string;
    listId?: string | null;
    autoReply?: string | null;
    status?: "active" | "inactive";
  };
};

export function KeywordForm({ mode, lists, defaultValues }: KeywordFormProps) {
  const action = mode === "create" ? createKeywordAction : updateKeywordAction;
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      {mode === "edit" && defaultValues?.keywordId && (
        <input type="hidden" name="keywordId" value={defaultValues.keywordId} />
      )}

      <FormActionError error={getActionError(state)} />

      <div>
        <label
          htmlFor="keyword"
          className="block text-sm font-medium text-gray-700"
        >
          Keyword <span className="text-red-500">*</span>
        </label>
        <input
          id="keyword"
          name="keyword"
          type="text"
          required
          defaultValue={defaultValues?.keyword ?? ""}
          placeholder="e.g. VINYL, FRIDAY, JOIN"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          onChange={(e) => {
            e.target.value = e.target.value.toUpperCase().replace(/\s/g, "");
          }}
        />
        <p className="mt-1 text-xs text-gray-500">
          People text this word to join the list. Letters and numbers only — no
          spaces.
        </p>
      </div>

      <div>
        <label
          htmlFor="listId"
          className="block text-sm font-medium text-gray-700"
        >
          Assign to list
        </label>
        <select
          id="listId"
          name="listId"
          defaultValue={defaultValues?.listId ?? ""}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">No list (auto-reply only)</option>
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="autoReply"
          className="block text-sm font-medium text-gray-700"
        >
          Auto-reply message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="autoReply"
          name="autoReply"
          rows={4}
          required
          defaultValue={defaultValues?.autoReply ?? ""}
          placeholder="You're on the list. We'll send updates here."
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Sent automatically when someone texts the keyword. Compliance footer
          appended if missing: &ldquo;{KEYWORD_COMPLIANCE_FOOTER}&rdquo;
        </p>
      </div>

      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700"
        >
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "active"}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex gap-3">
        <Button type="submit">
          {mode === "create" ? "Create Keyword" : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          href={
            mode === "edit" && defaultValues?.keywordId
              ? `/keywords/${defaultValues.keywordId}`
              : "/keywords"
          }
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
