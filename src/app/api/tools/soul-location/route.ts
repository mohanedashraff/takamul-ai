// ════════════════════════════════════════════════════════════════
// POST /api/tools/soul-location — Soul Studio location plate
// ════════════════════════════════════════════════════════════════
// Soul-specific counterpart to /api/tools/cinema-location. Same idea
// as the cinema version but tuned for Soul Studio — output is a
// clean empty backdrop the user can composite a Soul ID character
// onto. No people in frame, neutral light, slight depth.
//
// Body  : { location_name, style?, aspect_ratio? }
// Reply : { url, urls?, finalPrompt }
//
// Credit cost: 4 (cheaper than cinema-location since no genre staging).

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";
import { deductCredits, addCredits, InsufficientCreditsError } from "@/lib/credits";

export const runtime    = "nodejs";
export const maxDuration = 180;

const COST = 4;

const Schema = z.object({
  location_name: z.string().min(1).max(500),
  style:         z.string().max(80).optional(),
  aspect_ratio:  z.enum(["16:9", "21:9", "9:16", "3:2", "2:3", "1:1"]).default("16:9"),
  num_images:    z.number().int().min(1).max(4).default(1),
});

const STYLE_DESCRIPTORS: Record<string, string> = {
  realistic:          "photoreal documentary style, natural lighting, true-to-life colours",
  iphone:             "casual smartphone photo aesthetic, natural HDR, intimate framing",
  tokyo_streetstyle:  "Tokyo street photography, layered urban architecture, neon-tinged dusk",
  amalfi_summer:      "Amalfi coast summer light, sunkissed Mediterranean palette",
  night_beach:        "moonlit beach, salt-air haze, intimate atmosphere",
  rainy_day:          "rainy day, wet pavement reflections, muted overcast sky",
  foggy_morning:      "foggy morning, soft diffused light, low-saturation dreamlike stillness",
  sunset_beach:       "golden-hour beach, sky melting from purple to peach",
  library:            "warm library interior, soft incandescent reading lamps",
  gallery:            "minimalist art gallery, clean white walls, museum lighting",
  subway:             "underground subway platform, cold fluorescent overhead",
  studio_neutral:     "infinite neutral mid-gray seamless studio backdrop, softbox lighting",
  general:            "balanced natural mood, naturalistic palette",
};

function styleDescriptor(slug?: string): string {
  if (!slug) return STYLE_DESCRIPTORS.general!;
  return STYLE_DESCRIPTORS[slug] ?? `${slug.replace(/[_-]/g, " ")} aesthetic`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const muKey = process.env.MU_API_KEY;
  if (!muKey) return jsonError("MuAPI key missing on server", 503);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { location_name, style, aspect_ratio, num_images } = parsed.data;

  const finalPrompt = [
    `Empty location plate of ${location_name.trim()}.`,
    styleDescriptor(style),
    "No people, no main subject in the frame — this is a backdrop reference plate.",
    "Composition: foreground / midground / background depth layers, naturalistic lighting,",
    "leaves clean negative-space in the centre-foreground for a Soul ID character composite,",
    "photoreal 35 mm look, no overlay text, no logos.",
  ].join(" ");

  const totalCost = COST * num_images;

  let balanceAfter: number;
  try {
    const r = await deductCredits({
      userId:   session.user.id,
      amount:   totalCost,
      reason:   "tool:soul-location",
      metadata: { location_name, num_images },
    });
    balanceAfter = r.balanceAfter;
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return jsonError("رصيد الكريديت غير كافٍ", 402);
    }
    throw err;
  }

  try {
    const tasks = Array.from({ length: num_images }).map(() =>
      submitAndPollServer({
        endpoint:  "nano-banana-pro",
        apiKey:    muKey,
        payload: {
          prompt:       finalPrompt,
          aspect_ratio,
          resolution:   "2k",
        },
        timeoutMs: 3 * 60 * 1000,
      }).then((r) => pickResultUrl(r)),
    );
    const results = await Promise.allSettled(tasks);
    const urls = results
      .filter((r): r is PromiseFulfilledResult<string | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter(Boolean) as string[];

    if (urls.length === 0) {
      await addCredits({
        userId:   session.user.id,
        amount:   totalCost,
        reason:   "refund:soul-location-no-result",
        type:     "REFUND",
        metadata: { location_name },
      }).catch(() => {});
      return jsonError("لم يتم استلام أي ناتج من النموذج", 502);
    }

    const missing = num_images - urls.length;
    if (missing > 0) {
      await addCredits({
        userId:   session.user.id,
        amount:   COST * missing,
        reason:   "refund:soul-location-partial",
        type:     "REFUND",
        metadata: { location_name, missing },
      }).catch(() => {});
    }

    return jsonOk({
      url:            urls[0],
      urls,
      finalPrompt,
      creditsBalance: balanceAfter + COST * missing,
    });
  } catch (err) {
    await addCredits({
      userId:   session.user.id,
      amount:   totalCost,
      reason:   "refund:soul-location-failed",
      type:     "REFUND",
      metadata: { location_name, error: err instanceof Error ? err.message : "unknown" },
    }).catch(() => {});
    const message = err instanceof Error ? err.message : "Soul Location failed";
    return jsonError(message, 500);
  }
}
