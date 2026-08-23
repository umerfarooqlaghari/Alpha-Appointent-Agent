import { AdminNav } from "@/components/admin-nav";
import { adminApi } from "@/lib/api";
import { PlansManagementClient, type PlanResponse } from "@/components/plans-management-client";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const plans = await adminApi<PlanResponse[]>("/api/admin/plans").catch(() => []);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <PlansManagementClient initialPlans={plans} />
      </main>
    </>
  );
}
