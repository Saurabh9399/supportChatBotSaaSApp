import Groq from "groq-sdk";
import type { AIProvider, AICompletionRequest, AICompletionResponse } from "../types";
import { AIServiceError } from "@/lib/errors";
import { AI_CONFIG } from "@/config";
import { logger } from "@/lib/logger";

export class GroqProvider implements AIProvider {
  readonly name = "groq";
  private client: Groq;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");
    this.client = new Groq({ apiKey });
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const modelId = request.modelId ?? AI_CONFIG.modelId;
    logger.debug("Groq completion", { tenantId: request.tenantId, modelId });

    try {
      const response = await this.client.chat.completions.create({
        model: modelId,
        messages: request.messages,
        max_tokens: request.maxTokens ?? AI_CONFIG.maxTokens,
        temperature: request.temperature ?? AI_CONFIG.temperature,
      });

      const choice = response.choices[0];
      return {
        content: choice.message.content ?? "",
        modelId,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
      };
    } catch (err) {
      logger.error("Groq API error", { error: String(err) });
      throw new AIServiceError(`Groq error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async *stream(request: AICompletionRequest): AsyncGenerator<string> {
    const modelId = request.modelId ?? AI_CONFIG.modelId;
    logger.debug("Groq stream", { tenantId: request.tenantId, modelId });

    try {
      const completion = await this.client.chat.completions.create({
        model: modelId,
        messages: request.messages,
        max_tokens: request.maxTokens ?? AI_CONFIG.maxTokens,
        temperature: request.temperature ?? AI_CONFIG.temperature,
        stream: true,
      });

      for await (const chunk of completion) {
        const token = chunk.choices[0]?.delta?.content ?? "";
        if (token) yield token;
      }
    } catch (err) {
      logger.error("Groq stream error", { error: String(err) });
      throw new AIServiceError(`Groq error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
