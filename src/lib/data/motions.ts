// ════════════════════════════════════════════════════════════════
// Motion Catalog — named motion presets for motion-transfer
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's 6 motion-provider families. Each
// preset is a named motion (e.g. "Walk Confidently", "Boxing Strike",
// "Dance Y2K") that the user can pick instead of uploading their own
// motion reference video.
//
// Each entry is associated with one or more underlying MuAPI motion
// endpoints — when a preset is picked, the tool resolves its preview
// URL into `video_url` on the request payload and locks the model to
// the matching family.
//
// Thumbnails and previews live behind the same /api/cdn proxy so all
// network calls stay on our domain.

export interface MotionPreset {
  id:              string;
  name:            string;
  /** Arabic label shown above the English name in the picker. */
  nameAr:          string;
  family:          MotionFamily;
  /** First-frame thumbnail for the picker. */
  thumbnail:       string;
  /** Looping preview video shown on hover. */
  preview:         string;
  /** MuAPI motion endpoints this preset is compatible with. The
   *  executor picks one based on what the user wants for output
   *  quality / cost. */
  supportedModels: string[];
  /** Typical motion duration (seconds). */
  duration:        number;
  /** Search / filter tags. */
  tags:            string[];
}

export type MotionFamily =
  | "yilow"     // Our own preset library (renamed from the reference
                // platform's namesake family to avoid brand bleed-through)
  | "minimax"
  | "seedance"
  | "wan"
  | "veo"
  | "kling";

export const MOTION_FAMILIES: Array<{
  id:      MotionFamily;
  label:   string;
  labelAr: string;
  desc:    string;
}> = [
  { id: "yilow",    label: "Yilow Originals", labelAr: "أصلية",      desc: "مجموعة Yilow الخاصة" },
  { id: "kling",    label: "Kling Motion",    labelAr: "Kling",      desc: "أفضل دقة وحركة" },
  { id: "minimax",  label: "Minimax Motion",  labelAr: "Minimax",    desc: "سريع وذكي" },
  { id: "seedance", label: "Seedance",        labelAr: "Seedance",   desc: "حركات رقص متخصصة" },
  { id: "wan",      label: "Wan 2.2",         labelAr: "Wan 2.2",    desc: "متعدد الأنماط" },
  { id: "veo",      label: "Veo 3.1",         labelAr: "Veo",        desc: "Google جودة سينمائية" },
];

/** Concrete endpoint slugs in MuAPI for each family. The executor
 *  passes the user's chosen quality + family through this map. */
export const FAMILY_ENDPOINTS: Record<MotionFamily, string[]> = {
  yilow:    ["kling-v3.0-pro-motion-control", "kling-v3.0-std-motion-control"],
  kling:    ["kling-v3.0-pro-motion-control", "kling-v3.0-std-motion-control", "kling-v2.6-std-motion-control"],
  minimax:  ["minimax-motion-control"],
  seedance: ["seedance-motion-control"],
  wan:      ["wan2.2-motion-control"],
  veo:      ["veo3.1-motion-control"],
};

/** Helper used by the picker UI + executor. */
export function getMotionPresetById(id: string): MotionPreset | undefined {
  return MOTION_CATALOG.find((m) => m.id === id);
}

/** Build a thumbnail URL on our CDN proxy. The reference path comes
 *  from the same `application_main` folder used for viral-effect
 *  thumbnails — see /api/cdn/[host]/[...path]/route.ts. */
function thumb(slug: string): string {
  return `/api/cdn/c/motion_presets/${slug}.jpg`;
}
function preview(slug: string): string {
  return `/api/cdn/c/motion_presets/${slug}.mp4`;
}

