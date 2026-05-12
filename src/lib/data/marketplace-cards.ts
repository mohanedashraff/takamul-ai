// ════════════════════════════════════════════════════════════════
// Marketplace Cards Studio — data layer
// ════════════════════════════════════════════════════════════════
// Yilow's marketplace-cards studio — full-page UI at
// `/marketplace-cards`. Drives the 13-asset listing generation flow.
//
// The studio generates marketplace-compliant listing visuals:
//   • 1 main image (Amazon-compliant white background)
//   • 5 secondary product images (multi-angle, detail, lifestyle, etc.)
//   • 7 A+ Content modules (hero banner, pain points, features, etc.)
//
// 13 asset types total; the user can either:
//   • Pick a SCOPE bundle (main / product-images / aplus / full-set)
//   • OR check individual assets à la carte
//
// Each asset has its own Claude system prompt encoding the marketplace
// compliance rules (Amazon listing requirements, A+ layout grammar).

import type { LucideIcon } from "lucide-react";
import {
  Box, Frame, Layers, Image as ImageIcon, Camera, Sparkles,
  Layout, AlertOctagon, ListChecks, FlaskConical, TrendingUp,
  BookOpen, Award,
} from "lucide-react";

// ── Asset definitions ──────────────────────────────────────────────

export interface MarketplaceAsset {
  id:           string;
  name:         string;        // Arabic display
  englishName:  string;
  desc:         string;        // 1-line Arabic hint
  icon:         LucideIcon;
  /** Family bucket — "main" / "secondary" / "aplus" — drives grouping
   *  in the UI and which scope bundle includes the asset. */
  family:       "main" | "secondary" | "aplus";
  /** Recommended aspect ratio per asset. Amazon main image must be
   *  square (1:1); A+ hero is wide (3:2 or 16:9); detail shots are
   *  flexible. */
  defaultAspect: string;
  /** Claude Sonnet 4.5 system prompt — encodes the per-asset marketplace
   *  compliance rules and visual conventions. */
  systemPrompt:  string;
}

const COMMON_RULES = `
RULES:
- Output a single rich English photography brief, 130-200 words.
- Preserve the user's product's exact identity, label, and proportions.
- Comply with the marketplace conventions described.
- NO text overlays unless explicitly required by the asset type.
- NO watermarks. NO stock photo cliches.
- Keep one product as the unambiguous hero unless the asset demands
  multiple (e.g. multi-angle, what's-in-box).
- If the user input is in Arabic, translate intent and write in English.
- Reply with the brief ONLY — no preamble, no markdown headers.
`.trim();

