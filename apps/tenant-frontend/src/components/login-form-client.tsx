"use client";

import { useTransition, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Shield, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { login, registerWorkspace } from "@/app/login/actions";

export function TenantLoginFormClient({
  initialError,
  initialPlan,
  initialMode,
}: {
  initialError?: string;
  initialPlan?: string;
  initialMode?: string;
}) {
  const [mode, setMode] = useState<"signin" | "register">(
    initialMode === "register" ? "register" : "signin"
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(initialError);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);
    const formData = new FormData(e.currentTarget);
    if (initialPlan) {
      formData.append("selectedPlan", initialPlan);
      formData.append("redirectTo", "/dashboard/:tenantId/billing");
    }

    startTransition(async () => {
      try {
        const res = mode === "signin" ? await login(formData) : await registerWorkspace(formData);
        if (res?.error) {
          setError(res.error);
        }
      } catch (err: unknown) {
        const isRedirect =
          err &&
          typeof err === "object" &&
          (("message" in err && (err as { message: string }).message === "NEXT_REDIRECT") ||
            ("digest" in err && String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")));

        if (isRedirect) {
          return;
        }

        const msg =
          err instanceof Error
            ? err.message
            : mode === "signin"
            ? "Invalid email or password."
            : "Registration failed. Please try again.";
        setError(msg);
      }
    });
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Return to marketing link */}
      <div className="flex items-center justify-between text-xs px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-white/80 hover:text-white transition font-medium"
        >
          <ArrowLeft size={14} />
          <span>Back to Marketing Overview</span>
        </Link>
        <span className="text-white/60 font-medium">Alpha RelayDesk</span>
      </div>

      <div className="rounded-3xl bg-white p-7 sm:p-8 shadow-2xl border border-white/20 relative overflow-hidden">
        {/* Top Plan Safeguard Banner (if coming from plan selection) */}
        {initialPlan && (
          <div className="mb-6 rounded-2xl bg-orange-50 border border-orange-200/80 p-3.5 text-xs text-slate-800 space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#EA580C]">
              <Lock size={14} />
              <span>Payment &amp; Credential Safeguard Active</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Selected <strong>{initialPlan} Plan</strong>. To safeguard your payments and workspace configurations, please authenticate before proceeding to billing.
            </p>
          </div>
        )}

        <div className="flex flex-col items-center text-center">
          <div className="relative size-14 overflow-hidden rounded-2xl border border-slate-200 shadow-sm mb-3">
            <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#EA580C]">
            RELAY DESK AI
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#090D1A]">
            {mode === "signin" ? "Tenant Sign In" : "Register Workspace"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {mode === "signin"
              ? "Access your AI calling logs, appointments & settings"
              : "Set up your autonomous appointment workspace in seconds"}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="mt-5 grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(undefined);
            }}
            className={`py-2 rounded-lg transition ${
              mode === "signin" ? "bg-white text-[#090D1A] shadow-xs" : "hover:text-black"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(undefined);
            }}
            className={`py-2 rounded-lg transition ${
              mode === "register" ? "bg-white text-[#090D1A] shadow-xs" : "hover:text-black"
            }`}
          >
            Create Workspace
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === "register" && (
            <label className="block text-xs font-medium text-slate-700">
              Organization / Company Name
              <input
                required
                name="companyName"
                type="text"
                placeholder="e.g. Metro Dental Care"
                disabled={isPending}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none disabled:opacity-60"
              />
            </label>
          )}

          <label className="block text-xs font-medium text-slate-700">
            Email Address
            <input
              required
              name="email"
              type="email"
              placeholder="admin@organization.com"
              disabled={isPending}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none disabled:opacity-60"
            />
          </label>

          <label className="block text-xs font-medium text-slate-700">
            Password
            <div className="relative mt-1">
              <input
                required
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={isPending}
                className="w-full rounded-xl border border-slate-200 p-2.5 pr-10 text-xs text-slate-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {mode === "register" && (
            <label className="block text-xs font-medium text-slate-700">
              Industry Focus
              <select
                name="industryType"
                disabled={isPending}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#EA580C] focus:outline-none disabled:opacity-60"
              >
                <option value="healthcare">Healthcare &amp; Clinic</option>
                <option value="dental">Dental Practice</option>
                <option value="legal">Law Firm &amp; Consulting</option>
                <option value="salon">Salon &amp; Wellness</option>
                <option value="home-services">Home &amp; Field Services</option>
                <option value="general">Other / Enterprise</option>
              </select>
            </label>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#090D1A] py-3 text-xs sm:text-sm font-bold text-white hover:bg-black transition-all disabled:opacity-60 shadow-md hover:shadow-lg mt-2"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {mode === "signin" ? "Signing in..." : "Creating workspace..."}
              </>
            ) : mode === "signin" ? (
              "Sign in to Dashboard"
            ) : (
              "Create Workspace & Get Started"
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Shield size={12} className="text-emerald-600" />
            Isolated Tenant Database
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-600" />
            256-Bit TLS
          </span>
        </div>
      </div>
    </div>
  );
}
