// ════════════════════════════════════════════════════════════════
// Cinema Studio — equipment catalog
// ════════════════════════════════════════════════════════════════
// Mirrors OpenHiggsField's Cinema preset list 1:1 (so we can rely on
// nano-banana-pro understanding the prompt vocabulary), with Arabic
// display names layered on top.
//
// Each `descriptor` is the English fragment that gets stitched into
// the muapi prompt — DON'T translate that field.

export interface CinemaPreset {
  id:          string;
  name:        string;        // Arabic display name
  englishName: string;        // English label (under the Arabic)
  descriptor:  string;        // English fragment used in the muapi prompt
  thumbnail:   string;        // /cinema/<file>.webp
}

export const CAMERAS: CinemaPreset[] = [
  {
    id:          "modular-8k-digital",
    name:        "ديجيتال 8K معياري",
    englishName: "Modular 8K Digital",
    descriptor:  "modular 8K digital cinema camera",
    thumbnail:   "/cinema/modular_8k_digital.webp",
  },
  {
    id:          "full-frame-cine-digital",
    name:        "سينمائية فل-فريم",
    englishName: "Full-Frame Cine Digital",
    descriptor:  "full-frame digital cinema camera",
    thumbnail:   "/cinema/full_frame_cine_digital.webp",
  },
  {
    id:          "grand-format-70mm",
    name:        "فيلم 70 ملم",
    englishName: "Grand Format 70mm Film",
    descriptor:  "grand format 70mm film camera",
    thumbnail:   "/cinema/grand_format_70mm_film.webp",
  },
  {
    id:          "studio-digital-s35",
    name:        "ستوديو S35 ديجيتال",
    englishName: "Studio Digital S35",
    descriptor:  "Super 35 studio digital camera",
    thumbnail:   "/cinema/studio_digital_s35.webp",
  },
  {
    id:          "classic-16mm",
    name:        "فيلم كلاسيكي 16 ملم",
    englishName: "Classic 16mm Film",
    descriptor:  "classic 16mm film camera",
    thumbnail:   "/cinema/classic_16mm_film.webp",
  },
  {
    id:          "premium-large-format",
    name:        "ديجيتال مساحة كبيرة",
    englishName: "Premium Large Format",
    descriptor:  "premium large-format digital cinema camera",
    thumbnail:   "/cinema/premium_large_format_digital.webp",
  },
];

export const LENSES: CinemaPreset[] = [
  {
    id:          "creative-tilt",
    name:        "تيلت إبداعية",
    englishName: "Creative Tilt Lens",
    descriptor:  "creative tilt lens effect",
    thumbnail:   "/cinema/creative_tilt_lens.webp",
  },
  {
    id:          "compact-anamorphic",
    name:        "أنامورفيك مدمجة",
    englishName: "Compact Anamorphic",
    descriptor:  "compact anamorphic lens",
    thumbnail:   "/cinema/compact_anamorphic.webp",
  },
  {
    id:          "extreme-macro",
    name:        "ماكرو عالية",
    englishName: "Extreme Macro",
    descriptor:  "extreme macro lens",
    thumbnail:   "/cinema/extreme_macro.webp",
  },
  {
    id:          "70s-cinema-prime",
    name:        "سينما السبعينيات",
    englishName: "70s Cinema Prime",
    descriptor:  "1970s cinema prime lens",
    thumbnail:   "/cinema/70s_cinema_prime.webp",
  },
  {
    id:          "classic-anamorphic",
    name:        "أنامورفيك كلاسيكي",
    englishName: "Classic Anamorphic",
    descriptor:  "classic anamorphic lens",
    thumbnail:   "/cinema/classic_anamorphic.webp",
  },
  {
    id:          "premium-modern-prime",
    name:        "بريم حديثة فاخرة",
    englishName: "Premium Modern Prime",
    descriptor:  "premium modern prime lens",
    thumbnail:   "/cinema/premium_modern_prime.webp",
  },
  {
    id:          "warm-cinema-prime",
    name:        "بريم سينما دافئة",
    englishName: "Warm Cinema Prime",
    descriptor:  "warm-toned cinema prime lens",
    thumbnail:   "/cinema/warm_cinema_prime.webp",
  },
  {
    id:          "swirl-bokeh-portrait",
    name:        "بورتريه بوكيه",
    englishName: "Swirl Bokeh Portrait",
    descriptor:  "swirl bokeh portrait lens",
    thumbnail:   "/cinema/swirl_bokeh_portrait.webp",
  },
  {
    id:          "vintage-prime",
    name:        "بريم فينتاج",
    englishName: "Vintage Prime",
    descriptor:  "vintage prime lens",
    thumbnail:   "/cinema/vintage_prime.webp",
  },
  {
    id:          "halation-diffusion",
    name:        "هالة وانتشار",
    englishName: "Halation Diffusion",
    descriptor:  "halation diffusion filter",
    thumbnail:   "/cinema/halation_diffusion.webp",
  },
  {
    id:          "clinical-sharp-prime",
    name:        "بريم حادة دقيقة",
    englishName: "Clinical Sharp Prime",
    descriptor:  "ultra-sharp clinical prime lens",
    thumbnail:   "/cinema/clinical_sharp_prime.webp",
  },
];

