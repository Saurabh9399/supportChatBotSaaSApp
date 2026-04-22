import { auth } from "@clerk/nextjs/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getTenantSettings } from "@/modules/settings/services/settings.service";
import { SettingsForm } from "@/modules/settings/components/SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { orgId } = await auth();
  const tenantId = orgId ?? "demo-tenant-001";

  const settings = await getTenantSettings(tenantId).catch(() => null);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Customise how your AI chatbot behaves for{" "}
            <span className="font-mono text-blue-600 text-xs">{tenantId}</span>
          </p>
        </div>

        <SettingsForm tenantId={tenantId} initialSettings={settings} />
      </div>
    </DashboardLayout>
  );
}
