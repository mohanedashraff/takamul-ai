// ════════════════════════════════════════════════════════════════
// POST /api/audio/voice-clone — register a custom ElevenLabs voice
// ════════════════════════════════════════════════════════════════
// Uploads the user's voice sample to ElevenLabs `/v1/voices/add` and
// returns the new voice_id. From then on the user can pick it from
// any TTS / Lipsync / Voice-Change picker — it shows up in their
// /v1/voices listing under their workspace.
//
// Body  : { sample_url, name, description? }
// Reply : { voiceId, voice: {...}, creditsBalance }
//
// Credit cost: 30 (flat — voice cloning is the most expensive
// per-action in the audio suite). Refunded on failure.

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";
import { deductCredits, addCredits, InsufficientCreditsError } from "@/lib/credits";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime    = "nodejs";
export const maxDuration = 300;

const COST = 30;

const Schema = z.object({
  sample_url:   z.string().url(),
  name:         z.string().min(1).max(80),
  description:  z.string().max(280).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const elKey = process.env.ELEVENLABS_API_KEY;
  if (!elKey) return jsonError("الميزة دي محتاجة مفتاح ElevenLabs", 503);

  // Voice cloning is expensive — cap to 5 per day per user.
  const rl = rateLimit({ key: clientKey(req, "voice-clone"), limit: 5, windowMs: 24 * 60 * 60 * 1000 });
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "وصلت للحد اليومي لاستنساخ الصوت — حاول بكرة" }),
      { status: 429, headers: { "Content-Type": "application/json", ...rl.headers } },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { sample_url, name, description } = parsed.data;

  // ── Charge first; refund on failure ──
  let balanceAfter: number;
  try {
    const r = await deductCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "tool:voice-clone",
      metadata: { name },
    });
    balanceAfter = r.balanceAfter;
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return jsonError("رصيد الكريديت غير كافٍ", 402);
    }
    throw err;
  }

  try {
    // ── 1. Pull the sample bytes ──
    const sampleRes = await fetch(sample_url);
    if (!sampleRes.ok) throw new Error(`Could not fetch sample (${sampleRes.status})`);
    const sampleBuf = await sampleRes.arrayBuffer();
    if (sampleBuf.byteLength < 50_000) {
      throw new Error("العينة قصيرة جداً — لازم تكون على الأقل ١٠ ثواني واضحة");
    }
    if (sampleBuf.byteLength > 25 * 1024 * 1024) {
      throw new Error("العينة كبيرة جداً — لازم تكون أقل من 25MB");
    }

    // ── 2. Submit to ElevenLabs voice add ──
    // The endpoint accepts multipart/form-data with `files` (one or more),
    // `name`, optional `description`, and optional `labels` (JSON).
    const form = new FormData();
    form.append("name", name);
    if (description) form.append("description", description);
    form.append("labels",
      JSON.stringify({
        owner_user_id: session.user.id,
        source: "yilow-clone-flow",
      }),
    );
    // Use a content-type the API recognises; .wav / .mp3 both fine.
    const filename = sample_url.split("/").pop() || "sample.mp3";
    const mime = filename.toLowerCase().endsWith(".wav") ? "audio/wav" : "audio/mpeg";
    form.append("files", new Blob([sampleBuf], { type: mime }), filename);

    const cloneRes = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method:  "POST",
      headers: { "xi-api-key": elKey },
      body:    form,
    });
    if (!cloneRes.ok) {
      const errText = await cloneRes.text().catch(() => "");
      throw new Error(`ElevenLabs voice add failed (${cloneRes.status}): ${errText.slice(0, 200)}`);
    }
    const cloneJson = await cloneRes.json().catch(() => ({} as Record<string, unknown>));
    const voiceId = String(cloneJson.voice_id ?? "");
    if (!voiceId) throw new Error("ElevenLabs did not return a voice_id");

    // ── 3. Best-effort persistence on the user record so the voice
    //       shows up in their picker grouped under "Custom voices". ──
    try {
      await prisma.userVoice.create({
        data: {
          userId:      session.user.id,
          voiceId,
          name,
          description: description ?? null,
          sampleUrl:   sample_url,
        },
      });
    } catch (e) {
      // Non-fatal — the voice still works directly via ElevenLabs API.
      console.warn("[voice-clone] persistence skipped (UserVoice table missing?)", e);
    }

    return jsonOk({
      voiceId,
      voice:          { id: voiceId, name, description: description ?? null },
      creditsBalance: balanceAfter,
    });
  } catch (err) {
    await addCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "refund:voice-clone-failed",
      type:     "REFUND",
      metadata: { name, error: err instanceof Error ? err.message : "unknown" },
    }).catch(() => {});
    const message = err instanceof Error ? err.message : "Voice clone failed";
    return jsonError(message, 500);
  }
}
