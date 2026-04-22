import type { AIProvider, AICompletionRequest, AICompletionResponse } from "../types";
import { sleep } from "@/lib/utils";
import { logger } from "@/lib/logger";

const MOCK_RESPONSES = [
  "Thanks for reaching out! I'd be happy to help you with that. Could you provide a bit more detail?",
  "Great question! Based on our knowledge base, here's what I can tell you: this is typically resolved by checking your account settings.",
  "I understand your concern. Let me look into this for you. In the meantime, you can also check our FAQ section.",
  "That's a common issue we see. The best approach is to clear your cache and try again. If the problem persists, our team is here to help.",
  "I've noted your request. Our support team typically responds within 24 hours, but I can help with immediate questions right now.",
];

export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    logger.debug("Mock AI completion", { tenantId: request.tenantId });
    await sleep(600 + Math.random() * 400);
    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === "user");
    const content = selectMockResponse(lastUserMessage?.content ?? "");
    return { content, modelId: "mock-model-v1", usage: { promptTokens: 50, completionTokens: 40, totalTokens: 90 } };
  }

  async *stream(request: AICompletionRequest): AsyncGenerator<string> {
    logger.debug("Mock AI stream", { tenantId: request.tenantId });
    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === "user");
    const content = selectMockResponse(lastUserMessage?.content ?? "");

    // Simulate streaming word by word with natural delays
    const words = content.split(" ");
    for (let i = 0; i < words.length; i++) {
      yield i === 0 ? words[i] : " " + words[i];
      await sleep(40 + Math.random() * 60);
    }
  }
}

function selectMockResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("hello") || lower.includes("hi")) return "Hello! I'm your AI support assistant. How can I help you today?";
  if (lower.includes("price") || lower.includes("cost") || lower.includes("plan")) return "We offer flexible plans starting from our free tier up to enterprise. Would you like me to walk you through the options?";
  if (lower.includes("bug") || lower.includes("error") || lower.includes("broken")) return "I'm sorry to hear you're experiencing an issue. Could you share more details so I can help troubleshoot?";
  if (lower.includes("thank")) return "You're welcome! Is there anything else I can help you with today?";
  const idx = Math.abs(hashCode(input)) % MOCK_RESPONSES.length;
  return MOCK_RESPONSES[idx];
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
  return hash;
}
