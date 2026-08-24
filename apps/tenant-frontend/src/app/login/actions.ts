"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const response = await fetch(`${process.env.BACKEND_API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: formData.get("email"), password: formData.get("password") }),
    cache: "no-store",
  });

  if (!response.ok) {
    return { error: "Invalid email or password" };
  }

  const result = await response.json();
  if (!result.user.tenantId) {
    return { error: "Tenant account required" };
  }

  const secure = process.env.NODE_ENV === "production";
  const store = await cookies();
  store.set("auth_token", result.token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 });
  store.set("refresh_token", result.refreshToken, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });
  store.set("auth_role", result.user.role, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });
  store.set("auth_tenant", result.user.tenantId, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });

  redirect(`/dashboard/${encodeURIComponent(result.user.tenantId)}`);
}