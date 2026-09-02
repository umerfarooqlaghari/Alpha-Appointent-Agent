import { SuperadminLoginFormClient } from "@/components/login-form-client";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[#080C42] p-6">
      <SuperadminLoginFormClient initialError={error} />
    </main>
  );
}