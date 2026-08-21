import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const baseUrl = process.env.BACKEND_API_URL ?? (() => { throw new Error("BACKEND_API_URL is required."); })();

export async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = (await cookies()).get("auth_token")?.value;
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json", ...init?.headers }, cache: "no-store" });
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) throw new Error(`Backend request failed: ${response.status}`);
  return response.status === 204 ? (undefined as T) : response.json();
}