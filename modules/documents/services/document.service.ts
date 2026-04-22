import { getSupabaseAdmin } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { analyticsService } from "@/modules/analytics/services/analytics.service";
import type { Document, UploadDocumentRequest, DocumentListResponse } from "../types";
import { processDocument } from "./document-processor.service";

export class DocumentService {
  async uploadDocument(request: UploadDocumentRequest): Promise<Document> {
    if (!request.name.trim()) throw new ValidationError("Document name is required");
    if (!request.content.trim()) throw new ValidationError("Document content is empty");
    if (request.content.length > 5_000_000) {
      throw new ValidationError("Document too large (max 5MB text)");
    }

    const supabase = getSupabaseAdmin();

    // 1. Create the document record
    const { data, error } = await supabase
      .from("documents")
      .insert({
        tenant_id: request.tenantId,
        name: request.name.trim(),
        file_path: `tenants/${request.tenantId}/${Date.now()}_${request.name}`,
        file_size: Buffer.byteLength(request.content, "utf8"),
        mime_type: request.mimeType ?? "text/plain",
        status: "processing",
      })
      .select()
      .single();

    if (error || !data) {
      logger.error("Failed to create document record", { error });
      throw new Error("Failed to create document");
    }

    logger.info("Document record created", { id: data.id, tenantId: request.tenantId });

    // 2. Process asynchronously (chunk + embed) — fire and forget
    processDocument(data.id, request.tenantId, request.content).catch((err) => {
      logger.error("Background document processing failed", { id: data.id, error: String(err) });
    });

    // 3. Track analytics event
    void analyticsService.track(request.tenantId, "document_uploaded", {
      documentId: data.id,
      name: request.name,
      size: Buffer.byteLength(request.content, "utf8"),
    });

    return this.mapRow(data);
  }

  async listDocuments(tenantId: string): Promise<DocumentListResponse> {
    const supabase = getSupabaseAdmin();

    const { data, error, count } = await supabase
      .from("documents")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return {
      documents: (data ?? []).map(this.mapRow),
      total: count ?? 0,
    };
  }

  async deleteDocument(id: string, tenantId: string): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { data } = await supabase
      .from("documents")
      .select("id")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (!data) throw new NotFoundError("Document");

    await supabase.from("document_chunks").delete().eq("document_id", id);
    await supabase.from("documents").delete().eq("id", id);

    void analyticsService.track(tenantId, "document_deleted", { documentId: id });

    logger.info("Document deleted", { id, tenantId });
  }

  private mapRow(row: Record<string, unknown>): Document {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      name: row.name as string,
      filePath: row.file_path as string,
      fileSize: row.file_size as number,
      mimeType: row.mime_type as string,
      status: row.status as Document["status"],
      chunkCount: row.chunk_count as number,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

export const documentService = new DocumentService();
