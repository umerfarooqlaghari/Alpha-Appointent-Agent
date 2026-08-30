"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";

export async function createService(tenantId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const rawPrice = formData.get("price");
  const price = rawPrice && String(rawPrice).trim() !== "" ? parseFloat(String(rawPrice)) : null;
  const rawDuration = formData.get("durationMinutes");
  const durationMinutes = rawDuration && String(rawDuration).trim() !== "" ? parseInt(String(rawDuration), 10) : null;
  const category = String(formData.get("category") || "General").trim();

  if (!name) {
    throw new Error("Service name is required.");
  }

  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/services`, {
    method: "POST",
    body: JSON.stringify({
      name,
      description: description || null,
      price,
      durationMinutes,
      category
    })
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/services`);
}

export async function updateService(tenantId: string, serviceId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const rawPrice = formData.get("price");
  const price = rawPrice && String(rawPrice).trim() !== "" ? parseFloat(String(rawPrice)) : null;
  const rawDuration = formData.get("durationMinutes");
  const durationMinutes = rawDuration && String(rawDuration).trim() !== "" ? parseInt(String(rawDuration), 10) : null;
  const category = String(formData.get("category") || "General").trim();
  const isDisabled = formData.get("isDisabled") === "true";

  if (!name) {
    throw new Error("Service name is required.");
  }

  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/services/${encodeURIComponent(serviceId)}`, {
    method: "PUT",
    body: JSON.stringify({
      name,
      description: description || null,
      price,
      durationMinutes,
      category,
      isDisabled
    })
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/services`);
}

export async function toggleServiceStatus(tenantId: string, serviceId: string) {
  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/services/${encodeURIComponent(serviceId)}/toggle`, {
    method: "PUT"
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/services`);
}

export async function deleteService(tenantId: string, serviceId: string) {
  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/services/${encodeURIComponent(serviceId)}`, {
    method: "DELETE"
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/services`);
}
