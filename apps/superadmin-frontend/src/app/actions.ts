"use server";
import { revalidatePath } from "next/cache";
import { adminApi } from "@/lib/api";

const allowedAdapters = new Set(["postgres", "shopify", "pos-http"]);
export async function addTenant(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const tenantId = String(formData.get("tenantId") || "").trim();
  const adapterType = String(formData.get("adapterType") || "postgres");
  if (!name || !tenantId) throw new Error("Tenant name and ID are required.");
  if (!/^[a-z0-9-]+$/.test(tenantId)) throw new Error("Tenant ID must use lowercase letters, numbers, and hyphens.");
  if (!allowedAdapters.has(adapterType)) throw new Error("Invalid adapter type.");
  await adminApi("/api/admin/tenants", { method: "POST", body: JSON.stringify({ tenantId, name, adapterType, apiBaseUrl: String(formData.get("apiBaseUrl") || "") || null, authHeaderName: String(formData.get("authHeaderName") || "") || null, authToken: String(formData.get("authToken") || "") || null, adminName: String(formData.get("adminName") || "") || null, adminEmail: String(formData.get("adminEmail") || ""), adminPassword: String(formData.get("adminPassword") || ""), adminPhone: String(formData.get("adminPhone") || "") || null }) });
  revalidatePath("/tenants");
}
