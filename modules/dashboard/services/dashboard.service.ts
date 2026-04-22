import { getSupabaseAdmin } from "@/lib/db";
import { AI_CONFIG, EMBEDDING_CONFIG } from "@/config";
import { logger } from "@/lib/logger";

export interface DashboardStats {
  totalChats: number;
  totalMessages: number;
  resolvedChats: number;
  resolutionRate: number;
  activeSessionsToday: number;
  totalDocuments: number;
}

export interface RecentSession {
  id: string;
  visitorId: string;
  status: string;
  preview: string; // latest user message
  createdAt: string;
}

export type ServiceHealth = "operational" | "degraded" | "unavailable";

export interface SystemStatus {
  name: string;
  label: string;   // human-readable display
  status: ServiceHealth;
}

export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  const supabase = getSupabaseAdmin();
  const fromDate = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [sessionsRes, messagesRes, docsRes] = await Promise.all([
    supabase
      .from("chat_sessions")
      .select("id, status, created_at", { count: "exact" })
      .eq("tenant_id", tenantId)
      .gte("created_at", fromDate),

    supabase
      .from("chat_messages")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .gte("created_at", fromDate),

    supabase
      .from("documents")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId),
  ]);

  const sessions = sessionsRes.data ?? [];
  const totalChats = sessionsRes.count ?? 0;
  const totalMessages = messagesRes.count ?? 0;
  const totalDocuments = docsRes.count ?? 0;

  const resolvedChats = sessions.filter((s) => s.status === "resolved").length;
  const resolutionRate = totalChats > 0 ? Math.round((resolvedChats / totalChats) * 100) : 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const activeSessionsToday = sessions.filter(
    (s) => new Date(s.created_at) >= todayStart,
  ).length;

  return { totalChats, totalMessages, resolvedChats, resolutionRate, activeSessionsToday, totalDocuments };
}

export async function getRecentSessions(
  tenantId: string,
  limit = 5,
): Promise<RecentSession[]> {
  const supabase = getSupabaseAdmin();

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id, visitor_id, status, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!sessions?.length) return [];

  const sessionIds = sessions.map((s) => s.id);

  // Grab the latest user message per session for preview text
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("session_id, content, role, created_at")
    .in("session_id", sessionIds)
    .eq("role", "user")
    .order("created_at", { ascending: false });

  // Map: sessionId → first (most recent) user message
  const previewMap: Record<string, string> = {};
  for (const msg of messages ?? []) {
    if (!previewMap[msg.session_id]) {
      previewMap[msg.session_id] = msg.content;
    }
  }

  return sessions.map((s) => ({
    id: s.id,
    visitorId: s.visitor_id,
    status: s.status,
    preview: previewMap[s.id] ?? "— no messages —",
    createdAt: s.created_at,
  }));
}

// ── Conversations ─────────────────────────────────────────────────────────

export interface ConversationSession {
  id: string;
  visitorId: string;
  status: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export async function getAllConversations(
  tenantId: string,
  limit = 50,
): Promise<ConversationSession[]> {
  const supabase = getSupabaseAdmin();

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id, visitor_id, status, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!sessions?.length) return [];

  const sessionIds = sessions.map((s) => s.id);

  // Latest user message per session (preview) + total message counts
  const [previewRes, countsRes] = await Promise.all([
    supabase
      .from("chat_messages")
      .select("session_id, content")
      .in("session_id", sessionIds)
      .eq("role", "user")
      .order("created_at", { ascending: false }),
    supabase
      .from("chat_messages")
      .select("session_id")
      .in("session_id", sessionIds),
  ]);

  const previewMap: Record<string, string> = {};
  for (const m of previewRes.data ?? []) {
    if (!previewMap[m.session_id]) previewMap[m.session_id] = m.content;
  }

  const countMap: Record<string, number> = {};
  for (const m of countsRes.data ?? []) {
    countMap[m.session_id] = (countMap[m.session_id] ?? 0) + 1;
  }

  return sessions.map((s) => ({
    id: s.id,
    visitorId: s.visitor_id,
    status: s.status,
    preview: previewMap[s.id] ?? "— no messages —",
    messageCount: countMap[s.id] ?? 0,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }));
}

export async function getConversationMessages(
  sessionId: string,
  tenantId: string,
): Promise<{ session: ConversationSession | null; messages: ConversationMessage[] }> {
  const supabase = getSupabaseAdmin();

  const [sessionRes, messagesRes] = await Promise.all([
    supabase
      .from("chat_sessions")
      .select("id, visitor_id, status, created_at, updated_at")
      .eq("id", sessionId)
      .eq("tenant_id", tenantId)
      .single(),
    supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", sessionId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true }),
  ]);

  if (!sessionRes.data) return { session: null, messages: [] };

  const s = sessionRes.data;
  const msgs = messagesRes.data ?? [];
  const preview = msgs.find((m) => m.role === "user")?.content ?? "— no messages —";

  return {
    session: {
      id: s.id,
      visitorId: s.visitor_id,
      status: s.status,
      preview,
      messageCount: msgs.length,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    },
    messages: msgs
      .filter((m): m is typeof m & { role: "user" | "assistant" | "system" } =>
        ["user", "assistant", "system"].includes(m.role),
      )
      .map((m) => ({
        id: m.id,
        role: m.role as ConversationMessage["role"],
        content: m.content,
        createdAt: m.created_at,
      })),
  };
}

export async function getSystemStatus(tenantId: string): Promise<SystemStatus[]> {
  const results: SystemStatus[] = [];

  // 1. Chat API — if we're running, it's operational
  results.push({ name: "chat_api", label: "Chat API", status: "operational" });

  // 2. AI Provider — check env key is present
  const aiLabel = `AI (${AI_CONFIG.provider} / ${AI_CONFIG.modelId})`;
  const hasAiKey =
    AI_CONFIG.provider === "groq"
      ? !!process.env.GROQ_API_KEY
      : AI_CONFIG.provider === "openai"
        ? !!process.env.OPENAI_API_KEY
        : AI_CONFIG.provider === "xai"
          ? !!process.env.XAI_API_KEY
          : true; // mock always "operational"
  results.push({ name: "ai", label: aiLabel, status: hasAiKey ? "operational" : "unavailable" });

  // 3. Database — attempt a fast lightweight query
  let dbStatus: ServiceHealth = "operational";
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .limit(1);
    if (error) dbStatus = "degraded";
  } catch {
    dbStatus = "unavailable";
  }
  results.push({ name: "database", label: "Database (Supabase)", status: dbStatus });

  // 4. Embeddings — check env key is present
  const embLabel = `Embeddings (${EMBEDDING_CONFIG.provider} / ${EMBEDDING_CONFIG.modelId})`;
  const hasEmbKey =
    EMBEDDING_CONFIG.provider === "jina"
      ? !!process.env.JINA_API_KEY
      : EMBEDDING_CONFIG.provider === "openai"
        ? !!process.env.OPENAI_API_KEY
        : true;
  results.push({ name: "embeddings", label: embLabel, status: hasEmbKey ? "operational" : "unavailable" });

  logger.debug("System status checked", { tenantId });
  return results;
}
