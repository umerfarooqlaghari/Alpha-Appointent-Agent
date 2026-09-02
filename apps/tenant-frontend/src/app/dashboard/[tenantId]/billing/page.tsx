import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { Check, Zap, Crown, Sparkles, Building2, Clock, ShieldCheck } from "lucide-react";
import { UpgradePlanButton } from "@/components/upgrade-plan-button";

type SubscriptionData = {
  planName: string;
  monthlyMinutesLimit: number;
  minutesUsed: number;
  isActive: boolean;
  daysLeft: number;
};

type DbPlan = {
  id: string;
  planName: string;
  monthlyMinutesLimit: number;
  price: number;
  description: string;
  isActive: boolean;
};

export default async function BillingPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  const subData = await tenantApi<SubscriptionData>(
    `/api/tenants/${encodeURIComponent(decodedTenantId)}/subscription`
  ).catch(() => null);

  const dbPlans = await tenantApi<DbPlan[]>("/api/public/plans").catch(() => []);

  const sub = subData || {
    planName: "Trial",
    monthlyMinutesLimit: 30,
    minutesUsed: 0.0,
    isActive: true,
    daysLeft: 14,
  };

  const percentage = Math.min(100, Math.round((sub.minutesUsed / sub.monthlyMinutesLimit) * 100)) || 0;

  const activeDbPlans = dbPlans.filter((p) => p.isActive && p.planName.toLowerCase() !== "trial");

  const plans = activeDbPlans.length > 0
    ? activeDbPlans.map((p, idx) => ({
        name: p.planName,
        minutes: `${p.monthlyMinutesLimit.toLocaleString()} Minutes`,
        price: `$${Number(p.price).toFixed(2)}`,
        period: "/month",
        icon: idx === 1 ? Sparkles : idx === 2 ? Crown : Zap,
        popular: idx === 1,
        features: [
          `${p.monthlyMinutesLimit.toLocaleString()} calling minutes included`,
          p.description || "Full n8n appointment automation",
          "Domain whitelisting protection",
          "Standard Vapi voice model",
          "Full FAQ catalog access",
        ],
      }))
    : [
        {
          name: "Starter",
          minutes: "500 Minutes",
          price: "$50.00",
          period: "/month",
          icon: Zap,
          popular: false,
          features: [
            "500 calling minutes included",
            "Full n8n appointment automation",
            "Domain whitelisting protection",
            "Standard Vapi voice model",
            "Full FAQ catalog access",
          ],
        },
        {
          name: "Pro",
          minutes: "1,500 Minutes",
          price: "$120.00",
          period: "/month",
          icon: Sparkles,
          popular: true,
          features: [
            "1,500 calling minutes included",
            "High-priority Vapi pipeline",
            "Domain whitelisting protection",
            "Full n8n appointment automation",
            "24/7 Voice availability",
          ],
        },
        {
          name: "Premium",
          minutes: "5,000 Minutes",
          price: "$350.00",
          period: "/month",
          icon: Crown,
          popular: false,
          features: [
            "5,000 calling minutes included",
            "Dedicated high-volume Vapi line",
            "Custom branding & WebRTC options",
            "Priority support & SLAs",
            "Unlimited FAQ catalog entries",
          ],
        },
      ];

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="mx-auto max-w-5xl space-y-10">
        <div>
          <p className="text-xs font-bold text-[#071D75] uppercase tracking-wider">Subscription & Usage</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#080C42]">Billing Overview</h2>
          <p className="mt-2 text-sm text-slate-500">
            Monitor your monthly Vapi calling package, track minute consumption, and upgrade tier plans.
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-50 border border-blue-200/60 px-3 py-1 text-xs font-bold text-[#071D75] uppercase tracking-wider">
                  {sub.planName} Plan
                </span>
                {sub.isActive ? (
                  <span className="flex items-center gap-1.5 text-xs text-blue-700 font-medium">
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                    Active
                  </span>
                ) : (
                  <span className="text-xs text-rose-600 font-semibold">Suspended</span>
                )}
              </div>
              <h3 className="mt-3 text-xl font-bold text-[#080C42]">Vapi Voice Calling Package</h3>
              <p className="text-xs text-slate-500 mt-1">Your current package limits and remaining days in billing cycle.</p>
            </div>
            <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <div className="flex items-center sm:justify-end gap-1.5 text-2xl font-bold text-[#080C42]">
                <Clock size={20} className="text-[#071D75]" />
                {sub.daysLeft} days
              </div>
              <p className="text-xs text-slate-500">remaining in current period</p>
            </div>
          </div>

          {sub.planName.toLowerCase() !== "unlimited" ? (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between text-sm text-slate-700 font-medium">
                <span>Call Minutes Used ({Math.round(sub.minutesUsed * 10) / 10} / {sub.monthlyMinutesLimit} mins)</span>
                <span className="text-[#071D75] font-bold">{percentage}%</span>
              </div>
              <div className="mt-2.5 h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#071D75] transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-2 text-sm text-[#080C42] font-medium bg-blue-50/60 p-4 rounded-lg border border-blue-100">
              <ShieldCheck size={18} className="text-[#071D75] shrink-0" />
              <span>Superadmin Unlimited Override is active. Your minute quotas are fully bypassed.</span>
            </div>
          )}
        </div>

        {/* Packages Section */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-8">
            <h3 className="text-2xl font-bold text-[#080C42]">Available Calling Packages</h3>
            <p className="text-sm text-slate-500 mt-1">
              Select a plan package below to upgrade your available monthly Vapi calling minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = sub.planName.toLowerCase() === plan.name.toLowerCase();

              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-xs transition-all ${
                    plan.popular
                      ? "border-[#071D75] ring-2 ring-[#071D75]/20 shadow-md"
                      : "border-slate-200"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#071D75] px-3.5 py-0.5 text-xs font-bold text-white shadow-sm">
                      Most Popular
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-blue-50 p-2.5 text-[#071D75]">
                      <Icon size={22} />
                    </div>
                    {isCurrent && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <h4 className="mt-4 text-lg font-bold text-[#080C42]">{plan.name} Plan</h4>
                  <p className="text-xs text-[#071D75] font-semibold mt-0.5">{plan.minutes}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight text-[#080C42]">{plan.price}</span>
                    <span className="text-xs text-slate-500 font-medium">{plan.period}</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-xs text-slate-600 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check size={14} className="text-[#071D75] shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <UpgradePlanButton
                    tenantId={decodedTenantId}
                    planName={plan.name}
                    isCurrent={isCurrent}
                    isPopular={plan.popular}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Plan Banner */}
        <div className="rounded-2xl border border-blue-900 bg-[#080C42] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Building2 size={16} /> Enterprise & Custom Plans
            </div>
            <h4 className="text-xl font-bold text-white">Need more than 5,000 minutes per month?</h4>
            <p className="text-xs text-blue-200/80 max-w-xl">
              We offer custom volume pricing, dedicated voice trunking, and direct billing for enterprise partners.
            </p>
          </div>
          <a
            href="mailto:support@alphadevs.cloud"
            className="shrink-0 rounded-xl bg-[#071D75] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a299e] transition shadow-md"
          >
            Contact Sales Team
          </a>
        </div>
      </div>
    </DashboardShell>
  );
}
