import type { ChatRequest, ChatMessage } from "@/types/chat";
import type { AIMessage } from "@/services/ai/types";
import { generateEmbedding, vectorSearch } from "@/services/embeddings";
import { AI_CONFIG } from "@/config";
import { getTenantSettings } from "@/modules/settings/services/settings.service";
import { generateId } from "@/lib/utils";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { CHAT_CONFIG } from "@/config";
import { getSupabaseAdmin } from "@/lib/db";

export interface PreparedMessages {
  sessionId: string;
  visitorId: string;
  aiMessages: AIMessage[];
}

export class ChatServerService {
  /**
   * Validates the request and builds the AI message array with RAG context.
   * Used by both streaming and non-streaming paths.
   */
  async prepareMessages(request: ChatRequest): Promise<PreparedMessages> {
    this.validateRequest(request);

    const sessionId = request.sessionId ?? generateId();
    const visitorId = request.visitorId ?? generateId();
    const contextMessages: AIMessage[] = [];

    // Load tenant's custom system prompt (falls back to default if not set)
    const tenantSettings = await getTenantSettings(request.tenantId);
    const systemPrompt = tenantSettings.systemPrompt ?? AI_CONFIG.systemPrompt;

    // RAG: embed query → vector search → inject relevant chunks
    try {
      const { embedding } = await generateEmbedding({
        text: request.message,
        tenantId: request.tenantId,
      });

      const results = await vectorSearch({
        queryEmbedding: embedding,
        tenantId: request.tenantId,
        topK: 3,
        threshold: 0.5,
      });

      if (results.length > 0) {
        const context = results.map((r) => r.content).join("\n\n---\n\n");
        contextMessages.push({
          role: "system",
          content: `Relevant knowledge base context:\n\n${context}`,
        });
        logger.debug("RAG context injected", {
          tenantId: request.tenantId,
          chunkCount: results.length,
        });
      }
    } catch (err) {
      logger.warn("RAG retrieval failed, continuing without context", { error: String(err) });
    }

    return {
      sessionId,
      visitorId,
      aiMessages: [
        { role: "system", content: systemPrompt },
        ...contextMessages,
        { role: "user", content: request.message },
      ],
    };
  }

  /**
   * Persists a completed conversation turn to Supabase.
   * Fire-and-forget — never throws, never blocks the streaming response.
   */
  async persistConversation(params: {
    sessionId: string;
    visitorId: string;
    tenantId: string;
    userMessage: string;
    assistantMessage: string;
  }): Promise<void> {
    const { sessionId, visitorId, tenantId, userMessage, assistantMessage } = params;
    try {
      const supabase = getSupabaseAdmin();

      // Upsert the session (creates on first message, no-ops on subsequent)
      await supabase.from("chat_sessions").upsert(
        { id: sessionId, tenant_id: tenantId, visitor_id: visitorId, status: "active" },
        { onConflict: "id", ignoreDuplicates: false },
      );

      // Insert both messages in one batch
      await supabase.from("chat_messages").insert([
        {
          id: generateId(),
          session_id: sessionId,
          tenant_id: tenantId,
          role: "user" as const,
          content: userMessage,
        },
        {
          id: generateId(),
          session_id: sessionId,
          tenant_id: tenantId,
          role: "assistant" as const,
          content: assistantMessage,
        },
      ]);

      logger.debug("Conversation persisted", { sessionId, tenantId });
    } catch (err) {
      // Never crash the chat — just log
      logger.warn("Failed to persist conversation (non-fatal)", { error: String(err) });
    }
  }

  /** Non-streaming fallback (kept for compatibility). */
  async processMessage(request: ChatRequest): Promise<{ message: ChatMessage; sessionId: string }> {
    const { sessionId, visitorId, aiMessages } = await this.prepareMessages(request);

    const { getAIProvider } = await import("@/services/ai");
    const provider = getAIProvider();

    const startTime = Date.now();
    const completion = await provider.complete({ tenantId: request.tenantId, messages: aiMessages });

    logger.info("AI completion finished", {
      tenantId: request.tenantId,
      sessionId,
      modelId: completion.modelId,
      processingTimeMs: Date.now() - startTime,
    });

    // Persist in background
    void this.persistConversation({
      sessionId,
      visitorId,
      tenantId: request.tenantId,
      userMessage: request.message,
      assistantMessage: completion.content,
    });

    return {
      sessionId,
      message: {
        id: generateId(),
        role: "assistant",
        content: completion.content,
        createdAt: new Date().toISOString(),
      },
    };
  }

  private validateRequest(request: ChatRequest): void {
    if (!request.message?.trim()) throw new ValidationError("Message cannot be empty");
    if (request.message.length > CHAT_CONFIG.maxMessageLength) {
      throw new ValidationError(`Message too long (max ${CHAT_CONFIG.maxMessageLength} chars)`);
    }
    if (!request.tenantId?.trim()) throw new ValidationError("tenant_id is required");
  }
}

export const chatServerService = new ChatServerService();
