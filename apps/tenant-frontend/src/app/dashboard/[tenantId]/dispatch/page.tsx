import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { DispatchClient, StaffRoleItem, StaffMemberItem, StaffShiftItem, DispatchTaskData } from "@/components/dispatch-client";

export default async function DispatchPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  let initialRoles: StaffRoleItem[] = [];
  let initialStaffMembers: StaffMemberItem[] = [];
  let initialShifts: StaffShiftItem[] = [];
  let initialTasksData: DispatchTaskData = {
    totalTasks: 0,
    pendingCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    blockedCount: 0,
    tasks: []
  };

  try {
    const [rolesRes, membersRes, shiftsRes, tasksRes] = await Promise.all([
      tenantApi<StaffRoleItem[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/staff-dispatch/roles`),
      tenantApi<StaffMemberItem[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/staff-dispatch/members`),
      tenantApi<StaffShiftItem[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/staff-dispatch/shifts`),
      tenantApi<DispatchTaskData>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/staff-dispatch/tasks`)
    ]);
    initialRoles = rolesRes || [];
    initialStaffMembers = membersRes || [];
    initialShifts = shiftsRes || [];
    initialTasksData = tasksRes || initialTasksData;
  } catch (err) {
    console.error("Failed to load staff dispatch data:", err);
  }

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="mx-auto max-w-6xl">
        <DispatchClient
          tenantId={decodedTenantId}
          initialRoles={initialRoles}
          initialStaffMembers={initialStaffMembers}
          initialShifts={initialShifts}
          initialTasksData={initialTasksData}
        />
      </div>
    </DashboardShell>
  );
}
