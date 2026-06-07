"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { deleteContactSimpleAction } from "@/lib/actions/contacts";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ContactRowActionsProps = {
  contactId: string;
  contactName: string;
  canManage?: boolean;
};

export function ContactRowActions({
  contactId,
  contactName,
  canManage = false,
}: ContactRowActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/contacts/${contactId}`}
          className="min-h-[44px] text-sm font-medium leading-[44px] text-brand-600 hover:text-brand-700 sm:min-h-0 sm:leading-normal"
        >
          View
        </Link>
        {canManage && (
          <>
            <Link
              href={`/contacts/${contactId}/edit`}
              className="min-h-[44px] text-sm font-medium leading-[44px] text-gray-600 hover:text-gray-900 sm:min-h-0 sm:leading-normal"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="min-h-[44px] text-sm font-medium leading-[44px] text-red-600 hover:text-red-700 sm:min-h-0 sm:leading-normal"
              aria-label={`Delete ${contactName}`}
            >
              Delete
            </button>
          </>
        )}
      </div>

      {canManage && (
        <>
          <form ref={formRef} action={deleteContactSimpleAction} className="hidden">
            <input type="hidden" name="contactId" value={contactId} />
          </form>

          <ConfirmDialog
            open={confirmOpen}
            title="Delete contact?"
            description={
              <>
                This will permanently remove <strong>{contactName}</strong> from
                your workspace. This cannot be undone.
              </>
            }
            confirmLabel="Delete contact"
            variant="danger"
            onConfirm={() => formRef.current?.requestSubmit()}
            onCancel={() => setConfirmOpen(false)}
          />
        </>
      )}
    </>
  );
}
