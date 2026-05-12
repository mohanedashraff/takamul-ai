// ════════════════════════════════════════════════════════════════
// AI Influencer Studio — character-builder data layer
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's `/ai-influencer-studio` page 1:1:
//   • 4 panels: Core (always visible) + Face / Body / Style (advanced)
//   • 22 subcategories, 143 individual options
//   • Compose function turns the picked options into a single English
//     prompt that gets fed to nano-banana-pro
//
// The schema and option lists were extracted from the reference
// platform's live picker (TanStack Query cache walk). Full cited
// data lives privately under docs/reference-research/04_STUDIOS/ai-influencer.md.
//
// Each option is just a label string — no UUID needed because we're
// composing a prompt, not calling the reference's UUID-keyed backend.

import type { LucideIcon } from "lucide-react";
import {
  User, Sparkles, Eye, Smile, Ear, Hand, Footprints,
  Scissors, Palette, Image as ImageIcon, Heart, Skull,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

/** A single subcategory like "Character Type" or "Eye Color". */
export interface InfluencerSubcategory {
  /** Stable id used in the config object the picker writes to. */
  id:          string;
  /** Arabic display name. */
  name:        string;
  /** English label shown under the Arabic name. */
  englishName: string;
  /** Optional one-liner help text shown under the title. */
  hint?:       string;
  /** "single" = pick one (radio); "multi" = pick zero-or-more (chips). */
  selection:   "single" | "multi";
  /** Allowed option labels — these are the strings that get baked into
   *  the composed prompt. Each option is `{ id, label }` where `id` is
   *  what we save in the user's config and `label` is what we render. */
  options:     { id: string; label: string }[];
  /** When true, the subcategory is shown collapsed by default (advanced). */
  advanced?:   boolean;
}

/** A panel groups related subcategories. */
export interface InfluencerPanel {
  id:          "core" | "face" | "body" | "style";
  name:        string;
  englishName: string;
  icon:        LucideIcon;
  /** Total option count across all subcategories — for the header chip. */
  count:       number;
  subcategories: InfluencerSubcategory[];
}

/** Output: the picked-options config the user assembles in the UI.
 *  Keys match `InfluencerSubcategory.id`; values are the picked option
 *  ids. Multi-select subcategories store `string[]`. */
export type InfluencerConfig = Record<string, string | string[] | undefined>;

// ── Helper for option lists ────────────────────────────────────────
const opt = (id: string, label: string) => ({ id, label });

// ── Panel 1 — Core (always visible, 7 subcategories, 61 options) ──
const CORE_SUBS: InfluencerSubcategory[] = [
  {
    id:        "character_type",
    name:      "نوع الشخصية",
    englishName: "Character Type",
    selection: "single",
    options: [
      opt("human",     "Human"),
      opt("ant",       "Ant"),
      opt("bee",       "Bee"),
      opt("octopus",   "Octopus"),
      opt("crocodile", "Crocodile"),
      opt("iguana",    "Iguana"),
      opt("lizard",    "Lizard"),
      opt("alien",     "Alien"),
      opt("beetle",    "Beetle"),
      opt("reptile",   "Reptile"),
      opt("amphibian", "Amphibian"),
      opt("elf",       "Elf"),
      opt("mantis",    "Mantis"),
    ],
  },
  {
    id:        "gender",
    name:      "النوع",
    englishName: "Gender",
    selection: "single",
    options: [
      opt("female",     "Female"),
      opt("male",       "Male"),
      opt("trans-man",  "Trans man"),
      opt("trans-woman","Trans woman"),
      opt("non-binary", "Non-binary"),
    ],
  },
  {
    id:        "ethnicity_origin",
    name:      "الأصل العرقي",
    englishName: "Ethnicity / Origin Base",
    selection: "single",
    options: [
      opt("african",       "African"),
      opt("asian",         "Asian"),
      opt("european",      "European"),
      opt("indian",        "Indian"),
      opt("middle-eastern","Middle Eastern"),
      opt("mixed",         "Mixed"),
    ],
  },
  {
    id:        "skin_color",
    name:      "لون البشرة",
    englishName: "Skin Color",
    selection: "single",
    options: [
      opt("pitch-black", "Pitch black"),
      opt("black",       "Black"),
      opt("white",       "White"),
      opt("purple",      "Purple"),
      opt("brown",       "Brown"),
      opt("olive",       "Olive"),
      opt("grey",        "Grey"),
      opt("green",       "Green"),
      opt("blue",        "Blue"),
      opt("red",         "Red"),
      opt("mixed",       "Mixed colors"),
      opt("custom",      "Pick own color"),
    ],
  },
  {
    id:        "eye_color",
    name:      "لون العين",
    englishName: "Eye Color",
    selection: "single",
    options: [
      opt("black",        "Black"),
      opt("purple",       "Purple"),
      opt("green",        "Green"),
      opt("white",        "White"),
      opt("brown",        "Brown"),
      opt("solid-void",   "Black (Solid:Void)"),
      opt("blind-empty",  "White (Blind:Empty)"),
      opt("deep-brown",   "Deep Brown"),
      opt("blue",         "Blue"),
      opt("amber",        "Amber"),
      opt("red",          "Red"),
      opt("grey",         "Grey"),
      opt("custom",       "Pick own color"),
    ],
  },
  {
    id:        "skin_conditions",
    name:      "حالات البشرة",
    englishName: "Skin Conditions",
    hint:      "اختياري — يمكن اختيار أكثر من حالة",
    selection: "multi",
    options: [
      opt("vitiligo",    "Vitiligo"),
      opt("pigmentation","Pigmentation"),
      opt("freckles",    "Freckles"),
      opt("birthmarks",  "Birthmarks"),
      opt("scars",       "Scars"),
      opt("burns",       "Burns"),
      opt("albinism",    "Albinism"),
      opt("cracked",     "Cracked / dry skin"),
      opt("wrinkled",    "Wrinkled skin"),
    ],
  },
  {
    id:        "age",
    name:      "العمر",
    englishName: "Age",
    selection: "single",
    options: [
      opt("adult",  "Adult"),
      opt("mature", "Mature"),
      opt("senior", "Senior"),
    ],
  },
];

// ── Panel 2 — Face (advanced, 7 subcategories, 34 options) ────────
const FACE_SUBS: InfluencerSubcategory[] = [
  {
    id:        "eyes_type",
    name:      "نوع العين",
    englishName: "Eyes — Type",
    advanced:  true,
    selection: "single",
    options: [
      opt("human",      "Human"),
      opt("reptile",    "Reptile"),
      opt("mechanical", "Mechanical"),
    ],
  },
  {
    id:        "eyes_details",
    name:      "تفاصيل العين",
    englishName: "Eyes — Details",
    advanced:  true,
    selection: "multi",
    options: [
      opt("different-colors","Different eye colors"),
      opt("blind",           "Blind eye"),
      opt("scarred",         "Scarred eye"),
      opt("glowing",         "Glowing eye"),
    ],
  },
  {
    id:        "mouth_teeth",
    name:      "الفم والأسنان",
    englishName: "Mouth & Teeth",
    advanced:  true,
    selection: "multi",
    options: [
      opt("small-mouth",     "Small mouth"),
      opt("large-mouth",     "Large mouth"),
      opt("no-teeth",        "No teeth"),
      opt("different-teeth", "Different teeth"),
      opt("sharp-teeth",     "Sharp teeth"),
      opt("forked-tongue",   "Forked tongue"),
      opt("two-tongues",     "Two tongues"),
    ],
  },
  {
    id:        "ears",
    name:      "الأذنين",
    englishName: "Ears",
    advanced:  true,
    selection: "single",
    options: [
      opt("human",    "Human"),
      opt("elf",      "Elf"),
      opt("no-ears",  "No Ears"),
      opt("wing",     "Wing Ears"),
    ],
  },
  {
    id:        "horns",
    name:      "القرون",
    englishName: "Horns",
    advanced:  true,
    selection: "single",
    options: [
      opt("small",   "Small Horns"),
      opt("big",     "Big Horns"),
      opt("antlers", "Antlers"),
    ],
  },
  {
    id:        "face_skin_material",
    name:      "خامة جلد الوجه",
    englishName: "Face Skin Material",
    advanced:  true,
    selection: "single",
    options: [
      opt("human",      "Human skin"),
      opt("scales",     "Scales"),
      opt("fur",         "Fur"),
      opt("amphibian",  "Amphibian skin"),
      opt("fish",        "Fish skin"),
      opt("metallic",   "Metallic"),
    ],
  },
  {
    id:        "face_surface_pattern",
    name:      "نمط سطح الوجه",
    englishName: "Surface Pattern",
    advanced:  true,
    selection: "single",
    options: [
      opt("solid",       "Solid"),
      opt("stripes",     "Stripes"),
      opt("spots",       "Spots"),
      opt("chess",       "Chess pattern"),
      opt("veins",       "Veins visible"),
      opt("giraffe",     "Giraffe pattern"),
      opt("cowhide",     "Cowhide Pattern"),
    ],
  },
];

// ── Panel 3 — Body (advanced, 5 subcategories, 31 options) ────────
const ARM_OPTIONS = [
  opt("normal",     "Normal arm"),
  opt("cute",       "Cute arm"),
  opt("robotic",    "Robotic arm"),
  opt("prosthetic", "Prosthetic arm"),
  opt("mechanical", "Mechanical arm"),
  opt("none",       "None"),
];
const LEG_OPTIONS = [
  opt("normal",     "Normal leg"),
  opt("cute",       "Cute leg"),
  opt("robotic",    "Robotic leg"),
  opt("prosthetic", "Prosthetic leg"),
  opt("mechanical", "Mechanical leg"),
  opt("none",       "None"),
];
const BODY_SUBS: InfluencerSubcategory[] = [
  {
    id:        "body_type",
    name:      "طراز الجسم",
    englishName: "Body Type",
    advanced:  true,
    selection: "single",
    options: [
      opt("slim",     "Slim"),
      opt("lean",     "Lean"),
      opt("athletic", "Athletic"),
      opt("muscular", "Muscular"),
      opt("curvy",    "Curvy"),
      opt("heavy",    "Heavy"),
      opt("skinny",   "Skinny"),
    ],
  },
  {
    id:        "left_arm",
    name:      "الذراع اليسرى",
    englishName: "Left Arm",
    advanced:  true,
    selection: "single",
    options:   ARM_OPTIONS,
  },
  {
    id:        "right_arm",
    name:      "الذراع اليمنى",
    englishName: "Right Arm",
    advanced:  true,
    selection: "single",
    options:   ARM_OPTIONS,
  },
  {
    id:        "left_leg",
    name:      "الساق اليسرى",
    englishName: "Left Leg",
    advanced:  true,
    selection: "single",
    options:   LEG_OPTIONS,
  },
  {
    id:        "right_leg",
    name:      "الساق اليمنى",
    englishName: "Right Leg",
    advanced:  true,
    selection: "single",
    options:   LEG_OPTIONS,
  },
];

// ── Panel 4 — Style (advanced, 3 subcategories, 17 options) ───────
const STYLE_SUBS: InfluencerSubcategory[] = [
  {
    id:        "hair",
    name:      "الشعر",
    englishName: "Hair / Head Growth",
    advanced:  true,
    selection: "single",
    options: [
      opt("bald",       "Bald"),
      opt("short",      "Short hair"),
      opt("long",       "Long hair"),
      opt("afro",       "Afro"),
      opt("punk",       "Punk hairstyle"),
      opt("fur",         "Fur"),
      opt("tentacles",  "Tentacles"),
      opt("spines",     "Spines"),
    ],
  },
  {
    id:        "accessories",
    name:      "إكسسوارات وعلامات",
    englishName: "Accessories & Markings",
    advanced:  true,
    selection: "multi",
    options: [
      opt("tattoos",        "Tattoos"),
      opt("piercing",       "Piercing"),
      opt("scarification",  "Scarification"),
      opt("symbols",        "Symbols / markings"),
      opt("cyber-markings", "Cyber markings"),
    ],
  },
  {
    id:        "rendering_style",
    name:      "أسلوب الرسم",
    englishName: "Rendering Style",
    advanced:  true,
    selection: "single",
    options: [
      opt("hyper-realistic","Hyper-realistic"),
      opt("anime",          "Anime"),
      opt("cartoon",        "Cartoon"),
      opt("2d-illustration","2D illustration"),
    ],
  },
];

// ── Final panel list ───────────────────────────────────────────────
//
// Counts equal sum of options across each panel's subcategories — the
// reference platform's totals were 61 / 34 / 31 / 17 → grand total 143.

function countOptions(subs: InfluencerSubcategory[]): number {
  return subs.reduce((s, sub) => s + sub.options.length, 0);
}

export const INFLUENCER_PANELS: InfluencerPanel[] = [
  {
    id:            "core",
    name:          "الأساسي",
    englishName:   "Core",
    icon:          User,
    subcategories: CORE_SUBS,
    count:         countOptions(CORE_SUBS),
  },
  {
    id:            "face",
    name:          "الوجه",
    englishName:   "Face",
    icon:          Eye,
    subcategories: FACE_SUBS,
    count:         countOptions(FACE_SUBS),
  },
  {
    id:            "body",
    name:          "الجسم",
    englishName:   "Body",
    icon:          Hand,
    subcategories: BODY_SUBS,
    count:         countOptions(BODY_SUBS),
  },
  {
    id:            "style",
    name:          "الستايل",
    englishName:   "Style",
    icon:          Palette,
    subcategories: STYLE_SUBS,
    count:         countOptions(STYLE_SUBS),
  },
];

/** Total option count across all panels — should be 143 to match the
 *  reference. Use as a sanity check / display in the UI. */
export const TOTAL_INFLUENCER_OPTIONS = INFLUENCER_PANELS.reduce((s, p) => s + p.count, 0);

// ── Defaults ───────────────────────────────────────────────────────
//
// Sensible "neutral" baseline so the picker isn't empty on first load
// — every shoot picks SOMETHING for the always-visible Core fields.
export const INFLUENCER_DEFAULTS: InfluencerConfig = {
  character_type:    "human",
  gender:            "female",
  ethnicity_origin:  "middle-eastern",
  skin_color:        "olive",
  eye_color:         "deep-brown",
  age:               "adult",
  rendering_style:   "hyper-realistic",
};

// ── Aspect ratio + resolution (matches reference) ─────────────────
//
// Reference defaults to 9:16 portrait at 2K (height × width = 2752 × 1536).

export const INFLUENCER_ASPECTS = [
  { id: "9:16",  label: "9:16 — عمودي",       w: 1536, h: 2752 },
  { id: "1:1",   label: "1:1 — مربع",          w: 2048, h: 2048 },
  { id: "3:4",   label: "3:4 — عمودي قصير",    w: 1536, h: 2048 },
  { id: "4:3",   label: "4:3",                 w: 2048, h: 1536 },
  { id: "16:9",  label: "16:9 — أفقي",         w: 2752, h: 1536 },
] as const;

export const INFLUENCER_RESOLUTIONS = [
  { id: "2k", label: "2K — موصى به", recommended: true },
  { id: "4k", label: "4K — أعلى جودة"                  },
] as const;

// ── Prompt composer ────────────────────────────────────────────────
//
// Turns the structured config into a richly-templated English prompt.
// Order matters: subject definition → physical traits → finishing
// cues. We follow the same recipe the reference's docs noted:
//
//   "A {age} {character_type} {gender} of {ethnicity_origin} origin
//    with {skin_color} {face_skin_material} skin and {face_surface_pattern}
//    pattern, {eye_color} {eyes_type} eyes, {mouth}, {ears} ears,
//    {hair} hair, {body_type} build, {left_arm} left arm and
//    {right_arm} right arm, {accessories}, rendered in {rendering_style}
//    style"

function lookup(panels: InfluencerPanel[], subId: string, optId?: string | string[]): string | undefined {
  if (!optId) return undefined;
  for (const panel of panels) {
    const sub = panel.subcategories.find((s) => s.id === subId);
    if (!sub) continue;
    if (Array.isArray(optId)) {
      const labels = optId
        .map((id) => sub.options.find((o) => o.id === id)?.label)
        .filter((l): l is string => !!l);
      return labels.length > 0 ? labels.join(", ") : undefined;
    }
    return sub.options.find((o) => o.id === optId)?.label;
  }
  return undefined;
}

export function composeInfluencerPrompt(config: InfluencerConfig): string {
  const get = (subId: string) => lookup(INFLUENCER_PANELS, subId, config[subId]);

  const charType  = get("character_type")    ?? "human";
  const gender    = get("gender")            ?? "female";
  const age       = get("age")               ?? "adult";
  const ethnicity = get("ethnicity_origin");
  const skinColor = get("skin_color");
  const skinMat   = get("face_skin_material");
  const surface   = get("face_surface_pattern");
  const eyeColor  = get("eye_color");
  const eyesType  = get("eyes_type");
  const eyesDet   = get("eyes_details");
  const mouth     = get("mouth_teeth");
  const ears      = get("ears");
  const horns     = get("horns");
  const hair      = get("hair");
  const body      = get("body_type");
  const leftArm   = get("left_arm");
  const rightArm  = get("right_arm");
  const leftLeg   = get("left_leg");
  const rightLeg  = get("right_leg");
  const accessories = get("accessories");
  const skinCond  = get("skin_conditions");
  const render    = get("rendering_style") ?? "hyper-realistic";

  // Build the noun-phrase subject. We adapt the language to make the
  // sentence read well even when many fields are empty.
  const subject = `A ${age.toLowerCase()} ${charType.toLowerCase()} ${gender.toLowerCase()}` +
    (ethnicity ? ` of ${ethnicity} origin` : "");

  const skinFragments: string[] = [];
  if (skinColor) skinFragments.push(`${skinColor.toLowerCase()} skin`);
  if (skinMat && skinMat !== "Human skin") skinFragments.push(`${skinMat.toLowerCase()} texture`);
  if (surface && surface !== "Solid") skinFragments.push(`${surface.toLowerCase()} pattern`);
  if (skinCond) skinFragments.push(`with ${skinCond.toLowerCase()}`);
  const skinPart = skinFragments.length > 0 ? `, ${skinFragments.join(", ")}` : "";

  const eyeFragments: string[] = [];
  if (eyeColor) eyeFragments.push(`${eyeColor.toLowerCase()}`);
  if (eyesType && eyesType !== "Human") eyeFragments.push(`${eyesType.toLowerCase()}-type`);
  const eyePart = eyeFragments.length > 0
    ? `, ${eyeFragments.join(" ")} eyes${eyesDet ? ` (${eyesDet.toLowerCase()})` : ""}`
    : "";

  const featurePieces: string[] = [];
  if (mouth)  featurePieces.push(mouth.toLowerCase());
  if (ears && ears !== "Human") featurePieces.push(`${ears.toLowerCase()} ears`);
  if (horns)  featurePieces.push(horns.toLowerCase());
  if (hair)   featurePieces.push(`${hair.toLowerCase()} hair`);
  const featurePart = featurePieces.length > 0 ? `, ${featurePieces.join(", ")}` : "";

  const bodyPieces: string[] = [];
  if (body) bodyPieces.push(`${body.toLowerCase()} build`);
  if (leftArm  && leftArm  !== "Normal arm") bodyPieces.push(`${leftArm.toLowerCase()} (left)`);
  if (rightArm && rightArm !== "Normal arm") bodyPieces.push(`${rightArm.toLowerCase()} (right)`);
  if (leftLeg  && leftLeg  !== "Normal leg") bodyPieces.push(`${leftLeg.toLowerCase()} (left leg)`);
  if (rightLeg && rightLeg !== "Normal leg") bodyPieces.push(`${rightLeg.toLowerCase()} (right leg)`);
  const bodyPart = bodyPieces.length > 0 ? `, ${bodyPieces.join(", ")}` : "";

  const accessoryPart = accessories ? `, ${accessories.toLowerCase()}` : "";

  // Finishing cues — enforce portrait composition + high quality.
  const finishing =
    `, rendered in ${render.toLowerCase()} style. ` +
    "Professional portrait composition, three-quarter framing, head and upper body, " +
    "natural studio lighting, ultra-detailed, sharp focus, 8K finishing. " +
    "No text, no watermarks, no logos.";

  return subject + skinPart + eyePart + featurePart + bodyPart + accessoryPart + finishing;
}

// ── Cost ──────────────────────────────────────────────────────────
//
// The reference platform charges 200 credits per AI Influencer
// generation regardless of res/aspect. We mirror that flat rate.
export const INFLUENCER_COST = 12;          // 12 credits — about 6× cheaper
                                             // than the reference for early demand.

// ── Yilow-original starter presets ────────────────────────────────
// Two hand-tuned influencer configs we ship as one-click quick-start
// options in the left sidebar of /ai-influencer. They're Yilow-
// original characters (not from any other platform).
//
// • Onyx   — confident male, urban editorial, mid-30s
// • Skyler — radiant female, soft fashion, mid-20s
//
// The InfluencerStudio reads `INFLUENCER_PRESETS` on mount and shows
// each preset as a thumbnail card with "Load" → applies the config
// to the picker form.

export interface InfluencerPreset {
  id:         string;
  name:       string;
  nameAr:     string;
  /** One-line vibe description shown under the name. */
  tagline:    string;
  /** Public thumbnail URL — we host these in /public/influencer-presets/. */
  thumbnail:  string;
  /** Full picker config the preset loads into. */
  config:     InfluencerConfig;
}

export const INFLUENCER_PRESETS: InfluencerPreset[] = [
  {
    id:        "onyx",
    name:      "Onyx",
    nameAr:    "أونيكس",
    tagline:   "Confident male · urban editorial · mid-30s",
    thumbnail: "/influencer-presets/onyx.png",
    config: {
      character_type:    "human",
      gender:            "male",
      ethnicity_origin:  "middle-eastern",
      skin_color:        "tan",
      eye_color:         "deep-brown",
      age:               "adult",
      hair:              "short-black-fade",
      body_type:         "athletic",
      face_skin_material:"matte",
      mouth:             "neutral-firm",
      ears:              "normal",
      accessories:       ["minimal-chain", "watch"],
      rendering_style:   "hyper-realistic",
    },
  },
  {
    id:        "skyler",
    name:      "Skyler",
    nameAr:    "سكايلر",
    tagline:   "Radiant female · soft fashion · mid-20s",
    thumbnail: "/influencer-presets/skyler.png",
    config: {
      character_type:    "human",
      gender:            "female",
      ethnicity_origin:  "mediterranean",
      skin_color:        "olive",
      eye_color:         "hazel",
      age:               "young-adult",
      hair:              "long-brown-wavy",
      body_type:         "slim",
      face_skin_material:"luminous",
      mouth:             "soft-smile",
      ears:              "normal",
      accessories:       ["small-hoop-earrings"],
      rendering_style:   "hyper-realistic",
    },
  },
];

/** Apply a preset on top of an existing config. Preset values win, but
 *  any field the user already customised before clicking the preset
 *  stays only when the preset doesn't override it. */
export function applyInfluencerPreset(
  current: InfluencerConfig,
  preset:  InfluencerPreset,
): InfluencerConfig {
  return { ...current, ...preset.config };
}
