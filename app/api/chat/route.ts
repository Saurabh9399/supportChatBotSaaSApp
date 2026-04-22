import { type NextRequest } from "next/server";
import type { ChatRequest } from "@/types/chat";
import { chatServerService } from "@/modules/chat/services/chat-server.service";
import { getAIProvider } from "@/services/ai";
import { analyticsService } from "@/modules/analytics/services/analytics.service";
import { checkRateLimit, buildRateLimitKey } from "@/lib/rate-limiter";
import { errorResponse } from "@/lib/api-response";
import { ValidationError, RateLimitError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { generateId } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id") ?? "";

  logger.debug("POST /api/chat", { tenantId });

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rateLimit = checkRateLimit(buildRateLimitKey(tenantId || "anon", ip));
  if (!rateLimit.allowed) {
    return errorResponse(new RateLimitError(rateLimit.resetAt), tenantId);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(new ValidationError("Invalid JSON body"), tenantId);
  }

  const chatRequest = body as Partial<ChatRequest>;
  const resolvedTenantId = chatRequest.tenantId || tenantId;

  if (!resolvedTenantId) {
    return errorResponse(new ValidationError("tenant_id is required"), "unknown");
  }

  // ── Prepare RAG context + AI messages ────────────────────────────────────
  let prepared: Awaited<ReturnType<typeof chatServerService.prepareMessages>>;
  try {
    prepared = await chatServerService.prepareMessages({
      message: chatRequest.message ?? "",
      tenantId: resolvedTenantId,
      sessionId: chatRequest.sessionId,
      visitorId: chatRequest.visitorId,
    });
  } catch (err) {
    return errorResponse(err, resolvedTenantId);
  }

  const { sessionId, visitorId, aiMessages } = prepared;
  const messageId = generateId();
  const userMessage = chatRequest.message ?? "";

  // ── Streaming response ────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const aiProvider = getAIProvider();

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";

      try {
        for await (const token of aiProvider.stream({
          tenantId: resolvedTenantId,
          messages: aiMessages,
        })) {
          fullResponse += token;
          controller.enqueue(encoder.encode(token));
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "AI error";
        logger.error("Streaming error", { error: errMsg });
        controller.enqueue(encoder.encode(`\n\n[ERROR]: ${errMsg}`));
      } finally {
        controller.close();

        // Fire-and-forget: persist + analytics (never blocks the response)
        if (fullResponse) {
          void chatServerService.persistConversation({
            sessionId,
            visitorId,
            tenantId: resolvedTenantId,
            userMessage,
            assistantMessage: fullResponse,
          });
          void analyticsService.track(
            resolvedTenantId,
            "message_sent",
            { sessionId, messageLength: userMessage.length },
            sessionId,
          );
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
      "X-Session-Id": sessionId,
      "X-Message-Id": messageId,
    },
  });
}
