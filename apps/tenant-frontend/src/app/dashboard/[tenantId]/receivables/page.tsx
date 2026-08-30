import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { ReceivablesClient, ReceivablesSummaryResponse } from "@/components/receivables-client";

export default async function ReceivablesPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  let initialData: ReceivablesSummaryResponse = {
    totalOutstanding: 0,
    totalOverdue: 0,
    totalUnpaidCount: 0,
    overdueCount: 0,
    agingReport: [],
    overdueInvoices: []
  };

  try {
    initialData = await tenantApi<ReceivablesSummaryResponse>(
      `/api/tenants/${encodeURIComponent(decodedTenantId)}/receivables`
    );
  } catch (err) {
    console.error("Failed to fetch accounts receivable data:", err);
  }

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="w-full">
        <ReceivablesClient tenantId={decodedTenantId} initialData={initialData} />
      </div>
    </DashboardShell>
  );
}
