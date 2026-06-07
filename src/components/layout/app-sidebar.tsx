"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WorkspaceRole } from "@prisma/client";
import { roleHasPermission, type Permission } from "@/lib/auth/permissions";

type NavItem = {
  href: string;
  label: string;
  permission?: Permission;
  mobilePrimary?: boolean;
};

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", mobilePrimary: true },
  { href: "/contacts", label: "Contacts", permission: "view_contacts", mobilePrimary: true },
  { href: "/lists", label: "Lists", permission: "view_lists" },
  { href: "/messages", label: "Messages", permission: "view_messages", mobilePrimary: true },
  { href: "/keywords", label: "Keywords", permission: "view_keywords" },
  { href: "/inbox", label: "Inbox", permission: "view_inbox", mobilePrimary: true },
  { href: "/results", label: "Results", permission: "view_results" },
  { href: "/billing", label: "Billing", permission: "manage_billing" },
  { href: "/settings", label: "Settings", permission: "manage_settings" },
  { href: "/settings/team", label: "Team", permission: "manage_team" },
];

function filterNavItems(role: WorkspaceRole | null): NavItem[] {
  if (!role) return ALL_NAV_ITEMS;
  return ALL_NAV_ITEMS.filter(
    (item) => !item.permission || roleHasPermission(role, item.permission)
  );
}

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AppSidebarProps = {
  role: WorkspaceRole | null;
};

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const navItems = filterNavItems(role);
  const primaryItems = navItems.filter((item) => item.mobilePrimary);
  const moreItems = navItems.filter((item) => !item.mobilePrimary);
  const moreActive = moreItems.some((item) => isNavActive(pathname, item.href));

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col border-r border-gray-200 bg-white">
          <div className="flex h-16 items-center border-b border-gray-200 px-6">
            <Link href="/dashboard" className="text-xl font-bold text-brand-600">
              TextReach
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white lg:hidden">
        <div className="flex h-14 items-center px-4">
          <Link href="/dashboard" className="text-lg font-bold text-brand-600">
            TextReach
          </Link>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Main navigation"
      >
        <div className="flex">
          {primaryItems.map((item) => {
            const isActive = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[56px] flex-1 flex-col items-center justify-center px-1 py-2 text-xs font-medium",
                  isActive ? "text-brand-600" : "text-gray-500"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          {moreItems.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex min-h-[56px] flex-1 flex-col items-center justify-center px-1 py-2 text-xs font-medium",
                moreActive ? "text-brand-600" : "text-gray-500"
              )}
            >
              More
            </button>
          )}
        </div>
      </nav>

      {/* Mobile more menu */}
      {moreOpen && (
        <div className="fixed inset-0 z-[55] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-gray-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">More</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <div className="grid gap-1">
              {moreItems.map((item) => {
                const isActive = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "rounded-lg px-4 py-3 text-base font-medium",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
