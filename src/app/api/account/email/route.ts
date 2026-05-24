import { jsonError, jsonOk } from "@/lib/http";
import { getRequestOrigin } from "@/lib/url";
import { createClient } from "@/lib/supabase/server";

type UpdateEmailRequest = {
  email?: string;
};

function cleanEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function PATCH(request: Request) {
  let body: UpdateEmailRequest;
  try {
    body = (await request.json()) as UpdateEmailRequest;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const email = cleanEmail(body.email);
  if (!email || !email.includes("@")) {
    return jsonError("Enter a valid email address.", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return jsonError("Unauthorized.", 401);
  if (user.email?.toLowerCase() === email) return jsonOk({ message: "That email is already on this account." });

  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.updateUser(
    { email },
    {
      emailRedirectTo: `${origin}/auth/confirm?next=/app`,
    },
  );

  if (error) {
    return jsonError("Could not start email change.", 500);
  }

  return jsonOk({ message: "Check both email addresses to confirm the change." });
}
