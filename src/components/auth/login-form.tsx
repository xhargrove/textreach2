"use client";

import { useFormState } from "react-dom";
import { loginFormAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

type LoginFormProps = {
  error?: string;
};

export function LoginForm({ error: initialError }: LoginFormProps) {
  const [state, formAction] = useFormState(loginFormAction, {
    error: initialError,
  });

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue="demo@textreach.io"
          placeholder="you@company.com"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <Button type="submit" className="w-full">
        Log in
      </Button>
    </form>
  );
}
