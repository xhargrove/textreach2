import Link from "next/link";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MobileDataCard } from "@/components/ui/mobile-data-card";
import { KeywordRowActions } from "@/components/keywords/keyword-row-actions";
import { formatNumber, formatDate } from "@/lib/utils";
import type { Keyword, List } from "@prisma/client";

type KeywordWithList = Keyword & { list: List | null };

type KeywordsTableProps = {
  keywords: KeywordWithList[];
  canManageKeywords?: boolean;
};

export function KeywordsTable({
  keywords,
  canManageKeywords = false,
}: KeywordsTableProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {keywords.map((kw) => (
          <MobileDataCard
            key={kw.id}
            href={`/keywords/${kw.id}`}
            title={<Badge variant="info">{kw.keyword}</Badge>}
            subtitle={kw.list?.name ?? "No list assigned"}
            badge={
              kw.status === "active" ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="default">Inactive</Badge>
              )
            }
            rows={[
              {
                label: "Opt-ins",
                value: formatNumber(kw.optInCount),
              },
              { label: "Created", value: formatDate(kw.createdAt) },
            ]}
            actions={
              <KeywordRowActions
                keywordId={kw.id}
                keyword={kw.keyword}
                canManage={canManageKeywords}
              />
            }
          />
        ))}
      </div>

      <Table>
        <TableHead>
          <TableHeaderCell>Keyword</TableHeaderCell>
          <TableHeaderCell>Assigned list</TableHeaderCell>
          <TableHeaderCell>Auto reply</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Opt-ins</TableHeaderCell>
          <TableHeaderCell>Created</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableHead>
        <TableBody>
          {keywords.map((kw) => (
            <TableRow key={kw.id}>
              <TableCell>
                <Link href={`/keywords/${kw.id}`}>
                  <Badge variant="info">{kw.keyword}</Badge>
                </Link>
              </TableCell>
              <TableCell>
                {kw.list ? (
                  <Link
                    href={`/lists/${kw.list.id}`}
                    className="text-brand-600 hover:text-brand-700"
                  >
                    {kw.list.name}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="max-w-xs truncate text-gray-600">
                {kw.autoReply ?? "—"}
              </TableCell>
              <TableCell>
                {kw.status === "active" ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="default">Inactive</Badge>
                )}
              </TableCell>
              <TableCell>{formatNumber(kw.optInCount)}</TableCell>
              <TableCell>{formatDate(kw.createdAt)}</TableCell>
              <TableCell>
                <KeywordRowActions
                keywordId={kw.id}
                keyword={kw.keyword}
                canManage={canManageKeywords}
              />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
