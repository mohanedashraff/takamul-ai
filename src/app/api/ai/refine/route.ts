// ════════════════════════════════════════════════════════════════
// POST /api/ai/refine — second-pass quality enhancement
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's `use_refiner: true` flag — but exposed
// as a per-result button so the user only pays for the shots they like.
// Routes the supplied image URL through MuAPI's `ai-image-upscaler`
// (2x super-resolution + detail recovery) and returns the new URL.
//
// Body  : { url: string, generationId?: string }
// Reply : { url: string, originalUrl: string, creditsBalance: number }
//
// Credit cost: 3 (flat). Refunded on failure via the same pattern as
// Soul's generate route.

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";
import { deductCredits, addCredits, InsufficientCreditsError } from "@/lib/credits";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime    = "nodejs";
export const maxDuration = 120;

const REFINE_COST = 3;

const Schema = z.object({
  url:           z.string().url(),
  generationId:  z.string().optional(),
});

// Only allow refining URLs we trust (came from MuAPI / our CDN mirror).
// Stops users from running our paid upscaler on arbitrary internet URLs.
//
// The two reference-platform CDN hosts at the end are kept because
// some of our seed catalog thumbnails (and any historical generations
// that used them) still live there. We proxy them through /api/cdn
// in the UI so they never leak in the URL bar, but the underlying
// hostname has to stay on the trust list so refine works on them.
const TRUSTED_HOSTS = [
  "muapi.ai",
  "static.muapi.ai",
  "cdn.muapi.ai",
  "muapi-files.s3.amazonaws.com",
  "d3adwkbyhxyrtq.cloudfront.net",
  "d8j0ntlcm91z4.cloudfront.net",
  // Reference-CDN hosts — kept for legacy seed catalog. Hidden from UI
  // via /api/cdn/[host]/[...path] proxy.
  "static.higgsfield.ai",
  "cdn.higgsfield.ai",
];

function isTrustedUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return TRUSTED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h));
  } catch { return false; }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const muKey = process.env.MU_API_KEY;
  if (!muKey) return jsonError("MuAPI key missing on server", 503);

  // Cap to a reasonable burst — refines are quick but cost real money.
  const rl = rateLimit({ key: clientKey(req, "refine"), limit: 60, windowMs: 60 * 60 * 1000 });
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

  const { url, generationId } = parsed.data;
  if (!isTrustedUrl(url)) {
    return jsonError("URL مش من مصدر موثوق", 400);
  }

  // ── Charge first; refund on failure ──
  let balanceAfter: number;
  try {
    const r = await deductCredits({
      userId:   session.user.id,
      amount:   REFINE_COST,
      reason:   "tool:refine",
      metadata: { sourceUrl: url, generationId },
    });
    balanceAfter = r.balanceAfter;
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return jsonError("رصيد الكريديت غير كافٍ", 402);
    }
    throw err;
  }

  try {
    // Iter 16: `ai-image-upscaler` is in the static registry file
    // but returns 404 on the live MuAPI gateway. `topaz-image-upscale`
    // is the live equivalent (HTTP 422 on empty body = exists).
    const result = await submitAndPollServer({
      endpoint:  "topaz-image-upscale",
      apiKey:    muKey,
      payload:   { image_url: url },
      timeoutMs: 90 * 1000,
    });
    const enhancedUrl = pickResultUrl(result);
    if (!enhancedUrl) {
      // Refund — upscaler returned nothing usable.
      await addCredits({
        userId:   session.user.id,
        amount:   REFINE_COST,
        reason:   "refund:refine-no-result",
        type:     "REFUND",
        metadata: { generationId, sourceUrl: url },
      }).catch(() => {});
      return jsonError("لم يتم استلام الناتج من المُحسِّن", 502);
    }

    // Best-effort: link the refined URL back onto the source generation
    // (so the user's history reflects the refined version).
    if (generationId) {
      prisma.generation.findFirst({
        where:  { id: generationId, userId: session.user.id },
        select: { id: true, outputs: true },
      }).then((gen) => {
        if (!gen) return;
        const prev = (gen.outputs ?? {}) as Record<string, unknown>;
        return prisma.generation.update({
          where: { id: gen.id },
          data:  {
            outputs: {
              ...prev,
              url:           enhancedUrl,
              originalUrl:   url,
              refinedAt:     new Date().toISOString(),
            } as never,
          },
        });
      }).catch((err) => console.error("[refine] generation update failed", err));
    }

    return jsonOk({
      url:            enhancedUrl,
      originalUrl:    url,
      creditsBalance: balanceAfter,
    });
  } catch (err) {
    // Refund on any failure path
    await addCredits({
      userId:   session.user.id,
      amount:   REFINE_COST,
      reason:   "refund:refine-failed",
      type:     "REFUND",
      metadata: { generationId, sourceUrl: url, error: err instanceof Error ? err.message : "unknown" },
    }).catch(() => {});
    const message = err instanceof Error ? err.message : "Refine failed";
    return jsonError(message, 500);
  }
}
