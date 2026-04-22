import { getSupabaseAdmin } from "@/lib/db";
import { AI_CONFIG } from "@/config";
import { logger } from "@/lib/logger";

export interface TenantSettings {
  systemPrompt: string;
  chatbotName: string;
  welcomeMessage: string;
}

export const DEFAULT_SETTINGS: TenantSettings = {
  systemPrompt: AI_CONFIG.systemPrompt,
  chatbotName: "Support Assistant",
  welcomeMessage: "Hi! How can I help you today?",
};

/** Read settings for a tenant. Falls back to defaults if no record exists. */
export async function getTenantSettings(tenantId: string): Promise<TenantSettings> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", tenantId)
      .single();

    if (!data?.settings) return DEFAULT_SETTINGS;

    const s = data.settings as Partial<TenantSettings>;
    return {
      systemPrompt: s.systemPrompt ?? DEFAULT_SETTINGS.systemPrompt,
      chatbotName: s.chatbotName ?? DEFAULT_SETTINGS.chatbotName,
      welcomeMessage: s.welcomeMessage ?? DEFAULT_SETTINGS.welcomeMessage,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Upsert tenant settings. Creates the tenant row if it doesn't exist. */
export async function saveTenantSettings(
  tenantId: string,
  settings: Partial<TenantSettings>,
): Promise<TenantSettings> {
  const supabase = getSupabaseAdmin();

  // Merge with existing settings
  const current = await getTenantSettings(tenantId);
  const merged: TenantSettings = { ...current, ...settings };

  // Upsert — creates the row if this is the first time
  const { error } = await supabase.from("tenants").upsert(
    {
      id: tenantId,
      name: tenantId,   // placeholder name — user can update later
      slug: tenantId,
      plan: "free",
      settings: merged as unknown as Record<string, unknown>,
    },
    { onConflict: "id" },
  );

  if (error) {
    logger.error("Failed to save tenant settings", { tenantId, error: error.message });
    throw new Error(error.message);
  }

  logger.info("Tenant settings saved", { tenantId });
  return merged;
}
