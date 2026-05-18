// ════════════════════════════════════════════════════════════════
// Cinema Studio — equipment catalog
// ════════════════════════════════════════════════════════════════
// VERIFIED catalog modeled on the industry-leading cinema studio
// reference (research notes kept private under docs/, never shipped).
//
// Counts match the reference 1:1:
//   • 4 cameras, 6 lenses, 6 focal lengths, 4 apertures, 6 genres
//   • 11 aspect ratios, 3 quality tiers
//
// `refId` holds the source platform's internal UUID for traceability
// — we don't send it anywhere (muapi doesn't know about it) but it
// documents where each preset originated during research.
//
// "Auto" entries mean the underlying model picks based on prompt/genre.
// For us that translates to: skip the descriptor injection in
// buildCinemaPrompt so the model has freedom.
//
// Each `descriptor` is the English fragment we stitch into the muapi
// prompt — DON'T translate that field.

export interface CinemaPreset {
  id:          string;
  name:        string;        // Arabic display name
  englishName: string;        // English label (under the Arabic)
  descriptor:  string;        // English fragment used in the muapi prompt
  thumbnail:   string;        // /cinema/<file>.webp (placeholder until assets land)
  /** Source platform UUID — for documentation only; never sent. */
  refId?:      string;
  /** When true, no descriptor is injected (backend / model picks freely). */
  isAuto?:     boolean;
}

// ── Cameras (4) ────────────────────────────────────────────────────────
export const CAMERAS: CinemaPreset[] = [
  {
    id:          "auto",
    name:        "تلقائي",
    englishName: "Auto",
    descriptor:  "",                       // no injection when Auto
    thumbnail:   "",                       // intentionally empty → text fallback
    refId:        "d178e494-28a8-423d-866c-1b96f60767ab",
    isAuto:      true,
  },
  {
    id:          "raw-16mm",
    name:        "خام 16 ملم",
    englishName: "Raw 16mm",
    descriptor:  "shot on 16mm film, organic grain, soft contrast, vintage texture",
    thumbnail:   "/cinema/classic_16mm_film.webp",  // re-using existing 16mm film asset
    refId:        "67087878-1e62-4666-b4c3-4a7c242966ce",
  },
  {
    id:          "fine-film",
    name:        "فيلم نقي",
    englishName: "Fine Film",
    descriptor:  "shot on fine 35mm cinema film, polished cinematic look, IMAX-grade clarity",
    thumbnail:   "/cinema/grand_format_70mm_film.webp", // re-using existing 70mm film asset
    refId:        "b513ddb7-f551-4cc8-8c5f-47b49efef540",
  },
  {
    id:          "clean-digital",
    name:        "ديجيتال نقي",
    englishName: "Clean Digital",
    descriptor:  "shot on modern digital cinema camera, clean signal, sharp neutral rendering",
    thumbnail:   "/cinema/full_frame_cine_digital.webp", // re-using existing FF digital asset
    refId:        "ea2cc39b-550f-4d25-bb17-6e0e6898d432",
  },
];

