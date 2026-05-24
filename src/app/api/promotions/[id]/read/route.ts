import type { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/http";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured.", 500);
  }

  const { id } = await ctx.params;
  if (!id) {
    return jsonError("Missing promotion id.", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized.", 401);
  }

  const { error } = await supabase.from("promotion_reads").upsert({
    promotion_id: id,
    user_id: user.id,
    read_at: new Date().toISOString(),
  });

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonOk({ ok: true });
}
