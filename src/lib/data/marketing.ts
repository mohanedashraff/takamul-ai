// ════════════════════════════════════════════════════════════════
// Marketing Studio — formats, hooks, settings, avatars
// ════════════════════════════════════════════════════════════════
//
// Mirrors Higgsfield's `/marketing-studio/product` and `/marketing-studio/app`
// catalogs. All MP4 previews are mirrored to /public/marketing/ so we don't
// depend on Higgsfield's CDN. See docs/MARKETING_STUDIO_RESEARCH.md.
//
// Slugs match Higgsfield's preset slugs verbatim — that's the canonical id we
// pass to MuAPI's `video_files: [...]` field.

// ── Formats ──────────────────────────────────────────────────────

export type MarketingVariant = "product" | "app";

export interface MarketingFormat {
  id:          string;             // Higgsfield slug (e.g. "ugc_how_to")
  variant:     MarketingVariant;   // which studio variant offers it
  name:        string;             // Arabic display
  englishName: string;             // English fallback
  desc:        string;             // short Arabic description
  videoUrl:    string;             // local-mirrored
  promptInjection?: string;        // appended to user prompt at generation time
}

const FMT = "/marketing/formats";

export const MARKETING_FORMATS: MarketingFormat[] = [
  // — Product variant — 9 entries
  {
    id:              "ugc",
    variant:         "product",
    name:            "محتوى عضوي",
    englishName:     "UGC",
    desc:            "محتوى يبدو طبيعياً من المستخدمين",
    videoUrl:        `${FMT}/ugc.mp4`,
    promptInjection: "shot in casual handheld UGC style, natural lighting, vertical phone composition",
  },
  {
    id:              "ugc_how_to",
    variant:         "product",
    name:            "شرح وتعليم",
    englishName:     "Tutorial",
    desc:            "اشرح كيف يعمل منتجك بأسلوب سهل",
    videoUrl:        `${FMT}/ugc_how_to.mp4`,
    promptInjection: "tutorial / how-to demonstration, step-by-step product usage shown clearly to the camera",
  },
  {
    id:              "ugc_unboxing",
    variant:         "product",
    name:            "فتح الصندوق",
    englishName:     "Unboxing",
    desc:            "تجربة فتح المنتج بطريقة جذابة",
    videoUrl:        `${FMT}/ugc_unboxing.mp4`,
    promptInjection: "unboxing experience, hands tearing packaging, satisfying reveal of the product",
  },
  {
    id:              "hyper-motion-mini",
    variant:         "product",
    name:            "حركة سريعة",
    englishName:     "Hyper Motion",
    desc:            "إعلان ديناميكي بحركة سريعة",
    videoUrl:        `${FMT}/hyper-motion-mini.mp4`,
    promptInjection: "hyper-kinetic motion, fast cuts, dynamic camera moves, energetic pace",
  },
  {
    id:              "product_review",
    variant:         "product",
    name:            "مراجعة منتج",
    englishName:     "Product Review",
    desc:            "أسلوب مراجعة احترافي ومقنع",
    videoUrl:        `${FMT}/product_review.mp4`,
    promptInjection: "professional product review, presenter addressing camera with confidence",
  },
  {
    id:              "tv-spot-mini",
    variant:         "product",
    name:            "إعلان تلفزيوني",
    englishName:     "TV Spot",
    desc:            "إعلان قصير بأسلوب تلفزيوني",
    videoUrl:        `${FMT}/tv-spot-mini.mp4`,
    promptInjection: "polished TV spot, cinematic lighting, hero product close-ups, agency-grade composition",
  },
  {
    id:              "wild_card",
    variant:         "product",
    name:            "ورقة جامحة",
    englishName:     "Wild Card",
    desc:            "أسلوب غير متوقع وإبداعي",
    videoUrl:        `${FMT}/wild_card.mp4`,
    promptInjection: "unexpected, surreal, scroll-stopping creative direction; lean into the unusual",
  },
  {
    id:              "ugc_virtual_try_on",
    variant:         "product",
    name:            "تجربة افتراضية UGC",
    englishName:     "UGC Virtual Try On",
    desc:            "العارض يجرب المنتج بأسلوب طبيعي",
    videoUrl:        `${FMT}/ugc_virtual_try_on.mp4`,
    promptInjection: "talent trying the product on themselves, casual UGC handheld style",
  },
  {
    id:              "virtual_try_on",
    variant:         "product",
    name:            "تجربة احترافية",
    englishName:     "Pro Virtual Try On",
    desc:            "العارض يجرب المنتج بأسلوب احترافي",
    videoUrl:        `${FMT}/virtual_try_on.mp4`,
    promptInjection: "studio-quality try-on, model showcasing fit and details, fashion-editorial presentation",
  },

  // — App variant — currently only UGC is offered on Higgsfield
  {
    id:              "ugc-app",
    variant:         "app",
    name:            "محتوى عضوي للتطبيق",
    englishName:     "UGC",
    desc:            "فيديوهات تطبيق طبيعية بأسلوب المستخدمين",
    videoUrl:        `${FMT}/ugc.mp4`,            // shared preview
    promptInjection: "casual UGC review of the app, person scrolling and tapping through the interface, natural commentary",
  },
];

