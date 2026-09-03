"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";
import type { ServiceFulfillmentItem } from "@/components/fulfillment-client";

export async function createFulfillmentAction(
  tenantId: string,
  payload: {
    referenceType?: string;
    referenceId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    serviceTitle: string;
    scheduledAt?: string;
    priority?: string;
    assignedStaffId?: string;
    assignedStaffName?: string;
    notes?: string;
  }
) {
  const result = await tenantApi<ServiceFulfillmentItem>(`/api/tenants/${encodeURIComponent(tenantId)}/fulfillment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/fulfillment`);
  return result;
}

export async function syncAppointmentToFulfillmentAction(tenantId: string, appointmentId: string) {
  const result = await tenantApi<ServiceFulfillmentItem>(`/api/tenants/${encodeURIComponent(tenantId)}/fulfillment/sync-appointment/${encodeURIComponent(appointmentId)}`, {
    method: "POST",
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/fulfillment`);
  return result;
}

export async function updateFulfillmentStatusAction(tenantId: string, id: string, status: string) {
  const result = await tenantApi<ServiceFulfillmentItem>(`/api/tenants/${encodeURIComponent(tenantId)}/fulfillment/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/fulfillment`);
  return result;
}

export async function updateFulfillmentPriorityAction(tenantId: string, id: string, priority: string) {
  const result = await tenantApi<ServiceFulfillmentItem>(`/api/tenants/${encodeURIComponent(tenantId)}/fulfillment/${encodeURIComponent(id)}/priority`, {
    method: "PUT",
    body: JSON.stringify({ priority }),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/fulfillment`);
  return result;
}

export async function assignStaffAction(tenantId: string, id: string, staffName: string, staffId?: string) {
  const result = await tenantApi<ServiceFulfillmentItem>(`/api/tenants/${encodeURIComponent(tenantId)}/fulfillment/${encodeURIComponent(id)}/assign`, {
    method: "PUT",
    body: JSON.stringify({ staffName, staffId }),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/fulfillment`);
  return result;
}

export async function deleteFulfillmentAction(tenantId: string, id: string) {
  const result = await tenantApi<{ success: boolean }>(`/api/tenants/${encodeURIComponent(tenantId)}/fulfillment/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/fulfillment`);
  return result;
}
