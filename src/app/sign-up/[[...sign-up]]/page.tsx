import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";
import { isClerkConfigured } from "@/lib/auth/clerk-config";

export const metadata = {
  title: "Sign up",
};

export default function SignUpPage() {
  const useClerk = isClerkConfigured();

  if (useClerk) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex flex-1 items-center justify-center py-12">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard"
          />
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center py-12">
        <div className="container-app w-full max-w-md">
          <Card>
            <h1 className="text-2xl font-semibold text-gray-900">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Start sending text messages in minutes
            </p>

            <SignupForm />

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-4 rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-500">
              Creates a new workspace for your account. Add Clerk keys to .env
              for production auth.
            </p>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
