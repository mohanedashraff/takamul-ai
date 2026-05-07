// ════════════════════════════════════════════════════════════════
// Soul 2.0 — full data layer (mirrors higgsfield.ai/ai/image?model=soul-v2)
// ════════════════════════════════════════════════════════════════
// Three orthogonal axes that compose into a single image generation:
//
//   • Mood Board (style / aesthetic)        — one of 33 curated presets,
//                                              or a user-built moodboard
//                                              from ≥5 reference images.
//   • Color Signature / Soul HEX (palette)  — one of 6 curated palettes,
//                                              or auto-extracted from an
//                                              uploaded reference image.
//   • Soul ID (character identity)          — a saved character trained
//                                              on ≥20 photos of the user
//                                              or any subject.
//
// Plus utility settings (aspect ratio, quality, prompt-enhance toggle,
// 1–4 variations counter) that match Higgsfield's bottom shoot-bar.
//
// The English `descriptor` for each preset is what gets concatenated
// into the muapi prompt — DON'T translate that field. The `name`
// (Arabic) and `englishName` are display-only.

// ── Aspect ratios (matches Higgsfield's picker) ─────────────────────
export const SOUL_ASPECTS = [
  { id: "1:1",  label: "1:1",  aspect: [1,  1]  },
  { id: "3:4",  label: "3:4",  aspect: [3,  4]  },
  { id: "4:3",  label: "4:3",  aspect: [4,  3]  },
  { id: "9:16", label: "9:16", aspect: [9,  16] },
  { id: "16:9", label: "16:9", aspect: [16, 9]  },
  { id: "4:5",  label: "4:5",  aspect: [4,  5]  },
  { id: "2:3",  label: "2:3",  aspect: [2,  3]  },
  { id: "21:9", label: "21:9" },
] as const;

// ── Quality tiers (Higgsfield: 1.5k cheapest, 2k best) ──────────────
export const SOUL_QUALITIES = [
  { id: "1.5k", label: "1.5K — أسرع وأرخص" },
  { id: "2k",   label: "2K — موصى به",        recommended: true },
  { id: "4k",   label: "4K — أعلى جودة"        },
] as const;

// ────────────────────────────────────────────────────────────────────
// MOOD BOARDS (33 curated presets)
// ────────────────────────────────────────────────────────────────────
//
// Each preset has:
//   id          — slug, used in URLs and as the picker key
//   name        — Arabic display name
//   englishName — English label (matches Higgsfield)
//   descriptor  — full Higgsfield-grade prompt fragment that captures
//                 the aesthetic in language image models respond to
//   thumbnail   — local mp4/webp path under /public/soul/moodboards/
//
// The descriptors were distilled from the visual look of each preset on
// Higgsfield + their public blog explanations of what each style is
// known for. They're written to be chained at the END of the user's
// prompt so the subject stays first (where image models weight it
// heaviest) and the aesthetic layers on top.

export interface MoodBoardPreset {
  id:          string;
  name:        string;
  englishName: string;
  descriptor:  string;
  thumbnail:   string;
}

