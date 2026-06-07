"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

type ListContactsSearchProps = {
  listId: string;
};

export function ListContactsSearch({ listId }: ListContactsSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";

  const updateQuery = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.push(`/lists/${listId}?${params.toString()}`);
      });
    },
    [router, searchParams, listId]
  );

  return (
    <div className="mb-4">
      <input
        type="search"
        placeholder="Search contacts in this list..."
        defaultValue={q}
        onChange={(e) => updateQuery(e.target.value)}
        className="block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {isPending && (
        <p className="mt-1 text-xs text-gray-400">Searching...</p>
      )}
    </div>
  );
}
