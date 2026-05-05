import { describe, it, expect } from "vitest";
import { PLAN_CATALOG, CREDIT_PACKS, getPlanConfig } from "@/lib/stripe";

describe("Stripe catalog", () => {
  it("includes all four plans", () => {
    const ids = PLAN_CATALOG.map((p) => p.plan).sort();
    expect(ids).toEqual(["BASIC", "ENTERPRISE", "FREE", "PRO"]);
  });

  it("FREE plan is always free and not buyable from outside", () => {
    const free = PLAN_CATALOG.find((p) => p.plan === "FREE")!;
    expect(free.monthlyUsd).toBe(0);
    expect(free.priceId).toBeUndefined();
  });

  it("getPlanConfig falls back to FREE for unknown plans", () => {
    // @ts-expect-error — exercising the fallback path with a bogus value
    const cfg = getPlanConfig("LOL");
    expect(cfg.plan).toBe("FREE");
  });

  it("credit packs are sorted by ascending size", () => {
    const counts = CREDIT_PACKS.map((p) => p.credits);
    const sorted = [...counts].sort((a, b) => a - b);
    expect(counts).toEqual(sorted);
  });

  it("higher tiers grant more credits", () => {
    const free  = PLAN_CATALOG.find((p) => p.plan === "FREE")!;
    const pro   = PLAN_CATALOG.find((p) => p.plan === "PRO")!;
    const ent   = PLAN_CATALOG.find((p) => p.plan === "ENTERPRISE")!;
    expect(pro.credits).toBeGreaterThan(free.credits);
    expect(ent.credits).toBeGreaterThan(pro.credits);
  });
});
