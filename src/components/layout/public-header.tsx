import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClerkAuthNav } from "@/components/auth/clerk-auth-nav";
import { isClerkConfigured } from "@/lib/auth/clerk-config";

export function PublicHeader() {
  const useClerk = isClerkConfigured();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold text-brand-600">
          TextReach
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Pricing
          </Link>
          {useClerk ? (
            <ClerkAuthNav />
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Sign in
              </Link>
              <Button href="/sign-up" size="sm">
                Start Free
              </Button>
            </>
          )}
        </nav>
        {useClerk ? (
          <div className="flex items-center gap-3 md:hidden">
            <ClerkAuthNav />
          </div>
        ) : (
          <div className="flex items-center gap-3 md:hidden">
            <Button href="/sign-up" size="sm">
              Start Free
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
