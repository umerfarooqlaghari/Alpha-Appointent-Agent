export default function TenantDashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-pulse p-2">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-stone-200" />
        <div className="h-8 w-64 rounded bg-stone-300" />
        <div className="h-4 w-96 rounded bg-stone-200" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-xl border border-stone-200 bg-stone-100 p-5" />
        <div className="h-28 rounded-xl border border-stone-200 bg-stone-100 p-5" />
        <div className="h-28 rounded-xl border border-stone-200 bg-stone-100 p-5" />
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="h-12 bg-stone-100 border-b border-stone-200" />
        <div className="divide-y divide-stone-100">
          <div className="h-14 bg-white" />
          <div className="h-14 bg-white" />
          <div className="h-14 bg-white" />
          <div className="h-14 bg-white" />
          <div className="h-14 bg-white" />
        </div>
      </div>
    </div>
  );
}
