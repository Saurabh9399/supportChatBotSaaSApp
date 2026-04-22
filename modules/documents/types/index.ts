export interface Document {
  id: string;
  tenantId: string;
  name: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus = "processing" | "ready" | "failed";

export interface DocumentChunk {
  id: string;
  documentId: string;
  tenantId: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, unknown>;
}

export interface UploadDocumentRequest {
  tenantId: string;
  name: string;
  content: string;       // raw text extracted from file
  mimeType?: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}
