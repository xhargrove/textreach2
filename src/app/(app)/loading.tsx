import { PageHeaderSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={6} />
      <TableSkeleton rows={4} />
    </div>
  );
}
