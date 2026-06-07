"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { deleteMessageSimpleAction } from "@/lib/actions/messages";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type MessageRowActionsProps = {
  messageId: string;
  messageName: string;
  status: string;
  canManage?: boolean;
};

export function MessageRowActions({
  messageId,
  messageName,
  status,
  canManage = false,
}: MessageRowActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const canDelete = canManage && (status === "draft" || status === "scheduled");

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/messages/${messageId}`}
          className="min-h-[44px] text-sm font-medium leading-[44px] text-brand-600 hover:text-brand-700 sm:min-h-0 sm:leading-normal"
        >
          View
        </Link>
        {canDelete && (
          <>
            {status === "scheduled" && (
              <Link
                href={`/messages/${messageId}/edit`}
                className="min-h-[44px] text-sm font-medium leading-[44px] text-gray-700 hover:text-gray-900 sm:min-h-0 sm:leading-normal"
              >
                Edit
              </Link>
            )}
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="min-h-[44px] text-sm font-medium leading-[44px] text-red-600 hover:text-red-700 sm:min-h-0 sm:leading-normal"
              aria-label={`Delete ${messageName}`}
            >
              Delete
            </button>
          </>
        )}
      </div>

      {canDelete && (
        <>
          <form ref={formRef} action={deleteMessageSimpleAction} className="hidden">
            <input type="hidden" name="messageId" value={messageId} />
          </form>

          <ConfirmDialog
            open={confirmOpen}
            title="Delete message?"
            description={
              <>
                This will permanently delete <strong>{messageName}</strong>. This
                cannot be undone.
              </>
            }
            confirmLabel="Delete message"
            variant="danger"
            onConfirm={() => formRef.current?.requestSubmit()}
            onCancel={() => setConfirmOpen(false)}
          />
        </>
      )}
    </>
  );
}
