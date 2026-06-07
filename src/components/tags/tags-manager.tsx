"use client";

import { useFormState } from "react-dom";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTagAction,
  updateTagAction,
  deleteTagSimpleAction,
} from "@/lib/actions/tags";
import { TAG_COLORS } from "@/lib/queries/tags";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormActionError } from "@/components/ui/form-action-error";
import { getActionError } from "@/lib/actions/action-result";

type TagItem = {
  id: string;
  name: string;
  color: string;
  _count: { contactTags: number };
};

type ActionState = { error?: string; success?: string } | null;

type TagsManagerProps = {
  tags: TagItem[];
  compact?: boolean;
  readOnly?: boolean;
};

export function TagsManager({
  tags,
  compact = false,
  readOnly = false,
}: TagsManagerProps) {
  const router = useRouter();
  const [createState, createAction] = useFormState(createTagAction, null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (createState && "success" in createState && createState.success) {
      setShowCreate(false);
      router.refresh();
    }
  }, [createState, router]);

  if (readOnly) {
    return (
      <div className="space-y-2">
        {compact ? (
          <h3 className="text-sm font-semibold text-gray-900">Tags</h3>
        ) : null}
        {tags.length === 0 ? (
          <p className="text-sm text-gray-500">No tags yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag.id}>
                <Badge variant="info">{tag.name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
            <p className="mt-1 text-sm text-gray-500">
              Label contacts to stay organized. Tags can be assigned from
              contacts too.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setShowCreate(true);
              setEditingId(null);
            }}
          >
            Create Tag
          </Button>
        </div>
      )}

      {compact && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Tags</h3>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            + New tag
          </button>
        </div>
      )}

      {createState && "success" in createState && createState.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {createState.success}
        </div>
      )}
      <FormActionError error={getActionError(createState)} />

      {showCreate && (
        <TagInlineForm
          mode="create"
          formAction={createAction}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {tags.length === 0 && !showCreate ? (
        <p className="text-sm text-gray-500">
          No tags yet. Create one to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {tags.map((tag) =>
            editingId === tag.id ? (
              <li key={tag.id}>
                <TagEditForm tag={tag} onDone={() => setEditingId(null)} />
              </li>
            ) : (
              <li
                key={tag.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <Badge variant="info">{tag.name}</Badge>
                  <span className="text-xs text-gray-400">
                    {tag._count.contactTags} contact
                    {tag._count.contactTags === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(tag.id);
                      setShowCreate(false);
                    }}
                    className="text-xs font-medium text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <form action={deleteTagSimpleAction}>
                    <input type="hidden" name="tagId" value={tag.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

function TagInlineForm({
  mode,
  formAction,
  onCancel,
  defaultValues,
  state,
}: {
  mode: "create" | "edit";
  formAction: (payload: FormData) => void;
  onCancel?: () => void;
  defaultValues?: { tagId?: string; name?: string; color?: string };
  state?: ActionState;
}) {
  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      {defaultValues?.tagId && (
        <input type="hidden" name="tagId" value={defaultValues.tagId} />
      )}
      <FormActionError error={getActionError(state)} />
      {state && "success" in state && state.success && (
        <p className="text-sm text-green-800">{state.success}</p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="name"
          type="text"
          required
          placeholder="Tag name"
          defaultValue={defaultValues?.name ?? ""}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          name="color"
          defaultValue={defaultValues?.color ?? TAG_COLORS[0]}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          aria-label="Tag color"
        >
          {TAG_COLORS.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          {mode === "create" ? "Create" : "Save"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function TagEditForm({
  tag,
  onDone,
}: {
  tag: TagItem;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useFormState(updateTagAction, null);

  useEffect(() => {
    if (state && "success" in state && state.success) {
      onDone();
      router.refresh();
    }
  }, [state, onDone, router]);

  return (
    <TagInlineForm
      mode="edit"
      formAction={formAction}
      state={state}
      onCancel={onDone}
      defaultValues={{ tagId: tag.id, name: tag.name, color: tag.color }}
    />
  );
}
