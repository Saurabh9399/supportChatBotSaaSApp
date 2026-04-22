import { auth } from "@clerk/nextjs/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KnowledgeBase } from "@/modules/documents/components/KnowledgeBase";

export const metadata = { title: "Knowledge Base" };

export default async function DocumentsPage() {
  const { orgId } = await auth();
  const tenantId = orgId ?? "demo-tenant-001";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload documents that your AI chatbot will use to answer questions.
          </p>
        </div>
        <KnowledgeBase tenantId={tenantId} />
      </div>
    </DashboardLayout>
  );
}
