import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { CallLogsClient, type CallLogItem } from "@/components/call-logs-client";

interface RawCallLog {
  id: string;
  tenantId: string;
  customerPhone: string | null;
  durationSeconds: number;
  transcript: string | null;
  summary: string | null;
  recordingUrl: string | null;
  cost: number;
  startedAt: string | null;
  endedAt: string | null;
  callType?: string;
  createdAt: string;
}

async function CallLogsData({ tenantId, decodedTenantId }: { tenantId: string; decodedTenantId: string }) {
  let initialLogs: CallLogItem[] = [];
  let currency = "USD";

  try {
    const [rawLogs, tenantData] = await Promise.all([
      tenantApi<RawCallLog[]>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/call-logs`),
      tenantApi<{ currency?: string }>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/public`).catch(() => null)
    ]);

    currency = tenantData?.currency ?? "USD";

    initialLogs = rawLogs.map((c: RawCallLog): CallLogItem => ({
      id: c.id,
      tenantId: c.tenantId,
      customerPhone: c.customerPhone,
      durationSeconds: c.durationSeconds,
      transcript: c.transcript,
      summary: c.summary,
      recordingUrl: c.recordingUrl,
      cost: c.cost,
      startedAt: c.startedAt,
      endedAt: c.endedAt,
      callType: c.callType,
      createdAt: c.createdAt
    }));
  } catch (err) {
    console.error("Failed to fetch call logs:", err);
  }

  return <CallLogsClient tenantId={decodedTenantId} initialLogs={initialLogs} currency={currency} />;
}

function CallLogsLoading() {
  return (
    <div className="space-y-6 animate-pulse pt-4">
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-stone-200 rounded" />
        <div className="h-10 w-32 bg-stone-200 rounded" />
      </div>
      <div className="h-64 bg-stone-100 rounded-xl border border-stone-200" />
    </div>
  );
}

export default async function CallLogsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={<CallLogsLoading />}>
          <CallLogsData tenantId={tenantId} decodedTenantId={decodedTenantId} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
