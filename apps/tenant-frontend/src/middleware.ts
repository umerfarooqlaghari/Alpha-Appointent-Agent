import { NextRequest, NextResponse } from "next/server";

const renewWithinSeconds = 5 * 60;

function expiresSoon(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp !== "number" || payload.exp - Math.floor(Date.now() / 1000) <= renewWithinSeconds;
  } catch { return true; }
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("auth_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!accessToken || !refreshToken) return NextResponse.redirect(new URL("/login", request.url));
  if (!expiresSoon(accessToken)) return NextResponse.next();
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) return NextResponse.redirect(new URL("/login", request.url));
  const response = await fetch(`${backendUrl}/api/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }) });
  if (!response.ok) { const redirect = NextResponse.redirect(new URL("/login", request.url)); redirect.cookies.delete("auth_token"); redirect.cookies.delete("refresh_token"); redirect.cookies.delete("auth_role"); redirect.cookies.delete("auth_tenant"); return redirect; }
  const session = await response.json(); const next = NextResponse.next(); const secure = process.env.NODE_ENV === "production";
  next.cookies.set("auth_token", session.token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 });
  next.cookies.set("refresh_token", session.refreshToken, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });
  return next;
}

export const config = { matcher: ["/dashboard/:path*"] };