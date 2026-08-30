"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";

export async function createUnifiedOrderAction(
  tenantId: string,
  payload: {
    customerName: string;
    customerPhone: string;
    source?: string;
    orderType?: string;
    scheduledDate?: string | null;
    notes?: string;
    items?: Array<{ name: string; quantity: number; unitPrice: number }>;
  }
) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/unified-orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/sales-orders`);
  return result;
}

export async function updateOrderStatusAction(tenantId: string, orderId: string, status: string) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/unified-orders/${encodeURIComponent(orderId)}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/sales-orders`);
  return result;
}

export async function updateOrderItemsAction(
  tenantId: string,
  orderId: string,
  items: Array<{ name: string; quantity: number; unitPrice: number }>
) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/unified-orders/${encodeURIComponent(orderId)}/items`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/sales-orders`);
  return result;
}

export async function rescheduleOrderAction(tenantId: string, orderId: string, scheduledDate: string) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/unified-orders/${encodeURIComponent(orderId)}/reschedule`, {
    method: "PUT",
    body: JSON.stringify({ scheduledDate }),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/sales-orders`);
  return result;
}
