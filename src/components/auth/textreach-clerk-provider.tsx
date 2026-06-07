"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const CLERK_PROXY_HOST_SUFFIXES = [
  ".trycloudflare.com",
  ".ngrok.io",
  ".ngrok-free.app",
  ".ngrok.app",
];

function shouldProxyOnClient(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return false;
  }
  return CLERK_PROXY_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

function resolveClientProxyUrl(
  serverProxyUrl: string | undefined
): string | undefined {
  const envProxy = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim();
  if (envProxy) return envProxy;

  if (typeof window === "undefined") {
    return serverProxyUrl;
  }

  const hostname = window.location.hostname.toLowerCase();
  if (!shouldProxyOnClient(hostname)) {
    return undefined;
  }

  return serverProxyUrl ?? "/__clerk";
}

type TextReachClerkProviderProps = {
  children: React.ReactNode;
  proxyUrl?: string;
};

export function TextReachClerkProvider({
  children,
  proxyUrl,
}: TextReachClerkProviderProps) {
  const [clientProxyUrl, setClientProxyUrl] = useState<string | undefined>(
    () => resolveClientProxyUrl(proxyUrl)
  );

  useEffect(() => {
    setClientProxyUrl(resolveClientProxyUrl(proxyUrl));
  }, [proxyUrl]);

  return (
    <ClerkProvider proxyUrl={clientProxyUrl}>{children}</ClerkProvider>
  );
}
