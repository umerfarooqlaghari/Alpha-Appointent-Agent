import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId, type Faq } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { FaqClient } from "@/components/faq-client";

interface RawFaq {
  id: string;
  tenantId: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export default async function FaqsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);
  
  let initialFaqs: Faq[] = [];
  try {
    const rawFaqs = await tenantApi<RawFaq[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/faqs`);
    initialFaqs = rawFaqs.map((faq: RawFaq): Faq => ({
      id: faq.id,
      tenant_id: faq.tenantId,
      question: faq.question,
      answer: faq.answer,
      created_at: new Date(faq.createdAt),
      updated_at: new Date(faq.updatedAt)
    }));
  } catch (err) {
    console.error("Failed to fetch initial FAQs:", err);
  }

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="mx-auto max-w-6xl">
        <FaqClient tenantId={decodedTenantId} initialFaqs={initialFaqs} />
      </div>
    </DashboardShell>
  );
}
