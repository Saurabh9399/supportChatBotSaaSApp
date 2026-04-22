"use client";

import { Minus, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAT_CONFIG } from "@/config";

interface ChatHeaderProps {
  chatbotName?: string;
  isLoading: boolean;
  onClose: () => void;
  onClear: () => void;
}

export function ChatHeader({
  chatbotName = CHAT_CONFIG.defaultChatbotName,
  isLoading,
  onClose,
  onClear,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
      {/* Bot avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        {/* Online indicator */}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white",
            isLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400",
          )}
        />
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{chatbotName}</p>
        <p className="text-blue-100 text-[10px]">
          {isLoading ? "Typing…" : "Online · Typically replies instantly"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onClear}
          title="Clear conversation"
          className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors focus:outline-none focus:ring-1 focus:ring-white/40"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          title="Close chat"
          className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors focus:outline-none focus:ring-1 focus:ring-white/40"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