// ── Lenses (6 — the reference Cinema 3.5) ──────────────────────────────────
//   Source: 05_CATALOGS/cinema-lenses.md (live React fiber walk)
export const LENSES: CinemaPreset[] = [
  {
    id:          "auto",
    name:        "تلقائي",
    englishName: "Auto",
    descriptor:  "",
    thumbnail:   "",                       // intentionally empty → text fallback
    refId:        "cc4dd47f-1d62-42d4-85c0-d8bfb90569c9",
    isAuto:      true,
  },
  {
    id:          "clinical-sharp",
    name:        "حادة دقيقة",
    englishName: "Clinical Sharp",
    descriptor:  "ultra-sharp clinical prime lens, no aberrations, modern commercial look",
    thumbnail:   "/cinema/clinical_sharp_prime.webp",
    refId:        "60517d85-bacc-4c41-abb7-719dab37eda0",
  },
  {
    id:          "extreme-macro",
    name:        "ماكرو عالية",
    englishName: "Extreme Macro",
    descriptor:  "extreme macro lens, ultra-close-up, hyper-detailed surface texture",
    thumbnail:   "/cinema/extreme_macro.webp",
    refId:        "1af22850-672c-43df-9feb-989d3af79c59",
  },
  {
    id:          "anamorphic",
    name:        "أنامورفيك",
    englishName: "Anamorphic",
    descriptor:  "anamorphic lens, oval bokeh, horizontal lens flares, Hollywood widescreen",
    thumbnail:   "/cinema/classic_anamorphic.webp",
    refId:        "ab148ddc-13de-4869-b8f7-b0450740e7b3",
  },
  {
    id:          "warm-halation",
    name:        "هالة دافئة",
    englishName: "Warm Halation",
    descriptor:  "vintage warm halation around highlights, glowing 70s/80s film aesthetic",
    thumbnail:   "/cinema/halation_diffusion.webp",
    refId:        "86107fa6-421b-467d-bb1f-284bff1bb41d",
  },
  {
    id:          "vintage-haze",
    name:        "ضباب فينتاج",
    englishName: "Vintage Haze",
    descriptor:  "soft vintage diffusion, low contrast, dreamy haze",
    thumbnail:   "/cinema/vintage_prime.webp",
    refId:        "0090339a-fe67-4722-a928-758be7d1d21f",
  },
];

export interface FocalPreset {
  id:           number;
  label:        string;        // "8mm"
  descriptor:   string;        // perspective fragment
}

// ── Focal lengths (6 — the reference Cinema 3.5) ───────────────────────────
//   Source: 05_CATALOGS/cinema-focal-lengths.md (live)
//   Range: 14–100mm (default: 35mm)
export const FOCAL_LENGTHS: FocalPreset[] = [
  { id: 14,  label: "14mm",  descriptor: "ultra-wide architectural perspective"        },
  { id: 24,  label: "24mm",  descriptor: "wide-angle environmental perspective"        },
  { id: 35,  label: "35mm",  descriptor: "natural human-eye cinematic perspective"     }, // default
  { id: 50,  label: "50mm",  descriptor: "standard nifty-fifty natural perspective"    },
  { id: 85,  label: "85mm",  descriptor: "classic compressed portrait perspective"     },
  { id: 100, label: "100mm", descriptor: "long telephoto compressed macro perspective" },
];

export interface AperturePreset {
  id:         string;        // "f/1.4"
  label:      string;        // display label
  descriptor: string;        // depth-of-field fragment
  thumbnail:  string;
}

// ── Genre presets (mirrors the reference platform's Cinema Studio 3.5 genre wheel) ──
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

// ── Genres (6 — the reference Cinema 3.5) ──────────────────────────────────
//   Source: 05_CATALOGS/cinema-genres.md (live React fiber walk)
//   Default: Noir
//   NOTE: the reference removed "General" in 3.5 — every shoot picks a genre.
export const GENRES: GenrePreset[] = [
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
  }, // default
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

// ── Style presets (split into 3 axes like the reference platform's Style Settings) ──
//
// the reference platform's Style picker has three independent wheels: Color Palette,
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

// ── Apertures (4 — the reference Cinema 3.5) ───────────────────────────────
//   Source: 05_CATALOGS/cinema-apertures.md (live)
//   Default: f/4 (Moderate)
export const APERTURES: AperturePreset[] = [
  { id: "auto",  label: "Auto",  descriptor: "",                                                                  thumbnail: ""                       },
  { id: "f/11",  label: "f/11",  descriptor: "deep focus clarity, sharp foreground to background",               thumbnail: "/cinema/f_11.webp"      },
  { id: "f/1.4", label: "f/1.4", descriptor: "shallow depth of field, creamy bokeh, dramatic subject isolation", thumbnail: "/cinema/f_1_4.webp"     },
  { id: "f/4",   label: "f/4",   descriptor: "balanced depth of field, everyday cinema default",                  thumbnail: "/cinema/f_4.webp"       }, // default
];

