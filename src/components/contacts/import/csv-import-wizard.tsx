"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { CsvUploadBox } from "./csv-upload-box";
import { CsvPreviewPanel } from "./csv-preview-panel";
import { CsvConfirmPanel } from "./csv-confirm-panel";
import { CsvResultsPanel } from "./csv-results-panel";
import { parseContactsCsv } from "@/lib/csv/parse-contacts";
import { previewImportAction } from "@/lib/actions/import-contacts";
import type { AnalyzedCsvRow } from "@/lib/csv/parse-contacts";
import type { ImportPreviewSummary } from "@/lib/csv/parse-contacts";
import type { ImportContactsResult } from "@/lib/actions/import-contacts";
import { Button } from "@/components/ui/button";

type Step = "upload" | "preview" | "confirm" | "results";

type ListOption = { id: string; name: string };

type CsvImportWizardProps = {
  lists: ListOption[];
};

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview" },
  { key: "confirm", label: "Confirm" },
  { key: "results", label: "Results" },
];

export function CsvImportWizard({ lists }: CsvImportWizardProps) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState<AnalyzedCsvRow[]>([]);
  const [summary, setSummary] = useState<ImportPreviewSummary | null>(null);
  const [result, setResult] = useState<ImportContactsResult | null>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setFileName(null);
    setError(null);
    setAnalyzed([]);
    setSummary(null);
    setResult(null);
  }, []);

  const handleFileLoaded = useCallback(async (text: string, name: string) => {
    setError(null);
    setLoading(true);
    setFileName(name);

    const parsed = parseContactsCsv(text);
    if (!parsed.ok) {
      setError(parsed.error.message);
      setLoading(false);
      return;
    }

    const preview = await previewImportAction({ rows: parsed.rows });
    setLoading(false);

    if (!preview.ok) {
      setError(preview.error);
      return;
    }

    setAnalyzed(preview.data.analyzed);
    setSummary(preview.data.summary);
    setStep("preview");
  }, []);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="space-y-8">
      <nav aria-label="Import progress">
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li
              key={s.key}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                i <= stepIndex
                  ? "bg-brand-100 text-brand-800"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i + 1}. {s.label}
            </li>
          ))}
        </ol>
      </nav>

      {fileName && step !== "upload" && (
        <p className="text-sm text-gray-500">
          File: <span className="font-medium text-gray-700">{fileName}</span>
        </p>
      )}

      {step === "upload" && (
        <CsvUploadBox
          onFileLoaded={handleFileLoaded}
          error={error}
          loading={loading}
        />
      )}

      {step === "preview" && summary && (
        <>
          <CsvPreviewPanel summary={summary} rows={analyzed} />
          <div className="flex gap-3">
            <Button
              onClick={() => setStep("confirm")}
              disabled={summary.validContacts === 0}
            >
              Continue
            </Button>
            <Button type="button" variant="secondary" onClick={reset}>
              Upload different file
            </Button>
          </div>
          {summary.validContacts === 0 && (
            <p className="text-sm text-red-600">
              No valid contacts to import. Fix your file and try again.
            </p>
          )}
        </>
      )}

      {step === "confirm" && (
        <CsvConfirmPanel
          rows={analyzed}
          lists={lists}
          onBack={() => setStep("preview")}
          onComplete={(data) => {
            setResult(data);
            setStep("results");
          }}
        />
      )}

      {step === "results" && result && (
        <CsvResultsPanel result={result} onImportAnother={reset} />
      )}

      {step === "upload" && (
        <p className="text-center text-sm text-gray-500">
          <Link
            href="/contacts"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            ← Back to Contacts
          </Link>
        </p>
      )}
    </div>
  );
}