// ── Yilow Originals — 18 ──────────────────────────────────────────
const YILOW: MotionPreset[] = [
  ["walk-confident",      "Walk Confidently",      "مشية واثقة",        4, ["walk", "confident"]],
  ["walk-runway",         "Runway Walk",           "مشية الكاتووك",      4, ["walk", "runway", "fashion"]],
  ["dance-y2k",           "Dance Y2K",             "رقصة Y2K",          5, ["dance", "y2k", "tiktok"]],
  ["dance-tiktok-viral",  "TikTok Viral Dance",    "رقصة فيرال",        5, ["dance", "tiktok"]],
  ["dance-hip-hop",       "Hip-Hop Dance",         "رقصة هيب هوب",      6, ["dance", "hip-hop"]],
  ["dance-belly",         "Belly Dance",           "رقصة شرقية",        5, ["dance", "belly"]],
  ["boxing-strike",       "Boxing Strike",         "لكمة ملاكمة",        3, ["boxing", "action"]],
  ["mma-kick",            "MMA Kick",              "ركلة MMA",          3, ["mma", "action"]],
  ["jump-spin",           "Jump & Spin",           "قفزة دوران",         3, ["jump", "spin"]],
  ["pose-fashion-1",      "Fashion Pose 1",        "بوز فاشن ١",         2, ["pose", "fashion"]],
  ["pose-fashion-2",      "Fashion Pose 2",        "بوز فاشن ٢",         2, ["pose", "fashion"]],
  ["pose-fashion-3",      "Fashion Pose 3",        "بوز فاشن ٣",         2, ["pose", "fashion"]],
  ["wave-greeting",       "Wave Hello",            "موجة سلام",          3, ["wave", "greeting"]],
  ["thumbs-up",           "Thumbs Up",             "إبهام أعلى",         2, ["thumbs", "approval"]],
  ["clap",                "Clap",                  "تصفيق",             2, ["clap", "applause"]],
  ["heart-hands",         "Heart Hands",           "قلب بيدين",          3, ["heart", "love"]],
  ["pray",                "Pray",                  "دعاء",              3, ["pray", "religious"]],
  ["yoga-pose",           "Yoga Pose",             "وضعية يوغا",         4, ["yoga", "wellness"]],
].map(([id, name, nameAr, duration, tags]) => ({
  id:              id as string,
  name:            name as string,
  nameAr:          nameAr as string,
  family:          "yilow",
  thumbnail:       thumb(id as string),
  preview:         preview(id as string),
  supportedModels: FAMILY_ENDPOINTS.yilow,
  duration:        duration as number,
  tags:            tags as string[],
}));

// ── Kling family — 35 ─────────────────────────────────────────────
const KLING: MotionPreset[] = [
  ["kling-walk-cinematic", "Cinematic Walk",        "مشية سينمائية",      5, ["walk", "cinematic"]],
  ["kling-walk-slowmo",    "Slow-Mo Walk",          "مشية slowmotion",   6, ["walk", "slow-mo"]],
  ["kling-run-action",     "Action Run",            "جري حركي",          4, ["run", "action"]],
  ["kling-sit-down",       "Sit Down",              "جلوس",              4, ["sit", "everyday"]],
  ["kling-stand-up",       "Stand Up",              "وقوف",              3, ["stand", "everyday"]],
  ["kling-turn-around",    "Turn Around",           "دوران ١٨٠",         3, ["turn", "reveal"]],
  ["kling-look-up",        "Look Up",               "نظرة فوق",          2, ["look", "expression"]],
  ["kling-look-back",      "Look Back",             "نظرة خلف",          2, ["look", "expression"]],
  ["kling-laugh",          "Laugh",                 "ضحكة",              3, ["laugh", "emotion"]],
  ["kling-cry",            "Cry",                   "بكاء",              4, ["cry", "emotion"]],
  ["kling-shock",          "Shock",                 "صدمة",              2, ["shock", "emotion"]],
  ["kling-think",          "Think",                 "تفكير",             3, ["think", "expression"]],
  ["kling-yawn",           "Yawn",                  "تثاؤب",             3, ["yawn", "casual"]],
  ["kling-sip-coffee",     "Sip Coffee",            "رشفة قهوة",         4, ["coffee", "lifestyle"]],
  ["kling-type-laptop",    "Type on Laptop",        "كتابة لابتوب",       5, ["work", "lifestyle"]],
  ["kling-read-book",      "Read Book",             "قراءة كتاب",        5, ["read", "lifestyle"]],
  ["kling-phone-scroll",   "Scroll Phone",          "تصفح موبايل",       4, ["phone", "lifestyle"]],
  ["kling-selfie",         "Take Selfie",           "سيلفي",             3, ["selfie", "phone"]],
  ["kling-drive-car",      "Drive Car",             "قيادة سيارة",       5, ["drive", "car"]],
  ["kling-cook-stir",      "Cook & Stir",           "طبخ تحريك",         5, ["cook", "kitchen"]],
  ["kling-eat-bite",       "Eat Bite",              "أكل لقمة",          3, ["eat", "food"]],
  ["kling-drink",          "Drink",                 "شرب",               3, ["drink", "lifestyle"]],
  ["kling-applaud-cheer",  "Cheer & Applaud",       "تشجيع تصفيق",       4, ["cheer", "celebration"]],
  ["kling-hi-five",        "Hi-Five",               "هاي فايف",          2, ["greeting", "fun"]],
  ["kling-hug",            "Hug",                   "حضن",               4, ["hug", "emotion"]],
  ["kling-shake-hand",     "Shake Hand",            "مصافحة",            3, ["greeting", "business"]],
  ["kling-bow",            "Bow",                   "انحناءة",           3, ["bow", "respect"]],
  ["kling-flying-kiss",    "Flying Kiss",           "بوسة طائرة",        3, ["kiss", "emotion"]],
  ["kling-point-camera",   "Point at Camera",       "إشارة للكاميرا",     2, ["point", "interactive"]],
  ["kling-arm-cross",      "Cross Arms",            "تشبيك ذراعين",      2, ["pose", "attitude"]],
  ["kling-hands-on-hips",  "Hands on Hips",         "إيدين على الورك",    2, ["pose", "confident"]],
  ["kling-stretch",        "Stretch",               "تمدد",              4, ["stretch", "wellness"]],
  ["kling-jump-celebrate", "Jump Celebrate",        "قفزة احتفال",        3, ["jump", "celebration"]],
  ["kling-fall",           "Fall",                  "وقعة",              3, ["fall", "action"]],
  ["kling-fly-superhero",  "Fly Superhero",         "طيران سوبر هيرو",    5, ["fly", "action"]],
].map(([id, name, nameAr, duration, tags]) => ({
  id:              id as string,
  name:            name as string,
  nameAr:          nameAr as string,
  family:          "kling",
  thumbnail:       thumb(id as string),
  preview:         preview(id as string),
  supportedModels: FAMILY_ENDPOINTS.kling,
  duration:        duration as number,
  tags:            tags as string[],
}));

