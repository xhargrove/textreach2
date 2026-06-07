type SimpleBarChartProps = {
  title: string;
  data: { label: string; value: number }[];
  emptyLabel?: string;
};

export function SimpleBarChart({
  title,
  data,
  emptyLabel = "No data yet",
}: SimpleBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <span className="text-xs text-gray-500">{total} total</span>
      </div>

      {total === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">{emptyLabel}</p>
      ) : (
        <div className="flex h-32 items-end gap-1">
          {data.map((point) => (
            <div
              key={point.label}
              className="group flex flex-1 flex-col items-center gap-1"
            >
              <div className="relative flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-brand-500 transition-all group-hover:bg-brand-600"
                  style={{
                    height: `${Math.max((point.value / max) * 100, point.value > 0 ? 8 : 0)}%`,
                    minHeight: point.value > 0 ? "4px" : "0",
                  }}
                  title={`${point.label}: ${point.value}`}
                />
              </div>
              <span className="hidden text-[10px] text-gray-400 sm:block">
                {point.label.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
