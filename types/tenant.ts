export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export type TenantPlan = "free" | "starter" | "pro" | "enterprise";

export interface TenantSettings {
  brandColor: string;
  logoUrl?: string;
  chatbotName: string;
  welcomeMessage: string;
  maxMessagesPerSession: number;
  allowedDomains: string[];
  aiModelId?: string;
}

export interface TenantContext {
  tenantId: string;
  tenantSlug?: string;
}
