"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-6">
      <p className="text-5xl mb-4">⚠️</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-500 mb-8 max-w-sm text-sm">
        An unexpected error occurred. Our team has been notified.
        {error.digest && (
          <span className="block mt-1 font-mono text-xs text-gray-400">
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
