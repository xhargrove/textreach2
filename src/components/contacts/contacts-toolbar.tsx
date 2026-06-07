"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "opted_out", label: "Opted out" },
  { value: "invalid", label: "Invalid" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "manual", label: "Manual" },
  { value: "csv", label: "CSV" },
  { value: "keyword", label: "Keyword" },
  { value: "inbound", label: "Inbound" },
];

export function ContactsToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const source = searchParams.get("source") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      startTransition(() => {
        router.push(`/contacts?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="contact-search" className="sr-only">
            Search contacts
          </label>
          <input
            id="contact-search"
            type="search"
            placeholder="Search by name, phone, or email..."
            defaultValue={q}
            onChange={(e) => updateParams({ q: e.target.value })}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={source}
          onChange={(e) => updateParams({ source: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          aria-label="Filter by source"
        >
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {isPending && (
        <p className="text-xs text-gray-400">Updating results...</p>
      )}
    </div>
  );
}
