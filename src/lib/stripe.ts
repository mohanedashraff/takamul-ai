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
  // ── Solo tiers ─────────────────────────────────────────────────
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
      "10 كريديت إضافي يومياً (يتجدد كل يوم)",
      "احفظ آخر 50 عملية",
    ],
  },
  {
    plan:        "STARTER",
    name:        "بداية",
    englishName: "Starter",
    priceId:     process.env.STRIPE_PRICE_STARTER,
    monthlyUsd:  15,
    credits:     2500,
    features: [
      "2,500 كريديت شهرياً",
      "كل الأدوات + كل القوالب",
      "أولوية متوسطة",
      "تنزيل بدون watermark",
    ],
  },
  {
    plan:        "BASIC",
    name:        "أساسي (قديم)",
    englishName: "Basic (legacy)",
    priceId:     process.env.STRIPE_PRICE_BASIC,
    monthlyUsd:  9,
    credits:     1500,
    features: [
      "1,500 كريديت شهرياً",
      "كل الأدوات الأساسية",
      "تاريخ غير محدود",
    ],
  },
  {
    plan:        "LITE",
    name:        "خفيف",
    englishName: "Lite",
    priceId:     process.env.STRIPE_PRICE_LITE,
    monthlyUsd:  19,
    credits:     3500,
    features: [
      "3,500 كريديت شهرياً",
      "وصول لـSoul ID و Cinema Studio",
      "أولوية أعلى من Starter",
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
      "Brain Activity + Virality Predictor",
      "دعم فني سريع",
    ],
  },
  {
    plan:        "PLUS",
    name:        "بلس",
    englishName: "Plus",
    priceId:     process.env.STRIPE_PRICE_PLUS,
    monthlyUsd:  49,
    credits:     12000,
    features: [
      "12,000 كريديت شهرياً",
      "كل ميزات Pro",
      "FAL.ai LoRA training مدفوع لك (٣ في الشهر)",
      "Marketplace Cards + Marketing Studio full",
      "بدون watermark على كل الـoutputs",
    ],
  },
  {
    plan:        "CREATOR",
    name:        "صانع محتوى",
    englishName: "Creator",
    priceId:     process.env.STRIPE_PRICE_CREATOR,
    monthlyUsd:  79,
    credits:     22000,
    features: [
      "22,000 كريديت شهرياً",
      "كل ميزات Plus",
      "Originals submission مع منصة Yilow",
      "إعلانات Marketing بـPriority Queue",
      "Voice cloning ٥ صوت مجاناً",
    ],
  },
  {
    plan:        "ULTIMATE",
    name:        "الأقصى",
    englishName: "Ultimate",
    priceId:     process.env.STRIPE_PRICE_ULTIMATE,
    monthlyUsd:  99,
    credits:     32000,
    features: [
      "32,000 كريديت شهرياً",
      "كل ميزات Creator",
      "أولوية أعلى من الكل",
      "Beta access لكل النماذج الجديدة",
      "Storyboard Extractor + Canvas مفتوح بدون حد",
    ],
  },
  {
    plan:        "ULTRA",
    name:        "ألترا",
    englishName: "Ultra",
    priceId:     process.env.STRIPE_PRICE_ULTRA,
    monthlyUsd:  129,
    credits:     45000,
    features: [
      "45,000 كريديت شهرياً",
      "كل ميزات Ultimate",
      "Concurrency: 8 وظائف متوازية",
      "Refine (4K upscale) بدون حد",
      "Account manager مخصص",
    ],
  },

  // ── Org tiers ──────────────────────────────────────────────────
  {
    plan:        "TEAM",
    name:        "فريق",
    englishName: "Team",
    priceId:     process.env.STRIPE_PRICE_TEAM,
    monthlyUsd:  149,
    credits:     60000,
    features: [
      "60,000 كريديت شهرياً يتقسموا على الفريق",
      "حتى 10 أعضاء",
      "مكتبة Soul IDs و Moodboards مشتركة",
      "Canvas مشترك بين الفريق",
      "إدارة أدوار (OWNER / ADMIN / MEMBER)",
    ],
  },
  {
    plan:        "ENTERPRISE",
    name:        "مؤسسات",
    englishName: "Enterprise",
    priceId:     process.env.STRIPE_PRICE_ENTERPRISE,
    monthlyUsd:  299,
    credits:     150000,
    features: [
      "150,000 كريديت شهرياً قابلة للتجديد بشكل مخصص",
      "API access كامل + MCP server",
      "وصول مبكر لكل النماذج",
      "SLA + دعم مخصص 24/7",
      "أعضاء غير محدودين + SSO",
      "On-prem deployment متاح",
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
    id: "pack-500",    name: "حزمة 500",    credits:    500, priceId: process.env.STRIPE_PRICE_PACK_500,    usd:   5,
  },
  {
    id: "pack-1500",   name: "حزمة 1500",   credits:   1500, priceId: process.env.STRIPE_PRICE_PACK_1500,   usd:  12, bonus:   100,
  },
  {
    id: "pack-3000",   name: "حزمة 3000",   credits:   3000, priceId: process.env.STRIPE_PRICE_PACK_3000,   usd:  22, bonus:   250,
  },
  {
    id: "pack-5000",   name: "حزمة 5000",   credits:   5000, priceId: process.env.STRIPE_PRICE_PACK_5000,   usd:  35, bonus:   500,
  },
  {
    id: "pack-10000",  name: "حزمة 10000",  credits:  10000, priceId: process.env.STRIPE_PRICE_PACK_10000,  usd:  65, bonus:  1200,
  },
  {
    id: "pack-15000",  name: "حزمة 15000",  credits:  15000, priceId: process.env.STRIPE_PRICE_PACK_15000,  usd:  95, bonus:  2000,
  },
  {
    id: "pack-30000",  name: "حزمة 30000",  credits:  30000, priceId: process.env.STRIPE_PRICE_PACK_30000,  usd: 175, bonus:  5000,
  },
  {
    id: "pack-50000",  name: "حزمة 50000",  credits:  50000, priceId: process.env.STRIPE_PRICE_PACK_50000,  usd: 275, bonus: 10000,
  },
  {
    id: "pack-100000", name: "حزمة 100000", credits: 100000, priceId: process.env.STRIPE_PRICE_PACK_100000, usd: 500, bonus: 25000,
  },
];

export function getCreditPackByPriceId(priceId: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.priceId === priceId);
}

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}
