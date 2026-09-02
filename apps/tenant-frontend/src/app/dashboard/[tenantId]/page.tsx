import Link from "next/link";
import { ArrowRight, CalendarDays, CircleCheck, Clock3 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";

export default async function TenantDashboard({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);
  const metrics = await tenantApi<{ total: number; booked: number; free: number }>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/dashboard`);
  const cards = [
    { label: "Total slots", value: metrics.total, icon: CalendarDays, color: "bg-blue-100 text-[#071D75]" },
    { label: "Booked", value: metrics.booked, icon: CircleCheck, color: "bg-indigo-100 text-[#080C42]" },
    { label: "Available", value: metrics.free, icon: Clock3, color: "bg-sky-100 text-sky-800" },
  ];
  return <DashboardShell tenantId={tenantId}><div className="mx-auto max-w-6xl">
    <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#071D75]">OPERATIONS OVERVIEW</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#080C42]">Today&apos;s appointment capacity</h2>
    <div className="mt-8 grid gap-4 sm:grid-cols-3">{cards.map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs"><div className={`mb-5 grid size-10 place-items-center rounded-lg ${color}`}><Icon size={20} /></div><p className="text-3xl font-bold text-[#080C42]">{value}</p><p className="mt-1 text-sm text-slate-500">{label}</p></div>)}</div>
    <div className="mt-8 grid gap-4 md:grid-cols-2"><Link href={`/dashboard/${tenantId}/calendar`} className="rounded-xl border border-blue-100 bg-[#eef2ff] p-6 transition hover:-translate-y-0.5 shadow-xs"><p className="font-bold text-[#080C42]">Manage availability</p><p className="mt-1 text-sm text-slate-600">Set working hours and holidays for automatic slots.</p><ArrowRight className="mt-6 text-[#071D75]" size={18} /></Link><Link href={`/dashboard/${tenantId}/appointments`} className="rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 shadow-xs"><p className="font-bold text-[#080C42]">Review appointments</p><p className="mt-1 text-sm text-slate-600">Track customer bookings and cancellations.</p><ArrowRight className="mt-6 text-[#071D75]" size={18} /></Link></div>
  </div></DashboardShell>;
}