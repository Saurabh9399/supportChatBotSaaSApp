import { type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyticsService } from "@/modules/analytics/services/analytics.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { orgId } = await auth();
  const tenantId = orgId ?? request.headers.get("x-tenant-id") ?? "";

  if (!tenantId) return errorResponse(new ValidationError("tenant_id required"), "unknown");

  const { searchParams } = request.nextUrl;

  try {
    const metrics = await analyticsService.getDashboardMetrics({
      tenantId,
      fromDate: searchParams.get("from") ?? undefined,
      toDate: searchParams.get("to") ?? undefined,
    });
    return successResponse(metrics, tenantId);
  } catch (err) {
    return errorResponse(err, tenantId);
  }
}
