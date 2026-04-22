import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/chat(.*)",
]);

const isTenantRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/documents(.*)",
  "/api/analytics(.*)",
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  if (isTenantRoute(request)) {
    await auth.protect();
  }

  // Resolve tenant: Clerk orgId > explicit header > query param > subdomain
  const { orgId } = await auth();
  const tenantId =
    orgId ??
    request.headers.get("x-tenant-id") ??
    request.nextUrl.searchParams.get("tenant_id") ??
    extractSubdomainTenantId(request);

  const requestHeaders = new Headers(request.headers);
  if (tenantId) requestHeaders.set("x-tenant-id", tenantId);
  requestHeaders.set(
    "x-request-id",
    `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  );

  if (
    pathname.startsWith("/api/") &&
    !tenantId &&
    !isPublicRoute(request) &&
    requiresTenant(pathname)
  ) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_TENANT", message: "tenant_id is required" } },
      { status: 400 },
    );
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
});

function extractSubdomainTenantId(request: NextRequest): string | null {
  const host = request.headers.get("host") ?? "";
  const appDomain =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "localhost:3000";
  if (host === appDomain || host === "localhost:3000") return null;
  const subdomain = host.split(".")[0];
  return subdomain && subdomain !== "www" ? subdomain : null;
}

function requiresTenant(pathname: string): boolean {
  return ["/api/documents", "/api/analytics"].some((p) => pathname.startsWith(p));
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
