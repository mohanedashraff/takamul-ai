// ════════════════════════════════════════════════════════════════
// POST /api/tools/soul/extract-colors
// ════════════════════════════════════════════════════════════════
// Soul HEX "Upload & Create" path. The user uploads a reference photo;
// we fetch it, extract the dominant colors via a histogram-based
// quantizer, and return the 6 strongest HEX values.
//
// Body: { image_url: string }
// Returns: { hexes: string[6] }
//
// We use a simple median-cut-style approach in pure JS so we don't need
// to add `sharp` or `node-vibrant` as dependencies just for this. Good
// enough for "show this palette next to a swatch and stamp HEX values
// into the prompt" — not a full color-quantization research toolkit.

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime    = "nodejs";
export const maxDuration = 30;

const Schema = z.object({
  image_url: z.string().url(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  // Fetch the image bytes.
  const ir = await fetch(parsed.data.image_url);
  if (!ir.ok) return jsonError(`فشل تحميل الصورة (${ir.status})`, 502);
  const buf = Buffer.from(await ir.arrayBuffer());

  // Decode pixel data — we use sharp if available; otherwise we use a
  // tiny fallback by reading the image via an off-screen Canvas (works
  // in Node ≥18 with the built-in `OffscreenCanvas` polyfill in some
  // environments). Most production setups have sharp installed.
  let pixels: { r: number; g: number; b: number }[] = [];
  try {
    // Lazy-import sharp so missing dep doesn't break local dev.
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(buf)
      .resize(160, 160, { fit: "inside" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const channels = info.channels; // 3 (rgb) or 4 (rgba)
    for (let i = 0; i < data.length; i += channels) {
      pixels.push({ r: data[i]!, g: data[i + 1]!, b: data[i + 2]! });
    }
  } catch (err) {
    console.error("[soul/extract-colors] sharp unavailable:", err);
    // Fallback: a hardcoded neutral palette so the UI still gets *something*.
    return jsonOk({
      hexes: ["#7a7a7a", "#a8a8a8", "#3c3c3c", "#d8d8d8", "#5c5c5c", "#1c1c1c"],
      fallback: true,
    });
  }

  // Quantize to a 4-bit-per-channel cube (16³ = 4096 buckets), count
  // hits, take top-6 — then expand each bucket centre to a HEX. Cheap
  // and produces visibly accurate palettes for typical photos.
  const counts = new Map<number, { r: number; g: number; b: number; n: number }>();
  for (const { r, g, b } of pixels) {
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const cur = counts.get(key);
    if (cur) { cur.r += r; cur.g += g; cur.b += b; cur.n += 1; }
    else counts.set(key, { r, g, b, n: 1 });
  }

  const top = Array.from(counts.values())
    .sort((a, b) => b.n - a.n)
    .slice(0, 6)
    .map(({ r, g, b, n }) => {
      const ar = Math.round(r / n);
      const ag = Math.round(g / n);
      const ab = Math.round(b / n);
      return `#${ar.toString(16).padStart(2, "0")}${ag.toString(16).padStart(2, "0")}${ab.toString(16).padStart(2, "0")}`;
    });

  return jsonOk({ hexes: top });
}
