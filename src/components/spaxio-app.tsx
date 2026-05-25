"use client";

import {
  AlarmClock,
  Archive,
  Bell,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  CreditCard,
  FileText,
  Filter,
  FolderKanban,
  Gift,
  ImageIcon,
  LayoutDashboard,
  Link,
  ListChecks,
  Mail,
  Mic2,
  Paperclip,
  Pencil,
  Plus,
  Send,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { ChangeEvent, ElementType, FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/client";
import { readJsonResponse } from "@/lib/client-response";

type View = "dashboard" | "memory" | "planner" | "calendar" | "collaboration" | "reminders" | "billing" | "settings";
type Language = "en" | "fr";
export type MemoryKind = "note" | "document" | "deadline" | "voice" | "link" | "image";
type TaskStatus = "todo" | "done";
type Energy = "low" | "steady" | "high";
type NotificationKind = "note" | "calendar" | "share";
type CalendarMode = "day" | "week" | "month" | "year";
type BillingInterval = "monthly" | "yearly";
type ReminderEmailStatus = { reminderId: string; state: "sending" | "sent" | "error"; message: string } | null;
type AccountEmailStatus = { state: "idle" | "saving" | "sent" | "error"; message: string };
type SpeechRecognitionEventLike = {
  resultIndex?: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
};
type SpeechRecognitionErrorEventLike = {
  error?: string;
};
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

let currentSpeechAudio: HTMLAudioElement | null = null;
let currentSpeechUrl: string | null = null;

export type Memory = {
  id: string;
  kind: MemoryKind;
  title: string;
  body: string;
  summary: string;
  source: string;
  createdAt: string;
  entities: string[];
  people: string[];
  projects: string[];
  actions: string[];
  urgency: number;
  confidence: number;
  folderId?: string;
  authorId?: string;
  filePath?: string;
  recurringEvent?: RecurringEvent;
};

export type RecurringEvent = {
  id: string;
  name: string;
  frequency: "yearly" | "monthly";
  type: "anniversary" | "birthday" | "subscription" | "custom";
  month?: number;
  day?: number;
  dayOfMonth?: number;
  nextDate?: string;
};

export type Task = {
  id: string;
  title: string;
  project: string;
  estimate: number;
  due: string;
  status: TaskStatus;
  sourceMemoryId?: string;
};

export type Reminder = {
  id: string;
  title: string;
  trigger: string;
  context: string;
  sourceMemoryId?: string;
  done: boolean;
  remindAt?: string;
};

export type SettingsState = {
  name: string;
  focusArea: string;
  calendarConnected: boolean;
  voiceCapture: boolean;
  aiMode: "local" | "api-ready";
  currentUserId: string;
  language: Language;
  learnedFacts: string[];
};

const MAX_LEARNED_FACTS = 50;

export type Collaborator = {
  id: string;
  name: string;
  email: string;
  color: string;
};

export type SharedFolder = {
  id: string;
  name: string;
  description: string;
  collaboratorIds: string[];
  createdBy: string;
  updatedAt: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  folderId: string;
  createdBy: string;
  context: string;
  sourceMemoryId?: string;
  sourceTaskId?: string;
};

export type WorkspaceNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  actorId: string;
  recipientIds: string[];
  folderId?: string;
  memoryId?: string;
  calendarEventId?: string;
  createdAt: string;
  readBy: string[];
};

export type Workspace = {
  memories: Memory[];
  tasks: Task[];
  reminders: Reminder[];
  collaborators: Collaborator[];
  sharedFolders: SharedFolder[];
  calendarEvents: CalendarEvent[];
  notifications: WorkspaceNotification[];
  settings: SettingsState;
};

export type Promotion = {
  id: string;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  createdAt: string;
  isRead: boolean;
};

type AiRecurringEventPlan = Partial<Omit<RecurringEvent, "id">>;
type AiMemoryPlan = Partial<Pick<Memory, "kind" | "title" | "body" | "summary" | "entities" | "people" | "projects" | "actions" | "urgency" | "confidence">> & {
  recurringEvent?: AiRecurringEventPlan;
};
type AiTaskPlan = Partial<Pick<Task, "title" | "project" | "estimate" | "due">>;
type AiReminderPlan = Partial<Pick<Reminder, "title" | "trigger" | "context" | "remindAt">>;
type AiCalendarEventPlan = Partial<Pick<CalendarEvent, "title" | "startsAt" | "context">>;
type AiCaptureItemPlan = {
  memory?: AiMemoryPlan;
  tasks?: AiTaskPlan[];
  reminders?: AiReminderPlan[];
  calendarEvents?: AiCalendarEventPlan[];
};

type AiWorkspacePlan = {
  answer?: string;
  memory?: AiMemoryPlan;
  tasks?: AiTaskPlan[];
  reminders?: AiReminderPlan[];
  calendarEvents?: AiCalendarEventPlan[];
  captureItems?: AiCaptureItemPlan[];
  learnedAboutUser?: string[];
  query?: string;
  error?: string;
};

const STORAGE_KEY = "spaxio.workspace.v1";
const OWNER_ID = "u-stefano";
const DEFAULT_FOLDER_ID = "folder-core";
const DEMO_USER_IDS = new Set(["u-maya", "u-luca"]);
const MAX_UPLOAD_FILES = 5;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type StoredWorkspace = {
  persistedAt?: string;
  workspace?: Partial<Workspace>;
};

const defaultCollaborators: Collaborator[] = [
  { id: OWNER_ID, name: "Stefano", email: "stefano@spaxio.local", color: "bg-zinc-950 text-white" },
];

const stopWords = new Set([
  "about",
  "after",
  "also",
  "before",
  "class",
  "from",
  "have",
  "need",
  "notes",
  "that",
  "this",
  "today",
  "tomorrow",
  "with",
  "work",
  "week",
  "will",
]);

const kindMeta: Record<MemoryKind, { icon: ElementType; label: string; className: string }> = {
  note: { icon: FileText, label: "Note", className: "border-zinc-200 bg-white text-zinc-700" },
  document: { icon: Paperclip, label: "Document", className: "border-sky-200 bg-sky-50 text-sky-800" },
  deadline: { icon: CalendarDays, label: "Deadline", className: "border-rose-200 bg-rose-50 text-rose-800" },
  voice: { icon: Mic2, label: "Voice", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  link: { icon: Link, label: "Link", className: "border-violet-200 bg-violet-50 text-violet-800" },
  image: { icon: ImageIcon, label: "Image", className: "border-amber-200 bg-amber-50 text-amber-900" },
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const navItems: Array<{ id: View; label: string; icon: ElementType }> = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "memory", label: "Memory", icon: Sparkles },
  { id: "planner", label: "Plan", icon: ListChecks },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "collaboration", label: "Shared", icon: Users },
  { id: "reminders", label: "Reminders", icon: AlarmClock },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

const viewMeta: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: "Home", subtitle: "Capture context, check priorities, and jump into the work." },
  memory: { title: "Memory", subtitle: "Browse captured notes, documents, links, and people." },
  planner: { title: "Plan", subtitle: "Tune energy and time, then work the next useful block." },
  calendar: { title: "Calendar", subtitle: "Review scheduled work and add shared events." },
  collaboration: { title: "Shared", subtitle: "Work inside folders with notes, events, invites, and updates." },
  reminders: { title: "Reminders", subtitle: "Track follow-ups from deadlines, classes, and plans." },
  billing: { title: "Billing", subtitle: "Manage your plan, Stripe portal, and account lifecycle." },
  settings: { title: "Settings", subtitle: "Update your profile and workspace preferences." },
};

const navLabels: Record<Language, Record<View, string>> = {
  en: {
    dashboard: "Home",
    memory: "Memory",
    planner: "Plan",
    calendar: "Calendar",
    collaboration: "Shared",
    reminders: "Reminders",
    billing: "Billing",
    settings: "Settings",
  },
  fr: {
    dashboard: "Accueil",
    memory: "Memoire",
    planner: "Plan",
    calendar: "Calendrier",
    collaboration: "Partage",
    reminders: "Rappels",
    billing: "Facturation",
    settings: "Parametres",
  },
};

const localizedViewMeta: Record<Language, Record<View, { title: string; subtitle: string }>> = {
  en: viewMeta,
  fr: {
    dashboard: { title: "Accueil", subtitle: "Capturez le contexte, verifiez les priorites et reprenez le travail." },
    memory: { title: "Memoire", subtitle: "Parcourez les notes, documents, liens et personnes captures." },
    planner: { title: "Plan", subtitle: "Ajustez l'energie et le temps, puis lancez le prochain bloc utile." },
    calendar: { title: "Calendrier", subtitle: "Revisez le travail planifie et ajoutez des evenements partages." },
    collaboration: { title: "Partage", subtitle: "Travaillez dans des dossiers avec notes, evenements, invitations et mises a jour." },
    reminders: { title: "Rappels", subtitle: "Suivez les relances provenant des echeances, cours et plans." },
    billing: { title: "Facturation", subtitle: "Gerez votre forfait, le portail Stripe et le cycle de vie du compte." },
    settings: { title: "Parametres", subtitle: "Mettez a jour votre profil et vos preferences d'espace de travail." },
  },
};

const initialWorkspace: Workspace = {
  memories: [
    {
      id: "m-1",
      kind: "document",
      title: "Accounting midterm slides",
      body: "Chapter 6 variance analysis, contribution margin, flexible budgets, and practice problems from Professor Neri. Midterm is next Wednesday.",
      summary: "Accounting midterm material with a deadline and several weak concepts to practice.",
      source: "PDF upload",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      entities: ["Accounting", "Midterm", "Variance Analysis", "Flexible Budgets", "Study Mode"],
      people: ["Professor Neri"],
      projects: ["Accounting"],
      actions: ["Review variance analysis", "Create practice quiz", "Schedule midterm prep"],
      urgency: 5,
      confidence: 94,
      folderId: DEFAULT_FOLDER_ID,
      authorId: OWNER_ID,
    },
    {
      id: "m-2",
      kind: "deadline",
      title: "Operations management exam",
      body: "Operations management exam is next Thursday. Topics include process flow, bottlenecks, Little's Law, capacity, and forecasting.",
      summary: "Upcoming operations exam with topics that should become a study timeline.",
      source: "Typed dump",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      entities: ["Operations", "Exam", "Bottlenecks", "Capacity", "Forecasting"],
      people: [],
      projects: ["Operations"],
      actions: ["Build study timeline", "Quiz bottlenecks", "Practice forecasting"],
      urgency: 5,
      confidence: 92,
      folderId: DEFAULT_FOLDER_ID,
      authorId: OWNER_ID,
    },
    {
      id: "m-3",
      kind: "voice",
      title: "Spaxio Assistant landing page plan",
      body: "Finish the Spaxio Assistant hero copy, pricing section, testimonials, and mobile polish before Friday client check-in.",
      summary: "Client project work with a Friday milestone and specific landing page sections.",
      source: "Voice note",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      entities: ["Spaxio Assistant", "Landing Page", "Pricing", "Testimonials", "Friday"],
      people: ["Client"],
      projects: ["Spaxio Assistant"],
      actions: ["Finish hero copy", "Polish mobile section", "Prepare client check-in"],
      urgency: 4,
      confidence: 90,
      folderId: DEFAULT_FOLDER_ID,
      authorId: OWNER_ID,
    },
  ],
  tasks: [
    {
      id: "t-1",
      title: "Review variance analysis practice problems",
      project: "Accounting",
      estimate: 45,
      due: "Wednesday",
      status: "todo",
      sourceMemoryId: "m-1",
    },
    {
      id: "t-2",
      title: "Build operations exam study timeline",
      project: "Operations",
      estimate: 30,
      due: "Thursday",
      status: "todo",
      sourceMemoryId: "m-2",
    },
    {
      id: "t-3",
      title: "Polish Spaxio Assistant mobile landing page",
      project: "Spaxio Assistant",
      estimate: 60,
      due: "Friday",
      status: "todo",
      sourceMemoryId: "m-3",
    },
  ],
  reminders: [
    {
      id: "r-1",
      title: "Start accounting review",
      trigger: "If no study session is logged by Wednesday morning",
      context: "Midterm slides and variance analysis are linked.",
      sourceMemoryId: "m-1",
      done: false,
    },
    {
      id: "r-2",
      title: "Prepare Spaxio Assistant check-in",
      trigger: "Before Friday client meeting",
      context: "Landing page hero, pricing, testimonials, and mobile polish.",
      sourceMemoryId: "m-3",
      done: false,
    },
  ],
  collaborators: defaultCollaborators,
  sharedFolders: [
    {
      id: DEFAULT_FOLDER_ID,
      name: "School and client sprint",
      description: "Shared notes, study work, client planning, and calendar items for the current week.",
      collaboratorIds: [OWNER_ID],
      createdBy: OWNER_ID,
      updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ],
  calendarEvents: [
    {
      id: "cal-1",
      title: "Accounting review session",
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      folderId: DEFAULT_FOLDER_ID,
      createdBy: OWNER_ID,
      context: "Shared prep block generated from the accounting midterm notes.",
    },
  ],
  notifications: [],
  settings: {
    name: "Stefano",
    focusArea: "school, client work, and creative projects",
    calendarConnected: false,
    voiceCapture: true,
    aiMode: "local",
    currentUserId: OWNER_ID,
    language: "en",
    learnedFacts: [],
  },
};

function uid(prefix: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeWorkspace(value: Partial<Workspace>): Workspace {
  const collaborators = (value.collaborators?.length ? value.collaborators : initialWorkspace.collaborators).filter(
    (collaborator) => !DEMO_USER_IDS.has(collaborator.id),
  );
  const currentUserId =
    value.settings?.currentUserId && collaborators.some((collaborator) => collaborator.id === value.settings?.currentUserId)
      ? value.settings.currentUserId
      : collaborators[0]?.id ?? OWNER_ID;
  const memories = (value.memories ?? initialWorkspace.memories).map((memory) => ({
    ...memory,
    authorId: memory.authorId && DEMO_USER_IDS.has(memory.authorId) ? currentUserId : memory.authorId,
  }));
  const sharedFolders = (value.sharedFolders?.length ? value.sharedFolders : initialWorkspace.sharedFolders).map((folder) => ({
    ...folder,
    collaboratorIds: folder.collaboratorIds.filter((id) => !DEMO_USER_IDS.has(id)),
    createdBy: DEMO_USER_IDS.has(folder.createdBy) ? currentUserId : folder.createdBy,
  }));
  const calendarEvents = (value.calendarEvents ?? initialWorkspace.calendarEvents).map((event) => ({
    ...event,
    createdBy: DEMO_USER_IDS.has(event.createdBy) ? currentUserId : event.createdBy,
  }));
  const notifications = (value.notifications ?? initialWorkspace.notifications).filter(
    (notification) =>
      !DEMO_USER_IDS.has(notification.actorId) && notification.recipientIds.every((recipientId) => !DEMO_USER_IDS.has(recipientId)),
  );

  return {
    ...initialWorkspace,
    ...value,
    memories,
    tasks: value.tasks ?? initialWorkspace.tasks,
    reminders: value.reminders ?? initialWorkspace.reminders,
    collaborators,
    sharedFolders,
    calendarEvents,
    notifications,
    settings: {
      ...initialWorkspace.settings,
      ...value.settings,
      currentUserId,
    },
  };
}

function parseStoredWorkspace(raw: string | null): { persistedAt?: string; workspace: Partial<Workspace> } | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<Workspace> | StoredWorkspace;
    if (parsed && typeof parsed === "object" && "workspace" in parsed) {
      return {
        persistedAt: typeof parsed.persistedAt === "string" ? parsed.persistedAt : undefined,
        workspace: parsed.workspace ?? {},
      };
    }
    return { workspace: parsed as Partial<Workspace> };
  } catch {
    return null;
  }
}

function workspaceStorageKey(userId: string | undefined) {
  return userId ? `${STORAGE_KEY}.${userId}` : STORAGE_KEY;
}

function readCachedWorkspace(userId: string | undefined) {
  if (typeof window === "undefined") return null;
  return parseStoredWorkspace(window.localStorage.getItem(workspaceStorageKey(userId)));
}

function writeCachedWorkspace(workspace: Workspace, userId: string | undefined) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(workspaceStorageKey(userId), JSON.stringify({ persistedAt: new Date().toISOString(), workspace }));
}

function isNewerTimestamp(candidate: string | undefined, baseline: string | undefined) {
  if (!candidate) return false;
  if (!baseline) return true;

  const candidateTime = new Date(candidate).getTime();
  const baselineTime = new Date(baseline).getTime();
  return Number.isFinite(candidateTime) && Number.isFinite(baselineTime) && candidateTime > baselineTime;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function readableCategory(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(titleCase)
    .join(" ");
}

function memoryCategory(memory: Pick<Memory, "projects" | "entities" | "kind">) {
  return memory.projects.find((project) => project.trim()) ?? memory.entities.find((entity) => entity.trim()) ?? kindMeta[memory.kind].label;
}

function groupedMemories(memories: Memory[]) {
  const groups = new Map<string, Memory[]>();

  for (const memory of memories) {
    const category = readableCategory(memoryCategory(memory)) || "Inbox";
    groups.set(category, [...(groups.get(category) ?? []), memory]);
  }

  return Array.from(groups.entries()).sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB));
}

function formatDate(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatAbsoluteDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatReminderTriggerLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today at ${time}`;
  return `${date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} at ${time}`;
}

function formatRecurringEvent(event: RecurringEvent) {
  if (event.frequency === "yearly" && event.month && event.day) {
    const date = new Date(2026, event.month - 1, event.day);
    return `Yearly on ${date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`;
  }

  if (event.frequency === "monthly" && event.dayOfMonth) {
    return `Monthly on day ${event.dayOfMonth}`;
  }

  if (event.nextDate) return `${titleCase(event.frequency)} from ${formatAbsoluteDate(event.nextDate)}`;
  return titleCase(event.frequency);
}

function calendarDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function padDatePart(value: number) {
  return value.toString().padStart(2, "0");
}

function toDateTimeLocalValue(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

function toLocalIsoString(date: Date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = Math.floor(absoluteOffset / 60);
  const offsetRemainderMinutes = absoluteOffset % 60;

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}.${date.getMilliseconds().toString().padStart(3, "0")}${offsetSign}${padDatePart(offsetHours)}:${padDatePart(offsetRemainderMinutes)}`;
}

function userTimeContext() {
  return {
    localNow: toLocalIsoString(new Date()),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function userClockTimes(content: string) {
  const matches = Array.from(
    content.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b|\b([01]?\d|2[0-3]):([0-5]\d)\b/gi),
  );

  return matches
    .map((match) => {
      if (match[1] && match[3]) {
        const period = match[3].toLowerCase()[0];
        const rawHour = Number(match[1]);
        if (rawHour < 1 || rawHour > 12) return undefined;
        const hour = period === "p" && rawHour !== 12 ? rawHour + 12 : period === "a" && rawHour === 12 ? 0 : rawHour;
        return { hour, minute: Number(match[2] ?? 0) };
      }

      return { hour: Number(match[4]), minute: Number(match[5]) };
    })
    .filter((time): time is { hour: number; minute: number } => Boolean(time));
}

function normalizeAiCalendarStart(startsAt: string, sourceText: string) {
  if (/\b(?:utc|gmt|zulu)\b/i.test(sourceText) || !/[zZ]$/.test(startsAt)) return startsAt;

  const isoParts = startsAt.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?[zZ]$/);
  if (!isoParts) return startsAt;

  const [, year, month, day, hour, minute, second = "0", millisecond = "0"] = isoParts;
  const clockTimes = userClockTimes(sourceText);
  const hasMatchingClockTime = clockTimes.some((time) => time.hour === Number(hour) && time.minute === Number(minute));
  if (!hasMatchingClockTime) return startsAt;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    Number(millisecond.padEnd(3, "0")),
  ).toISOString();
}

