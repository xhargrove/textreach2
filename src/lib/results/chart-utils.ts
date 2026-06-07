export type ChartPoint = {
  label: string;
  value: number;
};

export function buildDailyBuckets(days: number): ChartPoint[] {
  const buckets: ChartPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    buckets.push({
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: 0,
    });
  }

  return buckets;
}

export function countByDay(
  dates: Date[],
  days: number
): ChartPoint[] {
  const buckets = buildDailyBuckets(days);
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  for (const date of dates) {
    if (date < start) continue;
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (dayStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays >= 0 && diffDays < buckets.length) {
      buckets[diffDays].value++;
    }
  }

  return buckets;
}

export function percent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}