export const MOODBOARDS: MoodBoardPreset[] = [
  {
    id: "general", name: "عام", englishName: "General",
    descriptor: "balanced editorial photograph, neutral cinematic grade, professional color science, soft natural lighting",
    thumbnail: "/soul/moodboards/general.webp",
  },
  {
    id: "warm-ambient", name: "دفء محيطي", englishName: "Warm ambient",
    descriptor: "warm ambient glow, golden tungsten light spill, soft amber haze, intimate evening warmth, painterly skin tones",
    thumbnail: "/soul/moodboards/warm-ambient.webp",
  },
  {
    id: "y2k-studio", name: "ستوديو Y2K", englishName: "Y2K studio",
    descriptor: "early 2000s studio fashion shoot, glossy vinyl backdrop, hard direct flash, MTV-era styling, slight chromatic aberration, bold saturation",
    thumbnail: "/soul/moodboards/y2k-studio.webp",
  },
  {
    id: "swag-era", name: "حقبة السواج", englishName: "Swag era",
    descriptor: "early 2010s hip-hop tumblr aesthetic, gold chains, designer streetwear, urban backdrop, slightly overexposed, swag-era cultural mood",
    thumbnail: "/soul/moodboards/swag-era.webp",
  },
  {
    id: "theatrical-light", name: "إضاءة مسرحية", englishName: "Theatrical light",
    descriptor: "theatrical stage lighting, dramatic single-source key, deep falloff into black, painterly chiaroscuro, sculpted highlights, oil-painting depth",
    thumbnail: "/soul/moodboards/theatrical-light.webp",
  },
  {
    id: "y2k-street", name: "شارع Y2K", englishName: "Y2K street",
    descriptor: "early 2000s urban street style, low-rise denim, baby tees, tinted lenses, harsh on-camera flash, lo-fi compact-camera grain",
    thumbnail: "/soul/moodboards/y2k-street.webp",
  },
  {
    id: "flash-editorial", name: "فلاش إديتوريال", englishName: "Flash editorial",
    descriptor: "high-fashion direct flash editorial, hard shadows, bright keylight, magazine-cover styling, crisp focus, deep saturation",
    thumbnail: "/soul/moodboards/flash-editorial.webp",
  },
  {
    id: "old-smartphone", name: "موبايل قديم", englishName: "Old smartphone",
    descriptor: "early 2010s smartphone photo aesthetic, compressed dynamic range, slight blur, mobile-camera color science, soft jpeg artifacts, candid framing",
    thumbnail: "/soul/moodboards/old-smartphone.webp",
  },
  {
    id: "street-photography", name: "تصوير شوارع", englishName: "Street photography",
    descriptor: "documentary street photography, candid moment, 35mm reportage feel, naturalistic light, slight motion blur, urban authenticity",
    thumbnail: "/soul/moodboards/street-photography.webp",
  },
  {
    id: "asian-nostalgia", name: "حنين آسيوي", englishName: "Asian nostalgia",
    descriptor: "1990s East Asian film photography aesthetic, soft pastel grade, dreamy diffusion, Hong Kong/Tokyo street nostalgia, gentle film grain",
    thumbnail: "/soul/moodboards/asian-nostalgia.webp",
  },
  {
    id: "retro-bw", name: "أبيض وأسود ريترو", englishName: "Retro BW",
    descriptor: "vintage black-and-white photography, rich silver tones, deep blacks, gentle highlight rolloff, mid-century editorial mood, fine grain",
    thumbnail: "/soul/moodboards/retro-bw.webp",
  },
  {
    id: "subtle-flash", name: "فلاش هادئ", englishName: "Subtle flash",
    descriptor: "soft refined on-camera flash, gentle shadow falloff, polished editorial finish, balanced exposure, modern fashion magazine look",
    thumbnail: "/soul/moodboards/subtle-flash.webp",
  },
  {
    id: "surreal-solarization", name: "تشمس سريالي", englishName: "Surreal solarization",
    descriptor: "experimental darkroom solarization effect, partially inverted tonal map, dreamlike halos around highlights, surreal monochrome palette",
    thumbnail: "/soul/moodboards/surreal-solarization.webp",
  },
  {
    id: "digital-camera", name: "كاميرا ديجيتال", englishName: "Digital camera",
    descriptor: "early digital point-and-shoot aesthetic, slight noise, fixed-color rendering, mid-2000s digicam flatness, casual snapshot framing",
    thumbnail: "/soul/moodboards/digital-camera.webp",
  },
  {
    id: "siren", name: "سيرين", englishName: "Siren",
    descriptor: "mysterious alluring siren mood, ocean blues, glassy reflections, ethereal subject, soft underwater diffusion, otherworldly cool palette",
    thumbnail: "/soul/moodboards/siren.webp",
  },
  {
    id: "mystique-city", name: "مدينة غامضة", englishName: "Mystique city",
    descriptor: "enigmatic urban atmosphere, neon haze, rain-slick reflections, late-night cinematic noir, anonymous architectural backdrop",
    thumbnail: "/soul/moodboards/mystique-city.webp",
  },
  {
    id: "candy-pop", name: "كاندي بوب", englishName: "Candy pop",
    descriptor: "bright saturated pop palette, bubblegum pink and electric blue, glossy plastic textures, mid-2000s teen-magazine cheer, hyper-color",
    thumbnail: "/soul/moodboards/candy-pop.webp",
  },
  {
    id: "double-exposure", name: "تعريض مزدوج", englishName: "Double exposure",
    descriptor: "artistic double exposure photograph, two scenes overlapping, ghosted silhouettes, dreamlike layering, gallery-quality composite",
    thumbnail: "/soul/moodboards/double-exposure.webp",
  },
  {
    id: "2000s-band", name: "فرقة الألفية", englishName: "2000s band",
    descriptor: "2000s indie rock band promo aesthetic, moody black backgrounds, eyeliner styling, grungy texture, tour-poster framing, MTV2 era",
    thumbnail: "/soul/moodboards/2000s-band.webp",
  },
  {
    id: "frutiger-aero", name: "فروتيجر إيرو", englishName: "Frutiger aero",
    descriptor: "Frutiger Aero design language, glossy translucent UI textures, cyan-blue skies, optimistic Web 2.0 aesthetic, dolphins-and-grass-fields utopia",
    thumbnail: "/soul/moodboards/frutiger-aero.webp",
  },
  {
    id: "drain", name: "درين", englishName: "Drain",
    descriptor: "drain underground aesthetic, melancholic late-night mood, fluorescent industrial light, washed-out skin tones, basement-show energy",
    thumbnail: "/soul/moodboards/drain.webp",
  },
  {
    id: "extraterrestrial", name: "خارج الأرض", englishName: "Extraterrestrial",
    descriptor: "extraterrestrial scifi mood, alien lighting, otherworldly metallic textures, surreal cosmic palette, futuristic hyperreal",
    thumbnail: "/soul/moodboards/extraterrestrial.webp",
  },
  {
    id: "nature-light", name: "ضوء طبيعي", englishName: "Nature light",
    descriptor: "natural outdoor sunlight, golden hour glow, organic foliage, breathable airy atmosphere, painterly highlights, no studio gear",
    thumbnail: "/soul/moodboards/nature-light.webp",
  },
  {
    id: "editorial-street-style", name: "ستايل شوارع راقي", englishName: "Editorial street style",
    descriptor: "high-fashion editorial street style, magazine cover composition, designer styling shot on the street, sharp focus, polished but candid",
    thumbnail: "/soul/moodboards/editorial-street-style.webp",
  },
  {
    id: "new-indie", name: "إندي حديث", englishName: "New Indie",
    descriptor: "contemporary indie aesthetic, muted desaturated tones, lo-fi authenticity, Gen Z editorial, painterly slight haze, casual but composed",
    thumbnail: "/soul/moodboards/new-indie.webp",
  },
  {
    id: "underwater", name: "تحت الماء", englishName: "Underwater",
    descriptor: "submerged underwater photograph, refracted caustic light, suspended bubbles, fluid aquamarine palette, weightless ethereal pose",
    thumbnail: "/soul/moodboards/underwater.webp",
  },
  {
    id: "80s-horror", name: "رعب الثمانينيات", englishName: "80s horror",
    descriptor: "1980s slasher film aesthetic, deep magenta and teal grading, VHS scan lines, fog-machine atmosphere, motel-noir framing, retro horror tension",
    thumbnail: "/soul/moodboards/80s-horror.webp",
  },
  {
    id: "disposable-camera", name: "كاميرا للاستعمال", englishName: "Disposable camera",
    descriptor: "single-use disposable camera aesthetic, bright on-camera flash, soft 35mm grain, slight focus drift, party-snapshot mood, candid intimacy",
    thumbnail: "/soul/moodboards/disposable-camera.webp",
  },
  {
    id: "neutral-pastel-film", name: "فيلم باستيل محايد", englishName: "Neutral pastel film",
    descriptor: "Kodak Portra-style neutral pastel film stock, soft natural skin tones, gentle highlight rolloff, painterly mid-tones, refined editorial",
    thumbnail: "/soul/moodboards/neutral-pastel-film.webp",
  },
  {
    id: "warm-vivid-film", name: "فيلم دافئ نابض", englishName: "Warm vivid film",
    descriptor: "warm vivid analog film stock, saturated golden hues, lush mid-day color, painterly contrast, summer-editorial richness",
    thumbnail: "/soul/moodboards/warm-vivid-film.webp",
  },
  {
    id: "bw-film", name: "فيلم أبيض وأسود", englishName: "BW film",
    descriptor: "classic 35mm black-and-white film stock, deep silver tonal range, fine grain, artisan darkroom finish, timeless documentary quality",
    thumbnail: "/soul/moodboards/bw-film.webp",
  },
  {
    id: "warm-contrast-film", name: "فيلم تباين دافئ", englishName: "Warm contrast film",
    descriptor: "warm high-contrast color film, deep amber shadows, glowing skin highlights, painterly chiaroscuro, cinematic celluloid look",
    thumbnail: "/soul/moodboards/warm-contrast-film.webp",
  },
  {
    id: "muted-cool-film", name: "فيلم بارد هادئ", englishName: "Muted cool film",
    descriptor: "muted cool film stock, desaturated steel-blue palette, soft overcast light, melancholic Scandinavian editorial mood, pristine grain",
    thumbnail: "/soul/moodboards/muted-cool-film.webp",
  },
];

