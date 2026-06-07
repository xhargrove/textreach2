import { createHash } from "crypto";

export function hashIpAddress(ip: string): string {
  const salt = process.env.LINK_CLICK_IP_SALT ?? "textreach";
  return createHash("sha256")
    .update(`${salt}:${ip.trim()}`)
    .digest("hex")
    .slice(0, 16);
}

export function getClientIp(forwardedFor: string | null, realIp: string | null): string | null {
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return realIp?.trim() || null;
}
