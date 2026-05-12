// ════════════════════════════════════════════════════════════════
// POST /api/marketing/products/import-app-store
// ════════════════════════════════════════════════════════════════
// Paste an apps.apple.com URL → fetch the app's metadata via Apple's
// public iTunes Lookup API → return name + icon + screenshots in
// the same shape POST /api/marketing/products expects.
//
// Body  : { url: string }   — e.g. "https://apps.apple.com/us/app/x/id1234567890"
// Reply : { product: { name, description, imageUrl, screenshots, source: "app-store" } }
//
// We don't persist here — the client decides whether to save the
// result (it might preview before committing).

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime    = "nodejs";
export const maxDuration = 30;

const Schema = z.object({ url: z.string().url() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const u = parsed.data.url;
  const idMatch = u.match(/\/id(\d+)/);
  if (!idMatch) {
    return jsonError("الرابط لازم يكون من apps.apple.com مع id رقمي", 400);
  }
  const appId = idMatch[1]!;

  // Country prefix (e.g. /us/, /eg/, /sa/). Default to "us".
  const countryMatch = u.match(/apps\.apple\.com\/(\w{2})\//);
  const country = (countryMatch?.[1] ?? "us").toLowerCase();

  try {
    const r = await fetch(
      `https://itunes.apple.com/lookup?id=${appId}&country=${country}`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!r.ok) return jsonError(`Apple lookup failed (${r.status})`, 502);
    const data = await r.json() as {
      results?: Array<{
        trackName?:           string;
        sellerName?:          string;
        description?:         string;
        artworkUrl512?:       string;
        artworkUrl100?:       string;
        screenshotUrls?:      string[];
        ipadScreenshotUrls?:  string[];
        trackViewUrl?:        string;
        primaryGenreName?:    string;
      }>;
    };
    const hit = data.results?.[0];
    if (!hit) return jsonError("لم يتم العثور على التطبيق", 404);

    const product = {
      name:        hit.trackName ?? "Unnamed App",
      description: [hit.description, hit.sellerName ? `Publisher: ${hit.sellerName}` : null]
        .filter(Boolean).join("\n\n") || undefined,
      url:         hit.trackViewUrl ?? u,
      imageUrl:    hit.artworkUrl512 || hit.artworkUrl100 || "",
      screenshots: (hit.screenshotUrls ?? hit.ipadScreenshotUrls ?? []).slice(0, 10),
      source:      "app-store" as const,
      category:    hit.primaryGenreName,
    };
    return jsonOk({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "App Store fetch failed";
    return jsonError(message, 502);
  }
}
