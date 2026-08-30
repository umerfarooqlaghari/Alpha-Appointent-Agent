"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";

export async function createQuoteAction(
  tenantId: string,
  payload: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    taxRate: number;
    discountAmount: number;
    items: Array<{ itemName: string; quantity: number; unitPrice: number }>;
  }
) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/quotes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/quotes`);
  return result;
}

export async function signQuoteAction(tenantId: string, quoteId: string, digitalSignature: string) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/quotes/${encodeURIComponent(quoteId)}/sign`, {
    method: "POST",
    body: JSON.stringify({ digitalSignature }),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/quotes`);
  return result;
}

export async function convertQuoteAction(tenantId: string, quoteId: string) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/quotes/${encodeURIComponent(quoteId)}/convert`, {
    method: "POST",
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/quotes`);
  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/sales-orders`);
  return result;
}

export async function getQuoteShareLinkAction(tenantId: string, quoteId: string) {
  const result = await tenantApi<{ whatsappUrl: string; smsUrl: string; summaryText: string }>(
    `/api/tenants/${encodeURIComponent(tenantId)}/quotes/${encodeURIComponent(quoteId)}/share-link`
  );
  return result;
}
