"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";
import type { StaffRoleItem, StaffMemberItem, StaffShiftItem, DispatchTaskItem } from "@/components/dispatch-client";

export async function createRoleAction(
  tenantId: string,
  payload: {
    roleName: string;
    description?: string;
  }
) {
  const result = await tenantApi<StaffRoleItem>(`/api/tenants/${encodeURIComponent(tenantId)}/staff-dispatch/roles`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/dispatch`);
  return result;
}

export async function deleteRoleAction(tenantId: string, id: string) {
  const result = await tenantApi<{ success: boolean }>(`/api/tenants/${encodeURIComponent(tenantId)}/staff-dispatch/roles/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/dispatch`);
  return result;
}

export async function createStaffMemberAction(
  tenantId: string,
  payload: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
    skills?: string;
    status?: string;
  }
) {
  const result = await tenantApi<StaffMemberItem>(`/api/tenants/${encodeURIComponent(tenantId)}/staff-dispatch/members`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/dispatch`);
  return result;
}

export async function updateStaffMemberAction(
  tenantId: string,
  id: string,
  payload: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
    skills?: string;
    status?: string;
  }
) {
  const result = await tenantApi<StaffMemberItem>(`/api/tenants/${encodeURIComponent(tenantId)}/staff-dispatch/members/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/dispatch`);
  return result;
}

export async function deleteStaffMemberAction(tenantId: string, id: string) {
  const result = await tenantApi<{ success: boolean }>(`/api/tenants/${encodeURIComponent(tenantId)}/staff-dispatch/members/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/dispatch`);
  return result;
}

export async function createShiftAction(
  tenantId: string,
  payload: {
    staffName: string;
    staffEmail?: string;
    role: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    status?: string;
  }
) {
  const result = await tenantApi<StaffShiftItem>(`/api/tenants/${encodeURIComponent(tenantId)}/staff-dispatch/shifts`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/dispatch`);
  return result;
}

export async function deleteShiftAction(tenantId: string, id: string) {
  const result = await tenantApi<{ success: boolean }>(`/api/tenants/${encodeURIComponent(tenantId)}/staff-dispatch/shifts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/dispatch`);
  return result;
}

export async function createTaskAction(
  tenantId: string,
  payload: {
    title: string;
    description?: string;
    fulfillmentId?: string;
    assignedToName: string;
    assignedToEmail?: string;
    priority?: string;
    dueDate?: string;
  }
) {
  const result = await tenantApi<DispatchTaskItem>(`/api/tenants/${encodeURIComponent(tenantId)}/staff-dispatch/tasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/dispatch`);
  return result;
}

export async function checkInTaskAction(
  tenantId: string,
  id: string,
  payload: {
    status: string;
    checkInNotes?: string;
  }
) {
  const result = await tenantApi<DispatchTaskItem>(`/api/tenants/${encodeURIComponent(tenantId)}/staff-dispatch/tasks/${encodeURIComponent(id)}/checkin`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/dispatch`);
  return result;
}

export async function deleteTaskAction(tenantId: string, id: string) {
  const result = await tenantApi<{ success: boolean }>(`/api/tenants/${encodeURIComponent(tenantId)}/staff-dispatch/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/dispatch`);
  return result;
}
