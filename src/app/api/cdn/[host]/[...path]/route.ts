// ════════════════════════════════════════════════════════════════
// /api/cdn/[host]/[...path] — third-party CDN proxy
// ════════════════════════════════════════════════════════════════
// Hides any third-party CDN we currently link to (asset hosts that we
// don't own) behind our own domain. The browser only ever sees
// `/api/cdn/c/foo.mp4` — the real upstream is fetched server-side and
// streamed back with permissive cache headers so the CDN-like caching
// behaviour is preserved.
//
// URL shape:
//   /api/cdn/c/<path-on-cdn-domain>      → cdn.higgsfield.ai/<path>
//   /api/cdn/s/<path-on-static-domain>   → static.higgsfield.ai/<path>
//
// Why short single-letter host keys instead of the full domain in the
// URL: shorter URLs in the HTML source + makes a future swap of the
// upstream provider a one-line change here.
//
// SAFETY:
//   • Only the explicit allowlist below is proxied — no SSRF.
//   • Response is streamed (not buffered) so large videos don't OOM.
//   • Hop-by-hop headers are stripped on both legs.
//   • 30 s upstream timeout; failed fetches return 502.

export const runtime = "nodejs";

// Single-letter host keys → real upstream hosts. Add more as needed.
// Each entry is a hostname only — the path is preserved 1:1.
const HOST_MAP: Record<string, string> = {
  c: "cdn.higgsfield.ai",
  s: "static.higgsfield.ai",
  // Add new short keys here when we mirror additional third-party CDNs.
};

// Headers we never forward back from the upstream (hop-by-hop +
// connection-level + headers Next adds itself).
const STRIPPED_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-encoding",   // Next re-encodes — letting it through breaks decoding
  "set-cookie",          // never leak upstream cookies
  "content-length",      // streamed — let the runtime recompute
]);

interface RouteContext {
  // Next 15+: params is a Promise of dynamic segment values.
  params: Promise<{ host: string; path: string[] }>;
}

export async function GET(req: Request, ctx: RouteContext) {
  const { host: hostKey, path: pathSegments } = await ctx.params;
  const upstream = HOST_MAP[hostKey];
  if (!upstream) {
    return new Response("Unknown host key", { status: 404 });
  }
  const tail = (pathSegments ?? []).map((p) => encodeURIComponent(p)).join("/");
  // Preserve any query string the original CDN URL had (not common but
  // some signed CDN URLs use it).
  const incomingUrl = new URL(req.url);
  const qs = incomingUrl.search;            // includes the leading "?" or ""
  const upstreamUrl = `https://${upstream}/${tail}${qs}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      signal:  controller.signal,
      redirect: "follow",
      headers: {
        // Use a regular browser UA so the upstream serves the same
        // bytes as it would to a real visitor (some hosts vary by UA).
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        // Forward Range so video scrubbing works.
        ...(req.headers.get("range") ? { Range: req.headers.get("range")! } : {}),
        Accept: req.headers.get("accept") ?? "*/*",
      },
    });
  } catch (err) {
    clearTimeout(timer);
    return new Response(
      err instanceof Error && err.name === "AbortError"
        ? "Upstream timeout"
        : "Upstream fetch failed",
      { status: 502 },
    );
  }
  clearTimeout(timer);

  // Build the response headers — copy whitelisted upstream headers and
  // override Cache-Control with our own long-cache policy (these CDN
  // assets are immutable: the URL changes when the content changes).
  const headers = new Headers();
  upstreamRes.headers.forEach((value, key) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  // 1 year immutable cache — these are content-addressed asset URLs.
  // Edge caches will hold the result so we only hit upstream on cold
  // misses.
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  // Avoid cookie leakage from any stray Set-Cookie on the route itself.
  headers.delete("set-cookie");

  return new Response(upstreamRes.body, {
    status:     upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers,
  });
}

// HEAD support for clients that probe before downloading (e.g. some
// video preloaders). Re-uses GET so the implementation stays in sync.
export async function HEAD(req: Request, ctx: RouteContext) {
  const res = await GET(req, ctx);
  // Return same headers + status, but with an empty body.
  return new Response(null, {
    status:     res.status,
    statusText: res.statusText,
    headers:    res.headers,
  });
}