export interface FocalPreset {
  id:           number;
  label:        string;        // "8mm"
  descriptor:   string;        // perspective fragment
}

export const FOCAL_LENGTHS: FocalPreset[] = [
  { id: 8,  label: "8mm",  descriptor: "ultra-wide perspective"        },
  { id: 14, label: "14mm", descriptor: "wide-angle perspective"        },
  { id: 24, label: "24mm", descriptor: "wide-angle dynamic perspective"},
  { id: 35, label: "35mm", descriptor: "natural cinematic perspective" },
  { id: 50, label: "50mm", descriptor: "standard portrait perspective" },
  { id: 85, label: "85mm", descriptor: "classic portrait perspective"  },
];

export interface AperturePreset {
  id:         string;        // "f/1.4"
  label:      string;        // display label
  descriptor: string;        // depth-of-field fragment
  thumbnail:  string;
}

export const APERTURES: AperturePreset[] = [
  { id: "f/1.4", label: "f/1.4", descriptor: "shallow depth of field, creamy bokeh",  thumbnail: "/cinema/f_1_4.webp" },
  { id: "f/4",   label: "f/4",   descriptor: "balanced depth of field",                thumbnail: "/cinema/f_4.webp"   },
  { id: "f/11",  label: "f/11",  descriptor: "deep focus clarity, sharp foreground to background", thumbnail: "/cinema/f_11.webp" },
];

// ── Aspect & resolution ─────────────────────────────────────────────────

export const CINEMA_ASPECTS = [
  { id: "16:9", label: "16:9 سينمائي" },
  { id: "21:9", label: "21:9 ألترا"   },
  { id: "9:16", label: "9:16 عمودي"   },
  { id: "1:1",  label: "1:1 مربع"     },
  { id: "4:5",  label: "4:5 إنستجرام" },
] as const;

export const CINEMA_RESOLUTIONS = [
  { id: "1k", label: "1K — أسرع" },
  { id: "2k", label: "2K — موصى به", recommended: true },
  { id: "4k", label: "4K — جودة عالية" },
] as const;

// ── Prompt builder (English fragment) ─────────────────────────────────

export function buildCinemaPrompt(opts: {
  basePrompt: string;
  cameraId:   string;
  lensId:     string;
  focal:      number;
  apertureId: string;
}): string {
  const camera   = CAMERAS.find((c) => c.id === opts.cameraId)   ?? CAMERAS[0]!;
  const lens     = LENSES.find((l)  => l.id === opts.lensId)     ?? LENSES[0]!;
  const focal    = FOCAL_LENGTHS.find((f) => f.id === opts.focal) ?? FOCAL_LENGTHS[3]!;
  const aperture = APERTURES.find((a) => a.id === opts.apertureId) ?? APERTURES[0]!;

  return [
    opts.basePrompt.trim(),
    `shot on a ${camera.descriptor}`,
    `using a ${lens.descriptor} at ${focal.label} (${focal.descriptor})`,
    `aperture ${aperture.id}, ${aperture.descriptor}`,
    "cinematic lighting, natural color science, high dynamic range",
    "professional photography, ultra-detailed, 8K resolution",
  ].join(", ");
}

export const CINEMA_DEFAULTS = {
  cameraId:    CAMERAS[0]!.id,
  lensId:      LENSES[6]!.id,            // Warm Cinema Prime — better default
  focal:       35,
  apertureId:  APERTURES[0]!.id,         // f/1.4
  aspect:      "16:9" as string,
  resolution:  "2k"   as string,
};
