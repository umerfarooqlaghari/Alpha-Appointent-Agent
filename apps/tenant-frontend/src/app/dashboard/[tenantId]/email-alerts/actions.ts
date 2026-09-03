"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";
import type { EmailLogItem } from "@/components/email-alerts-client";

export async function sendConfirmationEmailAction(
  tenantId: string,
  payload: {
    recipientEmail: string;
    recipientName: string;
    referenceType: string;
    referenceId: string;
    detailsSummary: string;
  }
) {
  const result = await tenantApi<EmailLogItem>(`/api/tenants/${encodeURIComponent(tenantId)}/email-alerts/send-confirmation`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/email-alerts`);
  return result;
}

export async function generateDigestEmailAction(
  tenantId: string,
  payload: {
    periodType: string;
    recipientEmail: string;
    recipientName: string;
  }
) {
  const result = await tenantApi<EmailLogItem>(`/api/tenants/${encodeURIComponent(tenantId)}/email-alerts/generate-digest`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/email-alerts`);
  return result;
}

export async function triggerEscalationAlertAction(
  tenantId: string,
  payload: {
    leadOrCustomerName: string;
    customerPhone: string;
    customerEmail?: string;
    escalationReason: string;
    recipientAdminEmail: string;
  }
) {
  const result = await tenantApi<EmailLogItem>(`/api/tenants/${encodeURIComponent(tenantId)}/email-alerts/trigger-escalation`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/email-alerts`);
  return result;
}

export async function notifyStaffFulfillmentAction(
  tenantId: string,
  payload: {
    fulfillmentId?: string;
    staffName: string;
    staffEmail: string;
    serviceTitle: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    scheduledAt?: string;
    priority?: string;
    notes?: string;
  }
) {
  const result = await tenantApi<EmailLogItem>(`/api/tenants/${encodeURIComponent(tenantId)}/email-alerts/notify-staff-fulfillment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/email-alerts`);
  return result;
}

export async function notifyStaffTaskAction(
  tenantId: string,
  payload: {
    taskId?: string;
    taskTitle: string;
    assignedToName: string;
    assignedToEmail: string;
    priority?: string;
    dueDate?: string;
    description?: string;
  }
) {
  const result = await tenantApi<EmailLogItem>(`/api/tenants/${encodeURIComponent(tenantId)}/email-alerts/notify-staff-task`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/email-alerts`);
  return result;
}

export async function notifyStaffShiftAction(
  tenantId: string,
  payload: {
    staffName: string;
    staffEmail: string;
    role?: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
  }
) {
  const result = await tenantApi<EmailLogItem>(`/api/tenants/${encodeURIComponent(tenantId)}/email-alerts/notify-staff-shift`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/email-alerts`);
  return result;
}

export async function deleteEmailLogAction(tenantId: string, id: string) {
  const result = await tenantApi<{ success: boolean }>(`/api/tenants/${encodeURIComponent(tenantId)}/email-alerts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/email-alerts`);
  return result;
}
