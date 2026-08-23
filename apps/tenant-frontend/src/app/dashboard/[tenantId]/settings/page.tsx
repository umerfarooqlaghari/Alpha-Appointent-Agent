import { headers } from "next/headers";
import { updateTenantConfig } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId, type TenantConfig } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { PublishableKeyInput } from "@/components/publishable-key-input";
export default async function SettingsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);
  const data = await tenantApi<{ tenantId: string; adapterType: TenantConfig["adapter_type"]; apiBaseUrl: string | null; authHeaderName: string | null; authToken: string | null; productsApiUrl: string | null; inventorySource: TenantConfig["inventory_source"]; publishableKey: string | null; allowedDomains: string | null }>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/config`);
  console.log("DEBUG CONFIG DATA FROM BACKEND:", data);
  const config: TenantConfig | undefined = data ? { tenant_id: data.tenantId, adapter_type: data.adapterType, api_base_url: data.apiBaseUrl, auth_header_name: data.authHeaderName, auth_token: data.authToken, products_api_url: data.productsApiUrl, inventory_source: data.inventorySource, publishable_key: data.publishableKey, allowed_domains: data.allowedDomains } : undefined;

  const subData = await tenantApi<{ planName: string; monthlyMinutesLimit: number; minutesUsed: number; isActive: boolean; daysLeft: number }>(`/api/tenants/${encodeURIComponent(decodedTenantId)}/subscription`).catch(() => null);
  const sub = subData || { planName: "Trial", monthlyMinutesLimit: 30, minutesUsed: 0.0, isActive: true, daysLeft: 14 };
  const percentage = Math.min(100, Math.round((sub.minutesUsed / sub.monthlyMinutesLimit) * 100)) || 0;

  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const defaultBaseUrl = `${protocol}://${host}`;
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || defaultBaseUrl;
  const scriptUrl = `${baseUrl.replace(/\/$/, "")}/widget.js`;

  const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "YOUR_VAPI_PUBLIC_KEY";
  const vapiAssistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "YOUR_VAPI_ASSISTANT_ID";

  const embedCode = `<script\n  src="${scriptUrl}"\n  data-tenant-key="${config?.publishable_key || "YOUR_PUBLISHABLE_KEY"}"\n  data-vapi-public-key="${vapiPublicKey}"\n  data-vapi-assistant-id="${vapiAssistantId}"\n  async\n></script>`;

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-teal-700">BILLING & METRICS</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Plan & Subscriptions</h2>
        
        {/* Subscription Info Card */}
        <div className="mt-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 uppercase tracking-wide">
                {sub.planName} Plan
              </span>
              <h3 className="mt-3 text-lg font-semibold text-stone-900">Vapi Voice minutes Package</h3>
              <p className="text-xs text-stone-500 mt-1">Your calling package limits and remaining days.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-teal-950">{sub.daysLeft} days</p>
              <p className="text-xs text-stone-500">remaining in period</p>
            </div>
          </div>

          {sub.planName.toLowerCase() !== "unlimited" ? (
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm text-stone-700 font-medium">
                <span>Usage ({Math.round(sub.minutesUsed * 10) / 10} / {sub.monthlyMinutesLimit} minutes)</span>
                <span>{percentage}%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-teal-600 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-2 text-sm text-teal-800 font-medium bg-teal-50/50 p-3 rounded-md border border-teal-100">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
              Unlimited calling plan override is active for development/trial.
            </div>
          )}
        </div>

        <p className="text-sm font-semibold text-teal-700 mt-10">INTEGRATIONS</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Connection settings</h2>
        <form action={updateTenantConfig.bind(null, decodedTenantId)} autoComplete="off" className="mt-7 space-y-5 rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium">
            Adapter type
            <select name="adapterType" defaultValue={config?.adapter_type ?? "postgres"} className="mt-1 block w-full rounded-md border border-stone-200 p-2">
              <option value="postgres">PostgreSQL</option>
              <option value="shopify">Shopify</option>
              <option value="pos-http">POS HTTP</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            API base URL
            <input name="apiBaseUrl" defaultValue={config?.api_base_url ?? ""} type="url" placeholder="https://api.example.com" autoComplete="off" className="mt-1 block w-full rounded-md border border-stone-200 p-2" />
          </label>
          <label className="block text-sm font-medium">
            Inventory Source (database catalog vs webhook URL)
            <select name="inventorySource" defaultValue={config?.inventory_source ?? "database"} className="mt-1 block w-full rounded-md border border-stone-200 p-2">
              <option value="database">Local Database Catalog (Seeded)</option>
              <option value="webhook">Custom HTTP Webhook API URL</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Products API URL (for Webhooks)
            <input name="productsApiUrl" defaultValue={config?.products_api_url ?? ""} type="url" placeholder="https://api.example.com/products" autoComplete="off" className="mt-1 block w-full rounded-md border border-stone-200 p-2" />
          </label>
          <label className="block text-sm font-medium">
            Auth header name
            <input name="authHeaderName" defaultValue={config?.auth_header_name ?? ""} placeholder="Authorization" autoComplete="off" className="mt-1 block w-full rounded-md border border-stone-200 p-2" />
          </label>
          <label className="block text-sm font-medium">
            Auth token
            <input name="authToken" defaultValue={config?.auth_token ?? ""} type="password" autoComplete="new-password" className="mt-1 block w-full rounded-md border border-stone-200 p-2" />
          </label>
          
          <div className="border-t border-stone-100 pt-5 mt-5">
            <h3 className="text-md font-semibold text-stone-900 mb-4">Embeddable Call Widget Settings</h3>
            <label className="block text-sm font-medium">
              Publishable Key (for external call widget integration)
              <PublishableKeyInput initialValue={config?.publishable_key ?? ""} />
            </label>
            <label className="block text-sm font-medium mt-3">
              Whitelisted Domains (comma separated, e.g. localhost, example.com)
              <input name="allowedDomains" defaultValue={config?.allowed_domains ?? ""} placeholder="localhost, example.com" autoComplete="off" className="mt-1 block w-full rounded-md border border-stone-200 p-2" />
            </label>
            {config?.publishable_key && (
              <div className="mt-5 rounded-md bg-stone-50 p-4 border border-stone-200">
                <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">Embed HTML Code</h4>
                <p className="text-xs text-stone-500 mb-3">Copy and paste this script tag into the HTML of your website where you want the call button to appear:</p>
                <pre className="overflow-x-auto rounded bg-stone-900 p-3 text-xs text-emerald-400 font-mono select-all leading-relaxed whitespace-pre">{embedCode}</pre>
              </div>
            )}
          </div>
          
          <button className="rounded-md bg-[#12382e] px-4 py-2.5 text-sm font-semibold text-white">Save connection</button>
        </form>
      </div>
    </DashboardShell>
  );
}