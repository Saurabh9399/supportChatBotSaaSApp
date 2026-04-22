import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Strip the /rest/v1 suffix if the user pasted the full REST URL.
 * The supabase-js client builds that path internally.
 */
function normalizeSupabaseUrl(url: string): string {
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

/**
 * Server-side client (service-role key — never expose to browser).
 * Bypasses Row Level Security for admin operations.
 */
export function getSupabaseAdmin() {
  const url = normalizeSupabaseUrl(requireEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Browser-safe client (anon key + RLS enforced).
 */
export function getSupabaseClient() {
  const url = normalizeSupabaseUrl(requireEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient<Database>(url, anonKey);
}