// ── Hooks ────────────────────────────────────────────────────────
// Hooks are short scripted "first-3-seconds" actions designed to stop the
// scroll. Higgsfield groups them into "Stunt" (loud/dramatic) and "Subtle"
// (talking-head etc).
//
// Note: video previews aren't mirrored yet — Higgsfield serves them via an
// internal endpoint. For now we render a gradient + icon fallback. Add
// `videoUrl` when we re-scrape with auth.

export type MarketingHookCategory = "stunt" | "subtle";

export interface MarketingHook {
  id:              string;
  name:            string;             // Arabic display
  englishName:     string;
  category:        MarketingHookCategory;
  desc:            string;             // short Arabic
  emoji:           string;             // shown in the fallback tile
  gradient:        string;             // Tailwind gradient classes for the tile
  promptInjection: string;             // appended to user prompt
  videoUrl?:       string;             // optional preview video
}

export const MARKETING_HOOKS: MarketingHook[] = [
  {
    id:              "product_hit",
    name:            "ضربة المنتج",
    englishName:     "Product Hit",
    category:        "stunt",
    desc:            "المنتج يقتحم اللقطة بقوة",
    emoji:           "💥",
    gradient:        "from-red-500/30 via-orange-500/20 to-yellow-500/10",
    promptInjection: "open with the product slamming into frame in a single dramatic motion",
  },
  {
    id:              "spicy",
    name:            "جريء",
    englishName:     "Spicy",
    category:        "stunt",
    desc:            "افتتاحية ساخنة وجريئة",
    emoji:           "🌶️",
    gradient:        "from-pink-500/30 via-red-500/20 to-orange-500/10",
    promptInjection: "open with a confident, eye-catching reveal that flirts with the audience",
  },
  {
    id:              "interview",
    name:            "مقابلة",
    englishName:     "Interview",
    category:        "subtle",
    desc:            "شخص يتحدث للكاميرا مباشرة",
    emoji:           "🎙️",
    gradient:        "from-sky-500/30 via-indigo-500/20 to-purple-500/10",
    promptInjection: "open with a presenter on camera, talking-head style, looking straight at the lens",
  },
  {
    id:              "random_object_mic",
    name:            "ميكروفون عشوائي",
    englishName:     "Random Object Mic",
    category:        "subtle",
    desc:            "حمل غرض عشوائي كأنه ميكروفون",
    emoji:           "🎤",
    gradient:        "from-amber-500/30 via-yellow-500/20 to-lime-500/10",
    promptInjection: "open with the talent holding a random everyday object as if it were a microphone",
  },
  {
    id:              "product_crash",
    name:            "تحطم المنتج",
    englishName:     "Product Crash",
    category:        "stunt",
    desc:            "المنتج يصطدم بشيء بقوة",
    emoji:           "💢",
    gradient:        "from-rose-500/30 via-red-500/20 to-zinc-500/10",
    promptInjection: "open with the product violently crashing into a surface, debris flying",
  },
  {
    id:              "blizzard",
    name:            "عاصفة",
    englishName:     "Blizzard",
    category:        "stunt",
    desc:            "ثلج/رياح تنفجر حول المنتج",
    emoji:           "🌨️",
    gradient:        "from-cyan-500/30 via-sky-500/20 to-blue-500/10",
    promptInjection: "open with snow and wind blasting past the product, particles streaking the lens",
  },
  {
    id:              "camera_bump",
    name:            "ارتجاج الكاميرا",
    englishName:     "Camera Bump",
    category:        "subtle",
    desc:            "اهتزاز مفاجئ للكاميرا عند الكشف",
    emoji:           "📸",
    gradient:        "from-violet-500/30 via-fuchsia-500/20 to-pink-500/10",
    promptInjection: "open with a sudden camera shake/bump that punctuates the product reveal",
  },
  {
    id:              "product_dodge",
    name:            "مراوغة المنتج",
    englishName:     "Product Dodge",
    category:        "stunt",
    desc:            "المنتج يتفادى شيئاً قادماً",
    emoji:           "🎯",
    gradient:        "from-emerald-500/30 via-teal-500/20 to-cyan-500/10",
    promptInjection: "open with the product dodging an incoming object in slow-motion",
  },
  {
    id:              "epic_fail",
    name:            "فشل ملحمي",
    englishName:     "Epic Fail",
    category:        "subtle",
    desc:            "موقف كوميدي يحدث فيه شيء غير متوقع",
    emoji:           "🤡",
    gradient:        "from-yellow-500/30 via-amber-500/20 to-red-500/10",
    promptInjection: "open with a relatable, comedic mishap that immediately resolves into the product saving the day",
  },
];

