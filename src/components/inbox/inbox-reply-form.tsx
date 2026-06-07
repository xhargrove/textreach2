"use client";

import { useState, useTransition } from "react";
import { sendInboxReplyAction } from "@/lib/actions/inbox";
import { Button } from "@/components/ui/button";
import { FormActionError } from "@/components/ui/form-action-error";
import { getActionError } from "@/lib/actions/action-result";

type InboxReplyFormProps = {
  contactId: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function InboxReplyForm({
  contactId,
  disabled = false,
  disabledReason,
}: InboxReplyFormProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await sendInboxReplyAction(contactId, body);
      const message = getActionError(result);
      if (message) {
        setError(message);
        return;
      }
      setBody("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white p-4"
    >
      <FormActionError error={error} className="mb-3" />
      {disabled && disabledReason && (
        <div className="mb-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
          {disabledReason}
        </div>
      )}
      <div className="flex gap-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Type your reply…"
          disabled={disabled || isPending}
          className="block flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50"
        />
        <Button type="submit" disabled={disabled || isPending || !body.trim()}>
          {isPending ? "Sending…" : "Send"}
        </Button>
      </div>
    </form>
  );
}
