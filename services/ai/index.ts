import type { AIProvider, AICompletionRequest, AICompletionResponse } from "./types";
import { AI_CONFIG } from "@/config";
import { logger } from "@/lib/logger";

function createAIProvider(): AIProvider {
  const provider = AI_CONFIG.provider;

  // Explicit mock mode — useful during dev when no paid API key is available
  if (provider === "mock") {
    logger.info("AI provider: mock (AI_PROVIDER=mock)");
    const { MockAIProvider } = require("./providers/mock") as typeof import("./providers/mock");
    return new MockAIProvider();
  }

  const hasKey =
    (provider === "groq" && !!process.env.GROQ_API_KEY) ||
    (provider === "openai" && !!process.env.OPENAI_API_KEY) ||
    (provider === "xai" && !!process.env.XAI_API_KEY);

  if (!hasKey) {
    logger.info("AI provider: using mock (no API key configured)");
    const { MockAIProvider } = require("./providers/mock") as typeof import("./providers/mock");
    return new MockAIProvider();
  }

  logger.info(`AI provider: ${provider}`);

  if (provider === "xai") {
    const { XAIProvider } = require("./providers/xai") as typeof import("./providers/xai");
    return new XAIProvider();
  }

  if (provider === "groq") {
    const { GroqProvider } = require("./providers/groq") as typeof import("./providers/groq");
    return new GroqProvider();
  }

  const { OpenAIProvider } = require("./providers/openai") as typeof import("./providers/openai");
  return new OpenAIProvider();
}

let _aiProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!_aiProvider) _aiProvider = createAIProvider();
  return _aiProvider;
}

export async function generateAICompletion(
  request: AICompletionRequest,
): Promise<AICompletionResponse> {
  return getAIProvider().complete(request);
}

export * from "./types";
