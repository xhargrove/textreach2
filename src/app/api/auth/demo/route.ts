import { demoLoginAction } from "@/lib/auth/demo";
import { isDemoAuthAllowed } from "@/lib/production-guards";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDemoAuthAllowed()) {
    return new Response("Not found", { status: 404 });
  }

  return demoLoginAction();
}
