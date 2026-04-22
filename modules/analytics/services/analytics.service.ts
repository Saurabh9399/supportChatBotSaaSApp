import { getSupabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateId } from "@/lib/utils";
import type {
  AnalyticsEvent,
  AnalyticsEventType,
  DashboardMetrics,
  AnalyticsQueryParams,
  DayMetric,
} from "../types";

export class AnalyticsService {
  /**
   * Fire-and-forget event logging.
   * Never throws — analytics must never break core functionality.
   */
  async track(
    tenantId: string,
    eventType: AnalyticsEventType,
    metadata: Record<string, unknown> = {},
    sessionId?: string,
  ): Promise<void> {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from("analytics_events").insert({
        id: generateId(),
        tenant_id: tenantId,
        session_id: sessionId ?? null,
        event_type: eventType,
        metadata,
      });
    } catch (err) {
      logger.warn("Analytics track failed (non-fatal)", { eventType, error: String(err) });
    }
  }

  async getDashboardMetrics(params: AnalyticsQueryParams): Promise<DashboardMetrics> {
    const supabase = getSupabaseAdmin();
    const { tenantId } = params;

    const fromDate = params.fromDate ?? new Date(Date.now() - 30 * 86400 * 1000).toISOString();
    const toDate = params.toDate ?? new Date().toISOString();

    logger.debug("Fetching analytics", { tenantId, fromDate, toDate });

    // Parallel queries for performance
    const [chatSessionsRes, chatMessagesRes, documentsRes, eventsRes] = await Promise.all([
      supabase
        .from("chat_sessions")
        .select("id, status, created_at", { count: "exact" })
        .eq("tenant_id", tenantId)
        .gte("created_at", fromDate)
        .lte("created_at", toDate),

      supabase
        .from("chat_messages")
        .select("id, created_at", { count: "exact" })
        .eq("tenant_id", tenantId)
        .gte("created_at", fromDate)
        .lte("created_at", toDate),

      supabase
        .from("documents")
        .select("id", { count: "exact" })
        .eq("tenant_id", tenantId),

      supabase
        .from("analytics_events")
        .select("event_type, created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", fromDate)
        .lte("created_at", toDate),
    ]);

    const sessions = chatSessionsRes.data ?? [];
    const totalChats = chatSessionsRes.count ?? 0;
    const totalMessages = chatMessagesRes.count ?? 0;
    const totalDocuments = documentsRes.count ?? 0;

    const resolvedChats = sessions.filter((s) => s.status === "resolved").length;
    const resolutionRate = totalChats > 0 ? Math.round((resolvedChats / totalChats) * 100) : 0;

    // Active sessions today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const activeSessionsToday = sessions.filter(
      (s) => new Date(s.created_at) >= todayStart && s.status === "active",
    ).length;

    // Messages by day (last 30 days)
    const messagesByDay = this.aggregateByDay(
      chatMessagesRes.data ?? [],
      chatSessionsRes.data ?? [],
      fromDate,
      toDate,
    );

    // Top event types
    const eventCounts: Record<string, number> = {};
    for (const ev of eventsRes.data ?? []) {
      eventCounts[ev.event_type] = (eventCounts[ev.event_type] ?? 0) + 1;
    }
    const topEventTypes = Object.entries(eventCounts)
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalChats,
      totalMessages,
      resolvedChats,
      resolutionRate,
      avgResponseTimeMs: 0, // requires message timing data — extend later
      totalDocuments,
      activeSessionsToday,
      messagesByDay,
      topEventTypes,
    };
  }

  private aggregateByDay(
    messages: { created_at: string }[],
    sessions: { created_at: string }[],
    fromDate: string,
    toDate: string,
  ): DayMetric[] {
    const dayMap: Record<string, { messages: number; chats: number }> = {};

    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Initialise every day in range
    for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      dayMap[d.toISOString().slice(0, 10)] = { messages: 0, chats: 0 };
    }

    for (const m of messages) {
      const day = m.created_at.slice(0, 10);
      if (dayMap[day]) dayMap[day].messages++;
    }
    for (const s of sessions) {
      const day = s.created_at.slice(0, 10);
      if (dayMap[day]) dayMap[day].chats++;
    }

    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  }
}

export const analyticsService = new AnalyticsService();
