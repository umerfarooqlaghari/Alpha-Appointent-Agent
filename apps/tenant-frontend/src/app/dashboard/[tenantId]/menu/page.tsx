import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId, type InventoryItem } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { MenuClient, type Category } from "@/components/menu-client";

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

interface RawCategory {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
}

async function MenuData({ tenantId, decodedTenantId }: { tenantId: string; decodedTenantId: string }) {
  let initialItems: InventoryItem[] = [];
  let initialCategories: Category[] = [];
  let currency = "USD";

  try {
    const [rawItems, rawCategories, tenantData] = await Promise.all([
      tenantApi<RawItem[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/items`),
      tenantApi<RawCategory[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/categories`),
      tenantApi<{ currency?: string }>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/public`).catch(() => null)
    ]);

    currency = tenantData?.currency ?? "USD";

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

    initialCategories = rawCategories.map(cat => ({
      id: cat.id,
      tenantId: cat.tenantId,
      name: cat.name,
      createdAt: cat.createdAt
    }));
  } catch (err) {
    console.error("Failed to fetch menu data:", err);
  }

  return <MenuClient tenantId={decodedTenantId} initialItems={initialItems} initialCategories={initialCategories} currency={currency} />;
}

function MenuLoading() {
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

export default async function MenuPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);
  
  return (
    <DashboardShell tenantId={tenantId}>
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={<MenuLoading />}>
          <MenuData tenantId={tenantId} decodedTenantId={decodedTenantId} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
