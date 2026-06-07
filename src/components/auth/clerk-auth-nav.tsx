"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function ClerkAuthNav() {
  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
          <button
            type="button"
            className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 md:inline"
          >
            Log in
          </button>
        </SignInButton>
        <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
          <Button size="sm">Start Free</Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
