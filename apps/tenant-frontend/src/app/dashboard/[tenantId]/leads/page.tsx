import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { LeadsClient, Lead } from "@/components/leads-client";
import { CallLogItem } from "@/components/call-logs-client";

export default async function LeadsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  let initialLeads: Lead[] = [];
  let callLogs: CallLogItem[] = [];

  try {
    const [leadsData, callLogsData] = await Promise.all([
      tenantApi<Lead[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/leads`),
      tenantApi<CallLogItem[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/call-logs`).catch(() => []),
    ]);
    initialLeads = leadsData;
    callLogs = callLogsData;
  } catch (err) {
    console.error("Failed to fetch leads or call logs:", err);
  }

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="w-full">
        <LeadsClient tenantId={decodedTenantId} initialLeads={initialLeads} callLogs={callLogs} />
      </div>
    </DashboardShell>
  );
}
