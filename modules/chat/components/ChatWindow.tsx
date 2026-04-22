"use client";

import { cn } from "@/lib/utils";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import type { ChatMessage, ChatUIState } from "../types";

interface ChatWindowProps {
  messages: ChatMessage[];
  uiState: ChatUIState;
  chatbotName?: string;
  onSend: (message: string) => void;
  onClose: () => void;
  onClear: () => void;
}

export function ChatWindow({
  messages,
  uiState,
  chatbotName,
  onSend,
  onClose,
  onClear,
}: ChatWindowProps) {
  return (
    <div
      role="dialog"
      aria-label="Support chat"
      aria-modal="true"
      className={cn(
        "flex flex-col overflow-hidden",
        "bg-gray-50 border border-gray-200/60 shadow-chat-window",
        "animate-slide-up",
        // Mobile: fill the full screen (widget container is already inset-0)
        "w-full flex-1 rounded-none",
        // sm+: fixed floating panel with rounded corners
        "sm:flex-none sm:w-[380px] sm:h-[560px] sm:rounded-2xl sm:origin-bottom-right",
      )}
    >
      <ChatHeader
        chatbotName={chatbotName}
        isLoading={uiState.isLoading}
        onClose={onClose}
        onClear={onClear}
      />

      <ChatMessageList messages={messages} chatbotName={chatbotName} />

      <ChatInput onSend={onSend} isLoading={uiState.isLoading} />
    </div>
  );
}
