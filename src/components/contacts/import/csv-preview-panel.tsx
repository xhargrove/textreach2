import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { AnalyzedCsvRow } from "@/lib/csv/parse-contacts";
import type { ImportPreviewSummary } from "@/lib/csv/parse-contacts";
import { formatPhone } from "@/lib/utils";

type CsvPreviewPanelProps = {
  summary: ImportPreviewSummary;
  rows: AnalyzedCsvRow[];
};

function statusBadge(status: AnalyzedCsvRow["status"]) {
  switch (status) {
    case "valid_new":
      return <Badge variant="success">New</Badge>;
    case "valid_existing":
      return <Badge variant="info">Existing</Badge>;
    case "duplicate_file":
      return <Badge variant="warning">Duplicate</Badge>;
    case "invalid":
      return <Badge variant="error">Invalid</Badge>;
  }
}

export function CsvPreviewPanel({ summary, rows }: CsvPreviewPanelProps) {
  const previewRows = rows.slice(0, 50);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total rows" value={summary.totalRows} />
        <StatCard label="Valid contacts" value={summary.validContacts} />
        <StatCard label="Duplicates" value={summary.duplicates} />
        <StatCard label="Invalid rows" value={summary.invalidRows} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
          <span className="font-medium text-gray-900">{summary.newContacts}</span>{" "}
          new contacts will be created
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
          <span className="font-medium text-gray-900">
            {summary.existingContacts}
          </span>{" "}
          existing contacts will be matched
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900">Preview</h3>
        <p className="mt-1 text-sm text-gray-500">
          Showing up to 50 rows from your file.
        </p>
        <div className="mt-4">
          <Table>
            <TableHead>
              <TableHeaderCell>Row</TableHeaderCell>
              <TableHeaderCell>Phone</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Tags</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableHead>
            <TableBody>
              {previewRows.map((row) => (
                <TableRow key={row.rowNumber}>
                  <TableCell>{row.rowNumber}</TableCell>
                  <TableCell>
                    {row.normalizedPhone
                      ? formatPhone(row.normalizedPhone)
                      : row.phone || "—"}
                  </TableCell>
                  <TableCell>
                    {[row.firstName, row.lastName].filter(Boolean).join(" ") ||
                      "—"}
                  </TableCell>
                  <TableCell>{row.email ?? "—"}</TableCell>
                  <TableCell>
                    {row.tags.length > 0 ? row.tags.join(", ") : "—"}
                  </TableCell>
                  <TableCell>
                    <div>
                      {statusBadge(row.status)}
                      {row.reason && (
                        <p className="mt-0.5 max-w-[10rem] text-xs text-gray-400">
                          {row.reason}
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
