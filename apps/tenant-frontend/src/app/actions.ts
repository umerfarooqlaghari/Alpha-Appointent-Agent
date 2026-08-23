"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";

const adapterTypes = new Set(["postgres", "shopify", "pos-http"]);

export async function updateAvailability(tenantId: string, formData: FormData) {
  const workingHours = Array.from({ length: 7 }, (_, dayOfWeek) => {
    if (formData.get(`day-${dayOfWeek}-enabled`) !== "on") return null;
    const startTime = String(formData.get(`day-${dayOfWeek}-start`) || "");
    const endTime = String(formData.get(`day-${dayOfWeek}-end`) || "");
    if (!startTime || !endTime || startTime >= endTime) throw new Error("Each enabled day needs a valid start and end time.");
    return { dayOfWeek, startTime: `${startTime}:00`, endTime: `${endTime}:00` };
  }).filter((item): item is { dayOfWeek: number; startTime: string; endTime: string } => item !== null);
  const holidays = String(formData.get("holidays") || "").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [holidayDate, ...nameParts] = line.split(",");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(holidayDate.trim())) throw new Error("Holidays must use YYYY-MM-DD, optionally followed by a name.");
    return { holidayDate: holidayDate.trim(), name: nameParts.join(",").trim() || null };
  });
  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/availability`, { method: "PUT", body: JSON.stringify({ timeZone: String(formData.get("timeZone") || "UTC"), slotDurationMinutes: Number(formData.get("slotDurationMinutes")), workingHours, holidays }) });
  revalidatePath(`/dashboard/${tenantId}/calendar`);
  revalidatePath(`/dashboard/${tenantId}`);
}

export async function cancelAppointment(tenantId: string, appointmentId: string) {
  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/appointments/${encodeURIComponent(appointmentId)}/cancel`, { method: "POST" });
  revalidatePath(`/dashboard/${tenantId}`);
  revalidatePath(`/dashboard/${tenantId}/calendar`);
  revalidatePath(`/dashboard/${tenantId}/appointments`);
}

export async function deleteSlot(tenantId: string, slotId: string) {
  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/slots/${encodeURIComponent(slotId)}`, { method: "DELETE" });
  revalidatePath(`/dashboard/${tenantId}`);
  revalidatePath(`/dashboard/${tenantId}/calendar`);
}

export async function updateTenantConfig(tenantId: string, formData: FormData) {
  const adapterType = String(formData.get("adapterType"));
  if (!adapterTypes.has(adapterType)) throw new Error("Invalid adapter type.");
  const apiBaseUrl = String(formData.get("apiBaseUrl") || "") || null;
  const authHeaderName = String(formData.get("authHeaderName") || "") || null;
  const authToken = String(formData.get("authToken") || "") || null;
  const productsApiUrl = String(formData.get("productsApiUrl") || "") || null;
  const inventorySource = String(formData.get("inventorySource") || "database");
  const publishableKey = String(formData.get("publishableKey") || "") || null;
  const allowedDomains = String(formData.get("allowedDomains") || "") || null;
  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/config`, { method: "PUT", body: JSON.stringify({ adapterType, apiBaseUrl, authHeaderName, authToken, productsApiUrl, inventorySource, publishableKey, allowedDomains }) });
  revalidatePath(`/dashboard/${tenantId}/settings`);
}

export async function logout() {
  const { cookies } = await import("next/headers");
  const { redirect } = await import("next/navigation");
  const store = cookies();
  (await store).delete("auth_token");
  (await store).delete("refresh_token");
  (await store).delete("auth_role");
  (await store).delete("auth_tenant");
  redirect("/login");
}

export async function createCheckoutSession(tenantId: string, planName: string) {
  const data = await tenantApi<{ url: string | null; message?: string }>(
    `/api/tenants/${encodeURIComponent(tenantId)}/billing/checkout`,
    {
      method: "POST",
      body: JSON.stringify({ planName }),
    }
  );
  return data;
}