// the reference UUIDs (documentation only — never sent to muapi):
//   auto:  9695487c-624d-42fd-a9bc-5575221c7199
//   f/11:  dba07242-45e5-4db0-a7bb-c5f87cc65e9b
//   f/1.4: 7d1acec5-7862-4d28-ac4c-6d50ce90b02a
//   f/4:   427ebebf-c565-4a60-a172-6ba08f8aebfc

// ── Aspect & resolution ─────────────────────────────────────────────────

// ── Aspect ratios (11 — the reference Cinema 3.5) ──────────────────────────
//   Source: 05_CATALOGS/image-video-model-picker.md
//   Order matches the reference platform's UI ordering exactly.
export const CINEMA_ASPECTS = [
  { id: "auto", label: "تلقائي"        },
  { id: "1:1",  label: "1:1 مربع"      },
  { id: "3:4",  label: "3:4 عمودي"     },
  { id: "4:3",  label: "4:3 أفقي"      },
  { id: "2:3",  label: "2:3 عمودي"     },
  { id: "3:2",  label: "3:2 أفقي"      },
  { id: "9:16", label: "9:16 عمودي"    },
  { id: "16:9", label: "16:9 سينمائي" }, // default
  { id: "5:4",  label: "5:4"           },
  { id: "4:5",  label: "4:5 إنستجرام" },
  { id: "21:9", label: "21:9 ألترا"   },
] as const;

// ── Quality (3 — the reference Cinema 3.5) ─────────────────────────────────
//   the reference uses uppercase labels (1K / 2K / 4K). IDs stay lowercase
//   for backend compatibility (muapi expects "1k"/"2k"/"4k").
export const CINEMA_RESOLUTIONS = [
  { id: "1k", label: "1K"                             },
  { id: "2k", label: "2K", recommended: true          }, // default
  { id: "4k", label: "4K"                             },
] as const;

// ── Cinema modes (image / video / grid) ────────────────────────────────
//
// Cinema Studio supports three output kinds:
//   • image — single still
//   • video — single motion clip
//   • grid  — 3x3 contact sheet (9 distinct shots of the same subject /
//             scene). Backed by the verbatim contact-sheet template
//             below; uses the image endpoint at high resolution.

export type CinemaMode = "image" | "video" | "grid";

/**
 * Aspect ratios offered when the user is generating a video. Kling
 * v3.0-pro accepts these three; we omit ultra-wide because the motion
 * model crops badly on 21:9.
 */
export const CINEMA_VIDEO_ASPECTS = [
  { id: "16:9", label: "16:9 سينمائي" },
  { id: "9:16", label: "9:16 عمودي"   },
  { id: "1:1",  label: "1:1 مربع"     },
] as const;

/** Kling supports 5s and 10s; longer clips cost ~2× the credits. */
export const CINEMA_VIDEO_DURATIONS = [
  { id: 5,  label: "5 ثواني"  },
  { id: 10, label: "10 ثواني" },
] as const;

/** Video resolution choices — 720p is the cheap path, 1080p the headline. */
export const CINEMA_VIDEO_RESOLUTIONS = [
  { id: "720p",  label: "720p — أرخص" },
  { id: "1080p", label: "1080p — أعلى جودة 🔥", recommended: true },
] as const;

// ── the reference-parity additions (verified from real Cinema 3.5 jobs) ───
//
// These mirror the additional controls the reference exposes in Cinema
// Studio that weren't part of our v1 implementation. Each one maps to
// a real backend field captured from network traces.

/**
 * Number of variants to generate per "Shoot" click. the reference caps at 4
 * variants per job. We fan out N parallel muapi calls (one per variant)
 * because nano-banana caps at 1 image per call when reference is set.
 */
export const VARIANTS_OPTIONS = [
  { id: 1, label: "1 صورة" },
  { id: 2, label: "2 صور" },
  { id: 3, label: "3 صور" },
  { id: 4, label: "4 صور" },
] as const;

/**
 * Speed ramping for video — controls how the AI varies playback speed
 * across the clip. Maps to `speedramp` in the cinematic_studio_video_3_5
 * payload. "auto" = backend decides, others = explicit pacing.
 */
