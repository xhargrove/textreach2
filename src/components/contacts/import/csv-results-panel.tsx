"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ImportContactsResult } from "@/lib/actions/import-contacts";
import { formatNumber } from "@/lib/utils";

type CsvResultsPanelProps = {
  result: ImportContactsResult;
  onImportAnother: () => void;
};

export function CsvResultsPanel({
  result,
  onImportAnother,
}: CsvResultsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-green-50 p-4">
        <h3 className="text-lg font-semibold text-green-900">Import complete</h3>
        <p className="mt-1 text-sm text-green-800">
          Contacts were added to{" "}
          <Link
            href={`/lists/${result.listId}`}
            className="font-medium underline"
          >
            {result.listName}
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ResultCard
          label="New contacts created"
          value={result.newContactsCreated}
        />
        <ResultCard
          label="Existing contacts found"
          value={result.existingContactsFound}
        />
        <ResultCard
          label="Added to list"
          value={result.contactsAddedToList}
        />
        <ResultCard
          label="Duplicates skipped"
          value={result.duplicatesSkipped}
        />
        <ResultCard
          label="Invalid rows skipped"
          value={result.invalidRowsSkipped}
        />
        <ResultCard
          label="Already on list"
          value={result.alreadyOnListSkipped}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button href={`/lists/${result.listId}`}>View List</Button>
        <Button href="/contacts" variant="secondary">
          View Contacts
        </Button>
        <Button type="button" variant="ghost" onClick={onImportAnother}>
          Import another file
        </Button>
      </div>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">
        {formatNumber(value)}
      </p>
    </Card>
  );
}
