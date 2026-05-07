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

// ── Genre presets (mirrors Higgsfield's Cinema Studio 3.5 genre wheel) ──
//
// Each genre stamps a tonal/narrative direction onto the prompt. The
// English `descriptor` is what gets concatenated into the muapi prompt
// — keep it untranslated.
export interface GenrePreset {
  id:          string;
  name:        string;        // Arabic display
  englishName: string;        // English label
  descriptor:  string;        // English fragment for the prompt
  /** mp4 preview clip in /public/cinema/genres/ */
  preview:     string;
}

export const GENRES: GenrePreset[] = [
  {
    id:          "general",
    name:        "عام",
    englishName: "General",
    descriptor:  "balanced cinematic mood, no genre bias",
    preview:     "/cinema/genres/general.mp4",
  },
  {
    id:          "action",
    name:        "أكشن",
    englishName: "Action",
    descriptor:  "high-energy action cinema, kinetic motion, bold contrast, dynamic composition",
    preview:     "/cinema/genres/action.mp4",
  },
  {
    id:          "horror",
    name:        "رعب",
    englishName: "Horror",
    descriptor:  "horror cinema atmosphere, dread, low-key shadows, unsettling framing",
    preview:     "/cinema/genres/horror.mp4",
  },
  {
    id:          "comedy",
    name:        "كوميدي",
    englishName: "Comedy",
    descriptor:  "comedy cinema feel, bright energetic palette, playful framing, charming light",
    preview:     "/cinema/genres/comedy.mp4",
  },
  {
    id:          "noir",
    name:        "نوار",
    englishName: "Noir",
    descriptor:  "classic film noir aesthetic, hard shadows, venetian-blind light, moral ambiguity",
    preview:     "/cinema/genres/noir.mp4",
  },
  {
    id:          "drama",
    name:        "درامي",
    englishName: "Drama",
    descriptor:  "intimate dramatic cinema, emotional close-ups, restrained color, naturalistic light",
    preview:     "/cinema/genres/drama.mp4",
  },
  {
    id:          "epic",
    name:        "ملحمي",
    englishName: "Epic",
    descriptor:  "epic cinema scale, grand vistas, heroic blocking, atmospheric depth",
    preview:     "/cinema/genres/epic.mp4",
  },
];

// ── Style presets (split into 3 axes like Higgsfield's Style Settings) ──
//
// Higgsfield's Style picker has three independent wheels: Color Palette,
// Lighting, and Camera Moveset Style. We mirror that 1:1 so the resulting
// prompt language is compatible with the same look-up tables those models
// were trained on.

export interface StylePreset {
  id:          string;
  name:        string;       // Arabic display
  englishName: string;       // English label
  descriptor:  string;       // prompt fragment
  /** webp / jpg / mp4 in /public/cinema/{palette,lighting,moveset}/ */
  thumbnail:   string;
}

export const COLOR_PALETTES: StylePreset[] = [
  {
    id: "auto",                  name: "تلقائي",            englishName: "Auto",
    descriptor: "natural color palette",
    thumbnail:  "",
  },
  {
    id: "naturalistic-clean",    name: "طبيعي نقي",         englishName: "Naturalistic Clean",
    descriptor: "naturalistic clean color palette, true-to-life skin tones",
    thumbnail:  "/cinema/palette/naturalistic-clean.jpg",
  },
  {
    id: "bleached-warm",         name: "دافئ مبيّض",         englishName: "Bleached Warm",
    descriptor: "bleached warm tones, sun-faded highlights, golden mid-tones",
    thumbnail:  "/cinema/palette/bleached-warm.jpg",
  },
  {
    id: "hyper-neon",            name: "نيون عالي",          englishName: "Hyper Neon",
    descriptor: "hyper-saturated neon palette, electric magenta and cyan, glowing rim light",
    thumbnail:  "/cinema/palette/hyper-neon.jpg",
  },
  {
    id: "teal-orange-epic",      name: "تيل وبرتقالي ملحمي", englishName: "Teal Orange Epic",
    descriptor: "teal and orange epic blockbuster grade, rich highlights, deep teal shadows",
    thumbnail:  "/cinema/palette/teal-orange-epic.jpg",
  },
  {
    id: "sodium-decay",          name: "اضمحلال صوديومي",   englishName: "Sodium Decay",
    descriptor: "sodium-vapor street palette, amber-yellow highlights, muddy shadows",
    thumbnail:  "/cinema/palette/sodium-decay.jpg",
  },
  {
    id: "cold-steel",            name: "صلب بارد",           englishName: "Cold Steel",
    descriptor: "cold steel palette, desaturated blue-grey, clinical highlights",
    thumbnail:  "/cinema/palette/cold-steel.jpg",
  },
  {
    id: "bleach-bypass",         name: "بليتش بايباس",       englishName: "Bleach Bypass",
    descriptor: "bleach-bypass film process, crushed contrast, low chroma, gritty highlights",
    thumbnail:  "/cinema/palette/bleach-bypass.jpg",
  },
  {
    id: "classic-bw",            name: "أبيض وأسود كلاسيكي",  englishName: "Classic BW",
    descriptor: "classic black-and-white cinema, rich silver tones, deep blacks",
    thumbnail:  "/cinema/palette/classic-bw.jpg",
  },
];

