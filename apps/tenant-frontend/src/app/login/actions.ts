"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo") as string | null;

  const response = await fetch(`${process.env.BACKEND_API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
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

  if (redirectTo && redirectTo.startsWith("/")) {
    redirect(redirectTo.replace(":tenantId", encodeURIComponent(result.user.tenantId)));
  }

  redirect(`/dashboard/${encodeURIComponent(result.user.tenantId)}`);
}

export async function registerWorkspace(formData: FormData) {
  const companyName = formData.get("companyName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string) || companyName;
  const phone = (formData.get("phone") as string) || null;
  const selectedPlan = (formData.get("selectedPlan") as string) || "Starter";
  const industryType = (formData.get("industryType") as string) || "general";
  const redirectTo = formData.get("redirectTo") as string | null;

  if (!companyName || !email || !password) {
    return { error: "Organization name, email, and password are required." };
  }

  const response = await fetch(`${process.env.BACKEND_API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName,
      email,
      password,
      fullName,
      phone,
      selectedPlan,
      industryType,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    return { error: errorData?.error || "Registration failed. Please verify your information and try again." };
  }

  const result = await response.json();
  const secure = process.env.NODE_ENV === "production";
  const store = await cookies();
  store.set("auth_token", result.token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 });
  store.set("refresh_token", result.refreshToken, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });
  store.set("auth_role", result.user.role, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });
  store.set("auth_tenant", result.user.tenantId, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });

  if (redirectTo && redirectTo.startsWith("/")) {
    redirect(redirectTo.replace(":tenantId", encodeURIComponent(result.user.tenantId)));
  }

  // If a paid plan was picked, direct them straight to billing to review / checkout
  if (selectedPlan && selectedPlan.toLowerCase() !== "trial") {
    redirect(`/dashboard/${encodeURIComponent(result.user.tenantId)}/billing`);
  }

  redirect(`/dashboard/${encodeURIComponent(result.user.tenantId)}`);
}