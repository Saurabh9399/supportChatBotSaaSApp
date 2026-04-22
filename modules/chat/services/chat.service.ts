import type { ChatRequest } from "@/types/chat";
import { logger } from "@/lib/logger";

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (sessionId: string, messageId: string) => void;
  onError: (error: string) => void;
}

export class ChatClientService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  async streamMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void> {
    logger.debug("Streaming chat message", {
      tenantId: request.tenantId,
      sessionId: request.sessionId,
    });

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": request.tenantId,
        },
        body: JSON.stringify(request),
      });
    } catch (err) {
      callbacks.onError(err instanceof Error ? err.message : "Network error");
      return;
    }

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      let message = `Request failed (${response.status})`;
      try {
        const json = JSON.parse(text) as { error?: { message?: string } };
        message = json.error?.message ?? message;
      } catch { /* not JSON */ }
      callbacks.onError(message);
      return;
    }

    const sessionId = response.headers.get("X-Session-Id") ?? "";
    const messageId = response.headers.get("X-Message-Id") ?? "";

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        callbacks.onToken(chunk);
      }
      callbacks.onDone(sessionId, messageId);
    } catch (err) {
      callbacks.onError(err instanceof Error ? err.message : "Stream read error");
    } finally {
      reader.releaseLock();
    }
  }
}

export const chatClientService = new ChatClientService();
