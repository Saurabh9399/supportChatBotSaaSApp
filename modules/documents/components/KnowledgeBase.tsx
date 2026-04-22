"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Trash2, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { Document } from "../types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface KnowledgeBaseProps {
  tenantId: string;
}

export function KnowledgeBase({ tenantId }: KnowledgeBaseProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/documents", {
        headers: { "x-tenant-id": tenantId },
      });
      const json = await res.json() as { success: boolean; data: { documents: Document[] } };
      if (json.success) setDocuments(json.data.documents);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const content = await file.text();
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          name: file.name,
          content,
          mimeType: file.type || "text/plain",
        }),
      });

      const json = await res.json() as { success: boolean; error?: { message: string } };
      if (!json.success) throw new Error(json.error?.message ?? "Upload failed");

      await fetchDocuments();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document and all its embeddings?")) return;

    await fetch(`/api/documents/${id}`, {
      method: "DELETE",
      headers: { "x-tenant-id": tenantId },
    });

    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-5">
      {/* Upload card */}
      <Card>
        <CardBody>
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
              isUploading
                ? "border-blue-300 bg-blue-50"
                : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/30",
            )}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className={cn("w-8 h-8 mx-auto mb-3", isUploading ? "text-blue-500 animate-bounce-soft" : "text-gray-400")} />
            <p className="text-sm font-medium text-gray-700">
              {isUploading ? "Processing…" : "Click to upload a document"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              .txt, .md, .csv supported · Max 5MB text
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.csv,.text"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          {uploadError && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {uploadError}
            </p>
          )}
        </CardBody>
      </Card>

      {/* Document list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Documents{" "}
              <span className="text-gray-400 font-normal">({documents.length})</span>
            </h2>
            <Button variant="ghost" size="sm" onClick={fetchDocuments}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading && (
            <div className="divide-y divide-gray-50">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-3 animate-pulse flex gap-3 items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && documents.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              No documents yet. Upload your first one above.
            </div>
          )}

          {!isLoading && documents.length > 0 && (
            <div className="divide-y divide-gray-50">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 group">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400">
                      {(doc.fileSize / 1024).toFixed(1)} KB · {doc.chunkCount} chunks
                    </p>
                  </div>
                  <DocumentStatusBadge status={doc.status} />
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 rounded-lg hover:bg-red-50 focus:outline-none"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function DocumentStatusBadge({ status }: { status: Document["status"] }) {
  if (status === "ready") {
    return (
      <Badge variant="success" className="flex items-center gap-1">
        <CheckCircle className="w-2.5 h-2.5" /> Ready
      </Badge>
    );
  }
  if (status === "processing") {
    return (
      <Badge variant="warning" className="flex items-center gap-1">
        <Clock className="w-2.5 h-2.5" /> Processing
      </Badge>
    );
  }
  return (
    <Badge variant="danger" className="flex items-center gap-1">
      <AlertCircle className="w-2.5 h-2.5" /> Failed
    </Badge>
  );
}
