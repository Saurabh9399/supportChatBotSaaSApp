export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  isLoading?: boolean;   // true = three-dot typing indicator (before first token)
  isStreaming?: boolean; // true = tokens arriving (show blinking cursor)
  error?: string;
}

export interface ChatSession {
  id: string;
  tenantId: string;
  visitorId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  status: ChatSessionStatus;
}

export type ChatSessionStatus = "active" | "resolved" | "abandoned";

export interface ChatRequest {
  message: string;
  tenantId: string;
  sessionId?: string;
  visitorId?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  sessionId: string;
}
