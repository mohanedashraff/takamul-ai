// ════════════════════════════════════════════════════════════════
// POST /api/tools/cinema-location — Cinema Location generator
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's `cinematic_studio_soul_location`
// flow, where the user just types a place name (real or imagined) +
// picks a style, and the platform generates a cinematic establishing
// shot of that location. No subject prompt needed.
//
// We approximate it by:
//   1. Composing a long-form English prompt from the location name
//      and the picked style descriptor.
//   2. Submitting to MuAPI's `nano-banana-pro` text-to-image endpoint
//      at 2K with a cinematic aspect ratio (16:9 default).
//
// Body (JSON):
//   { location_name: string,
//     style?:        string,    // slug from IMAGE_STYLES (e.g. "movie")
//     aspect_ratio?: "16:9"|"21:9"|"9:16"|"3:2"|"2:3"|"1:1" }
//
// Returns: { url, mimeType:"image/png", urls?, requestId? }

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";

export const runtime    = "nodejs";
export const maxDuration = 240;

const Schema = z.object({
  location_name: z.string().min(1).max(500),
  style:         z.string().max(80).optional(),
  aspect_ratio:  z.enum(["16:9", "21:9", "9:16", "3:2", "2:3", "1:1"]).default("16:9"),
});

// Map a Soul-style slug to a short English style descriptor that gets
// stitched into the prompt. We only enumerate the most common ones —
// for the rest we fall back to slug-to-words conversion. This keeps the
// catalog and the API in sync without maintaining a parallel table.
const STYLE_DESCRIPTORS: Record<string, string> = {
  movie:              "cinematic film still, anamorphic widescreen framing, dramatic motivated lighting",
  realistic:          "photoreal documentary style, natural lighting, true-to-life colors",
  iphone:             "casual smartphone photo aesthetic, natural HDR glow, intimate framing",
  cctv:               "low-resolution surveillance camera footage, slight noise, deadpan framing",
  digitalcam:         "early-2000s point-and-shoot digital camera look, harsh flash, raw textures",
  tokyo_streetstyle:  "Tokyo street photography, layered urban architecture, neon-tinged dusk",
  amalfi_summer:      "Amalfi coast summer light, sunkissed Mediterranean palette, lemon-yellow accents",
  night_beach:        "moonlit beach, dark silhouettes, salt-air haze, intimate atmosphere",
  rainy_day:          "rainy day, wet pavement reflections, muted overcast sky, slow cinematic mood",
  foggy_morning:      "foggy morning, soft diffused light, low-saturation dreamlike stillness",
  spotlight:          "single hard spotlight, high contrast paparazzi flash, instant icon energy",
  sunset_beach:       "golden-hour beach, sky melting from purple to peach, warm rim light",
  mt_fuji:            "Mt. Fuji backdrop, crystal-blue sky, postcard surrealism, minimalist composition",
  street_view:        "wide street view, candid pedestrians, layered urban depth",
  library:            "warm library interior, soft incandescent reading lamps, cozy academia",
  gallery:            "minimalist art gallery, clean white walls, museum lighting, polished",
  subway:             "underground subway platform, cold fluorescent overhead, urban grit",
  flight_mode:        "modern airport terminal, glassy travel atmosphere, designed-to-feel-transient",
  general:            "balanced cinematic mood, naturalistic palette, no genre bias",
};

function styleDescriptor(slug?: string): string {
  if (!slug) return STYLE_DESCRIPTORS.movie!;
  const known = STYLE_DESCRIPTORS[slug];
  if (known) return known;
  // Fallback: slug → readable phrase ("tokyo_drift" → "tokyo drift style")
  return `${slug.replace(/_/g, " ").replace(/-/g, " ")} aesthetic`;
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

  const { location_name, style, aspect_ratio } = parsed.data;

  // Compose the final English prompt. Order: location → style → cinematic
  // tail. Putting the location first keeps the model's primary attention
  // on what to generate.
  const finalPrompt = [
    `Cinematic establishing shot of ${location_name.trim()}.`,
    styleDescriptor(style),
    "atmospheric depth, layered foreground/midground/background composition,",
    "professional cinematography, ultra-detailed, sharp focus, 8K finishing,",
    "no text, no watermarks, no logos, no people in foreground unless intrinsic to the location.",
  ].join(" ");

  const negative_prompt =
    "blurry, low quality, low resolution, oversaturated, distorted geometry, " +
    "watermark, text, logo, signature, jpeg artifacts, deformed, ugly composition";

  const payload: Record<string, unknown> = {
    prompt:          finalPrompt,
    aspect_ratio,
    resolution:      "2k",
    num_images:      1,
    negative_prompt,
  };

  try {
    const result = await submitAndPollServer({
      endpoint:  "nano-banana-pro",
      apiKey:    muKey,
      payload,
      timeoutMs: 4 * 60 * 1000,
    });
    const url  = pickResultUrl(result);
    const urls = Array.isArray(result.urls)
      ? result.urls
      : (Array.isArray(result.outputs) ? result.outputs as string[] : undefined);
    if (!url) return jsonError("لم يتم استلام الناتج من Cinema Location", 502);
    return jsonOk({
      url,
      urls,
      mimeType:  "image/png",
      requestId: result.requestId,
      raw:       result.raw,
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Cinema Location generation failed", 500);
  }
}
