import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { ServicesClient, type ServiceItem } from "@/components/services-client";

interface RawService {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  category: string;
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
}

async function ServicesData({ tenantId, decodedTenantId }: { tenantId: string; decodedTenantId: string }) {
  let initialServices: ServiceItem[] = [];
  let currency = "USD";

  try {
    const [rawServices, tenantData] = await Promise.all([
      tenantApi<RawService[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/services`),
      tenantApi<{ currency?: string }>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/public`).catch(() => null)
    ]);

    currency = tenantData?.currency ?? "USD";

    initialServices = rawServices.map((s: RawService): ServiceItem => ({
      id: s.id,
      tenantId: s.tenantId,
      name: s.name,
      description: s.description,
      price: s.price,
      durationMinutes: s.durationMinutes,
      category: s.category || "General",
      isDisabled: s.isDisabled,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }));
  } catch (err) {
    console.error("Failed to fetch services:", err);
  }

  return <ServicesClient tenantId={decodedTenantId} initialServices={initialServices} currency={currency} />;
}

function ServicesLoading() {
  return (
    <div className="space-y-6 animate-pulse pt-4">
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-stone-200 rounded" />
        <div className="h-10 w-32 bg-stone-200 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-48 bg-stone-100 rounded-xl border border-stone-200" />
        <div className="h-48 bg-stone-100 rounded-xl border border-stone-200" />
        <div className="h-48 bg-stone-100 rounded-xl border border-stone-200" />
      </div>
    </div>
  );
}

export default async function ServicesPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={<ServicesLoading />}>
          <ServicesData tenantId={tenantId} decodedTenantId={decodedTenantId} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
