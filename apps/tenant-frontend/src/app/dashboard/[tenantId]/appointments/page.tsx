import { XCircle } from "lucide-react";
import { cancelAppointment } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId, type Appointment } from "@/lib/db";
import { tenantApi } from "@/lib/api";

const dateTime = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
export default async function AppointmentsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);
  const appointments = (await tenantApi<Array<{ appointmentId: string; tenantId: string; customerName: string; customerPhone: string; service: string; startTime: string; endTime: string; status: Appointment["status"]; notes: string | null; createdAt: string }>>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/appointments`)).map((item): Appointment => ({ appointment_id: item.appointmentId, tenant_id: item.tenantId, customer_name: item.customerName, customer_phone: item.customerPhone, service: item.service, start_time: new Date(item.startTime), end_time: new Date(item.endTime), status: item.status, notes: item.notes, created_at: new Date(item.createdAt) }));
  return (
    <DashboardShell tenantId={tenantId}>
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-wider text-[#071D75]">CUSTOMERS</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#080C42]">Appointments</h2>
        
        <div className="mt-7 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Service</th>
                <th className="px-5 py-4">When (UTC)</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((appointment) => (
                <tr key={appointment.appointment_id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-4">
                    <p className="font-bold text-[#080C42]">{appointment.customer_name}</p>
                    <p className="text-xs text-slate-500">{appointment.customer_phone}</p>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-800">{appointment.service}</td>
                  <td className="px-5 py-4 text-xs text-slate-600">{dateTime.format(new Date(appointment.start_time))}</td>
                  <td className="px-5 py-4 capitalize">
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#071D75]">
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {appointment.status === "booked" && (
                      <form action={cancelAppointment.bind(null, decodedTenantId, appointment.appointment_id)}>
                        <button className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800">
                          <XCircle size={15} /> Cancel
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {!appointments.length && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    No appointments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}