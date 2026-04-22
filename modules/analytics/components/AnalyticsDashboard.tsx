"use client";

import { useEffect, useState, useCallback } from "react";
import type { DashboardMetrics } from "../types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface AnalyticsDashboardProps {
  tenantId: string;
}

export function AnalyticsDashboard({ tenantId }: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics`, {
        headers: { "x-tenant-id": tenantId },
      });
      const json = await res.json() as { success: boolean; data: DashboardMetrics; error?: { message: string } };
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load analytics");
      setMetrics(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  if (isLoading) return <AnalyticsSkeleton />;
  if (error) return <AnalyticsError message={error} onRetry={fetchMetrics} />;
  if (!metrics) return null;

  const statCards = [
    { label: "Total Chats", value: metrics.totalChats.toLocaleString(), icon: "💬", trend: null },
    { label: "Total Messages", value: metrics.totalMessages.toLocaleString(), icon: "✉️", trend: null },
    { label: "Resolution Rate", value: `${metrics.resolutionRate}%`, icon: "✅", trend: metrics.resolutionRate >= 80 ? "good" : "warn" },
    { label: "Documents", value: metrics.totalDocuments.toLocaleString(), icon: "📄", trend: null },
    { label: "Active Today", value: metrics.activeSessionsToday.toLocaleString(), icon: "🟢", trend: null },
    { label: "Resolved", value: metrics.resolvedChats.toLocaleString(), icon: "🏁", trend: null },
  ];

  const maxMessages = Math.max(...metrics.messagesByDay.map((d) => d.messages), 1);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardBody className="p-3 sm:p-4">
              <div className="text-lg sm:text-xl mb-1">{stat.icon}</div>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide truncate">{stat.label}</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
              {stat.trend && (
                <Badge variant={stat.trend === "good" ? "success" : "warning"} className="mt-1 text-[10px]">
                  {stat.trend === "good" ? "On track" : "Needs attention"}
                </Badge>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Messages by day bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Messages per day (last 30 days)</h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-end gap-0.5 h-24 sm:h-32">
              {metrics.messagesByDay.slice(-30).map((day) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-0.5 group"
                  title={`${day.date}: ${day.messages} messages, ${day.chats} chats`}
                >
                  <div
                    className={cn(
                      "w-full rounded-t transition-all",
                      day.messages > 0
                        ? "bg-blue-500 group-hover:bg-blue-600"
                        : "bg-gray-100",
                    )}
                    style={{ height: `${Math.max((day.messages / maxMessages) * 100, 2)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">
                {metrics.messagesByDay[0]?.date ?? ""}
              </span>
              <span className="text-[10px] text-gray-400">
                {metrics.messagesByDay[metrics.messagesByDay.length - 1]?.date ?? ""}
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Top events */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Top events</h2>
          </CardHeader>
          <CardBody className="space-y-2">
            {metrics.topEventTypes.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No events yet</p>
            )}
            {metrics.topEventTypes.map((ev) => {
              const max = metrics.topEventTypes[0]?.count ?? 1;
              return (
                <div key={ev.eventType}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-xs text-gray-600 font-medium truncate">
                      {ev.eventType.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">{ev.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${(ev.count / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-52 bg-gray-100 rounded-2xl" />
        <div className="h-52 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}

function AnalyticsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <p className="text-sm text-red-500">{message}</p>
      <button
        onClick={onRetry}
        className="text-xs text-blue-600 hover:underline focus:outline-none"
      >
        Retry
      </button>
    </div>
  );
}
