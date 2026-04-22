"use client";

import { useChat } from "../hooks/use-chat";
import { ChatTriggerButton } from "./ChatTriggerButton";
import { ChatWindow } from "./ChatWindow";
import { CHAT_CONFIG } from "@/config";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  tenantId: string;
  chatbotName?: string;
}

export function ChatWidget({
  tenantId,
  chatbotName = CHAT_CONFIG.defaultChatbotName,
}: ChatWidgetProps) {
  const { messages, uiState, sendMessage, clearMessages, toggleChat, closeChat } = useChat({
    tenantId,
  });

  return (
    <>
      {/* ── Mobile full-screen overlay ─────────────────────────────────────────
          When chat is open on small screens the window fills the whole viewport.
          On sm+ it reverts to the floating bottom-right panel.              */}
      <div
        aria-live="polite"
        className={cn(
          "fixed z-50 transition-all",
          uiState.isOpen
            // Open: fill screen on mobile, bottom-right corner on desktop
            ? "inset-0 sm:inset-auto sm:bottom-5 sm:right-5 flex flex-col sm:flex-col sm:items-end sm:gap-3"
            // Closed: just the trigger button in the corner
            : "bottom-4 right-4 sm:bottom-5 sm:right-5 flex flex-col items-end gap-3",
        )}
      >
        {/* Chat window */}
        {uiState.isOpen && (
          <ChatWindow
            messages={messages}
            uiState={uiState}
            chatbotName={chatbotName}
            onSend={sendMessage}
            onClose={closeChat}
            onClear={clearMessages}
          />
        )}

        {/* Trigger button — hidden on mobile when chat is open (close is inside header) */}
        <div className={cn(uiState.isOpen ? "hidden sm:flex sm:justify-end" : "flex justify-end")}>
          <ChatTriggerButton isOpen={uiState.isOpen} onClick={toggleChat} />
        </div>
      </div>
    </>
  );
}
