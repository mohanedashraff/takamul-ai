// ════════════════════════════════════════════════════════════════
// Product Photoshoot Studio — data layer
// ════════════════════════════════════════════════════════════════
// Yilow's product-photoshoot studio — full-page UI at
// `/product-photoshoot`. Drives the 10-mode photography flow.
//
// 10 modes, each with:
//   • A short Arabic name + English label
//   • A "best for" hint
//   • A default aspect ratio per mode (the reference's enhancer
//     auto-picks one — we hardcode the recommended default)
//   • A mode-specific Claude system prompt that rewrites the user's
//     short intent into a 200+ word photography brief
//
// At runtime the API route picks the mode's system_prompt, runs the
// user's short intent through Claude (via OpenRouter), and submits the
// enhanced prompt to nano-banana-pro with the user's product image.

import type { LucideIcon } from "lucide-react";
import {
  Camera, Coffee, Heart, Image as ImageIcon, Layout,
  LayoutGrid, ShoppingBag, Sparkles, Wand2, RefreshCw,
} from "lucide-react";

export interface ProductPhotoshootMode {
  id:           string;
  name:         string;        // Arabic display
  englishName:  string;
  desc:         string;        // 1-line Arabic hint
  icon:         LucideIcon;
  /** Best aspect ratio default for this mode's intended platform. */
  defaultAspect: string;
  /** Claude Sonnet 4.5 system prompt — rewrites user intent into a
   *  full photography brief tailored to this mode. */
  systemPrompt:  string;
}

const COMMON_RULES = `
RULES:
- Write a single rich English photography brief, 150-220 words.
- Include: scene, lighting setup, camera + lens hints, composition,
  surface/props/environment, color/mood vocabulary, finishing cues.
- Keep the user's product as the unambiguous subject — never replace it.
- NO text overlays. NO watermarks. NO logos other than the product's.
- Output the brief ONLY — no preamble, no quotes, no markdown headers.
- If the user input is in Arabic, translate intent and write in English.
`.trim();

