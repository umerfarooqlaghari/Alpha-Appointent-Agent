"use client";

import { useState, useTransition } from "react";
import { Plus, Settings, Loader2, X } from "lucide-react";
import { addTenant, updateTenantSubscription } from "@/app/actions";

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
  subscription: SubscriptionInfo | null;
};

export function TenantsDirectoryClient({ initialTenants }: { initialTenants: TenantResponse[] }) {
  const [tenants, setTenants] = useState<TenantResponse[]>(initialTenants);
  const [activeModalTenant, setActiveModalTenant] = useState<TenantResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUpdateSubscription = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeModalTenant) return;
    setError(null);

    const formData = new FormData(e.currentTarget);
    const planName = String(formData.get("planName") || "Trial");
    const monthlyMinutesLimit = parseInt(String(formData.get("monthlyMinutesLimit") || "30"), 10);
    const isActive = formData.get("isActive") === "true";
    const resetMinutes = formData.get("resetMinutes") === "true";

    startTransition(async () => {
      try {
        await updateTenantSubscription(activeModalTenant.tenantId, formData);

        // Optimistically update local state for 0ms instant UI response
        setTenants((prev) =>
          prev.map((t) => {
            if (t.tenantId === activeModalTenant.tenantId) {
              const currentSub = t.subscription;
              return {
                ...t,
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

        // 0ms instant modal closure
        setActiveModalTenant(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update subscription.";
        setError(msg);
      }
    });
  };

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-teal-700">PLATFORM DIRECTORY</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tenant management</h1>
          <p className="mt-2 text-sm text-slate-500">
            Onboard and manage organizations and their call usage quotas.
          </p>
        </div>
        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md bg-[#0f766e] px-4 py-2.5 text-sm font-semibold text-white">
            <Plus size={17} />Add tenant
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-96 rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <form action={addTenant} className="space-y-3">
              <p className="font-semibold">New tenant</p>
              <input required name="name" placeholder="Organization name" className="w-full rounded-md border border-slate-200 p-2 text-sm" />
              <input required name="tenantId" placeholder="tenant-id" pattern="[a-z0-9-]+" className="w-full rounded-md border border-slate-200 p-2 text-sm" />
              <input required name="adminName" placeholder="Tenant admin name" className="w-full rounded-md border border-slate-200 p-2 text-sm" />
              <input required name="adminEmail" type="email" placeholder="Tenant admin email" className="w-full rounded-md border border-slate-200 p-2 text-sm" />
              <input required name="adminPassword" type="password" placeholder="Temporary admin password" className="w-full rounded-md border border-slate-200 p-2 text-sm" />
              <input name="adminPhone" placeholder="Tenant admin phone" className="w-full rounded-md border border-slate-200 p-2 text-sm" />
              <select name="adapterType" className="w-full rounded-md border border-slate-200 p-2 text-sm">
                <option value="postgres">PostgreSQL</option>
                <option value="shopify">Shopify</option>
                <option value="pos-http">POS HTTP</option>
              </select>
              <input name="apiBaseUrl" placeholder="API base URL (optional)" className="w-full rounded-md border border-slate-200 p-2 text-sm" />
              <input name="authHeaderName" placeholder="Auth header name" className="w-full rounded-md border border-slate-200 p-2 text-sm" />
              <input name="authToken" type="password" placeholder="Auth token" className="w-full rounded-md border border-slate-200 p-2 text-sm" />
              <button className="w-full rounded-md bg-slate-900 p-2.5 text-sm font-semibold text-white">Create tenant</button>
            </form>
          </div>
        </details>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4">Organization</th>
              <th className="px-5 py-4">Tenant ID</th>
              <th className="px-5 py-4">Active Plan</th>
              <th className="px-5 py-4">Calling Usage</th>
              <th className="px-5 py-4">Subscription Period</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => {
              const sub = tenant.subscription;
              const pct = sub ? Math.min(100, Math.round((sub.minutesUsed / sub.monthlyMinutesLimit) * 100)) : 0;

              return (
                <tr key={tenant.tenantId} className="border-t border-slate-100 align-middle">
                  <td className="px-5 py-4 font-medium text-slate-900">{tenant.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{tenant.tenantId}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      sub?.planName.toLowerCase() === "unlimited"
                        ? "bg-purple-50 text-purple-700 border border-purple-100"
                        : sub?.planName.toLowerCase() === "trial"
                        ? "bg-teal-50 text-teal-700 border border-teal-100"
                        : "bg-blue-50 text-blue-700 border border-blue-100"
                    }`}>
                      {sub?.planName ?? "No Plan"}
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
                            <div className="h-full bg-teal-600 rounded-full" style={{ width: `${pct}%` }}></div>
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
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setActiveModalTenant(tenant)}
                      type="button"
                      className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Settings size={13} /> Edit Plan
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

      {/* 0ms Instant Client Modal */}
      {activeModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-100">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Manage Quota</h3>
                <p className="text-xs text-slate-500">{activeModalTenant.name} ({activeModalTenant.tenantId})</p>
              </div>
              <button
                onClick={() => setActiveModalTenant(null)}
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
                  defaultValue={activeModalTenant.subscription?.planName ?? "Trial"}
                  disabled={isPending}
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white p-2 text-sm focus:border-teal-500 focus:outline-none disabled:opacity-60"
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
                  defaultValue={activeModalTenant.subscription?.monthlyMinutesLimit ?? 30}
                  disabled={isPending}
                  className="mt-1 block w-full rounded-md border border-slate-200 p-2 text-sm focus:border-teal-500 focus:outline-none disabled:opacity-60"
                />
              </label>

              <label className="block text-xs font-medium text-slate-500">
                Status
                <select
                  name="isActive"
                  defaultValue={String(activeModalTenant.subscription?.isActive ?? true)}
                  disabled={isPending}
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white p-2 text-sm focus:border-teal-500 focus:outline-none disabled:opacity-60"
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
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                Reset minute counter to 0
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  name="resetPeriod"
                  value="true"
                  disabled={isPending}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                Reset trial days / billing period (+14 / +30 days)
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalTenant(null)}
                  disabled={isPending}
                  className="w-1/2 rounded-md border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-1/2 flex items-center justify-center gap-2 rounded-md bg-[#0f766e] py-2 text-sm font-semibold text-white hover:bg-teal-800 transition-colors disabled:opacity-60 shadow-sm"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
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
