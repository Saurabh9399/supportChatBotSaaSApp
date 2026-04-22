export type AnalyticsEventType =
  | "chat_started"
  | "message_sent"
  | "session_resolved"
  | "session_abandoned"
  | "document_uploaded"
  | "document_deleted";

export interface AnalyticsEvent {
  id: string;
  tenantId: string;
  sessionId?: string;
  eventType: AnalyticsEventType;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardMetrics {
  totalChats: number;
  totalMessages: number;
  resolvedChats: number;
  resolutionRate: number;         // 0–100
  avgResponseTimeMs: number;
  totalDocuments: number;
  activeSessionsToday: number;
  messagesByDay: DayMetric[];
  topEventTypes: EventTypeCount[];
}

export interface DayMetric {
  date: string;             // YYYY-MM-DD
  messages: number;
  chats: number;
}

export interface EventTypeCount {
  eventType: string;
  count: number;
}

export interface AnalyticsQueryParams {
  tenantId: string;
  fromDate?: string;       // ISO date
  toDate?: string;         // ISO date
  granularity?: "day" | "week" | "month";
}
