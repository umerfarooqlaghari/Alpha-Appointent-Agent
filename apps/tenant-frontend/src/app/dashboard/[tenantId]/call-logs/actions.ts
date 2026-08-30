"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";

export async function deleteCallLog(tenantId: string, id: string) {
  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/call-logs/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/call-logs`);
}

export async function createSampleCallLog(tenantId: string) {
  const sampleTranscripts = [
    "AI: Hello, welcome to customer support! How can I assist you today?\nCustomer: Hi, I would like to inquire about your availability for booking tomorrow.\nAI: Sure! We have slots available at 2:00 PM and 4:30 PM. Which one works best for you?\nCustomer: Let's do 2:00 PM please.\nAI: Great! I've reserved the 2:00 PM slot for you. Have a wonderful day!",
    "AI: Thank you for calling! How can I help you?\nCustomer: Can I place a pickup order for a chicken burger?\nAI: Absolutely! Would you like any extra sides or drinks with that?\nCustomer: Just a lemonade please.\nAI: Got it! Your order for 1x Chicken Burger and 1x Lemonade is confirmed and will be ready in 20 minutes."
  ];

  const sampleSummaries = [
    "Customer scheduled an appointment for tomorrow at 2:00 PM.",
    "Customer placed a pickup order for 1x Chicken Burger and 1x Lemonade (Ready in 20 mins)."
  ];

  const sampleTypes = ["inbound", "outbound", "web"];
  const samplePhones = ["+1 (555) 234-5678", "+1 (555) 987-6543", "+92 300 1234567"];

  const idx = Math.floor(Math.random() * sampleTranscripts.length);
  const callType = sampleTypes[Math.floor(Math.random() * sampleTypes.length)];
  const phone = samplePhones[Math.floor(Math.random() * samplePhones.length)];

  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/call-logs`, {
    method: "POST",
    body: JSON.stringify({
      customerPhone: phone,
      durationSeconds: 165,
      transcript: sampleTranscripts[idx],
      summary: sampleSummaries[idx],
      recordingUrl: "https://vapi-public-recordings.s3.amazonaws.com/demo.mp3",
      cost: 0.0450,
      startedAt: new Date(Date.now() - 165000).toISOString(),
      endedAt: new Date().toISOString(),
      callType
    })
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/call-logs`);
}

export async function syncVapiCallLogs(tenantId: string, vapiPrivateKey: string, assistantId?: string) {
  const result = await tenantApi<{ count: number; message: string }>(`/api/tenants/${encodeURIComponent(tenantId)}/call-logs/sync-vapi`, {
    method: "POST",
    body: JSON.stringify({
      vapiPrivateKey,
      assistantId
    })
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/call-logs`);
  return result;
}

export async function updateCallLogIdentifier(tenantId: string, id: string, identifier: string | null) {
  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/call-logs/${encodeURIComponent(id)}/identifier`, {
    method: "PUT",
    body: JSON.stringify({ identifier })
  });

  revalidatePath(`/dashboard/${encodeURIComponent(tenantId)}/call-logs`);
}