export const LIGHTING_STYLES: StylePreset[] = [
  {
    id: "auto",            name: "تلقائي",       englishName: "Auto",
    descriptor: "natural lighting",
    thumbnail:  "",
  },
  {
    id: "soft-cross",      name: "كروس ناعم",    englishName: "Soft Cross",
    descriptor: "soft cross lighting, gentle key/fill ratio, flattering portrait look",
    thumbnail:  "/cinema/lighting/soft-cross.jpg",
  },
  {
    id: "contre-jour",     name: "ضد الضوء",     englishName: "Contre Jour",
    descriptor: "contre-jour backlight, glowing rim, lens halation around the subject",
    thumbnail:  "/cinema/lighting/contre-jour.jpg",
  },
  {
    id: "overhead-fall",   name: "إضاءة من فوق",  englishName: "Overhead Fall",
    descriptor: "harsh overhead light, dramatic falloff, deep shadows under brow and chin",
    thumbnail:  "/cinema/lighting/overhead-fall.jpg",
  },
  {
    id: "window",          name: "ضوء نافذة",    englishName: "Window",
    descriptor: "natural window light, soft directional key, painterly falloff",
    thumbnail:  "/cinema/lighting/window.jpg",
  },
  {
    id: "practicals",      name: "إضاءة عملية",   englishName: "Practicals",
    descriptor: "lit by practicals only — lamps, neon signs, screens — naturalistic mood",
    thumbnail:  "/cinema/lighting/practicals.jpg",
  },
  {
    id: "silhouette",      name: "ظل خلفي",       englishName: "Silhouette",
    descriptor: "silhouette lighting, subject backlit to near-black against bright background",
    thumbnail:  "/cinema/lighting/silhouette.jpg",
  },
];

