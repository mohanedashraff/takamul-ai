// ════════════════════════════════════════════════════════════════
// POST /api/tools/marketing/fetch-url — Click-to-Ad URL extractor
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's `feature: "click_to_ad"` shortcut:
// the user pastes a product URL, we fetch the page server-side, parse
// Open Graph + Twitter Card metadata, and return:
//
//   { title, description, imageUrl, siteName }
//
// The Marketing Studio frontend uses `imageUrl` as the productImage
// (so the user doesn't need to upload anything) and appends `title +
// description` to the prompt for richer product context.
//
// Body : { url: string }
// Reply: { title, description, imageUrl, siteName, url }
//
// Safety: 5s fetch timeout, response body capped at 2 MB, requests
// only fetched server-side (no exposure of user IP), no following of
// `file://` or `localhost` URLs.

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime    = "nodejs";
export const maxDuration = 30;

const Schema = z.object({
  url: z.string().url(),
});

const MAX_BODY_BYTES = 2 * 1024 * 1024;        // 2 MB — plenty for HTML <head>
const FETCH_TIMEOUT  = 5_000;                  // 5 s

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid URL");

  let url: URL;
  try { url = new URL(parsed.data.url); } catch { return jsonError("Invalid URL"); }
  if (!["http:", "https:"].includes(url.protocol)) {
    return jsonError("الرابط لازم يكون http(s) فقط", 400);
  }
  // Block intranet / localhost — naive check is enough for our needs.
  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.endsWith(".local")
  ) {
    return jsonError("الروابط الداخلية ممنوعة", 400);
  }

  // Fetch the page with a short timeout + size cap. We intentionally
  // mimic a regular browser User-Agent so e-commerce sites don't 403
  // the bot — same trick OG scrapers like Slack use.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  let html: string;
  try {
    const res = await fetch(url.href, {
      signal:  controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return jsonError(`الرابط رد بـ${res.status}`, 502);
    const ct = (res.headers.get("content-type") ?? "").toLowerCase();
    if (!ct.includes("text/html") && !ct.includes("xml")) {
      return jsonError("الرابط مش صفحة HTML", 415);
    }
    // Read with body-size cap — abort early if the page is huge.
    const reader = res.body?.getReader();
    if (!reader) return jsonError("لم نقدر نقرأ الرد", 502);
    const chunks: Uint8Array[] = [];
    let total = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BODY_BYTES) {
        try { await reader.cancel(); } catch {}
        break;
      }
      chunks.push(value);
    }
    html = new TextDecoder("utf-8", { fatal: false }).decode(
      Buffer.concat(chunks.map((c) => Buffer.from(c)))
    );
  } catch (err) {
    clearTimeout(timer);
    return jsonError(
      err instanceof Error && err.name === "AbortError"
        ? "الرابط بطيء جدا — انتهت المهلة"
        : "فشل تحميل الرابط",
      502,
    );
  }

  // Parse <head> with cheap regex — we only need a handful of meta
  // tags (title, og:*, twitter:*). A full DOM parser would be overkill
  // and adds a dependency we don't otherwise need.
  const headChunk = html.slice(0, 200_000);   // first 200KB usually has <head>
  const meta = parseHeadMeta(headChunk);

  // Build absolute image URL — many sites use relative or protocol-
  // relative paths in og:image which break when used as <img src>.
  let imageUrl = meta.image;
  if (imageUrl) {
    try { imageUrl = new URL(imageUrl, url.href).href; } catch {}
  }

  return jsonOk({
    url:         url.href,
    title:       meta.title       ?? "",
    description: meta.description ?? "",
    imageUrl:    imageUrl         ?? "",
    siteName:    meta.siteName    ?? url.hostname,
  });
}

// ── Tiny meta-tag parser ─────────────────────────────────────────────
// Returns the most-relevant strings from <head> for product-page
// metadata. Order of preference: og:* > twitter:* > <meta name="..."> >
// <title>. Stops at the first non-empty match for each field.

function parseHeadMeta(html: string): {
  title?:       string;
  description?: string;
  image?:       string;
  siteName?:    string;
} {
  // Helper to extract content of a meta tag matching either property=
  // (Open Graph) or name= (Twitter / generic).
  const metaContent = (key: string): string | undefined => {
    const re = new RegExp(
      `<meta\\s+(?:[^>]*?\\s)?(?:property|name)=["']${key}["'][^>]*?\\s+content=["']([^"']*)["']`,
      "i",
    );
    const m = html.match(re);
    if (m?.[1]) return decodeEntities(m[1]);
    // Try the reversed attribute order (content first).
    const re2 = new RegExp(
      `<meta\\s+(?:[^>]*?\\s)?content=["']([^"']*)["'][^>]*?\\s+(?:property|name)=["']${key}["']`,
      "i",
    );
    const m2 = html.match(re2);
    return m2?.[1] ? decodeEntities(m2[1]) : undefined;
  };

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const fallbackTitle = titleMatch?.[1]?.trim() ? decodeEntities(titleMatch[1]!.trim()) : undefined;

  return {
    title:       metaContent("og:title")       ?? metaContent("twitter:title")       ?? fallbackTitle,
    description: metaContent("og:description") ?? metaContent("twitter:description") ?? metaContent("description"),
    image:       metaContent("og:image")       ?? metaContent("twitter:image")       ?? metaContent("twitter:image:src"),
    siteName:    metaContent("og:site_name"),
  };
}

// Lightweight HTML entity decoder — covers what shows up in meta tags.
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g,  "&")
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g,  "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(parseInt(d, 10)));
}
