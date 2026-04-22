"use client";

import { useCallback, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAT_CONFIG } from "@/config";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !isLoading && !disabled;

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    textareaRef.current?.focus();
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [value, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, []);

  const charsLeft = CHAT_CONFIG.maxMessageLength - value.length;
  const nearLimit = charsLeft < 100;

  return (
    <div className="flex flex-col gap-1 border-t border-gray-100 bg-white px-3 pt-2 pb-3 rounded-b-2xl">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          maxLength={CHAT_CONFIG.maxMessageLength}
          disabled={disabled || isLoading}
          aria-label="Chat message input"
          className={cn(
            "flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50",
            "px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400",
            "transition-all duration-150 leading-relaxed max-h-[120px] overflow-y-auto",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
            "transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/40",
            canSend
              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
              : "bg-gray-100 text-gray-400 cursor-not-allowed",
          )}
        >
          <SendHorizontal className="w-4 h-4" />
        </button>
      </div>
      {nearLimit && (
        <p className="text-[10px] text-right text-amber-500 pr-1">
          {charsLeft} characters remaining
        </p>
      )}
    </div>
  );
}
