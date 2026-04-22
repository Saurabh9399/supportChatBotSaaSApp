"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { CHAT_CONFIG } from "@/config";

interface ChatMessageListProps {
  messages: ChatMessage[];
  chatbotName?: string;
}

export function ChatMessageList({ messages, chatbotName = CHAT_CONFIG.defaultChatbotName }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-8">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
          <span className="text-white text-xl font-bold">AI</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">{chatbotName}</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {CHAT_CONFIG.defaultWelcomeMessage}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {["What can you help with?", "Pricing info", "Report a bug"].map((suggestion) => (
            <span
              key={suggestion}
              className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 cursor-default"
            >
              {suggestion}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
