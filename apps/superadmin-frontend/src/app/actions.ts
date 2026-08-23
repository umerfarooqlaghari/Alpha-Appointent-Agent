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

export async function updateTenantSubscription(tenantId: string, formData: FormData) {
  const planName = String(formData.get("planName") || "Trial");
  const monthlyMinutesLimit = parseInt(String(formData.get("monthlyMinutesLimit") || "30"), 10);
  const isActive = formData.get("isActive") === "true";
  const resetMinutes = formData.get("resetMinutes") === "true";

  await adminApi(`/api/admin/tenants/${encodeURIComponent(tenantId)}/subscription`, {
    method: "PUT",
    body: JSON.stringify({
      planName,
      monthlyMinutesLimit,
      isActive,
      resetMinutes,
      currentPeriodEnd: null
    })
  });
  revalidatePath("/tenants");
}

export async function createPlan(formData: FormData) {
  const planName = String(formData.get("planName") || "").trim();
  const monthlyMinutesLimit = parseInt(String(formData.get("monthlyMinutesLimit") || "500"), 10);
  const price = parseFloat(String(formData.get("price") || "0.00"));
  const description = String(formData.get("description") || "");
  const isActive = formData.get("isActive") === "true";

  await adminApi("/api/admin/plans", {
    method: "POST",
    body: JSON.stringify({ planName, monthlyMinutesLimit, price, description, isActive }),
  });
  revalidatePath("/plans");
}

export async function updatePlan(planId: string, formData: FormData) {
  const planName = String(formData.get("planName") || "").trim();
  const monthlyMinutesLimit = parseInt(String(formData.get("monthlyMinutesLimit") || "500"), 10);
  const price = parseFloat(String(formData.get("price") || "0.00"));
  const description = String(formData.get("description") || "");
  const isActive = formData.get("isActive") === "true";

  await adminApi(`/api/admin/plans/${encodeURIComponent(planId)}`, {
    method: "PUT",
    body: JSON.stringify({ planName, monthlyMinutesLimit, price, description, isActive }),
  });
  revalidatePath("/plans");
}

export async function deletePlan(planId: string) {
  await adminApi(`/api/admin/plans/${encodeURIComponent(planId)}`, {
    method: "DELETE",
  });
  revalidatePath("/plans");
}