export const PRODUCT_PHOTOSHOOT_MODES: ProductPhotoshootMode[] = [
  {
    id:            "product_shot",
    name:          "صورة منتج كلاسيكية",
    englishName:   "Product Shot",
    desc:          "خلفية بيضاء أو ستوديو نظيف — كتالوج / Shopify",
    icon:          Camera,
    defaultAspect: "1:1",
    systemPrompt:  `You are a product photographer producing a single clean catalog/Shopify-grade photo.
Vocabulary to use: clean white seamless cyc, softboxes, large diffused key light + fill, no harsh shadows, true-to-life color, dust-free product surface, hero center composition, slight ground reflection. Optional: subtle shadow under the product to ground it.
${COMMON_RULES}`,
  },
  {
    id:            "lifestyle_scene",
    name:          "مشهد حياتي",
    englishName:   "Lifestyle Scene",
    desc:          "المنتج في بيئة حقيقية — يدين / حركة / إنستجرام feed",
    icon:          Coffee,
    defaultAspect: "4:5",
    systemPrompt:  `You are a lifestyle product photographer capturing the product in a real-world environment.
Vocabulary to use: candid moment, natural light, hands or partial body interacting with the product, layered foreground / midground / background, atmospheric depth, painterly bokeh, real-life surface (kitchen counter / desk / sunlit cafe / garden), warm natural color science, IG-feed-ready composition.
${COMMON_RULES}`,
  },
  {
    id:            "closeup_product_with_person",
    name:          "كلوز-أب مع شخص",
    englishName:   "Closeup with Person",
    desc:          "Tight crop يدين / وجه — beauty / تطبيق منتج",
    icon:          Heart,
    defaultAspect: "4:5",
    systemPrompt:  `You are a beauty/lifestyle close-up photographer doing tight macro framing of the product alongside hands or a partial face.
Vocabulary to use: macro lens compression, shallow depth of field with the product tack-sharp, soft beauty light, glowing skin tones, intimate framing, dewy texture detail, fingertip / lip / jaw glimpse showing the product in use.
${COMMON_RULES}`,
  },
  {
    id:            "moodboard_pin",
    name:          "بِن Pinterest",
    englishName:   "Moodboard Pin",
    desc:          "عمودي 2:3 بحس Pinterest aesthetic",
    icon:          ImageIcon,
    defaultAspect: "2:3",
    systemPrompt:  `You are a Pinterest content designer producing a vertical 2:3 moodboard pin.
Vocabulary to use: Pinterest-native aesthetic, layered styling, soft pastel or earthy palette depending on the brand mood, painterly natural light, slight grain, magazine-tear textures, harmonious color story, vertical composition with breathing room at the top for an imagined caption.
${COMMON_RULES}`,
  },
  {
    id:            "hero_banner",
    name:          "بانر هيرو",
    englishName:   "Hero Banner",
    desc:          "أفقي واسع للموقع / إيميل / حملة",
    icon:          Layout,
    defaultAspect: "21:9",
    systemPrompt:  `You are a brand designer producing a wide hero banner for a website / email / launch campaign.
Vocabulary to use: ultra-wide cinematic composition, generous negative space on one side for headline copy, hero product placed off-center using the rule of thirds, bold lighting, high-contrast color blocking, premium agency feel, depth and atmosphere behind the product.
${COMMON_RULES}`,
  },
  {
    id:            "social_carousel",
    name:          "كاروسيل سوشيال",
    englishName:   "Social Carousel",
    desc:          "سلايدات متناسقة لـIG / LinkedIn / Facebook",
    icon:          LayoutGrid,
    defaultAspect: "1:1",
    systemPrompt:  `You are a social-media art director producing a single slide that fits inside a coordinated 3-10 slide carousel.
Vocabulary to use: square 1:1 composition, locked visual system (consistent palette, type-friendly negative space, repeating motif), bold focal point, slide-1 hook framing, leave room for headline + CTA copy. Treat this as part of a series — design as if 9 sister slides will share the same lighting + color grade.
${COMMON_RULES}`,
  },
  {
    id:            "ad_creative_pack",
    name:          "حزمة إعلانات",
    englishName:   "Ad Creative Pack",
    desc:          "Meta / TikTok / Pinterest — منسّقة كحزمة",
    icon:          ShoppingBag,
    defaultAspect: "4:5",
    systemPrompt:  `You are an ad creative director producing a single still that belongs to a coordinated paid-ads pack (Meta / TikTok / Pinterest).
Vocabulary to use: scroll-stopping hook composition, bold product hero, high-contrast color contrast against the platform's UI tone, copy-ready negative space for headline + CTA, performance-marketing aesthetic (clean but eye-catching), platform-aware framing.
${COMMON_RULES}`,
  },
  {
    id:            "virtual_model_tryout",
    name:          "موديل افتراضي",
    englishName:   "Virtual Model Try-on",
    desc:          "موديل AI بيلبس أو يستخدم المنتج",
    icon:          Sparkles,
    defaultAspect: "3:4",
    systemPrompt:  `You are a fashion/product photographer with an AI model wearing or visibly using the product.
Vocabulary to use: confident model framing (three-quarter or upper-body), studio or contextual location, polished editorial light, the product clearly visible and worn / used naturally, model expression aligned with the product's vibe, fashion-magazine composition.
${COMMON_RULES}`,
  },
  {
    id:            "conceptual_product",
    name:          "مفهوم سريالي",
    englishName:   "Conceptual / Surreal",
    desc:          "CGI / تطاير / splash / sculptural",
    icon:          Wand2,
    defaultAspect: "4:5",
    systemPrompt:  `You are a conceptual still-life artist producing a surreal or CGI-grade product visual.
Vocabulary to use: levitating product or splash composition, sculptural lighting, hyper-real material rendering (glass, metal, liquid, fabric), bold geometric or impossible scene construction, creative shadow play, gallery-grade composition. Push the imagination — this should feel like a campaign-key visual, not a catalog shot.
${COMMON_RULES}`,
  },
  {
    id:            "restyle",
    name:          "إعادة تنسيق",
    englishName:   "Restyle Existing",
    desc:          "حوّل صورة موجودة لمزاج / موسم / aesthetic مختلف",
    icon:          RefreshCw,
    defaultAspect: "1:1",
    systemPrompt:  `You are a brand designer restyling an existing product photograph into a new aesthetic / season / mood.
Vocabulary to use: preserve the product's exact identity, geometry, and label, but transform the surrounding palette, lighting, props, and atmosphere to match the new aesthetic the user describes (e.g. Christmas, summer, quiet luxury, cyberpunk). Match the input photo's framing roughly so the user can A/B compare.
${COMMON_RULES}`,
  },
];

// ── Aspect ratios + counts ────────────────────────────────────────

export const PRODUCT_ASPECTS = [
  { id: "1:1",  label: "1:1 — مربع"   },
  { id: "4:5",  label: "4:5 — IG"     },
  { id: "5:4",  label: "5:4"          },
  { id: "3:4",  label: "3:4 — عمودي"  },
  { id: "4:3",  label: "4:3"          },
  { id: "2:3",  label: "2:3 — Pin"    },
  { id: "3:2",  label: "3:2"          },
  { id: "9:16", label: "9:16 — Reel"  },
  { id: "16:9", label: "16:9"         },
  { id: "21:9", label: "21:9 — هيرو"  },
] as const;

/** 1 → 10 variants per generation (matches the reference CLI's --count). */
export const PRODUCT_VARIANT_COUNTS = [1, 2, 3, 4, 6, 8, 10] as const;

export const PRODUCT_PHOTOSHOOT_DEFAULTS = {
  modeId:  "product_shot" as string,
  aspect:  "1:1"          as string,
  count:   1,
};

/** Fixed 6 credits per output image. The reference uses gpt_image_2
 *  which we approximate via nano-banana-pro at "2k" — same
 *  ballpark per render. */
export const PRODUCT_PHOTOSHOOT_COST_PER_IMAGE = 6;
