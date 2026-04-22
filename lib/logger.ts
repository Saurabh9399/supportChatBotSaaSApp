import { LOG_CONFIG } from "@/config";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[LOG_CONFIG.level];
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  return entry.context ? `${base} ${JSON.stringify(entry.context)}` : base;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case "debug":
    case "info":
      console.log(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }

  // TODO: Forward to external log sink (Datadog, Axiom, etc.) in production
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log("debug", message, context),
  info:  (message: string, context?: Record<string, unknown>) => log("info",  message, context),
  warn:  (message: string, context?: Record<string, unknown>) => log("warn",  message, context),
  error: (message: string, context?: Record<string, unknown>) => log("error", message, context),
} as const;
