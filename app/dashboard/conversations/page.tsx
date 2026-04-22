import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getAllConversations } from "@/modules/dashboard/services/dashboard.service";
import { MessageSquare, ChevronRight, Clock } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversations" };

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function ConversationsPage() {
  const { orgId } = await auth();
  const tenantId = orgId ?? "demo-tenant-001";

  const conversations = await getAllConversations(tenantId, 50).catch(() => []);

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Conversations</h1>
          <p className="text-gray-500 text-sm mt-1">
            {conversations.length} total ·{" "}
            <span className="font-mono text-blue-600 text-xs">{tenantId}</span>
          </p>
        </div>

        {/* List */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">All Sessions</h2>
          </CardHeader>
          <CardBody className="p-0">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">No conversations yet</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  Chat sessions will appear here once visitors start using your support widget.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {conversations.map((conv) => {
                  const initials = conv.visitorId.slice(0, 2).toUpperCase();
                  return (
                    <Link
                      key={conv.id}
                      href={`/dashboard/conversations/${conv.id}`}
                      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white text-xs font-bold">{initials}</span>
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="text-xs font-mono text-gray-500 truncate max-w-[120px] sm:max-w-none">
                            {conv.visitorId.slice(0, 12)}…
                          </span>
                          <Badge
                            variant={
                              conv.status === "resolved" ? "success"
                              : conv.status === "active" ? "warning"
                              : "default"
                            }
                          >
                            {conv.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 truncate">{conv.preview}</p>
                      </div>

                      {/* Meta — hidden on very small screens, shown sm+ */}
                      <div className="hidden xs:flex flex-shrink-0 flex-col items-end gap-1 text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatRelative(conv.createdAt)}
                        </div>
                        <span className="text-xs text-gray-400">
                          {conv.messageCount} msg{conv.messageCount !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
