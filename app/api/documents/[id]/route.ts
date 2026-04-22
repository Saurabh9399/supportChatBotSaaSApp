import { type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { documentService } from "@/modules/documents/services/document.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { orgId } = await auth();
  const tenantId = orgId ?? request.headers.get("x-tenant-id") ?? "";

  if (!tenantId) return errorResponse(new ValidationError("tenant_id required"), "unknown");

  try {
    await documentService.deleteDocument(params.id, tenantId);
    return successResponse({ deleted: true }, tenantId);
  } catch (err) {
    return errorResponse(err, tenantId);
  }
}
