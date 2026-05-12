// ════════════════════════════════════════════════════════════════
// POST /api/audio/voice-change — swap the speaker's voice in a video
// ════════════════════════════════════════════════════════════════
// Pipeline:
//   1. Extract the original audio from the video (via the
//      `audio-from-video` MuAPI utility, which returns an mp3 URL).
//   2. Run that audio through ElevenLabs `/v1/speech-to-speech/{voice_id}`
//      → returns the same content rendered in a different voice.
//   3. Re-merge the new audio with the original video via MuAPI's
//      `latentsync-video` so the lipsync matches.
//
// Body  : { video_url, voice_id, stability?, similarity? }
// Reply : { url, creditsBalance }
//
// Credit cost: 12 (flat). Refunded on any failure.

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";
import { deductCredits, addCredits, InsufficientCreditsError } from "@/lib/credits";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime    = "nodejs";
export const maxDuration = 540;

const COST = 12;

const Schema = z.object({
  video_url:  z.string().url(),
  voice_id:   z.string().min(1),
  stability:  z.number().min(0).max(1).optional(),
  similarity: z.number().min(0).max(1).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const muKey = process.env.MU_API_KEY;
  const elKey = process.env.ELEVENLABS_API_KEY;
  if (!muKey)  return jsonError("MuAPI key missing on server", 503);
  if (!elKey)  return jsonError("الميزة دي محتاجة مفتاح ElevenLabs", 503);

  const rl = rateLimit({ key: clientKey(req, "voice-change"), limit: 20, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "محاولات كثيرة — حاول لاحقاً" }),
      { status: 429, headers: { "Content-Type": "application/json", ...rl.headers } },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { video_url, voice_id, stability, similarity } = parsed.data;

  // ── Charge first; refund on failure ──
  let balanceAfter: number;
  try {
    const r = await deductCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "tool:voice-change",
      metadata: { voice_id },
    });
    balanceAfter = r.balanceAfter;
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return jsonError("رصيد الكريديت غير كافٍ", 402);
    }
    throw err;
  }

  try {
    // ── 1. Extract audio from the video ──
    // MuAPI's `audio-from-video` returns an mp3 URL we can pull bytes from.
    const extracted = await submitAndPollServer({
      endpoint:  "audio-from-video",
      apiKey:    muKey,
      payload:   { video_url },
      timeoutMs: 3 * 60 * 1000,
    });
    const audioUrl = pickResultUrl(extracted);
    if (!audioUrl) throw new Error("Failed to extract audio from video");

    // ── 2. Pull the audio bytes & send through ElevenLabs speech-to-speech ──
    const audioBuf = await fetch(audioUrl).then((r) => {
      if (!r.ok) throw new Error(`Could not fetch extracted audio (${r.status})`);
      return r.arrayBuffer();
    });

    const sts = new FormData();
    sts.append("audio", new Blob([audioBuf], { type: "audio/mpeg" }), "input.mp3");
    sts.append("model_id", "eleven_multilingual_sts_v2");
    sts.append(
      "voice_settings",
      JSON.stringify({
        stability:        stability  ?? 0.55,
        similarity_boost: similarity ?? 0.75,
      }),
    );

    const stsRes = await fetch(
      `https://api.elevenlabs.io/v1/speech-to-speech/${voice_id}?output_format=mp3_44100_128`,
      {
        method:  "POST",
        headers: { "xi-api-key": elKey, Accept: "audio/mpeg" },
        body:    sts,
      },
    );
    if (!stsRes.ok) {
      const errText = await stsRes.text().catch(() => "");
      throw new Error(`ElevenLabs speech-to-speech failed: ${errText.slice(0, 200)}`);
    }
    const swappedBuf = await stsRes.arrayBuffer();

    // ── 3. Upload swapped audio to storage so MuAPI lipsync can fetch it ──
    const form = new FormData();
    form.append(
      "file",
      new Blob([swappedBuf], { type: "audio/mpeg" }),
      `voice-change-${Date.now()}.mp3`,
    );
    const up = await fetch("https://api.muapi.ai/api/v1/upload_file", {
      method:  "POST",
      headers: { "x-api-key": muKey },
      body:    form,
    });
    if (!up.ok) throw new Error("Failed to upload swapped audio to storage");
    const upJson = await up.json().catch(() => ({} as Record<string, unknown>));
    const swappedUrl =
      String(upJson.url ?? upJson.file_url ?? upJson.fileUrl ?? "");
    if (!swappedUrl) throw new Error("Storage upload returned no URL");

    // ── 4. Re-lipsync the original video against the new audio ──
    const lipsync = await submitAndPollServer({
      endpoint:  "latentsync-video",
      apiKey:    muKey,
      payload:   { video_url, audio_url: swappedUrl },
      timeoutMs: 6 * 60 * 1000,
    });
    const finalUrl = pickResultUrl(lipsync);
    if (!finalUrl) throw new Error("Lipsync returned no URL");

    return jsonOk({ url: finalUrl, creditsBalance: balanceAfter });
  } catch (err) {
    await addCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "refund:voice-change-failed",
      type:     "REFUND",
      metadata: { voice_id, error: err instanceof Error ? err.message : "unknown" },
    }).catch(() => {});
    const message = err instanceof Error ? err.message : "Voice change failed";
    return jsonError(message, 500);
  }
}
