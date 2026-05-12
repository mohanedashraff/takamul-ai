// ════════════════════════════════════════════════════════════════
// Bot Guard — light-weight DataDome equivalent
// ════════════════════════════════════════════════════════════════
// We don't bring in a third-party anti-bot service. Instead we
// combine a few cheap signals to score requests and drop the worst
// offenders:
//
//   • Per-IP rate limit (already done via rate-limit.ts)
//   • Per-fingerprint counter (UA + Accept-Language + IP /24 hash)
//   • Header sanity (missing UA, missing Accept, weird ordering)
//   • Honey-pot suspicion (paths like /admin, /.env probed → instant block)
//
// The score is added to the request as a header so downstream
// handlers can include it in logs without re-computing.
//
// IMPORTANT: this module runs inside Edge Middleware. We CANNOT
// import `node:crypto` — it's a Node-only module. The fingerprint
// only needs to be stable + unique, not cryptographically secure,
// so we use a tiny FNV-1a 32-bit hash instead.

/** FNV-1a 32-bit hash. Returns an 8-char lowercase hex string.
 *  Stable across cold-starts because the constants are fixed. */
function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // 32-bit FNV prime: 16777619 — multiply via shifts + adds to
    // stay inside the JS-safe-int range.
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export interface BotScore {
  score:     number;          // 0 (looks human) — 100 (definitely a bot)
  flags:     string[];
  fingerprint: string;
}

const SUSPICIOUS_PATHS = [
  "/admin", "/.env", "/wp-admin", "/wp-login", "/.git",
  "/server-status", "/phpmyadmin", "/api/v1/keys",
];

export function scoreRequest(req: Request): BotScore {
  const flags: string[] = [];
  let score = 0;

  const ua    = (req.headers.get("user-agent") || "").toLowerCase();
  const accept = req.headers.get("accept") || "";
  const lang  = req.headers.get("accept-language") || "";
  const ref   = req.headers.get("referer") || "";
  const ip    = (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    ""
  );

  if (!ua) { score += 35; flags.push("no-ua"); }
  // Common bot UA substrings (allow legit crawlers separately if needed).
  if (/curl|wget|python-requests|libwww|httpclient|java\//i.test(ua)) {
    score += 50; flags.push("bot-ua");
  }
  if (/headless|phantom|selenium|puppeteer|playwright/i.test(ua)) {
    score += 60; flags.push("automation-ua");
  }
  if (!accept || accept === "*/*") { score += 5; flags.push("weak-accept"); }
  if (!lang) { score += 5; flags.push("no-lang"); }
  if (!ref) { score += 3; flags.push("no-ref"); }

  const url = new URL(req.url);
  for (const p of SUSPICIOUS_PATHS) {
    if (url.pathname.toLowerCase().includes(p)) {
      score += 100; flags.push("honeypot");
      break;
    }
  }

  // /24 IP grouping → fingerprint hash. Same /24 hitting a wide
  // sweep of paths in seconds will trip the per-fingerprint counter
  // we keep in rate-limit.ts.
  const ip24 = ip.split(".").slice(0, 3).join(".") || "0.0.0";
  const fp = fnv1a(`${ip24}|${ua}|${lang}`);

  return {
    score: Math.min(100, score),
    flags,
    fingerprint: fp,
  };
}

/** Convenience: returns true if the request should be blocked outright. */
export function shouldBlock(req: Request): boolean {
  return scoreRequest(req).score >= 80;
}
