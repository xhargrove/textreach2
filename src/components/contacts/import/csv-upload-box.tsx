"use client";

import { useCallback, useState } from "react";

type CsvUploadBoxProps = {
  onFileLoaded: (text: string, fileName: string) => void;
  error?: string | null;
  loading?: boolean;
};

export function CsvUploadBox({
  onFileLoaded,
  error,
  loading,
}: CsvUploadBoxProps) {
  const [dragOver, setDragOver] = useState(false);

  const [fileError, setFileError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setFileError("Please upload a .csv file.");
        return;
      }
      setFileError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onFileLoaded(text, file.name);
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
          dragOver
            ? "border-brand-400 bg-brand-50"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <div className="rounded-full bg-white p-4 shadow-sm">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <p className="mt-4 text-base font-medium text-gray-900">
          Drag and drop your CSV file here
        </p>
        <p className="mt-1 text-sm text-gray-500">or click to browse</p>
        <label className="mt-6 cursor-pointer">
          <span className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            {loading ? "Reading file..." : "Choose CSV file"}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={loading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {fileError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {fileError}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm font-medium text-gray-900">Need a template?</p>
        <p className="mt-1 text-sm text-gray-500">
          Download our sample CSV with the correct column headers.
        </p>
        <a
          href="/sample-contacts.csv"
          download="sample-contacts.csv"
          className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Download sample CSV →
        </a>
        <p className="mt-3 text-xs text-gray-400">
          Supported columns: phone, first_name, last_name, email, tags
        </p>
      </div>
    </div>
  );
}
