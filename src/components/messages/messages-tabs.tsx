import Link from "next/link";
import type { MessageTab } from "@/lib/queries/messages";
import { cn } from "@/lib/utils";

type MessagesTabsProps = {
  activeTab: MessageTab;
  counts: {
    drafts: number;
    scheduled: number;
    sent: number;
    failed: number;
  };
};

const TABS: { key: MessageTab; label: string }[] = [
  { key: "drafts", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "sent", label: "Sent" },
  { key: "failed", label: "Failed" },
];

export function MessagesTabs({ activeTab, counts }: MessagesTabsProps) {
  return (
    <nav aria-label="Message status" className="-mx-4 overflow-x-auto border-b border-gray-200 px-4 sm:mx-0 sm:px-0">
      <ul className="-mb-px flex min-w-max gap-4 sm:gap-6">
        {TABS.map((tab) => {
          const count = counts[tab.key];
          const isActive = activeTab === tab.key;

          return (
            <li key={tab.key}>
              <Link
                href={`/messages?tab=${tab.key}`}
                className={cn(
                  "inline-flex min-h-[44px] items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors sm:min-h-0",
                  isActive
                    ? "border-brand-600 text-brand-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    isActive
                      ? "bg-brand-100 text-brand-700"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
