export type AIProvider = "groq" | "openai" | "xai" | "mock";
export type EmbeddingProvider = "jina" | "openai" | "huggingface";

export const AI_CONFIG = {
  provider: (process.env.AI_PROVIDER ?? "groq") as AIProvider,
  modelId: process.env.AI_MODEL_ID ?? "llama-3.3-70b-versatile",
  maxTokens: 1024,
  temperature: 0.7,
  systemPrompt: `You are a helpful customer support assistant.
Be concise, friendly, and accurate.
If you don't know the answer, say so honestly and offer to escalate.`,
} as const;

const DIMENSIONS: Record<string, number> = {
  "jina-embeddings-v2-base-en": 768,
  "jina-embeddings-v2-small-en": 512,
  "text-embedding-3-small": 1536,
  "text-embedding-3-large": 3072,
};

const modelId = process.env.EMBEDDING_MODEL_ID ?? "jina-embeddings-v2-base-en";

export const EMBEDDING_CONFIG = {
  provider: (process.env.EMBEDDING_PROVIDER ?? "jina") as EmbeddingProvider,
  modelId,
  dimensions: DIMENSIONS[modelId] ?? 768,
} as const;
