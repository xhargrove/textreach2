"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import {
  assignTagToContactAction,
  removeTagFromContactAction,
  createTagAndAssignAction,
} from "@/lib/actions/tags";
import { TAG_COLORS } from "@/lib/queries/tags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormActionError } from "@/components/ui/form-action-error";
import { getActionError } from "@/lib/actions/action-result";

type TagOption = {
  id: string;
  name: string;
  color: string;
};

type ContactTagsEditorProps = {
  contactId: string;
  assignedTags: TagOption[];
  availableTags: TagOption[];
  readOnly?: boolean;
};

export function ContactTagsEditor({
  contactId,
  assignedTags,
  availableTags,
  readOnly = false,
}: ContactTagsEditorProps) {
  const [showNew, setShowNew] = useState(false);
  const [createState, createAction] = useFormState(createTagAndAssignAction, null);

  const unassigned = availableTags.filter(
    (t) => !assignedTags.some((a) => a.id === t.id)
  );

  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-2">
        {assignedTags.length === 0 ? (
          <p className="text-sm text-gray-500">No tags assigned</p>
        ) : (
          assignedTags.map((tag) => (
            <Badge key={tag.id} variant="info">
              {tag.name}
            </Badge>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {assignedTags.length === 0 ? (
          <p className="text-sm text-gray-500">No tags assigned</p>
        ) : (
          assignedTags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-1">
              <Badge variant="info">{tag.name}</Badge>
              <form action={removeTagFromContactAction}>
                <input type="hidden" name="contactId" value={contactId} />
                <input type="hidden" name="tagId" value={tag.id} />
                <button
                  type="submit"
                  className="ml-1 text-xs text-gray-400 hover:text-red-600"
                  aria-label={`Remove ${tag.name}`}
                >
                  ×
                </button>
              </form>
            </div>
          ))
        )}
      </div>

      {unassigned.length > 0 && (
        <form action={assignTagToContactAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="contactId" value={contactId} />
          <div>
            <label htmlFor="assign-tag" className="sr-only">
              Assign tag
            </label>
            <select
              id="assign-tag"
              name="tagId"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Add existing tag...
              </option>
              {unassigned.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" size="sm" variant="secondary">
            Assign
          </Button>
        </form>
      )}

      {!showNew ? (
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          + Create and assign new tag
        </button>
      ) : (
        <form action={createAction} className="space-y-3 rounded-lg border border-gray-200 p-4">
          <input type="hidden" name="contactId" value={contactId} />
          <FormActionError error={getActionError(createState)} />
          {createState && "success" in createState && createState.success && (
            <p className="text-sm text-green-800">{createState.success}</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              name="name"
              type="text"
              required
              placeholder="New tag name"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              name="color"
              defaultValue={TAG_COLORS[0]}
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
              Create & Assign
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNew(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
