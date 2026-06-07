import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function messageStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    sent: { label: "Sent", variant: "success" },
    scheduled: { label: "Scheduled", variant: "info" },
    draft: { label: "Draft", variant: "default" },
    sending: { label: "Sending", variant: "warning" },
    failed: { label: "Failed", variant: "error" },
  };
  const config = map[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function contactStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    active: { label: "Active", variant: "success" },
    opted_out: { label: "Opted out", variant: "error" },
    invalid: { label: "Invalid", variant: "warning" },
  };
  const config = map[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function contactSourceBadge(source: string) {
  const map: Record<string, string> = {
    manual: "Manual",
    csv: "CSV",
    keyword: "Keyword",
    inbound: "Inbound",
  };
  return <Badge variant="default">{map[source] ?? source}</Badge>;
}
