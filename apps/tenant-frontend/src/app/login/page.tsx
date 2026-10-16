import { TenantLoginFormClient } from "@/components/login-form-client";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; plan?: string; mode?: string }>;
}) {
  const { error, plan, mode } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[#140D0A] p-6 selection:bg-[#EA580C] selection:text-white relative">
      <div
        className="absolute inset-0 pointer-events-none opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, #2f1d16 0%, #17100d 50%, #0d0806 100%)",
        }}
      />
      <div className="relative z-10 w-full flex justify-center">
        <TenantLoginFormClient initialError={error} initialPlan={plan} initialMode={mode} />
      </div>
    </main>
  );
}