// ── Settings ─────────────────────────────────────────────────────

export interface MarketingSetting {
  id:              string;
  name:            string;
  englishName:     string;
  desc:            string;
  emoji:           string;
  gradient:        string;
  promptInjection: string;
  videoUrl?:       string;
}

export const MARKETING_SETTINGS: MarketingSetting[] = [
  {
    id:              "bedroom",
    name:            "غرفة نوم",
    englishName:     "Bedroom",
    desc:            "أجواء منزلية حميمة",
    emoji:           "🛏️",
    gradient:        "from-rose-500/25 via-pink-500/15 to-amber-500/10",
    promptInjection: "set in a softly-lit modern bedroom, lifestyle vibe, warm tones",
  },
  {
    id:              "airplane_wing",
    name:            "جناح طائرة",
    englishName:     "Airplane Wing",
    desc:            "مغامرة وسفر",
    emoji:           "✈️",
    gradient:        "from-sky-500/25 via-blue-500/15 to-indigo-500/10",
    promptInjection: "set on the wing of a flying airplane high above the clouds, golden-hour light",
  },
  {
    id:              "nature",
    name:            "طبيعة",
    englishName:     "Nature",
    desc:            "في الطبيعة المفتوحة",
    emoji:           "🌲",
    gradient:        "from-emerald-500/25 via-lime-500/15 to-yellow-500/10",
    promptInjection: "set outdoors in lush nature, dappled sunlight, organic backdrop",
  },
  {
    id:              "roofing",
    name:            "سطح بناية",
    englishName:     "Roofing",
    desc:            "سطح حضري مفتوح",
    emoji:           "🏙️",
    gradient:        "from-zinc-500/25 via-slate-500/15 to-blue-500/10",
    promptInjection: "set on an urban rooftop, city skyline backdrop, dusk lighting",
  },
  {
    id:              "gym",
    name:            "صالة رياضية",
    englishName:     "Gym",
    desc:            "أجواء لياقة وقوة",
    emoji:           "💪",
    gradient:        "from-orange-500/25 via-red-500/15 to-zinc-500/10",
    promptInjection: "set in a contemporary gym, athletic lighting, energy and motion",
  },
  {
    id:              "volcano_rim",
    name:            "حافة بركان",
    englishName:     "Volcano Rim",
    desc:            "إطلالة درامية وملحمية",
    emoji:           "🌋",
    gradient:        "from-red-600/30 via-orange-500/20 to-yellow-500/10",
    promptInjection: "set on the rim of an active volcano, glowing lava, dramatic atmosphere",
  },
  {
    id:              "bathroom",
    name:            "حمام",
    englishName:     "Bathroom",
    desc:            "للعناية والجمال",
    emoji:           "🛁",
    gradient:        "from-cyan-500/25 via-sky-500/15 to-white/5",
    promptInjection: "set in a luxurious modern bathroom, marble surfaces, spa-like ambience",
  },
  {
    id:              "tiny_reviewer",
    name:            "المراجع المصغّر",
    englishName:     "Tiny Reviewer",
    desc:            "مقياس مصغّر طريف",
    emoji:           "🔍",
    gradient:        "from-purple-500/25 via-violet-500/15 to-pink-500/10",
    promptInjection: "miniature scale gimmick — the talent appears tiny next to the full-size product",
  },
  {
    id:              "kitchen",
    name:            "مطبخ",
    englishName:     "Kitchen",
    desc:            "للأكل والأدوات المنزلية",
    emoji:           "🍳",
    gradient:        "from-yellow-500/25 via-orange-500/15 to-red-500/10",
    promptInjection: "set in a bright modern kitchen, natural daylight through a window",
  },
  {
    id:              "car_roof",
    name:            "سقف سيارة",
    englishName:     "Car Roof",
    desc:            "فوق سيارة متحركة",
    emoji:           "🚗",
    gradient:        "from-zinc-500/25 via-slate-500/15 to-amber-500/10",
    promptInjection: "set on top of a moving car, motion blur in the background, action energy",
  },
  {
    id:              "in_car",
    name:            "داخل سيارة",
    englishName:     "In Car",
    desc:            "POV من داخل السيارة",
    emoji:           "🛞",
    gradient:        "from-slate-500/25 via-zinc-500/15 to-orange-500/10",
    promptInjection: "set inside a car, dashboard POV, road scrolling past through the windshield",
  },
  {
    id:              "street",
    name:            "شارع",
    englishName:     "Street",
    desc:            "شارع حضري عفوي",
    emoji:           "🚶",
    gradient:        "from-zinc-500/25 via-stone-500/15 to-amber-500/10",
    promptInjection: "set on a candid city street, passersby, ambient urban noise",
  },
  {
    id:              "office",
    name:            "مكتب",
    englishName:     "Office",
    desc:            "أجواء مهنية وأعمال",
    emoji:           "💼",
    gradient:        "from-blue-500/25 via-indigo-500/15 to-zinc-500/10",
    promptInjection: "set in a sleek modern office, B2B professional vibe, soft daylight",
  },
  {
    id:              "train_surf",
    name:            "ركوب القطار",
    englishName:     "Train Surf",
    desc:            "حركة جريئة فوق قطار",
    emoji:           "🚆",
    gradient:        "from-red-500/25 via-orange-500/15 to-zinc-500/10",
    promptInjection: "set on top of a moving train, wind whipping past, daring stunt energy",
  },
];

