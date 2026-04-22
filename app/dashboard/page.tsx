import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChatWidget } from "@/modules/chat";
import { ChevronRight } from "lucide-react";
import {
  getDashboardStats,
  getRecentSessions,
  getSystemStatus,
} from "@/modules/dashboard/services/dashboard.service";
import type { ServiceHealth } from "@/modules/dashboard/services/dashboard.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { orgId } = await auth();
  const tenantId = orgId ?? "demo-tenant-001";

  // Fetch all data in parallel from real Supabase
  const [stats, recentSessions, systemStatus] = await Promise.all([
    getDashboardStats(tenantId).catch(() => null),
    getRecentSessions(tenantId, 5).catch(() => []),
    getSystemStatus(tenantId).catch(() => []),
  ]);

  const statCards = stats
    ? [
        {
          label: "Total Chats (30d)",
          value: stats.totalChats.toLocaleString(),
          sub: `${stats.resolvedChats} resolved`,
          color: "text-blue-600",
        },
        {
          label: "Resolution Rate",
          value: `${stats.resolutionRate}%`,
          sub: stats.resolutionRate >= 80 ? "On track" : "Needs attention",
          color: stats.resolutionRate >= 80 ? "text-emerald-600" : "text-amber-500",
        },
        {
          label: "Total Messages (30d)",
          value: stats.totalMessages.toLocaleString(),
          sub: "User + AI messages",
          color: "text-indigo-600",
        },
        {
          label: "Active Today",
          value: stats.activeSessionsToday.toLocaleString(),
          sub: "Sessions started today",
          color: "text-violet-600",
        },
        {
          label: "Documents",
          value: stats.totalDocuments.toLocaleString(),
          sub: "In knowledge base",
          color: "text-pink-600",
        },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tenant:{" "}
            <span className="font-mono text-blue-600">{tenantId}</span>
            <span className="ml-2 text-gray-400">· Last 30 days</span>
          </p>
        </div>

        {/* Stats */}
        {stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {statCards.map((stat) => (
              <Card key={stat.label}>
                <CardBody className="p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide mb-1 leading-tight">
                    {stat.label}
                  </p>
                  <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{stat.sub}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardBody className="p-3 sm:p-4">
                  <div className="h-3 bg-gray-100 rounded w-3/4 mb-2 animate-pulse" />
                  <div className="h-7 bg-gray-100 rounded w-1/2 animate-pulse" />
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Recent conversations + System status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent conversations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Recent Conversations</h2>
                <Link
                  href="/dashboard/conversations"
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  View all →
                </Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {recentSessions.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                  No conversations yet. Open the chat widget to start one.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentSessions.map((session) => {
                    const initials = session.visitorId.slice(0, 2).toUpperCase();
                    return (
                      <Link
                        key={session.id}
                        href={`/dashboard/conversations/${session.id}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-blue-50/40 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-gray-500 truncate">
                            {session.visitorId.slice(0, 12)}…
                          </p>
                          <p className="text-xs text-gray-400 truncate">{session.preview}</p>
                        </div>
                        <Badge
                          variant={
                            session.status === "resolved"
                              ? "success"
                              : session.status === "active"
                                ? "warning"
                                : "default"
                          }
                        >
                          {session.status}
                        </Badge>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* System status */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">System Status</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {systemStatus.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate pr-2">{item.label}</span>
                  <SystemStatusBadge status={item.status} />
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Chat widget */}
      <ChatWidget tenantId={tenantId} chatbotName="Support Assistant" />
    </DashboardLayout>
  );
}

function SystemStatusBadge({ status }: { status: ServiceHealth }) {
  if (status === "operational") return <Badge variant="success">Operational</Badge>;
  if (status === "degraded") return <Badge variant="warning">Degraded</Badge>;
  return <Badge variant="danger">Unavailable</Badge>;
}
