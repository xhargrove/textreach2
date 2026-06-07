import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

const variants: Record<AlertVariant, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
  onDismiss,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        variants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {title && <p className="font-medium">{title}</p>}
          <div className={title ? "mt-1" : undefined}>{children}</div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded p-1 opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
