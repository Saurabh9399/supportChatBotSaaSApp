import OpenAI from "openai";
import type { AIProvider, AICompletionRequest, AICompletionResponse } from "../types";
import { AIServiceError } from "@/lib/errors";
import { AI_CONFIG } from "@/config";
import { logger } from "@/lib/logger";

export class XAIProvider implements AIProvider {
  readonly name = "xai";
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.XAI_API_KEY ?? process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("XAI_API_KEY is not set");
    this.client = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const modelId = request.modelId ?? "grok-3";
    logger.debug("xAI completion", { tenantId: request.tenantId, modelId });

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
      logger.error("xAI API error", { error: String(err) });
      throw new AIServiceError(`xAI error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async *stream(request: AICompletionRequest): AsyncGenerator<string> {
    const modelId = request.modelId ?? "grok-3";
    logger.debug("xAI stream", { tenantId: request.tenantId, modelId });

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
      logger.error("xAI stream error", { error: String(err) });
      throw new AIServiceError(`xAI error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
