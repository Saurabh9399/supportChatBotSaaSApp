import { type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getTenantSettings, saveTenantSettings } from "@/modules/settings/services/settings.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { orgId } = await auth();
  const tenantId = orgId ?? request.headers.get("x-tenant-id") ?? "";
  if (!tenantId) return errorResponse(new ValidationError("tenant_id required"), "unknown");

  try {
    const settings = await getTenantSettings(tenantId);
    return successResponse(settings, tenantId);
  } catch (err) {
    return errorResponse(err, tenantId);
  }
}

export async function PATCH(request: NextRequest) {
  const { orgId } = await auth();
  const tenantId = orgId ?? request.headers.get("x-tenant-id") ?? "";
  if (!tenantId) return errorResponse(new ValidationError("tenant_id required"), "unknown");

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return errorResponse(new ValidationError("Invalid JSON body"), tenantId);
  }

  const { systemPrompt, chatbotName, welcomeMessage } = body;

  if (systemPrompt !== undefined && typeof systemPrompt !== "string") {
    return errorResponse(new ValidationError("systemPrompt must be a string"), tenantId);
  }
  if (systemPrompt && (systemPrompt as string).trim().length < 10) {
    return errorResponse(new ValidationError("System prompt too short (min 10 chars)"), tenantId);
  }

  try {
    const saved = await saveTenantSettings(tenantId, {
      ...(systemPrompt !== undefined && { systemPrompt: (systemPrompt as string).trim() }),
      ...(chatbotName !== undefined && { chatbotName: (chatbotName as string).trim() }),
      ...(welcomeMessage !== undefined && { welcomeMessage: (welcomeMessage as string).trim() }),
    });
    return successResponse(saved, tenantId);
  } catch (err) {
    return errorResponse(err, tenantId);
  }
}
