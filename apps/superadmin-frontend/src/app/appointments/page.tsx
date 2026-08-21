import { Search } from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { type Appointment } from "@/lib/db";
import { adminApi } from "@/lib/api";

const dateTime = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export const dynamic = "force-dynamic";

export default async function GlobalAppointmentsPage({ searchParams }: { searchParams: Promise<{ query?: string; tenantId?: string }> }) {
  const { query = "", tenantId = "" } = await searchParams;
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (tenantId) params.set("tenantId", tenantId);
  const appointments = (await adminApi<Array<{ appointmentId: string; tenantId: string; customerName: string; customerPhone: string; service: string; startTime: string; endTime: string; status: string; notes: string | null; createdAt: string }>>(`/api/admin/appointments?${params}`)).map((item): Appointment => ({ appointment_id: item.appointmentId, tenant_id: item.tenantId, customer_name: item.customerName, customer_phone: item.customerPhone, service: item.service, start_time: new Date(item.startTime), end_time: new Date(item.endTime), status: item.status, notes: item.notes, created_at: new Date(item.createdAt) }));

  return <><AdminNav /><main className="mx-auto max-w-7xl px-6 py-10"><p className="text-sm font-semibold text-teal-700">GLOBAL ACTIVITY</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Appointments</h1><form className="mt-7 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search size={17} className="absolute left-3 top-3 text-slate-400" /><input name="query" defaultValue={query} placeholder="Search customer or phone" className="w-full rounded-md border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm" /></label><input name="tenantId" defaultValue={tenantId} placeholder="Filter tenant ID" className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm" /><button className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Filter</button></form><div className="mt-5 overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="w-full min-w-200 text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Tenant</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Service</th><th className="px-5 py-4">Start (UTC)</th><th className="px-5 py-4">Status</th></tr></thead><tbody>{appointments.map((item) => <tr key={item.appointment_id} className="border-t border-slate-100"><td className="px-5 py-4 font-mono text-xs">{item.tenant_id}</td><td className="px-5 py-4"><p className="font-medium">{item.customer_name}</p><p className="text-slate-500">{item.customer_phone}</p></td><td className="px-5 py-4">{item.service}</td><td className="px-5 py-4">{dateTime.format(new Date(item.start_time))}</td><td className="px-5 py-4 capitalize">{item.status}</td></tr>)}{!appointments.length && <tr><td colSpan={5} className="p-12 text-center text-slate-500">No appointments match this filter.</td></tr>}</tbody></table></div></main></>;
}