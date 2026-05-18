// ════════════════════════════════════════════════════════════════
// Marketing Studio — formats, hooks, settings, avatars
// ════════════════════════════════════════════════════════════════
//
// Mirrors the reference platform's `/marketing-studio/product` and `/marketing-studio/app`
// catalogs. All MP4 previews are mirrored to /public/marketing/ so we don't
// depend on the reference platform's CDN. See docs/MARKETING_STUDIO_RESEARCH.md.
//
// Slugs match the reference platform's preset slugs verbatim — that's the canonical id we
// pass to MuAPI's `video_files: [...]` field.

// ── Formats ──────────────────────────────────────────────────────

export type MarketingVariant = "product" | "app";

export interface MarketingFormat {
  id:          string;             // the reference slug (e.g. "ugc_how_to")
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

  // — App variant — currently only UGC is offered on the reference
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
// scroll. the reference groups them into "Stunt" (loud/dramatic) and "Subtle"
// (talking-head etc).
//
// Categories verified by clicking each tab inside the reference platform's hook modal:
//   stunt:  Product Hit, Random Object Mic, Blizzard, Product Dodge
//   subtle: Spicy, Interview, Product Crash, Camera Bump, Epic Fail
//
// Video previews mirrored from
//   the upstream marketing_studio_setup CDN
// to /public/marketing/hooks/.

const HOOK = "/marketing/hooks";

export type MarketingHookCategory = "stunt" | "subtle";

export interface MarketingHook {
  id:              string;
  name:            string;             // Arabic display
  englishName:     string;
  category:        MarketingHookCategory;
  desc:            string;             // short Arabic
  englishDesc:     string;             // original the reference blurb
  promptInjection: string;             // appended to user prompt
  videoUrl:        string;             // local-mirrored preview
}

export const MARKETING_HOOKS: MarketingHook[] = [
  {
    id:              "product_hit",
    name:            "ضربة المنتج",
    englishName:     "Product Hit",
    category:        "stunt",
    desc:            "المنتج يقتحم اللقطة بقوة ويقابله رد فعل سريع",
    englishDesc:     "Object flies into frame, hits subject. Brief reaction → pivot to product.",
    videoUrl:        `${HOOK}/product_hit.mp4`,
    promptInjection: "open with an object flying into frame and hitting the subject; brief reaction, then pivot to the product",
  },
  {
    id:              "spicy",
    name:            "جريء",
    englishName:     "Spicy",
    category:        "subtle",
    desc:            "كلوز-أب جذّاب ثم سيلفي قبل وقفة قصيرة وعرض المنتج",
    englishDesc:     "Extreme close-up tilts up to reveal a flawless makeup look, then pulls back into selfie framing before a silent pause leads into the product pitch.",
    videoUrl:        `${HOOK}/spicy.mp4`,
    promptInjection: "open with an extreme close-up on a stylish detail, slowly tilt up to a flawless look, then pull back to selfie framing — silent pause, then the product",
  },
  {
    id:              "interview",
    name:            "مقابلة",
    englishName:     "Interview",
    category:        "subtle",
    desc:            "مقابلة شارع مع غريب يلاحظ المنتج ويعرضه بأسلوب طبيعي",
    englishDesc:     "Interviewer asks a stranger a question; confusion builds until they notice the product and pivot into a casual review.",
    videoUrl:        `${HOOK}/interview.mp4`,
    promptInjection: "street-style interview format, presenter asks a stranger a question; the stranger naturally notices the product and pivots into a casual review",
  },
  {
    id:              "random_object_mic",
    name:            "ميكروفون عشوائي",
    englishName:     "Random Object Mic",
    category:        "stunt",
    desc:            "غرض عشوائي يقع في يد الشخص ويستخدمه كميكروفون لمراجعة جدّية",
    englishDesc:     "A random absurd object falls into the person's hand from above and they immediately use it as a microphone to continue a serious product review.",
    videoUrl:        `${HOOK}/random_object_mic.mp4`,
    promptInjection: "absurd everyday object drops into the talent's hand from above; they use it as a microphone to deliver a deadpan, serious product review",
  },
  {
    id:              "product_crash",
    name:            "تحطّم المنتج",
    englishName:     "Product Crash",
    category:        "subtle",
    desc:            "المنتج يسقط ويسبب فوضى ثم تنتقل اللقطة لمشهد نظيف للمراجعة",
    englishDesc:     "The product falls from above and creates chaos; harsh sharpness leads to a perfectly clean restored scene where someone calmly begins reviewing.",
    videoUrl:        `${HOOK}/product_crash.mp4`,
    promptInjection: "the product itself falls from above and creates chaos; cut to a perfectly clean restored scene, presenter calmly reviewing",
  },
  {
    id:              "blizzard",
    name:            "عاصفة ثلجية",
    englishName:     "Blizzard",
    category:        "stunt",
    desc:            "غرفة هادئة تضربها عاصفة ثلجية مفاجئة والمنتج يبقى يعمل",
    englishDesc:     "A cozy indoor scene is suddenly hit by a violent, impossible blizzard; chaos fills the room but the product remains intact and functioning.",
    videoUrl:        `${HOOK}/blizzard.mp4`,
    promptInjection: "cozy indoor scene struck by an impossible indoor blizzard, snow and wind everywhere — but the product stays intact and working through it",
  },
  {
    id:              "camera_bump",
    name:            "ارتجاج الكاميرا",
    englishName:     "Camera Bump",
    category:        "subtle",
    desc:            "الكاميرا تصطدم بالشخص فيتعافى ويكشف عن المنتج بأسلوب عفوي",
    englishDesc:     "The camera operator accidentally bumps into a person; they recover and naturally reveal the product while transitioning into a casual explanation.",
    videoUrl:        `${HOOK}/camera_bump.mp4`,
    promptInjection: "camera accidentally bumps into the talent; they recover, then naturally reveal the product and transition into a casual explanation",
  },
  {
    id:              "product_dodge",
    name:            "مراوغة المنتج",
    englishName:     "Product Dodge",
    category:        "stunt",
    desc:            "شخص يتفادى المنتج الطائر ثم يظهر يحمله ويراجعه بهدوء",
    englishDesc:     "A product flies into a person's face, they bend down to dodge it, then stand up holding the product and begin reviewing as if nothing happened.",
    videoUrl:        `${HOOK}/product_dodge.mp4`,
    promptInjection: "a product flies toward the talent's face; they dodge in slow-motion, then in the next frame stand up holding the product and review as if nothing happened",
  },
  {
    id:              "epic_fail",
    name:            "فشل ملحمي",
    englishName:     "Epic Fail",
    category:        "subtle",
    desc:            "محاولة فاشلة لخدعة بهلوانية ثم مراجعة هادئة وكأن شيئاً لم يحدث",
    englishDesc:     "A person performs an unsuccessful backflip, lands badly, and immediately takes out the product to deliver an unflappable review.",
    videoUrl:        `${HOOK}/epic_fail.mp4`,
    promptInjection: "talent attempts an ambitious physical stunt and fails badly; without missing a beat they pull out the product and deliver a calm, unflappable review",
  },
];

// ── Settings ─────────────────────────────────────────────────────
//
// Categories verified by clicking each tab inside the reference platform's setting modal:
//   realistic:    Bedroom, Nature, Gym, Bathroom, Kitchen, In Car, Street, Office
//   unrealistic:  Airplane Wing, Roofing, Volcano Rim, Tiny Reviewer, Car Roof, Train Surf

const SET = "/marketing/settings";

export type MarketingSettingCategory = "realistic" | "unrealistic";

export interface MarketingSetting {
  id:              string;
  name:            string;
  englishName:     string;
  category:        MarketingSettingCategory;
  desc:            string;
  englishDesc:     string;
  promptInjection: string;
  videoUrl:        string;
}

export const MARKETING_SETTINGS: MarketingSetting[] = [
  {
    id:              "bedroom",
    name:            "غرفة نوم",
    englishName:     "Bedroom",
    category:        "realistic",
    desc:            "إضاءة نافذة ناعمة وأجواء استرخاء صباحية أو مسائية",
    englishDesc:     "On bed or propped against pillows, soft window light. Unmade bed, cozy textures. Relaxed morning or evening wind-down vibe.",
    videoUrl:        `${SET}/bedroom.mp4`,
    promptInjection: "set in a softly-lit bedroom, soft window light, cozy textures, relaxed morning/evening wind-down vibe",
  },
  {
    id:              "airplane_wing",
    name:            "جناح طائرة",
    englishName:     "Airplane Wing",
    category:        "unrealistic",
    desc:            "شخص جالس على جناح طائرة في الجو ويراجع المنتج بهدوء",
    englishDesc:     "Person sits on airplane wing mid-flight at altitude. Casual product review — powerful wind, clouds, engine roar.",
    videoUrl:        `${SET}/airplane_wing.mp4`,
    promptInjection: "talent sits on the wing of an airplane mid-flight, clouds far below, wind whipping past, casually reviewing the product",
  },
  {
    id:              "nature",
    name:            "طبيعة",
    englishName:     "Nature",
    category:        "realistic",
    desc:            "خارجي بين شجر أو شاطئ أو حديقة — ضوء طبيعي ومساحة مفتوحة",
    englishDesc:     "Outdoors — trail, park, beach, or garden. Natural light, greenery or open sky. Active or peaceful mood.",
    videoUrl:        `${SET}/nature.mp4`,
    promptInjection: "set outdoors on a trail or park or beach, natural daylight, greenery and open sky",
  },
  {
    id:              "roofing",
    name:            "سطح ناطحة سحاب",
    englishName:     "Roofing",
    category:        "unrealistic",
    desc:            "حافة سطح ناطحة سحاب وخلفية أفق المدينة وقت الذروة",
    englishDesc:     "Person on the edge of a skyscraper rooftop, city skyline behind, wind moving through hair, sun catching the buildings.",
    videoUrl:        `${SET}/roofing.mp4`,
    promptInjection: "set on the edge of a skyscraper rooftop, full city skyline behind, wind in hair, sun catching the buildings",
  },
  {
    id:              "gym",
    name:            "صالة رياضية",
    englishName:     "Gym",
    category:        "realistic",
    desc:            "أرضية صالة أو مقعد بعد تمرين — طاقة وجهد",
    englishDesc:     "Gym floor, locker room, or post-workout bench. Bright overhead lighting. Sweaty / freshly finished energy.",
    videoUrl:        `${SET}/gym.mp4`,
    promptInjection: "set on a gym floor or post-workout bench, bright overhead lighting, equipment in background, athletic energy",
  },
  {
    id:              "volcano_rim",
    name:            "حافة بركان",
    englishName:     "Volcano Rim",
    category:        "unrealistic",
    desc:            "حافة بركان نشط وحممه تحت — مراجعة هادئة بدون أي رد فعل",
    englishDesc:     "Person sits on active volcano rim, lava below. Casual product review — lava bubbles, smoke drifts through, zero reaction.",
    videoUrl:        `${SET}/volcano_rim.mp4`,
    promptInjection: "talent sits on the rim of an active volcano with lava bubbling below, casually reviewing — completely calm reaction",
  },
  {
    id:              "bathroom",
    name:            "حمام",
    englishName:     "Bathroom",
    category:        "realistic",
    desc:            "سيلفي مرآة في الحمام مع إضاءة فينيتي — أجواء روتين شخصي",
    englishDesc:     "Mirror selfie or front camera in bathroom. Ring light or vanity lighting, tiles visible. Intimate getting-ready energy.",
    videoUrl:        `${SET}/bathroom.mp4`,
    promptInjection: "mirror selfie in a bathroom, vanity / ring lighting, tiles visible, intimate getting-ready energy",
  },
  {
    id:              "tiny_reviewer",
    name:            "المراجع المصغّر",
    englishName:     "Tiny Reviewer",
    category:        "unrealistic",
    desc:            "الشخص بحجم 15 سم بجانب المنتج بحجمه الكامل — مراجعة سيلفي بمقياس مستحيل",
    englishDesc:     "Person shrunk to 15cm next to a product their full height. Normal selfie review at impossible scale — leans on it.",
    videoUrl:        `${SET}/tiny_reviewer.mp4`,
    promptInjection: "talent shrunk to 15cm next to the full-size product, leans on it, normal selfie review at impossible scale",
  },
  {
    id:              "kitchen",
    name:            "مطبخ",
    englishName:     "Kitchen",
    category:        "realistic",
    desc:            "كاونتر مطبخ بضوء نهاري طبيعي وفنجان قهوة في الخلفية",
    englishDesc:     "Standing at counter or leaning on island, natural daylight. Clean surface, mug or fruit in background. Casual mid-day energy.",
    videoUrl:        `${SET}/kitchen.mp4`,
    promptInjection: "set at a kitchen counter or island, natural daylight through a window, mug / fruit in the background, casual mid-day energy",
  },
  {
    id:              "car_roof",
    name:            "سقف سيارة",
    englishName:     "Car Roof",
    category:        "unrealistic",
    desc:            "فوق سقف سيارة متحركة في طريق صحراوي — مراجعة بينما الطريق يتمايل",
    englishDesc:     "Person on roof of moving car, desert highway, golden hour. Product review while swaying with the road. Semi truck passes — no flinch.",
    videoUrl:        `${SET}/car_roof.mp4`,
    promptInjection: "talent on the roof of a moving car, desert highway, golden hour, swaying with the road, deadpan review",
  },
  {
    id:              "in_car",
    name:            "داخل سيارة",
    englishName:     "In Car",
    category:        "realistic",
    desc:            "سيلفي من مقعد السائق أو الراكب وضوء النافذة على الوجه",
    englishDesc:     "Selfie from passenger or driver seat, parked or cruising. Window light on face. Casual tone — talking to camera between errands.",
    videoUrl:        `${SET}/in_car.mp4`,
    promptInjection: "selfie from a car seat, parked or cruising, window light on face, casual between-errands tone",
  },
  {
    id:              "street",
    name:            "شارع",
    englishName:     "Street",
    category:        "realistic",
    desc:            "ماشي على شارع المدينة بسيلفي — متاجر وحركة في الخلفية",
    englishDesc:     "Walking on sidewalk or standing on urban street, handheld selfie. City backdrop — storefronts, traffic, pedestrians.",
    videoUrl:        `${SET}/street.mp4`,
    promptInjection: "handheld selfie walking on a city street, storefronts and pedestrians in background, energetic pace, talking while moving",
  },
  {
    id:              "office",
    name:            "مكتب",
    englishName:     "Office",
    category:        "realistic",
    desc:            "مكتب عصري ولاب توب وقهوة — لحظة سريعة بين المهام",
    englishDesc:     "Desk setup, laptop open, coffee nearby. Clean modern space, soft overhead or monitor glow. Hushed mid-workday tone.",
    videoUrl:        `${SET}/office.mp4`,
    promptInjection: "set at a modern desk with laptop open and coffee nearby, soft overhead lighting, hushed mid-workday tone",
  },
  {
    id:              "train_surf",
    name:            "ركوب القطار",
    englishName:     "Train Surf",
    category:        "unrealistic",
    desc:            "متعلق خارج قطار متحرك ويراجع المنتج بينما الرياح تضربه",
    englishDesc:     "Person hangs outside a moving train, filming selfie. Reviews product — wind pressing on them is the live demo.",
    videoUrl:        `${SET}/train_surf.mp4`,
    promptInjection: "talent hangs off the side of a moving train filming a selfie, wind pressing against them, reviewing the product",
  },
];

// ── Avatars ──────────────────────────────────────────────────────
// 38 preset avatars (22 female + 16 male) mirror the reference platform's
// preset roster 1:1. The original 8 names that we already had thumbnail
// URLs for (Priya, Elena, Kai, Sora, Minji, Margot, Niko, Jin) keep
// their CloudFront thumbnails. The other 30 names list with empty
// thumbnails — the picker shows a text-initial fallback. Real images
// can be dropped in later as a dedicated polish pass.

const AVATAR_CDN = "https://d3adwkbyhxyrtq.cloudfront.net/web-app";

export type MarketingAvatarGender = "female" | "male";

export interface MarketingAvatar {
  id:        string;
  name:      string;
  gender:    MarketingAvatarGender;
  thumbnail: string;     // empty string → picker renders initial fallback
}

// Higgsfield identity portraits — proxied through /api/cdn/s/. We
// reuse these for any of our named avatars that don't yet have a
// dedicated portrait on the CloudFront CDN. Each name is mapped to
// the closest identity bucket by name etymology so the picker shows
// a visually diverse grid without burning gen-credits.
const HF_ID = (path: string) => `/api/cdn/s/cast/${path}.webp`;

export const MARKETING_AVATARS: MarketingAvatar[] = [
  // ── Female (22) ─────────────────────────────────────────────────
  { id: "mei",       name: "Mei",       gender: "female", thumbnail: HF_ID("female-identity/asian")    },
  { id: "yuna",      name: "Yuna",      gender: "female", thumbnail: HF_ID("female-identity/asian")    },
  { id: "adriana",   name: "Adriana",   gender: "female", thumbnail: HF_ID("female-identity/european") },
  { id: "clara",     name: "Clara",     gender: "female", thumbnail: HF_ID("female-identity/european") },
  { id: "maria",     name: "Maria",     gender: "female", thumbnail: HF_ID("female-identity/latina")   },
  { id: "sofia",     name: "Sofia",     gender: "female", thumbnail: HF_ID("female-identity/mixed")    },
  { id: "valentina", name: "Valentina", gender: "female", thumbnail: HF_ID("female-identity/latina")   },
  { id: "jia",       name: "Jia",       gender: "female", thumbnail: HF_ID("female-identity/asian")    },
  { id: "lily",      name: "Lily",      gender: "female", thumbnail: HF_ID("female-identity/mixed")    },
  { id: "nia",       name: "Nia",       gender: "female", thumbnail: HF_ID("female-identity/black")    },
  { id: "hana",      name: "Hana",      gender: "female", thumbnail: HF_ID("female-identity/asian")    },
  { id: "priya",     name: "Priya",     gender: "female", thumbnail: `${AVATAR_CDN}/Priya.webp`  },
  { id: "elena",     name: "Elena",     gender: "female", thumbnail: `${AVATAR_CDN}/Elena.webp`  },
  { id: "sora",      name: "Sora",      gender: "female", thumbnail: `${AVATAR_CDN}/Sora.webp`   },
  { id: "minji",     name: "Minji",     gender: "female", thumbnail: `${AVATAR_CDN}/Minji.webp`  },
  { id: "margot",    name: "Margot",    gender: "female", thumbnail: `${AVATAR_CDN}/Margot.webp` },
  // The next 6 already exist on our existing CloudFront mirror —
  // probed by HEAD before wiring.
  { id: "yuki",      name: "Yuki",      gender: "female", thumbnail: `${AVATAR_CDN}/Yuki.webp`    },
  { id: "zara",      name: "Zara",      gender: "female", thumbnail: `${AVATAR_CDN}/Zara.webp`    },
  { id: "naomi",     name: "Naomi",     gender: "female", thumbnail: `${AVATAR_CDN}/Naomi.webp`   },
  { id: "megan",     name: "Megan",     gender: "female", thumbnail: `${AVATAR_CDN}/Megan.webp`   },
  { id: "miso",      name: "Miso",      gender: "female", thumbnail: `${AVATAR_CDN}/Miso.webp`    },
  { id: "scarlett",  name: "Scarlett",  gender: "female", thumbnail: `${AVATAR_CDN}/Scarlett.webp`},

  // ── Male (16) ───────────────────────────────────────────────────
  { id: "jayden",    name: "Jayden",    gender: "male",   thumbnail: HF_ID("male-identity/black")    },
  { id: "stefan",    name: "Stefan",    gender: "male",   thumbnail: HF_ID("male-identity/european") },
  { id: "tae",       name: "Tae",       gender: "male",   thumbnail: HF_ID("male-identity/asian")    },
  { id: "felix",     name: "Felix",     gender: "male",   thumbnail: HF_ID("male-identity/european") },
  { id: "malik",     name: "Malik",     gender: "male",   thumbnail: HF_ID("male-identity/black")    },
  { id: "liam",      name: "Liam",      gender: "male",   thumbnail: HF_ID("male-identity/european") },
  { id: "joon",      name: "Joon",      gender: "male",   thumbnail: HF_ID("male-identity/asian")    },
  { id: "erik",      name: "Erik",      gender: "male",   thumbnail: HF_ID("male-identity/european") },
  { id: "ryu",       name: "Ryu",       gender: "male",   thumbnail: HF_ID("male-identity/asian")    },
  { id: "kai",       name: "Kai",       gender: "male",   thumbnail: `${AVATAR_CDN}/Kai.webp`    },
  { id: "niko",      name: "Niko",      gender: "male",   thumbnail: `${AVATAR_CDN}/Niko.webp`   },
  { id: "jin",       name: "Jin",       gender: "male",   thumbnail: `${AVATAR_CDN}/Jin.webp`    },
  // The next 4 already exist on our existing CloudFront mirror.
  { id: "marco",     name: "Marco",     gender: "male",   thumbnail: `${AVATAR_CDN}/Marco.webp`  },
  { id: "ren",       name: "Ren",       gender: "male",   thumbnail: `${AVATAR_CDN}/Ren.webp`    },
  { id: "lucas",     name: "Lucas",     gender: "male",   thumbnail: `${AVATAR_CDN}/Lucas.webp`  },
  { id: "omar",      name: "Omar",      gender: "male",   thumbnail: `${AVATAR_CDN}/Omar.webp`   },
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

// ── Mode whitelist ───────────────────────────────────────────────
// Hooks and Settings are NOT valid for every format. The reference
// platform restricts them to the UGC family + product_review only —
// passing hook_id or setting_id with other modes returns
// "Unknown params: hook_id". We mirror that constraint client-side
// so the picker chips become disabled instead of silently being
// dropped server-side.

const HOOK_SETTING_ALLOWED_FORMATS = new Set<string>([
  "ugc",
  "ugc_how_to",
  "ugc_unboxing",
  "product_review",
  "ugc_virtual_try_on",
  "ugc-app",                // App variant's UGC mode also allows hooks
]);

/** True when the chosen format supports hook/setting injection. */
export function formatSupportsHookAndSetting(formatId: string | undefined): boolean {
  if (!formatId) return false;
  return HOOK_SETTING_ALLOWED_FORMATS.has(formatId);
}

// ── Endpoint resolution ──────────────────────────────────────────

/** Pick the muapi endpoint for the marketing-style ad generation.
 *
 *  IMPORTANT: the previous values (`seedance-2-vip-omni-reference`,
 *  `sd-2-vip-omni-reference-1080p`) are NOT real MuAPI endpoints —
 *  every submission since launch 404'd silently. The proprietary
 *  Higgsfield marketing_studio_video engine isn't in MuAPI either.
 *
 *  Closest functional match: Seedance Pro I2V (same family Higgsfield
 *  uses internally for marketing). It accepts prompt + image_url +
 *  resolution + duration + camera_fixed. We pass the first reference
 *  image (avatar or product hero) as the seed; the per-model param
 *  filter drops anything the model doesn't accept.
 */
export function resolveMarketingEndpoint(_resolution: string): string {
  return "seedance-pro-i2v";
}

// ── Cost ─────────────────────────────────────────────────────────
//
// Refit to match the reference platform's reference (~90 cr at 5s/1080p Product,
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
