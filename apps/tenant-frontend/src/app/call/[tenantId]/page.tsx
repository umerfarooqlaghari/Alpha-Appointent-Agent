import { notFound } from "next/navigation";
import { CallWidget } from "@/components/call-widget";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";

export default async function CallPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  let tenant: { tenantId: string; name: string; industryType?: string; currency?: string } | null = null;
  try {
    tenant = await tenantApi<{ tenantId: string; name: string; industryType?: string; currency?: string }>(
      `/api/tenants/${encodeURIComponent(decodedTenantId)}/public`
    );
  } catch {
    notFound();
  }

  if (!tenant) notFound();

  return <CallWidget tenantId={tenant.tenantId} tenantName={tenant.name} industryType={tenant.industryType} currency={tenant.currency} />;
}