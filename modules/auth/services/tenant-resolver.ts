import type { TenantContext } from "@/types";
import { UnauthorizedError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Resolve tenant context from an incoming API request.
 * Reads the `x-tenant-id` header injected by middleware,
 * falling back to the request body / search params.
 */
export function resolveTenantFromRequest(request: Request): TenantContext {
  const tenantId =
    (request.headers.get("x-tenant-id") ?? "").trim() || null;

  if (!tenantId) {
    throw new UnauthorizedError("Missing tenant context");
  }

  logger.debug("Tenant resolved", { tenantId });

  return { tenantId };
}

/**
 * Validate that a resource belongs to the expected tenant.
 * Call this before any DB read/write to enforce data isolation.
 */
export function assertTenantMatch(
  resourceTenantId: string,
  requestTenantId: string,
): void {
  if (resourceTenantId !== requestTenantId) {
    logger.warn("Tenant isolation violation attempted", {
      resourceTenantId,
      requestTenantId,
    });
    throw new UnauthorizedError("Access denied: tenant mismatch");
  }
}
