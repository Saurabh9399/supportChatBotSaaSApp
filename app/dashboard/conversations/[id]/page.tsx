import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getConversationMessages } from "@/modules/dashboard/services/dashboard.service";
import { ResolveButton } from "@/modules/conversations/components/ResolveButton";
import { ArrowLeft, User, Bot, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function ConversationDetailPage({ params }: PageProps) {
  const { orgId } = await auth();
  const tenantId = orgId ?? "demo-tenant-001";

  const { session, messages } = await getConversationMessages(params.id, tenantId).catch(() => ({
    session: null,
    messages: [],
  }));

  if (!session) notFound();

  const userMessages = messages.filter((m) => m.role === "user").length;
  const aiMessages = messages.filter((m) => m.role === "assistant").length;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">

        {/* Back + header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/conversations"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Conversation</h1>
            <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5 font-mono truncate">
              {session.id}
            </p>
          </div>
          <ResolveButton
            sessionId={session.id}
            tenantId={tenantId}
            currentStatus={session.status}
          />
        </div>

        {/* Session meta — responsive 2→4 col */}
        <Card>
          <CardBody className="p-4 sm:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Status</p>
                <Badge
                  variant={
                    session.status === "resolved" ? "success"
                    : session.status === "active" ? "warning"
                    : "default"
                  }
                >
                  {session.status}
                </Badge>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Visitor</p>
                <p className="text-xs sm:text-sm font-mono text-gray-700 truncate">
                  {session.visitorId.slice(0, 10)}…
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Messages</p>
                <p className="text-sm font-semibold text-gray-900">
                  {session.messageCount}
                  <span className="text-[10px] text-gray-400 font-normal ml-1 hidden sm:inline">
                    ({userMessages}u · {aiMessages}ai)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Started</p>
                <p className="text-xs sm:text-sm text-gray-700">{formatTime(session.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Last activity</p>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-gray-700">{formatRelative(session.updatedAt)}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Message thread */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">
              Message Thread
              <span className="ml-1.5 text-gray-400 font-normal">({messages.length})</span>
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            {messages.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                No messages in this session.
              </div>
            ) : (
              <div className="px-3 sm:px-4 py-4 space-y-3 sm:space-y-4">
                {messages.map((msg, idx) => {
                  if (msg.role === "system") return null;
                  const isUser = msg.role === "user";

                  return (
                    <div
                      key={msg.id ?? idx}
                      className={cn("flex gap-2 sm:gap-3", isUser ? "flex-row-reverse" : "flex-row")}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          "flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-sm mt-0.5",
                          isUser
                            ? "bg-gradient-to-br from-gray-500 to-gray-700"
                            : "bg-gradient-to-br from-blue-500 to-indigo-600",
                        )}
                      >
                        {isUser
                          ? <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                          : <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />}
                      </div>

                      {/* Bubble */}
                      <div
                        className={cn(
                          "flex flex-col gap-1 max-w-[80%] sm:max-w-[78%]",
                          isUser ? "items-end" : "items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                            isUser
                              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm"
                              : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm",
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 px-1">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
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
