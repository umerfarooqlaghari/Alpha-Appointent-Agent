import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId, type RestaurantOrder } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { OrdersClient } from "@/components/orders-client";

interface RawOrder {
  orderId: string;
  tenantId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  orderType: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

async function OrdersData({ tenantId, decodedTenantId }: { tenantId: string; decodedTenantId: string }) {
  let initialOrders: RestaurantOrder[] = [];
  let industryType = "";
  let currency = "USD";
  try {
    const [rawOrders, tenantData] = await Promise.all([
      tenantApi<RawOrder[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/orders`),
      tenantApi<{ industryType?: string; currency?: string }>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/public`).catch(() => null)
    ]);
    industryType = tenantData?.industryType ?? "";
    currency = tenantData?.currency ?? "USD";
    initialOrders = rawOrders.map((order: RawOrder): RestaurantOrder => ({
      orderId: order.orderId,
      tenantId: order.tenantId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      orderType: order.orderType,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt)
    }));
  } catch (err) {
    console.error("Failed to fetch initial orders:", err);
  }

  return <OrdersClient tenantId={decodedTenantId} initialOrders={initialOrders} industryType={industryType} currency={currency} />;
}

function OrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse pt-4">
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-stone-200 rounded" />
        <div className="h-10 w-32 bg-stone-200 rounded" />
      </div>
      <div className="h-64 bg-stone-100 rounded-xl border border-stone-200" />
    </div>
  );
}

export default async function OrdersPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);
  
  return (
    <DashboardShell tenantId={tenantId}>
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={<OrdersLoading />}>
          <OrdersData tenantId={tenantId} decodedTenantId={decodedTenantId} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
