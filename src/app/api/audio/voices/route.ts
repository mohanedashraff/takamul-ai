// ════════════════════════════════════════════════════════════════
// GET /api/audio/voices — list real voices for the TTS picker
// ════════════════════════════════════════════════════════════════
// Returns a flat array shaped like ToolInputOption so the frontend
// can drop it into a <Select> with no transformation:
//
//   [{ value: "<voice_id>", label: "<name> — <accent>" }, ...]
//
// Source priority:
//   1. Live ElevenLabs `/v1/voices` (when ELEVENLABS_API_KEY is set).
//      We surface every voice in the user's library + library of
//      shared/public voices ElevenLabs returns by default.
//   2. Curated fallback from `ELEVENLABS_VOICES` so the UI still
//      renders something useful when the key isn't configured (dev).
//
// Cache: 1h client-side, 24h CDN. Voices change rarely.

import { NextResponse } from "next/server";
import { ELEVENLABS_VOICES, isElevenLabsConfigured } from "@/lib/elevenlabs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
  preview_url?: string;
  description?: string;
  category?: string;
}

interface VoiceOption {
  value:        string;
  label:        string;
  preview_url?: string;
  language?:    string;
  gender?:      string;
  /** UI-grouping bucket — 12 categories matching the reference platform's
   *  voice picker. Derived from ElevenLabs `labels` (use_case / description),
   *  defaulting to "other" when nothing matches. */
  category?:    "vlog" | "stream" | "beauty" | "professions" | "car-talk" |
                "forum" | "podcast" | "coaching" | "selling" | "reporter" |
                "emotions" | "other";
}

/** Map ElevenLabs label hints to one of the 12 picker buckets. The order in
 *  each row is "any of these substrings match → assign this bucket". */
const CATEGORY_HINTS: Array<[VoiceOption["category"], readonly string[]]> = [
  ["vlog",        ["vlog", "casual", "youtuber", "creator", "social media"] as const],
  ["stream",      ["stream", "gaming", "twitch", "live"] as const],
  ["beauty",      ["beauty", "makeup", "wellness", "asmr"] as const],
  ["professions", ["business", "professional", "corporate", "executive", "lawyer", "doctor"] as const],
  ["car-talk",    ["car", "auto", "racing", "driver"] as const],
  ["forum",       ["forum", "chat", "discussion", "interview"] as const],
  ["podcast",     ["podcast", "audiobook", "narration", "narrator", "story"] as const],
  ["coaching",    ["coach", "training", "mentor", "guide", "instructor"] as const],
  ["selling",     ["advertis", "commercial", "sales", "ad ", "marketing"] as const],
  ["reporter",    ["news", "journalist", "reporter", "anchor", "broadcast"] as const],
  ["emotions",    ["emotion", "expressive", "dramatic", "intense", "angry", "happy"] as const],
];

function categorize(labels: Record<string, string>): VoiceOption["category"] {
  const haystack = [
    labels.use_case,
    labels.description,
    labels.style,
    labels.descriptive,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!haystack) return "other";
  for (const [cat, hints] of CATEGORY_HINTS) {
    if (hints.some((h) => haystack.includes(h))) return cat;
  }
  return "other";
}

function fallback(): VoiceOption[] {
  // Use the curated catalogue so dev environments still see real
  // voices. The names here already encode flag + style.
  return Object.entries(ELEVENLABS_VOICES).map(([_, v]) => ({
    value: v.id,
    label: v.name,
  }));
}

/** Pull this user's cloned voices so they show up at the top of the
 *  picker, labelled "صوتك المستنسخ" with category="custom". */
async function customVoices(): Promise<VoiceOption[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];
    const rows = await prisma.userVoice.findMany({
      where:   { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select:  { voiceId: true, name: true, description: true },
    });
    return rows.map((v) => ({
      value:    v.voiceId,
      label:    `${v.name} — صوتك المستنسخ`,
      category: "other" as const, // surfaces under a "Custom" header in pickers
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  const custom = await customVoices();

  if (!isElevenLabsConfigured()) {
    return NextResponse.json({ voices: [...custom, ...fallback()], source: "fallback" });
  }

  try {
    const r = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
      // ElevenLabs voice list rarely changes — cache aggressively.
      next: { revalidate: 3600 },
    });

    if (!r.ok) {
      // Surface the curated fallback rather than 5xx — the picker
      // should never look broken to the user.
      return NextResponse.json({ voices: fallback(), source: "fallback", upstream_status: r.status });
    }

    const json = await r.json().catch(() => ({}));
    const list: ElevenLabsVoice[] = Array.isArray(json?.voices) ? json.voices : [];

    // Map each ElevenLabs voice to our select-option shape. Build a
    // human label like "Adam — مذكر · إنجليزي".
    const voices: VoiceOption[] = list.map((v) => {
      const labels = v.labels ?? {};
      const accent  = labels.accent || labels.language || "";
      const gender  = labels.gender || "";
      const style   = labels.use_case || labels.description || "";
      const tagline = [gender, accent || style].filter(Boolean).join(" · ");
      return {
        value:        v.voice_id,
        label:        tagline ? `${v.name} — ${tagline}` : v.name,
        preview_url:  v.preview_url,
        language:     accent,
        gender,
        category:     categorize(labels),
      };
    });

    if (voices.length === 0) {
      return NextResponse.json({ voices: [...custom, ...fallback()], source: "fallback" });
    }

    // Sort: keep top-tier multilingual voices (they handle Arabic
    // well) first; ElevenLabs returns the user's own first when
    // present so we leave the relative order as-is otherwise.
    voices.sort((a, b) => {
      const aMulti = (a.language ?? "").toLowerCase().includes("multilingual");
      const bMulti = (b.language ?? "").toLowerCase().includes("multilingual");
      if (aMulti && !bMulti) return -1;
      if (!aMulti && bMulti) return 1;
      return 0;
    });

    // Prepend the user's cloned voices so they always show up first
    // — they're hidden inside the ElevenLabs general list otherwise.
    const merged = [...custom, ...voices.filter((v) => !custom.some((c) => c.value === v.value))];

    return NextResponse.json({ voices: merged, source: "elevenlabs" }, {
      headers: {
        // Custom voices are per-user → can't be cached at the CDN.
        // Keep the cache short and private if any user-specific data
        // is included.
        "Cache-Control": custom.length > 0
          ? "private, max-age=60, stale-while-revalidate=120"
          : "public, s-maxage=86400, max-age=3600, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    return NextResponse.json({ voices: [...custom, ...fallback()], source: "fallback", error: (err as Error).message });
  }
}
