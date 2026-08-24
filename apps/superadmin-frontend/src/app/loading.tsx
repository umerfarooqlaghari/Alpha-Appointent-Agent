export default function SuperadminLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-8 w-64 rounded bg-slate-300" />
          <div className="h-4 w-96 rounded bg-slate-200" />
        </div>
        <div className="h-10 w-36 rounded-md bg-slate-200" />
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="h-12 bg-slate-50 border-b border-slate-100" />
        <div className="divide-y divide-slate-100">
          <div className="h-16 bg-white" />
          <div className="h-16 bg-white" />
          <div className="h-16 bg-white" />
          <div className="h-16 bg-white" />
          <div className="h-16 bg-white" />
        </div>
      </div>
    </div>
  );
}