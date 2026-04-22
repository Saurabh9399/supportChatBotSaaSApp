import { EMBEDDING_CONFIG } from "@/config";
import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/db";

export interface EmbeddingRequest {
  text: string;
  tenantId: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
  modelId: string;
}

export async function generateEmbedding(
  request: EmbeddingRequest,
): Promise<EmbeddingResponse> {
  logger.debug("Generating embedding", {
    provider: EMBEDDING_CONFIG.provider,
    tenantId: request.tenantId,
    textLength: request.text.length,
  });

  const provider = EMBEDDING_CONFIG.provider;

  if (provider === "jina") {
    return generateJinaEmbedding(request.text);
  }

  if (provider === "openai") {
    return generateOpenAIEmbedding(request.text);
  }

  // Graceful stub — zero-vector when no provider is configured
  logger.warn("No embedding provider configured — returning zero-vector stub");
  return {
    embedding: new Array(EMBEDDING_CONFIG.dimensions).fill(0) as number[],
    dimensions: EMBEDDING_CONFIG.dimensions,
    modelId: "stub",
  };
}

async function generateJinaEmbedding(text: string): Promise<EmbeddingResponse> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error("JINA_API_KEY is not set");

  const response = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_CONFIG.modelId,
      input: [text],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Jina API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    data: { embedding: number[] }[];
  };

  const embedding = data.data[0].embedding;

  return {
    embedding,
    dimensions: embedding.length,
    modelId: EMBEDDING_CONFIG.modelId,
  };
}

async function generateOpenAIEmbedding(text: string): Promise<EmbeddingResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  // Dynamic import — only loads openai package when actually needed
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey });

  const response = await openai.embeddings.create({
    model: EMBEDDING_CONFIG.modelId,
    input: text,
  });

  return {
    embedding: response.data[0].embedding,
    dimensions: EMBEDDING_CONFIG.dimensions,
    modelId: EMBEDDING_CONFIG.modelId,
  };
}

export interface VectorSearchRequest {
  queryEmbedding: number[];
  tenantId: string;
  topK?: number;
  threshold?: number;
}

export interface VectorSearchResult {
  id: string;
  documentId: string;
  content: string;
  score: number;
}

export async function vectorSearch(
  request: VectorSearchRequest,
): Promise<VectorSearchResult[]> {
  logger.debug("Vector search", {
    tenantId: request.tenantId,
    topK: request.topK ?? 5,
  });

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: request.queryEmbedding,
      match_threshold: request.threshold ?? 0.5,
      match_count: request.topK ?? 5,
      p_tenant_id: request.tenantId,
    });

    if (error) {
      logger.warn("Vector search RPC error", { error: error.message });
      return [];
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      documentId: row.document_id,
      content: row.content,
      score: row.score,
    }));
  } catch (err) {
    logger.warn("Vector search failed, returning empty", { error: String(err) });
    return [];
  }
}
