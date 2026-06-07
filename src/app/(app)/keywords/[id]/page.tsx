import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getPagePermissions } from "@/lib/auth/page-permissions";
import {
  getKeywordById,
  getRecentKeywordOptIns,
} from "@/lib/queries/keywords";
import { buildKeywordAutoReply, KEYWORD_COMPLIANCE_FOOTER } from "@/lib/keywords/auto-reply";
import { formatNumber, formatDateTime, formatPhone } from "@/lib/utils";
import { formatContactName } from "@/lib/validation/phone";

export const metadata = {
  title: "Keyword",
};

type KeywordDetailPageProps = {
  params: { id: string };
};

export default async function KeywordDetailPage({
  params,
}: KeywordDetailPageProps) {
  const ctx = await requirePagePermission("view_keywords");
  const perms = getPagePermissions(ctx);
  const keyword = await getKeywordById(ctx.workspaceId, params.id);

  if (!keyword) notFound();

  const recentOptIns = await getRecentKeywordOptIns(
    ctx.workspaceId,
    keyword.id
  );

  const previewReply = keyword.autoReply
    ? buildKeywordAutoReply(keyword.autoReply)
    : null;

  return (
    <>
      <PageHeader
        title={keyword.keyword}
        description="Text-to-join keyword"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" href={`/results/keywords/${keyword.id}`}>
              View results
            </Button>
            {perms.canManageKeywords && (
              <Button variant="secondary" href={`/keywords/${keyword.id}/edit`}>
                Edit
              </Button>
            )}
            <Button variant="secondary" href="/keywords">
              All keywords
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Keyword</dt>
              <dd>
                <Badge variant="info">{keyword.keyword}</Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Status</dt>
              <dd>
                {keyword.status === "active" ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="default">Inactive</Badge>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Assigned list</dt>
              <dd className="font-medium text-gray-900">
                {keyword.list ? (
                  <Link
                    href={`/lists/${keyword.list.id}`}
                    className="text-brand-600 hover:text-brand-700"
                  >
                    {keyword.list.name}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Total opt-ins</dt>
              <dd className="font-medium text-gray-900">
                {formatNumber(keyword.optInCount)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Created</dt>
              <dd className="font-medium text-gray-900">
                {formatDateTime(keyword.createdAt)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Auto-reply</h2>
          {previewReply ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
              {previewReply}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No auto-reply configured.</p>
          )}
          <p className="text-xs text-gray-500">
            Compliance footer: {KEYWORD_COMPLIANCE_FOOTER}
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent opt-ins
        </h2>
        {recentOptIns.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No one has texted {keyword.keyword} yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {recentOptIns.map((optIn) => {
              const name = formatContactName(
                optIn.contact.firstName,
                optIn.contact.lastName
              );
              return (
                <li
                  key={optIn.id}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <div>
                    <Link
                      href={`/contacts/${optIn.contact.id}`}
                      className="font-medium text-brand-600 hover:text-brand-700"
                    >
                      {name !== "—" ? name : formatPhone(optIn.contact.phone)}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {formatPhone(optIn.contact.phone)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(optIn.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