export const DEFAULT_MOODBOARD = MOODBOARDS[0]!.id; // "general"

// ────────────────────────────────────────────────────────────────────
// COLOR SIGNATURES (Soul HEX) — 6 curated palettes
// ────────────────────────────────────────────────────────────────────
//
// Each palette has:
//   • A reference photograph that visually anchors the look (the same
//     image Higgsfield shows in the picker)
//   • A 6-color HEX swatch that summarises the palette
//   • A descriptor fragment for the prompt
//
// HEX values were sampled from Higgsfield's reference images — chosen
// to capture both the dominant tones and the "accent" tones that give
// each palette its personality.

export interface ColorPalette {
  id:          string;
  name:        string;
  englishName: string;
  descriptor:  string;
  hexes:       string[];      // 6 representative HEX colors, dominant first
  reference:   string;        // /soul/colors/<file>
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: "film-colors", name: "ألوان فيلم", englishName: "Film colors",
    descriptor: "balanced classic 35mm film color palette, naturalistic skin tones, gentle saturation, painterly highlight roll-off",
    hexes: ["#7a8b6b", "#d8c8a8", "#3e4a3a", "#a89878", "#1a2a18", "#e8d8b8"],
    reference: "/soul/colors/ref-1.jpg",
  },
  {
    id: "lime-jam", name: "ليم جام", englishName: "Lime Jam",
    descriptor: "fresh lime green meadow palette, sky-blue accents, breathable outdoor airy atmosphere, vibrant saturated nature",
    hexes: ["#a8c878", "#7a9858", "#6890b8", "#a0b0c8", "#d8e8a0", "#2c4030"],
    reference: "/soul/colors/ref-2.jpg",
  },
  {
    id: "candy-pink", name: "كاندي بينك", englishName: "Candy pink",
    descriptor: "candy pink and bubblegum palette, glossy magenta highlights, pop magazine vibrance, sweet feminine energy",
    hexes: ["#e8a8b8", "#d88098", "#f0c8d0", "#a85878", "#1c1010", "#e8d8c8"],
    reference: "/soul/colors/ref-3.jpg",
  },
  {
    id: "nostalgic-blue", name: "أزرق حنين", englishName: "Nostalgic blue",
    descriptor: "deep nostalgic ultramarine blue palette, crimson red accent, magazine-editorial contrast, painterly studio mood",
    hexes: ["#2848a0", "#c83828", "#e8b0a0", "#1a2860", "#3a3838", "#d8d0b8"],
    reference: "/soul/colors/ref-4.jpg",
  },
  {
    id: "soft-palette", name: "باستيل ناعم", englishName: "Soft palette",
    descriptor: "soft neutral pastel palette, cream and powder pink, gentle desaturation, refined whisper-quiet editorial mood",
    hexes: ["#e8d8c8", "#d0c0b0", "#a89890", "#787068", "#403838", "#f0e8e0"],
    reference: "/soul/colors/ref-5.jpg",
  },
  {
    id: "black-gloss", name: "بلاك جلوس", englishName: "Black gloss",
    descriptor: "high-contrast black gloss palette, deep concrete grays, polished steel reflections, sculptural architectural mood",
    hexes: ["#1c1c1c", "#3c3c38", "#787068", "#a89888", "#5c4c3c", "#080808"],
    reference: "/soul/colors/ref-6.jpg",
  },
];

