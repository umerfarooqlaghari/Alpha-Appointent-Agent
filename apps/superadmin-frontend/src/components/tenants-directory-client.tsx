"use client";

import { useState, useTransition } from "react";
import { Plus, Settings, Loader2, X, SlidersHorizontal, Layers, ShieldCheck } from "lucide-react";
import { addTenant, updateTenantSubscription, updateTenantFeatures } from "@/app/actions";

export type SubscriptionInfo = {
  planName: string;
  monthlyMinutesLimit: number;
  minutesUsed: number;
  isActive: boolean;
  daysLeft: number;
};

export type TenantResponse = {
  tenantId: string;
  name: string;
  status: string;
  createdAt: string;
  disabledTabs: string;
  industryType?: string;
  currency?: string;
  subscription: SubscriptionInfo | null;
};

export function TenantsDirectoryClient({ initialTenants }: { initialTenants: TenantResponse[] }) {
  const [tenants, setTenants] = useState<TenantResponse[]>(initialTenants);
  const [activePlanModalTenant, setActivePlanModalTenant] = useState<TenantResponse | null>(null);
  const [activeFeaturesModalTenant, setActiveFeaturesModalTenant] = useState<TenantResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUpdateSubscription = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activePlanModalTenant) return;
    setError(null);

    const formData = new FormData(e.currentTarget);
    const planName = String(formData.get("planName") || "Trial");
    const monthlyMinutesLimit = parseInt(String(formData.get("monthlyMinutesLimit") || "30"), 10);
    const isActive = formData.get("isActive") === "true";
    const resetMinutes = formData.get("resetMinutes") === "true";
    const industryType = String(formData.get("industryType") || "");
    const currency = String(formData.get("currency") || "USD");

    // Preserve existing disabledTabs
    formData.set("disabledTabs", activePlanModalTenant.disabledTabs || "");

    startTransition(async () => {
      try {
        await Promise.all([
          updateTenantSubscription(activePlanModalTenant.tenantId, formData),
          updateTenantFeatures(activePlanModalTenant.tenantId, formData)
        ]);

        // Optimistically update local state for 0ms instant UI response
        setTenants((prev) =>
          prev.map((t) => {
            if (t.tenantId === activePlanModalTenant.tenantId) {
              const currentSub = t.subscription;
              return {
                ...t,
                industryType: industryType || t.industryType,
                currency: currency || t.currency,
                subscription: {
                  planName,
                  monthlyMinutesLimit,
                  minutesUsed: resetMinutes ? 0.0 : currentSub?.minutesUsed ?? 0.0,
                  isActive,
                  daysLeft: currentSub?.daysLeft ?? 30,
                },
              };
            }
            return t;
          })
        );

        setActivePlanModalTenant(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update plan quota.";
        setError(msg);
      }
    });
  };

  const handleUpdateFeatures = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeFeaturesModalTenant) return;
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Gather disabled tabs based on feature toggles
    const disabledTabsList: string[] = [];
    if (!formData.get("feat_catalog")) disabledTabsList.push("inventory", "menu");
    if (!formData.get("feat_services")) disabledTabsList.push("services");
    if (!formData.get("feat_orders")) disabledTabsList.push("orders");
    if (!formData.get("feat_booking")) disabledTabsList.push("slots", "appointments");
    if (!formData.get("feat_faqs")) disabledTabsList.push("faqs");
    if (!formData.get("feat_calls")) disabledTabsList.push("call-logs");

    // Sales Module Sub-Modules
    if (!formData.get("feat_sales_leads")) disabledTabsList.push("leads");
    if (!formData.get("feat_sales_quotes")) disabledTabsList.push("quotes");
    if (!formData.get("feat_sales_orders")) disabledTabsList.push("sales-orders");
    if (!formData.get("feat_sales_analytics")) disabledTabsList.push("sales-analytics");

    // Finance Module Sub-Modules
    if (!formData.get("feat_fin_invoices")) disabledTabsList.push("invoices");
    if (!formData.get("feat_fin_expenses")) disabledTabsList.push("expenses");
    if (!formData.get("feat_fin_receivables")) disabledTabsList.push("receivables");

    const disabledTabsString = disabledTabsList.join(",");
    formData.set("disabledTabs", disabledTabsString);
    formData.set("industryType", activeFeaturesModalTenant.industryType || "");
    formData.set("currency", activeFeaturesModalTenant.currency || "USD");

    startTransition(async () => {
      try {
        await updateTenantFeatures(activeFeaturesModalTenant.tenantId, formData);

        // Optimistically update local state for 0ms instant UI response
        setTenants((prev) =>
          prev.map((t) => {
            if (t.tenantId === activeFeaturesModalTenant.tenantId) {
              return {
                ...t,
                disabledTabs: disabledTabsString,
              };
            }
            return t;
          })
        );

        setActiveFeaturesModalTenant(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update feature allocations.";
        setError(msg);
      }
    });
  };

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#071D75]">PLATFORM DIRECTORY</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080C42]">Tenant management</h1>
          <p className="mt-2 text-sm text-slate-500">
            Onboard and manage organizations, call usage quotas, and module feature allocations.
          </p>
        </div>
        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg bg-[#071D75] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#080C42] transition shadow-sm">
            <Plus size={17} />Add tenant
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-96 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <form action={addTenant} className="space-y-3">
              <label className="block text-xs font-medium text-slate-500">
                Organization Name
                <input
                  name="name"
                  placeholder="e.g. Apex Health Clinic"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                />
              </label>

              <label className="block text-xs font-medium text-slate-500">
                Tenant ID (Slug)
                <input
                  name="tenantId"
                  placeholder="e.g. apex-health"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                />
              </label>

              <label className="block text-xs font-medium text-slate-500">
                Industry Variant
                <select
                  name="industryType"
                  defaultValue="service"
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                >
                  <option value="restaurant">Restaurant (Menu & Food Orders)</option>
                  <option value="service">Service / Appointments (Slots & Bookings)</option>
                  <option value="retail">E-Commerce / Retail (Inventory & Product Orders)</option>
                  <option value="healthcare">Healthcare / Clinic (Doctor Slots & Visits)</option>
                  <option value="software">Software / IT & Tech (Subscriptions, Products & Services)</option>
                  <option value="general">General / Other</option>
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-500">
                Initial Admin Email
                <input
                  name="adminEmail"
                  type="email"
                  placeholder="admin@organization.com"
                  className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                />
              </label>

              <label className="block text-xs font-medium text-slate-500">
                Initial Admin Password
                <input
                  name="adminPassword"
                  type="password"
                  placeholder="••••••••"
                  className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                />
              </label>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#080C42] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#071D75] transition"
                >
                  Create Tenant Organization
                </button>
              </div>
            </form>
          </div>
        </details>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Organization</th>
              <th className="px-5 py-3.5">Industry / Currency</th>
              <th className="px-5 py-3.5">Plan / Quota</th>
              <th className="px-5 py-3.5">Minutes Used</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.map((tenant) => {
              const sub = tenant.subscription;
              const pct = sub && sub.monthlyMinutesLimit > 0
                ? Math.min(100, Math.round((sub.minutesUsed / sub.monthlyMinutesLimit) * 100))
                : 0;

              return (
                <tr key={tenant.tenantId} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">{tenant.name}</div>
                    <div className="font-mono text-xs text-slate-400">{tenant.tenantId}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
                      {tenant.industryType || "service"}
                    </span>
                    <span className="ml-1.5 font-mono text-xs text-slate-500 font-bold">
                      {tenant.currency || "USD"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-medium text-slate-900">
                      {sub?.planName || "Trial"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {sub ? (
                      sub.planName.toLowerCase() === "unlimited" ? (
                        <span className="text-xs text-purple-700 font-medium">Bypassed (Unlimited)</span>
                      ) : (
                        <div className="w-40">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{Math.round(sub.minutesUsed * 10) / 10} / {sub.monthlyMinutesLimit} m</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-[#071D75] rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs">
                    {sub ? (
                      <span className={sub.isActive ? "text-slate-700" : "text-rose-600 font-semibold"}>
                        {sub.isActive ? `${sub.daysLeft} days left` : "Suspended"}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setError(null);
                        setActivePlanModalTenant(tenant);
                      }}
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                    >
                      <Settings size={13} /> Edit Plan
                    </button>
                    <button
                      onClick={() => {
                        setError(null);
                        setActiveFeaturesModalTenant(tenant);
                      }}
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-[#071D75] hover:bg-blue-100 transition shadow-2xs"
                    >
                      <SlidersHorizontal size={13} /> Feature Allocations
                    </button>
                  </td>
                </tr>
              );
            })}
            {!tenants.length && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500">
                  No tenants onboarded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Plan / Quota Modal */}
      {activePlanModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-100 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-100">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Edit Plan & Quota</h3>
                <p className="text-xs text-slate-500">{activePlanModalTenant.name} ({activePlanModalTenant.tenantId})</p>
              </div>
              <button
                onClick={() => setActivePlanModalTenant(null)}
                disabled={isPending}
                type="button"
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateSubscription} className="space-y-4">
              <label className="block text-xs font-medium text-slate-500">
                Plan Name
                <select
                  name="planName"
                  defaultValue={activePlanModalTenant.subscription?.planName ?? "Trial"}
                  disabled={isPending}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none disabled:opacity-60"
                >
                  <option value="Trial">Trial (30 mins)</option>
                  <option value="Starter">Starter (500 mins)</option>
                  <option value="Pro">Pro (1,500 mins)</option>
                  <option value="Premium">Premium (5,000 mins)</option>
                  <option value="Unlimited">Unlimited (Bypassed)</option>
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-500">
                Monthly Minutes Limit
                <input
                  name="monthlyMinutesLimit"
                  type="number"
                  defaultValue={activePlanModalTenant.subscription?.monthlyMinutesLimit ?? 30}
                  disabled={isPending}
                  className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none disabled:opacity-60 font-mono"
                />
              </label>

              <label className="block text-xs font-medium text-slate-500">
                Subscription Status
                <select
                  name="isActive"
                  defaultValue={String(activePlanModalTenant.subscription?.isActive ?? true)}
                  disabled={isPending}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none disabled:opacity-60"
                >
                  <option value="true">Active</option>
                  <option value="false">Suspended</option>
                </select>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 pt-1">
                <input
                  type="checkbox"
                  name="resetMinutes"
                  value="true"
                  disabled={isPending}
                  className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                />
                Reset minute counter to 0
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  name="resetPeriod"
                  value="true"
                  disabled={isPending}
                  className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                />
                Reset trial days / billing period (+14 / +30 days)
              </label>

              <label className="block text-xs font-medium text-slate-500">
                Industry Variant / Type
                <select
                  name="industryType"
                  defaultValue={activePlanModalTenant.industryType || "service"}
                  disabled={isPending}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none disabled:opacity-60"
                >
                  <option value="restaurant">Restaurant (Menu & Food Orders)</option>
                  <option value="service">Service / Appointments (Slots & Bookings)</option>
                  <option value="retail">E-Commerce / Retail (Inventory & Product Orders)</option>
                  <option value="healthcare">Healthcare / Clinic (Doctor Slots & Visits)</option>
                  <option value="software">Software / IT & Tech (Subscriptions, Projects & Services)</option>
                  <option value="general">General / Other</option>
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-500">
                Tenant Currency
                <select
                  name="currency"
                  defaultValue={activePlanModalTenant.currency || "USD"}
                  disabled={isPending}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none disabled:opacity-60"
                >
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="CAD">CAD ($ - Canadian Dollar)</option>
                  <option value="AUD">AUD ($ - Australian Dollar)</option>
                  <option value="PKR">PKR (Rs - Pakistani Rupee)</option>
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="AED">AED (AED - UAE Dirham)</option>
                  <option value="SAR">SAR (SAR - Saudi Riyal)</option>
                </select>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePlanModalTenant(null)}
                  disabled={isPending}
                  className="w-1/2 rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-1/2 flex items-center justify-center gap-2 rounded-lg bg-[#080C42] hover:bg-[#071D75] py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 shadow-md"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Plan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature Allocations Modal */}
      {activeFeaturesModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-100 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-100 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="text-[#071D75]" size={20} />
                <div>
                  <h3 className="text-lg font-bold text-[#080C42]">Feature Allocations</h3>
                  <p className="text-xs text-slate-500">{activeFeaturesModalTenant.name} ({activeFeaturesModalTenant.tenantId})</p>
                </div>
              </div>
              <button
                onClick={() => setActiveFeaturesModalTenant(null)}
                disabled={isPending}
                type="button"
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateFeatures} className="space-y-4">
              <p className="text-xs text-slate-500">
                Control which modules and sub-modules are accessible to this tenant organization:
              </p>

              {/* Core Features */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Layers size={13} className="text-[#071D75]" /> Core Platform Features
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="feat_catalog"
                      value="true"
                      defaultChecked={!activeFeaturesModalTenant.disabledTabs?.includes("inventory") && !activeFeaturesModalTenant.disabledTabs?.includes("menu")}
                      disabled={isPending}
                      className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                    />
                    Catalog (Menu / Inventory)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="feat_services"
                      value="true"
                      defaultChecked={!activeFeaturesModalTenant.disabledTabs?.includes("services")}
                      disabled={isPending}
                      className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                    />
                    Services & Pricing
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="feat_orders"
                      value="true"
                      defaultChecked={!activeFeaturesModalTenant.disabledTabs?.includes("orders")}
                      disabled={isPending}
                      className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                    />
                    Orders (POS / Food)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="feat_booking"
                      value="true"
                      defaultChecked={!activeFeaturesModalTenant.disabledTabs?.includes("slots") && !activeFeaturesModalTenant.disabledTabs?.includes("appointments")}
                      disabled={isPending}
                      className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                    />
                    Slots & Appointments
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="feat_faqs"
                      value="true"
                      defaultChecked={!activeFeaturesModalTenant.disabledTabs?.includes("faqs")}
                      disabled={isPending}
                      className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                    />
                    FAQs Knowledgebase
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="feat_calls"
                      value="true"
                      defaultChecked={!activeFeaturesModalTenant.disabledTabs?.includes("call-logs")}
                      disabled={isPending}
                      className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                    />
                    Call Logs & Transcripts
                  </label>
                </div>
              </div>

              {/* Sales Module */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#080C42] flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[#071D75]" /> Sales Module (1.0)
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="feat_sales_leads"
                      value="true"
                      defaultChecked={!activeFeaturesModalTenant.disabledTabs?.includes("leads")}
                      disabled={isPending}
                      className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                    />
                    1.1 Leads & Pipeline
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="feat_sales_quotes"
                      value="true"
                      defaultChecked={!activeFeaturesModalTenant.disabledTabs?.includes("quotes")}
                      disabled={isPending}
                      className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                    />
                    1.2 Quotes & Proposals
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="feat_sales_orders"
                      value="true"
                      defaultChecked={!activeFeaturesModalTenant.disabledTabs?.includes("sales-orders")}
                      disabled={isPending}
                      className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                    />
                    1.3 Unified Orders
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="feat_sales_analytics"
                      value="true"
                      defaultChecked={!activeFeaturesModalTenant.disabledTabs?.includes("sales-analytics")}
                      disabled={isPending}
                      className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                    />
                    1.4 Sales Analytics
                  </label>
                </div>
              </div>

              {/* Finance Module */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#080C42] flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[#071D75]" /> Finance Module (2.0)
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="feat_fin_invoices"
                      value="true"
                      defaultChecked={!activeFeaturesModalTenant.disabledTabs?.includes("invoices")}
                      disabled={isPending}
                      className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                    />
                    2.1 Invoicing & Billing
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="feat_fin_expenses"
                      value="true"
                      defaultChecked={!activeFeaturesModalTenant.disabledTabs?.includes("expenses")}
                      disabled={isPending}
                      className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                    />
                    2.2 Expense & COGS
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="feat_fin_receivables"
                      value="true"
                      defaultChecked={!activeFeaturesModalTenant.disabledTabs?.includes("receivables")}
                      disabled={isPending}
                      className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                    />
                    2.3 Accounts Receivable
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveFeaturesModalTenant(null)}
                  disabled={isPending}
                  className="w-1/2 rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-1/2 flex items-center justify-center gap-2 rounded-lg bg-[#080C42] hover:bg-[#071D75] py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 shadow-md"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating Allocations...
                    </>
                  ) : (
                    "Save Allocations"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
