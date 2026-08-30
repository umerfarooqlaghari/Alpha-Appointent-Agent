"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";

export interface InvoiceItemDto {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export async function createInvoiceAction(
  tenantId: string,
  payload: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    orderId?: string;
    quoteId?: string;
    leadId?: string;
    invoiceType?: string;
    taxAmount: number;
    discountAmount: number;
    depositRequired: number;
    dueDate: string;
    notes?: string;
    items: InvoiceItemDto[];
  }
) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/invoices`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/invoices`);
  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/receivables`);
  return result;
}

export async function recordPaymentAction(
  tenantId: string,
  invoiceId: string,
  payload: {
    amount: number;
    paymentMethod?: string;
    transactionReference?: string;
  }
) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/invoices/${encodeURIComponent(invoiceId)}/payments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/invoices`);
  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/receivables`);
  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/sales-analytics`);
  return result;
}

export async function sendPaymentLinkAction(tenantId: string, invoiceId: string) {
  const result = await tenantApi<{ invoiceNumber: string; paymentLink: string; summaryText: string; whatsappUrl: string; smsUrl: string }>(
    `/api/tenants/${encodeURIComponent(tenantId)}/invoices/${encodeURIComponent(invoiceId)}/send-link`,
    {
      method: "POST",
    }
  );

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/invoices`);
  return result;
}

export async function flagBadDebtAction(tenantId: string, invoiceId: string) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/invoices/${encodeURIComponent(invoiceId)}/bad-debt`, {
    method: "PUT",
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/invoices`);
  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/receivables`);
  return result;
}

export async function deleteInvoiceAction(tenantId: string, invoiceId: string) {
  const result = await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/invoices/${encodeURIComponent(invoiceId)}`, {
    method: "DELETE",
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/invoices`);
  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/receivables`);
  return result;
}
