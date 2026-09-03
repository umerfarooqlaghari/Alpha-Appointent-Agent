export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6">
      <div className="h-6 w-48 rounded bg-stone-200" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-xl bg-stone-100" />
        <div className="h-28 rounded-xl bg-stone-100" />
        <div className="h-28 rounded-xl bg-stone-100" />
      </div>
      <div className="h-72 rounded-xl bg-stone-100" />
    </div>
  );
}