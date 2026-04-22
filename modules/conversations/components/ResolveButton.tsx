"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResolveButtonProps {
  sessionId: string;
  tenantId: string;
  currentStatus: string;
}

export function ResolveButton({ sessionId, tenantId, currentStatus }: ResolveButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (currentStatus === "resolved") {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
        <CheckCircle className="w-4 h-4" />
        Resolved
      </div>
    );
  }

  const handleResolve = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({ status: "resolved" }),
      });

      const json = await res.json() as { success: boolean; error?: { message: string } };
      if (!json.success) throw new Error(json.error?.message ?? "Failed to resolve");

      // Refresh the page to show updated status
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleResolve}
        disabled={loading}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
          "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500/40",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CheckCircle className="w-3.5 h-3.5" />
        )}
        {loading ? "Resolving…" : "Mark as Resolved"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
