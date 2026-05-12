// ════════════════════════════════════════════════════════════════
// POST /api/audio/dubbing — translate + lipsync a video
// ════════════════════════════════════════════════════════════════
// Two-stage pipeline:
//   1. ElevenLabs Dubbing API → translates the audio track to the
//      target language (ISO 639-3) preserving the speaker's tone.
//   2. MuAPI `latentsync-video` (or `sync-lipsync`) re-aligns the
//      lip movements to the new audio.
//
// We hide the two-stage detail from the client — the route returns
// a single dubbed-+-lipsynced video URL once the pipeline finishes.
//
// Body  : { video_url, target_language, source_language?, watermark? }
// Reply : { url, creditsBalance }
//
// Credit cost: 22 (flat). Refunded on any failure.

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";
import { deductCredits, addCredits, InsufficientCreditsError } from "@/lib/credits";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime    = "nodejs";
export const maxDuration = 540;

const COST = 22;

const Schema = z.object({
  video_url:        z.string().url(),
  target_language:  z.string().min(2).max(16),
  source_language:  z.string().min(2).max(16).default("auto"),
  watermark:        z.boolean().default(false),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const muKey   = process.env.MU_API_KEY;
  const elKey   = process.env.ELEVENLABS_API_KEY;
  if (!muKey)   return jsonError("MuAPI key missing on server", 503);
  if (!elKey)   return jsonError("الميزة دي محتاجة مفتاح ElevenLabs", 503);

  const rl = rateLimit({ key: clientKey(req, "dubbing"), limit: 12, windowMs: 60 * 60 * 1000 });
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

  const { video_url, target_language, source_language, watermark } = parsed.data;

  // ── Charge first; refund on failure ──
  let balanceAfter: number;
  try {
    const r = await deductCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "tool:dubbing",
      metadata: { target_language, source_language },
    });
    balanceAfter = r.balanceAfter;
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return jsonError("رصيد الكريديت غير كافٍ", 402);
    }
    throw err;
  }

  try {
    // ── 1. Submit dubbing job to ElevenLabs ──
    // The dubbing endpoint accepts `source_url` OR a file upload — we use
    // the URL form to avoid re-uploading. ElevenLabs returns a dubbing_id;
    // we then poll their /v1/dubbing/{id} until status==done.
    const dubForm = new FormData();
    dubForm.append("source_url",        video_url);
    dubForm.append("target_lang",       target_language);
    dubForm.append("source_lang",       source_language);
    dubForm.append("watermark",         watermark ? "true" : "false");
    dubForm.append("dubbing_studio",    "false");
    dubForm.append("num_speakers",      "0"); // auto-detect

    const dubSubmit = await fetch("https://api.elevenlabs.io/v1/dubbing", {
      method:  "POST",
      headers: { "xi-api-key": elKey },
      body:    dubForm,
    });
    if (!dubSubmit.ok) {
      const errText = await dubSubmit.text().catch(() => "");
      throw new Error(`ElevenLabs dubbing submit failed: ${errText.slice(0, 200)}`);
    }
    const submitJson = await dubSubmit.json().catch(() => ({} as Record<string, unknown>));
    const dubbingId  = String(submitJson.dubbing_id ?? "");
    if (!dubbingId) throw new Error("ElevenLabs did not return a dubbing_id");

    // ── 2. Poll until ready (8 min cap) ──
    const deadline = Date.now() + 8 * 60 * 1000;
    let dubbedAudioUrl = "";
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 5_000));
      const statusRes = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbingId}`, {
        headers: { "xi-api-key": elKey },
      });
      if (!statusRes.ok) continue;
      const statusJson = await statusRes.json().catch(() => ({} as Record<string, unknown>));
      const status = String(statusJson.status ?? "").toLowerCase();
      if (status === "done" || status === "completed") {
        // Try a few shapes the SDK has used over time.
        dubbedAudioUrl =
          String(statusJson.audio_url ?? statusJson.media_url ?? statusJson.url ?? "");
        if (!dubbedAudioUrl) {
          // Some plans require a separate /audio fetch — get it directly.
          const audioRes = await fetch(
            `https://api.elevenlabs.io/v1/dubbing/${dubbingId}/audio/${target_language}`,
            { headers: { "xi-api-key": elKey } },
          );
          if (!audioRes.ok) throw new Error("Could not fetch dubbed audio");
          const audioBuf = await audioRes.arrayBuffer();
          // Upload to MuAPI storage so we get a public URL.
          const form = new FormData();
          form.append("file",
            new Blob([audioBuf], { type: "audio/mpeg" }),
            `dubbed-${dubbingId}.mp3`,
          );
          const up = await fetch("https://api.muapi.ai/api/v1/upload_file", {
            method:  "POST",
            headers: { "x-api-key": muKey },
            body:    form,
          });
          if (!up.ok) throw new Error("Failed to upload dubbed audio to storage");
          const upJson = await up.json().catch(() => ({} as Record<string, unknown>));
          dubbedAudioUrl =
            String(upJson.url ?? upJson.file_url ?? upJson.fileUrl ?? "");
          if (!dubbedAudioUrl) throw new Error("Storage upload returned no URL");
        }
        break;
      }
      if (status === "failed" || status === "error") {
        throw new Error(`ElevenLabs dubbing failed: ${String(statusJson.error ?? "unknown")}`);
      }
    }
    if (!dubbedAudioUrl) throw new Error("ElevenLabs dubbing timed out");

    // ── 3. Re-lipsync the original video against the dubbed audio ──
    const lipsync = await submitAndPollServer({
      endpoint:  "latentsync-video",
      apiKey:    muKey,
      payload:   { video_url, audio_url: dubbedAudioUrl },
      timeoutMs: 6 * 60 * 1000,
    });
    const dubbedVideoUrl = pickResultUrl(lipsync);
    if (!dubbedVideoUrl) throw new Error("Lipsync returned no URL");

    return jsonOk({ url: dubbedVideoUrl, creditsBalance: balanceAfter, dubbingId });
  } catch (err) {
    await addCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "refund:dubbing-failed",
      type:     "REFUND",
      metadata: { target_language, error: err instanceof Error ? err.message : "unknown" },
    }).catch(() => {});
    const message = err instanceof Error ? err.message : "Dubbing failed";
    return jsonError(message, 500);
  }
}
