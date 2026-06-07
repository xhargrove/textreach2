import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { DEMO_USER_EMAIL } from "@/lib/auth/constants";
import { isClerkConfigured } from "@/lib/auth/clerk-config";

export const metadata = {
  title: "Sign in",
};

export default function SignInPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  const useClerk = isClerkConfigured();

  if (useClerk) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex flex-1 items-center justify-center py-12">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
          />
        </main>
        <PublicFooter />
      </div>
    );
  }

  const errorMessage =
    searchParams.error === "seed-required"
      ? "Demo data not found. Run `npm run db:seed` then try again."
      : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center py-12">
        <div className="container-app w-full max-w-md">
          <Card>
            <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
            <p className="mt-2 text-sm text-gray-500">
              Welcome back to TextReach
            </p>

            <LoginForm error={errorMessage} />

            <p className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                Sign up
              </Link>
            </p>

            <div className="mt-4 space-y-3">
              <Button href="/api/auth/demo" variant="secondary" className="w-full">
                Try Demo Workspace
              </Button>
              <p className="rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-500">
                Demo login: {DEMO_USER_EMAIL} (any password). Add Clerk keys to
                .env for production auth with password reset.
              </p>
            </div>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
