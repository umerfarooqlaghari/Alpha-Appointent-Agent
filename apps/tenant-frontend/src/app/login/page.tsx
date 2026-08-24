import { TenantLoginFormClient } from "@/components/login-form-client";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[#12382e] p-6">
      <TenantLoginFormClient initialError={error} />
    </main>
  );
}