import { type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { analyticsService } from "@/modules/analytics/services/analytics.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = ["active", "resolved", "abandoned"] as const;
type ConversationStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { orgId } = await auth();
  const tenantId = orgId ?? request.headers.get("x-tenant-id") ?? "";

  if (!tenantId) return errorResponse(new ValidationError("tenant_id required"), "unknown");

  const sessionId = params.id;
  let body: { status?: string };
  try {
    body = await request.json() as { status?: string };
  } catch {
    return errorResponse(new ValidationError("Invalid JSON body"), tenantId);
  }

  const status = body.status as ConversationStatus | undefined;
  if (!status || !VALID_STATUSES.includes(status)) {
    return errorResponse(
      new ValidationError(`status must be one of: ${VALID_STATUSES.join(", ")}`),
      tenantId,
    );
  }

  const supabase = getSupabaseAdmin();

  // Verify the session belongs to this tenant
  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .eq("tenant_id", tenantId)
    .single();

  if (!existing) return errorResponse(new NotFoundError("Conversation"), tenantId);

  const { data, error } = await supabase
    .from("chat_sessions")
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq("id", sessionId)
    .eq("tenant_id", tenantId)
    .select("id, status, updated_at")
    .single();

  if (error) return errorResponse(new Error(error.message), tenantId);

  // Track status change
  if (status === "resolved") {
    void analyticsService.track(tenantId, "session_resolved", { sessionId }, sessionId);
  }

  return successResponse(data, tenantId);
}
