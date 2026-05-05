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
}

function fallback(): VoiceOption[] {
  // Use the curated catalogue so dev environments still see real
  // voices. The names here already encode flag + style.
  return Object.entries(ELEVENLABS_VOICES).map(([_, v]) => ({
    value: v.id,
    label: v.name,
  }));
}

export async function GET() {
  if (!isElevenLabsConfigured()) {
    return NextResponse.json({ voices: fallback(), source: "fallback" });
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
      };
    });

    if (voices.length === 0) {
      return NextResponse.json({ voices: fallback(), source: "fallback" });
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

    return NextResponse.json({ voices, source: "elevenlabs" }, {
      headers: {
        // 1h on browsers, 24h on CDN edges.
        "Cache-Control": "public, s-maxage=86400, max-age=3600, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    return NextResponse.json({ voices: fallback(), source: "fallback", error: (err as Error).message });
  }
}