export const SPEEDRAMP_OPTIONS = [
  { id: "auto",   label: "تلقائي"        },
  { id: "slow",   label: "Slow Motion"   },
  { id: "fast",   label: "Fast Motion"   },
  { id: "freeze", label: "Freeze Frame"  },
] as const;

/**
 * Cinema Studio version selector. the reference exposes 3.5 (default),
 * 3.0, and 2.5 in their picker, plus 4 derivative models. We map each
 * to the closest available muapi endpoint.
 */
export const CINEMA_VERSIONS = [
  {
    id:               "v3-5",
    label:            "Cinema Studio 3.5",
    sublabel:         "الأحدث — موصى به",
    recommended:      true,
    // imageEndpoint is the i2i edit variant — used when a reference
    // image is provided. imageT2iEndpoint is the plain text-to-image
    // variant — used when no reference image is provided. Without
    // this split MuAPI 400s with "images_list required" because the
    // -edit endpoints expect a reference image array.
    imageT2iEndpoint: "nano-banana-pro",
    imageEndpoint:    "nano-banana-pro-edit",
    videoEndpoint:    "kling-v3.0-pro-text-to-video",
    videoI2vEndpoint: "kling-v2.1-pro-i2v",
  },
  {
    id:               "v3-0",
    label:            "Cinema Studio 3.0",
    sublabel:         "الإصدار السابق",
    imageT2iEndpoint: "nano-banana-pro",
    imageEndpoint:    "nano-banana-pro-edit",
    videoEndpoint:    "kling-v2.6-pro-t2v",
    videoI2vEndpoint: "kling-v2.1-pro-i2v",
  },
  {
    id:               "v2-5",
    label:            "Cinema Studio 2.5",
    sublabel:         "كلاسيكي",
    // Flux Kontext is i2i only — fall back to flux-dev for text-only.
    imageT2iEndpoint: "flux-dev",
    imageEndpoint:    "flux-kontext-pro-i2i",
    videoEndpoint:    "kling-v2.1-pro-i2v",
    videoI2vEndpoint: "kling-v2.1-pro-i2v",
  },
  {
    id:               "soul-cinema",
    label:            "Soul Cinema",
    sublabel:         "Soul-driven",
    imageT2iEndpoint: "nano-banana-pro",
    imageEndpoint:    "nano-banana-pro-edit",
    videoEndpoint:    "kling-v3.0-pro-text-to-video",
    videoI2vEndpoint: "kling-v2.1-pro-i2v",
    /** When set, the Cinema prompt builder injects this descriptor. */
    soulDescriptor:   "Soul Cinema editorial atmosphere, dreamy color science, cinematic depth",
  },
] as const;

export type CinemaVersionId = (typeof CINEMA_VERSIONS)[number]["id"];

// ── Image Grid (Contact Sheet) — VERBATIM the reference template ─────────
//
// Captured from real `cinematic_studio_image_grid` jobs. This is the
// EXACT prompt template that produces the 9-shot Cinematic Contact
// Sheet (3x3 grid of different shot types). the reference charges 400
// credits at 4K — we route through nano-banana-pro at 4K for parity.

export const CONTACT_SHEET_DIMENSIONS = {
  "3x3": { width: 3072, height: 5504 },
  "4x4": { width: 4096, height: 5504 },
} as const;

/**
 * The cinematic contact-sheet template the reference uses internally.
 * Variables: {{aspect_ratio}}, {{additional_direction}}
 */
export const CONTACT_SHEET_TEMPLATE = `Identify ALL key subjects and their spatial relationships. Generate a cohesive 3x3 grid "Cinematic Contact Sheet" featuring 9 distinct camera shots of these subjects in the same environment. Adapt the cinematic shot types to fit the content:

**Row 1 (Context):**
1. **Extreme Long Shot (ELS):** Subject is small within the vast environment.
2. **Long Shot (LS):** Complete subject is visible top to bottom.
3. **Medium Long Shot (MLS):** Framed knees up or a 3/4 view.

**Row 2 (Coverage):**
4. **Medium Shot (MS):** Framed from the waist up. Focus on interaction.
5. **Medium Close-Up (MCU):** Framed from chest up. Intimate framing.
6. **Close-Up (CU):** Tight framing on the face or front of the object.

**Row 3 (Details & Angles):**
7. **Extreme Close-Up (ECU):** Macro detail focusing on a key feature.
8. **Low Angle Shot:** Looking up at the subject from the ground.
9. **High Angle Shot:** Looking down on the subject from above.

Strict consistency is required: Maintain the same characters, costumes, props and environment throughout all 9 shots. Lighting and color grade must be identical across cells. Aspect: {{aspect_ratio}}.{{additional_direction}}`;

