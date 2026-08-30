"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";

export async function triggerDunningCycleAction(tenantId: string) {
  const result = await tenantApi<{ success: boolean; remindersDispatched: number; message: string }>(
    `/api/tenants/${encodeURIComponent(tenantId)}/receivables/dunning/trigger`,
    {
      method: "POST",
    }
  );

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/receivables`);
  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/invoices`);
  return result;
}
