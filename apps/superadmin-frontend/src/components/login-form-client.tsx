"use client";

import { useTransition, useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { login } from "@/app/login/actions";

export function SuperadminLoginFormClient({ initialError }: { initialError?: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(initialError);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await login(formData);
        if (res?.error) {
          setError(res.error);
        }
      } catch (err: unknown) {
        const isRedirect =
          err &&
          typeof err === "object" &&
          ("message" in err && (err as { message: string }).message === "NEXT_REDIRECT" ||
           "digest" in err && String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT"));

        if (isRedirect) {
          return;
        }

        const msg = err instanceof Error ? err.message : "Invalid email or password.";
        setError(msg);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">RELAY CONTROL</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Superadmin sign in</h1>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <label className="block text-xs font-medium text-slate-600">
        Email Address
        <input
          required
          name="email"
          type="email"
          placeholder="admin@relaycontrol.com"
          disabled={isPending}
          className="mt-1 w-full rounded-md border border-slate-200 p-2.5 text-sm focus:border-teal-600 focus:outline-none disabled:opacity-60"
        />
      </label>

      <label className="block text-xs font-medium text-slate-600">
        Password
        <div className="relative mt-1">
          <input
            required
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            disabled={isPending}
            className="w-full rounded-md border border-slate-200 p-2.5 pr-10 text-sm focus:border-teal-600 focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-60 shadow-sm"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
