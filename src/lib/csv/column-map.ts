/**
 * Maps normalized CSV header names to contact fields.
 * Headers are lowercased and trimmed before lookup.
 */
export const CSV_COLUMN_ALIASES: Record<string, CsvField> = {
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  first_name: "firstName",
  "first name": "firstName",
  firstname: "firstName",
  last_name: "lastName",
  "last name": "lastName",
  lastname: "lastName",
  email: "email",
  tags: "tags",
};

export type CsvField =
  | "phone"
  | "firstName"
  | "lastName"
  | "email"
  | "tags";

export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

export function mapHeaderToField(header: string): CsvField | null {
  return CSV_COLUMN_ALIASES[normalizeHeader(header)] ?? null;
}
