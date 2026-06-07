import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TextReachClerkProvider } from "@/components/auth/textreach-clerk-provider";
import { isClerkConfigured } from "@/lib/auth/clerk-config";
import { getClerkProxyUrlForRequest } from "@/lib/auth/clerk-remote";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "TextReach — Send text messages your customers actually see",
    template: "%s | TextReach",
  },
  description:
    "TextReach helps you build lists, send event updates, schedule reminders, and track replies without complicated marketing software.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkProxyUrl = isClerkConfigured()
    ? await getClerkProxyUrlForRequest()
    : undefined;

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        {isClerkConfigured() ? (
          <TextReachClerkProvider proxyUrl={clerkProxyUrl}>
            {children}
          </TextReachClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
