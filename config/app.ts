export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "SupportAI",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  version: "0.1.0",
} as const;

export const RATE_LIMIT_CONFIG = {
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "20", 10),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10),
} as const;

export const LOG_CONFIG = {
  level: (process.env.LOG_LEVEL ?? "info") as "debug" | "info" | "warn" | "error",
} as const;

export const CHAT_CONFIG = {
  maxMessageLength: 4000,
  maxMessagesPerSession: 100,
  typingIndicatorDelayMs: 500,
  defaultWelcomeMessage: "Hello! How can I help you today?",
  defaultChatbotName: "Support AI",
} as const;
