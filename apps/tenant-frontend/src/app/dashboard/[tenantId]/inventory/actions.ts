"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";

export async function upsertItem(tenantId: string, itemId: string | null, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const sku = String(formData.get("sku") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const category = String(formData.get("category") || "").trim() || null;
  const price = Number(formData.get("price") || 0);
  const stockStatus = String(formData.get("stockStatus") || "in_stock");
  
  let variations = "[]";
  try {
    const rawVars = String(formData.get("variations") || "").trim();
    if (rawVars) {
      // Validate/format variations. If it's a comma-separated list, make it a JSON array.
      if (rawVars.startsWith("[") && rawVars.endsWith("]")) {
        variations = JSON.stringify(JSON.parse(rawVars));
      } else {
        variations = JSON.stringify(rawVars.split(",").map(v => v.trim()).filter(Boolean));
      }
    }
  } catch {
    variations = "[]";
  }

  let customVariables = "{}";
  try {
    const rawCust = String(formData.get("customVariables") || "").trim();
    if (rawCust) {
      if (rawCust.startsWith("{") && rawCust.endsWith("}")) {
        customVariables = JSON.stringify(JSON.parse(rawCust));
      } else {
        // Parse key:value comma-separated lines
        const obj: Record<string, string> = {};
        rawCust.split(",").forEach(part => {
          const [k, v] = part.split(":").map(s => s.trim());
          if (k && v) obj[k] = v;
        });
        customVariables = JSON.stringify(obj);
      }
    }
  } catch {
    customVariables = "{}";
  }

  const payload = {
    name,
    sku,
    description,
    category,
    price,
    stockStatus,
    variations,
    customVariables
  };

  if (itemId) {
    await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  } else {
    await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/items`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  revalidatePath(`/dashboard/${tenantId}/inventory`);
}

export async function deleteItem(tenantId: string, itemId: string) {
  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE"
  });
  revalidatePath(`/dashboard/${tenantId}/inventory`);
}

export async function toggleItemStatus(tenantId: string, itemId: string, isDisabled: boolean) {
  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}/disable`, {
    method: "PUT",
    body: JSON.stringify({ isDisabled })
  });
  revalidatePath(`/dashboard/${tenantId}/inventory`);
}

export async function bulkUploadInventory(tenantId: string, csvContent: string) {
  const lines = csvContent.split(/\r?\n/);
  if (lines.length <= 1) throw new Error("CSV has no data rows.");

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const items = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple parser matching values inside quotes
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    // Map headers to fields
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });

    const name = row["name"] || "";
    const sku = row["sku"] || "";
    if (!name || !sku) continue;

    const price = Number(row["price"] || 0);
    const description = row["description"] || null;
    const category = row["category"] || null;
    const stockStatus = (row["stock status"] || row["stock_status"] || "in_stock").replace("-", "_").toLowerCase() === "out_of_stock" ? "out_of_stock" : "in_stock";

    let variations = "[]";
    const rawVars = row["variations"] || "";
    if (rawVars) {
      if (rawVars.startsWith("[") && rawVars.endsWith("]")) {
        variations = rawVars;
      } else {
        variations = JSON.stringify(rawVars.split(";").map(v => v.trim()).filter(Boolean));
      }
    }

    let customVariables = "{}";
    const rawCust = row["custom variables"] || row["custom_variables"] || "";
    if (rawCust) {
      if (rawCust.startsWith("{") && rawCust.endsWith("}")) {
        customVariables = rawCust;
      } else {
        const obj: Record<string, string> = {};
        rawCust.split(";").forEach(part => {
          const [k, v] = part.split(":").map(s => s.trim());
          if (k && v) obj[k] = v;
        });
        customVariables = JSON.stringify(obj);
      }
    }

    items.push({
      name,
      sku,
      description,
      category,
      price,
      stockStatus,
      variations,
      customVariables
    });
  }

  if (items.length === 0) throw new Error("No valid items parsed from CSV.");

  await tenantApi(`/api/tenants/${encodeURIComponent(tenantId)}/items/bulk`, {
    method: "POST",
    body: JSON.stringify(items)
  });

  revalidatePath(`/dashboard/${tenantId}/inventory`);
}
