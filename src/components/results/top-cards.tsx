import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

type TopList = { id: string; name: string; messageCount: number };

type TopListsCardProps = {
  lists: TopList[];
};

export function TopListsCard({ lists }: TopListsCardProps) {
  return (
    <Card>
      <h3 className="text-sm font-medium text-gray-900">Top lists</h3>
      {lists.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No lists with messages yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {lists.map((list) => (
            <li
              key={list.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <Link
                href={`/results/lists/${list.id}`}
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                {list.name}
              </Link>
              <span className="text-gray-500">
                {formatNumber(list.messageCount)} message
                {list.messageCount === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

type TopKeyword = { id: string; keyword: string; optInCount: number };

type TopKeywordsCardProps = {
  keywords: TopKeyword[];
};

export function TopKeywordsCard({ keywords }: TopKeywordsCardProps) {
  return (
    <Card>
      <h3 className="text-sm font-medium text-gray-900">Top keywords</h3>
      {keywords.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No keyword opt-ins yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {keywords.map((kw) => (
            <li
              key={kw.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <Link href={`/results/keywords/${kw.id}`}>
                <Badge variant="info">{kw.keyword}</Badge>
              </Link>
              <span className="text-gray-500">
                {formatNumber(kw.optInCount)} opt-in
                {kw.optInCount === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
