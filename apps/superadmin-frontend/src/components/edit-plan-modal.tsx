"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTenantSubscription } from "@/app/actions";
import { Loader2, X } from "lucide-react";

type SubscriptionInfo = {
  planName: string;
  monthlyMinutesLimit: number;
  minutesUsed: number;
  isActive: boolean;
  daysLeft: number;
};

type TenantResponse = {
  tenantId: string;
  name: string;
  status: string;
  createdAt: string;
  subscription: SubscriptionInfo | null;
};

export function EditPlanModal({ tenant }: { tenant: TenantResponse }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sub = tenant.subscription;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateTenantSubscription(tenant.tenantId, formData);
        router.push("/tenants");
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update subscription.";
        setError(msg);
      }
    });
  };

  const closeModal = () => {
    router.push("/tenants");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Manage Quota</h3>
            <p className="text-xs text-slate-500">{tenant.name} ({tenant.tenantId})</p>
          </div>
          <button
            onClick={closeModal}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-medium text-slate-500">
            Plan Name
            <select
              name="planName"
              defaultValue={sub?.planName ?? "Trial"}
              disabled={isPending}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white p-2 text-sm focus:border-teal-500 focus:outline-none disabled:opacity-60"
            >
              <option value="Trial">Trial (30 mins)</option>
              <option value="Starter">Starter (500 mins)</option>
              <option value="Unlimited">Unlimited (Bypassed)</option>
            </select>
          </label>

          <label className="block text-xs font-medium text-slate-500">
            Monthly Minutes Limit
            <input
              name="monthlyMinutesLimit"
              type="number"
              defaultValue={sub?.monthlyMinutesLimit ?? 30}
              disabled={isPending}
              className="mt-1 block w-full rounded-md border border-slate-200 p-2 text-sm focus:border-teal-500 focus:outline-none disabled:opacity-60"
            />
          </label>

          <label className="block text-xs font-medium text-slate-500">
            Status
            <select
              name="isActive"
              defaultValue={String(sub?.isActive ?? true)}
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

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
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
  );
}
