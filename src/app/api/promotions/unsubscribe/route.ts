import type { NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

function textResponse(message: string, status = 200) {
  return new Response(message, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
    status,
  });
}

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return textResponse("Promotion email preferences are not configured.", 503);
  }

  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return textResponse("Invalid unsubscribe link.", 400);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      promotion_emails_opt_out: true,
      updated_at: new Date().toISOString(),
    })
    .eq("promotion_email_token", token);

  if (error) {
    return textResponse("Could not update promotion email preferences.", 500);
  }

  return textResponse("You have been unsubscribed from Spaxio Assistant promotion emails.");
}
