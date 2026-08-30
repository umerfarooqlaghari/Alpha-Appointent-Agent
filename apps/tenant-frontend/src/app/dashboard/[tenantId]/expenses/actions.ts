"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";

export async function logExpenseAction(
  tenantId: string,
  payload: {
    title: string;
    category: string;
    amount: number;
    vendorName?: string;
    associatedItemId?: string;
    receiptUrl?: string;
    expenseDate?: string;
    notes?: string;
  }
) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/expenses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/expenses`);
  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/sales-analytics`);
  return result;
}

export async function deleteExpenseAction(tenantId: string, expenseId: string) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/expenses/${encodeURIComponent(expenseId)}`, {
    method: "DELETE",
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/expenses`);
  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/sales-analytics`);
  return result;
}

export async function setItemCogsAction(
  tenantId: string,
  itemId: string,
  payload: {
    unitCogs: number;
    itemType?: string;
  }
) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/expenses/cogs/${encodeURIComponent(itemId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/expenses`);
  return result;
}
