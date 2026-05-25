import { jsonError } from "@/lib/http";
import { hasProEntitlement } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type TtsRequest = {
  text?: string;
};

const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return jsonError("ElevenLabs is not configured.", 503);
  }

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("plan, subscription_status")
      .eq("id", user.id)
      .maybeSingle<{ plan: string | null; subscription_status: string | null }>();

    if (!hasProEntitlement(profile)) {
      return jsonError("Voice playback requires an active Pro subscription.", 403);
    }
  }

  let body: TtsRequest;
  try {
    body = (await request.json()) as TtsRequest;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const text = body.text?.trim();
  if (!text) {
    return jsonError("Text is required.", 400);
  }

  if (text.length > 1200) {
    return jsonError("Text is too long.", 413);
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID?.trim() || DEFAULT_MODEL_ID;

  let response: Response;
  try {
    response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.35,
            use_speaker_boost: true,
          },
        }),
      },
    );
  } catch {
    return jsonError("Voice request failed.", 502);
  }

  if (!response.ok) {
    return jsonError("Voice request failed.", response.status === 429 ? 429 : 502);
  }

  return new Response(response.body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": response.headers.get("content-type") || "audio/mpeg",
    },
  });
}
