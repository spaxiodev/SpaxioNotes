import type { Workspace } from "@/components/spaxio-app";
import { jsonError, jsonOk } from "@/lib/http";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type AiMode = "ask" | "capture";
type AiLanguage = "en" | "fr";

type AiRequest = {
  mode?: AiMode;
  prompt?: string;
  workspace?: Workspace;
  folderId?: string;
  currentUserId?: string;
  language?: AiLanguage;
  learnedFacts?: string[];
  userTime?: {
    localNow?: string;
    timeZone?: string;
  };
};

type AnthropicTextBlock = {
  type: "text";
  text: string;
};

type AnthropicResponse = {
  content?: Array<AnthropicTextBlock | { type: string }>;
  error?: {
    message?: string;
  };
};

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
const ANTHROPIC_VERSION = "2023-06-01";

async function getAuthenticatedUser(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return user;

  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;

  const {
    data: { user: bearerUser },
  } = await supabase.auth.getUser(token);

  return bearerUser;
}

function compactWorkspace(workspace: Workspace | undefined) {
  if (!workspace) {
    return {
      memories: [],
      tasks: [],
      reminders: [],
      calendarEvents: [],
      settings: null,
    };
  }

  return {
    settings: {
      name: workspace.settings.name,
      focusArea: workspace.settings.focusArea,
      currentUserId: workspace.settings.currentUserId,
    },
    memories: workspace.memories.slice(0, 24).map((memory) => ({
      id: memory.id,
      kind: memory.kind,
      title: memory.title,
      summary: memory.summary,
      body: memory.body.slice(0, 900),
      entities: memory.entities,
      people: memory.people,
      projects: memory.projects,
      actions: memory.actions,
      urgency: memory.urgency,
      createdAt: memory.createdAt,
      recurringEvent: memory.recurringEvent,
    })),
    tasks: workspace.tasks.slice(0, 40).map((task) => ({
      id: task.id,
      title: task.title,
      project: task.project,
      due: task.due,
      estimate: task.estimate,
      status: task.status,
    })),
    reminders: workspace.reminders.slice(0, 30).map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      trigger: reminder.trigger,
      context: reminder.context,
      done: reminder.done,
      remindAt: reminder.remindAt,
    })),
    calendarEvents: workspace.calendarEvents.slice(0, 40).map((event) => ({
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      context: event.context,
    })),
  };
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? text;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");

  if (first === -1 || last === -1 || last <= first) {
    throw new Error("Claude did not return JSON.");
  }

  return JSON.parse(candidate.slice(first, last + 1)) as unknown;
}