/** Render the contact sheet template with user-supplied vars. */
export function renderContactSheetPrompt(opts: {
  aspectRatio: string;
  additionalDirection?: string;
}): string {
  return CONTACT_SHEET_TEMPLATE
    .replace("{{aspect_ratio}}", opts.aspectRatio)
    .replace("{{additional_direction}}", opts.additionalDirection
      ? `\n\nAdditional direction: ${opts.additionalDirection}`
      : "");
}

// ── Multi-shot mode ────────────────────────────────────────────────────
//
// the reference platform's `multi_shots: true` lets the user write multiple prompts
// that play back-to-back as a single video. We model it as N parallel
// generation calls (one per shot), then offer concat/merge in post.

export const MULTI_SHOT_MODES = [
  { id: "disabled", label: "إيقاف" },
  { id: "custom",   label: "مخصص"  },
] as const;

/** Parse a multi-shot prompt block (one shot per line). */
export function parseMultiShotPrompts(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Pick the right MuAPI endpoint for a given Cinema generation:
 *   - image w/o reference → nano-banana-pro
 *   - image w/  reference → nano-banana-pro-edit
 *   - video w/o reference → kling-v3.0-pro-text-to-video
 *   - video w/  reference → kling-v2.1-pro-i2v
 *
 * (kling-v3.0-pro-text-to-video doesn't accept image references; for
 *  image-to-video we drop down to the v2.1 image-to-video endpoint.)
 */
export function resolveCinemaEndpoint(opts: {
  mode:      CinemaMode;
  hasReference: boolean;
}): string {
  if (opts.mode === "video") {
    return opts.hasReference ? "kling-v2.1-pro-i2v" : "kling-v3.0-pro-text-to-video";
  }
  // grid mode uses the same image endpoint as plain image mode but
  // forces a reference to be present (the contact sheet is built from
  // the user's uploaded image plus the verbatim 9-shot template).
  return opts.hasReference ? "nano-banana-pro-edit" : "nano-banana-pro";
}

/**
 * Cost calculator. Image cost is flat (8 credits). Video cost scales
 * with duration × resolution (1080p ≈ 2× 720p). Grid (contact sheet)
 * is a 4K render with a custom output canvas (~3000x5500), so it
 * costs the same as a 4K image (12 credits).
 */
export function computeCinemaCost(opts: {
  mode:        CinemaMode;
  duration?:   number;       // seconds (video only)
  resolution:  string;
}): number {
  if (opts.mode === "grid") {
    // Contact sheet is always 4K-class output, regardless of the
    // resolution chip — fix at the 4K image price.
    return 12;
  }
  if (opts.mode === "image") {
    return opts.resolution === "4k" ? 12 : opts.resolution === "2k" ? 8 : 5;
  }
  // Video: per-second base × resolution multiplier
  const perSec = opts.resolution === "1080p" ? 5 : 2.5;
  const dur    = opts.duration ?? 5;
  return Math.ceil(dur * perSec);
}

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
  // → motion → finishing. the reference platform's prompt grammar follows this order
  // and the model responds well to it.
  //
  // "Auto" presets (camera/lens/aperture) inject NOTHING — the reference platform's
  // backend lets the model choose freely in that case, so we mirror that
  // by skipping the fragment entirely. Focal length is ALWAYS injected
  // (it's a numeric slider with no Auto state in the reference platform's UI).
  const cameraFragment = camera.isAuto ? null : camera.descriptor;
  const lensFragment = lens.isAuto
    ? `${focal.label} ${focal.descriptor}`                                  // focal-only when lens is Auto
    : `${lens.descriptor} at ${focal.label} (${focal.descriptor})`;          // lens + focal combined otherwise
  const apertureFragment = aperture.id === "auto"
    ? null
    : `aperture ${aperture.id}, ${aperture.descriptor}`;

  return [
    opts.basePrompt.trim(),
    genre?.descriptor ?? null,
    cameraFragment,
    lensFragment,
    apertureFragment,
    lighting?.descriptor ?? null,
    palette?.descriptor  ?? null,
    moveset?.descriptor  ?? null,
    "cinematic lighting, natural color science, high dynamic range",
    "professional photography, ultra-detailed, 8K resolution",
  ].filter(Boolean).join(", ");
}

