// ════════════════════════════════════════════════════════════════
// Marketing Studio — formats & avatar presets
// ════════════════════════════════════════════════════════════════
// Mirrors OpenHiggsField's Marketing Studio assets. Preview videos
// and avatars are hosted on the upstream CloudFront CDN — we link
// to them directly for now (we'll mirror them locally if they
// become unstable).

const CDN = "https://d3adwkbyhxyrtq.cloudfront.net/web-app";

export interface MarketingFormat {
  id:        string;
  name:      string;        // Arabic display name
  englishName: string;
  desc:      string;        // short Arabic description
  videoUrl:  string;        // preview/reference video
}

export const MARKETING_FORMATS: MarketingFormat[] = [
  {
    id:          "ugc",
    name:        "محتوى عضوي",
    englishName: "UGC Style",
    desc:        "محتوى يبدو طبيعياً من المستخدمين",
    videoUrl:    `${CDN}/ugc.mp4`,
  },
  {
    id:          "tutorial",
    name:        "شرح وتعليم",
    englishName: "Tutorial",
    desc:        "اشرح كيف يعمل منتجك بأسلوب سهل",
    videoUrl:    `${CDN}/ugc_how_to.mp4`,
  },
  {
    id:          "unboxing",
    name:        "فتح الصندوق",
    englishName: "Unboxing",
    desc:        "تجربة فتح المنتج بطريقة جذابة",
    videoUrl:    `${CDN}/ugc_unboxing.mp4`,
  },
  {
    id:          "hyper-motion",
    name:        "حركة سريعة",
    englishName: "Hyper Motion",
    desc:        "إعلان ديناميكي بحركة سريعة",
    videoUrl:    `${CDN}/hyper-motion-mini.mp4`,
  },
  {
    id:          "product-review",
    name:        "مراجعة منتج",
    englishName: "Product Review",
    desc:        "أسلوب مراجعة احترافي ومقنع",
    videoUrl:    `${CDN}/product_review.mp4`,
  },
  {
    id:          "tv-spot",
    name:        "إعلان تلفزيوني",
    englishName: "TV Spot",
    desc:        "إعلان قصير بأسلوب تلفزيوني",
    videoUrl:    `${CDN}/tv-spot-mini.mp4`,
  },
];

export interface MarketingAvatar {
  id:          string;
  name:        string;
  thumbnail:   string;
}

export const MARKETING_AVATARS: MarketingAvatar[] = [
  { id: "priya",  name: "Priya",  thumbnail: `${CDN}/Priya.webp`  },
  { id: "elena",  name: "Elena",  thumbnail: `${CDN}/Elena.webp`  },
  { id: "kai",    name: "Kai",    thumbnail: `${CDN}/Kai.webp`    },
  { id: "sora",   name: "Sora",   thumbnail: `${CDN}/Sora.webp`   },
  { id: "minji",  name: "Minji",  thumbnail: `${CDN}/Minji.webp`  },
  { id: "margot", name: "Margot", thumbnail: `${CDN}/Margot.webp` },
  { id: "niko",   name: "Niko",   thumbnail: `${CDN}/Niko.webp`   },
  { id: "jin",    name: "Jin",    thumbnail: `${CDN}/Jin.webp`    },
];

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

export const MARKETING_DEFAULTS = {
  formatId:    MARKETING_FORMATS[0]!.id,    // UGC
  ratio:       "9:16" as string,
  resolution:  "1080p" as string,
  duration:    5,
};

/** Pick the muapi endpoint based on the requested resolution. */
export function resolveMarketingEndpoint(resolution: string): string {
  return resolution === "1080p"
    ? "sd-2-vip-omni-reference-1080p"
    : "seedance-2-vip-omni-reference";
}
