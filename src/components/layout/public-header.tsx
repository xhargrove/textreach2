import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
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
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Log in
          </Link>
          <Button href="/signup" size="sm">
            Start Free
          </Button>
        </nav>
        <div className="flex items-center gap-3 md:hidden">
          <Button href="/signup" size="sm">
            Start Free
          </Button>
        </div>
      </div>
    </header>
  );
}