// ── Minimax — 22 ──────────────────────────────────────────────────
const MINIMAX: MotionPreset[] = [
  ["minimax-walk-side",    "Side Profile Walk",     "مشية جانبية",       4, ["walk", "side"]],
  ["minimax-walk-toward",  "Walk Toward Camera",    "مشية نحو الكاميرا",  4, ["walk", "approach"]],
  ["minimax-walk-away",    "Walk Away",             "مشية بعيدة",        4, ["walk", "leave"]],
  ["minimax-dance-pop",    "Pop Dance",             "رقصة بوب",          5, ["dance", "pop"]],
  ["minimax-dance-latin",  "Latin Dance",           "رقصة لاتينية",      5, ["dance", "latin"]],
  ["minimax-spin-360",     "Full 360 Spin",         "دوران كامل",        4, ["spin", "reveal"]],
  ["minimax-bow-deep",     "Deep Bow",              "انحناء عميق",       3, ["bow", "formal"]],
  ["minimax-salute",       "Salute",                "تحية عسكرية",       2, ["salute", "respect"]],
  ["minimax-shrug",        "Shrug",                 "هز كتفين",          2, ["shrug", "casual"]],
  ["minimax-nod-yes",      "Nod Yes",               "إيماءة موافقة",     2, ["nod", "expression"]],
  ["minimax-shake-no",     "Shake No",              "هز رفض",            2, ["shake", "expression"]],
  ["minimax-arms-up",      "Arms Up Victory",       "ذراعين فوق نصر",    3, ["victory", "celebration"]],
  ["minimax-pose-model",   "Model Pose",            "بوز موديل",         3, ["pose", "fashion"]],
  ["minimax-pose-thinker", "Thinker Pose",          "بوز التفكير",       3, ["pose", "thinker"]],
  ["minimax-wink",         "Wink",                  "غمزة",              2, ["wink", "flirt"]],
  ["minimax-smile",        "Smile",                 "ابتسامة",           2, ["smile", "expression"]],
  ["minimax-frown",        "Frown",                 "تجهم",              2, ["frown", "expression"]],
  ["minimax-cover-mouth",  "Cover Mouth Surprise",  "كشف فم مفاجأة",     2, ["surprise", "emotion"]],
  ["minimax-facepalm",     "Facepalm",              "تغطية وش",          2, ["facepalm", "meme"]],
  ["minimax-rock-out",     "Rock Out",              "روك أوت",           3, ["rock", "music"]],
  ["minimax-strike-pose",  "Strike a Pose",         "بوز سريع",          2, ["pose", "fashion"]],
  ["minimax-cheers",       "Cheers Toast",          "نخب",               3, ["cheers", "celebration"]],
].map(([id, name, nameAr, duration, tags]) => ({
  id:              id as string,
  name:            name as string,
  nameAr:          nameAr as string,
  family:          "minimax",
  thumbnail:       thumb(id as string),
  preview:         preview(id as string),
  supportedModels: FAMILY_ENDPOINTS.minimax,
  duration:        duration as number,
  tags:            tags as string[],
}));

