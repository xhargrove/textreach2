export const SESSION_COOKIE = "textreach_session";

export const DEMO_USER_EMAIL = "demo@textreach.io";
export const DEMO_WORKSPACE_NAME = "Demo Workspace";

/** Authenticated app routes shown in navigation. */
export const APP_NAV_ROUTES = [
  "/dashboard",
  "/contacts",
  "/lists",
  "/messages",
  "/keywords",
  "/inbox",
  "/results",
  "/billing",
  "/settings",
] as const;

/** Internal platform admin route — not linked from app navigation. */
export const PLATFORM_ADMIN_ROUTE = "/admin";

/** All routes that require authentication (includes internal admin). */
export const PROTECTED_ROUTES = [
  ...APP_NAV_ROUTES,
  "/settings/team",
  "/forbidden",
  PLATFORM_ADMIN_ROUTE,
] as const;

/** @deprecated Use PROTECTED_ROUTES */
export const APP_ROUTES = [...PROTECTED_ROUTES];
