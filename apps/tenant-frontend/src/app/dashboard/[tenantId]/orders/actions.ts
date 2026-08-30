"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";

export async function updateOrderStatus(tenantId: string, orderId: string, status: string) {
  try {
    await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    revalidatePath(`/dashboard/${tenantId}/orders`);
  } catch (err: unknown) {
    throw new Error(err instanceof Error ? err.message : "Failed to update order status");
  }
}
