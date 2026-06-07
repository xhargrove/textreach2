import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { APP_ROUTES, SESSION_COOKIE } from "@/lib/auth/constants";
import { getClerkMiddlewareOptions } from "@/lib/auth/clerk-remote";
import { isLegacyAuthAllowed, isProduction } from "@/lib/production-guards";
import { verifySessionCookie } from "@/lib/auth/session-cookie";

const useClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
    process.env.CLERK_SECRET_KEY?.trim()
);

const isProtectedRoute = createRouteMatcher(
  APP_ROUTES.map((route) => `${route}(.*)`)
);

async function legacyProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAppRoute = APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isAppRoute) {
    return NextResponse.next();
  }

  if (isProduction() && !isLegacyAuthAllowed()) {
    return new NextResponse("Authentication service unavailable", {
      status: 503,
    });
  }

  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  const session = raw ? await verifySessionCookie(raw) : null;

  if (!session) {
    const loginUrl = new URL("/sign-in", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (raw) {
      response.cookies.delete(SESSION_COOKIE);
    }
    return response;
  }

  return NextResponse.next();
}

const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
}, getClerkMiddlewareOptions());

export default useClerk ? clerkHandler : legacyProxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