function parseDateTimeLocalValue(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatCalendarTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfWeek(date: Date) {
  const result = startOfDay(date);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addYears(date: Date, years: number) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

function calendarMonthDays(date: Date) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstVisibleDay = startOfWeek(firstOfMonth);

  return Array.from({ length: 42 }, (_, index) => addDays(firstVisibleDay, index));
}

function calendarModeLabel(mode: CalendarMode, cursorDate: Date) {
  if (mode === "day") {
    return cursorDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
  if (mode === "week") {
    const start = startOfWeek(cursorDate);
    const end = addDays(start, 6);
    return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }
  if (mode === "month") {
    return cursorDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  return cursorDate.toLocaleDateString(undefined, { year: "numeric" });
}

function shiftCalendarCursor(date: Date, mode: CalendarMode, direction: -1 | 1) {
  if (mode === "day") return addDays(date, direction);
  if (mode === "week") return addDays(date, direction * 7);
  if (mode === "month") return addMonths(date, direction);
  return addYears(date, direction);
}

function upcomingWeekdayDate(dayName: string, forceNext: boolean) {
  const targetDay = dayNames.findIndex((day) => day.toLowerCase() === dayName.toLowerCase());
  if (targetDay < 0) return undefined;

  const date = new Date();
  date.setHours(9, 0, 0, 0);
  let dayOffset = (targetDay - date.getDay() + 7) % 7;
  if (forceNext && dayOffset === 0) dayOffset = 7;
  date.setDate(date.getDate() + dayOffset);
  return date;
}

function scheduleFromContent(content: string) {
  const lower = content.toLowerCase();
  const relativeDay = lower.match(/\b(today|tonight|tomorrow)\b/);

  if (relativeDay) {
    const date = new Date();
    const token = relativeDay[1];
    if (token === "tomorrow") date.setDate(date.getDate() + 1);
    date.setHours(token === "tonight" ? 18 : 9, 0, 0, 0);
    return {
      dueLabel: token === "tomorrow" ? "Tomorrow" : token === "tonight" ? "Tonight" : "Today",
      startsAt: date.toISOString(),
    };
  }

  const weekday = lower.match(/\b(next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (!weekday) return undefined;

  const date = upcomingWeekdayDate(weekday[2], Boolean(weekday[1]));
  if (!date) return undefined;

  const dueLabel = `${weekday[1] ? "Next " : ""}${titleCase(weekday[2])}`;
  return {
    dueLabel,
    startsAt: date.toISOString(),
  };
}

function datePartsFromSchedule(content: string) {
  const schedule = scheduleFromContent(content);
  if (!schedule) return undefined;

  const date = new Date(schedule.startsAt);
  if (Number.isNaN(date.getTime())) return undefined;

  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
    dayOfMonth: date.getDate(),
    nextDate: date.toISOString(),
  };
}

function cleanRecurringName(value: string, fallback: string) {
  const cleaned = value
    .replace(/\b(my|our|the|a|an|is|it is|it's|its|tomorrow|today|tonight|next|this|on|every|monthly|yearly|annual|annually|because|have to|need to|remember|keep|noted|subscription|birthday|anniversary)\b/gi, " ")
    .replace(/[^a-zA-Z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return fallback;
  return cleaned.length > 64 ? `${cleaned.slice(0, 61).trim()}...` : titleCase(cleaned);
}

function inferRecurringEvent(content: string): RecurringEvent | undefined {
  const lower = content.toLowerCase();
  const dateParts = datePartsFromSchedule(content);
  const yearlyType = lower.includes("anniversary") ? "anniversary" : lower.includes("birthday") ? "birthday" : undefined;

  if (yearlyType && dateParts) {
    const nameMatch = content.match(/(?:my|our|the)?\s*([a-zA-Z0-9\s'-]{0,48}?(?:anniversary|birthday))/i);
    const fallback = yearlyType === "anniversary" ? "Anniversary" : "Birthday";
    const name = cleanRecurringName(nameMatch?.[1] ?? fallback, fallback);

    return {
      id: uid("rec"),
      name,
      frequency: "yearly",
      type: yearlyType,
      month: dateParts.month,
      day: dateParts.day,
      nextDate: dateParts.nextDate,
    };
  }

  if (lower.includes("subscription") || /\b(monthly|every month|per month)\b/.test(lower)) {
    const nameMatch = content.match(/(?:for|to|my)?\s*([a-zA-Z0-9\s'-]{2,48}?)\s*(?:subscription|monthly|every month|per month)/i);
    const name = cleanRecurringName(nameMatch?.[1] ?? "Monthly subscription", "Monthly subscription");
    const datePartsForMonthly = dateParts ?? {
      dayOfMonth: new Date().getDate(),
      nextDate: new Date().toISOString(),
    };

    return {
      id: uid("rec"),
      name,
      frequency: "monthly",
      type: "subscription",
      dayOfMonth: Math.max(1, Math.min(31, datePartsForMonthly.dayOfMonth)),
      nextDate: datePartsForMonthly.nextDate,
    };
  }

  return undefined;
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function fallbackSpeakText(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) {
    onEnd?.();
    return;
  }
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const speak = () => {
      const voice = selectSpeechVoice(synth.getVoices());
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = "en-US";
      }
      synth.speak(utterance);
    };

    utterance.rate = 0.98;
    utterance.pitch = 1.04;
    utterance.lang = "en-US";
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    if (synth.getVoices().length) {
      speak();
    } else {
      const timeout = window.setTimeout(speak, 250);
      synth.onvoiceschanged = () => {
        window.clearTimeout(timeout);
        synth.onvoiceschanged = null;
        speak();
      };
    }
  } catch {
    onEnd?.();
  }
}

function speakText(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !text.trim()) {
    onEnd?.();
    return;
  }

  stopSpeaking();

  fetch("/api/voice/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("ElevenLabs voice request failed.");
      return response.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentSpeechAudio = audio;
      currentSpeechUrl = url;

      const cleanup = () => {
        if (currentSpeechAudio === audio) currentSpeechAudio = null;
        if (currentSpeechUrl === url) currentSpeechUrl = null;
        URL.revokeObjectURL(url);
      };

      audio.onended = () => {
        cleanup();
        onEnd?.();
      };
      audio.onerror = () => {
        cleanup();
        fallbackSpeakText(text, onEnd);
      };

      return audio.play().catch(() => {
        cleanup();
        fallbackSpeakText(text, onEnd);
      });
    })
    .catch(() => {
      fallbackSpeakText(text, onEnd);
    });
}

function stopSpeaking() {
  if (currentSpeechAudio) {
    currentSpeechAudio.pause();
    currentSpeechAudio.currentTime = 0;
    currentSpeechAudio = null;
  }
  if (currentSpeechUrl) {
    URL.revokeObjectURL(currentSpeechUrl);
    currentSpeechUrl = null;
  }
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {}
}

function selectSpeechVoice(voices: SpeechSynthesisVoice[]) {
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const candidates = englishVoices.length ? englishVoices : voices;
  if (!candidates.length) return null;

  const preferredNames = [
    "samantha",
    "ava premium",
    "ava enhanced",
    "ava",
    "victoria",
    "allison",
    "google us english",
    "google uk english female",
    "microsoft jenny online",
    "microsoft aria online",
    "zira",
  ];
  const blockedNames = ["alex", "fred", "daniel", "google uk english male", "microsoft david", "microsoft mark"];
  const usableCandidates = candidates.filter((voice) => !blockedNames.some((name) => voice.name.toLowerCase().includes(name)));

  return (
    preferredNames
      .map((name) => usableCandidates.find((voice) => voice.name.toLowerCase().includes(name)))
      .find(Boolean) ??
    usableCandidates.find((voice) => !voice.default) ??
    usableCandidates[0] ??
    candidates[0]
  );
}

const QUESTION_STARTERS = [
  "what", "what's", "whats",
  "when", "when's", "whens",
  "where", "who", "why", "how",
  "do i", "did i", "am i", "have i",
  "is there", "are there",
  "can you", "could you", "would you", "will you",
  "tell me", "show me", "list",
  "remind me what", "remind me when", "remind me about",
];

function looksLikeQuestion(text: string): boolean {
  const lower = text.trim().toLowerCase().replace(/[.,!]+$/g, "");
  if (!lower) return false;
  if (lower.endsWith("?")) return true;
  return QUESTION_STARTERS.some((starter) => lower === starter || lower.startsWith(`${starter} `));
}

type VoiceCommand = "confirm" | "edit" | "cancel" | null;

const CONFIRM_PHRASES = [
  "yes", "yes save", "yes save it", "yeah", "yep", "yup", "save", "save it", "save this", "save that", "save note",
  "save the note", "save my note", "keep it", "keep this", "looks good", "looks right", "sounds good", "sounds right",
  "perfect", "correct", "right", "okay", "ok", "do it", "confirm", "confirmed", "go ahead", "go for it",
  "add it", "add this", "add the note", "save everything", "save all of it", "that's good", "thats good",
];
const EDIT_PHRASES = [
  "edit", "edit it", "edit this", "change", "change it", "change this", "modify", "modify it", "update", "update it",
  "fix", "fix it", "revise", "revise it", "make a change", "let me change", "actually", "no wait",
];
const CANCEL_PHRASES = [
  "cancel", "no", "nope", "do not save", "don't save", "dont save", "discard", "discard it", "delete", "delete it",
  "trash it", "skip it", "stop", "never mind", "nevermind", "forget it", "forget this", "forget that", "abort", "throw it out",
];

function normalizeVoiceCommand(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,!?]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/^(please can you|please could you|please would you|can you|could you|would you|go ahead and|please)\s+/, "")
    .trim();
}

function matchVoiceCommand(text: string): { command: VoiceCommand; remainder: string } {
  const cleaned = normalizeVoiceCommand(text);
  if (!cleaned) return { command: null, remainder: "" };

  const tryMatch = (phrases: string[]): { matched: boolean; rest: string } => {
    for (const phrase of [...phrases].sort((a, b) => b.length - a.length)) {
      if (cleaned === phrase) return { matched: true, rest: "" };
      if (cleaned.startsWith(`${phrase} `)) {
        return { matched: true, rest: cleaned.slice(phrase.length + 1).replace(/^(to say|to|that|it)\s+/, "").trim() };
      }
    }
    return { matched: false, rest: "" };
  };

  const cancel = tryMatch(CANCEL_PHRASES);
  if (cancel.matched) return { command: "cancel", remainder: cancel.rest };

  const edit = tryMatch(EDIT_PHRASES);
  if (edit.matched) return { command: "edit", remainder: edit.rest };

  const confirm = tryMatch(CONFIRM_PHRASES);
  if (confirm.matched) return { command: "confirm", remainder: confirm.rest };

  if (/\b(save|keep|add|confirm)\b.*\b(it|this|that|note|everything|all)\b/.test(cleaned)) {
    return { command: "confirm", remainder: "" };
  }
  if (/\b(yes|yeah|yep|yup|ok|okay)\b.*\b(save|keep|add|confirm)\b/.test(cleaned)) {
    return { command: "confirm", remainder: "" };
  }

  return { command: null, remainder: cleaned };
}

function formatVoiceCaptureRecap(plan: AiWorkspacePlan, sourceText: string) {
  const captureItems = normalizedCaptureItems(plan);
  const memory = captureItems[0]?.memory ?? plan.memory;
  const understood = (memory?.summary || memory?.title || memory?.body || sourceText).trim().replace(/\s+/g, " ");
  const shortSummary = understood.length > 140 ? `${understood.slice(0, 137).trim()}...` : understood;
  const memoryCount = captureItems.length || 1;
  const taskCount = captureItems.reduce((total, item) => total + (item.tasks?.length ?? 0), 0);
  const reminderCount = captureItems.reduce((total, item) => total + (item.reminders?.length ?? 0), 0);
  const calendarCount = captureItems.reduce((total, item) => total + (item.calendarEvents?.length ?? 0), 0);
  const actions = [
    `${memoryCount} note${memoryCount === 1 ? "" : "s"}`,
    taskCount ? `${taskCount} task${taskCount === 1 ? "" : "s"}` : "",
    reminderCount ? `${reminderCount} reminder${reminderCount === 1 ? "" : "s"}` : "",
    calendarCount ? `${calendarCount} calendar item${calendarCount === 1 ? "" : "s"}` : "",
  ].filter(Boolean);

  return `Got it: ${shortSummary}. I'll add ${actions.join(", ")}. Should I save it?`;
}

function normalizedCaptureItems(plan: AiWorkspacePlan): AiCaptureItemPlan[] {
  const captureItems = Array.isArray(plan.captureItems)
    ? plan.captureItems.filter((item) => item && typeof item === "object").slice(0, 8)
    : [];

  if (captureItems.length) return captureItems;

  return [
    {
      memory: plan.memory,
      tasks: plan.tasks,
      reminders: plan.reminders,
      calendarEvents: plan.calendarEvents,
    },
  ];
}

function inferKind(content: string): MemoryKind {
  const lower = content.toLowerCase();

  if (lower.includes("http") || lower.includes("youtube") || lower.includes("tiktok")) return "link";
  if (
    lower.includes("exam") ||
    lower.includes("deadline") ||
    lower.includes("due ") ||
    lower.includes("before friday") ||
    lower.includes("remind me") ||
    lower.includes("reminder")
  ) {
    return "deadline";
  }
  if (lower.includes("screenshot") || lower.includes("photo") || lower.includes("image")) return "image";
  if (lower.includes("voice") || lower.includes("talked") || lower.includes("said")) return "voice";
  if (lower.includes("pdf") || lower.includes("slides") || lower.includes("syllabus") || lower.includes("brief")) {
    return "document";
  }

  return "note";
}

function inferEntities(content: string) {
  const lower = content.toLowerCase();
  const explicit = [
    /\b(grocer(y|ies)|gorcer(y|ies)|shopping list|supermarket|milk|eggs|bread|bananas|apples|lettuce|chicken|rice)\b/.test(lower)
      ? "Groceries"
      : "",
    /\b(dinner|lunch|breakfast|meal|recipe)\b/.test(lower) ? "Meals" : "",
    lower.includes("accounting") ? "Accounting" : "",
    lower.includes("operations") ? "Operations" : "",
    lower.includes("spaxio") ? "Spaxio Assistant" : "",
    lower.includes("exam") ? "Exam" : "",
    lower.includes("midterm") ? "Midterm" : "",
    lower.includes("quiz") ? "Quiz" : "",
    lower.includes("client") ? "Client Work" : "",
    lower.includes("landing") ? "Landing Page" : "",
    lower.includes("syllabus") ? "Syllabus" : "",
    lower.includes("assignment") ? "Assignment" : "",
  ].filter(Boolean);

  const candidates = content
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word.toLowerCase()))
    .slice(0, 12)
    .map(titleCase);

  return Array.from(new Set([...explicit, ...candidates])).slice(0, 9);
}

function inferPeople(content: string) {
  const people = [];
  const professorMatch = content.match(/Professor\s+[A-Z][a-z]+/);
  if (professorMatch) people.push(professorMatch[0]);
  if (content.toLowerCase().includes("client")) people.push("Client");
  if (content.toLowerCase().includes("team")) people.push("Team");
  return Array.from(new Set(people));
}

function inferProjects(content: string, entities: string[]) {
  const lower = content.toLowerCase();
  const projects = [
    lower.includes("grocery") ||
    lower.includes("gorcery") ||
    lower.includes("groceries") ||
    lower.includes("shopping list") ||
    entities.includes("Groceries")
      ? "Groceries"
      : "",
    lower.includes("meal") || lower.includes("recipe") || entities.includes("Meals") ? "Meals" : "",
    lower.includes("accounting") || entities.includes("Accounting") ? "Accounting" : "",
    lower.includes("operations") || entities.includes("Operations") ? "Operations" : "",
    lower.includes("spaxio") || lower.includes("client") ? "Spaxio Assistant" : "",
    lower.includes("fitness") || lower.includes("sleep") || lower.includes("energy") ? "Wellbeing" : "",
    lower.includes("finance") || lower.includes("budget") ? "Finances" : "",
  ].filter(Boolean);

  return projects.length ? Array.from(new Set(projects)) : ["Inbox"];
}

function inferActions(content: string, entities: string[]) {
  const lower = content.toLowerCase();
  const schedule = scheduleFromContent(content);
  const cleanedTitle = content
    .replace(/\b(please|hey spaxio assistant|hey spaxio|spaxio assistant|spaxio|add|create|make|schedule|put|set|remind me to|remind me|reminder to|note that)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const actions = [
    lower.includes("calendar") || lower.includes("schedule") || lower.includes("meeting") || lower.includes("appointment")
      ? `Schedule ${cleanedTitle || entities[0] || "calendar item"}`
      : "",
    lower.includes("remind") || lower.includes("reminder") ? `Remember ${cleanedTitle || entities[0] || "this"}` : "",
    lower.includes("exam") || lower.includes("midterm") ? `Create study plan for ${entities[0] ?? "upcoming exam"}` : "",
    lower.includes("quiz") || lower.includes("study") ? "Generate quiz questions" : "",
    lower.includes("finish") ? `Finish ${entities.find((entity) => entity !== "Spaxio Assistant") ?? "the work"}` : "",
    lower.includes("client") ? "Prepare client update" : "",
    lower.includes("syllabus") ? "Extract semester timeline" : "",
    schedule && !lower.includes("remind") ? `Review ${cleanedTitle || entities[0] || "scheduled item"}` : "",
  ].filter(Boolean);

  if (!actions.length) {
    actions.push(`Review ${entities[0] ?? "this note"}`);
  }

  return Array.from(new Set(actions)).slice(0, 4);
}

function summarize(content: string, kind: MemoryKind, entities: string[]) {
  const sentence = content.split(/[.!?\n]/).find((part) => part.trim().length > 12)?.trim();
  const focus = entities.slice(0, 3).join(", ") || "general context";
  const prefix: Record<MemoryKind, string> = {
    note: "Captured note",
    document: "Document intake",
    deadline: "Time-sensitive item",
    voice: "Voice capture",
    link: "Linked resource",
    image: "Visual reference",
  };

  return `${prefix[kind]} connected to ${focus}. ${sentence ?? "Spaxio Assistant will keep it available for planning and retrieval."}`;
}

function urgencyFrom(content: string, kind: MemoryKind) {
  const lower = content.toLowerCase();
  let score = kind === "deadline" ? 4 : 2;

  if (lower.includes("today") || lower.includes("tomorrow") || lower.includes("urgent")) score += 1;
  if (lower.includes("exam") || lower.includes("client") || lower.includes("friday")) score += 1;
  return Math.max(1, Math.min(5, score));
}

function createMemory(content: string, source: string, forcedKind?: MemoryKind): Memory {
  const kind = forcedKind ?? inferKind(content);
  const entities = inferEntities(content);
  const people = inferPeople(content);
  const projects = inferProjects(content, entities);
  const actions = inferActions(content, entities);
  const title = content.split(/[.!?\n]/)[0]?.trim() || "Untitled memory";

  return {
    id: uid("m"),
    kind,
    title: title.length > 72 ? `${title.slice(0, 69)}...` : title,
    body: content,
    summary: summarize(content, kind, entities),
    source,
    createdAt: new Date().toISOString(),
    entities,
    people,
    projects,
    actions,
    urgency: urgencyFrom(content, kind),
    confidence: Math.min(97, 78 + entities.length * 2 + actions.length * 3),
    recurringEvent: inferRecurringEvent(content),
  };
}

function isMemoryKind(value: unknown): value is MemoryKind {
  return typeof value === "string" && value in kindMeta;
}

function textArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
    : [];
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(min, Math.min(max, Math.round(numberValue)));
}

function normalizeRecurringEvent(plan: AiRecurringEventPlan | undefined, fallbackContent: string): RecurringEvent | undefined {
  const fallback = inferRecurringEvent(fallbackContent);
  if (!plan || typeof plan !== "object") return fallback;

  const frequency = plan.frequency === "yearly" || plan.frequency === "monthly" ? plan.frequency : fallback?.frequency;
  if (!frequency) return fallback;

  const type =
    plan.type === "anniversary" || plan.type === "birthday" || plan.type === "subscription" || plan.type === "custom"
      ? plan.type
      : fallback?.type ?? "custom";
  const nextDate = typeof plan.nextDate === "string" && !Number.isNaN(new Date(plan.nextDate).getTime())
    ? new Date(plan.nextDate).toISOString()
    : fallback?.nextDate;
  const month = boundedNumber(plan.month, fallback?.month ?? (nextDate ? new Date(nextDate).getMonth() + 1 : 1), 1, 12);
  const day = boundedNumber(plan.day, fallback?.day ?? (nextDate ? new Date(nextDate).getDate() : 1), 1, 31);
  const dayOfMonth = boundedNumber(plan.dayOfMonth, fallback?.dayOfMonth ?? day, 1, 31);
  const defaultName = type === "subscription" ? "Monthly subscription" : type === "anniversary" ? "Anniversary" : type === "birthday" ? "Birthday" : "Recurring event";
  const name = typeof plan.name === "string" && plan.name.trim() ? plan.name.trim().slice(0, 80) : fallback?.name ?? defaultName;

  return {
    id: fallback?.id ?? uid("rec"),
    name,
    frequency,
    type,
    month: frequency === "yearly" ? month : undefined,
    day: frequency === "yearly" ? day : undefined,
    dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
    nextDate,
  };
}

function memoryFromAiPlan(plan: AiMemoryPlan | undefined, fallbackContent: string, folderId: string | undefined, authorId: string): Memory {
  const fallback = createMemory(fallbackContent, "Claude capture", isMemoryKind(plan?.kind) ? plan.kind : undefined);
  const entities = textArray(plan?.entities);
  const people = textArray(plan?.people);
  const projects = textArray(plan?.projects);
  const actions = textArray(plan?.actions);

  return {
    ...fallback,
    kind: isMemoryKind(plan?.kind) ? plan.kind : fallback.kind,
    title: typeof plan?.title === "string" && plan.title.trim() ? plan.title.trim().slice(0, 90) : fallback.title,
    body: typeof plan?.body === "string" && plan.body.trim() ? plan.body.trim() : fallback.body,
    summary: typeof plan?.summary === "string" && plan.summary.trim() ? plan.summary.trim() : fallback.summary,
    entities: entities.length ? entities.slice(0, 12) : fallback.entities,
    people: people.length ? people.slice(0, 8) : fallback.people,
    projects: projects.length ? projects.slice(0, 6) : fallback.projects,
    actions: actions.length ? actions.slice(0, 6) : fallback.actions,
    urgency: boundedNumber(plan?.urgency, fallback.urgency, 1, 5),
    confidence: boundedNumber(plan?.confidence, fallback.confidence, 1, 100),
    folderId,
    authorId,
    recurringEvent: normalizeRecurringEvent(plan?.recurringEvent, fallbackContent),
  };
}

function tasksFromMemory(memory: Memory): Task[] {
  const schedule = scheduleFromContent(memory.body);

  return memory.actions.slice(0, 3).map((action, index) => ({
    id: uid("t"),
    title: action,
    project: memory.projects[0] ?? "Inbox",
    estimate: memory.kind === "deadline" ? 45 : 25 + index * 10,
    due: schedule?.dueLabel ?? (memory.kind === "deadline" ? "Soon" : "This week"),
    status: "todo",
    sourceMemoryId: memory.id,
  }));
}

function calendarEventsFromMemory(memory: Memory, tasks: Task[], folderId: string | undefined, createdBy: string): CalendarEvent[] {
  const schedule = scheduleFromContent(memory.body);
  if (!schedule || !folderId) return [];

  const baseDate = new Date(schedule.startsAt);
  return tasks.map((task, index) => {
    const startsAt = new Date(baseDate);
    startsAt.setHours(baseDate.getHours() + index, 0, 0, 0);

    return {
      id: uid("cal"),
      title: task.title,
      startsAt: startsAt.toISOString(),
      folderId,
      createdBy,
      context: `Scheduled from "${memory.title}".`,
      sourceMemoryId: memory.id,
      sourceTaskId: task.id,
    };
  });
}

function remindersFromMemory(memory: Memory): Reminder[] {
  const lower = memory.body.toLowerCase();
  const reminders: Reminder[] = [];
  const schedule = scheduleFromContent(memory.body);

  if (memory.recurringEvent) {
    reminders.push({
      id: uid("r"),
      title: memory.recurringEvent.name,
      trigger: formatRecurringEvent(memory.recurringEvent),
      context: `Recurring ${memory.recurringEvent.type} saved from "${memory.title}".`,
      sourceMemoryId: memory.id,
      done: false,
    });
  }

  if (lower.includes("remind") || lower.includes("reminder")) {
    reminders.push({
      id: uid("r"),
      title: memory.title,
      trigger: schedule?.dueLabel ?? "Contextual",
      context: memory.summary,
      sourceMemoryId: memory.id,
      done: false,
    });
  }

  if (!reminders.length && (memory.kind === "deadline" || lower.includes("exam") || lower.includes("client"))) {
    reminders.push({
      id: uid("r"),
      title: `Follow up: ${memory.title}`,
      trigger: lower.includes("friday") ? "Before Friday" : "Before the deadline window",
      context: memory.summary,
      sourceMemoryId: memory.id,
      done: false,
    });
  }

  return reminders;
}

function localCapturePlan(content: string): AiWorkspacePlan {
  return {
    answer: "Added the capture to notes.",
    captureItems: [
      {
        memory: {
          ...createMemory(content, "Local capture"),
        },
      },
    ],
  };
}

function matchesMemory(memory: Memory, query: string) {
  if (!query.trim()) return true;

  const haystack = [
    memory.title,
    memory.body,
    memory.summary,
    memory.recurringEvent?.name ?? "",
    memory.recurringEvent ? formatRecurringEvent(memory.recurringEvent) : "",
    memory.entities.join(" "),
    memory.people.join(" "),
    memory.projects.join(" "),
    memory.actions.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .every((token) => haystack.includes(token));
}

type SpaxioAppProps = {
  initialWorkspace?: Workspace;
  initialWorkspaceUpdatedAt?: string;
  inviteCode?: string;
  persistenceMode?: "local" | "supabase";
  userEmail?: string;
  userId?: string;
  plan?: string;
  promotions?: Promotion[];
  promotionEmailsOptOut?: boolean;
  referralDiscountEligible?: boolean;
  subscriptionStatus?: string;
};

export default function SpaxioApp({
  initialWorkspace: providedWorkspace,
  initialWorkspaceUpdatedAt,
  inviteCode,
  persistenceMode = "local",
  userEmail,
  userId,
  plan = "free",
  promotions: initialPromotions = [],
  promotionEmailsOptOut: initialPromotionEmailsOptOut = false,
  referralDiscountEligible = false,
  subscriptionStatus = "inactive",
}: SpaxioAppProps) {
  const [workspace, setWorkspace] = useState<Workspace>(() => {
    if (providedWorkspace) return normalizeWorkspace(providedWorkspace);
    return initialWorkspace;
  });
  const [cacheReady, setCacheReady] = useState(false);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [captureMode, setCaptureMode] = useState<"text" | "voice">("text");
  const [kindFilter, setKindFilter] = useState<MemoryKind | "all">("all");
  const [energy, setEnergy] = useState<Energy>("steady");
  const [freeMinutes, setFreeMinutes] = useState(120);
  const [manualTask, setManualTask] = useState("");
  const [manualReminder, setManualReminder] = useState("");
  const [manualReminderAt, setManualReminderAt] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState(DEFAULT_FOLDER_ID);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [calendarTitle, setCalendarTitle] = useState("");
  const [calendarStart, setCalendarStart] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiStatus, setAiStatus] = useState<"idle" | "asking" | "capturing">("idle");
  const [aiError, setAiError] = useState("");
  const [billingError, setBillingError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);
  const [accountDeleteConfirm, setAccountDeleteConfirm] = useState("");
  const [accountDeleteStatus, setAccountDeleteStatus] = useState<"idle" | "deleting">("idle");
  const [accountEmail, setAccountEmail] = useState(userEmail ?? "");
  const [accountEmailStatus, setAccountEmailStatus] = useState<AccountEmailStatus>({ state: "idle", message: "" });
  const [promotionEmailsOptOut, setPromotionEmailsOptOut] = useState(initialPromotionEmailsOptOut);
  const [promotionEmailPreferenceStatus, setPromotionEmailPreferenceStatus] = useState<AccountEmailStatus>({
    state: "idle",
    message: "",
  });
  const [uploadError, setUploadError] = useState("");
  const [reminderEmailStatus, setReminderEmailStatus] = useState<ReminderEmailStatus>(null);
  const [notificationTrayOpen, setNotificationTrayOpen] = useState(false);
  const [attentionNotificationId, setAttentionNotificationId] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [openPromotionId, setOpenPromotionId] = useState<string | null>(null);
  const [dismissedBannerIds, setDismissedBannerIds] = useState<Set<string>>(() => new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastAlertedNotificationIdRef = useRef<string | null>(null);
  const workspaceRef = useRef(workspace);
  const supabase = useMemo(() => (persistenceMode === "supabase" ? createClient() : null), [persistenceMode]);
  const isProPlan = plan === "pro";
  const voiceAvailable = isProPlan;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const cached = readCachedWorkspace(userId);

      if (providedWorkspace) {
        if (isNewerTimestamp(cached?.persistedAt, initialWorkspaceUpdatedAt)) {
          setWorkspace(normalizeWorkspace(cached?.workspace ?? providedWorkspace));
        }
      } else if (cached) {
        setWorkspace(normalizeWorkspace(cached.workspace));
      }

      setCacheReady(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [initialWorkspaceUpdatedAt, providedWorkspace, userId]);

  useEffect(() => {
    if (!inviteCode || typeof window === "undefined") return;
    const timeout = window.setTimeout(() => {
      setInviteUrl(`${window.location.origin}/login?invite=${encodeURIComponent(inviteCode)}`);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [inviteCode]);

  useEffect(() => {
    if (!cacheReady) return;
    workspaceRef.current = workspace;
    writeCachedWorkspace(workspace, userId);
  }, [cacheReady, userId, workspace]);

  useEffect(() => {
    if (!cacheReady) return;
    if (typeof window === "undefined") return;

    const flushWorkspace = () => {
      writeCachedWorkspace(workspaceRef.current, userId);
    };

    window.addEventListener("pagehide", flushWorkspace);
    window.addEventListener("beforeunload", flushWorkspace);

    return () => {
      window.removeEventListener("pagehide", flushWorkspace);
      window.removeEventListener("beforeunload", flushWorkspace);
    };
  }, [cacheReady, userId]);

  useEffect(() => {
    if (!cacheReady || !supabase || !userId) return;

    const timeout = window.setTimeout(() => {
      void supabase.from("workspace_states").upsert({
        user_id: userId,
        state: workspace,
        updated_at: new Date().toISOString(),
      });
      void supabase.from("profiles").upsert({
        id: userId,
        ai_mode: workspace.settings.aiMode,
        calendar_connected: workspace.settings.calendarConnected,
        focus_area: workspace.settings.focusArea,
        full_name: workspace.settings.name,
        preferred_language: workspace.settings.language,
        updated_at: new Date().toISOString(),
        voice_capture: workspace.settings.voiceCapture,
      });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [cacheReady, supabase, userId, workspace]);

  const selectedFolder = workspace.sharedFolders.find((folder) => folder.id === selectedFolderId) ?? workspace.sharedFolders[0];
  const isSharedView = activeView === "collaboration";
  const activeSharedFolder = isSharedView ? selectedFolder : undefined;
  const personalMemories = useMemo(() => workspace.memories.filter((memory) => !memory.folderId), [workspace.memories]);
  const folderMemories = useMemo(
    () => (selectedFolder ? workspace.memories.filter((memory) => memory.folderId === selectedFolder.id) : []),
    [selectedFolder, workspace.memories],
  );
  const scopedMemories = isSharedView ? folderMemories : personalMemories;
  const memoryById = useMemo(() => new Map(workspace.memories.map((memory) => [memory.id, memory])), [workspace.memories]);
  const personalTasks = useMemo(
    () => workspace.tasks.filter((task) => !task.sourceMemoryId || !memoryById.get(task.sourceMemoryId)?.folderId),
    [memoryById, workspace.tasks],
  );
  const personalReminders = useMemo(
    () => workspace.reminders.filter((reminder) => !reminder.sourceMemoryId || !memoryById.get(reminder.sourceMemoryId)?.folderId),
    [memoryById, workspace.reminders],
  );
  const [dueReminderNowMs, setDueReminderNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setDueReminderNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const dueReminders = useMemo(
    () =>
      workspace.reminders.filter((reminder) => {
        if (reminder.done || !reminder.remindAt) return false;
        const at = new Date(reminder.remindAt).getTime();
        return Number.isFinite(at) && at <= dueReminderNowMs;
      }),
    [dueReminderNowMs, workspace.reminders],
  );
  const folderTasks = useMemo(
    () => workspace.tasks.filter((task) => task.sourceMemoryId && memoryById.get(task.sourceMemoryId)?.folderId === selectedFolder?.id),
    [memoryById, selectedFolder?.id, workspace.tasks],
  );
  const folderReminders = useMemo(
    () =>
      workspace.reminders.filter(
        (reminder) => reminder.sourceMemoryId && memoryById.get(reminder.sourceMemoryId)?.folderId === selectedFolder?.id,
      ),
    [memoryById, selectedFolder?.id, workspace.reminders],
  );

  const filteredMemories = useMemo(() => {
    return scopedMemories.filter((memory) => {
      const kindMatches = kindFilter === "all" || memory.kind === kindFilter;
      return kindMatches && matchesMemory(memory, query);
    });
  }, [kindFilter, query, scopedMemories]);

  const currentUser =
    workspace.collaborators.find((collaborator) => collaborator.id === workspace.settings.currentUserId) ?? workspace.collaborators[0];
  const currentUserNotifications = useMemo(
    () =>
      workspace.notifications
        .filter((notification) => notification.recipientIds.includes(currentUser.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [currentUser.id, workspace.notifications],
  );
  const unreadNotifications = useMemo(
    () => currentUserNotifications.filter((notification) => !notification.readBy.includes(currentUser.id)),
    [currentUser.id, currentUserNotifications],
  );

  useEffect(() => {
    const latestUnread = unreadNotifications[0];
    if (!latestUnread) return;

    if (lastAlertedNotificationIdRef.current === latestUnread.id) return;

    lastAlertedNotificationIdRef.current = latestUnread.id;

    const showTimeout = window.setTimeout(() => {
      setAttentionNotificationId(latestUnread.id);
    }, 0);
    const hideTimeout = window.setTimeout(() => {
      setAttentionNotificationId((current) => (current === latestUnread.id ? null : current));
    }, 9000);

    return () => {
      window.clearTimeout(showTimeout);
      window.clearTimeout(hideTimeout);
    };
  }, [unreadNotifications]);

  const bannerPromotion = useMemo(
    () =>
      promotions.find((promotion) => !promotion.isRead && !dismissedBannerIds.has(promotion.id)) ?? null,
    [promotions, dismissedBannerIds],
  );
  const openPromotion = openPromotionId
    ? promotions.find((promotion) => promotion.id === openPromotionId) ?? null
    : null;

  async function markPromotionReadOnServer(promotionId: string) {
    if (persistenceMode !== "supabase") return;
    try {
      await fetch(`/api/promotions/${encodeURIComponent(promotionId)}/read`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
    } catch {
      // best-effort; the banner stays dismissed locally either way
    }
  }

  function viewPromotion(promotionId: string) {
    setOpenPromotionId(promotionId);
    setPromotions((current) =>
      current.map((promotion) => (promotion.id === promotionId ? { ...promotion, isRead: true } : promotion)),
    );
    setDismissedBannerIds((current) => {
      const next = new Set(current);
      next.add(promotionId);
      return next;
    });
    void markPromotionReadOnServer(promotionId);
  }

  function dismissPromotionBanner(promotionId: string) {
    setDismissedBannerIds((current) => {
      const next = new Set(current);
      next.add(promotionId);
      return next;
    });
    setPromotions((current) =>
      current.map((promotion) => (promotion.id === promotionId ? { ...promotion, isRead: true } : promotion)),
    );
    void markPromotionReadOnServer(promotionId);
  }

  function closePromotionModal() {
    setOpenPromotionId(null);
  }

  const folderEvents = selectedFolder
    ? workspace.calendarEvents.filter((event) => event.folderId === selectedFolder.id)
    : [];
  const sortedCalendarEvents = useMemo(
    () => [...workspace.calendarEvents].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [workspace.calendarEvents],
  );

  const scopedTasks = isSharedView ? folderTasks : personalTasks;
  const scopedReminders = isSharedView ? folderReminders : personalReminders;
  const openTasks = scopedTasks.filter((task) => task.status === "todo");
  const completedTasks = scopedTasks.filter((task) => task.status === "done");
  const focusTasks = useMemo(() => {
    const energyMultiplier = energy === "low" ? 0.58 : energy === "high" ? 1.2 : 0.88;

    return [...openTasks]
      .sort((a, b) => {
        const sourceA = workspace.memories.find((memory) => memory.id === a.sourceMemoryId)?.urgency ?? 2;
        const sourceB = workspace.memories.find((memory) => memory.id === b.sourceMemoryId)?.urgency ?? 2;
        return sourceB - sourceA || a.estimate - b.estimate;
      })
      .reduce<{ tasks: Task[]; remaining: number }>(
        (accumulator, task) => {
          if (accumulator.remaining <= 0) return accumulator;

          const remaining = accumulator.remaining - task.estimate;
          if (remaining < -20) return { ...accumulator, remaining };

          return {
            tasks: [...accumulator.tasks, task],
            remaining,
          };
        },
        { tasks: [], remaining: Math.round(freeMinutes * energyMultiplier) },
      ).tasks;
  }, [energy, freeMinutes, openTasks, workspace.memories]);

  function buildFolderNotifications(params: {
    actorId: string;
    body: string;
    folderId: string;
    kind: NotificationKind;
    title: string;
    memoryId?: string;
    calendarEventId?: string;
  }) {
    const folder = workspace.sharedFolders.find((item) => item.id === params.folderId);
    if (!folder) return [];

    const recipientIds = folder.collaboratorIds.filter((collaboratorId) => collaboratorId !== params.actorId);
    if (!recipientIds.length) return [];

    return [
      {
        id: uid("n"),
        kind: params.kind,
        title: params.title,
        body: params.body,
        actorId: params.actorId,
        recipientIds,
        folderId: params.folderId,
        memoryId: params.memoryId,
        calendarEventId: params.calendarEventId,
        createdAt: new Date().toISOString(),
        readBy: [],
      },
    ];
  }

  function commitGeneratedRecordBatches(
    batches: Array<{
      memory: Memory;
      generatedTasks: Task[];
      generatedReminders: Reminder[];
      generatedCalendarEvents: CalendarEvent[];
    }>,
  ) {
    const notifications = batches.flatMap(({ memory, generatedCalendarEvents }) => {
      const folder = workspace.sharedFolders.find((item) => item.id === memory.folderId);
      const noteNotifications = folder
        ? buildFolderNotifications({
            actorId: workspace.settings.currentUserId,
            body: `${currentUser?.name ?? "A collaborator"} added "${memory.title}" to ${folder.name}.`,
            folderId: folder.id,
            kind: "note",
            memoryId: memory.id,
            title: `${currentUser?.name ?? "A collaborator"} added a shared note`,
          })
        : [];
      const calendarNotifications = folder
        ? generatedCalendarEvents.flatMap((calendarEvent) =>
            buildFolderNotifications({
              actorId: workspace.settings.currentUserId,
              body: `${calendarEvent.title} was scheduled from the captured task.`,
              calendarEventId: calendarEvent.id,
              folderId: folder.id,
              kind: "calendar",
              title: `${currentUser?.name ?? "A collaborator"} added a calendar item`,
            }),
          )
        : [];

      return [...noteNotifications, ...calendarNotifications];
    });
    const folderIds = new Set(batches.map(({ memory }) => memory.folderId).filter(Boolean));

    setWorkspace((current) => ({
      ...current,
      memories: [...batches.map((batch) => batch.memory), ...current.memories],
      tasks: [...batches.flatMap((batch) => batch.generatedTasks), ...current.tasks],
      reminders: [...batches.flatMap((batch) => batch.generatedReminders), ...current.reminders],
      calendarEvents: [...batches.flatMap((batch) => batch.generatedCalendarEvents), ...current.calendarEvents],
      sharedFolders: current.sharedFolders.map((item) =>
        folderIds.has(item.id) ? { ...item, updatedAt: new Date().toISOString() } : item,
      ),
      notifications: [...notifications, ...current.notifications],
    }));
  }

  async function callWorkspaceAi(mode: "ask" | "capture", prompt: string) {
    const scopedWorkspace: Workspace = {
      ...workspace,
      memories: scopedMemories,
      tasks: scopedTasks,
      reminders: scopedReminders,
      calendarEvents: activeSharedFolder ? folderEvents : workspace.calendarEvents,
    };
    const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const accessToken = sessionData.session?.access_token;

    const response = await fetch("/api/ai/workspace", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        mode,
        prompt,
        workspace: scopedWorkspace,
        folderId: activeSharedFolder?.id,
        currentUserId: workspace.settings.currentUserId,
        language: workspace.settings.language,
        learnedFacts: workspace.settings.learnedFacts ?? [],
        userTime: userTimeContext(),
      }),
    });
    const data = await readJsonResponse<AiWorkspacePlan>(response);

    if (!response.ok) {
      throw new Error(data.error || "AI request failed.");
    }

    if (Array.isArray(data.learnedAboutUser) && data.learnedAboutUser.length) {
      const incoming = data.learnedAboutUser
        .filter((fact): fact is string => typeof fact === "string")
        .map((fact) => fact.trim())
        .filter((fact) => fact.length > 0 && fact.length <= 200);

      if (incoming.length) {
        setWorkspace((current) => {
          const existing = current.settings.learnedFacts ?? [];
          const seen = new Set(existing.map((fact) => fact.toLowerCase()));
          const additions: string[] = [];
          for (const fact of incoming) {
            const key = fact.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            additions.push(fact);
          }
          if (!additions.length) return current;
          const merged = [...additions, ...existing].slice(0, MAX_LEARNED_FACTS);
          return {
            ...current,
            settings: { ...current.settings, learnedFacts: merged },
          };
        });
      }
    }

    return data;
  }

  function getCalendarTargetFolder() {
    return activeSharedFolder ?? selectedFolder ?? workspace.sharedFolders[0];
  }

  function commitAiCapture(plan: AiWorkspacePlan, sourceText: string, sourceLabel?: string) {
    const captureItems = normalizedCaptureItems(plan);
    const calendarFolder = getCalendarTargetFolder();
    const batches = captureItems.map((item, itemIndex) => {
      const fallbackContent =
        typeof item.memory?.body === "string" && item.memory.body.trim() ? item.memory.body.trim() : sourceText;
      const baseMemory = memoryFromAiPlan(
        item.memory,
        fallbackContent,
        activeSharedFolder?.id,
        workspace.settings.currentUserId,
      );
      const memory: Memory = sourceLabel ? { ...baseMemory, source: sourceLabel } : baseMemory;
      const plannedTasks = (item.tasks ?? [])
        .filter((task): task is AiTaskPlan & { title: string } => typeof task.title === "string" && task.title.trim().length > 0)
        .slice(0, 6)
        .map((task, index) => ({
          id: uid("t"),
          title: task.title.trim(),
          project: typeof task.project === "string" && task.project.trim() ? task.project.trim() : memory.projects[0] ?? "Inbox",
          estimate: boundedNumber(task.estimate, memory.kind === "deadline" ? 45 : 25 + index * 10, 5, 240),
          due: typeof task.due === "string" && task.due.trim() ? task.due.trim() : "This week",
          status: "todo" as TaskStatus,
          sourceMemoryId: memory.id,
        }));
      const plannedReminders = (item.reminders ?? [])
        .filter((reminder): reminder is AiReminderPlan & { title: string } => typeof reminder.title === "string" && reminder.title.trim().length > 0)
        .slice(0, 5)
        .map((reminder) => {
          const remindAt =
            typeof reminder.remindAt === "string" && !Number.isNaN(new Date(reminder.remindAt).getTime())
              ? new Date(reminder.remindAt).toISOString()
              : undefined;
          return {
            id: uid("r"),
            title: reminder.title.trim(),
            trigger:
              typeof reminder.trigger === "string" && reminder.trigger.trim()
                ? reminder.trigger.trim()
                : remindAt
                  ? formatReminderTriggerLabel(remindAt)
                  : "Contextual",
            context: typeof reminder.context === "string" && reminder.context.trim() ? reminder.context.trim() : memory.summary,
            sourceMemoryId: memory.id,
            done: false,
            remindAt,
          };
        });
      const fallbackTasks =
        captureItems.length === 1 && !item.tasks?.length && !item.reminders?.length && !item.calendarEvents?.length
          ? tasksFromMemory(memory)
          : [];
      const generatedTasks = plannedTasks.length ? plannedTasks : fallbackTasks;
      const fallbackReminders = !plannedReminders.length ? remindersFromMemory(memory) : [];
      const generatedReminders = plannedReminders.length ? plannedReminders : fallbackReminders;
      const plannedCalendarEvents = calendarFolder
        ? (item.calendarEvents ?? [])
            .filter((event): event is AiCalendarEventPlan & { title: string; startsAt: string } => {
              if (typeof event.title !== "string" || typeof event.startsAt !== "string") return false;
              return !Number.isNaN(new Date(event.startsAt).getTime());
            })
            .slice(0, 6)
            .map((event, index) => ({
              id: uid("cal"),
              title: event.title.trim(),
              startsAt: new Date(normalizeAiCalendarStart(event.startsAt, sourceText)).toISOString(),
              folderId: calendarFolder.id,
              createdBy: workspace.settings.currentUserId,
              context:
                typeof event.context === "string" && event.context.trim()
                  ? event.context.trim()
                  : `Scheduled from "${memory.title}".`,
              sourceMemoryId: memory.id,
              sourceTaskId: generatedTasks[index]?.id,
            }))
        : [];
      const generatedCalendarEvents = plannedCalendarEvents.length
        ? plannedCalendarEvents
        : calendarEventsFromMemory(memory, generatedTasks, calendarFolder?.id, workspace.settings.currentUserId);

      return {
        memory: itemIndex === 0 ? memory : { ...memory, title: memory.title || `Capture ${itemIndex + 1}` },
        generatedTasks,
        generatedReminders,
        generatedCalendarEvents,
      };
    });

    commitGeneratedRecordBatches(batches);
  }

  async function addMemoryWithAi(content: string) {
    setAiStatus("capturing");
    setAiError("");

    try {
      const plan = await callWorkspaceAi("capture", content);
      commitAiCapture(plan, content);
      setAiAnswer(plan.answer || "Added the capture to memory, tasks, reminders, and calendar where useful.");
      setDraft("");
    } catch (error) {
      commitAiCapture(localCapturePlan(content), content, captureMode === "voice" && voiceAvailable ? "Voice capture" : "Typed capture");
      setDraft("");
      setAiError(
        error instanceof Error
          ? `${error.message} Local extraction was used instead.`
          : "AI capture failed. Local extraction was used instead.",
      );
    } finally {
      setAiStatus("idle");
    }
  }

  async function askWorkspaceAi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiStatus("asking");
    setAiError("");

    try {
      const plan = await callWorkspaceAi("ask", aiPrompt.trim());
      setAiAnswer(plan.answer || "I could not find anything useful in the current workspace.");
      if (plan.query?.trim()) setQuery(plan.query.trim());
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI request failed.");
    } finally {
      setAiStatus("idle");
    }
  }

  async function requestVoiceAi(mode: "ask" | "capture", prompt: string) {
    return callWorkspaceAi(mode, prompt);
  }

  function commitVoiceCapture(plan: AiWorkspacePlan, sourceText: string) {
    commitAiCapture(plan, sourceText, "Voice capture");
  }

  function addMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;

    if (captureMode === "voice" && !voiceAvailable) {
      setBillingError("Voice capture is available on Pro.");
      setCaptureMode("text");
      return;
    }

    void addMemoryWithAi(draft.trim());
  }

  function changeCaptureMode(mode: "text" | "voice") {
    if (mode === "voice" && !voiceAvailable) {
      setBillingError("Voice capture is available on Pro.");
      return;
    }

    setBillingError("");
    setCaptureMode(mode);
  }

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setUploadError("");

    const selectedFiles = files.slice(0, MAX_UPLOAD_FILES);
    const uploadableFiles = selectedFiles.filter((file) => file.size <= MAX_UPLOAD_BYTES);
    const rejectedCount = files.length - uploadableFiles.length;

    if (!uploadableFiles.length) {
      setUploadError("Upload up to 5 files under 10 MB each.");
      event.target.value = "";
      return;
    }

    const fileMemories = await Promise.all(
      uploadableFiles.map(async (file) => {
        const readable =
          file.type.startsWith("text/") ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".csv");
        let text = "";
        if (readable) {
          try {
            text = await file.text();
          } catch {
            text = "";
          }
        }
        const content = text
          ? `${file.name}\n\n${text.slice(0, 5000)}`
          : `${file.name} uploaded to Spaxio Assistant. Use this file as context and extract concepts, deadlines, people, and next actions.`;
        const kind: MemoryKind = file.type.startsWith("image/") ? "image" : "document";
        const memory: Memory = {
          ...createMemory(content, "File upload", kind),
          folderId: activeSharedFolder?.id,
          authorId: workspace.settings.currentUserId,
        };

        if (supabase && userId) {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
          const path = `${userId}/${memory.id}-${safeName}`;
          const { error } = await supabase.storage
            .from("spaxio-uploads")
            .upload(path, file, {
              cacheControl: "3600",
              upsert: false,
            })
            .catch(() => ({ error: new Error("Upload failed.") }));

          if (!error) {
            memory.filePath = path;
          } else {
            setUploadError("Some files were saved as memory, but storage upload failed.");
          }
        }

        return memory;
      }),
    );
    const folder = activeSharedFolder;
    const fileNotifications = folder
      ? fileMemories.flatMap((memory) =>
          buildFolderNotifications({
            actorId: workspace.settings.currentUserId,
            body: `${currentUser?.name ?? "A collaborator"} uploaded "${memory.title}" to ${folder.name}.`,
            folderId: folder.id,
            kind: "note",
            memoryId: memory.id,
            title: `${currentUser?.name ?? "A collaborator"} added shared context`,
          }),
        )
      : [];

    setWorkspace((current) => ({
      ...current,
      memories: [...fileMemories, ...current.memories],
      tasks: [...fileMemories.flatMap(tasksFromMemory), ...current.tasks],
      reminders: [...fileMemories.flatMap(remindersFromMemory), ...current.reminders],
      sharedFolders: current.sharedFolders.map((item) =>
        item.id === activeSharedFolder?.id ? { ...item, updatedAt: new Date().toISOString() } : item,
      ),
      notifications: [...fileNotifications, ...current.notifications],
    }));
    if (rejectedCount > 0) {
      setUploadError(`Added ${uploadableFiles.length} file${uploadableFiles.length === 1 ? "" : "s"}. Skipped ${rejectedCount} over the limit.`);
    }
    event.target.value = "";
  }

  function toggleTask(taskId: string) {
    setWorkspace((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId ? { ...task, status: task.status === "done" ? "todo" : "done" } : task,
      ),
    }));
  }

  function deleteMemory(memoryId: string) {
    setWorkspace((current) => ({
      ...current,
      memories: current.memories.filter((memory) => memory.id !== memoryId),
      tasks: current.tasks.filter((task) => task.sourceMemoryId !== memoryId),
      reminders: current.reminders.filter((reminder) => reminder.sourceMemoryId !== memoryId),
    }));
  }

  function renameMemory(memoryId: string, name: string) {
    const cleanName = name.trim().slice(0, 90);
    if (!cleanName) return;

    setWorkspace((current) => ({
      ...current,
      memories: current.memories.map((memory) =>
        memory.id === memoryId
          ? {
              ...memory,
              title: cleanName,
              recurringEvent: memory.recurringEvent ? { ...memory.recurringEvent, name: cleanName } : memory.recurringEvent,
            }
          : memory,
      ),
      reminders: current.reminders.map((reminder) =>
        reminder.sourceMemoryId === memoryId ? { ...reminder, title: cleanName } : reminder,
      ),
    }));
  }

  function addManualTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manualTask.trim()) return;

    setWorkspace((current) => ({
      ...current,
      tasks: [
        {
          id: uid("t"),
          title: manualTask.trim(),
          project: "Inbox",
          estimate: 30,
          due: "This week",
          status: "todo",
        },
        ...current.tasks,
      ],
    }));
    setManualTask("");
  }

  function addManualReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manualReminder.trim()) return;

    const parsedRemindAt = manualReminderAt ? parseDateTimeLocalValue(manualReminderAt) : null;
    const remindAt = parsedRemindAt && !Number.isNaN(parsedRemindAt.getTime()) ? parsedRemindAt.toISOString() : undefined;

    setWorkspace((current) => ({
      ...current,
      reminders: [
        {
          id: uid("r"),
          title: manualReminder.trim(),
          trigger: remindAt ? formatReminderTriggerLabel(remindAt) : "Contextual",
          context: "Created manually in Spaxio Assistant.",
          done: false,
          remindAt,
        },
        ...current.reminders,
      ],
    }));
    setManualReminder("");
    setManualReminderAt("");
  }

  async function emailReminder(reminder: Reminder) {
    setReminderEmailStatus({ reminderId: reminder.id, state: "sending", message: "Sending reminder email..." });

    try {
      const response = await fetch("/api/reminders/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipient: userEmail,
          reminder,
        }),
      });
      const data = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        setReminderEmailStatus({
          reminderId: reminder.id,
          state: "error",
          message: data.error ?? "Could not send reminder email.",
        });
        return;
      }

      setReminderEmailStatus({ reminderId: reminder.id, state: "sent", message: "Reminder email sent." });
    } catch {
      setReminderEmailStatus({ reminderId: reminder.id, state: "error", message: "Could not send reminder email." });
    }
  }

  function addSharedFolder() {
    const folder: SharedFolder = {
      id: uid("folder"),
      name: "New shared folder",
      description: "Invite collaborators, add notes, and keep calendar changes visible to everyone.",
      collaboratorIds: [workspace.settings.currentUserId],
      createdBy: workspace.settings.currentUserId,
      updatedAt: new Date().toISOString(),
    };

    setWorkspace((current) => ({
      ...current,
      sharedFolders: [folder, ...current.sharedFolders],
    }));
    setSelectedFolderId(folder.id);
    setActiveView("collaboration");
  }

  function returnToPersonalView() {
    setActiveView("dashboard");
    setQuery("");
    setKindFilter("all");
  }

  function inviteCollaborator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inviteEmail.trim() || !selectedFolder) return;

    const existing = workspace.collaborators.find(
      (collaborator) => collaborator.email.toLowerCase() === inviteEmail.trim().toLowerCase(),
    );
    const collaborator: Collaborator =
      existing ?? {
        id: uid("u"),
        name: inviteName.trim() || inviteEmail.trim().split("@")[0] || "Collaborator",
        email: inviteEmail.trim(),
        color: "bg-amber-500 text-zinc-950",
      };
    const notifications = buildFolderNotifications({
      actorId: workspace.settings.currentUserId,
      body: `${currentUser?.name ?? "A collaborator"} invited ${collaborator.name} to ${selectedFolder.name}.`,
      folderId: selectedFolder.id,
      kind: "share",
      title: "Folder collaborators changed",
    });

    setWorkspace((current) => ({
      ...current,
      collaborators: existing ? current.collaborators : [...current.collaborators, collaborator],
      sharedFolders: current.sharedFolders.map((folder) =>
        folder.id === selectedFolder.id
          ? {
              ...folder,
              collaboratorIds: Array.from(new Set([...folder.collaboratorIds, collaborator.id])),
              updatedAt: new Date().toISOString(),
            }
          : folder,
      ),
      notifications: [...notifications, ...current.notifications],
    }));
    setInviteName("");
    setInviteEmail("");
  }

  function addCalendarEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const calendarFolder = getCalendarTargetFolder();
    if (!calendarTitle.trim() || !calendarStart || !calendarFolder) return;

    const calendarEvent: CalendarEvent = {
      id: uid("cal"),
      title: calendarTitle.trim(),
      startsAt: new Date(calendarStart).toISOString(),
      folderId: calendarFolder.id,
      createdBy: workspace.settings.currentUserId,
      context: `Created in ${calendarFolder.name}.`,
    };
    const notifications = buildFolderNotifications({
      actorId: workspace.settings.currentUserId,
      body: `${currentUser?.name ?? "A collaborator"} added "${calendarEvent.title}" to the shared calendar.`,
      calendarEventId: calendarEvent.id,
      folderId: calendarFolder.id,
      kind: "calendar",
      title: `${currentUser?.name ?? "A collaborator"} added a calendar item`,
    });

    setWorkspace((current) => ({
      ...current,
      calendarEvents: [calendarEvent, ...current.calendarEvents],
      sharedFolders: current.sharedFolders.map((folder) =>
        folder.id === calendarFolder.id ? { ...folder, updatedAt: new Date().toISOString() } : folder,
      ),
      notifications: [...notifications, ...current.notifications],
    }));
    setCalendarTitle("");
    setCalendarStart("");
  }

  function markNotificationRead(notificationId: string) {
    setWorkspace((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, readBy: Array.from(new Set([...notification.readBy, currentUser.id])) }
          : notification,
      ),
    }));
  }

  function markAllNotificationsRead() {
    setWorkspace((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.recipientIds.includes(currentUser.id)
          ? { ...notification, readBy: Array.from(new Set([...notification.readBy, currentUser.id])) }
          : notification,
      ),
    }));
    setAttentionNotificationId(null);
  }

  function openNotification(notification: WorkspaceNotification) {
    markNotificationRead(notification.id);
    setAttentionNotificationId(null);
    setNotificationTrayOpen(false);

    if (notification.folderId) {
      setSelectedFolderId(notification.folderId);
    }

    if (notification.calendarEventId) {
      setActiveView("calendar");
      return;
    }

    if (notification.memoryId) {
      const memory = workspace.memories.find((item) => item.id === notification.memoryId);
      setQuery(memory?.title ?? "");
      setActiveView(notification.folderId ? "collaboration" : "memory");
      return;
    }

    if (notification.folderId) {
      setActiveView("collaboration");
    }
  }

  async function startCheckout(billingInterval: BillingInterval = "monthly") {
    setBillingError("");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ billingInterval }),
      });
      const data = await readJsonResponse<{ url?: string; error?: string }>(response);

      if (data.url) {
        window.location.href = data.url;
      } else {
        setBillingError(data.error ?? "Could not start checkout.");
      }
    } catch {
      setBillingError("Could not start checkout.");
    }
  }

  async function openBillingPortal() {
    setBillingError("");

    try {
      const response = await fetch("/api/stripe/portal", { method: "POST", credentials: "same-origin" });
      const data = await readJsonResponse<{ url?: string; error?: string }>(response);

      if (data.url) {
        window.location.href = data.url;
      } else {
        setBillingError(data.error ?? "Could not open billing portal.");
      }
    } catch {
      setBillingError("Could not open billing portal.");
    }
  }

  async function copyInviteLink() {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 1600);
    } catch {
      setBillingError("Could not copy invite link.");
    }
  }

  async function deleteAccount() {
    if (accountDeleteConfirm !== "DELETE") {
      setBillingError("Type DELETE to confirm account deletion.");
      return;
    }

    setBillingError("");
    setAccountDeleteStatus("deleting");

    if (persistenceMode === "local") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      const data = await readJsonResponse<{ deleted?: boolean; error?: string }>(response);

      if (!response.ok || !data.deleted) {
        setBillingError(data.error ?? "Could not delete account.");
        setAccountDeleteStatus("idle");
        return;
      }

      if (supabase) {
        await supabase.auth.signOut();
      }
      window.location.href = "/";
    } catch {
      setBillingError("Could not delete account.");
      setAccountDeleteStatus("idle");
    }
  }

  async function changeAccountEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = accountEmail.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      setAccountEmailStatus({ state: "error", message: "Enter a valid email address." });
      return;
    }

    if (persistenceMode === "local") {
      setWorkspace((current) => ({
        ...current,
        collaborators: current.collaborators.map((collaborator) =>
          collaborator.id === current.settings.currentUserId ? { ...collaborator, email } : collaborator,
        ),
      }));
      setAccountEmailStatus({ state: "sent", message: "Local account email updated in this browser." });
      return;
    }

    setAccountEmailStatus({ state: "saving", message: "Starting email change..." });

    try {
      const response = await fetch("/api/account/email", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readJsonResponse<{ message?: string; error?: string }>(response);

      if (!response.ok) {
        setAccountEmailStatus({ state: "error", message: data.error ?? "Could not start email change." });
        return;
      }

      setAccountEmailStatus({ state: "sent", message: data.message ?? "Check your email to confirm the change." });
    } catch {
      setAccountEmailStatus({ state: "error", message: "Could not start email change." });
    }
  }

  async function changePromotionEmailPreference(optOut: boolean) {
    const previous = promotionEmailsOptOut;
    setPromotionEmailsOptOut(optOut);

    if (persistenceMode === "local") {
      setPromotionEmailPreferenceStatus({ state: "sent", message: "Local promotion email preference updated." });
      return;
    }

    setPromotionEmailPreferenceStatus({ state: "saving", message: "Saving promotion email preference..." });

    try {
      const response = await fetch("/api/account/promotion-emails", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ optOut }),
      });
      const data = await readJsonResponse<{ promotionEmailsOptOut?: boolean; error?: string }>(response);

      if (!response.ok) {
        setPromotionEmailsOptOut(previous);
        setPromotionEmailPreferenceStatus({ state: "error", message: data.error ?? "Could not save promotion email preference." });
        return;
      }

      setPromotionEmailsOptOut(data.promotionEmailsOptOut === true);
      setPromotionEmailPreferenceStatus({ state: "sent", message: "Promotion email preference saved." });
    } catch {
      setPromotionEmailsOptOut(previous);
      setPromotionEmailPreferenceStatus({ state: "error", message: "Could not save promotion email preference." });
    }
  }

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = "/login";
  }

  const language = workspace.settings.language;
  const activeViewMeta = localizedViewMeta[language][activeView];
  const attentionNotification =
    attentionNotificationId ? unreadNotifications.find((notification) => notification.id === attentionNotificationId) : undefined;

  return (
    <main className="min-h-screen bg-[#f5f6f1] text-zinc-950">
      {bannerPromotion && (
        <PromotionBanner
          promotion={bannerPromotion}
          onView={() => viewPromotion(bannerPromotion.id)}
          onDismiss={() => dismissPromotionBanner(bannerPromotion.id)}
        />
      )}
      {openPromotion && <PromotionModal promotion={openPromotion} onClose={closePromotionModal} />}
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-zinc-200 bg-white px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <BrandLogo className="border border-zinc-200" />
            <div>
              <p className="text-lg font-semibold leading-none">Spaxio Assistant</p>
              <p className="mt-1 text-xs text-zinc-500">{language === "fr" ? "Espace de travail IA" : "AI memory workspace"}</p>
            </div>
          </div>

          <nav className="mt-5 grid auto-cols-max grid-flow-col gap-2 overflow-x-auto pb-1 lg:mt-8 lg:auto-cols-auto lg:grid-flow-row lg:overflow-visible lg:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  aria-current={activeView === item.id ? "page" : undefined}
                  className={`flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-left text-sm transition lg:gap-3 ${
                    activeView === item.id ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  type="button"
                >
                  <Icon size={17} aria-hidden="true" />
                  {navLabels[language][item.id]}
                </button>
              );
            })}
          </nav>

          <section className="mt-8 hidden border-t border-zinc-200 pt-5 lg:block">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              {language === "fr" ? "Espace" : "Workspace"}
            </p>
            <div className="mt-4 grid gap-3 text-sm">
              <Metric label={language === "fr" ? "Memoire" : "Memory"} value={workspace.memories.length.toString()} />
              <Metric label={language === "fr" ? "Taches" : "Tasks"} value={openTasks.length.toString()} />
              <Metric label={language === "fr" ? "Evenements" : "Events"} value={workspace.calendarEvents.length.toString()} />
              <Metric label={language === "fr" ? "Rappels" : "Reminders"} value={workspace.reminders.filter((reminder) => !reminder.done).length.toString()} />
              <Metric label={language === "fr" ? "Partage" : "Shared"} value={workspace.sharedFolders.length.toString()} />
            </div>
          </section>
        </aside>

        <section className="min-w-0 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5">
            <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
	              <div>
	                <p className="text-sm font-medium text-zinc-500">
	                  {workspace.settings.name}
	                  {userEmail ? ` - ${userEmail}` : ""}
	                </p>
	                <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">{activeViewMeta.title}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{activeViewMeta.subtitle}</p>
	              </div>
	              <div className="flex flex-wrap items-center gap-2">
                  <NotificationCenter
                    currentUserId={currentUser.id}
                    isOpen={notificationTrayOpen}
                    notifications={currentUserNotifications}
                    onDismiss={markNotificationRead}
                    onMarkAll={markAllNotificationsRead}
                    onOpen={openNotification}
                    onToggle={() => setNotificationTrayOpen((current) => !current)}
                    unreadCount={unreadNotifications.length}
                  />
                  {!isProPlan && (
                    <button className="primary-button" onClick={() => startCheckout()} type="button">
                      <CreditCard size={17} aria-hidden="true" />
                      {language === "fr" ? "Mettre a niveau" : "Upgrade"}
                    </button>
                  )}
                  {workspace.collaborators.length > 1 && (
                    <select
                      className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
                      onChange={(event) =>
                        setWorkspace((current) => ({
                          ...current,
                          settings: { ...current.settings, currentUserId: event.target.value },
                        }))
                      }
                      title={language === "fr" ? "Utilisateur courant" : "Current user"}
                      value={workspace.settings.currentUserId}
                    >
                      {workspace.collaborators.map((collaborator) => (
                        <option key={collaborator.id} value={collaborator.id}>
                          {collaborator.name}
                        </option>
                      ))}
                    </select>
                  )}
	                <button className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700" onClick={signOut} type="button">
	                  {language === "fr" ? "Deconnexion" : "Sign out"}
	                </button>
	              </div>
            </header>
            {billingError && <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{billingError}</p>}
            {uploadError && <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{uploadError}</p>}

            {dueReminders.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <div className="flex items-start gap-3">
                  <AlarmClock className="mt-0.5 shrink-0 text-amber-700" size={18} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {language === "fr"
                        ? `${dueReminders.length} rappel${dueReminders.length === 1 ? "" : "s"} a traiter`
                        : `${dueReminders.length} reminder${dueReminders.length === 1 ? "" : "s"} due`}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {dueReminders.slice(0, 4).map((reminder) => (
                        <li key={reminder.id} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{reminder.title}</p>
                            <p className="truncate text-xs text-amber-800">
                              {reminder.remindAt ? formatReminderTriggerLabel(reminder.remindAt) : reminder.trigger}
                            </p>
                          </div>
                          <button
                            className="shrink-0 rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                            onClick={() =>
                              setWorkspace((current) => ({
                                ...current,
                                reminders: current.reminders.map((item) =>
                                  item.id === reminder.id ? { ...item, done: true } : item,
                                ),
                              }))
                            }
                            type="button"
                          >
                            {language === "fr" ? "Fait" : "Done"}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {dueReminders.length > 4 && (
                      <button
                        className="mt-2 text-xs font-medium underline"
                        onClick={() => setActiveView("reminders")}
                        type="button"
                      >
                        {language === "fr" ? "Voir tous les rappels" : "View all reminders"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <input className="hidden" multiple onChange={addFiles} ref={fileInputRef} type="file" />

            {activeView === "dashboard" && (
              <Dashboard
                aiAnswer={aiAnswer}
                aiError={aiError}
                aiPrompt={aiPrompt}
                aiStatus={aiStatus}
                completedTasks={completedTasks.length}
                draft={draft}
                filteredMemories={filteredMemories}
                focusTasks={focusTasks}
                memories={personalMemories}
                onAddMemory={addMemory}
                onCaptureMode={changeCaptureMode}
                onDraft={setDraft}
                onAskAi={askWorkspaceAi}
                onAiPrompt={setAiPrompt}
                onNavigate={setActiveView}
                onVoiceAi={requestVoiceAi}
                onVoiceCommit={commitVoiceCapture}
                sharedFolderName={activeSharedFolder?.name}
                onQuery={setQuery}
                onToggleTask={toggleTask}
                captureMode={captureMode}
                query={query}
                reminders={personalReminders}
                tasks={personalTasks}
                voiceAvailable={voiceAvailable}
              />
            )}

            {activeView === "memory" && (
              <MemoryView
                aiAnswer={aiAnswer}
                aiError={aiError}
                aiPrompt={aiPrompt}
                aiStatus={aiStatus}
                filteredMemories={filteredMemories}
                kindFilter={kindFilter}
                onDeleteMemory={deleteMemory}
                onRenameMemory={renameMemory}
                onKindFilter={setKindFilter}
                onAiPrompt={setAiPrompt}
                onAskAi={askWorkspaceAi}
                onVoiceAi={requestVoiceAi}
                onQuery={setQuery}
                query={query}
                voiceAvailable={voiceAvailable}
              />
            )}

            {activeView === "planner" && (
              <PlannerView
                energy={energy}
                focusTasks={focusTasks}
                freeMinutes={freeMinutes}
                manualTask={manualTask}
                onAddTask={addManualTask}
                onEnergy={setEnergy}
                onFreeMinutes={setFreeMinutes}
                onManualTask={setManualTask}
                onToggleTask={toggleTask}
                tasks={scopedTasks}
              />
            )}

            {activeView === "calendar" && (
              <CalendarView
                calendarEvents={sortedCalendarEvents}
                calendarStart={calendarStart}
                calendarTitle={calendarTitle}
                collaborators={workspace.collaborators}
                folders={workspace.sharedFolders}
                onAddCalendarEvent={addCalendarEvent}
                onCalendarStart={setCalendarStart}
                onCalendarTitle={setCalendarTitle}
                selectedFolderName={selectedFolder?.name}
              />
            )}

            {activeView === "collaboration" && selectedFolder && (
              <CollaborationView
                calendarEvents={folderEvents}
                calendarStart={calendarStart}
                calendarTitle={calendarTitle}
                captureMode={captureMode}
                collaborators={workspace.collaborators}
                currentUserId={workspace.settings.currentUserId}
                draft={draft}
                folders={workspace.sharedFolders}
                inviteEmail={inviteEmail}
                inviteName={inviteName}
                isCapturing={aiStatus === "capturing"}
                memories={folderMemories}
                notifications={workspace.notifications}
                onAddCalendarEvent={addCalendarEvent}
                onAddMemory={addMemory}
                onAddFolder={addSharedFolder}
                onCalendarStart={setCalendarStart}
                onCalendarTitle={setCalendarTitle}
                onCaptureMode={changeCaptureMode}
                onDraft={setDraft}
                onFileClick={() => fileInputRef.current?.click()}
                onFolder={setSelectedFolderId}
                onInvite={inviteCollaborator}
                onInviteEmail={setInviteEmail}
                onInviteName={setInviteName}
                onPersonalView={returnToPersonalView}
                onQuery={setQuery}
                onVoiceAi={requestVoiceAi}
                onVoiceCommit={commitVoiceCapture}
                selectedFolder={selectedFolder}
                voiceAvailable={voiceAvailable}
              />
            )}

            {activeView === "reminders" && (
              <RemindersView
                manualReminder={manualReminder}
                manualReminderAt={manualReminderAt}
                nowMs={dueReminderNowMs}
                onAddReminder={addManualReminder}
                onEmailReminder={emailReminder}
                onManualReminder={setManualReminder}
                onManualReminderAt={setManualReminderAt}
                onToggleReminder={(id) =>
                  setWorkspace((current) => ({
                    ...current,
                    reminders: current.reminders.map((reminder) =>
                      reminder.id === id ? { ...reminder, done: !reminder.done } : reminder,
                    ),
                  }))
                }
                reminderEmailStatus={reminderEmailStatus}
                reminders={personalReminders}
              />
            )}

            {activeView === "billing" && (
              <BillingView
                billingError={billingError}
                inviteCopied={inviteCopied}
                inviteUrl={inviteUrl}
                onCopyInviteLink={copyInviteLink}
                onManageBilling={isProPlan ? openBillingPortal : startCheckout}
                plan={plan}
                referralDiscountEligible={referralDiscountEligible}
                subscriptionStatus={subscriptionStatus}
                userEmail={userEmail}
              />
            )}

            {activeView === "settings" && (
              <SettingsView
                accountDeleteConfirm={accountDeleteConfirm}
                accountDeleteStatus={accountDeleteStatus}
                accountEmail={accountEmail}
                accountEmailStatus={accountEmailStatus}
                deleteAccountError={billingError}
                onAccountDeleteConfirm={setAccountDeleteConfirm}
                onAccountEmail={setAccountEmail}
                onChangeAccountEmail={changeAccountEmail}
                onDeleteAccount={deleteAccount}
                onPromotionEmailsOptOut={changePromotionEmailPreference}
                onSettings={(settings) =>
                  setWorkspace((current) => ({
                    ...current,
                    collaborators: current.collaborators.map((collaborator) =>
                      collaborator.id === current.settings.currentUserId ? { ...collaborator, name: settings.name } : collaborator,
                    ),
                    settings,
                  }))
                }
                promotionEmailPreferenceStatus={promotionEmailPreferenceStatus}
                promotionEmailsOptOut={promotionEmailsOptOut}
                persistenceMode={persistenceMode}
                settings={workspace.settings}
                voiceAvailable={voiceAvailable}
              />
            )}
          </div>
        </section>
      </div>
      {attentionNotification && (
        <NotificationToast
          currentUserId={currentUser.id}
          notification={attentionNotification}
          onDismiss={() => markNotificationRead(attentionNotification.id)}
          onOpen={() => openNotification(attentionNotification)}
        />
      )}
    </main>
  );
}

function PromotionBanner({
  promotion,
  onView,
  onDismiss,
}: {
  promotion: Promotion;
  onView: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="border-b border-amber-200 bg-gradient-to-r from-amber-100 via-amber-50 to-rose-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900">
          <Gift size={16} aria-hidden="true" />
        </span>
        <button
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={onView}
          type="button"
        >
          <span className="truncate text-sm font-semibold text-amber-950">{promotion.title}</span>
          <span className="hidden truncate text-sm text-amber-900/80 sm:inline">- {promotion.body}</span>
        </button>
        <button
          className="inline-flex h-8 items-center gap-1 rounded-md bg-zinc-950 px-3 text-xs font-medium text-white transition hover:bg-zinc-800"
          onClick={onView}
          type="button"
        >
          View details
          <ChevronRight size={14} aria-hidden="true" />
        </button>
        <button
          aria-label="Dismiss promotion"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-amber-900/70 transition hover:bg-amber-100 hover:text-amber-950"
          onClick={onDismiss}
          type="button"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function PromotionModal({ promotion, onClose }: { promotion: Promotion; onClose: () => void }) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-900">
            <Gift size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-zinc-950">{promotion.title}</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-zinc-500">
              {new Date(promotion.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <button
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            onClick={onClose}
            type="button"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{promotion.body}</p>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <button
            className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
          {promotion.ctaUrl && (
            <a
              className="inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              href={promotion.ctaUrl}
              rel="noreferrer"
              target="_blank"
            >
              {promotion.ctaLabel || "Learn more"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationCenter({
  currentUserId,
  isOpen,
  notifications,
  onDismiss,
  onMarkAll,
  onOpen,
  onToggle,
  unreadCount,
}: {
  currentUserId: string;
  isOpen: boolean;
  notifications: WorkspaceNotification[];
  onDismiss: (id: string) => void;
  onMarkAll: () => void;
  onOpen: (notification: WorkspaceNotification) => void;
  onToggle: () => void;
  unreadCount: number;
}) {
  return (
    <div className="relative">
      <button
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        className={`relative inline-flex h-10 items-center justify-center rounded-md border bg-white px-3 text-sm font-medium transition ${
          unreadCount
            ? "border-amber-300 text-zinc-950 shadow-sm ring-2 ring-amber-200"
            : "border-zinc-200 text-zinc-700 hover:border-zinc-400"
        }`}
        onClick={onToggle}
        type="button"
      >
        <Bell className={unreadCount ? "animate-pulse text-amber-600" : ""} size={17} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-zinc-200 bg-white p-3 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="mt-0.5 text-xs text-zinc-500">{unreadCount ? `${unreadCount} unread` : "All caught up"}</p>
            </div>
            {notifications.length > 0 && (
              <button className="text-xs font-medium text-zinc-600 hover:text-zinc-950" onClick={onMarkAll} type="button">
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-3 grid max-h-96 gap-2 overflow-y-auto">
            {notifications.slice(0, 8).map((notification) => (
              <NotificationCard
                currentUserId={currentUserId}
                key={notification.id}
                notification={notification}
                onDismiss={onDismiss}
                onOpen={onOpen}
              />
            ))}
            {!notifications.length && <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-500">No notifications yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationToast({
  currentUserId,
  notification,
  onDismiss,
  onOpen,
}: {
  currentUserId: string;
  notification: WorkspaceNotification;
  onDismiss: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="fixed right-4 top-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-md border border-amber-300 bg-white p-3 shadow-2xl ring-4 ring-amber-100">
      <NotificationCard
        currentUserId={currentUserId}
        notification={notification}
        onDismiss={() => onDismiss()}
        onOpen={() => onOpen()}
        prominent
      />
    </div>
  );
}

function NotificationCard({
  currentUserId,
  notification,
  onDismiss,
  onOpen,
  prominent,
}: {
  currentUserId: string;
  notification: WorkspaceNotification;
  onDismiss: (id: string) => void;
  onOpen: (notification: WorkspaceNotification) => void;
  prominent?: boolean;
}) {
  const Icon = notification.kind === "calendar" ? CalendarDays : notification.kind === "share" ? Users : FileText;
  const unread = !notification.readBy.includes(currentUserId);

  return (
    <div className={`rounded-md border p-3 ${unread ? "border-amber-200 bg-amber-50" : "border-zinc-200 bg-white"}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md ${unread ? "bg-amber-500 text-zinc-950" : "bg-zinc-100"}`}>
          <Icon size={17} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">{notification.title}</p>
            {unread && <span className="mt-1 size-2 shrink-0 rounded-full bg-rose-600" aria-hidden="true" />}
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-600">{notification.body}</p>
          <p className="mt-2 text-xs text-zinc-400">{formatDate(notification.createdAt)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="primary-button h-8 px-3 text-xs" onClick={() => onOpen(notification)} type="button">
              View
            </button>
            <button
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 hover:border-zinc-400"
              onClick={() => onDismiss(notification.id)}
              type="button"
            >
              {unread ? "Dismiss" : "Hide"}
            </button>
          </div>
          {prominent && <p className="mt-2 text-xs font-medium text-amber-900">New update needs your attention.</p>}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
      <span className="text-zinc-500">{label}</span>
      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-right font-semibold" title={value}>
        {value}
      </span>
    </div>
  );
}

function CapturePanel({
  captureMode,
  draft,
  isCapturing,
  onAddMemory,
  onCaptureMode,
  onDraft,
  onFileClick,
  onVoiceAi,
  onVoiceCommit,
  sharedFolderName,
  voiceAvailable,
}: {
  captureMode: "text" | "voice";
  draft: string;
  isCapturing?: boolean;
  onAddMemory: (event: FormEvent<HTMLFormElement>) => void;
  onCaptureMode: (mode: "text" | "voice") => void;
  onDraft: (value: string) => void;
  onFileClick?: () => void;
  onVoiceAi: (mode: "ask" | "capture", prompt: string) => Promise<AiWorkspacePlan>;
  onVoiceCommit: (plan: AiWorkspacePlan, sourceText: string) => void;
  sharedFolderName?: string;
  voiceAvailable: boolean;
}) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function stopVoiceCapture() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }

  function startVoiceCapture() {
    if (!voiceAvailable) {
      setVoiceMessage("Voice capture is available on Pro.");
      onCaptureMode("voice");
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setVoiceMessage("Voice capture is not supported in this browser.");
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    onCaptureMode("voice");
    setIsListening(true);
    setVoiceMessage("Listening...");

    let finalTranscript = draft.trim();
    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let index = event.resultIndex ?? 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript.trim();
        if (!transcript) continue;

        if (result.isFinal) {
          finalTranscript = `${finalTranscript}${finalTranscript ? " " : ""}${transcript}`.trim();
        } else {
          interimTranscript = `${interimTranscript} ${transcript}`.trim();
        }
      }

      onDraft(`${finalTranscript}${interimTranscript ? `${finalTranscript ? " " : ""}${interimTranscript}` : ""}`.trim());
    };
    recognition.onerror = (event) => {
      setVoiceMessage(event.error === "not-allowed" ? "Microphone access was blocked." : "Voice capture stopped.");
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      setVoiceMessage(finalTranscript ? "Voice captured. Review it, then add." : "");
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceMessage("Voice capture could not start.");
      recognitionRef.current = null;
    }
  }

  function toggleVoiceCapture() {
    if (isListening) {
      stopVoiceCapture();
      return;
    }

    startVoiceCapture();
  }

  return (
    <section className="panel p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Capture anything</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {captureMode === "voice"
              ? "Talk to Spaxio Assistant: capture a note or ask what's coming up"
              : "Notes, links, files, tasks, or study material"}
            {sharedFolderName ? ` shared to ${sharedFolderName}.` : "."}
          </p>
        </div>
        <div className="flex rounded-md border border-zinc-200 bg-zinc-50 p-1">
          <button
            className={`segmented ${captureMode === "text" ? "segmented-active" : ""}`}
            onClick={() => onCaptureMode("text")}
            type="button"
          >
            <FileText size={16} aria-hidden="true" />
            Text
          </button>
          <button
            className={`segmented ${captureMode === "voice" ? "segmented-active" : ""}`}
            onClick={() => {
              onCaptureMode("voice");
              if (!voiceAvailable) {
                setVoiceMessage("Voice capture is available on Pro.");
                return;
              }
              if (!isListening) setVoiceMessage("");
            }}
            title={voiceAvailable ? "Voice capture" : "Voice capture requires Pro"}
            type="button"
          >
            <Mic2 size={16} aria-hidden="true" />
            Voice{voiceAvailable ? "" : " Pro"}
          </button>
        </div>
      </div>
      {captureMode === "voice" ? (
        <VoiceStudio callAi={onVoiceAi} commitCapture={onVoiceCommit} voiceAvailable={voiceAvailable} />
      ) : (
        <form className="contents" onSubmit={onAddMemory}>
          <textarea
            className="mt-3 min-h-32 w-full resize-none rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-zinc-400 focus:bg-white"
            onChange={(event) => onDraft(event.target.value)}
            placeholder="Example: Finish the landing page before Friday. Study variance analysis tonight."
            value={draft}
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button className="icon-button" onClick={onFileClick} title="Attach files" type="button">
                <Paperclip size={17} aria-hidden="true" />
              </button>
              <button
                className={`icon-button ${isListening ? "border-rose-300 bg-rose-50 text-rose-700" : ""}`}
                onClick={toggleVoiceCapture}
                title={!voiceAvailable ? "Voice capture requires Pro" : isListening ? "Stop voice capture" : "Start voice capture"}
                type="button"
              >
                <Mic2 size={17} aria-hidden="true" />
              </button>
              <button
                className="icon-button"
                onClick={() => onDraft(`${draft}${draft ? "\n" : ""}https://youtube.com/watch?v=example`)}
                title="Add link"
                type="button"
              >
                <Link size={17} aria-hidden="true" />
              </button>
              <button
                className="icon-button"
                onClick={() => onDraft(`${draft}${draft ? "\n" : ""}Screenshot of assignment instructions due next week.`)}
                title="Add screenshot note"
                type="button"
              >
                <ImageIcon size={17} aria-hidden="true" />
              </button>
            </div>
            <button className="primary-button" disabled={isCapturing} type="submit">
              <Plus size={17} aria-hidden="true" />
              {isCapturing ? "Structuring" : "Add"}
            </button>
          </div>
          {voiceMessage && <p className="mt-2 text-xs font-medium text-zinc-500">{voiceMessage}</p>}
        </form>
      )}
    </section>
  );
}

