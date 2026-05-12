// ════════════════════════════════════════════════════════════════
// Webhook signing — `X-Yilow-Signature` header
// ════════════════════════════════════════════════════════════════
// We sign every outbound webhook (and verify incoming MuAPI replays)
// with an HMAC-SHA256 over `{timestamp}.{body}`. Receivers should
// validate by recomputing the HMAC and comparing in constant time.
//
// Header format mirrors the Stripe / Slack / GitHub convention:
//
//   X-Yilow-Signature: t=1715571000,v1=64-char-hex-hmac
//
// `WEBHOOK_SECRET` is the shared secret; rotate by appending
// `WEBHOOK_SECRET_OLD` and supporting both for one deploy.

import { createHmac, timingSafeEqual } from "node:crypto";

const TIMESTAMP_TOLERANCE_SEC = 5 * 60; // 5 minutes

export interface SignResult {
  header:    string;
  timestamp: number;
  signature: string;
}

export function signWebhookBody(body: string, secret?: string): SignResult {
  const s = secret ?? process.env.WEBHOOK_SECRET ?? "";
  if (!s) throw new Error("WEBHOOK_SECRET is not configured");
  const ts  = Math.floor(Date.now() / 1000);
  const sig = hmac(`${ts}.${body}`, s);
  return {
    header:    `t=${ts},v1=${sig}`,
    timestamp: ts,
    signature: sig,
  };
}

/** Verify an incoming `X-Yilow-Signature` header. Returns `true` on
 *  match within the timestamp tolerance, `false` otherwise. Never
 *  throws — return-value-based so callers can decide how to respond. */
export function verifyWebhookSignature(opts: {
  header: string | null;
  body:   string;
  secret?: string | string[]; // accepts an array to support rotation
}): boolean {
  if (!opts.header) return false;
  const parts = Object.fromEntries(
    opts.header.split(",").map((p) => p.split("=") as [string, string]),
  );
  const ts = parseInt(parts.t ?? "", 10);
  const sig = parts.v1 ?? "";
  if (!ts || !sig) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > TIMESTAMP_TOLERANCE_SEC) return false;

  const secrets = Array.isArray(opts.secret)
    ? opts.secret
    : opts.secret
      ? [opts.secret]
      : [process.env.WEBHOOK_SECRET, process.env.WEBHOOK_SECRET_OLD].filter(Boolean) as string[];
  if (secrets.length === 0) return false;

  for (const s of secrets) {
    const expected = hmac(`${ts}.${opts.body}`, s);
    if (constantTimeEqual(expected, sig)) return true;
  }
  return false;
}

function hmac(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}
