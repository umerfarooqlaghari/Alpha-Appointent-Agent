import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { InvoicesClient, Invoice } from "@/components/invoices-client";
import { Lead } from "@/components/leads-client";
import { Quote } from "@/components/quotes-client";
import { UnifiedOrder } from "@/components/sales-orders-client";

export default async function InvoicesPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  let initialInvoices: Invoice[] = [];
  let leads: Lead[] = [];
  let quotes: Quote[] = [];
  let orders: UnifiedOrder[] = [];

  try {
    const [invoicesData, leadsData, quotesData, ordersData] = await Promise.all([
      tenantApi<Invoice[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/invoices`),
      tenantApi<Lead[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/leads`).catch(() => []),
      tenantApi<Quote[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/quotes`).catch(() => []),
      tenantApi<UnifiedOrder[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/unified-orders`).catch(() => []),
    ]);
    initialInvoices = invoicesData;
    leads = leadsData;
    quotes = quotesData;
    orders = ordersData;
  } catch (err) {
    console.error("Failed to fetch invoices data:", err);
  }

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="w-full">
        <InvoicesClient
          tenantId={decodedTenantId}
          initialInvoices={initialInvoices}
          leads={leads}
          quotes={quotes}
          orders={orders}
        />
      </div>
    </DashboardShell>
  );
}