// ── Seedance — 18 (dance-heavy) ────────────────────────────────────
const SEEDANCE: MotionPreset[] = [
  ["seedance-tiktok-yes",        "TikTok 'Yes'",         "تيك توك Yes",       4, ["dance", "tiktok"]],
  ["seedance-tiktok-renegade",   "Renegade",             "Renegade",          5, ["dance", "tiktok"]],
  ["seedance-tiktok-savage",     "Savage",               "Savage",            5, ["dance", "tiktok"]],
  ["seedance-tiktok-coffin",     "Coffin Dance",         "رقصة التابوت",      5, ["dance", "meme"]],
  ["seedance-tiktok-griddy",     "Griddy",               "Griddy",            4, ["dance", "celebration"]],
  ["seedance-kpop-bts",          "BTS Choreo",           "تكوريا BTS",        5, ["dance", "kpop"]],
  ["seedance-kpop-blackpink",    "Blackpink Choreo",     "تكوريا BLACKPINK",  5, ["dance", "kpop"]],
  ["seedance-kpop-newjeans",     "NewJeans Choreo",      "تكوريا NewJeans",   5, ["dance", "kpop"]],
  ["seedance-bollywood-clap",    "Bollywood Clap",       "تصفيق بوليوود",     5, ["dance", "bollywood"]],
  ["seedance-bollywood-spin",    "Bollywood Spin",       "دوران بوليوود",     5, ["dance", "bollywood"]],
  ["seedance-arabic-shamiya",    "Shamiya Dance",        "دبكة شامية",        6, ["dance", "arabic"]],
  ["seedance-arabic-khaleeji",   "Khaleeji Dance",       "رقصة خليجية",       5, ["dance", "arabic"]],
  ["seedance-salsa-basic",       "Salsa Basic Step",     "سالسا",             5, ["dance", "salsa"]],
  ["seedance-bachata",           "Bachata",              "باتشاتا",           6, ["dance", "bachata"]],
  ["seedance-flamenco",          "Flamenco",             "فلامينكو",          5, ["dance", "flamenco"]],
  ["seedance-irish-jig",         "Irish Jig",            "Jig إيرلندية",      4, ["dance", "irish"]],
  ["seedance-breakdance-spin",   "Breakdance Spin",      "بريك دانس",         5, ["dance", "breakdance"]],
  ["seedance-vogue",             "Vogue",                "Vogue",             5, ["dance", "vogue"]],
].map(([id, name, nameAr, duration, tags]) => ({
  id:              id as string,
  name:            name as string,
  nameAr:          nameAr as string,
  family:          "seedance",
  thumbnail:       thumb(id as string),
  preview:         preview(id as string),
  supportedModels: FAMILY_ENDPOINTS.seedance,
  duration:        duration as number,
  tags:            tags as string[],
}));

