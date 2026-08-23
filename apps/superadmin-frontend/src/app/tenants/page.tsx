import { AdminNav } from "@/components/admin-nav";
import { adminApi } from "@/lib/api";
import { TenantsDirectoryClient, type TenantResponse } from "@/components/tenants-directory-client";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants = await adminApi<Array<TenantResponse>>("/api/admin/tenants");

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <TenantsDirectoryClient initialTenants={tenants} />
      </main>
    </>
  );
}