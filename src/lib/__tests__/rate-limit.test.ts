import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, clientKey } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    // Wipe shared bucket between tests to avoid cross-pollination.
    (globalThis as unknown as { __ylw_rl?: Map<string, unknown> }).__ylw_rl?.clear();
  });

  it("allows requests under the limit", () => {
    for (let i = 0; i < 3; i++) {
      const r = rateLimit({ key: "k", limit: 5, windowMs: 1000 });
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(5 - (i + 1));
    }
  });

  it("blocks once the limit is hit", () => {
    for (let i = 0; i < 3; i++) rateLimit({ key: "k", limit: 3, windowMs: 1000 });
    const r = rateLimit({ key: "k", limit: 3, windowMs: 1000 });
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("isolates buckets per key", () => {
    rateLimit({ key: "a", limit: 1, windowMs: 1000 });
    const r = rateLimit({ key: "b", limit: 1, windowMs: 1000 });
    expect(r.allowed).toBe(true);
  });

  it("returns standard rate-limit headers", () => {
    const r = rateLimit({ key: "h", limit: 7, windowMs: 1000 });
    expect(r.headers["X-RateLimit-Limit"]).toBe("7");
    expect(r.headers["X-RateLimit-Remaining"]).toBe("6");
    expect(typeof r.headers["X-RateLimit-Reset"]).toBe("string");
  });
});

describe("clientKey", () => {
  it("prefers x-forwarded-for", () => {
    const req = new Request("http://x.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientKey(req, "p")).toBe("p:1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("http://x.com", { headers: { "x-real-ip": "9.9.9.9" } });
    expect(clientKey(req, "p")).toBe("p:9.9.9.9");
  });

  it("falls back to 'unknown' when no headers present", () => {
    const req = new Request("http://x.com");
    expect(clientKey(req, "p")).toBe("p:unknown");
  });
});
