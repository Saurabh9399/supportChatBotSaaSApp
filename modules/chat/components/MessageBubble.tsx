"use client";

import { cn, formatTime } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { AlertCircle } from "lucide-react";
import { TypingIndicator } from "./TypingIndicator";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-2 animate-fade-in",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {/* Avatar — AI only */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm mt-1">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
      )}

      <div className={cn("flex flex-col gap-1 max-w-[75%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
            isUser
              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm"
              : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm",
            message.error && "border-red-200 bg-red-50",
          )}
        >
          {/* State 1: waiting for first token — show three dots */}
          {message.isLoading && !message.isStreaming ? (
            <TypingIndicator />
          ) : message.error ? (
            <span className="flex items-center gap-1.5 text-red-600">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {message.content}
            </span>
          ) : (
            <span className="whitespace-pre-wrap break-words">
              {message.content}
              {/* State 2: tokens arriving — show blinking cursor */}
              {message.isStreaming && (
                <span className="inline-block w-0.5 h-4 ml-0.5 bg-current align-middle animate-[blink_0.8s_ease-in-out_infinite]" />
              )}
            </span>
          )}
        </div>

        {/* Timestamp — only after streaming is done */}
        {!message.isLoading && !message.isStreaming && (
          <span className="text-[10px] text-gray-400 px-1">
            {formatTime(message.createdAt)}
          </span>
        )}
      </div>

      {/* Avatar — User only */}
      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center shadow-sm mt-1">
          <span className="text-white text-xs font-bold">U</span>
        </div>
      )}
    </div>
  );
}
