"use client";

import { useState, useTransition } from "react";
import { updateScheduledMessageAction } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { FormActionError } from "@/components/ui/form-action-error";
import { getActionError } from "@/lib/actions/action-result";

type ListOption = {
  id: string;
  name: string;
  contactCount: number;
};

type EditScheduledMessageFormProps = {
  messageId: string;
  initialName: string;
  initialBody: string;
  initialListId: string;
  initialScheduledAt: string;
  lists: ListOption[];
};

function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EditScheduledMessageForm({
  messageId,
  initialName,
  initialBody,
  initialListId,
  initialScheduledAt,
  lists,
}: EditScheduledMessageFormProps) {
  const [name, setName] = useState(initialName);
  const [body, setBody] = useState(initialBody);
  const [listId, setListId] = useState(initialListId);
  const [scheduledAt, setScheduledAt] = useState(initialScheduledAt);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateScheduledMessageAction({
        messageId,
        name,
        listId,
        body,
        scheduledAt,
      });

      const message = getActionError(result);
      if (message) {
        setError(message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormActionError error={error} />

      <div>
        <label
          htmlFor="message-name"
          className="block text-sm font-medium text-gray-700"
        >
          Message name
        </label>
        <input
          id="message-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label
          htmlFor="message-list"
          className="block text-sm font-medium text-gray-700"
        >
          List
        </label>
        <select
          id="message-list"
          value={listId}
          onChange={(event) => setListId(event.target.value)}
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name} ({list.contactCount} contacts)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="message-body"
          className="block text-sm font-medium text-gray-700"
        >
          Message body
        </label>
        <textarea
          id="message-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label
          htmlFor="scheduled-at"
          className="block text-sm font-medium text-gray-700"
        >
          Scheduled date & time
        </label>
        <input
          id="scheduled-at"
          type="datetime-local"
          value={scheduledAt}
          onChange={(event) => setScheduledAt(event.target.value)}
          required
          className="mt-1 block w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save schedule"}
        </Button>
        <Button href={`/messages/${messageId}`} variant="secondary">
          Cancel
        </Button>
      </div>
    </form>
  );
}

export { toDatetimeLocalValue };
