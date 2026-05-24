import type { Reminder } from "@/components/spaxio-app";
import { jsonError, jsonOk } from "@/lib/http";
import { sendReminderEmail, type EmailLanguage } from "@/lib/mail";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type ReminderEmailRequest = {
  recipient?: string;
  reminder?: Partial<Reminder>;
};

export const runtime = "nodejs";

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function parseReminder(value: ReminderEmailRequest["reminder"]): Reminder | null {
  const title = cleanString(value?.title, 160);
  const trigger = cleanString(value?.trigger, 220);
  const context = cleanString(value?.context, 1200);

  if (!title || !trigger || !context) return null;

  return {
    id: cleanString(value?.id, 80) || "reminder",
    title,
    trigger,
    context,
    sourceMemoryId: cleanString(value?.sourceMemoryId, 80) || undefined,
    done: Boolean(value?.done),
  };
}

export async function POST(request: Request) {
  let body: ReminderEmailRequest;

  try {
    body = (await request.json()) as ReminderEmailRequest;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const reminder = parseReminder(body.reminder);
  if (!reminder) {
    return jsonError("Reminder title, trigger, and context are required.", 400);
  }

  let recipient = cleanString(body.recipient, 320);
  let language: EmailLanguage = "en";

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    recipient = user.email ?? "";

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .maybeSingle<{ preferred_language: EmailLanguage | null }>();

    if (profile?.preferred_language === "fr") language = "fr";
  }

  if (!recipient) {
    return jsonError("A recipient email is required.", 400);
  }

  try {
    await sendReminderEmail(recipient, reminder, language);
  } catch (error) {
    const message = error instanceof Error && error.message === "SMTP is not configured." ? error.message : "Could not send reminder email.";
    return jsonError(message, 502);
  }

  return jsonOk({ sent: true });
}
