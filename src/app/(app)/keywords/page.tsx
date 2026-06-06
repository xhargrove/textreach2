import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { keywords } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Keywords",
};

export default function KeywordsPage() {
  return (
    <>
      <PageHeader
        title="Keywords"
        description="Let people join your lists by texting a keyword"
        action={<Button>Add Keyword</Button>}
      />

      <Table>
        <TableHead>
          <TableHeaderCell>Keyword</TableHeaderCell>
          <TableHeaderCell>Auto Reply</TableHeaderCell>
          <TableHeaderCell>List</TableHeaderCell>
          <TableHeaderCell>Sign-ups</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableHead>
        <TableBody>
          {keywords.map((kw) => (
            <TableRow key={kw.id}>
              <TableCell>
                <Badge variant="info">{kw.keyword}</Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {kw.autoReply ?? "Opt-out keyword"}
              </TableCell>
              <TableCell>{kw.list ?? "—"}</TableCell>
              <TableCell>{formatNumber(kw.signups)}</TableCell>
              <TableCell>
                {kw.active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="default">Inactive</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
