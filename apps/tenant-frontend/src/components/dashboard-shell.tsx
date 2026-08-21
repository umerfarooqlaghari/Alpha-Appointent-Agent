import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decodeTenantId, type Tenant } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { TenantNav } from "./tenant-nav";

export async function DashboardShell({ tenantId, children }: { tenantId: string; children: React.ReactNode }) {
  const decodedTenantId = decodeTenantId(tenantId);
  const store = await cookies();
  if (!store.get("auth_token") || store.get("auth_tenant")?.value !== decodedTenantId) redirect("/login");
  const data = await tenantApi<{ tenantId: string; name: string }>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/public`);
  const tenant: Tenant | undefined = data ? { tenant_id: data.tenantId, name: data.name, status: "active", created_at: new Date() } : undefined;
  if (!tenant) notFound();
  return <div className="flex min-h-screen"><TenantNav tenantId={decodedTenantId} tenantName={tenant.name} /><main className="min-w-0 flex-1 p-6 md:p-10">{children}</main></div>;
}