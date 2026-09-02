"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, Loader2, X, Sparkles } from "lucide-react";
import { createPlan, updatePlan, deletePlan } from "@/app/actions";

export type PlanResponse = {
  id: string;
  planName: string;
  monthlyMinutesLimit: number;
  price: number;
  description: string;
  isActive: boolean;
  createdAt: string;
};

export function PlansManagementClient({ initialPlans }: { initialPlans: PlanResponse[] }) {
  const [plans, setPlans] = useState<PlanResponse[]>(initialPlans);
  const [editingPlan, setEditingPlan] = useState<PlanResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCreatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await createPlan(formData);
        form.reset();
        window.location.reload();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create plan.";
        alert(msg);
      }
    });
  };

  const handleUpdatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPlan) return;
    setError(null);

    const formData = new FormData(e.currentTarget);
    const planName = String(formData.get("planName") || "").trim();
    const monthlyMinutesLimit = parseInt(String(formData.get("monthlyMinutesLimit") || "500"), 10);
    const price = parseFloat(String(formData.get("price") || "0.00"));
    const description = String(formData.get("description") || "");
    const isActive = formData.get("isActive") === "true";

    startTransition(async () => {
      try {
        await updatePlan(editingPlan.id, formData);

        // Optimistically update local state for 0ms UI feedback
        setPlans((prev) =>
          prev.map((p) =>
            p.id === editingPlan.id
              ? { ...p, planName, monthlyMinutesLimit, price, description, isActive }
              : p
          )
        );

        setEditingPlan(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update plan.";
        setError(msg);
      }
    });
  };

  const handleDeletePlan = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" plan?`)) return;

    startTransition(async () => {
      try {
        await deletePlan(id);
        setPlans((prev) => prev.filter((p) => p.id !== id));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to delete plan.";
        alert(msg);
      }
    });
  };

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#071D75]">PRICING & TIERS</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080C42]">Subscription Plans</h1>
          <p className="mt-2 text-sm text-slate-500">
            Create, edit prices, set calling minute caps, and manage tenant subscription packages.
          </p>
        </div>
        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg bg-[#071D75] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#080C42] transition">
            <Plus size={17} /> Create New Plan
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-96 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <p className="font-bold text-[#080C42] flex items-center gap-1.5 text-sm">
                <Sparkles size={16} className="text-[#071D75]" /> New Subscription Package
              </p>
              <input required name="planName" placeholder="Plan Name (e.g. Starter, Enterprise)" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none" />
              <div className="flex gap-2">
                <input required name="monthlyMinutesLimit" type="number" placeholder="Minutes Limit (e.g. 1000)" className="w-1/2 rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none" />
                <input required name="price" type="number" step="0.01" placeholder="Price ($)" className="w-1/2 rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none" />
              </div>
              <textarea name="description" placeholder="Short plan description..." rows={2} className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none" />
              <select name="isActive" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none">
                <option value="true">Active (Visible to Tenants)</option>
                <option value="false">Disabled / Hidden</option>
              </select>
              <button disabled={isPending} className="w-full rounded-lg bg-[#080C42] p-2.5 text-sm font-semibold text-white hover:bg-[#071D75] transition disabled:opacity-60 shadow-md">
                {isPending ? "Creating..." : "Save Plan"}
              </button>
            </form>
          </div>
        </details>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-5 py-4">Plan Name</th>
              <th className="px-5 py-4">Monthly Cap</th>
              <th className="px-5 py-4">Price</th>
              <th className="px-5 py-4">Description</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-t border-slate-100 align-middle hover:bg-slate-50/50 transition">
                <td className="px-5 py-4 font-bold text-[#080C42]">{plan.planName}</td>
                <td className="px-5 py-4 font-mono text-xs text-slate-700">
                  {plan.monthlyMinutesLimit.toLocaleString()} mins
                </td>
                <td className="px-5 py-4 font-bold text-[#071D75]">
                  ${Number(plan.price).toFixed(2)} <span className="text-xs font-normal text-slate-500">/mo</span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">
                  {plan.description || "—"}
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    plan.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-500"
                  }`}>
                    {plan.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-5 py-4 text-right space-x-2">
                  <button
                    onClick={() => setEditingPlan(plan)}
                    type="button"
                    className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <Edit2 size={13} /> Edit Price
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id, plan.planName)}
                    type="button"
                    className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-100 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
            {!plans.length && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500">
                  No subscription plans defined. Click &quot;Create New Plan&quot; above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 0ms Instant Client Modal for Editing Plan */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-100">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Edit Plan Details</h3>
                <p className="text-xs text-slate-500">ID: {editingPlan.id}</p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
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

            <form onSubmit={handleUpdatePlan} className="space-y-4">
              <label className="block text-xs font-medium text-slate-500">
                Plan Name
                <input
                  name="planName"
                  defaultValue={editingPlan.planName}
                  disabled={isPending}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none disabled:opacity-60"
                />
              </label>

              <div className="flex gap-3">
                <label className="block w-1/2 text-xs font-medium text-slate-500">
                  Monthly Minutes Limit
                  <input
                    name="monthlyMinutesLimit"
                    type="number"
                    defaultValue={editingPlan.monthlyMinutesLimit}
                    disabled={isPending}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none disabled:opacity-60"
                  />
                </label>

                <label className="block w-1/2 text-xs font-medium text-slate-500">
                  Monthly Price ($)
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingPlan.price}
                    disabled={isPending}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none disabled:opacity-60"
                  />
                </label>
              </div>

              <label className="block text-xs font-medium text-slate-500">
                Description
                <textarea
                  name="description"
                  defaultValue={editingPlan.description}
                  disabled={isPending}
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none disabled:opacity-60"
                />
              </label>

              <label className="block text-xs font-medium text-slate-500">
                Status
                <select
                  name="isActive"
                  defaultValue={String(editingPlan.isActive)}
                  disabled={isPending}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none disabled:opacity-60"
                >
                  <option value="true">Active (Visible)</option>
                  <option value="false">Disabled</option>
                </select>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
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
