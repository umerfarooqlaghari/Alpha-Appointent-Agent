"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";

export async function upsertFaq(tenantId: string, faqId: string | null, formData: FormData) {
  const question = String(formData.get("question") || "").trim();
  const answer = String(formData.get("answer") || "").trim();

  if (!question || !answer) {
    throw new Error("Question and Answer are required.");
  }

  const payload = { question, answer };

  if (faqId) {
    await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/faqs/${encodeURIComponent(faqId)}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  } else {
    await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/faqs`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  revalidatePath(`/dashboard/${tenantId}/faqs`);
}

export async function deleteFaq(tenantId: string, faqId: string) {
  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/faqs/${encodeURIComponent(faqId)}`, {
    method: "DELETE"
  });
  revalidatePath(`/dashboard/${tenantId}/faqs`);
}
