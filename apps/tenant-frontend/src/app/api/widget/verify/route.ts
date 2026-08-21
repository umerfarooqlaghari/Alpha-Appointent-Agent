import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const publishableKey = searchParams.get("publishableKey");
  const origin = request.headers.get("origin") || "";

  if (!publishableKey) {
    return NextResponse.json({ error: "Publishable key is required." }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend service is not configured." }, { status: 500 });
  }

  try {
    const res = await fetch(`${backendUrl}/api/public/widgets/verify?publishableKey=${encodeURIComponent(publishableKey)}`, {
      method: "GET",
      headers: {
        "Origin": origin
      }
    });

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(errorData, { 
        status: res.status,
        headers: corsHeaders
      });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: corsHeaders
    });
  } catch (err: unknown) {
    console.error("Widget verification proxy failed:", err);
    return NextResponse.json({ error: "Failed to verify widget configuration." }, { 
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
