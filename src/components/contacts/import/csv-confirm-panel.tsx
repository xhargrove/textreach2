"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AnalyzedCsvRow } from "@/lib/csv/parse-contacts";
import type { ImportContactsResult } from "@/lib/actions/import-contacts";
import { executeImportAction } from "@/lib/actions/import-contacts";

type ListOption = { id: string; name: string };

type CsvConfirmPanelProps = {
  rows: AnalyzedCsvRow[];
  lists: ListOption[];
  onBack: () => void;
  onComplete: (result: ImportContactsResult) => void;
};

export function CsvConfirmPanel({
  rows,
  lists,
  onBack,
  onComplete,
}: CsvConfirmPanelProps) {
  const [listMode, setListMode] = useState<"existing" | "new">(
    lists.length > 0 ? "existing" : "new"
  );
  const [listId, setListId] = useState(lists[0]?.id ?? "");
  const [newListName, setNewListName] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validCount = rows.filter(
    (r) => r.status === "valid_new" || r.status === "valid_existing"
  ).length;

  async function handleImport() {
    setError(null);
    setLoading(true);

    try {
      const result = await executeImportAction({
        rows,
        listId: listMode === "existing" ? listId : undefined,
        newListName: listMode === "new" ? newListName : undefined,
        consent,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onComplete(result.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Choose a list
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Imported contacts will be added to this list. {validCount} valid
          contact{validCount === 1 ? "" : "s"} ready to import.
        </p>
      </div>

      <div className="space-y-3">
        {lists.length > 0 && (
          <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
            <input
              type="radio"
              name="listMode"
              checked={listMode === "existing"}
              onChange={() => setListMode("existing")}
              className="text-brand-600 focus:ring-brand-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">
                Add to existing list
              </span>
              <select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                disabled={listMode !== "existing"}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>
          </label>
        )}

        <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
          <input
            type="radio"
            name="listMode"
            checked={listMode === "new"}
            onChange={() => setListMode("new")}
            className="mt-1 text-brand-600 focus:ring-brand-500"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900">
              Create new list
            </span>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              disabled={listMode !== "new"}
              placeholder="e.g. Event Attendees"
              className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>
        </label>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-amber-900">
            By importing contacts, you confirm these people gave permission to
            receive text messages from your business or organization.
          </span>
        </label>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleImport}
          disabled={loading || !consent || validCount === 0}
        >
          {loading ? "Importing..." : `Import ${validCount} contacts`}
        </Button>
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
