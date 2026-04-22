export type { ChatMessage, ChatSession, ChatRequest, ChatResponse, MessageRole, ChatSessionStatus } from "@/types/chat";

export interface ChatUIState {
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SendMessageOptions {
  onSuccess?: (message: import("@/types/chat").ChatMessage) => void;
  onError?: (error: string) => void;
}
