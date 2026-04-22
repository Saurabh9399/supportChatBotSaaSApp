import OpenAI from "openai";
import type { AIProvider, AICompletionRequest, AICompletionResponse } from "../types";
import { AIServiceError } from "@/lib/errors";
import { AI_CONFIG } from "@/config";
import { logger } from "@/lib/logger";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    this.client = new OpenAI({ apiKey });
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const modelId = request.modelId ?? "gpt-4o-mini";
    logger.debug("OpenAI completion", { tenantId: request.tenantId, modelId });

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
          ? { promptTokens: response.usage.prompt_tokens, completionTokens: response.usage.completion_tokens, totalTokens: response.usage.total_tokens }
          : undefined,
      };
    } catch (err) {
      logger.error("OpenAI API error", { error: String(err) });
      throw new AIServiceError(`OpenAI error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async *stream(request: AICompletionRequest): AsyncGenerator<string> {
    const modelId = request.modelId ?? "gpt-4o-mini";
    logger.debug("OpenAI stream", { tenantId: request.tenantId, modelId });

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
      logger.error("OpenAI stream error", { error: String(err) });
      throw new AIServiceError(`OpenAI error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
