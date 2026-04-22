import { auth } from "@clerk/nextjs/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnalyticsDashboard } from "@/modules/analytics/components/AnalyticsDashboard";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const { orgId } = await auth();
  const tenantId = orgId ?? "demo-tenant-001";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Last 30 days · Tenant: {tenantId}</p>
        </div>
        <AnalyticsDashboard tenantId={tenantId} />
      </div>
    </DashboardLayout>
  );
}