// ── Wan 2.2 — 16 ──────────────────────────────────────────────────
const WAN: MotionPreset[] = [
  ["wan-walk-confident",  "Wan Walk Confident",    "Wan مشية واثقة",     4, ["walk", "confident"]],
  ["wan-walk-casual",     "Wan Walk Casual",       "Wan مشية عادية",     4, ["walk", "casual"]],
  ["wan-jog-park",        "Park Jog",              "جري بارك",          5, ["jog", "outdoor"]],
  ["wan-sprint-sport",    "Sprint",                "عدو سريع",          4, ["sprint", "sport"]],
  ["wan-football-kick",   "Football Kick",         "ضربة كورة",         3, ["sport", "football"]],
  ["wan-basketball-shoot", "Basketball Shoot",     "تسديد كرة سلة",      4, ["sport", "basketball"]],
  ["wan-tennis-swing",    "Tennis Swing",          "تنس",               3, ["sport", "tennis"]],
  ["wan-golf-swing",      "Golf Swing",            "جولف",              4, ["sport", "golf"]],
  ["wan-skateboard-trick","Skateboard Trick",      "خدعة سكيت",         4, ["sport", "skate"]],
  ["wan-surf-pose",       "Surf Pose",             "بوز سيرف",          5, ["sport", "surf"]],
  ["wan-yoga-tree",       "Yoga Tree",             "يوغا شجرة",         5, ["yoga", "wellness"]],
  ["wan-yoga-warrior",    "Yoga Warrior",          "يوغا محارب",        5, ["yoga", "wellness"]],
  ["wan-meditate",        "Meditate",              "تأمل",              6, ["meditate", "wellness"]],
  ["wan-stretch-side",    "Side Stretch",          "تمدد جانبي",        4, ["stretch", "wellness"]],
  ["wan-push-up",         "Push-up",               "ضغط",               5, ["fitness", "exercise"]],
  ["wan-pull-up",         "Pull-up",               "عقلة",              5, ["fitness", "exercise"]],
].map(([id, name, nameAr, duration, tags]) => ({
  id:              id as string,
  name:            name as string,
  nameAr:          nameAr as string,
  family:          "wan",
  thumbnail:       thumb(id as string),
  preview:         preview(id as string),
  supportedModels: FAMILY_ENDPOINTS.wan,
  duration:        duration as number,
  tags:            tags as string[],
}));

// ── Veo 3.1 — 12 (cinematic-grade only) ────────────────────────────
const VEO: MotionPreset[] = [
  ["veo-cinematic-walk",      "Veo Cinematic Walk",   "Veo مشية سينما",    5, ["walk", "cinematic"]],
  ["veo-cinematic-stride",    "Heroic Stride",        "خطوة بطولية",       5, ["walk", "hero"]],
  ["veo-cinematic-spin",      "Cinematic Spin Reveal","دوران كشف",         4, ["spin", "reveal"]],
  ["veo-cinematic-strike",    "Cinematic Strike",     "ضربة سينما",        4, ["action", "strike"]],
  ["veo-cinematic-bullet",    "Bullet-Time Pose",     "بوز بوليت تايم",     3, ["action", "freeze"]],
  ["veo-cinematic-hero",      "Hero Pose",            "بوز البطل",         3, ["pose", "hero"]],
  ["veo-cinematic-villain",   "Villain Pose",         "بوز شرير",          3, ["pose", "villain"]],
  ["veo-cinematic-dance",     "Cinematic Dance",      "رقصة سينما",        6, ["dance", "cinematic"]],
  ["veo-cinematic-lookback",  "Dramatic Look Back",   "نظرة درامية",       3, ["expression", "dramatic"]],
  ["veo-cinematic-pray",      "Solemn Pray",          "دعاء وقور",         5, ["pray", "solemn"]],
  ["veo-cinematic-fall",      "Slow Fall",            "وقعة سلوموشن",      4, ["fall", "slow-mo"]],
  ["veo-cinematic-flight",    "Heroic Flight",        "طيران بطولي",       6, ["fly", "hero"]],
].map(([id, name, nameAr, duration, tags]) => ({
  id:              id as string,
  name:            name as string,
  nameAr:          nameAr as string,
  family:          "veo",
  thumbnail:       thumb(id as string),
  preview:         preview(id as string),
  supportedModels: FAMILY_ENDPOINTS.veo,
  duration:        duration as number,
  tags:            tags as string[],
}));

/** Full motion catalog — 121 named motions across 6 families. The
 *  schema is structured so additional motions can be appended to any
 *  family array without touching consumers (they just iterate the
 *  full catalog). */
export const MOTION_CATALOG: MotionPreset[] = [
  ...YILOW,
  ...KLING,
  ...MINIMAX,
  ...SEEDANCE,
  ...WAN,
  ...VEO,
];

/** Count helpers for UI tabs. */
export const MOTION_COUNTS_BY_FAMILY = MOTION_FAMILIES.reduce<Record<MotionFamily, number>>(
  (acc, fam) => {
    acc[fam.id] = MOTION_CATALOG.filter((m) => m.family === fam.id).length;
    return acc;
  },
  {} as Record<MotionFamily, number>,
);