// Defaults match the reference Cinema 3.5's UI-visible defaults exactly:
//   • Camera = Auto      (CAMERAS[0])
//   • Lens   = Auto      (LENSES[0])
//   • Focal  = 35mm      (FOCAL_LENGTHS[2])  — the reference slider position 3
//   • Aperture = f/4     (APERTURES[3])     — "Moderate"
//   • Genre  = Noir      (GENRES[3])         — the reference platform's snapshot default
//   • Aspect = 16:9      — common default for Cinema
//   • Quality = 2K
export const CINEMA_DEFAULTS = {
  cameraId:    CAMERAS[0]!.id,           // Auto
  lensId:      LENSES[0]!.id,            // Auto
  focal:       35,                        // 35mm — the reference default position
  apertureId:  APERTURES[3]!.id,         // f/4 — the reference Moderate (default)
  aspect:      "16:9" as string,
  resolution:  "2k"   as string,
  // Cinema studio defaults to image mode for back-compat with existing
  // history. Users opt into video via the segmented control.
  mode:           "image"  as CinemaMode,
  videoAspect:    "16:9"   as string,
  videoResolution: "1080p" as string,
  videoDuration:  5,
  // the reference 3.5 always picks a genre — Noir is the snapshot default.
  // Palette/Lighting/Moveset stay "auto" until the user opts in (those
  // catalogs aren't fully exposed by the reference either, so we let the
  // model decide).
  genreId:     "noir"                      as string,
  paletteId:   "auto"                      as string,
  lightingId:  "auto"                      as string,
  movesetId:   "auto"                      as string,
  // the reference-parity additions — defaults preserve previous behaviour
  // until the user opts in.
  variants:        1,
  generateAudio:   false,
  speedramp:       "auto"   as string,
  versionId:       "v3-5"   as CinemaVersionId,
  multiShotMode:   "disabled" as string,
  multiShotPrompts: ""      as string,   // newline-separated shot prompts
};

// ── Endpoint resolver (version-aware) ─────────────────────────────────
//
// The original `resolveCinemaEndpoint` always picked nano-banana / kling
// based on mode + reference. Now we also factor in the chosen Cinema
// version so 3.0 / 2.5 / Soul-Cinema route to their own backbones.

export function resolveCinemaEndpointV2(opts: {
  mode:         CinemaMode;
  hasReference: boolean;
  versionId?:   CinemaVersionId;
}): string {
  const version = CINEMA_VERSIONS.find((v) => v.id === (opts.versionId ?? "v3-5")) ?? CINEMA_VERSIONS[0]!;
  if (opts.mode === "video") {
    return opts.hasReference ? version.videoI2vEndpoint : version.videoEndpoint;
  }
  // For image mode: when a reference is uploaded, use the i2i edit
  // endpoint (which expects images_list). When the user is doing a
  // pure text-to-image generation, use the t2i variant. Without this
  // split, MuAPI 400s with "images_list required" because the -edit
  // endpoints can't run without a reference array.
  //
  // Grid (Contact Sheet) mode always uses the edit endpoint — the UI
  // already gates submission on hasReference for that mode.
  if (opts.mode === "grid" || opts.hasReference) {
    return version.imageEndpoint;
  }
  return version.imageT2iEndpoint;
}
