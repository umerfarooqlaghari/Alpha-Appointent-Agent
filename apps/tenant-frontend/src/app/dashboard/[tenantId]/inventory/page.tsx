import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId, type InventoryItem } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { InventoryClient } from "@/components/inventory-client";

interface RawItem {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  price: number;
  stockStatus: "in_stock" | "out_of_stock";
  variations: string | unknown[];
  customVariables: string | Record<string, unknown>;
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default async function InventoryPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);
  
  let initialItems: InventoryItem[] = [];
  try {
    const rawItems = await tenantApi<RawItem[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/items`);
    initialItems = rawItems.map((item: RawItem): InventoryItem => ({
      id: item.id,
      tenant_id: item.tenantId,
      name: item.name,
      sku: item.sku,
      description: item.description,
      category: item.category,
      price: item.price,
      stock_status: item.stockStatus,
      variations: typeof item.variations === "string" ? JSON.parse(item.variations) : item.variations,
      custom_variables: typeof item.customVariables === "string" ? JSON.parse(item.customVariables) : item.customVariables,
      is_disabled: item.isDisabled,
      created_at: new Date(item.createdAt),
      updated_at: new Date(item.updatedAt)
    }));
  } catch (err) {
    console.error("Failed to fetch initial items:", err);
  }

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="mx-auto max-w-6xl">
        <InventoryClient tenantId={decodedTenantId} initialItems={initialItems} />
      </div>
    </DashboardShell>
  );
}
