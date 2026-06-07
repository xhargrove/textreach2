import { NextRequest, NextResponse } from "next/server";
import { recordLinkClick } from "@/lib/links/tracking";
import { getClientIp, hashIpAddress } from "@/lib/links/ip-hash";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ trackingId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { trackingId } = await params;
  const ip = getClientIp(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip")
  );

  const originalUrl = await recordLinkClick(trackingId, {
    userAgent: request.headers.get("user-agent") ?? undefined,
    ipHash: ip ? hashIpAddress(ip) : undefined,
  });

  if (!originalUrl) {
    return new NextResponse("Link not found", { status: 404 });
  }

  return NextResponse.redirect(originalUrl, 302);
}
