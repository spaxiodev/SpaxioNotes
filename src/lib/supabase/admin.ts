import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceEnv } from "./env";

export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServiceEnv();

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
