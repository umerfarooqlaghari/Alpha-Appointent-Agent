"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/app/actions";

export function UpgradePlanButton({
  tenantId,
  planName,
  isCurrent,
  isPopular,
}: {
  tenantId: string;
  planName: string;
  isCurrent: boolean;
  isPopular: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (isCurrent || loading) return;
    setLoading(true);

    try {
      const res = await createCheckoutSession(tenantId, planName);
      if (res?.url) {
        window.location.href = res.url;
      } else if (res?.message) {
        alert(res.message);
      } else {
        alert(`Selected ${planName} Plan. Stripe keys are not configured yet on backend. Contact Superadmin to upgrade your calling quota.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate checkout.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 w-full">
      <button
        onClick={handleUpgrade}
        disabled={isCurrent || loading}
        type="button"
        className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition shadow-sm ${
          isCurrent
            ? "bg-stone-100 text-stone-400 cursor-not-allowed"
            : isPopular
            ? "bg-[#080C42] text-white hover:bg-[#071D75]"
            : "border border-slate-200 bg-white text-[#080C42] hover:bg-slate-50 font-semibold"
        }`}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Processing...
          </>
        ) : isCurrent ? (
          "Active Plan"
        ) : (
          `Upgrade to ${planName}`
        )}
      </button>
    </div>
  );
}
