"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";

export async function createLeadAction(
  tenantId: string,
  payload: {
    name: string;
    phone: string;
    email?: string;
    stage?: string;
    assignedTo?: string;
    summary?: string;
    source?: string;
    callLogIdentifier?: string | null;
  }
) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/leads`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/leads`);
  return result;
}

export async function updateLeadAction(
  tenantId: string,
  leadId: string,
  payload: {
    name: string;
    phone: string;
    email?: string | null;
    summary?: string | null;
    assignedTo?: string | null;
    callLogIdentifier?: string | null;
  }
) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/leads/${encodeURIComponent(leadId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/leads`);
  return result;
}

export async function deleteLeadAction(tenantId: string, leadId: string) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/leads/${encodeURIComponent(leadId)}`, {
    method: "DELETE",
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/leads`);
  return result;
}

export async function updateLeadStageAction(tenantId: string, leadId: string, stage: string) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/leads/${encodeURIComponent(leadId)}/stage`, {
    method: "PUT",
    body: JSON.stringify({ stage }),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/leads`);
  return result;
}

export async function addLeadTaskAction(tenantId: string, leadId: string, title: string, assignedTo?: string) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/leads/${encodeURIComponent(leadId)}/tasks`, {
    method: "POST",
    body: JSON.stringify({ title, assignedTo }),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/leads`);
  return result;
}

export async function toggleLeadTaskAction(tenantId: string, leadId: string, taskId: string, isCompleted: boolean) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/leads/${encodeURIComponent(leadId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: "PUT",
    body: JSON.stringify({ isCompleted }),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/leads`);
  return result;
}
