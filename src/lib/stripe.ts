// ════════════════════════════════════════════════════════════════
// Stripe — server-side singleton + plan/credit-pack catalog
// ════════════════════════════════════════════════════════════════
// We instantiate a single Stripe client with the secret key so every
// API route shares the same connection pool.

import Stripe from "stripe";
import type { Plan } from "@/generated/prisma/client";

let _stripe: Stripe | null = null;

/** Access the Stripe SDK. Throws if STRIPE_SECRET_KEY is missing —
 *  callers should check `isStripeConfigured()` first to surface a
 *  user-facing 503 instead of a 500. */
export function stripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key);
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// ── Plan catalog ─────────────────────────────────────────────────────
// One row per buyable plan. `priceId` is the Stripe price id — set
// these in the dashboard, then drop them in env vars. `credits` is the
// monthly allowance refilled on each successful invoice.

export interface PlanConfig {
  plan:        Plan;
  name:        string;            // Arabic display name
  englishName: string;
  priceId:     string | undefined; // env-driven
  monthlyUsd:  number;             // for UI
  credits:     number;             // monthly credit allowance
  features:    string[];           // bullet points (Arabic)
  popular?:    boolean;
}

export const PLAN_CATALOG: PlanConfig[] = [
  {
    plan:        "FREE",
    name:        "مجاني",
    englishName: "Free",
    priceId:     undefined,
    monthlyUsd:  0,
    credits:     100,
    features: [
      "100 كريديت شهرياً",
      "كل الأدوات الأساسية",
      "احفظ آخر 50 عملية",
    ],
  },
  {
    plan:        "BASIC",
    name:        "أساسي",
    englishName: "Basic",
    priceId:     process.env.STRIPE_PRICE_BASIC,
    monthlyUsd:  9,
    credits:     1500,
    features: [
      "1,500 كريديت شهرياً",
      "كل الأدوات",
      "أولوية الطلبات",
      "تاريخ غير محدود",
    ],
  },
  {
    plan:        "PRO",
    name:        "احترافي",
    englishName: "Pro",
    priceId:     process.env.STRIPE_PRICE_PRO,
    monthlyUsd:  29,
    credits:     6000,
    popular:     true,
    features: [
      "6,000 كريديت شهرياً",
      "كل النماذج المتقدمة (Sora 2, Veo 3.1, Kling Pro)",
      "أولوية أعلى للطلبات",
      "تنزيل بدقة 4K",
      "دعم فني سريع",
    ],
  },
  {
    plan:        "ENTERPRISE",
    name:        "مؤسسات",
    englishName: "Enterprise",
    priceId:     process.env.STRIPE_PRICE_ENTERPRISE,
    monthlyUsd:  99,
    credits:     25000,
    features: [
      "25,000 كريديت شهرياً",
      "API access مخصص",
      "وصول مبكر للنماذج الجديدة",
      "SLA + دعم مخصص",
      "حسابات فريق",
    ],
  },
];

export function getPlanConfig(plan: Plan): PlanConfig {
  return PLAN_CATALOG.find((p) => p.plan === plan) ?? PLAN_CATALOG[0]!;
}

export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return PLAN_CATALOG.find((p) => p.priceId === priceId);
}

// ── Credit packs (one-off purchases) ─────────────────────────────────

export interface CreditPack {
  id:      string;
  name:    string;       // Arabic
  credits: number;
  priceId: string | undefined;
  usd:     number;
  bonus?:  number;       // extra credits if any (UI only)
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "pack-500",   name: "حزمة 500",   credits:  500,  priceId: process.env.STRIPE_PRICE_PACK_500,   usd: 5,
  },
  {
    id: "pack-1500",  name: "حزمة 1500",  credits: 1500,  priceId: process.env.STRIPE_PRICE_PACK_1500,  usd: 12,
    bonus: 100,
  },
  {
    id: "pack-5000",  name: "حزمة 5000",  credits: 5000,  priceId: process.env.STRIPE_PRICE_PACK_5000,  usd: 35,
    bonus: 500,
  },
  {
    id: "pack-15000", name: "حزمة 15000", credits: 15000, priceId: process.env.STRIPE_PRICE_PACK_15000, usd: 95,
    bonus: 2000,
  },
];

export function getCreditPackByPriceId(priceId: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.priceId === priceId);
}

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}