// ────────────────────────────────────────────────────────────────────
// Prompt builder
// ────────────────────────────────────────────────────────────────────
//
// Composes the final English prompt the image model sees. Order is
// engineered to match how Higgsfield prompt-grammar weights inputs:
//
//   1. user prompt          (subject, action, scene)
//   2. character notes      (Soul ID — when present)
//   3. moodboard descriptor (style / aesthetic)
//   4. color descriptor     (Soul HEX palette)
//   5. universal Soul cues  (cinematic grade, editorial finish)

export interface BuildSoulPromptOpts {
  basePrompt: string;
  moodboardId?: string;
  paletteId?:   string;
  /** Free-text character note (e.g. "the same young Asian woman from the reference"). */
  characterHint?: string;
  /** When the user has uploaded their own moodboard, pass the descriptor we
   *  derived from the upload. Falls back to the curated preset. */
  customMoodboardDescriptor?: string;
  /** When the user has uploaded a custom Soul HEX reference, the extracted
   *  HEX values get summarised here. Falls back to the curated palette. */
  customPaletteHexes?: string[];
}

export function buildSoulPrompt(opts: BuildSoulPromptOpts): string {
  const moodboard = opts.moodboardId ? MOODBOARDS.find((m) => m.id === opts.moodboardId) : undefined;
  const palette   = opts.paletteId    ? COLOR_PALETTES.find((p) => p.id === opts.paletteId)    : undefined;

  const moodFragment =
    opts.customMoodboardDescriptor?.trim() ||
    moodboard?.descriptor || "";

  const paletteFragment =
    opts.customPaletteHexes && opts.customPaletteHexes.length > 0
      ? `dominant color palette of ${opts.customPaletteHexes.slice(0, 6).join(", ")}, with these tones used in skin highlights, fabric, and background`
      : palette?.descriptor || "";

  return [
    opts.basePrompt.trim(),
    opts.characterHint?.trim(),
    moodFragment,
    paletteFragment,
    "ultra-realistic editorial photograph, fashion-grade composition, magazine-quality lighting, painterly skin tones, high dynamic range, 8K finishing",
  ].filter(Boolean).join(", ");
}

// ── Defaults for a fresh shoot bar ──────────────────────────────────
export const SOUL_DEFAULTS = {
  aspect:     "3:4"        as string,
  quality:    "2k"         as string,
  variations: 1            as number,
  enhancePrompt: true      as boolean,
  moodboardId: DEFAULT_MOODBOARD,
  paletteId:   ""          as string,   // no palette = let the moodboard drive it
};
