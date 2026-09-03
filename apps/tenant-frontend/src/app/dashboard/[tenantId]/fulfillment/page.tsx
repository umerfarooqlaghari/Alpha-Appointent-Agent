import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { FulfillmentClient, FulfillmentData } from "@/components/fulfillment-client";
import type { StaffMemberItem } from "@/components/dispatch-client";

export default async function FulfillmentPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  let fulfillmentData: FulfillmentData = {
    totalFulfillments: 0,
    urgentCount: 0,
    activeCount: 0,
    completedCount: 0,
    queue: [],
    unsyncedAppointments: []
  };
  let initialStaffMembers: StaffMemberItem[] = [];

  try {
    const [fulfillRes, membersRes] = await Promise.all([
      tenantApi<FulfillmentData>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/fulfillment`),
      tenantApi<StaffMemberItem[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/staff-dispatch/members`)
    ]);
    fulfillmentData = fulfillRes || fulfillmentData;
    initialStaffMembers = membersRes || [];
  } catch (err) {
    console.error("Failed to fetch fulfillment queue:", err);
  }

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="mx-auto max-w-6xl">
        <FulfillmentClient
          tenantId={decodedTenantId}
          initialData={fulfillmentData}
          initialStaffMembers={initialStaffMembers}
        />
      </div>
    </DashboardShell>
  );
}
