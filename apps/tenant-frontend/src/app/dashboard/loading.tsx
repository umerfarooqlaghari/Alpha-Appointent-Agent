export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 border-r border-slate-200 bg-white p-6 md:block">
        <div className="h-6 w-28 animate-pulse rounded bg-slate-200" />
        <div className="mt-10 space-y-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-9 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-4 w-28 rounded bg-blue-100" />
          <div className="mt-3 h-9 w-72 max-w-full rounded bg-slate-200" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-32 rounded-xl bg-slate-100" />
            ))}
          </div>
          <div className="mt-8 h-72 rounded-xl bg-slate-100" />
        </div>
      </main>
    </div>
  );
}