import { type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { documentService } from "@/modules/documents/services/document.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { orgId } = await auth();
  const tenantId = orgId ?? request.headers.get("x-tenant-id") ?? "";

  if (!tenantId) return errorResponse(new ValidationError("tenant_id required"), "unknown");

  try {
    const result = await documentService.listDocuments(tenantId);
    return successResponse(result, tenantId);
  } catch (err) {
    return errorResponse(err, tenantId);
  }
}

export async function POST(request: NextRequest) {
  const { orgId } = await auth();
  const tenantId = orgId ?? request.headers.get("x-tenant-id") ?? "";

  if (!tenantId) return errorResponse(new ValidationError("tenant_id required"), "unknown");

  let body: { name?: string; content?: string; mimeType?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return errorResponse(new ValidationError("Invalid JSON body"), tenantId);
  }

  try {
    const document = await documentService.uploadDocument({
      tenantId,
      name: body.name ?? "",
      content: body.content ?? "",
      mimeType: body.mimeType,
    });
    return successResponse(document, tenantId, 201);
  } catch (err) {
    return errorResponse(err, tenantId);
  }
}
