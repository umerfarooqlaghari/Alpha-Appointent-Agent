import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { QuotesClient, Quote } from "@/components/quotes-client";
import { Lead } from "@/components/leads-client";

export default async function QuotesPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  let initialQuotes: Quote[] = [];
  let initialLeads: Lead[] = [];

  try {
    const [quotesData, leadsData] = await Promise.all([
      tenantApi<Quote[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/quotes`),
      tenantApi<Lead[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/leads`).catch(() => []),
    ]);
    initialQuotes = quotesData;
    initialLeads = leadsData;
  } catch (err) {
    console.error("Failed to fetch quotes or leads:", err);
  }

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="w-full">
        <QuotesClient tenantId={decodedTenantId} initialQuotes={initialQuotes} leads={initialLeads} />
      </div>
    </DashboardShell>
  );
}
