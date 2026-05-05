// ════════════════════════════════════════════════════════════════
// Rate limiting — sliding-window in-memory limiter
// ════════════════════════════════════════════════════════════════
// Lightweight per-process limiter — fine for a single Node deployment
// (Yilow runs PM2 single-instance behind nginx). For multi-instance /
// edge deployments, swap the underlying store for Upstash Redis.
//
//   const r = await rateLimit({ key: `register:${ip}`, limit: 5, windowMs: 60_000 });
//   if (!r.allowed) return new Response("Too many requests", { status: 429 });

interface Bucket {
  count:    number;
  resetAt:  number;
}

const buckets: Map<string, Bucket> = (globalThis as unknown as { __ylw_rl?: Map<string, Bucket> }).__ylw_rl
  ?? new Map<string, Bucket>();

(globalThis as unknown as { __ylw_rl?: Map<string, Bucket> }).__ylw_rl = buckets;

export interface RateLimitOptions {
  key:      string;
  limit:    number;       // max requests per window
  windowMs: number;       // window size in ms
}

export interface RateLimitResult {
  allowed:    boolean;
  remaining:  number;
  resetAt:    number;     // unix ms
  /** Convenience header set we can attach to the response. */
  headers:    Record<string, string>;
}

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(opts.key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(opts.key, bucket);
  }

  bucket.count += 1;
  const allowed   = bucket.count <= opts.limit;
  const remaining = Math.max(0, opts.limit - bucket.count);

  return {
    allowed,
    remaining,
    resetAt: bucket.resetAt,
    headers: {
      "X-RateLimit-Limit":     String(opts.limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset":     String(Math.floor(bucket.resetAt / 1000)),
    },
  };
}

/** Best-effort client identifier. Prefer x-forwarded-for, fall back to a
 *  literal "unknown" so behaviour is at least deterministic. */
export function clientKey(req: Request, prefix: string): string {
  const xff = req.headers.get("x-forwarded-for");
  const ip  = (xff ? xff.split(",")[0] : "")?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `${prefix}:${ip}`;
}