type VoicePhase = "idle" | "listening" | "thinking" | "confirming" | "confirmListening" | "editingInput" | "answering";
type VoiceTurn = { role: "user" | "assistant"; text: string };

function VoiceStudio({
  callAi,
  commitCapture,
  intentMode = "auto",
  voiceAvailable,
}: {
  callAi: (mode: "ask" | "capture", prompt: string) => Promise<AiWorkspacePlan>;
  commitCapture?: (plan: AiWorkspacePlan, sourceText: string) => void;
  intentMode?: "auto" | "ask" | "capture";
  voiceAvailable: boolean;
}) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const phaseRef = useRef<VoicePhase>("idle");
  const pendingRef = useRef<{ plan: AiWorkspacePlan; transcript: string } | null>(null);
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [interim, setInterim] = useState("");
  const [transcript, setTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [history, setHistory] = useState<VoiceTurn[]>([]);
  const [pending, setPending] = useState<{ plan: AiWorkspacePlan; transcript: string } | null>(null);
  const recognitionSupported = useMemo(() => Boolean(getSpeechRecognitionConstructor()), []);

  function updatePhase(next: VoicePhase) {
    phaseRef.current = next;
    setPhase(next);
  }

  function updatePending(next: { plan: AiWorkspacePlan; transcript: string } | null) {
    pendingRef.current = next;
    setPending(next);
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      stopSpeaking();
    };
  }, []);

  function startRecognition(onFinal: (finalText: string) => void) {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setErrorMessage("Voice capture is not supported in this browser.");
      updatePhase("idle");
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    setInterim("");
    let finalText = "";
    let latestInterim = "";
    let silenceTimeout: number | null = null;
    let completed = false;

    const clearSilenceTimer = () => {
      if (silenceTimeout !== null) {
        window.clearTimeout(silenceTimeout);
        silenceTimeout = null;
      }
    };
    const finish = () => {
      if (completed) return;
      completed = true;
      clearSilenceTimer();
      recognitionRef.current = null;
      setInterim("");
      onFinal((finalText || latestInterim).trim());
    };
    const scheduleSilenceStop = () => {
      clearSilenceTimer();
      silenceTimeout = window.setTimeout(() => {
        if (recognitionRef.current === recognition) {
          setStatusMessage("Processing...");
          try {
            recognition.stop();
          } catch {
            finish();
          }
        }
      }, finalText ? 2800 : 4000);
    };

    recognition.onresult = (event) => {
      let interimText = "";
      for (let index = event.resultIndex ?? 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const chunk = result[0]?.transcript.trim();
        if (!chunk) continue;
        if (result.isFinal) {
          finalText = `${finalText}${finalText ? " " : ""}${chunk}`.trim();
        } else {
          interimText = `${interimText} ${chunk}`.trim();
        }
      }
      latestInterim = interimText || latestInterim;
      setInterim(interimText);
      if (finalText) setTranscript(finalText);
      if (finalText || interimText) scheduleSilenceStop();
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setErrorMessage("Microphone access was blocked.");
      } else if (event.error && event.error !== "no-speech" && event.error !== "aborted") {
        setErrorMessage("Voice capture stopped.");
      }
      finish();
    };
    recognition.onend = () => {
      finish();
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setErrorMessage("Could not start microphone.");
      updatePhase("idle");
    }
  }

  function stopRecognition() {
    recognitionRef.current?.stop();
  }

  function resetSession() {
    updatePending(null);
    setTranscript("");
    setInterim("");
    setStatusMessage("");
    updatePhase("idle");
  }

  function announce(text: string, after?: () => void) {
    setHistory((prev) => (text ? [...prev, { role: "assistant", text }] : prev));
    speakText(text, () => after?.());
  }

  function handleCaptureFinal(finalText: string) {
    if (!finalText) {
      setStatusMessage("");
      updatePhase("idle");
      return;
    }
    setHistory((prev) => [...prev, { role: "user", text: finalText }]);
    setTranscript(finalText);
    setStatusMessage("Thinking...");
    updatePhase("thinking");

    const intent: "ask" | "capture" =
      intentMode === "ask" ? "ask" : intentMode === "capture" ? "capture" : looksLikeQuestion(finalText) ? "ask" : "capture";

    callAi(intent, finalText)
      .then((plan) => {
        const answer = (plan.answer ?? "").trim();
        if (intent === "ask") {
          const spoken = answer || "I don't have anything on that yet.";
          setStatusMessage("");
          updatePhase("answering");
          announce(spoken, () => {
            if (phaseRef.current === "answering") {
              updatePhase("idle");
            }
          });
        } else {
          updatePending({ plan, transcript: finalText });
          const confirmLine = formatVoiceCaptureRecap(plan, finalText);
          setStatusMessage("Say yes to save, edit to change, or cancel.");
          updatePhase("confirming");
          announce(confirmLine, () => {
            if (phaseRef.current === "confirming") {
              updatePhase("confirmListening");
              startRecognition(handleCommandFinal);
            }
          });
        }
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "AI request failed.");
        setStatusMessage("");
        updatePhase("idle");
      });
  }

  function handleCommandFinal(finalText: string) {
    if (!finalText) {
      setStatusMessage("Say yes to save, edit to change, or cancel.");
      updatePhase("confirming");
      return;
    }
    setHistory((prev) => [...prev, { role: "user", text: finalText }]);
    const { command, remainder } = matchVoiceCommand(finalText);
    if (command === "confirm") {
      handleSave();
      return;
    }
    if (command === "cancel") {
      handleCancel();
      return;
    }
    if (command === "edit") {
      if (remainder) {
        applyEdit(remainder);
      } else {
        startEditFlow();
      }
      return;
    }
    applyEdit(finalText);
  }

  function handleEditFinal(finalText: string) {
    if (!finalText) {
      setStatusMessage("No edit captured.");
      updatePhase("confirming");
      announce("I didn't catch that. Try again or say cancel.");
      return;
    }
    setHistory((prev) => [...prev, { role: "user", text: finalText }]);
    applyEdit(finalText);
  }

  function applyEdit(editInstruction: string) {
    const currentPending = pendingRef.current;
    if (!currentPending) {
      resetSession();
      return;
    }
    setStatusMessage("Updating...");
    updatePhase("thinking");
    const editPrompt = `The user is editing a captured note. Original note: "${currentPending.transcript}". Apply this change: "${editInstruction}". Return the updated capture (memory + any tasks, reminders, calendar events).`;

    callAi("capture", editPrompt)
      .then((plan) => {
        const updatedTranscript =
          typeof plan.memory?.body === "string" && plan.memory.body.trim() ? plan.memory.body.trim() : currentPending.transcript;
        updatePending({ plan, transcript: updatedTranscript });
        const confirmLine = `Updated. ${formatVoiceCaptureRecap(plan, updatedTranscript)}`;
        setTranscript(updatedTranscript);
        setStatusMessage("Say yes to save, edit to change again, or cancel.");
        updatePhase("confirming");
        announce(confirmLine, () => {
          if (phaseRef.current === "confirming") {
            updatePhase("confirmListening");
            startRecognition(handleCommandFinal);
          }
        });
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "AI request failed.");
        setStatusMessage("");
        updatePhase("confirming");
      });
  }

  function startEditFlow() {
    setStatusMessage("Listening for your changes...");
    updatePhase("editingInput");
    announce("What would you like to change?", () => {
      if (phaseRef.current === "editingInput") {
        startRecognition(handleEditFinal);
      }
    });
  }

  function handleSave() {
    const currentPending = pendingRef.current;
    if (!currentPending || !commitCapture) {
      resetSession();
      return;
    }
    commitCapture(currentPending.plan, currentPending.transcript);
    setStatusMessage("Saved.");
    updatePending(null);
    setTranscript("");
    updatePhase("idle");
    announce("Saved.");
  }

  function handleCancel() {
    stopSpeaking();
    updatePending(null);
    setTranscript("");
    setStatusMessage("Cancelled.");
    updatePhase("idle");
    announce("Cancelled.");
  }

  function handleMicClick() {
    setErrorMessage("");
    if (!voiceAvailable) {
      setErrorMessage("Voice capture is available on Pro.");
      return;
    }
    if (!recognitionSupported) {
      setErrorMessage("Voice capture is not supported in this browser.");
      return;
    }

    if (phase === "idle" || phase === "answering") {
      stopSpeaking();
      setTranscript("");
      setInterim("");
      setStatusMessage("Listening. Pause when you're done.");
      updatePhase("listening");
      startRecognition(handleCaptureFinal);
      return;
    }
    if (phase === "listening") {
      setStatusMessage("Processing...");
      stopRecognition();
      return;
    }
    if (phase === "confirming") {
      stopSpeaking();
      setStatusMessage("Listening for your response...");
      updatePhase("confirmListening");
      startRecognition(handleCommandFinal);
      return;
    }
    if (phase === "confirmListening" || phase === "editingInput") {
      stopRecognition();
      return;
    }
  }

  const isBusyListening = phase === "listening" || phase === "confirmListening" || phase === "editingInput";
  const isThinking = phase === "thinking";
  const showConfirmActions = phase === "confirming" || phase === "confirmListening";

  const micLabel = !voiceAvailable
    ? "Voice requires Pro"
    : !recognitionSupported
    ? "Voice not supported"
    : isBusyListening
    ? "Listening..."
    : isThinking
    ? "Working..."
    : phase === "confirming"
    ? "Reply by voice"
    : phase === "answering"
    ? "Start listening again"
    : "Start listening";

  const micTone = isBusyListening
    ? "bg-rose-600 text-white border-rose-700 shadow-lg shadow-rose-200 animate-pulse"
    : isThinking
    ? "bg-zinc-200 text-zinc-500 border-zinc-300"
    : phase === "confirming"
    ? "bg-amber-500 text-white border-amber-600"
    : "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800";

  const displayedTranscript = transcript || interim;

  return (
    <div className="mt-4 flex flex-col items-stretch gap-4">
      {!voiceAvailable && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Voice capture is available on Pro. Upgrade in Billing to enable.
        </p>
      )}
      {voiceAvailable && !recognitionSupported && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This browser does not support voice capture. Try Chrome, Edge, or Safari.
        </p>
      )}

      <div className="flex flex-col items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-6">
        <button
          className={`flex size-24 items-center justify-center rounded-full border-2 transition ${micTone} ${
            !voiceAvailable || !recognitionSupported ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={!voiceAvailable || !recognitionSupported || isThinking}
          onClick={handleMicClick}
          type="button"
        >
          <Mic2 size={36} aria-hidden="true" />
        </button>
        <p className="text-sm font-medium text-zinc-700">{micLabel}</p>
        {statusMessage && <p className="text-xs text-zinc-500">{statusMessage}</p>}

        {displayedTranscript && (
          <div className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-700">
            <span>{transcript}</span>
            {interim && <span className="text-zinc-400">{transcript ? " " : ""}{interim}</span>}
          </div>
        )}

        {showConfirmActions && pending && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <button className="primary-button" onClick={handleSave} type="button">
              <Check size={16} aria-hidden="true" />
              Save
            </button>
            <button className="icon-button px-3" onClick={startEditFlow} type="button" style={{ width: "auto" }}>
              Edit
            </button>
            <button className="icon-button px-3" onClick={handleCancel} type="button" style={{ width: "auto" }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Conversation</p>
            <button
              className="text-xs text-zinc-500 hover:text-zinc-900"
              onClick={() => {
                stopSpeaking();
                setHistory([]);
                resetSession();
              }}
              type="button"
            >
              Clear
            </button>
          </div>
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {history.slice(-10).map((turn, index) => (
              <div
                key={index}
                className={`rounded-md px-3 py-2 text-sm leading-5 ${
                  turn.role === "user" ? "bg-zinc-50 text-zinc-800" : "bg-zinc-900 text-white"
                }`}
              >
                <span className="mr-2 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                  {turn.role === "user" ? "You" : "Spaxio Assistant"}
                </span>
                {turn.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{errorMessage}</p>
      )}
    </div>
  );
}

function AiAssistantPanel({
  answer,
  buttonLabel = "Ask",
  description,
  error,
  isAsking,
  onPrompt,
  onSubmit,
  placeholder = "What do I have coming up this week?",
  prompt,
  title = "Ask Spaxio Assistant",
}: {
  answer: string;
  buttonLabel?: string;
  description?: string;
  error: string;
  isAsking: boolean;
  onPrompt: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  placeholder?: string;
  prompt: string;
  title?: string;
}) {
  return (
    <section className="panel p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={17} aria-hidden="true" />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {description && <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>}
      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        <textarea
          className="min-h-24 resize-none rounded-md border border-zinc-200 px-3 py-2 text-sm leading-6 outline-none focus:border-zinc-400"
          onChange={(event) => onPrompt(event.target.value)}
          placeholder={placeholder}
          value={prompt}
        />
        <button className="primary-button w-full" disabled={isAsking} type="submit">
          <Send size={16} aria-hidden="true" />
          {isAsking ? "Thinking" : buttonLabel}
        </button>
      </form>
      {answer && <p className="mt-4 rounded-md bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">{answer}</p>}
      {error && <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">{error}</p>}
    </section>
  );
}

function Dashboard(props: {
  aiAnswer: string;
  aiError: string;
  aiPrompt: string;
  aiStatus: "idle" | "asking" | "capturing";
  captureMode: "text" | "voice";
  completedTasks: number;
  draft: string;
  filteredMemories: Memory[];
  focusTasks: Task[];
  memories: Memory[];
  onAddMemory: (event: FormEvent<HTMLFormElement>) => void;
  onCaptureMode: (mode: "text" | "voice") => void;
  onDraft: (value: string) => void;
  onAiPrompt: (value: string) => void;
  onAskAi: (event: FormEvent<HTMLFormElement>) => void;
  onQuery: (value: string) => void;
  onNavigate: (view: View) => void;
  onToggleTask: (id: string) => void;
  onVoiceAi: (mode: "ask" | "capture", prompt: string) => Promise<AiWorkspacePlan>;
  onVoiceCommit: (plan: AiWorkspacePlan, sourceText: string) => void;
  query: string;
  reminders: Reminder[];
  sharedFolderName?: string;
  tasks: Task[];
  voiceAvailable: boolean;
}) {
  const latest = props.memories.slice(0, 3);
  const activeReminders = props.reminders.filter((reminder) => !reminder.done).slice(0, 3);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-5">
        <CapturePanel
          captureMode={props.captureMode}
          draft={props.draft}
          isCapturing={props.aiStatus === "capturing"}
          onAddMemory={props.onAddMemory}
          onCaptureMode={props.onCaptureMode}
          onDraft={props.onDraft}
          onVoiceAi={props.onVoiceAi}
          onVoiceCommit={props.onVoiceCommit}
          sharedFolderName={props.sharedFolderName}
          voiceAvailable={props.voiceAvailable}
        />
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard icon={Archive} label="Memory items" value={props.memories.length.toString()} tone="zinc" />
          <StatCard icon={ListChecks} label="Completed tasks" value={props.completedTasks.toString()} tone="emerald" />
          <StatCard icon={AlarmClock} label="Open reminders" value={props.reminders.filter((reminder) => !reminder.done).length.toString()} tone="amber" />
        </section>
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {navItems
            .filter((item) => ["memory", "planner", "calendar"].includes(item.id))
            .map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className="flex h-12 items-center justify-between rounded-md border border-zinc-200 bg-white px-3 text-left text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
                  key={item.id}
                  onClick={() => props.onNavigate(item.id)}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <Icon size={16} aria-hidden="true" />
                    {item.label}
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              );
            })}
        </section>
        <section className="panel p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Latest memory</h2>
              <p className="mt-1 text-sm text-zinc-500">Recent captures with tags and tasks.</p>
            </div>
            <Sparkles className="text-zinc-400" size={18} aria-hidden="true" />
          </div>
          <div className="mt-4 grid gap-3">
            {latest.map((memory) => (
              <MemoryRow key={memory.id} memory={memory} onQuery={props.onQuery} />
            ))}
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-5">
        <AiAssistantPanel
          answer={props.aiAnswer}
          error={props.aiError}
          isAsking={props.aiStatus === "asking"}
          onPrompt={props.onAiPrompt}
          onSubmit={props.onAskAi}
          prompt={props.aiPrompt}
        />
        <PlanPanel focusTasks={props.focusTasks} onToggleTask={props.onToggleTask} />
        <section className="panel p-4">
          <h2 className="text-base font-semibold">Contextual reminders</h2>
          <div className="mt-4 grid gap-3">
            {activeReminders.map((reminder) => (
              <div className="rounded-md border border-zinc-200 p-3" key={reminder.id}>
                <p className="text-sm font-medium">{reminder.title}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{reminder.trigger}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: ElementType; label: string; value: string; tone: "zinc" | "emerald" | "amber" }) {
  const toneClass = {
    zinc: "bg-zinc-950 text-white",
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-500 text-zinc-950",
  }[tone];

  return (
    <div className="panel p-4">
      <div className={`flex size-9 items-center justify-center rounded-md ${toneClass}`}>
        <Icon size={17} aria-hidden="true" />
      </div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </div>
  );
}

function MemoryView(props: {
  aiAnswer: string;
  aiError: string;
  aiPrompt: string;
  aiStatus: "idle" | "asking" | "capturing";
  filteredMemories: Memory[];
  kindFilter: MemoryKind | "all";
  onDeleteMemory: (id: string) => void;
  onRenameMemory: (id: string, name: string) => void;
  onAiPrompt: (value: string) => void;
  onAskAi: (event: FormEvent<HTMLFormElement>) => void;
  onKindFilter: (kind: MemoryKind | "all") => void;
  onQuery: (value: string) => void;
  onVoiceAi: (mode: "ask" | "capture", prompt: string) => Promise<AiWorkspacePlan>;
  query: string;
  voiceAvailable: boolean;
}) {
  const memoryGroups = groupedMemories(props.filteredMemories);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <MemoryVoicePanel callAi={props.onVoiceAi} voiceAvailable={props.voiceAvailable} />
          <AiAssistantPanel
            answer={props.aiAnswer}
            buttonLabel="Ask memory"
            error={props.aiError}
            isAsking={props.aiStatus === "asking"}
            onPrompt={props.onAiPrompt}
            onSubmit={props.onAskAi}
            placeholder="Ask what you told me about anniversaries, birthdays, subscriptions, or plans"
            prompt={props.aiPrompt}
            title="Type to memory"
          />
        </div>
        <section className="flex flex-col gap-5">
          {memoryGroups.map(([category, memories]) => (
            <div className="grid gap-3" key={category}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">{category}</h2>
                <span className="chip">{memories.length} notes</span>
              </div>
              {memories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onDelete={props.onDeleteMemory}
                  onQuery={props.onQuery}
                  onRename={props.onRenameMemory}
                />
              ))}
            </div>
          ))}
          {!memoryGroups.length && <p className="panel p-4 text-sm text-zinc-500">No notes match this filter.</p>}
        </section>
      </div>
      <aside className="flex h-fit flex-col gap-5">
        <section className="panel p-4">
          <div className="flex items-center gap-2">
            <Filter size={17} aria-hidden="true" />
            <h2 className="text-base font-semibold">Filter</h2>
          </div>
          <input
            className="mt-4 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
            onChange={(event) => props.onQuery(event.target.value)}
            placeholder="Search memory first"
            value={props.query}
          />
          <div className="mt-4 grid gap-2">
            {(["all", "note", "document", "deadline", "voice", "link", "image"] as Array<MemoryKind | "all">).map((kind) => (
              <button
                className={`flex h-9 items-center justify-between rounded-md border px-3 text-sm ${
                  props.kindFilter === kind ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 text-zinc-600"
                }`}
                key={kind}
                onClick={() => props.onKindFilter(kind)}
                type="button"
              >
                {kind === "all" ? "All memories" : kindMeta[kind].label}
                <Check className={props.kindFilter === kind ? "opacity-100" : "opacity-0"} size={15} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function MemoryVoicePanel({
  callAi,
  voiceAvailable,
}: {
  callAi: (mode: "ask" | "capture", prompt: string) => Promise<AiWorkspacePlan>;
  voiceAvailable: boolean;
}) {
  return (
    <section className="panel p-4">
      <div className="flex items-center gap-2">
        <Mic2 size={17} aria-hidden="true" />
        <h2 className="text-base font-semibold">Talk to memory</h2>
      </div>
      <VoiceStudio callAi={callAi} intentMode="ask" voiceAvailable={voiceAvailable} />
    </section>
  );
}

function MemoryCard({
  memory,
  onDelete,
  onQuery,
  onRename,
}: {
  memory: Memory;
  onDelete: (id: string) => void;
  onQuery: (value: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const Icon = kindMeta[memory.kind].icon;
  const memoryTags = Array.from(new Set([...memory.projects, ...memory.entities, ...memory.people])).slice(0, 10);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(memory.recurringEvent?.name ?? memory.title);

  function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = nameDraft.trim();
    if (!nextName) return;
    onRename(memory.id, nextName);
    setIsRenaming(false);
  }

  return (
    <article className="panel p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${kindMeta[memory.kind].className}`}>
              <Icon size={13} aria-hidden="true" />
              {kindMeta[memory.kind].label}
            </span>
            <span className="text-xs text-zinc-500">{formatDate(memory.createdAt)}</span>
            <span className="text-xs text-zinc-500">{memory.source}</span>
          </div>
          {isRenaming ? (
            <form className="mt-3 flex max-w-xl gap-2" onSubmit={submitRename}>
              <input
                className="h-10 min-w-0 flex-1 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
                onChange={(event) => setNameDraft(event.target.value)}
                value={nameDraft}
              />
              <button className="icon-button size-10" title="Save name" type="submit">
                <Check size={16} aria-hidden="true" />
              </button>
              <button
                className="icon-button size-10"
                onClick={() => {
                  setNameDraft(memory.recurringEvent?.name ?? memory.title);
                  setIsRenaming(false);
                }}
                title="Cancel rename"
                type="button"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </form>
          ) : (
            <h2 className="mt-3 text-lg font-semibold">{memory.recurringEvent?.name ?? memory.title}</h2>
          )}
          {memory.recurringEvent && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                <CalendarDays size={13} aria-hidden="true" />
                {formatRecurringEvent(memory.recurringEvent)}
              </span>
              <span className="text-xs text-zinc-500">{titleCase(memory.recurringEvent.type)}</span>
            </div>
          )}
          <p className="mt-2 text-sm leading-6 text-zinc-600">{memory.summary}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{memory.body}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {memory.recurringEvent && (
            <button
              className="icon-button"
              onClick={() => {
                setNameDraft(memory.recurringEvent?.name ?? memory.title);
                setIsRenaming(true);
              }}
              title="Rename memory"
              type="button"
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
          )}
          <button className="icon-button" onClick={() => onDelete(memory.id)} title="Delete memory" type="button">
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {memoryTags.map((entity) => (
          <button className="chip" key={entity} onClick={() => onQuery(entity)} type="button">
            {entity}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {memory.actions.map((action) => (
          <div className="flex items-center gap-2 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-700" key={action}>
            <Zap className="text-amber-500" size={15} aria-hidden="true" />
            {action}
          </div>
        ))}
      </div>
    </article>
  );
}

function MemoryRow({ memory, onQuery }: { memory: Memory; onQuery: (value: string) => void }) {
  const Icon = kindMeta[memory.kind].icon;
  const memoryEntities = Array.from(new Set(memory.entities)).slice(0, 4);
  const category = memoryCategory(memory);

  return (
    <div className="rounded-md border border-zinc-200 p-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-zinc-100">
          <Icon size={16} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{memory.title}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{memory.summary}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button className="mini-chip" onClick={() => onQuery(category)} type="button">
              {readableCategory(category)}
            </button>
            {memoryEntities.map((entity) => (
              <button className="mini-chip" key={entity} onClick={() => onQuery(entity)} type="button">
                {entity}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlannerView(props: {
  energy: Energy;
  focusTasks: Task[];
  freeMinutes: number;
  manualTask: string;
  onAddTask: (event: FormEvent<HTMLFormElement>) => void;
  onEnergy: (energy: Energy) => void;
  onFreeMinutes: (minutes: number) => void;
  onManualTask: (value: string) => void;
  onToggleTask: (id: string) => void;
  tasks: Task[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="panel p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold">Daily plan</h2>
            <p className="mt-1 text-sm text-zinc-500">Set energy and time; the plan updates.</p>
          </div>
          <form className="flex gap-2" onSubmit={props.onAddTask}>
            <input
              className="h-10 min-w-0 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
              onChange={(event) => props.onManualTask(event.target.value)}
              placeholder="Add task"
              value={props.manualTask}
            />
            <button className="icon-button" title="Add task" type="submit">
              <Plus size={17} aria-hidden="true" />
            </button>
          </form>
        </div>
        <div className="mt-5 grid gap-3">
          {props.tasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggleTask={props.onToggleTask} />
          ))}
        </div>
      </section>

      <aside className="flex flex-col gap-5">
        <section className="panel p-4">
          <h2 className="text-base font-semibold">Controls</h2>
          <label className="mt-4 block text-sm font-medium">Energy</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["low", "steady", "high"] as Energy[]).map((level) => (
              <button
                className={`h-9 rounded-md border text-sm capitalize ${
                  props.energy === level ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 text-zinc-600"
                }`}
                key={level}
                onClick={() => props.onEnergy(level)}
                type="button"
              >
                {level}
              </button>
            ))}
          </div>
          <label className="mt-4 block text-sm font-medium">Free minutes</label>
          <input
            className="mt-2 w-full"
            max={360}
            min={30}
            onChange={(event) => props.onFreeMinutes(Number(event.target.value))}
            step={15}
            type="range"
            value={props.freeMinutes}
          />
          <p className="mt-2 text-sm text-zinc-500">{props.freeMinutes} minutes available</p>
        </section>
        <PlanPanel focusTasks={props.focusTasks} onToggleTask={props.onToggleTask} />
      </aside>
    </div>
  );
}

function PlanPanel({ focusTasks, onToggleTask }: { focusTasks: Task[]; onToggleTask: (id: string) => void }) {
  return (
    <section className="panel p-4">
      <div className="flex items-center gap-2">
        <Clock3 size={17} aria-hidden="true" />
        <h2 className="text-base font-semibold">Best next blocks</h2>
      </div>
      <div className="mt-4 grid gap-3">
        {focusTasks.map((task) => (
          <TaskRow compact key={task.id} task={task} onToggleTask={onToggleTask} />
        ))}
        {!focusTasks.length && <p className="text-sm text-zinc-500">No open tasks fit the current window.</p>}
      </div>
    </section>
  );
}

function TaskRow({ compact, task, onToggleTask }: { compact?: boolean; task: Task; onToggleTask: (id: string) => void }) {
  return (
    <button
      className={`flex w-full items-start gap-3 rounded-md border border-zinc-200 p-3 text-left hover:border-zinc-400 ${
        task.status === "done" ? "bg-emerald-50" : "bg-white"
      }`}
      onClick={() => onToggleTask(task.id)}
      type="button"
    >
      {task.status === "done" ? (
        <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} aria-hidden="true" />
      ) : (
        <Circle className="mt-0.5 shrink-0 text-zinc-300" size={18} aria-hidden="true" />
      )}
      <span className="min-w-0">
        <span className="block text-sm font-medium">{task.title}</span>
        <span className="mt-1 block text-xs text-zinc-500">
          {task.project} - {task.estimate} min - {task.due}
        </span>
        {!compact && task.status === "done" && <span className="mt-1 block text-xs text-emerald-700">Completed</span>}
      </span>
    </button>
  );
}

function CalendarEventPill({
  collaborators,
  event,
  folders,
  compact,
}: {
  collaborators: Collaborator[];
  event: CalendarEvent;
  folders: SharedFolder[];
  compact?: boolean;
}) {
  const author = collaborators.find((collaborator) => collaborator.id === event.createdBy);
  const folder = folders.find((item) => item.id === event.folderId);

  return (
    <div className="rounded-md bg-white p-2 text-xs shadow-sm ring-1 ring-zinc-200">
      <p className="font-medium leading-4">{event.title}</p>
      <p className="mt-1 text-zinc-500">{formatCalendarTime(event.startsAt)}</p>
      {!compact && (
        <p className="mt-2 leading-5 text-zinc-500">
          {folder?.name ?? "Calendar"} - {author?.name ?? "Spaxio Assistant"}
        </p>
      )}
      {!compact && event.sourceMemoryId && <p className="mt-1 text-zinc-400">Generated from captured task</p>}
    </div>
  );
}

function DateTimePicker({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const selectedDate = parseDateTimeLocalValue(value);
  const defaultDate = new Date();
  defaultDate.setHours(9, 0, 0, 0);
  const activeDate = selectedDate ?? defaultDate;
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(activeDate.getFullYear(), activeDate.getMonth(), 1));
  const monthDays = calendarMonthDays(visibleMonth);
  const hours = Array.from({ length: 24 }, (_, index) => index);
  const minutes = [0, 15, 30, 45];
  const activeMinute = minutes.reduce((closest, minute) =>
    Math.abs(minute - activeDate.getMinutes()) < Math.abs(closest - activeDate.getMinutes()) ? minute : closest,
  );

  function commitDate(date: Date) {
    const next = new Date(date);
    next.setHours(activeDate.getHours(), activeDate.getMinutes(), 0, 0);
    onChange(toDateTimeLocalValue(next));
  }

  function commitTime(hour: number, minute: number) {
    const next = new Date(activeDate);
    next.setHours(hour, minute, 0, 0);
    onChange(toDateTimeLocalValue(next));
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <button className="icon-button size-9" onClick={() => setVisibleMonth((current) => addMonths(current, -1))} title="Previous month" type="button">
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <p className="text-sm font-semibold">
          {visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <button className="icon-button size-9" onClick={() => setVisibleMonth((current) => addMonths(current, 1))} title="Next month" type="button">
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
        {dayNames.map((day) => (
          <span key={day}>{day.slice(0, 1)}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {monthDays.map((day) => {
          const isSelected = selectedDate ? calendarDateKey(day) === calendarDateKey(selectedDate) : false;
          const isToday = calendarDateKey(day) === calendarDateKey(new Date());
          const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();

          return (
            <button
              className={`flex h-9 items-center justify-center rounded-md border text-sm transition ${
                isSelected
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : isToday
                    ? "border-zinc-950 bg-white text-zinc-950"
                    : "border-transparent bg-white text-zinc-700 hover:border-zinc-300"
              } ${isCurrentMonth ? "" : "opacity-45"}`}
              key={day.toISOString()}
              onClick={() => commitDate(day)}
              type="button"
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <select
          className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
          onChange={(event) => commitTime(Number(event.target.value), activeDate.getMinutes())}
          value={activeDate.getHours()}
        >
          {hours.map((hour) => (
            <option key={hour} value={hour}>
              {padDatePart(hour)}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
          onChange={(event) => commitTime(activeDate.getHours(), Number(event.target.value))}
          value={activeMinute}
        >
          {minutes.map((minute) => (
            <option key={minute} value={minute}>
              {padDatePart(minute)}
            </option>
          ))}
        </select>
      </div>
      <button className="mt-3 h-9 w-full rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:border-zinc-400" onClick={() => commitDate(new Date())} type="button">
        Today
      </button>
    </div>
  );
}

function CalendarView({
  calendarEvents,
  calendarStart,
  calendarTitle,
  collaborators,
  folders,
  onAddCalendarEvent,
  onCalendarStart,
  onCalendarTitle,
  selectedFolderName,
}: {
  calendarEvents: CalendarEvent[];
  calendarStart: string;
  calendarTitle: string;
  collaborators: Collaborator[];
  folders: SharedFolder[];
  onAddCalendarEvent: (event: FormEvent<HTMLFormElement>) => void;
  onCalendarStart: (value: string) => void;
  onCalendarTitle: (value: string) => void;
  selectedFolderName?: string;
}) {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const today = new Date();
  const eventsForDate = (date: Date) => calendarEvents.filter((event) => calendarDateKey(event.startsAt) === calendarDateKey(date));
  const upcomingEvents = calendarEvents.filter((event) => new Date(event.startsAt).getTime() >= startOfDay(today).getTime()).slice(0, 10);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursorDate), index));
  const monthDays = calendarMonthDays(cursorDate);
  const yearMonths = Array.from({ length: 12 }, (_, index) => new Date(cursorDate.getFullYear(), index, 1));

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="panel p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays size={18} aria-hidden="true" />
              <h2 className="text-base font-semibold">Calendar</h2>
            </div>
            <p className="mt-1 text-sm text-zinc-500">Detected dates appear here.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-zinc-200 bg-zinc-50 p-1">
              {(["day", "week", "month", "year"] as CalendarMode[]).map((mode) => (
                <button
                  className={`segmented capitalize ${calendarMode === mode ? "segmented-active" : ""}`}
                  key={mode}
                  onClick={() => setCalendarMode(mode)}
                  type="button"
                >
                  {mode}
                </button>
              ))}
            </div>
            <span className="chip">{calendarEvents.length} events</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <button className="icon-button" onClick={() => setCursorDate((current) => shiftCalendarCursor(current, calendarMode, -1))} title="Previous" type="button">
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <button className="icon-button" onClick={() => setCursorDate((current) => shiftCalendarCursor(current, calendarMode, 1))} title="Next" type="button">
              <ChevronRight size={17} aria-hidden="true" />
            </button>
            <button className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400" onClick={() => setCursorDate(new Date())} type="button">
              Today
            </button>
          </div>
          <h3 className="text-lg font-semibold">{calendarModeLabel(calendarMode, cursorDate)}</h3>
        </div>

        {calendarMode === "day" && (
          <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              {cursorDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <div className="mt-3 grid gap-2">
              {eventsForDate(cursorDate).map((event) => (
                <CalendarEventPill collaborators={collaborators} event={event} folders={folders} key={event.id} />
              ))}
              {!eventsForDate(cursorDate).length && <p className="rounded-md bg-white p-3 text-sm text-zinc-500 ring-1 ring-zinc-200">No events on this day.</p>}
            </div>
          </div>
        )}

        {calendarMode === "week" && (
          <div className="mt-5 grid gap-3 md:grid-cols-7">
            {weekDays.map((day) => {
              const events = eventsForDate(day);
              return (
                <button
                  className={`min-h-44 rounded-md border p-3 text-left transition ${
                    calendarDateKey(day) === calendarDateKey(today) ? "border-zinc-950 bg-white" : "border-zinc-200 bg-zinc-50 hover:border-zinc-400"
                  }`}
                  key={day.toISOString()}
                  onClick={() => {
                    setCursorDate(day);
                    setCalendarMode("day");
                  }}
                  type="button"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">{day.toLocaleDateString(undefined, { weekday: "short" })}</p>
                  <p className="mt-1 text-lg font-semibold">{day.getDate()}</p>
                  <div className="mt-3 grid gap-2">
                    {events.slice(0, 3).map((event) => (
                      <CalendarEventPill compact collaborators={collaborators} event={event} folders={folders} key={event.id} />
                    ))}
                    {events.length > 3 && <p className="text-xs font-medium text-zinc-500">+{events.length - 3} more</p>}
                    {!events.length && <p className="text-xs text-zinc-400">Open</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {calendarMode === "month" && (
          <>
            <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
              {dayNames.map((day) => (
                <span key={day}>{day.slice(0, 3)}</span>
              ))}
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-7">
              {monthDays.map((day) => {
                const events = eventsForDate(day);
                const inMonth = day.getMonth() === cursorDate.getMonth();
                return (
                  <button
                    className={`min-h-32 rounded-md border p-3 text-left transition ${
                      calendarDateKey(day) === calendarDateKey(today)
                        ? "border-zinc-950 bg-white"
                        : "border-zinc-200 bg-zinc-50 hover:border-zinc-400"
                    } ${inMonth ? "" : "opacity-45"}`}
                    key={day.toISOString()}
                    onClick={() => {
                      setCursorDate(day);
                      setCalendarMode("day");
                    }}
                    type="button"
                  >
                    <p className="text-sm font-semibold">{day.getDate()}</p>
                    <div className="mt-2 grid gap-1.5">
                      {events.slice(0, 2).map((event) => (
                        <span className="rounded bg-white px-2 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200" key={event.id}>
                          {formatCalendarTime(event.startsAt)} {event.title}
                        </span>
                      ))}
                      {events.length > 2 && <span className="text-xs font-medium text-zinc-500">+{events.length - 2} more</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {calendarMode === "year" && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {yearMonths.map((month) => {
              const monthEvents = calendarEvents.filter((event) => {
                const eventDate = new Date(event.startsAt);
                return eventDate.getFullYear() === month.getFullYear() && eventDate.getMonth() === month.getMonth();
              });
              return (
                <button
                  className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-left hover:border-zinc-400"
                  key={month.toISOString()}
                  onClick={() => {
                    setCursorDate(month);
                    setCalendarMode("month");
                  }}
                  type="button"
                >
                  <p className="text-sm font-semibold">{month.toLocaleDateString(undefined, { month: "long" })}</p>
                  <p className="mt-1 text-xs text-zinc-500">{monthEvents.length} events</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-zinc-950" style={{ width: `${Math.min(100, monthEvents.length * 12)}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <aside className="flex flex-col gap-5">
        <section className="panel p-4">
          <div className="flex items-center gap-2">
            <CalendarPlus size={18} aria-hidden="true" />
            <h2 className="text-base font-semibold">Add event</h2>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{selectedFolderName ? `Adds to ${selectedFolderName}.` : "Select a shared folder first."}</p>
          <form className="mt-4 grid gap-3" onSubmit={onAddCalendarEvent}>
            <input
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
              onChange={(event) => onCalendarTitle(event.target.value)}
              placeholder="Calendar item"
              value={calendarTitle}
            />
            <DateTimePicker onChange={onCalendarStart} value={calendarStart} />
            <button className="primary-button" type="submit">
              <Plus size={17} aria-hidden="true" />
              Add event
            </button>
          </form>
        </section>

        <section className="panel p-4">
          <h2 className="text-base font-semibold">Upcoming</h2>
          <div className="mt-4 grid gap-3">
            {upcomingEvents.map((event) => (
              <CalendarEventPill collaborators={collaborators} event={event} folders={folders} key={event.id} />
            ))}
            {!upcomingEvents.length && <p className="text-sm text-zinc-500">No upcoming calendar items.</p>}
          </div>
        </section>
      </aside>
    </div>
  );
}

function CollaborationView({
  calendarEvents,
  calendarStart,
  calendarTitle,
  captureMode,
  collaborators,
  currentUserId,
  draft,
  folders,
  inviteEmail,
  inviteName,
  isCapturing,
  memories,
  notifications,
  onAddCalendarEvent,
  onAddMemory,
  onAddFolder,
  onCalendarStart,
  onCalendarTitle,
  onCaptureMode,
  onDraft,
  onFileClick,
  onFolder,
  onInvite,
  onInviteEmail,
  onInviteName,
  onPersonalView,
  onQuery,
  onVoiceAi,
  onVoiceCommit,
  selectedFolder,
  voiceAvailable,
}: {
  calendarEvents: CalendarEvent[];
  calendarStart: string;
  calendarTitle: string;
  captureMode: "text" | "voice";
  collaborators: Collaborator[];
  currentUserId: string;
  draft: string;
  folders: SharedFolder[];
  inviteEmail: string;
  inviteName: string;
  isCapturing?: boolean;
  memories: Memory[];
  notifications: WorkspaceNotification[];
  onAddCalendarEvent: (event: FormEvent<HTMLFormElement>) => void;
  onAddMemory: (event: FormEvent<HTMLFormElement>) => void;
  onAddFolder: () => void;
  onCalendarStart: (value: string) => void;
  onCalendarTitle: (value: string) => void;
  onCaptureMode: (mode: "text" | "voice") => void;
  onDraft: (value: string) => void;
  onFileClick: () => void;
  onFolder: (id: string) => void;
  onInvite: (event: FormEvent<HTMLFormElement>) => void;
  onInviteEmail: (value: string) => void;
  onInviteName: (value: string) => void;
  onPersonalView: () => void;
  onQuery: (value: string) => void;
  onVoiceAi: (mode: "ask" | "capture", prompt: string) => Promise<AiWorkspacePlan>;
  onVoiceCommit: (plan: AiWorkspacePlan, sourceText: string) => void;
  selectedFolder: SharedFolder;
  voiceAvailable: boolean;
}) {
  const folderCollaborators = selectedFolder.collaboratorIds
    .map((id) => collaborators.find((collaborator) => collaborator.id === id))
    .filter((collaborator): collaborator is Collaborator => Boolean(collaborator));
  const folderNotifications = notifications
    .filter((notification) => notification.folderId === selectedFolder.id)
    .slice(0, 8);
  const memoryGroups = groupedMemories(memories);

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
      <aside className="panel h-fit p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderKanban size={18} aria-hidden="true" />
            <h2 className="text-base font-semibold">Folders</h2>
          </div>
          <button className="icon-button" onClick={onAddFolder} title="Create shared folder" type="button">
            <Plus size={17} aria-hidden="true" />
          </button>
        </div>
        <button
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          onClick={onPersonalView}
          type="button"
        >
          <Archive size={16} aria-hidden="true" />
          Personal view
        </button>
        <div className="mt-4 grid gap-2">
          {folders.map((folder) => (
            <button
              className={`rounded-md border p-3 text-left ${
                selectedFolder.id === folder.id ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white hover:border-zinc-400"
              }`}
              key={folder.id}
              onClick={() => onFolder(folder.id)}
              type="button"
            >
              <span className="block text-sm font-medium">{folder.name}</span>
              <span className={`mt-1 block text-xs ${selectedFolder.id === folder.id ? "text-zinc-300" : "text-zinc-500"}`}>
                {folder.collaboratorIds.length} people
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex flex-col gap-5">
        <CapturePanel
          captureMode={captureMode}
          draft={draft}
          isCapturing={isCapturing}
          onAddMemory={onAddMemory}
          onCaptureMode={onCaptureMode}
          onDraft={onDraft}
          onFileClick={onFileClick}
          onVoiceAi={onVoiceAi}
          onVoiceCommit={onVoiceCommit}
          sharedFolderName={selectedFolder.name}
          voiceAvailable={voiceAvailable}
        />
        <section className="panel p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Share2 size={18} aria-hidden="true" />
                <h2 className="text-base font-semibold">{selectedFolder.name}</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{selectedFolder.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {folderCollaborators.map((collaborator) => (
                <span className="chip" key={collaborator.id}>
                  <span className={`flex size-5 items-center justify-center rounded-full text-[10px] font-semibold ${collaborator.color}`}>
                    {collaborator.name.slice(0, 1)}
                  </span>
                  {collaborator.name}
                  {collaborator.id === currentUserId && <span className="text-zinc-400">you</span>}
                </span>
              ))}
            </div>
          </div>

          <form
            className="mt-5 grid min-w-0 gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            onSubmit={onInvite}
          >
            <input
              className="h-10 min-w-0 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
              onChange={(event) => onInviteName(event.target.value)}
              placeholder="Collaborator name"
              value={inviteName}
            />
            <input
              className="h-10 min-w-0 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
              onChange={(event) => onInviteEmail(event.target.value)}
              placeholder="email@example.com"
              type="email"
              value={inviteEmail}
            />
            <button className="primary-button" type="submit">
              <UserPlus size={17} aria-hidden="true" />
              Invite
            </button>
          </form>
        </section>

        <section className="panel p-4">
          <div className="flex items-center gap-2">
            <FileText size={18} aria-hidden="true" />
            <h2 className="text-base font-semibold">Notes</h2>
          </div>
          <div className="mt-4 grid gap-5">
            {memoryGroups.map(([category, grouped]) => (
              <div className="grid gap-3" key={category}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{category}</h3>
                  <span className="mini-chip">{grouped.length}</span>
                </div>
                {grouped.map((memory) => (
                  <MemoryRow key={memory.id} memory={memory} onQuery={onQuery} />
                ))}
              </div>
            ))}
            {!memoryGroups.length && <p className="text-sm text-zinc-500">No notes yet.</p>}
          </div>
        </section>
      </section>

      <aside className="flex flex-col gap-5">
        <section className="panel p-4">
          <div className="flex items-center gap-2">
            <CalendarPlus size={18} aria-hidden="true" />
            <h2 className="text-base font-semibold">Calendar</h2>
          </div>
          <form className="mt-4 grid gap-3" onSubmit={onAddCalendarEvent}>
            <input
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
              onChange={(event) => onCalendarTitle(event.target.value)}
              placeholder="Add calendar item"
              value={calendarTitle}
            />
            <DateTimePicker onChange={onCalendarStart} value={calendarStart} />
            <button className="primary-button" type="submit">
              <Plus size={17} aria-hidden="true" />
              Add event
            </button>
          </form>
          <div className="mt-4 grid gap-3">
            {calendarEvents.map((event) => {
              const author = collaborators.find((collaborator) => collaborator.id === event.createdBy);
              return (
                <div className="rounded-md border border-zinc-200 p-3" key={event.id}>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(event.startsAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">Added by {author?.name ?? "Collaborator"}</p>
                </div>
              );
            })}
            {!calendarEvents.length && <p className="text-sm text-zinc-500">No events yet.</p>}
          </div>
        </section>

        <section className="panel p-4">
          <div className="flex items-center gap-2">
            <Bell size={18} aria-hidden="true" />
            <h2 className="text-base font-semibold">Notifications</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {folderNotifications.map((notification) => {
              const actor = collaborators.find((collaborator) => collaborator.id === notification.actorId);
              return (
                <div className="rounded-md border border-zinc-200 bg-white p-3" key={notification.id}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-zinc-100">
                      {notification.kind === "calendar" ? (
                        <CalendarDays size={16} aria-hidden="true" />
                      ) : notification.kind === "share" ? (
                        <Users size={16} aria-hidden="true" />
                      ) : (
                        <FileText size={16} aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{notification.body}</p>
                      <p className="mt-2 text-xs text-zinc-400">
                        {actor?.name ?? "Collaborator"} - {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {!folderNotifications.length && <p className="text-sm text-zinc-500">No updates yet.</p>}
          </div>
        </section>
      </aside>
    </div>
  );
}

function RemindersView({
  manualReminder,
  manualReminderAt,
  nowMs,
  onAddReminder,
  onEmailReminder,
  onManualReminder,
  onManualReminderAt,
  onToggleReminder,
  reminderEmailStatus,
  reminders,
}: {
  manualReminder: string;
  manualReminderAt: string;
  nowMs: number;
  onAddReminder: (event: FormEvent<HTMLFormElement>) => void;
  onEmailReminder: (reminder: Reminder) => void;
  onManualReminder: (value: string) => void;
  onManualReminderAt: (value: string) => void;
  onToggleReminder: (id: string) => void;
  reminderEmailStatus: ReminderEmailStatus;
  reminders: Reminder[];
}) {
  return (
    <section className="panel p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold">Reminders</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Follow-ups from deadlines, classes, and plans. Tell the AI when to remind you — e.g.{" "}
            <span className="italic">remind me to call mom tomorrow at 5pm</span>.
          </p>
        </div>
        <form className="flex flex-wrap gap-2" onSubmit={onAddReminder}>
          <input
            className="h-10 min-w-0 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
            onChange={(event) => onManualReminder(event.target.value)}
            placeholder="Add reminder"
            value={manualReminder}
          />
          <input
            aria-label="Remind me at"
            className="h-10 rounded-md border border-zinc-200 px-2 text-sm outline-none focus:border-zinc-400"
            onChange={(event) => onManualReminderAt(event.target.value)}
            title="Remind me at (optional)"
            type="datetime-local"
            value={manualReminderAt}
          />
          <button className="icon-button" title="Add reminder" type="submit">
            <Plus size={17} aria-hidden="true" />
          </button>
        </form>
      </div>
      {reminderEmailStatus && (
        <p
          className={`mt-4 rounded-md border px-3 py-2 text-sm ${
            reminderEmailStatus.state === "error"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {reminderEmailStatus.message}
        </p>
      )}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {reminders.map((reminder) => {
          const isSending = reminderEmailStatus?.reminderId === reminder.id && reminderEmailStatus.state === "sending";
          const remindAtDate = reminder.remindAt ? new Date(reminder.remindAt) : null;
          const remindAtValid = remindAtDate && !Number.isNaN(remindAtDate.getTime()) ? remindAtDate : null;
          const isOverdue = !reminder.done && remindAtValid !== null && remindAtValid.getTime() <= nowMs;

          return (
            <article
              className={`rounded-md border p-4 text-left ${
                reminder.done
                  ? "border-emerald-200 bg-emerald-50"
                  : isOverdue
                    ? "border-amber-300 bg-amber-50 hover:border-amber-400"
                    : "border-zinc-200 bg-white hover:border-zinc-400"
              }`}
              key={reminder.id}
            >
              <div className="flex items-start gap-3">
                <button
                  className="mt-0.5 shrink-0 text-zinc-400 hover:text-zinc-950"
                  onClick={() => onToggleReminder(reminder.id)}
                  title={reminder.done ? "Mark reminder open" : "Mark reminder done"}
                  type="button"
                >
                  {reminder.done ? (
                    <CheckCircle2 className="text-emerald-600" size={18} aria-hidden="true" />
                  ) : (
                    <AlarmClock size={18} aria-hidden="true" />
                  )}
                </button>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{reminder.title}</span>
                  <span className={`mt-1 block text-xs font-medium ${isOverdue ? "text-amber-800" : "text-zinc-500"}`}>
                    {remindAtValid ? formatReminderTriggerLabel(remindAtValid.toISOString()) : reminder.trigger}
                    {isOverdue ? " · due" : ""}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-zinc-600">{reminder.context}</span>
                </span>
                <button
                  className="icon-button size-9 shrink-0"
                  disabled={isSending}
                  onClick={() => onEmailReminder(reminder)}
                  title="Email reminder"
                  type="button"
                >
                  <Mail size={16} aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BillingView({
  billingError,
  inviteCopied,
  inviteUrl,
  onCopyInviteLink,
  onManageBilling,
  plan,
  referralDiscountEligible,
  subscriptionStatus,
  userEmail,
}: {
  billingError: string;
  inviteCopied: boolean;
  inviteUrl: string;
  onCopyInviteLink: () => void;
  onManageBilling: (billingInterval?: BillingInterval) => void;
  plan: string;
  referralDiscountEligible: boolean;
  subscriptionStatus: string;
  userEmail?: string;
}) {
  const isPro = plan === "pro";
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const monthlyPrice = referralDiscountEligible ? "CA$10/mo" : "CA$15/mo";
  const selectedPrice = billingInterval === "yearly" ? "Annual in Stripe" : monthlyPrice;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="panel p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard size={18} aria-hidden="true" />
              <h2 className="text-base font-semibold">Subscription</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {isPro
                ? "Your Pro subscription is managed through Stripe."
                : referralDiscountEligible
                  ? "Your invite discount is ready for Stripe Checkout."
                  : "Choose monthly or yearly Pro billing through Stripe Checkout."}
            </p>
          </div>
          <span className={`chip ${isPro ? "border-emerald-200 bg-emerald-50 text-emerald-800" : ""}`}>
            {isPro ? "Pro" : "Free"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Metric label="Plan" value={isPro ? "Pro" : "Free"} />
          <Metric label="Status" value={subscriptionStatus} />
          <Metric label="Price" value={isPro ? "Managed in Stripe" : selectedPrice} />
        </div>

        {!isPro && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <button
              className={`rounded-md border p-4 text-left transition ${
                billingInterval === "monthly" ? "border-zinc-950 bg-zinc-50" : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
              onClick={() => setBillingInterval("monthly")}
              type="button"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">Monthly</span>
                {billingInterval === "monthly" && <Check size={17} aria-hidden="true" />}
              </span>
              <span className="mt-2 block text-2xl font-semibold">{monthlyPrice}</span>
              <span className="mt-1 block text-sm text-zinc-500">
                {referralDiscountEligible ? "Referral price for the first eligible month." : "Standard monthly Pro billing."}
              </span>
            </button>
            <button
              className={`rounded-md border p-4 text-left transition ${
                billingInterval === "yearly" ? "border-zinc-950 bg-zinc-50" : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
              onClick={() => setBillingInterval("yearly")}
              type="button"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">Yearly</span>
                {billingInterval === "yearly" && <Check size={17} aria-hidden="true" />}
              </span>
              <span className="mt-2 block text-2xl font-semibold">Annual</span>
              <span className="mt-1 block text-sm text-zinc-500">Final yearly price appears in Stripe Checkout.</span>
            </button>
          </div>
        )}

        {billingError && <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{billingError}</p>}

        <button className="primary-button mt-5" onClick={() => onManageBilling(billingInterval)} type="button">
          <CreditCard size={17} aria-hidden="true" />
          {isPro ? "Manage in Stripe" : `Upgrade ${billingInterval === "yearly" ? "yearly" : "monthly"}`}
        </button>
      </section>

      <aside className="panel h-fit p-4">
        <div className="flex items-center gap-2">
          <UserPlus className="text-emerald-700" size={18} aria-hidden="true" />
          <h2 className="text-base font-semibold">Invite discount</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Share your invite link. When one new friend creates an account with it, your account gets the CA$10/mo referral price for the first month.
        </p>
        <div className="mt-4 grid gap-3">
          <Metric label="Default" value="CA$15/mo" />
          <Metric label="Yearly" value="Stripe Checkout" />
          <Metric label="Invite" value="CA$10/mo" />
          <Metric label="Account" value={userEmail ?? "Local"} />
        </div>
        {inviteUrl ? (
          <div className="mt-4 grid gap-2">
            <input
              className="h-10 min-w-0 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 outline-none"
              readOnly
              value={inviteUrl}
            />
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700"
              onClick={onCopyInviteLink}
              type="button"
            >
              {inviteCopied ? <Check size={17} aria-hidden="true" /> : <Link size={17} aria-hidden="true" />}
              {inviteCopied ? "Copied" : "Copy invite link"}
            </button>
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">Sign in with Supabase to get a personal invite link.</p>
        )}
        <div className="mt-4 rounded-md border border-zinc-200 bg-white p-3 text-sm leading-6 text-zinc-600">
          <p className="font-medium text-zinc-900">Referral rules</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Each invite code can be used by one new friend.</li>
            <li>After a friend joins, your code is marked used and a fresh invite link is created.</li>
            <li>You get CA$10/mo for the first referral month. Invite one new friend each month to keep CA$10/mo.</li>
            <li>Your friend starts at CA$15/mo until they invite someone too.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function SettingsView({
  accountDeleteConfirm,
  accountDeleteStatus,
  accountEmail,
  accountEmailStatus,
  deleteAccountError,
  onAccountDeleteConfirm,
  onAccountEmail,
  onChangeAccountEmail,
  onDeleteAccount,
  onPromotionEmailsOptOut,
  onSettings,
  promotionEmailPreferenceStatus,
  promotionEmailsOptOut,
  persistenceMode,
  settings,
  voiceAvailable,
}: {
  accountDeleteConfirm: string;
  accountDeleteStatus: "idle" | "deleting";
  accountEmail: string;
  accountEmailStatus: AccountEmailStatus;
  deleteAccountError: string;
  onAccountDeleteConfirm: (value: string) => void;
  onAccountEmail: (value: string) => void;
  onChangeAccountEmail: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteAccount: () => void;
  onPromotionEmailsOptOut: (optOut: boolean) => void;
  onSettings: (settings: SettingsState) => void;
  promotionEmailPreferenceStatus: AccountEmailStatus;
  promotionEmailsOptOut: boolean;
  persistenceMode: "local" | "supabase";
  settings: SettingsState;
  voiceAvailable: boolean;
}) {
  const language = settings.language;
  const isFrench = language === "fr";
  const text = {
    accountEmail: isFrench ? "Courriel du compte" : "Account email",
    aiMode: isFrench ? "Mode IA" : "AI mode",
    apiReady: isFrench ? "Pret pour API" : "API-ready",
    calendarSync: isFrench ? "Synchronisation calendrier" : "Calendar sync",
    changeEmail: isFrench ? "Changer le courriel" : "Change email",
    changingEmail: isFrench ? "Changement du courriel" : "Changing email",
    confirmDelete: isFrench ? "Tapez DELETE pour confirmer" : "Type DELETE to confirm",
    deleteAccount: isFrench ? "Supprimer le compte" : "Delete account",
    deleteAccountBody: isFrench
      ? "Cela supprime votre compte et l'espace de travail sauvegarde. Les abonnements Stripe actifs sont annules avant la suppression du compte."
      : "This deletes your account and saved workspace. Active Stripe subscriptions are cancelled before account deletion.",
    deleting: isFrench ? "Suppression" : "Deleting",
    focusArea: isFrench ? "Domaine d'attention" : "Focus area",
    languageHelp: isFrench
      ? "Changez la langue visible dans l'application."
      : "Change the language shown in the app.",
    languageLabel: isFrench ? "Langue de l'application" : "App language",
    learnedFactsTitle: isFrench ? "Ce que l'IA a appris sur vous" : "What the AI has learned about you",
    learnedFactsHelp: isFrench
      ? "L'IA ajoute ici les faits durables qu'elle remarque lors de vos echanges. Supprimez tout ce qui est faux ou que vous prefereriez qu'elle oublie."
      : "The AI adds persistent facts here as it learns from your prompts. Remove anything wrong or that you'd rather it forget.",
    learnedFactsEmpty: isFrench
      ? "Rien pour l'instant. Parlez a l'IA et elle commencera a se souvenir de ce qui compte."
      : "Nothing yet. Talk to the AI and it will start remembering what matters.",
    learnedFactsRemove: isFrench ? "Oublier" : "Forget",
    localMode: isFrench ? "Mode local" : "Local inference",
    localModeDelete: isFrench ? "Le mode local efface seulement l'espace de travail de ce navigateur." : "Local mode clears this browser workspace only.",
    name: isFrench ? "Nom" : "Name",
    promoEmails: isFrench ? "Recevoir les courriels promotionnels" : "Receive promotion emails",
    settings: isFrench ? "Parametres" : "Settings",
    voiceCapture: isFrench ? "Capture vocale prioritaire" : "Voice-first capture",
  };

  const learnedFacts = settings.learnedFacts ?? [];
  const forgetFact = (fact: string) => {
    onSettings({ ...settings, learnedFacts: learnedFacts.filter((entry) => entry !== fact) });
  };

  const selectLanguage = (next: Language) => {
    onSettings({ ...settings, language: next });
  };

  return (
    <section className="panel max-w-2xl p-4">
      <h2 className="text-base font-semibold">{text.settings}</h2>
      <div className="mt-5 grid gap-4">
        <form className="grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3" onSubmit={onChangeAccountEmail}>
          <label className="grid gap-2 text-sm font-medium">
            {text.accountEmail}
            <input
              className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
              onChange={(event) => onAccountEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={accountEmail}
            />
          </label>
          <button className="primary-button w-fit" disabled={accountEmailStatus.state === "saving"} type="submit">
            <Mail size={17} aria-hidden="true" />
            {accountEmailStatus.state === "saving" ? text.changingEmail : text.changeEmail}
          </button>
          {accountEmailStatus.message && (
            <p
              className={`rounded-md border px-3 py-2 text-sm ${
                accountEmailStatus.state === "error"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {accountEmailStatus.message}
            </p>
          )}
        </form>
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-200 p-3 text-sm font-medium">
            <div>
              <p>{text.languageLabel}</p>
              <p className="mt-1 text-xs font-normal leading-5 text-zinc-500">{text.languageHelp}</p>
            </div>
            <div aria-label={text.languageLabel} className="flex h-10 items-center rounded-md border border-zinc-200 bg-white p-1">
              <button
                aria-pressed={language === "fr"}
                className={`inline-flex h-8 items-center justify-center rounded-sm px-3 text-sm font-medium ${
                  language === "fr"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
                onClick={() => selectLanguage("fr")}
                type="button"
              >
                FR
              </button>
              <button
                aria-pressed={language === "en"}
                className={`inline-flex h-8 items-center justify-center rounded-sm px-3 text-sm font-medium ${
                  language === "en"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
                onClick={() => selectLanguage("en")}
                type="button"
              >
                EN
              </button>
            </div>
          </div>
          <label className="flex items-center justify-between rounded-md border border-zinc-200 p-3 text-sm font-medium">
            {text.promoEmails}
            <input
              checked={!promotionEmailsOptOut}
              disabled={promotionEmailPreferenceStatus.state === "saving"}
              onChange={(event) => onPromotionEmailsOptOut(!event.target.checked)}
              type="checkbox"
            />
          </label>
          {promotionEmailPreferenceStatus.message && (
            <p
              className={`rounded-md border px-3 py-2 text-sm ${
                promotionEmailPreferenceStatus.state === "error"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {promotionEmailPreferenceStatus.message}
            </p>
          )}
        </div>
        <label className="grid gap-2 text-sm font-medium">
          {text.name}
          <input
            className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
            onChange={(event) => onSettings({ ...settings, name: event.target.value })}
            value={settings.name}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {text.focusArea}
          <textarea
            className="min-h-24 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            onChange={(event) => onSettings({ ...settings, focusArea: event.target.value })}
            value={settings.focusArea}
          />
        </label>
        <div className="grid gap-2 rounded-md border border-zinc-200 p-3 text-sm">
          <div>
            <p className="font-medium">{text.learnedFactsTitle}</p>
            <p className="mt-1 text-xs font-normal leading-5 text-zinc-500">{text.learnedFactsHelp}</p>
          </div>
          {learnedFacts.length === 0 ? (
            <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-500">{text.learnedFactsEmpty}</p>
          ) : (
            <ul className="grid gap-1">
              {learnedFacts.map((fact) => (
                <li
                  key={fact}
                  className="flex items-start justify-between gap-3 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2"
                >
                  <span className="text-sm leading-6 text-zinc-700">{fact}</span>
                  <button
                    aria-label={`${text.learnedFactsRemove}: ${fact}`}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-600 transition hover:border-rose-200 hover:text-rose-600"
                    onClick={() => forgetFact(fact)}
                    type="button"
                  >
                    <X size={12} aria-hidden="true" />
                    {text.learnedFactsRemove}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <label className="flex items-center justify-between rounded-md border border-zinc-200 p-3 text-sm font-medium">
          <span>
            {text.voiceCapture}
            {!voiceAvailable && <span className="ml-2 text-xs font-semibold text-zinc-500">Pro</span>}
          </span>
          <input
            checked={voiceAvailable && settings.voiceCapture}
            disabled={!voiceAvailable}
            onChange={(event) => onSettings({ ...settings, voiceCapture: event.target.checked })}
            type="checkbox"
          />
        </label>
        <label className="flex items-center justify-between rounded-md border border-zinc-200 p-3 text-sm font-medium">
          {text.calendarSync}
          <input
            checked={settings.calendarConnected}
            onChange={(event) => onSettings({ ...settings, calendarConnected: event.target.checked })}
            type="checkbox"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {text.aiMode}
          <select
            className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
            onChange={(event) => onSettings({ ...settings, aiMode: event.target.value as SettingsState["aiMode"] })}
            value={settings.aiMode}
          >
            <option value="local">{text.localMode}</option>
            <option value="api-ready">{text.apiReady}</option>
          </select>
        </label>
        <div className="rounded-md border border-rose-200 p-3">
          <div className="flex items-center gap-2">
            <Trash2 className="text-rose-600" size={18} aria-hidden="true" />
            <h3 className="text-base font-semibold">{text.deleteAccount}</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{text.deleteAccountBody}</p>
          {persistenceMode === "local" && (
            <p className="mt-3 rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">{text.localModeDelete}</p>
          )}
          {deleteAccountError && (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{deleteAccountError}</p>
          )}
          <label className="mt-4 grid gap-2 text-sm font-medium">
            {text.confirmDelete}
            <input
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
              onChange={(event) => onAccountDeleteConfirm(event.target.value)}
              value={accountDeleteConfirm}
            />
          </label>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-medium text-white disabled:opacity-50"
            disabled={accountDeleteConfirm !== "DELETE" || accountDeleteStatus === "deleting"}
            onClick={onDeleteAccount}
            type="button"
          >
            <Trash2 size={17} aria-hidden="true" />
            {accountDeleteStatus === "deleting" ? text.deleting : text.deleteAccount}
          </button>
        </div>
      </div>
    </section>
  );
}
