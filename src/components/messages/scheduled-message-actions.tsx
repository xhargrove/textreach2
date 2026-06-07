"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { cancelScheduledMessageAction } from "@/lib/actions/messages";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ScheduledMessageActionsProps = {
  messageId: string;
  messageName: string;
  canManage?: boolean;
};

export function ScheduledMessageActions({
  messageId,
  messageName,
  canManage = false,
}: ScheduledMessageActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/messages/${messageId}`}
          className="min-h-[44px] text-sm font-medium leading-[44px] text-brand-600 hover:text-brand-700 sm:min-h-0 sm:leading-normal"
        >
          View
        </Link>
        {canManage && (
          <>
            <Link
              href={`/messages/${messageId}/edit`}
              className="min-h-[44px] text-sm font-medium leading-[44px] text-gray-700 hover:text-gray-900 sm:min-h-0 sm:leading-normal"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="min-h-[44px] text-sm font-medium leading-[44px] text-red-600 hover:text-red-700 sm:min-h-0 sm:leading-normal"
              aria-label={`Cancel schedule for ${messageName}`}
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {canManage && (
        <>
          <form ref={formRef} action={cancelScheduledMessageAction} className="hidden">
            <input type="hidden" name="messageId" value={messageId} />
          </form>

          <ConfirmDialog
            open={confirmOpen}
            title="Cancel scheduled send?"
            description={
              <>
                <strong>{messageName}</strong> will be moved back to drafts and will
                not send automatically.
              </>
            }
            confirmLabel="Cancel schedule"
            variant="danger"
            onConfirm={() => formRef.current?.requestSubmit()}
            onCancel={() => setConfirmOpen(false)}
          />
        </>
      )}
    </>
  );
}
