type UsageMeterProps = {
  label: string;
  used: number;
  limit: number | null;
};

export function UsageMeter({ label, used, limit }: UsageMeterProps) {
  const unlimited = limit === null;
  const percent =
    unlimited || limit <= 0 ? 0 : Math.min(Math.round((used / limit) * 100), 100);
  const atLimit = !unlimited && limit > 0 && used >= limit;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium ${atLimit ? "text-red-700" : "text-gray-900"}`}>
          {used.toLocaleString()}
          {!unlimited && ` / ${limit.toLocaleString()}`}
          {unlimited && " / Unlimited"}
        </span>
      </div>
      {!unlimited && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${atLimit ? "bg-red-500" : "bg-brand-600"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      {atLimit && (
        <p className="mt-1 text-xs text-red-600">
          Limit reached — upgrade your plan on this page.
        </p>
      )}
    </div>
  );
}
