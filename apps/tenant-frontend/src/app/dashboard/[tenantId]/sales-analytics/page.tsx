import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { SalesAnalyticsClient, SalesAnalyticsData } from "@/components/sales-analytics-client";

export default async function SalesAnalyticsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  let initialData: SalesAnalyticsData = {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalLeads: 0,
    wonLeads: 0,
    conversionRate: 0,
    monthlyRevenue: [],
    weeklyRevenue: [],
    categoryBreakdown: [],
    topItems: [],
    channelBreakdown: [],
    pipelineFunnel: []
  };

  try {
    initialData = await tenantApi<SalesAnalyticsData>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/sales-analytics`);
  } catch (err) {
    console.error("Failed to fetch sales analytics:", err);
  }

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="w-full">
        <SalesAnalyticsClient tenantId={decodedTenantId} initialData={initialData} />
      </div>
    </DashboardShell>
  );
}