// ── Avatars ──────────────────────────────────────────────────────
// (kept stable — already linked from upstream CDN, plenty of caching)

const AVATAR_CDN = "https://d3adwkbyhxyrtq.cloudfront.net/web-app";

export interface MarketingAvatar {
  id:        string;
  name:      string;
  thumbnail: string;
}

export const MARKETING_AVATARS: MarketingAvatar[] = [
  { id: "priya",  name: "Priya",  thumbnail: `${AVATAR_CDN}/Priya.webp`  },
  { id: "elena",  name: "Elena",  thumbnail: `${AVATAR_CDN}/Elena.webp`  },
  { id: "kai",    name: "Kai",    thumbnail: `${AVATAR_CDN}/Kai.webp`    },
  { id: "sora",   name: "Sora",   thumbnail: `${AVATAR_CDN}/Sora.webp`   },
  { id: "minji",  name: "Minji",  thumbnail: `${AVATAR_CDN}/Minji.webp`  },
  { id: "margot", name: "Margot", thumbnail: `${AVATAR_CDN}/Margot.webp` },
  { id: "niko",   name: "Niko",   thumbnail: `${AVATAR_CDN}/Niko.webp`   },
  { id: "jin",    name: "Jin",    thumbnail: `${AVATAR_CDN}/Jin.webp`    },
];