function systemPrompt(mode: AiMode, language: AiLanguage, learnedFacts: string[]) {
  const languageLine =
    language === "fr"
      ? "Respond in French. All user-facing strings (answer, memory.title, memory.summary, memory.body, tasks[].title, reminders[].title, reminders[].trigger, reminders[].context, calendarEvents[].title, calendarEvents[].context, learnedAboutUser[]) must be written in natural French. Keep enum-like fields (memory.kind, memory.projects category slug, recurringEvent.frequency, recurringEvent.type) and ISO 8601 timestamps (reminders[].remindAt, calendarEvents[].startsAt) in their original form so the app can index them."
      : "Respond in English.";
  const learnedFactsLine = learnedFacts.length
    ? `Known persistent facts about this user (already remembered — do not repeat them in learnedAboutUser):\n- ${learnedFacts.join("\n- ")}`
    : "No persistent facts are remembered about this user yet.";
  const learningLine =
    "After processing the prompt, infer any NEW persistent personal facts about the user — stable preferences, routines, communication style, important people, places, dietary or accessibility needs, work/school context, recurring habits. Return them as short single-line strings (under 120 characters each) in learnedAboutUser. Only include facts that will still be true in a month. Do NOT include the current task, a one-off event, or anything already listed above. If nothing new is worth remembering, return an empty array. Write each fact in the user's chosen language.";
  const captureInstructions =
    mode === "capture"
      ? [
          "For capture mode, turn the user's input into app-ready records.",
          "Split mixed input into separate captureItems. Each distinct thing the user wants to remember or do must be its own captureItem with its own memory and related records. Do not merge unrelated things into one note.",
          "Classify each memory into a clear user-facing category by setting memory.projects. Put the best category first. Grocery lists must use projects ['Groceries']; food or meal ideas use ['Meals']; bills and budgets use ['Finances']; school notes use the class or ['School']; work/client notes use the project or ['Work']; personal reminders use ['Personal'].",
          "For list-style captures such as groceries, keep the list items in memory.body and use a concise category title like 'Grocery list'.",
          "For example, if the user says they have a dentist appointment tomorrow at 12pm and need to buy flowers, create one captureItem for the dentist appointment with a memory, reminder, and calendarEvents entry, and another captureItem for buying flowers with a memory and reminder. Do not create one combined memory for both.",
          "Create calendarEvents only for the captureItem that contains the dated or timed item.",
          "ALWAYS create a calendarEvents entry whenever a captureItem references any day or timeline — including 'today', 'tomorrow', 'tonight', a day of the week ('Friday'), a relative phrase ('next week', 'in two days', 'this weekend'), a specific date, or a clock time. Appointments, meetings, deadlines, trips, classes, and events all qualify.",
          "Resolve relative dates against the provided userTime.localNow timestamp and userTime.timeZone. Treat all user-stated clock times as local wall-clock times in that timezone.",
          "Emit calendarEvents.startsAt as a full ISO 8601 string with the user's local UTC offset, not as a UTC Z timestamp, unless the user explicitly gave a UTC time. Example: if userTime.localNow has -04:00 and the user says 'tomorrow at 5am', emit tomorrow's date at 05:00:00.000-04:00, not 05:00:00.000Z.",
          "If the user gives a day but no time, default startsAt to 09:00 in their local context and note the assumption in calendarEvents.context.",
          "Also create tasks and reminders inside each captureItem when they add value, but the calendarEvents entry is mandatory for any captureItem with a day or timeline.",
          "If the user states a yearly personal date such as a birthday or anniversary, include memory.recurringEvent with frequency 'yearly', the event name, type, month, day, and nextDate resolved from today. Example: 'our anniversary is tomorrow' means save a yearly anniversary for tomorrow's month/day.",
          "For 'I have to buy flowers for my girlfriend tomorrow because it is our anniversary', create one captureItem for buying flowers tomorrow and another captureItem that saves the anniversary as a yearly recurringEvent named Anniversary.",
          "If the user mentions a recurring monthly subscription or bill, include memory.recurringEvent with frequency 'monthly', type 'subscription', name, dayOfMonth when known, and nextDate when known.",
          "Recurring yearly/monthly events should remain as named memory records, even when the immediate task is a one-time action.",
          "Use due labels like Today, Tomorrow, Friday, Next Wednesday, or This week for tasks.",
          "When the user asks to be reminded at a specific time ('remind me at 5pm', 'remind me tomorrow morning', 'remind me in 2 hours', 'remind me next Monday'), set reminders[].remindAt to a full ISO 8601 timestamp resolved against userTime.localNow and userTime.timeZone, using the user's local UTC offset (e.g. -04:00) rather than a Z timestamp unless the user explicitly stated UTC.",
          "If the user mentions a day but no clock time for the reminder, default remindAt to 09:00 in their local context.",
          "Set reminders[].trigger to a short natural-language label that matches the resolved remindAt (e.g. 'Today at 5:00 PM', 'Tomorrow at 9:00 AM', 'Friday at 3:00 PM'). Omit remindAt when the reminder is purely contextual and not tied to a clock time.",
        ].join(" ")
      : "For ask mode, answer the user's question from the workspace. Do not create records unless the user explicitly asks to add something.";

  return [
    "You are the workspace intelligence layer for Spaxio Assistant, a memory, task, reminder, and calendar app.",
    "Use the provided workspace JSON as the source of truth.",
    "Return JSON only. No markdown, no prose outside JSON.",
    languageLine,
    learnedFactsLine,
    learningLine,
    captureInstructions,
    "Response schema:",
    JSON.stringify({
      answer: "Short user-facing answer.",
      learnedAboutUser: ["New persistent fact about the user inferred from this prompt"],
      memory: {
        kind: "note | document | deadline | voice | link | image",
        title: "Concise title",
        body: "Cleaned original note",
        summary: "One sentence summary",
        entities: ["Important concepts"],
        people: ["People"],
        projects: ["Projects"],
        actions: ["Action items"],
        urgency: 1,
        confidence: 90,
        recurringEvent: {
          name: "Anniversary, birthday, subscription, or custom event name",
          frequency: "yearly | monthly",
          type: "anniversary | birthday | subscription | custom",
          month: 5,
          day: 25,
          dayOfMonth: 25,
          nextDate: "2026-05-25T09:00:00.000Z",
        },
      },
      tasks: [{ title: "Task", project: "Project", estimate: 30, due: "Today" }],
      reminders: [{ title: "Reminder", trigger: "When to remind", context: "Why it matters", remindAt: "2026-05-25T17:00:00.000-04:00" }],
      calendarEvents: [{ title: "Calendar item", startsAt: "2026-05-21T13:00:00.000Z", context: "Reason" }],
      captureItems: [
        {
          memory: {
            kind: "note | document | deadline | voice | link | image",
            title: "One distinct thing",
            body: "Only this item's content",
            summary: "One sentence summary",
            entities: ["Important concepts"],
            people: ["People"],
            projects: ["Projects"],
            actions: ["Action items"],
            urgency: 1,
            confidence: 90,
            recurringEvent: {
              name: "Named yearly or monthly item",
              frequency: "yearly | monthly",
              type: "anniversary | birthday | subscription | custom",
              month: 5,
              day: 25,
              dayOfMonth: 25,
              nextDate: "2026-05-25T09:00:00.000Z",
            },
          },
          tasks: [{ title: "Task", project: "Project", estimate: 30, due: "Today" }],
          reminders: [{ title: "Reminder", trigger: "When to remind", context: "Why it matters", remindAt: "2026-05-25T17:00:00.000-04:00" }],
          calendarEvents: [{ title: "Calendar item", startsAt: "2026-05-21T13:00:00.000Z", context: "Reason" }],
        },
      ],
      query: "Optional search phrase for the app",
    }),
    "In capture mode, prefer captureItems. Include top-level memory/tasks/reminders/calendarEvents only for backward compatibility when there is exactly one item. Omit properties that do not apply. Keep arrays short and useful.",
  ].join("\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonError("AI is not configured.", 503);
  }

  if (hasSupabaseEnv()) {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }
  }

  let body: AiRequest;
  try {
    body = (await request.json()) as AiRequest;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const mode = body.mode === "capture" ? "capture" : "ask";
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return jsonError("Prompt is required.", 400);
  }

  if (prompt.length > 8000) {
    return jsonError("Prompt is too long.", 413);
  }

  const workspace = compactWorkspace(body.workspace);
  const language: AiLanguage = body.language === "fr" ? "fr" : "en";
  const learnedFacts = Array.isArray(body.learnedFacts)
    ? body.learnedFacts
        .filter((fact): fact is string => typeof fact === "string" && fact.trim().length > 0)
        .map((fact) => fact.trim().slice(0, 200))
        .slice(0, 60)
    : [];
  const fallbackNow = new Date().toISOString();
  const userTime = {
    localNow:
      typeof body.userTime?.localNow === "string" && !Number.isNaN(new Date(body.userTime.localNow).getTime())
        ? body.userTime.localNow
        : fallbackNow,
    timeZone: typeof body.userTime?.timeZone === "string" && body.userTime.timeZone.trim() ? body.userTime.timeZone.trim() : "UTC",
  };

  let anthropicResponse: Response;
  try {
    anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: mode === "capture" ? 2400 : 900,
        system: systemPrompt(mode, language, learnedFacts),
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              today: userTime.localNow,
              userTime,
              mode,
              language,
              learnedFacts,
              prompt,
              folderId: body.folderId,
              currentUserId: body.currentUserId,
              workspace,
            }),
          },
        ],
      }),
    });
  } catch {
    return jsonError("AI request failed.", 502);
  }

  let data: AnthropicResponse;
  try {
    data = (await anthropicResponse.json()) as AnthropicResponse;
  } catch {
    return jsonError("AI returned an invalid response.", 502);
  }

  if (!anthropicResponse.ok) return jsonError("AI request failed.", anthropicResponse.status);

  const text = data.content?.find((block): block is AnthropicTextBlock => block.type === "text")?.text;
  if (!text) {
    return jsonError("AI returned an empty response.", 502);
  }

  try {
    return jsonOk(extractJson(text));
  } catch {
    return jsonError("Could not parse AI response.", 502);
  }
}
