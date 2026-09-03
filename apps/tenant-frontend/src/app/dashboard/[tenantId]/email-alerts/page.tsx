import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { EmailAlertsClient, EmailAlertsData } from "@/components/email-alerts-client";
import type { ServiceFulfillmentItem, FulfillmentData } from "@/components/fulfillment-client";
import type { StaffMemberItem, StaffShiftItem, DispatchTaskData } from "@/components/dispatch-client";

export default async function EmailAlertsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  let initialData: EmailAlertsData = {
    totalLogs: 0,
    confirmationCount: 0,
    digestCount: 0,
    escalationCount: 0,
    logs: []
  };
  let initialStaffMembers: StaffMemberItem[] = [];
  let initialFulfillments: ServiceFulfillmentItem[] = [];
  let initialTasksData: DispatchTaskData = {
    totalTasks: 0,
    pendingCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    blockedCount: 0,
    tasks: []
  };
  let initialShifts: StaffShiftItem[] = [];

  try {
    const [alertsRes, membersRes, fulfillRes, tasksRes, shiftsRes] = await Promise.all([
      tenantApi<EmailAlertsData>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/email-alerts`),
      tenantApi<StaffMemberItem[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/staff-dispatch/members`),
      tenantApi<FulfillmentData>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/fulfillment`),
      tenantApi<DispatchTaskData>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/staff-dispatch/tasks`),
      tenantApi<StaffShiftItem[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/staff-dispatch/shifts`)
    ]);

    initialData = alertsRes || initialData;
    initialStaffMembers = membersRes || [];
    initialFulfillments = fulfillRes?.queue || [];
    initialTasksData = tasksRes || initialTasksData;
    initialShifts = shiftsRes || [];
  } catch (err) {
    console.error("Failed to fetch email logs & alerts data:", err);
  }

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="mx-auto max-w-6xl">
        <EmailAlertsClient
          tenantId={decodedTenantId}
          initialData={initialData}
          staffMembers={initialStaffMembers}
          fulfillments={initialFulfillments}
          tasks={initialTasksData.tasks}
          shifts={initialShifts}
        />
      </div>
    </DashboardShell>
  );
}
