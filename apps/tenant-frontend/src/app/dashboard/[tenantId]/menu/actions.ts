"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";
import { decodeTenantId } from "@/lib/db";

export async function createCategory(tenantId: string, name: string) {
  const decoded = decodeTenantId(tenantId);
  try {
    await tenantApi(`/api/tenants/${encodeURIComponent(decoded)}/categories`, {
      method: "POST",
      body: JSON.stringify({ name })
    });
    revalidatePath(`/dashboard/${tenantId}/menu`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(err.message || "Failed to create category");
    }
    throw new Error("Failed to create category");
  }
}

export async function deleteCategory(tenantId: string, categoryId: string) {
  const decoded = decodeTenantId(tenantId);
  try {
    await tenantApi(`/api/tenants/${encodeURIComponent(decoded)}/categories/${encodeURIComponent(categoryId)}`, {
      method: "DELETE"
    });
    revalidatePath(`/dashboard/${tenantId}/menu`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(err.message || "Failed to delete category");
    }
    throw new Error("Failed to delete category");
  }
}

export async function updateCategory(tenantId: string, categoryId: string, name: string) {
  const decoded = decodeTenantId(tenantId);
  try {
    await tenantApi(`/api/tenants/${encodeURIComponent(decoded)}/categories/${encodeURIComponent(categoryId)}`, {
      method: "PUT",
      body: JSON.stringify({ name })
    });
    revalidatePath(`/dashboard/${tenantId}/menu`);
    revalidatePath(`/dashboard/${tenantId}/inventory`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(err.message || "Failed to update category");
    }
    throw new Error("Failed to update category");
  }
}