export const MARKETPLACE_ASSETS: MarketplaceAsset[] = [
  // ── MAIN ─────────────────────────────────────────────────────────
  {
    id:            "main_image",
    name:          "الصورة الرئيسية",
    englishName:   "Main Image",
    desc:          "Amazon-compliant — خلفية بيضاء + المنتج 85%+",
    icon:          Frame,
    family:        "main",
    defaultAspect: "1:1",
    systemPrompt:  `You are a marketplace photographer producing the COMPLIANT main listing image.
Compliance rules to bake in:
- Pure white background (RGB 255/255/255). Absolutely no other color.
- The product fills 85%+ of the frame. Centered hero composition.
- No text, no watermarks, no logos other than the product's printed branding.
- No props, no people, no graphics, no borders.
- Crisp soft studio lighting (large softbox key + fill), no harsh shadows.
- True-to-life color of the product.
- Subtle drop shadow under the product to ground it (optional).
${COMMON_RULES}`,
  },
  // ── SECONDARY (5) ───────────────────────────────────────────────
  {
    id:            "infographic",
    name:          "إنفوجرافيك",
    englishName:   "Infographic",
    desc:          "Stats + features كـoverlay على لقطة المنتج",
    icon:          ListChecks,
    family:        "secondary",
    defaultAspect: "1:1",
    systemPrompt:  `You are a marketplace designer producing an infographic-style secondary listing image.
Compliance rules to bake in:
- Product is the visual anchor, but the composition leaves clear negative
  space for 3-5 short feature callouts / icons / arrows.
- The brief should DESCRIBE the visual layout (where icons + numbers go,
  the colour palette of the callouts) WITHOUT writing the actual text —
  text overlays are added in post.
- Clean modern infographic aesthetic, agency-grade.
${COMMON_RULES}`,
  },
  {
    id:            "multi_angle",
    name:          "زوايا متعددة",
    englishName:   "Multi-Angle",
    desc:          "3 إلى 5 زوايا في compositional grid واحد",
    icon:          Box,
    family:        "secondary",
    defaultAspect: "1:1",
    systemPrompt:  `You are a marketplace photographer producing a multi-angle composite for the secondary slot.
Compliance rules to bake in:
- Show 3-5 distinct angles of the product (front, three-quarter, side,
  back, top) arranged in a single clean composition (e.g. floating
  rotation array OR a horizontal strip).
- Pure white or very light grey background.
- Same lighting + color science across all angles for visual consistency.
- The arrangement should feel intentional, not just collage.
${COMMON_RULES}`,
  },
  {
    id:            "detail_shot",
    name:          "لقطة تفاصيل",
    englishName:   "Detail Shot",
    desc:          "Macro لخامة / ملمس / حواف",
    icon:          Camera,
    family:        "secondary",
    defaultAspect: "1:1",
    systemPrompt:  `You are a marketplace photographer producing a tight macro/detail shot for the secondary slot.
Compliance rules to bake in:
- Macro lens close-up on a key material, texture, stitching, edge, or
  feature of the product.
- Shallow depth of field with the focal feature tack-sharp.
- Soft directional light to emphasize texture.
- Clean background (white, soft grey, or contextual surface).
- The shot should make a buyer want to touch it.
${COMMON_RULES}`,
  },
  {
    id:            "lifestyle",
    name:          "Lifestyle",
    englishName:   "Lifestyle",
    desc:          "المنتج في بيئة استخدام حقيقية",
    icon:          ImageIcon,
    family:        "secondary",
    defaultAspect: "1:1",
    systemPrompt:  `You are a marketplace photographer producing a lifestyle context shot for the secondary slot.
Compliance rules to bake in:
- Product shown in a real-world use environment (kitchen counter, gym
  floor, desk, bathroom, garden — match the category).
- Hands or partial body interacting with the product (no face required).
- Natural daylight or warm interior lighting.
- Aspirational but believable composition — not a fashion shoot.
${COMMON_RULES}`,
  },
  {
    id:            "whats_in_box",
    name:          "ماذا يوجد في الصندوق",
    englishName:   "What's in the Box",
    desc:          "كل المكوّنات / الإكسسوارات مرصوفة",
    icon:          Layers,
    family:        "secondary",
    defaultAspect: "1:1",
    systemPrompt:  `You are a marketplace photographer producing a "what's in the box" overhead flat-lay.
Compliance rules to bake in:
- Top-down (90-degree overhead) view.
- Every component the customer receives — main product, accessories,
  cables, manuals, etc. — laid out cleanly with breathing space.
- Clean white or soft neutral surface.
- Even diffused light, minimal shadow.
- Items spaced with consistent gaps for a methodical, premium feel.
${COMMON_RULES}`,
  },
  // ── A+ CONTENT (7) ──────────────────────────────────────────────
  {
    id:            "aplus_hero_banner",
    name:          "A+ بانر هيرو",
    englishName:   "A+ Hero Banner",
    desc:          "البانر العلوي العريض لقسم A+",
    icon:          Layout,
    family:        "aplus",
    defaultAspect: "21:9",
    systemPrompt:  `You are an A+ Content designer producing the wide hero banner that crowns the page.
Compliance rules to bake in:
- Ultra-wide cinematic banner.
- Strong brand mood evocative of the product category.
- Generous negative space for an imagined headline + supporting line.
- Premium magazine / campaign aesthetic.
- Hero product visible but not dominant — this banner sells the BRAND.
${COMMON_RULES}`,
  },
  {
    id:            "aplus_pain_points",
    name:          "A+ مشاكل/حلول",
    englishName:   "A+ Pain Points",
    desc:          "Before/After أو problem→solution layout",
    icon:          AlertOctagon,
    family:        "aplus",
    defaultAspect: "16:9",
    systemPrompt:  `You are an A+ Content designer producing a "pain points solved" comparison module.
Compliance rules to bake in:
- Side-by-side or before/after composition: the problem state on one
  side, the product-solved state on the other.
- Subtle visual cue indicating "before is bad, after is better"
  (e.g. duller light + cool tone for before, warm + bright for after).
- Clean labelling space at the top of each side for an imagined caption.
${COMMON_RULES}`,
  },
  {
    id:            "aplus_features",
    name:          "A+ مميزات",
    englishName:   "A+ Features",
    desc:          "بطاقات ميزات بأيقونات",
    icon:          Sparkles,
    family:        "aplus",
    defaultAspect: "16:9",
    systemPrompt:  `You are an A+ Content designer producing a feature-highlight module with multiple cards.
Compliance rules to bake in:
- 3 to 5 visual feature cards arranged in a tidy grid OR horizontal row.
- Each card has a hero icon area + product detail crop + description
  space (text added in post — leave clean negative space for it).
- Consistent card styling (same corner radius, same padding ratio,
  same icon style).
- Modern brand-design aesthetic.
${COMMON_RULES}`,
  },
  {
    id:            "aplus_ingredients",
    name:          "A+ مكوّنات",
    englishName:   "A+ Ingredients",
    desc:          "تفصيل المواد / المكوّنات بـcall-outs",
    icon:          FlaskConical,
    family:        "aplus",
    defaultAspect: "16:9",
    systemPrompt:  `You are an A+ Content designer producing an ingredients / materials breakdown module.
Compliance rules to bake in:
- Hero crop of the product with annotation lines pulling out to floating
  call-out badges (each badge labels one ingredient or material).
- Clean lab-aesthetic OR natural-craft aesthetic depending on the
  category (skincare → lab, food → natural, fashion → tactile).
- 4 to 7 call-outs total. Leave the badge text empty (added in post).
${COMMON_RULES}`,
  },
  {
    id:            "aplus_efficacy",
    name:          "A+ فعالية",
    englishName:   "A+ Efficacy",
    desc:          "Before/after أو evidence visual",
    icon:          TrendingUp,
    family:        "aplus",
    defaultAspect: "16:9",
    systemPrompt:  `You are an A+ Content designer producing an efficacy / proof-of-results module.
Compliance rules to bake in:
- Visual proof of the product's effect: before/after (skincare),
  performance graph (electronics), or transformation sequence.
- Soft scientific aesthetic with clean composition.
- Editorial vibe, not stock-photo cliché.
- Leave room for an imagined stat callout in the bottom corner.
${COMMON_RULES}`,
  },
  {
    id:            "aplus_how_to_use",
    name:          "A+ طريقة الاستخدام",
    englishName:   "A+ How to Use",
    desc:          "خطوات استخدام مرقّمة",
    icon:          BookOpen,
    family:        "aplus",
    defaultAspect: "16:9",
    systemPrompt:  `You are an A+ Content designer producing a step-by-step "how to use" module.
Compliance rules to bake in:
- 3 or 4 numbered steps shown horizontally as small composition vignettes.
- Each step is a clear visual moment (hands, product, action).
- Consistent framing + lighting across all steps.
- Generous space below or beside each step for an imagined caption.
- Friendly tutorial aesthetic.
${COMMON_RULES}`,
  },
  {
    id:            "aplus_endorsement",
    name:          "A+ شهادة / تقييم",
    englishName:   "A+ Endorsement",
    desc:          "Testimonial / press / review-style visual",
    icon:          Award,
    family:        "aplus",
    defaultAspect: "16:9",
    systemPrompt:  `You are an A+ Content designer producing a testimonial / press-coverage / review-style module.
Compliance rules to bake in:
- Hero portrait area for an imagined endorser (no face required — can
  be a hand, a stylized silhouette, or a press-logo strip aesthetic).
- Empty quote-card composition next to the portrait — text added in post.
- Premium, trustworthy editorial feel.
- Brand-consistent colour palette.
${COMMON_RULES}`,
  },
];