// ── Aspect / quality / duration ──────────────────────────────────

export const MARKETING_RATIOS = [
  { id: "9:16", label: "9:16 — عمودي" },
  { id: "3:4",  label: "3:4"           },
  { id: "1:1",  label: "1:1 — مربع"    },
  { id: "4:3",  label: "4:3"           },
  { id: "16:9", label: "16:9 — أفقي"   },
] as const;

export const MARKETING_RESOLUTIONS = [
  { id: "720p",  label: "720p — أرخص" },
  { id: "1080p", label: "1080p — أعلى جودة 🔥", recommended: true },
] as const;

export const MARKETING_DURATIONS = [4, 5, 6, 7, 8, 9, 10, 12, 15] as const;

export const MARKETING_DEVICE_FRAMES = [
  { id: "mobile",  label: "موبايل"  },
  { id: "desktop", label: "ديسكتوب" },
] as const;

export type MarketingDeviceFrame = typeof MARKETING_DEVICE_FRAMES[number]["id"];

export const MARKETING_DEFAULTS = {
  productFormatId: "ugc",       // first product format
  appFormatId:     "ugc-app",   // sole app format
  ratio:           "9:16" as string,
  resolution:      "1080p" as string,
  duration:        5,
  deviceFrame:     "mobile" as MarketingDeviceFrame,
};

// ── Endpoint resolution ──────────────────────────────────────────

/** Pick the muapi endpoint based on the requested resolution. */
export function resolveMarketingEndpoint(resolution: string): string {
  return resolution === "1080p"
    ? "sd-2-vip-omni-reference-1080p"
    : "seedance-2-vip-omni-reference";
}

// ── Cost ─────────────────────────────────────────────────────────
//
// Refit to match Higgsfield's reference (~90 cr at 5s/1080p Product,
// ~100 cr at 5s/1080p App). See research doc § 4.7.

export function computeMarketingCost(opts: {
  duration:   number;
  resolution: string;
  variant:    MarketingVariant;
}): number {
  const base       = opts.resolution === "1080p" ? 18 : 8;
  const variantMul = opts.variant    === "app"   ? 1.10 : 1;
  return Math.ceil(opts.duration * base * variantMul);
}

// ── Prompt composition ──────────────────────────────────────────
//
// Builds the final prompt sent to the omni-reference model from the user's
// freeform text plus selected presets. Order matters — the model gives more
// weight to the first sentences.

export function composeMarketingPrompt(opts: {
  userPrompt:     string;
  format:         MarketingFormat | undefined;
  hook?:          MarketingHook | undefined;
  setting?:       MarketingSetting | undefined;
  deviceFrame?:   MarketingDeviceFrame;
  variant:        MarketingVariant;
}): string {
  const parts: string[] = [];

  const trimmedUser = opts.userPrompt.trim();
  if (trimmedUser) parts.push(trimmedUser);

  if (opts.hook?.promptInjection) {
    parts.push(`Hook: ${opts.hook.promptInjection}.`);
  }

  if (opts.setting?.promptInjection) {
    parts.push(`Setting: ${opts.setting.promptInjection}.`);
  }

  if (opts.format?.promptInjection) {
    parts.push(`${opts.format.promptInjection}.`);
  }

  if (opts.variant === "app" && opts.deviceFrame) {
    parts.push(
      opts.deviceFrame === "mobile"
        ? "App rendered inside a modern smartphone device frame."
        : "App rendered inside a modern laptop / desktop monitor frame.",
    );
  }

  return parts.filter(Boolean).join(" ");
}

// ── Helpers ──────────────────────────────────────────────────────

export function getFormatsForVariant(variant: MarketingVariant): MarketingFormat[] {
  return MARKETING_FORMATS.filter((f) => f.variant === variant);
}

export function getDefaultFormatId(variant: MarketingVariant): string {
  return variant === "app"
    ? MARKETING_DEFAULTS.appFormatId
    : MARKETING_DEFAULTS.productFormatId;
}
