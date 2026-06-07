import Link from "next/link";
import { cn } from "@/lib/utils";

type MobileDataCardRow = {
  label: string;
  value: React.ReactNode;
};

type MobileDataCardProps = {
  href?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  rows?: MobileDataCardRow[];
  actions?: React.ReactNode;
  className?: string;
};

export function MobileDataCard({
  href,
  title,
  subtitle,
  badge,
  rows,
  actions,
  className,
}: MobileDataCardProps) {
  const titleContent = href ? (
    <Link
      href={href}
      className="font-medium text-brand-600 hover:text-brand-700"
    >
      {title}
    </Link>
  ) : (
    <span className="font-medium text-gray-900">{title}</span>
  );

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {titleContent}
            {badge}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {href && !actions && (
          <Link
            href={href}
            className="shrink-0 text-gray-400 hover:text-brand-600"
            aria-label="View details"
          >
            →
          </Link>
        )}
      </div>

      {rows && rows.length > 0 && (
        <dl className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <dt className="text-gray-500">{row.label}</dt>
              <dd className="text-right font-medium text-gray-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {actions && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {actions}
        </div>
      )}
    </div>
  );
}

export function ResponsiveDataView({
  mobile,
  desktop,
}: {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
}) {
  return (
    <>
      <div className="space-y-3 md:hidden">{mobile}</div>
      <div className="hidden md:block">{desktop}</div>
    </>
  );
}
