import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { TenantNav } from "@/components/tenant-nav";

export default async function TenantDashboardLayout({
  params,
  children,
}: {
  params: Promise<{ tenantId: string }>;
  children: React.ReactNode;
}) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);
  const store = await cookies();
  if (!store.get("auth_token") || store.get("auth_tenant")?.value !== decodedTenantId) {
    redirect("/login");
  }

  const data = await tenantApi<{
    tenantId: string;
    name: string;
    disabledTabs: string | null;
    industryType?: string | null;
  }>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/public`);

  const tenant = data
    ? {
        tenant_id: data.tenantId,
        name: data.name,
        disabled_tabs: data.disabledTabs ?? "",
        industry_type: data.industryType ?? "",
        status: "active",
        created_at: new Date(),
      }
    : undefined;

  if (!tenant) notFound();

  return (
    <div className="flex min-h-screen bg-stone-50/30">
      <TenantNav
        tenantId={decodedTenantId}
        tenantName={tenant.name}
        disabledTabs={tenant.disabled_tabs}
        industryType={tenant.industry_type}
      />
      <main className="min-w-0 flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
