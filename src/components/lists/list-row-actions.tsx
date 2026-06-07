"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteListSimpleAction } from "@/lib/actions/lists";
import { Button } from "@/components/ui/button";

type ListRowActionsProps = {
  listId: string;
  listName: string;
  canManage?: boolean;
};

export function ListRowActions({
  listId,
  listName,
  canManage = false,
}: ListRowActionsProps) {
  const [confirming, setConfirming] = useState(false);

  if (canManage && confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Delete?</span>
        <form action={deleteListSimpleAction}>
          <input type="hidden" name="listId" value={listId} />
          <Button type="submit" variant="danger" size="sm">
            Yes
          </Button>
        </form>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
        >
          No
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/lists/${listId}`}
        className="text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        View
      </Link>
      {canManage && (
        <>
          <Link
            href={`/lists/${listId}/edit`}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-sm font-medium text-red-600 hover:text-red-700"
            aria-label={`Delete ${listName}`}
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
}
