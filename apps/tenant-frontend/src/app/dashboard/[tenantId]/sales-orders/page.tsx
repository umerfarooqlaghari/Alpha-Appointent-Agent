import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { SalesOrdersClient, UnifiedOrder } from "@/components/sales-orders-client";

export default async function SalesOrdersPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  let initialOrders: UnifiedOrder[] = [];
  try {
    initialOrders = await tenantApi<UnifiedOrder[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/unified-orders`);
  } catch (err) {
    console.error("Failed to fetch unified orders:", err);
  }

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="mx-auto max-w-6xl">
        <SalesOrdersClient tenantId={decodedTenantId} initialOrders={initialOrders} />
      </div>
    </DashboardShell>
  );
}