export const MOVESETS: StylePreset[] = [
  {
    id: "auto",              name: "تلقائي",          englishName: "Auto",
    descriptor: "natural camera movement",
    thumbnail:  "",
  },
  {
    id: "classic-static",    name: "ثابت كلاسيكي",     englishName: "Classic Static",
    descriptor: "classic locked-off static frame, composed, no camera movement",
    thumbnail:  "/cinema/moveset/classic-static.mp4",
  },
  {
    id: "silent-machine",    name: "آلة صامتة",        englishName: "Silent Machine",
    descriptor: "silent machine-like dolly motion, ultra-smooth, mechanical precision",
    thumbnail:  "/cinema/moveset/silent-machine.mp4",
  },
  {
    id: "one-take",          name: "لقطة واحدة",       englishName: "One Take",
    descriptor: "single-take continuous camera move, choreographed blocking, immersive flow",
    thumbnail:  "/cinema/moveset/one-take.mp4",
  },
  {
    id: "epic-scale",        name: "حجم ملحمي",         englishName: "Epic Scale",
    descriptor: "epic scale camera move, sweeping crane, vast establishing reveal",
    thumbnail:  "/cinema/moveset/epic-scale.mp4",
  },
  {
    id: "intimate-observer", name: "مراقب حميمي",      englishName: "Intimate Observer",
    descriptor: "intimate observer perspective, slow handheld push-in, breathing close-ups",
    thumbnail:  "/cinema/moveset/intimate-observer.mp4",
  },
  {
    id: "impossible-camera", name: "كاميرا مستحيلة",   englishName: "Impossible Camera",
    descriptor: "impossible camera move, gravity-defying paths, through walls and objects",
    thumbnail:  "/cinema/moveset/impossible-camera.mp4",
  },
  {
    id: "documentary-snap",  name: "وثائقي مفاجئ",     englishName: "Documentary Snap",
    descriptor: "documentary-style handheld with sudden whip pans and rack-focus snaps",
    thumbnail:  "/cinema/moveset/documentary-snap.mp4",
  },
  {
    id: "raw-chaos",         name: "فوضى خام",          englishName: "Raw Chaos",
    descriptor: "raw chaotic handheld energy, unpredictable framing, kinetic disarray",
    thumbnail:  "/cinema/moveset/raw-chaos.mp4",
  },
  {
    id: "dreamy-flow",       name: "تدفق حالم",         englishName: "Dreamy Flow",
    descriptor: "dreamy floating flow, weightless camera glide, surreal pacing",
    thumbnail:  "/cinema/moveset/dreamy-flow.mp4",
  },
];

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
  /** Optional style/genre layers — when "auto" or omitted we skip the
   *  fragment so the model gets a cleaner prompt. */
  genreId?:    string;
  paletteId?:  string;
  lightingId?: string;
  movesetId?:  string;
}): string {
  const camera   = CAMERAS.find((c) => c.id === opts.cameraId)   ?? CAMERAS[0]!;
  const lens     = LENSES.find((l)  => l.id === opts.lensId)     ?? LENSES[0]!;
  const focal    = FOCAL_LENGTHS.find((f) => f.id === opts.focal) ?? FOCAL_LENGTHS[3]!;
  const aperture = APERTURES.find((a) => a.id === opts.apertureId) ?? APERTURES[0]!;
  const genre    = opts.genreId    ? GENRES.find((g)          => g.id === opts.genreId)    : undefined;
  const palette  = opts.paletteId && opts.paletteId !== "auto"
                   ? COLOR_PALETTES.find((p) => p.id === opts.paletteId) : undefined;
  const lighting = opts.lightingId && opts.lightingId !== "auto"
                   ? LIGHTING_STYLES.find((l) => l.id === opts.lightingId) : undefined;
  const moveset  = opts.movesetId && opts.movesetId !== "auto"
                   ? MOVESETS.find((m)        => m.id === opts.movesetId) : undefined;

  // Order matters: subject → genre vibe → camera/lens optics → light/grade
  // → motion → finishing. Higgsfield's prompt grammar follows this order
  // and the model responds well to it.
  return [
    opts.basePrompt.trim(),
    genre    && genre.id !== "general" ? genre.descriptor : null,
    `shot on a ${camera.descriptor}`,
    `using a ${lens.descriptor} at ${focal.label} (${focal.descriptor})`,
    `aperture ${aperture.id}, ${aperture.descriptor}`,
    lighting?.descriptor ?? null,
    palette?.descriptor  ?? null,
    moveset?.descriptor  ?? null,
    "cinematic lighting, natural color science, high dynamic range",
    "professional photography, ultra-detailed, 8K resolution",
  ].filter(Boolean).join(", ");
}

export const CINEMA_DEFAULTS = {
  cameraId:    CAMERAS[0]!.id,
  lensId:      LENSES[6]!.id,            // Warm Cinema Prime — better default
  focal:       35,
  apertureId:  APERTURES[0]!.id,         // f/1.4
  aspect:      "16:9" as string,
  resolution:  "2k"   as string,
  // New layers default to "auto/general" so behaviour is unchanged
  // until the user explicitly opts in.
  genreId:     "general"                   as string,
  paletteId:   "auto"                      as string,
  lightingId:  "auto"                      as string,
  movesetId:   "auto"                      as string,
};
