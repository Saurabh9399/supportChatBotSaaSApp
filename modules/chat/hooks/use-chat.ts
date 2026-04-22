"use client";

import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { ChatMessage, ChatUIState } from "../types";
import { chatClientService } from "../services/chat.service";
import { generateId, sanitizeInput } from "@/lib/utils";
import { CHAT_CONFIG } from "@/config";

interface UseChatOptions {
  tenantId: string;
  initialSessionId?: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  uiState: ChatUIState;
  sessionId: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  toggleChat: () => void;
  closeChat: () => void;
  openChat: () => void;
}

export function useChat({ tenantId, initialSessionId }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [uiState, setUiState] = useState<ChatUIState>({
    isOpen: false,
    isMinimized: false,
    isLoading: false,
    error: null,
  });

  const requestInFlight = useRef(false);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Update the last message in the list by its id
  const updateMessageById = useCallback((id: string, updater: (msg: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
  }, []);

  const sendMessage = useCallback(
    async (rawContent: string) => {
      const content = sanitizeInput(rawContent);
      if (!content || content.length > CHAT_CONFIG.maxMessageLength) return;
      if (requestInFlight.current) return;

      requestInFlight.current = true;

      // User bubble
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      // Assistant placeholder — shows typing dots until first token arrives
      const assistantId = generateId();
      const assistantPlaceholder: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        isLoading: true,
        isStreaming: false,
      };

      setUiState((prev) => ({ ...prev, isLoading: true, error: null }));
      addMessage(userMessage);
      addMessage(assistantPlaceholder);

      await chatClientService.streamMessage(
        { message: content, tenantId, sessionId: sessionId ?? undefined },
        {
          onToken(token) {
            // flushSync forces React to render synchronously after every token
            // instead of batching them all into one update — this produces
            // the visible letter-by-letter typing effect.
            flushSync(() => {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantId) return m;
                  return {
                    ...m,
                    content: m.content + token,
                    isLoading: false, // hide typing dots on first token
                    isStreaming: true,
                  };
                }),
              );
            });
          },
          onDone(newSessionId) {
            if (newSessionId) setSessionId(newSessionId);
            // Remove streaming cursor, keep final content
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, isStreaming: false } : m,
              ),
            );
            setUiState((prev) => ({ ...prev, isLoading: false }));
            requestInFlight.current = false;
          },
          onError(error) {
            updateMessageById(assistantId, (m) => ({
              ...m,
              content: "Sorry, I couldn't process your request. Please try again.",
              isLoading: false,
              isStreaming: false,
              error,
            }));
            setUiState((prev) => ({ ...prev, isLoading: false, error }));
            requestInFlight.current = false;
          },
        },
      );
    },
    [tenantId, sessionId, addMessage, updateMessageById],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setUiState((prev) => ({ ...prev, error: null }));
  }, []);

  const toggleChat = useCallback(() => setUiState((p) => ({ ...p, isOpen: !p.isOpen })), []);
  const openChat = useCallback(() => setUiState((p) => ({ ...p, isOpen: true })), []);
  const closeChat = useCallback(() => setUiState((p) => ({ ...p, isOpen: false })), []);

  return { messages, uiState, sessionId, sendMessage, clearMessages, toggleChat, closeChat, openChat };
}
