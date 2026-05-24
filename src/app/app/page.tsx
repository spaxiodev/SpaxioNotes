import { redirect } from "next/navigation";

import SpaxioApp, { type Promotion, type Workspace } from "@/components/spaxio-app";
import { isAdminUser } from "@/lib/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { hasActiveReferralDiscount } from "@/lib/stripe-referrals";

export const dynamic = "force-dynamic";

type WorkspaceStateRow = {
  state: Workspace | null;
  updated_at: string | null;
};

type ProfileRow = {
  full_name: string | null;
  focus_area: string | null;
  calendar_connected: boolean | null;
  voice_capture: boolean | null;
  ai_mode: "local" | "api-ready" | null;
  plan: string | null;
  subscription_status: string | null;
  invite_code: string | null;
  referral_discount_eligible: boolean | null;
  referral_discount_expires_at: string | null;
  promotion_emails_opt_out: boolean | null;
};

type PromotionRow = {
  id: string;
  title: string;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  created_at: string;
};

type PromotionReadRow = {
  promotion_id: string;
};

function withAuthenticatedUser(workspace: Workspace | undefined, user: { id: string; email?: string | null }, profile: ProfileRow | null) {
  if (!workspace) return undefined;

  const authCollaborator = {
    id: user.id,
    name: profile?.full_name || user.email?.split("@")[0] || "You",
    email: user.email ?? "",
    color: "bg-zinc-950 text-white",
  };

  const collaborators = [authCollaborator, ...workspace.collaborators.filter((collaborator) => collaborator.id !== user.id)];

  return {
    ...workspace,
    collaborators,
    sharedFolders: workspace.sharedFolders.map((folder) => ({
      ...folder,
      collaboratorIds: Array.from(new Set([user.id, ...folder.collaboratorIds])),
      createdBy: folder.createdBy === "u-stefano" ? user.id : folder.createdBy,
    })),
    settings: {
      ...workspace.settings,
      name: profile?.full_name || workspace.settings.name,
      focusArea: profile?.focus_area || workspace.settings.focusArea,
      calendarConnected: profile?.calendar_connected ?? workspace.settings.calendarConnected,
      voiceCapture: profile?.voice_capture ?? workspace.settings.voiceCapture,
      aiMode: profile?.ai_mode ?? workspace.settings.aiMode,
      currentUserId: user.id,
    },
  };
}

export default async function AppPage() {
  if (!hasSupabaseEnv()) {
    return <SpaxioApp persistenceMode="local" plan="free" />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
  });

  const [{ data: profile }, { data: workspaceState }, { data: promotionRows }, { data: promotionReadRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, focus_area, calendar_connected, voice_capture, ai_mode, plan, subscription_status, invite_code, referral_discount_eligible, referral_discount_expires_at, promotion_emails_opt_out",
      )
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
    supabase.from("workspace_states").select("state, updated_at").eq("user_id", user.id).maybeSingle<WorkspaceStateRow>(),
    supabase
      .from("promotions")
      .select("id, title, body, cta_label, cta_url, created_at")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<PromotionRow[]>(),
    supabase
      .from("promotion_reads")
      .select("promotion_id")
      .eq("user_id", user.id)
      .returns<PromotionReadRow[]>(),
  ]);

  const initialWorkspace = withAuthenticatedUser(workspaceState?.state ?? undefined, user, profile ?? null);
  const adminUser = isAdminUser(user.id);
  const plan = adminUser || (profile?.plan === "pro" && ["active", "trialing"].includes(profile.subscription_status ?? "")) ? "pro" : "free";
  const referralDiscountEligible = hasActiveReferralDiscount(profile ?? {});

  const readIds = new Set((promotionReadRows ?? []).map((row) => row.promotion_id));
  const promotions: Promotion[] = (promotionRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    createdAt: row.created_at,
    isRead: readIds.has(row.id),
  }));

  return (
    <SpaxioApp
      initialWorkspace={initialWorkspace}
      initialWorkspaceUpdatedAt={workspaceState?.updated_at ?? undefined}
      inviteCode={profile?.invite_code ?? undefined}
      persistenceMode="supabase"
      plan={plan}
      promotions={promotions}
      promotionEmailsOptOut={profile?.promotion_emails_opt_out === true}
      referralDiscountEligible={referralDiscountEligible}
      subscriptionStatus={adminUser ? "admin" : (profile?.subscription_status ?? "inactive")}
      userEmail={user.email}
      userId={user.id}
    />
  );
}
