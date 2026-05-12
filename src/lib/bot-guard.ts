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

import { createHash } from "node:crypto";

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
  const fp = createHash("sha256")
    .update(`${ip24}|${ua}|${lang}`)
    .digest("hex")
    .slice(0, 16);

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
