import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; id: string }> }
) {
  const { tenantId, id } = await params;

  try {
    const vapiKey = process.env.VAPI_PRIVATE_KEY || "7c44b5b3-f1d1-4e9d-acc0-dd98df767757";

    // 1. Fetch fresh presigned audio URL from Vapi
    const vapiRes = await fetch(`https://api.vapi.ai/call/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: `Bearer ${vapiKey.trim()}`,
      },
      cache: "no-store",
    });

    if (vapiRes.ok) {
      const data = await vapiRes.json();
      const presignedUrl =
        data?.artifact?.presignedMonoUrl ||
        data?.artifact?.presignedStereoUrl ||
        data?.artifact?.presignedAssistantUrl ||
        data?.presignedMonoUrl ||
        data?.presignedStereoUrl ||
        data?.artifact?.recordingUrl ||
        data?.recordingUrl;

      if (presignedUrl) {
        return NextResponse.redirect(presignedUrl);
      }
    }
  } catch (err) {
    console.error("Failed to query Vapi audio recording:", err);
  }

  // 2. Fallback to backend API resolver
  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5171";
  const fallbackUrl = `${backendUrl}/api/tenants/${encodeURIComponent(tenantId)}/call-logs/${encodeURIComponent(id)}/audio`;
  return NextResponse.redirect(fallbackUrl);
}
