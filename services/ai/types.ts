export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  tenantId: string;
  modelId?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResponse {
  content: string;
  modelId: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  name: string;
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  /** Yields text tokens one at a time for streaming responses. */
  stream(request: AICompletionRequest): AsyncGenerator<string>;
}
