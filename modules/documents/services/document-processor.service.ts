import { generateEmbedding } from "@/services/embeddings";
import { getSupabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";

const CHUNK_SIZE = 500;       // characters per chunk
const CHUNK_OVERLAP = 50;     // overlap to preserve context across boundaries

/**
 * Split raw text into overlapping chunks.
 * A senior architect note: in production you'd use a token-aware splitter
 * (e.g. tiktoken) to respect model context windows precisely.
 */
export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 20) chunks.push(chunk); // skip micro-chunks
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

/**
 * Process a document: chunk it, embed each chunk, store in Supabase.
 * Called after the document record is created (status = 'processing').
 */
export async function processDocument(
  documentId: string,
  tenantId: string,
  content: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  logger.info("Processing document", { documentId, tenantId });

  try {
    const chunks = chunkText(content);
    logger.info("Document chunked", { documentId, chunkCount: chunks.length });

    // Embed and store each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const { embedding } = await generateEmbedding({ text: chunk, tenantId });

      await supabase.from("document_chunks").insert({
        document_id: documentId,
        tenant_id: tenantId,
        content: chunk,
        embedding,
        chunk_index: i,
        metadata: { charStart: i * (CHUNK_SIZE - CHUNK_OVERLAP) },
      });
    }

    // Mark document as ready
    await supabase
      .from("documents")
      .update({ status: "ready", chunk_count: chunks.length })
      .eq("id", documentId);

    logger.info("Document processed successfully", { documentId, chunkCount: chunks.length });
  } catch (err) {
    logger.error("Document processing failed", { documentId, error: String(err) });
    await supabase
      .from("documents")
      .update({ status: "failed" })
      .eq("id", documentId);
    throw err;
  }
}