// ── Scope bundles ──────────────────────────────────────────────────
//
// Maps the reference's `--scope` flag values to the asset id arrays
// they include. Picking a scope auto-selects all the assets it
// contains; the user can deselect specific ones if needed.

export const SCOPE_BUNDLES: { id: string; name: string; englishName: string; desc: string; assetIds: string[] }[] = [
  {
    id: "main",
    name:        "الصورة الرئيسية فقط",
    englishName: "Main only",
    desc:        "صورة واحدة compliant",
    assetIds:    ["main_image"],
  },
  {
    id: "product-images",
    name:        "حزمة صور المنتج",
    englishName: "Product Images",
    desc:        "Main + 5 صور ثانوية",
    assetIds:    ["main_image", "infographic", "multi_angle", "detail_shot", "lifestyle", "whats_in_box"],
  },
  {
    id: "aplus",
    name:        "حزمة A+ Content",
    englishName: "A+ Content",
    desc:        "Main + 7 وحدات A+",
    assetIds:    ["main_image", "aplus_hero_banner", "aplus_pain_points", "aplus_features", "aplus_ingredients", "aplus_efficacy", "aplus_how_to_use", "aplus_endorsement"],
  },
  {
    id: "full-set",
    name:        "الحزمة الكاملة",
    englishName: "Full Set",
    desc:        "Main + 5 ثانوية + 7 A+ = 13 صورة",
    assetIds:    MARKETPLACE_ASSETS.map((a) => a.id),
  },
];

// ── Cost ──────────────────────────────────────────────────────────
//
// 4 credits per asset image (matches our nano-banana-pro per-render
// floor). A full-set generation = 13 × 4 = 52 credits.
export const MARKETPLACE_COST_PER_ASSET = 4;

export const MARKETPLACE_DEFAULTS = {
  scopeId:     "product-images",
  selectedIds: SCOPE_BUNDLES[1]!.assetIds.slice(),
};
