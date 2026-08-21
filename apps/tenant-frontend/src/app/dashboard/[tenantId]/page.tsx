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
    { label: "Total slots", value: metrics.total, icon: CalendarDays, color: "bg-amber-100 text-amber-900" },
    { label: "Booked", value: metrics.booked, icon: CircleCheck, color: "bg-emerald-100 text-emerald-900" },
    { label: "Available", value: metrics.free, icon: Clock3, color: "bg-sky-100 text-sky-900" },
  ];
  return <DashboardShell tenantId={tenantId}><div className="mx-auto max-w-6xl">
    <p className="text-sm font-semibold text-teal-700">OPERATIONS OVERVIEW</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Today&apos;s appointment capacity</h2>
    <div className="mt-8 grid gap-4 sm:grid-cols-3">{cards.map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-lg border border-black/5 bg-white p-5 shadow-sm"><div className={`mb-5 grid size-10 place-items-center rounded-md ${color}`}><Icon size={20} /></div><p className="text-3xl font-semibold">{value}</p><p className="mt-1 text-sm text-stone-500">{label}</p></div>)}</div>
    <div className="mt-8 grid gap-4 md:grid-cols-2"><Link href={`/dashboard/${tenantId}/calendar`} className="rounded-lg border border-black/5 bg-[#e6f4ef] p-6 transition hover:-translate-y-0.5"><p className="font-semibold">Manage availability</p><p className="mt-1 text-sm text-stone-600">Set working hours and holidays for automatic slots.</p><ArrowRight className="mt-6" size={18} /></Link><Link href={`/dashboard/${tenantId}/appointments`} className="rounded-lg border border-black/5 bg-[#fff3d9] p-6 transition hover:-translate-y-0.5"><p className="font-semibold">Review appointments</p><p className="mt-1 text-sm text-stone-600">Track customer bookings and cancellations.</p><ArrowRight className="mt-6" size={18} /></Link></div>
  </div></DashboardShell>;
}