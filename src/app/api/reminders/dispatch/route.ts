import type { Reminder } from "@/components/spaxio-app";
import { jsonError, jsonOk } from "@/lib/http";
import { sendReminderEmail, type EmailLanguage } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

const DEFAULT_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 500;

type WorkspaceStateRow = {
  user_id: string;
  state: { reminders?: unknown } | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  preferred_language: EmailLanguage | null;
};

type DispatchRow = {
  user_id: string;
  reminder_id: string;
};

function isAuthorized(request: Request) {
  const secret = process.env.REMINDER_DISPATCH_CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}` || request.headers.get("x-cron-secret") === secret;
}

function getBatchSize(request: Request) {
  const raw = new URL(request.url).searchParams.get("limit");
  const parsed = Number(raw ?? DEFAULT_BATCH_SIZE);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_BATCH_SIZE;
  return Math.min(Math.floor(parsed), MAX_BATCH_SIZE);
}

function pickDueReminders(value: unknown, nowMs: number): Reminder[] {
  if (!Array.isArray(value)) return [];
  const due: Reminder[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const candidate = raw as Partial<Reminder>;
    if (candidate.done) continue;
    if (typeof candidate.id !== "string" || !candidate.id) continue;
    if (typeof candidate.title !== "string" || !candidate.title.trim()) continue;
    if (typeof candidate.remindAt !== "string") continue;
    const ts = new Date(candidate.remindAt).getTime();
    if (!Number.isFinite(ts) || ts > nowMs) continue;
    due.push({
      id: candidate.id,
      title: candidate.title,
      trigger: typeof candidate.trigger === "string" && candidate.trigger.trim() ? candidate.trigger : "Scheduled",
      context: typeof candidate.context === "string" && candidate.context.trim() ? candidate.context : candidate.title,
      sourceMemoryId: typeof candidate.sourceMemoryId === "string" ? candidate.sourceMemoryId : undefined,
      done: false,
      remindAt: candidate.remindAt,
    });
  }
  return due;
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return jsonError("Supabase is not configured.", 500);
  if (!isAuthorized(request)) return jsonError("Unauthorized.", 401);

  const admin = createAdminClient();
  const batchSize = getBatchSize(request);
  const nowMs = Date.now();

  const { data: rows, error } = await admin
    .from("workspace_states")
    .select("user_id, state")
    .not("state->reminders", "is", null)
    .limit(batchSize)
    .returns<WorkspaceStateRow[]>();

  if (error) return jsonError(error.message, 500);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows ?? []) {
    const due = pickDueReminders(row.state?.reminders, nowMs);
    if (!due.length) continue;

    const { data: dispatchRows } = await admin
      .from("reminder_dispatches")
      .select("reminder_id")
      .eq("user_id", row.user_id)
      .in(
        "reminder_id",
        due.map((reminder) => reminder.id),
      )
      .returns<DispatchRow[]>();
    const alreadySent = new Set((dispatchRows ?? []).map((dispatch) => dispatch.reminder_id));
    const pending = due.filter((reminder) => !alreadySent.has(reminder.id));
    if (!pending.length) continue;

    const { data: profile } = await admin
      .from("profiles")
      .select("id, email, preferred_language")
      .eq("id", row.user_id)
      .maybeSingle<ProfileRow>();

    const recipient = profile?.email?.trim();
    if (!recipient) {
      skipped += pending.length;
      continue;
    }
    const language: EmailLanguage = profile?.preferred_language === "fr" ? "fr" : "en";

    for (const reminder of pending) {
      try {
        await sendReminderEmail(recipient, reminder, language);
        const { error: insertError } = await admin
          .from("reminder_dispatches")
          .insert({ user_id: row.user_id, reminder_id: reminder.id });
        if (insertError && insertError.code !== "23505") {
          failed += 1;
          continue;
        }
        sent += 1;
      } catch {
        failed += 1;
      }
    }
  }

  return jsonOk({ sent, failed, skipped, scanned: rows?.length ?? 0 });
}
