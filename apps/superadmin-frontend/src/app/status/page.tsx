import { CheckCircle2, Database, XCircle } from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { adminApi } from "@/lib/api";
export const dynamic = "force-dynamic";
export default async function StatusPage() {
  let healthy = true;
  let message = "PostgreSQL accepted a connection and responded to a health query.";
  try {
    const health = await adminApi<{ database: boolean }>("/health");
    healthy = health.database;
  } catch (error) {
    healthy = false;
    message = error instanceof Error ? error.message : "Unable to connect to the backend API.";
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-wider text-[#071D75]">PLATFORM HEALTH</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080C42]">System status</h1>
        
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className={`grid size-12 place-items-center rounded-full ${healthy ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
              {healthy ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#080C42]">{healthy ? "Operational" : "Connection failed"}</h2>
              <p className="mt-1 text-sm text-slate-500">Database status checked through the backend API.</p>
            </div>
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Database size={16} className="text-[#071D75]" /> PostgreSQL Database
            </div>
            <p className="mt-2 break-words text-sm text-slate-600">{message}</p>
          </div>
        </section>
      </main>
    </>
  );
}