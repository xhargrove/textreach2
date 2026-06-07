import { mapHeaderToField } from "./column-map";
import { isValidEmail, normalizePhone } from "@/lib/validation/phone";

export type ParsedCsvRow = {
  rowNumber: number;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  tags: string[];
};

export type CsvParseError = {
  type: "missing_phone_column" | "empty_file" | "no_data_rows";
  message: string;
};

export type CsvParseResult =
  | { ok: true; rows: ParsedCsvRow[] }
  | { ok: false; error: CsvParseError };

/** Parse CSV text into rows. Handles quoted fields with commas. */
export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || (char === "\r" && next === "\n")) {
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      if (char === "\r") i++;
    } else if (char !== "\r") {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function parseTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;|]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function parseContactsCsv(text: string): CsvParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: { type: "empty_file", message: "The file is empty." },
    };
  }

  const grid = parseCsvText(trimmed);
  if (grid.length === 0) {
    return {
      ok: false,
      error: { type: "empty_file", message: "The file is empty." },
    };
  }

  const headers = grid[0];
  const fieldIndexes: Partial<Record<string, number>> = {};

  headers.forEach((header, index) => {
    const field = mapHeaderToField(header);
    if (field && fieldIndexes[field] === undefined) {
      fieldIndexes[field] = index;
    }
  });

  if (fieldIndexes.phone === undefined) {
    return {
      ok: false,
      error: {
        type: "missing_phone_column",
        message:
          'Could not find a phone column. Use "phone", "Phone Number", or "Mobile".',
      },
    };
  }

  const dataRows = grid.slice(1);
  if (dataRows.length === 0) {
    return {
      ok: false,
      error: {
        type: "no_data_rows",
        message: "The file has headers but no contact rows.",
      },
    };
  }

  const rows: ParsedCsvRow[] = dataRows.map((cells, index) => {
    const get = (field: keyof typeof fieldIndexes) => {
      const idx = fieldIndexes[field];
      return idx !== undefined ? (cells[idx]?.trim() ?? "") : "";
    };

    return {
      rowNumber: index + 2,
      phone: get("phone"),
      firstName: get("firstName") || null,
      lastName: get("lastName") || null,
      email: get("email") || null,
      tags: parseTags(get("tags")),
    };
  });

  return { ok: true, rows };
}

export type RowAnalysisStatus =
  | "valid_new"
  | "valid_existing"
  | "duplicate_file"
  | "invalid";

export type AnalyzedCsvRow = {
  rowNumber: number;
  phone: string;
  normalizedPhone: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  tags: string[];
  status: RowAnalysisStatus;
  reason: string | null;
  existingContactId: string | null;
};

export function analyzeCsvRows(
  rows: ParsedCsvRow[],
  existingPhones: Map<string, string>
): AnalyzedCsvRow[] {
  const seenPhones = new Set<string>();
  const analyzed: AnalyzedCsvRow[] = [];

  for (const row of rows) {
    const phoneResult = normalizePhone(row.phone);

    if (!phoneResult.ok) {
      analyzed.push({
        ...row,
        normalizedPhone: null,
        status: "invalid",
        reason: phoneResult.error,
        existingContactId: null,
      });
      continue;
    }

    if (row.email && !isValidEmail(row.email)) {
      analyzed.push({
        ...row,
        normalizedPhone: phoneResult.phone,
        status: "invalid",
        reason: "Invalid email address",
        existingContactId: null,
      });
      continue;
    }

    if (seenPhones.has(phoneResult.phone)) {
      analyzed.push({
        ...row,
        normalizedPhone: phoneResult.phone,
        status: "duplicate_file",
        reason: "Duplicate phone number in this file",
        existingContactId: null,
      });
      continue;
    }

    seenPhones.add(phoneResult.phone);
    const existingContactId = existingPhones.get(phoneResult.phone) ?? null;

    analyzed.push({
      ...row,
      normalizedPhone: phoneResult.phone,
      status: existingContactId ? "valid_existing" : "valid_new",
      reason: null,
      existingContactId,
    });
  }

  return analyzed;
}

export type ImportPreviewSummary = {
  totalRows: number;
  validContacts: number;
  duplicates: number;
  invalidRows: number;
  newContacts: number;
  existingContacts: number;
};

export function summarizePreview(rows: AnalyzedCsvRow[]): ImportPreviewSummary {
  const valid = rows.filter(
    (r) => r.status === "valid_new" || r.status === "valid_existing"
  );
  return {
    totalRows: rows.length,
    validContacts: valid.length,
    duplicates: rows.filter((r) => r.status === "duplicate_file").length,
    invalidRows: rows.filter((r) => r.status === "invalid").length,
    newContacts: rows.filter((r) => r.status === "valid_new").length,
    existingContacts: rows.filter((r) => r.status === "valid_existing").length,
  };
}
