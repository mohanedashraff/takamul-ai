import {
  Sparkles, Zap, Frame, Radio, Layers,
  Wand2, Image as ImageIcon, Video, Music, Film, Megaphone,
  Music2, Disc3, FileText, Aperture, Box, MapPin, Users,
  Heart, Smile, Drama, Camera, Palette, BookOpen, Gamepad2,
  Utensils, ShieldAlert, Cloud, CloudLightning, Scissors,
  Bomb, Pencil, MousePointer, Waves, Pyramid,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

// ── Input Schema ─────────────────────────────────────────────────────────────

export type InputType =
  | "upload"
  | "multi-upload"
  | "prompt"
  | "button-group"
  | "ratio-picker"
  | "slider"
  | "color"
  | "toggle"
  | "counter"
  | "select"
  | "style-picker"
  /** Curated motion catalog picker for motion-transfer — see
   *  `src/lib/data/motions.ts`. Resolves the picked preset's preview
   *  URL into the same field the upload-flow uses, so the executor
   *  doesn't need any motion-specific branches. */
  | "motion-picker";

export interface ToolInputOption {
  value: string;
  label: string;
  image?: string;           // thumbnail URL — used by style-picker
  categories?: string[];    // category tags — used by style-picker sidebar filter
  aspect?: [number, number];// [w, h] — used by ratio-picker visual rectangles
}

export interface ToolInput {
  id: string;
  type: InputType;
  label?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  accept?: string;           // upload: 'image/*' | 'video/*' | 'audio/*'
  options?: ToolInputOption[]; // button-group / select
  /**
   * For `select` inputs, fetches the option list from a server
   * endpoint at render time instead of using a static `options`
   * array. Used by the TTS tool to pull the live ElevenLabs voice
   * catalogue (`/api/audio/voices`) so the picker stays in sync with
   * the actual provider — no more mock voices.
   *
   * The endpoint is expected to return either an array of options or
   * `{ voices: [...] }` / `{ options: [...] }` — the renderer is lax
   * about the wrapping key.
   */
  dynamicOptions?: {
    endpoint: string;
    /** Optional human label shown while the list is loading. */
    loadingLabel?: string;
  };
  defaultValue?: any;
  min?: number;              // slider / counter
  max?: number;
  step?: number;
  unit?: string;             // slider display unit
  maxFiles?: number;         // multi-upload: max number of files (default 5)
  attachments?: { accept: string; max: number }; // prompt: inline attachment strip
}

// ── Tool Interface ────────────────────────────────────────────────────────────

import type { ModelCategory } from "./models";

export interface ToolModelOption {
  /** model id from the muapi registry (src/lib/data/models/registry.json) */
  id: string;
  /** Arabic display label (overrides registry `name`) */
  label?: string;
  /** Optional tagline shown under the name */
  tag?: string;
  /** Picker preview image */
  thumbnail?: string;
  /** Marks the recommended default — picked first in the UI */
  recommended?: boolean;
}

export interface ToolMuapiBinding {
  /** Which registry slice to use for model resolution */
  category: ModelCategory;
  /** Curated list shown in the model picker (subset of the registry) */
  models: ToolModelOption[];
  /** Map our tool inputs (ToolInput.id) → muapi payload field names.
   *  If an input's id already matches the muapi field, omit the entry. */
  paramMap?: Record<string, string>;
  /** Static payload fields merged into every request (rarely needed) */
  staticPayload?: Record<string, unknown>;
  /** When true, dynamic-cost calc is enabled in the UI */
  dynamicCost?: boolean;
}

export interface Tool {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  image: string | string[];
  credits: number;
  isNew?: boolean;
  layout?: "default" | "centered" | "inpaint" | "sketch" | "outpaint" | "angle" | "relight" | "multi-scene" | "change-clothes" | "fashion-designer" | "face-swap" | "whats-next" | "sketch-to-video" | "video-transitions";
  inputs: ToolInput[];
  /** Wires this tool to one or more muapi models */
  muapi?: ToolMuapiBinding;
  /** Wires this tool to an internal API route instead of MuAPI — for
   *  third-party providers (ElevenLabs TTS, Replicate audio, FFmpeg
   *  resize, …). Mutually exclusive with `muapi`. */
  customRunner?: {
    /** Internal endpoint path, e.g. "/api/audio/tts". */
    endpoint: string;
    /** Translate ToolInput.id → API field name. */
    paramMap?: Record<string, string>;
    /** Static fields merged into every request. */
    staticPayload?: Record<string, unknown>;
  };
  /** When set, the dashboard / gallery links to this absolute path instead
   *  of `/tools/<id>`. Use it for tools that have their own bespoke UI
   *  (Cinema Studio, Marketing Studio, …). */
  customRoute?: string;
  /** Highlights this tool as "premium / studio experience" in the gallery */
  studio?: boolean;
  /** Marks the tool as not yet available — UI shows a coming-soon
   *  message instead of trying to call MuAPI. */
  comingSoon?: boolean;
}

// ── Shared option sets ────────────────────────────────────────────────────────

const RATIO_IMAGE: ToolInputOption[] = [
  { value: "auto", label: "تلقائي" },
  { value: "1:1",  label: "1:1",  aspect: [1,  1]  },
  { value: "3:4",  label: "3:4",  aspect: [3,  4]  },
  { value: "4:3",  label: "4:3",  aspect: [4,  3]  },
  { value: "2:3",  label: "2:3",  aspect: [2,  3]  },
  { value: "3:2",  label: "3:2",  aspect: [3,  2]  },
  { value: "9:16", label: "9:16", aspect: [9,  16] },
  { value: "16:9", label: "16:9", aspect: [16, 9]  },
  { value: "5:4",  label: "5:4",  aspect: [5,  4]  },
  { value: "4:5",  label: "4:5",  aspect: [4,  5]  },
  { value: "21:9", label: "21:9", aspect: [21, 9]  },
];

const RATIO_IMAGE_EXPAND: ToolInputOption[] = [
  { value: "21:9", label: "21:9", aspect: [21, 9]  },
  { value: "auto", label: "تلقائي" },
  { value: "1:1",  label: "1:1",  aspect: [1,  1]  },
  { value: "3:2",  label: "3:2",  aspect: [3,  2]  },
  { value: "2:3",  label: "2:3",  aspect: [2,  3]  },
  { value: "4:3",  label: "4:3",  aspect: [4,  3]  },
  { value: "3:4",  label: "3:4",  aspect: [3,  4]  },
  { value: "4:5",  label: "4:5",  aspect: [4,  5]  },
  { value: "5:4",  label: "5:4",  aspect: [5,  4]  },
  { value: "9:16", label: "9:16", aspect: [9,  16] },
  { value: "16:9", label: "16:9", aspect: [16, 9]  },
];

const RATIO_VIDEO: ToolInputOption[] = [
  { value: "auto", label: "تلقائي" },
  { value: "16:9", label: "16:9", aspect: [16, 9]  },
  { value: "9:16", label: "9:16", aspect: [9,  16] },
  { value: "4:3",  label: "4:3",  aspect: [4,  3]  },
  { value: "3:4",  label: "3:4",  aspect: [3,  4]  },
  { value: "1:1",  label: "1:1",  aspect: [1,  1]  },
  { value: "21:9", label: "21:9"  },
];

const DURATION_VIDEO: ToolInputOption[] = [
  { value: "5",  label: "5 ث"  },
  { value: "8",  label: "8 ث"  },
  { value: "10", label: "10 ث" },
];

const DURATION_SHORT: ToolInputOption[] = [
  { value: "5",  label: "5 ث"  },
  { value: "10", label: "10 ث" },
];

const RESOLUTION: ToolInputOption[] = [
  { value: "720p",  label: "720p"  },
  { value: "1080p", label: "1080p" },
];

const RESOLUTION_VIDEO: ToolInputOption[] = [
  { value: "480p",  label: "480p"  },
  { value: "720p",  label: "720p"  },
  { value: "1080p", label: "1080p" },
];

const LIGHT_DIRECTION: ToolInputOption[] = [
  { value: "top",    label: "أعلى"  },
  { value: "front",  label: "أمام"  },
  { value: "right",  label: "يمين" },
  { value: "left",   label: "يسار"  },
  { value: "back",   label: "خلف"   },
  { value: "bottom", label: "أسفل" },
];

// ── Model option lists ──────────────────────────────────────────────────────
// Values here are real muapi slugs from src/lib/data/models/full-registry.js
// so they can flow straight into the muapi proxy without translation.

const IMAGE_MODELS: ToolInputOption[] = [
  { value: "nano-banana",                 label: "Nano Banana ✨"       },
  { value: "flux-schnell",                label: "Flux Schnell — أسرع"  },
  { value: "flux-dev",                    label: "Flux Dev"             },
  { value: "bytedance-seedream-v4",       label: "Seedream 4"           },
  { value: "google-imagen4",              label: "Google Imagen 4"      },
  { value: "google-imagen4-ultra",        label: "Imagen 4 Ultra 🔥"     },
  { value: "gpt-image-1.5",               label: "GPT Image 1.5"        },
  { value: "gpt4o-text-to-image",         label: "GPT-4o Image (legacy)" },
  { value: "midjourney-v7-text-to-image", label: "Midjourney v7"        },
  { value: "qwen-image",                  label: "Qwen Image"           },
  { value: "hunyuan-image-3.0",           label: "Hunyuan Image 3.0"    },
  { value: "reve-text-to-image",          label: "Reve"                 },
  { value: "kling-o1-text-to-image",      label: "Kling O1 Image"       },
  { value: "z-image-turbo",               label: "Z Image — Turbo"      },
  { value: "z-image-base",                label: "Z Image — Base"       },
  { value: "wan2.6-text-to-image",        label: "Wan 2.6 Image"        },
  { value: "wan2.5-text-to-image",        label: "Wan 2.5 Image"        },
  { value: "wan2.1-text-to-image",        label: "Wan 2.1 (legacy)"     },
  { value: "vidu-q2-reference-to-image",  label: "Vidu Q2 — Multi Reference" },
];

const VIDEO_MODELS: ToolInputOption[] = [
  { value: "kling-v3.0-pro-text-to-video",      label: "Kling 3.0 Pro 🔥"     },
  { value: "kling-v2.6-pro-t2v",                label: "Kling 2.6 Pro"        },
  { value: "kling-o1-text-to-video",            label: "Kling O1 Video"       },
  { value: "veo3.1-text-to-video",              label: "Google Veo 3.1"       },
  { value: "veo3.1-fast-text-to-video",         label: "Veo 3.1 Fast"         },
  { value: "openai-sora-2-text-to-video",       label: "OpenAI Sora 2"        },
  { value: "wan2.6-text-to-video",              label: "Wan 2.6"              },
  { value: "wan2.5-text-to-video",              label: "Wan 2.5"              },
  { value: "wan2.5-text-to-video-fast",         label: "Wan 2.5 Fast — أرخص"  },
  { value: "wan2.2-5b-fast-t2v",                label: "Wan 2.2 5B Fast"      },
  { value: "wan2.1-text-to-video",              label: "Wan 2.1 (legacy)"     },
  { value: "seedance-v2.0-t2v",                 label: "Seedance 2.0"         },
  { value: "minimax-hailuo-2.3-pro-t2v",        label: "Minimax Hailuo 2.3"   },
  { value: "ltx-2-fast-text-to-video",          label: "LTX 2 Fast"           },
];

const LIPSYNC_MODELS: ToolInputOption[] = [
  { value: "sync-lipsync",                  label: "Sync Lipsync"         },
  { value: "latent-sync",                   label: "LatentSync"           },
  { value: "creatify-lipsync",              label: "Creatify"             },
  { value: "veed-lipsync",                  label: "Veed Lipsync"         },
  { value: "wan2.2-speech-to-video",        label: "Wan 2.2 Speech"       },
  { value: "ltx-2.3-lipsync",               label: "LTX 2.3 Lipsync"      },
  { value: "infinitetalk-video-to-video",   label: "Infinite Talk"        },
];

const TRANSITIONS_STYLES: ToolInputOption[] = [
  { value: "raven",      label: "Raven Transition"      },
  { value: "flying_cam", label: "Flying Cam Transition" },
  { value: "melt",       label: "Melt Transition"       },
  { value: "splash",     label: "Splash Transition"     },
  { value: "flame",      label: "Flame Transition"      },
  { value: "smoke",      label: "Smoke Transition"      },
  { value: "hand",       label: "Hand Transition"       },
  { value: "hole",       label: "Hole Transition"       },
  { value: "display",    label: "Display Transition"    },
  { value: "jump",       label: "Jump Transition"       },
  { value: "seamless",   label: "Seamless Transition"   },
  { value: "stranger",   label: "Stranger Transition"   },
];

const CDN = "/api/cdn/c/soul-style/";

// Category keys used for sidebar filtering
export const STYLE_CATEGORIES = [
  { key: "all",       label: "الكل"             },
  { key: "new",       label: "جديد ✨"          },
  { key: "tiktok",    label: "تيك توك"          },
  { key: "instagram", label: "إنستجرام"         },
  { key: "camera",    label: "كاميرا"           },
  { key: "beauty",    label: "الجمال"           },
  { key: "mood",      label: "المزاج"           },
  { key: "surreal",   label: "خيالي"            },
  { key: "graphic",   label: "فن جرافيكي"      },
] as const;

const IMAGE_STYLES: ToolInputOption[] = [
  // ── بدون تصنيف محدد ─────────────────────────────────────────────────────────
  { value: "general",           label: "عام",                   image: CDN + "671935ec-51a6-4f9d-9cb4-39661b9a9814.jpg"  },
  { value: "tokyo_streetstyle", label: "أزياء شوارع طوكيو",    image: CDN + "b8665543-a419-4fda-a8d0-b10f07b8c03d.jpg"  },
  { value: "elevator_mirror",   label: "مرآة المصعد",           image: CDN + "0139a8e4-eb76-474a-a13c-d764d38674d1.jpg"  },
  { value: "ring_selfie",       label: "سيلفي الخاتم",          image: CDN + "d5d6f14d-9ba1-4f29-96d9-792280f50782.jpg"  },
  { value: "gorpcore",          label: "غورب كور",              image: CDN + "fbbfa936-7e5e-44f4-ac9c-774b38967130.jpg"  },
  { value: "half_selfie",       label: "سيلفي 0.5",             image: CDN + "add67dde-7dbf-4565-93e9-a9bb121e03b9.jpg"  },
  { value: "half_outfit",       label: "إطلالة 0.5",            image: CDN + "d014f6a2-792e-429b-b47a-33352ed95e2d.jpg"  },
  { value: "medieval",          label: "قرون وسطى",             image: CDN + "6d384dd7-f756-41de-9628-06c6cb204423.jpg"  },
  { value: "japandi",           label: "ياباندي",               image: CDN + "c63129ae-e4db-4bdf-9617-f7201f4a4cd1.jpg"  },
  { value: "coquette_core",     label: "كوكيت",                 image: CDN + "9ce0b7cb-2252-4047-8c9a-291a90395e66.jpg"  },
  { value: "quiet_luxury",      label: "فخامة هادئة",           image: CDN + "af2a00ab-3f9f-451b-8c0b-4abc81adb12a.webp" },
  { value: "hairclips",         label: "مشابك الشعر",           image: CDN + "35a6bbaa-4332-4537-8fce-28012da558be.jpg"  },
  { value: "505room",           label: "غرفة 505",              image: CDN + "293ed3aa-0d8e-4073-839a-d1698eafdf85.jpg"  },
  { value: "eating_food",       label: "تناول الطعام",          image: CDN + "d58fc1ab-f332-4e9b-bdd3-257164e92930.jpg"  },
  { value: "tumblr",            label: "تمبلر",                 image: CDN + "8d797478-cc70-47e1-9a35-242852667eb0.jpg"  },
  { value: "through_the_glass", label: "خلف الزجاج",            image: CDN + "c6ffc0df-5487-417b-82d9-2ec54d2aa122.jpg"  },
  { value: "vintage_photobooth",label: "كشك صور كلاسيكي",       image: CDN + "e41faf36-e634-485d-be55-edcce8099043.jpg"  },
  { value: "geominimal",        label: "جيومينيمال",            image: CDN + "670dae78-6481-4aab-b986-5060b1ae43ed.webp" },
  { value: "selfcare",          label: "العناية بالنفس",        image: CDN + "6a5baf93-e0dc-4123-9f7b-868eab9b4e04.jpg"  },
  { value: "office_beach",      label: "شاطئ المكتب",           image: CDN + "71391c5d-1171-4b32-9c74-6e97413ab33c.jpg"  },
  { value: "swords_hill",       label: "تل السيوف",             image: CDN + "fe9aa7ca-01be-443f-be91-d55efb7691e7.jpg"  },
  { value: "amalfi_summer",     label: "صيف أمالفي",            image: CDN + "61d13bb8-fbe2-4816-8d2b-231e5ef68930.webp" },
  { value: "grunge",            label: "غرانج",                 image: CDN + "dc742858-f56d-4fcc-9736-e7c2a3005b84.jpg"  },
  { value: "glazed_doll",       label: "بشرة الدمية",           image: CDN + "3c0eb808-90bf-4c84-b6fa-caae44265ef3.jpg"  },
  { value: "indie_sleaze",      label: "إندي سليز",             image: CDN + "3a5a91b6-330d-407e-8b55-c3900a95f0db.jpg"  },
  { value: "movie",             label: "سينمائي",               image: CDN + "a8417fb3-3801-4e00-b86f-57a55d59eacd.webp" },
  { value: "night_beach",       label: "شاطئ ليلي",             image: CDN + "270b4eb1-e9b1-4909-9f5e-50ce99697cc6.jpg"  },
  { value: "90s_editorial",     label: "إيديتوريال التسعينات",  image: CDN + "9cff0472-88b6-4ee2-a1e6-0976f79cdbe8.webp" },
  { value: "sitting_street",    label: "جلسة الشارع",           image: CDN + "e4cce90c-943a-45be-a324-0a92fe0fcb9d.jpg"  },
  { value: "fashion_show",      label: "عرض الأزياء",           image: CDN + "c056f71c-31c6-48f5-8d4c-b13bab458ede.jpg"  },
  { value: "angel_wings",       label: "أجنحة الملاك",          image: CDN + "2c8e708f-9fef-498c-bf66-bebfd8452705.webp" },
  { value: "pixelated_face",    label: "وجه بكسلي",             image: CDN + "a6bf56b4-eb67-49e5-aa26-e2dd45882100.webp" },
  { value: "grillz_selfie",     label: "سيلفي الجريلز",         image: CDN + "f20194ec-4c8f-4ed5-9f23-152f7d09ecec.webp" },
  { value: "bleached_brows",    label: "حواجب مبيضة",           image: CDN + "aa99b83d-fe92-4542-8dab-b0c708d0cf30.jpg"  },
  { value: "giant_people",      label: "أشخاص عمالقة",          image: CDN + "b6552305-c29f-4f41-9252-49c5470b2b73.webp" },
  { value: "too_big",           label: "ضخم جداً!",             image: CDN + "77e056f6-89db-4c06-833a-91f143ad4612.webp" },
  { value: "birthday_mess",     label: "فوضى عيد الميلاد",      image: CDN + "ea75ae9f-fa9a-4706-b1e0-8a01e01389cc.webp" },
  { value: "static_glow",       label: "بريق ثابت",             image: CDN + "443e1d53-353b-4459-b39e-56f91d141994.webp" },
  { value: "clouded_dream",     label: "حلم ضبابي",             image: CDN + "9ce258c5-ae02-423d-86c7-15cd8073fb61.webp" },
  { value: "double_take",       label: "نظرة مزدوجة",           image: CDN + "f457ae4c-f11a-448d-b2ec-058835039e58.webp" },
  { value: "red_balloon",       label: "بالون أحمر",            image: CDN + "504909f4-dad4-4f3a-b398-65e09e644200.webp" },
  { value: "tokyo_drift",       label: "طوكيو دريفت",           image: CDN + "f3d48ef2-efd7-40fa-ae07-f19bc8795f54.webp" },
  { value: "rhyme_blues",       label: "إيقاع وبلوز",           image: CDN + "d39c18e3-0b96-41ab-bcc7-4b6b29e953d5.webp" },
  { value: "bike_mafia",        label: "عصابة الدراجات",        image: CDN + "6e02af81-a6ab-4282-b432-da392a92bc31.webp" },
  { value: "dmv",               label: "دي إم في",              image: CDN + "8feebd5a-7c6d-436a-8d38-bbeac7b65f34.webp" },
  { value: "sea_breeze",        label: "نسيم البحر",            image: CDN + "2f0a3204-759e-446c-bac9-ce83605b6833.webp" },
  { value: "its_french",        label: "أناقة فرنسية",          image: CDN + "5facd514-6d55-4d45-82a5-ff2e8d5feb99.webp" },
  { value: "fisheye_twin",      label: "عين السمكة التوأم",     image: CDN + "dbd126c8-0c0f-4bfc-bb10-76a2cf5a536c.webp" },
  { value: "hallway_noir",      label: "ممر نوار",              image: CDN + "8f90d994-1b8d-4760-8afb-738da2975a50.webp" },
  { value: "burgundy_suit",     label: "بدلة بورجندي",          image: CDN + "c23aa132-6ff5-4654-9db5-8de98013a0d7.webp" },
  { value: "nicotine_glow",     label: "بريق نيكوتين",          image: CDN + "e1e573d1-530b-49e3-aea6-be773312a6a1.webp" },
  { value: "green_editorial",   label: "إيديتوريال أخضر",       image: CDN + "17e1f0f2-fbb0-4380-b5c9-e3e179f1f3a9.webp" },
  { value: "afterparty_cam",    label: "كاميرا ما بعد الحفلة",  image: CDN + "529d10c2-8394-44ac-bcea-e2760586e50e.webp" },
  { value: "2049",              label: "٢٠٤٩",                  image: CDN + "cb9644f9-8fe2-4b97-b248-0a232d8de01d.webp" },
  { value: "fireproof",         label: "مقاوم للنار",           image: CDN + "a687cfa3-b2b4-4870-af9a-20ac2d1320ad.webp" },
  { value: "night_rider",       label: "راكب الليل",            image: CDN + "4e5723ab-845d-43b2-b540-0202516e2e46.webp" },

  // ── جديد ────────────────────────────────────────────────────────────────────
  { value: "flight_mode",       label: "وضع الطيران",           image: CDN + "91490e65-80c2-42a0-bbec-971392a77462.webp", categories: ["new", "tiktok", "instagram"] },
  { value: "sunset_beach",      label: "شاطئ الغروب",           image: CDN + "71d9f310-f966-41ec-a009-a87167bcbebe.webp", categories: ["new", "tiktok", "instagram", "camera", "beauty"] },
  { value: "mt_fuji",           label: "جبل فوجي",              image: CDN + "7bc1844f-33b1-4578-b25c-2c8ab373e350.webp", categories: ["new", "mood", "surreal"] },
  { value: "street_view",       label: "منظر الشارع",           image: CDN + "1c59f291-cf9d-45c1-92b0-53768f372d0e.webp", categories: ["new", "tiktok", "mood"] },
  { value: "gallery",           label: "معرض فني",              image: CDN + "88d27015-a635-4c0f-bf47-19f7c280a659.webp", categories: ["new"] },
  { value: "crossing_street",   label: "عبور الشارع",           image: CDN + "9ef39e1b-693e-4560-89e0-6dfb670f42ea.webp", categories: ["new"] },
  { value: "library",           label: "المكتبة",               image: CDN + "4d95d3b1-0db6-4125-a0d7-ba9ba770872f.webp", categories: ["new"] },
  { value: "escalator",         label: "السلم المتحرك",         image: CDN + "c23eef21-0f45-4e93-8818-1da4a3061d01.webp", categories: ["new"] },
  { value: "sunbathing",        label: "تشمس",                  image: CDN + "97b9e378-ad9d-415e-b3f4-f4c8890dfb60.webp", categories: ["new"] },
  { value: "subway",            label: "المترو",                image: CDN + "af958840-be6d-4444-b441-22b7e1891f5d.webp", categories: ["new"] },

  // ── تيك توك ─────────────────────────────────────────────────────────────────
  { value: "digitalcam",        label: "كاميرا رقمية",          image: CDN + "0e82377e-e3dd-48a8-94fd-04a4ed038be4.webp", categories: ["tiktok", "camera", "beauty"] },
  { value: "cctv",              label: "كاميرا مراقبة",         image: CDN + "ed84e65b-1c57-4ce2-bef0-8e98c9e6667f.webp", categories: ["tiktok", "instagram", "camera", "beauty"] },
  { value: "bimbocore",         label: "بيمبو كور",             image: CDN + "fb283ea7-2fdb-4b50-acd3-f38d83d2c93e.jpg",  categories: ["tiktok"] },
  { value: "y2k",               label: "واي 2 كيه",             image: CDN + "75e73009-dd0c-4b9d-b0ef-93544b7e4491.jpg",  categories: ["tiktok"] },
  { value: "y2k_posters",       label: "ملصقات واي 2 كيه",      image: CDN + "a8d0899d-ec67-49a4-af7f-5fcf0a8f27be.webp", categories: ["tiktok"] },

  // ── إنستجرام ────────────────────────────────────────────────────────────────
  { value: "iphone",            label: "آيفون",                 image: CDN + "9627c330-e5e0-428d-8414-aeae83d57819.jpg",  categories: ["instagram", "camera", "beauty"] },
  { value: "realistic",         label: "واقعي",                 image: CDN + "acf8f24d-f567-4b7a-bede-aa63cb7c90dd.jpg",  categories: ["instagram"] },

  // ── كاميرا ──────────────────────────────────────────────────────────────────
  { value: "2000s_cam",         label: "كاميرا الألفينات",      image: CDN + "acc02fcd-ce68-4019-b517-089025455ed6.jpg",  categories: ["camera", "beauty"] },
  { value: "fisheye",           label: "عين السمكة",            image: CDN + "cacbe40f-8551-481a-a8f3-57692fc4ba4d.webp", categories: ["camera"] },
  { value: "360_cam",           label: "كاميرا 360°",           image: CDN + "a8951200-becf-4fa3-b41b-3a58e7ebcd72.jpg",  categories: ["camera", "beauty"] },

  // ── الجمال ──────────────────────────────────────────────────────────────────
  { value: "90s_grain",         label: "حبيبية التسعينات",      image: CDN + "a5c20546-38eb-4d61-8eb2-5290908d55bc.jpg",  categories: ["beauty"] },
  { value: "babydoll_makeup",   label: "مكياج باييبي دول",      image: CDN + "1d334a76-18b8-4d7e-9f77-1f3b5623d872.jpg",  categories: ["beauty"] },
  { value: "object_makeup",     label: "مكياج الأشياء",         image: CDN + "bb5c5572-693a-4b21-ba6e-329dc7da2af3.webp", categories: ["beauty"] },

  // ── المزاج ──────────────────────────────────────────────────────────────────
  { value: "spotlight",         label: "دائرة الضوء",           image: CDN + "47181b3d-429b-4f87-bb7c-2c5ca96da893.webp", categories: ["mood"] },
  { value: "sand",              label: "رمال",                  image: CDN + "665ca5a4-e1e7-4fed-8d53-01177ae0518d.jpg",  categories: ["mood"] },
  { value: "rainy_day",         label: "يوم ممطر",              image: CDN + "dfa98f2e-9b22-4272-a030-a5296b3b9b6a.jpg",  categories: ["mood"] },
  { value: "foggy_morning",     label: "صباح ضبابي",            image: CDN + "3cbfe1d2-421e-421a-b7bd-dbee471a1d65.jpg",  categories: ["mood"] },
  { value: "avant_garde",       label: "طليعي",                 image: CDN + "62cfc3fb-bb46-4977-9fbb-cee0b68504d4.jpg",  categories: ["mood"] },
  { value: "fairycore",         label: "فيري كور",              image: CDN + "a9f12667-0dd4-452e-b704-4ac8f29a69d9.webp", categories: ["mood"] },
  { value: "overexposed",       label: "إضاءة مبالغة",          image: CDN + "e668934b-9b36-4263-86e0-cdd58f7c267b.jpg",  categories: ["mood"] },

  // ── خيالي ───────────────────────────────────────────────────────────────────
  { value: "nail_check",        label: "فحص الأظافر",           image: CDN + "dc1274f0-b58d-4603-9f01-97337e512cac.jpg",  categories: ["surreal"] },
  { value: "giant_accessory",   label: "إكسسوار عملاق",         image: CDN + "f66daa40-480f-49f1-90ed-6b2af23a4554.jpg",  categories: ["surreal"] },
  { value: "creatures",         label: "مخلوقات",               image: CDN + "ce4416fd-37a7-42fe-af0d-10167d2cfa0a.webp", categories: ["surreal"] },
  { value: "shoe_check",        label: "فحص الحذاء",            image: CDN + "55009845-16f0-43b0-a395-48c2bbe1f4d8.jpg",  categories: ["surreal"] },

  // ── فن جرافيكي ──────────────────────────────────────────────────────────────
  { value: "invertethereal",    label: "عكس إيثيري",            image: CDN + "5a70012c-02c4-45aa-934b-768587a2d0e4.jpg",  categories: ["graphic"] },
  { value: "mixed_media",       label: "وسائط مختلطة",          image: CDN + "ca50ff8d-ed44-4043-b1ec-1c62247d4e44.webp", categories: ["graphic"] },
  { value: "paper_face",        label: "وجه ورقي",              image: CDN + "51362a07-60b0-4270-9125-03dea74ed03e.webp", categories: ["graphic"] },
  { value: "2000s_fashion",     label: "أزياء الألفينات",       image: CDN + "12160548-47c0-4652-9e2e-3fc9fb413d47.webp", categories: ["graphic"] },
  { value: "glitch",            label: "جلتش",                  image: CDN + "bed53d7d-3061-4666-bcd6-2ad890387f97.webp", categories: ["graphic"] },
  { value: "long_legs",         label: "أرجل طويلة",            image: CDN + "69a45320-c6ad-4242-8154-915121f42937.webp", categories: ["graphic"] },
  { value: "duplicate",         label: "مزدوج",                 image: CDN + "0f7a191d-93ea-40a5-ad16-ca2b85fdd753.jpg",  categories: ["graphic"] },
  { value: "artwork",           label: "عمل فني",               image: CDN + "40243714-8b1c-44bc-87f2-ef3aacc2daf9.webp", categories: ["graphic"] },
  { value: "graffiti",          label: "جرافيتي",               image: CDN + "65d773e0-b947-4edc-982e-493ce1f04dc3.webp", categories: ["graphic"] },
];

// ── Image Tools ───────────────────────────────────────────────────────────────

export const IMAGE_TOOLS: Tool[] = [
  {
    id: "ai-influencer",
    title: "AI Influencer Studio 👥",
    desc: "ابني شخصيتك الافتراضية الكاملة — 143 اختيار عبر 22 فئة.",
    icon: Users,
    image: "/api/cdn/c/application_main/2e53be4f-3594-47ce-a5f6-89c627d14be6.mp4",
    credits: 12,
    isNew: true,
    studio: true,
    customRoute: "/ai-influencer",
    inputs: [
      // Studio at /ai-influencer has its own bespoke 4-panel builder UI
      // — this minimal schema only exists to satisfy the Tool interface.
      { id: "prompt", type: "prompt", label: "وصف الشخصية", required: true },
    ],
  },
  {
    id: "product-photoshoot",
    title: "Product Photoshoot 📸",
    desc: "صورة منتج واحدة، 10 مزاج مختلف. Claude يكتب البريف، AI يصوّر.",
    icon: Frame,
    image: "/api/cdn/c/application_main/a7aa648c-6d7b-463a-8c47-998e25342aaa.mp4",
    credits: 6,
    isNew: true,
    studio: true,
    customRoute: "/product-photoshoot",
    inputs: [
      // Studio at /product-photoshoot has its own bespoke mode-grid +
      // upload UI — minimal schema only to satisfy the Tool interface.
      { id: "prompt", type: "prompt", label: "وصف الفكرة", required: true },
    ],
  },
  {
    id: "marketplace-cards",
    title: "Marketplace Cards 🛒",
    desc: "13 أصل لقائمة منتجك في Amazon — main + secondary + A+ Content بمعايير المتجر.",
    icon: Frame,
    image: "/api/cdn/c/application_main/030c784c-6618-430b-a4d6-e024e9f7973e.mp4",
    credits: 4,
    isNew: true,
    studio: true,
    customRoute: "/marketplace-cards",
    inputs: [
      // Studio at /marketplace-cards has its own scope-bundle + asset
      // grid UI — minimal schema only to satisfy the Tool interface.
      { id: "prompt", type: "prompt", label: "وصف المنتج", required: true },
    ],
  },
  {
    id: "edit-canvas",
    title: "Edit Canvas ✂️",
    desc: "صورة واحدة، كل أدوات التحرير — Style edit، Background، Outpaint، Relight، Skin، Upscale.",
    icon: Wand2,
    image: "/api/cdn/s/explore/Edit-image-video-inpaint.mp4",
    credits: 4,
    isNew: true,
    studio: true,
    customRoute: "/edit",
    inputs: [
      // Studio at /edit has its own canvas + sidebar UI — minimal
      // schema only to satisfy the Tool interface.
      { id: "prompt", type: "prompt", label: "وصف التعديل", required: true },
    ],
  },
  {
    id: "assist",
    title: "Yilow Assist 🤖",
    desc: "مساعد ذكي بـClaude — اكتب هدفك الإبداعي ويرشّحلك الأداة المناسبة + link مباشر.",
    icon: Sparkles,
    image: "/api/cdn/s/explore/create-image.mp4",
    credits: 0,
    isNew: true,
    studio: true,
    customRoute: "/assist",
    inputs: [
      // Studio at /assist is a chat UI — minimal schema only to
      // satisfy the Tool interface.
      { id: "prompt", type: "prompt", label: "هدفك الإبداعي", required: true },
    ],
  },
  {
    id: "cinema-studio",
    title: "استوديو السينما 🎬",
    desc: "كاميرات وعدسات سينمائية احترافية بميزانية لانهائية.",
    icon: Film,
    image: "/api/cdn/s/explore/create-image.mp4",
    credits: 8,
    isNew: true,
    studio: true,
    customRoute: "/cinema",
    inputs: [
      // Cinema Studio uses its own bespoke UI — these are kept minimal
      // so it still satisfies the Tool schema for the generations API.
      {
        id: "prompt",
        type: "prompt",
        label: "وصف المشهد",
        required: true,
      },
    ],
  },

  // ── Soul — Yilow's flagship aesthetic image model ──────────────────
  // Full-fidelity Soul aesthetic generator built on nano-banana-pro
  // with 33 mood boards, 6 color signatures, Soul ID character
  // consistency, build-your-own moodboards (≥5 photos), and HEX color
  // extraction from any reference image. Bespoke studio at /soul.
  {
    id: "soul",
    title: "Soul — صور Editorial",
    desc: "موديل صور إديتوريال راقي — موود بوردز، Soul HEX للألوان، Soul ID لشخصية ثابتة، وأكتر من ٣٣ ستايل جاهز.",
    icon: Aperture,
    image: "/tool-thumbnails/soul-2.mp4",
    credits: 8,
    isNew: true,
    studio: true,
    customRoute: "/soul",
    inputs: [
      // The studio at /soul has its own bespoke shoot bar — these are
      // kept minimal so it still satisfies the Tool schema.
      { id: "prompt", type: "prompt", label: "اوصف المشهد", required: true },
    ],
  },

  // ── Soul Cinema (cinematic Soul-aesthetic image gen) ───────────────
  // Cinema-flavored Soul generation built on top of nano-banana-pro
  // by injecting their signature cinematic descriptor into the prompt.
  // The actual MuAPI call lives in /api/tools/soul-cinema.
  {
    id: "soul-cinema",
    title: "صور سينمائية AI",
    desc: "صور بحس سينمائي — drama lighting, anamorphic frame وcolor grade دافي. (محاكاة استايل عبر nano-banana-pro)",
    icon: Film,
    image: "/tool-thumbnails/soul-cinema.png",
    credits: 6,
    isNew: true,
    customRunner: {
      endpoint: "/api/tools/soul-cinema",
      paramMap: {
        prompt:             "prompt",
        aspect_ratio:       "aspect_ratio",
        quality:            "quality",
        character_url:      "character_url",
        color_transfer_url: "color_transfer_url",
        enhance_prompt:     "enhance_prompt",
        num_outputs:        "num_outputs",
      },
    },
    inputs: [
      {
        id: "prompt",
        type: "prompt",
        label: "اوصف المشهد",
        placeholder: "مثال: امرأة بمعطف أحمر تقف على سطح ناطحة سحاب وقت الغروب",
        required: true,
        attachments: { accept: "image/*", max: 1 },
      },
      {
        id: "aspect_ratio",
        type: "ratio-picker",
        label: "نسبة الأبعاد",
        options: [
          { value: "16:9", label: "16:9", aspect: [16, 9] },
          { value: "9:16", label: "9:16", aspect: [9, 16] },
          { value: "1:1",  label: "1:1",  aspect: [1, 1]  },
          { value: "4:5",  label: "4:5",  aspect: [4, 5]  },
          { value: "3:4",  label: "3:4",  aspect: [3, 4]  },
          { value: "21:9", label: "21:9" },
          { value: "4:3",  label: "4:3",  aspect: [4, 3]  },
          { value: "3:2",  label: "3:2",  aspect: [3, 2]  },
        ],
        defaultValue: "16:9",
      },
      {
        id: "quality",
        type: "button-group",
        label: "الجودة",
        options: [
          { value: "1.5k", label: "1.5K — أسرع وأرخص" },
          { value: "2k",   label: "2K — موصى به" },
          { value: "4k",   label: "4K — أعلى جودة" },
        ],
        defaultValue: "2k",
      },
      {
        id: "character_url",
        type: "upload",
        label: "صورة شخصية مرجعية (اختياري)",
        accept: "image/*",
        hint: "هتحافظ على ملامح الشخصية في النتيجة",
      },
      {
        id: "color_transfer_url",
        type: "upload",
        label: "صورة لنقل الألوان (اختياري)",
        accept: "image/*",
        hint: "هتنقل لوحة الألوان والـ grade من الصورة دي",
      },
      {
        id: "enhance_prompt",
        type: "toggle",
        label: "تعزيز الـ prompt",
        defaultValue: true,
      },
      {
        id: "num_outputs",
        type: "counter",
        label: "عدد المخرجات",
        min: 1,
        max: 4,
        defaultValue: 1,
      },
    ],
  },
  {
    id: "text-to-image",
    title: "توليد صورة",
    desc: "حوّل كلماتك إلى صور مميزة وفريدة.",
    icon: ImageIcon,
    image: "/api/cdn/s/explore/create-image.mp4",
    credits: 5,
    isNew: true,
    inputs: [
      {
        id: "prompt",
        type: "prompt",
        label: "صف المشهد",
        placeholder: "صف الصورة التي تريد توليدها بالتفصيل...",
        required: true,
        attachments: { accept: "image/*", max: 5 },
      },
      {
        id: "model",
        type: "select",
        label: "النموذج",
        options: IMAGE_MODELS,
        defaultValue: "nano_banana_pro",
      },
      {
        id: "ratio",
        type: "ratio-picker",
        label: "نسبة الصورة",
        options: RATIO_IMAGE,
        defaultValue: "auto",
      },
      {
        id: "quality",
        type: "button-group",
        label: "الجودة",
        options: [
          { value: "1k", label: "1K" },
          { value: "2k", label: "2K" },
          { value: "4k", label: "4K" },
        ],
        defaultValue: "1k",
      },
      {
        id: "count",
        type: "counter",
        label: "عدد الصور",
        min: 1,
        max: 4,
        defaultValue: 1,
      },
      {
        id: "style",
        type: "style-picker",
        label: "أسلوب الصورة",
        options: IMAGE_STYLES,
        defaultValue: "",
        hint: "اختياري — اختر أسلوبًا بصريًا لتوجيه التوليد",
      },
    ],
    muapi: {
      category: "t2i",
      models: IMAGE_MODELS.map((m) => ({ id: m.value, label: m.label })),
      paramMap: {
        ratio: "aspect_ratio",
        count: "num_images",
      },
      dynamicCost: true,
    },
  },
  {
    id: "enhance-image",
    title: "تحسين الصور",
    desc: "إجعل صورك أكثر وضوحاً وبدقة عالية جداً — مع 8 كنترولز ديناميكية لـTopaz Redefine.",
    icon: Sparkles,
    image: "/api/cdn/s/explore/upscale.mp4",
    credits: 3,
    layout: "centered",
    inputs: [
      {
        id: "media",
        type: "upload",
        // Image-only upscalers wired below. Video upscalers
        // (`topaz-video-upscale`, `ai-video-upscaler-pro`) exist on
        // MuAPI and could be added later — for now we restrict to
        // images so we don't silently fail on video uploads.
        label: "الصورة",
        accept: "image/*",
        required: true,
        hint: "PNG، JPG — بحد أقصى 50MB",
      },
      // ── Topaz Redefine — 8 controls (mirrors the reference platform
      // and the actual Topaz Photo AI v3 redefine API surface). These
      // only apply when the selected model is topaz-image-upscale; the
      // other upscalers silently ignore unknown keys.
      {
        id: "creativity",
        type: "slider",
        label: "Creativity (تجديد محتوى)",
        hint: "أعلى = تفاصيل جديدة أذكى، أقل = حافظ على المحتوى الأصلي",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.30,
      },
      {
        id: "denoise",
        type: "slider",
        label: "Denoise",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.50,
      },
      {
        id: "sharpen",
        type: "slider",
        label: "Sharpen",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.40,
      },
      {
        id: "texture",
        type: "slider",
        label: "Texture",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.50,
      },
      {
        id: "face_enhancement_strength",
        type: "slider",
        label: "Face Enhancement — الشدة",
        hint: "خاص بالـportraits — يحسّن تفاصيل الوش",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.65,
      },
      {
        id: "face_enhancement_creativity",
        type: "slider",
        label: "Face Enhancement — الإبداع",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.30,
      },
      {
        id: "output_width",
        type: "counter",
        label: "العرض المستهدف (px)",
        hint: "اتركها فاضية لرفع ٢× تلقائي",
        min: 256,
        max: 8192,
        step: 64,
      },
      {
        id: "output_height",
        type: "counter",
        label: "الطول المستهدف (px)",
        min: 256,
        max: 8192,
        step: 64,
      },
    ],
    muapi: {
      category: "i2i",
      models: [
        { id: "topaz-image-upscale", label: "Topaz Redefine — أعلى جودة 🔥" },
        { id: "ai-image-upscaler",   label: "AI Upscaler — السريع" },
        { id: "seedvr2-image-upscale", label: "SeedVR2 — متقدم" },
      ],
      paramMap: {
        media:                       "image_url",
        creativity:                  "creativity",
        denoise:                     "denoise",
        sharpen:                     "sharpen",
        texture:                     "texture",
        face_enhancement_strength:   "face_enhancement_strength",
        face_enhancement_creativity: "face_enhancement_creativity",
        output_width:                "output_width",
        output_height:               "output_height",
      },
      dynamicCost: true,
    },
  },
  {
    id: "edit-image",
    title: "تعديل الصورة",
    desc: "ارسم على المنطقة التي تريد تعديلها وصف التغيير.",
    icon: Wand2,
    image: "/api/cdn/s/explore/Edit-image-video-inpaint.mp4",
    credits: 4,
    isNew: true,
    layout: "inpaint",
    inputs: [
      {
        id: "image",
        type: "upload",
        label: "ارفع الصورة",
        accept: "image/*",
        required: true,
        hint: "سيمكنك رسم فرشاة على المنطقة المراد تعديلها",
      },
      {
        id: "prompt",
        type: "prompt",
        label: "التعديل المطلوب",
        placeholder: "صف التغيير أو الإضافة التي تريدها في المنطقة المحددة...",
        required: true,
      },
      {
        id: "ref",
        type: "upload",
        label: "صورة مرجعية (اختياري)",
        accept: "image/*",
        hint: "أضف منتجاً أو صورة كمرجع للتعديل",
      },
    ],
    muapi: {
      category: "i2i",
      models: [
        { id: "nano-banana-pro-edit",    label: "Nano Banana Pro ✨" },
        { id: "flux-kontext-pro-i2i",    label: "Flux Kontext Pro"   },
        { id: "flux-kontext-max-i2i",    label: "Flux Kontext Max 🔥"},
        { id: "qwen-image-edit-plus",    label: "Qwen Edit Plus"     },
        { id: "gpt4o-edit",              label: "GPT-4o Edit"        },
        { id: "bytedance-seedream-edit-v4", label: "Seedream Edit"   },
        { id: "nano-banana-2-edit",      label: "Nano Banana 2"      },
      ],
      // All edit endpoints (nano-banana-pro-edit, flux-kontext-*,
      // qwen-image-edit-plus, gpt4o-edit, …) accept `images_list`.
      // Both inputs merge into the same array via buildPayload's
      // array-merge logic — first slot is the base, second is the
      // optional reference.
      paramMap: {
        image: "images_list",
        ref:   "images_list",
      },
      dynamicCost: true,
    },
  },
  {
    id: "bg-remover",
    title: "إزالة الخلفية",
    desc: "احذف خلفية صورك بدقة تامة خلال ثوانٍ.",
    icon: Layers,
    image: "https://claid.ai/static/remove_bg-f6045fe63f17a1a42b07ff97ce4e20af.mp4",
    credits: 2,
    layout: "centered",
    inputs: [
      {
        id: "image",
        type: "upload",
        label: "ارفع الصورة",
        accept: "image/*",
        required: true,
        hint: "PNG أو JPG",
      },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "ai-background-remover", label: "AI Background Remover" }],
      paramMap: { image: "image_url" },
      dynamicCost: true,
    },
  },
  {
    id: "product-mockup",
    title: "نماذج منتجات",
    desc: "أنشئ صور واقعية للمنتجات بصيغ متعددة.",
    icon: Frame,
    image: [
      "/api/cdn/c/application_main/a7aa648c-6d7b-463a-8c47-998e25342aaa.mp4",
      "/api/cdn/c/application_main/030c784c-6618-430b-a4d6-e024e9f7973e.mp4",
      "/api/cdn/c/application_main/77335af7-3bf5-4491-bf12-4b695ec524b1.mp4",
    ],
    credits: 3,
    inputs: [
      {
        id: "product",
        type: "upload",
        label: "صورة المنتج",
        accept: "image/*",
        required: true,
        hint: "خلفية بيضاء أو شفافة أفضل",
      },
      {
        id: "prompt",
        type: "prompt",
        label: "المشهد المحيط (اختياري)",
        placeholder: "مثال: منتج على طاولة خشبية مع إضاءة دافئة وزهور...",
      },
    ],
    muapi: {
      category: "i2i",
      // ai-product-shot expects `scene_description` (not `prompt`)
      // for the surrounding scene, plus `image_url` for the product.
      // ai-product-photography needs both person + product images,
      // which this tool doesn't collect — so we drop it for now.
      models: [
        { id: "ai-product-shot", label: "AI Product Shot" },
      ],
      paramMap: { product: "image_url", prompt: "scene_description" },
      dynamicCost: true,
    },
  },
  {
    id: "sketch-to-image",
    title: "رسم إلى صورة",
    desc: "حوّل رسوماتك اليدوية إلى أعمال فنية ساحرة.",
    icon: ImageIcon,
    image: "/api/cdn/s/nano_draw/image_draw.mp4",
    credits: 5,
    isNew: true,
    layout: "sketch",
    inputs: [
      {
        id: "sketch",
        type: "upload",
        label: "ارفع الرسم",
        accept: "image/*",
        required: true,
        hint: "رسم يدوي أو رقمي",
      },
      {
        id: "prompt",
        type: "prompt",
        label: "الأسلوب الفني (اختياري)",
        placeholder: "مثال: رسم زيتي، واقعي فوتوغرافي، أنمي ياباني...",
      },
    ],
    muapi: {
      category: "i2i",
      models: [
        { id: "flux-kontext-pro-i2i",     label: "Flux Kontext Pro" },
        { id: "nano-banana-pro-edit",     label: "Nano Banana Pro"  },
        { id: "qwen-image-edit-plus",     label: "Qwen Edit Plus"   },
      ],
      // Flux-Kontext + nano-banana-edit both accept images_list[].
      // executeTool's buildPayload auto-wraps the single URL.
      paramMap: { sketch: "images_list" },
      dynamicCost: true,
    },
  },
  {
    // id kept as `restore-image` for back-compat with old URLs / DB rows.
    // Title + desc + label updated to reflect what `ai-color-photo`
    // actually does: it colourises black-and-white photos. It does
    // NOT remove scratches / fix damage / restore tears. Setting the
    // user's expectations correctly avoids "didn't fix my damaged photo"
    // disappointment.
    id: "restore-image",
    title: "تلوين الصور القديمة",
    desc: "حوّل صورك بالأبيض والأسود إلى ألوان طبيعية وحيوية.",
    icon: Frame,
    image: "https://c.topshort.org/fluxai/flux_kontext_apps/old_photo_restore/key_feature/2.webp",
    credits: 4,
    layout: "centered",
    inputs: [
      {
        id: "image",
        type: "upload",
        label: "صورة بالأبيض والأسود",
        accept: "image/*",
        required: true,
        hint: "PNG أو JPG — بحد أقصى 20MB",
      },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "ai-color-photo", label: "AI Colourise" }],
      paramMap: { image: "image_url" },
      dynamicCost: true,
    },
  },
  {
    id: "skin-retouch",
    title: "تحسين البشرة",
    desc: "أزل الشوائب وحسن مظهر البشرة بضغطة زر.",
    icon: Sparkles,
    image: "/api/cdn/c/application_main/fb84f803-64b0-4259-b9a3-b2fc57073da4.mp4",
    credits: 2,
    layout: "centered",
    isNew: true,
    inputs: [
      {
        id: "image",
        type: "upload",
        label: "ارفع الصورة",
        accept: "image/*",
        required: true,
        hint: "يفضل صورة وجه واضحة وعالية الدقة",
      },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "ai-skin-enhancer", label: "AI Skin Enhancer" }],
      paramMap: { image: "image_url" },
      dynamicCost: true,
    },
  },
  {
    id: "image-outpaint",
    title: "تمديد الصورة",
    desc: "وسع أبعاد صورتك — الذكاء الاصطناعي يملأ ما خارج الإطار.",
    icon: Frame,
    image: "/api/cdn/c/application_main/18f1d529-5a2d-4f60-9a9a-a7d012464d40.mp4",
    credits: 5,
    isNew: true,
    layout: "outpaint",
    inputs: [
      {
        id: "image",
        type: "upload",
        label: "ارفع الصورة",
        accept: "image/*",
        required: true,
        hint: "PNG أو JPG — من Clipboard أيضاً",
      },
      {
        id: "ratio",
        type: "ratio-picker",
        label: "النسبة المستهدفة",
        options: RATIO_IMAGE_EXPAND,
        defaultValue: "16:9",
      },
    ],
    muapi: {
      category: "i2i",
      models: [
        { id: "ai-image-extension", label: "AI Image Extension"     },
        { id: "ideogram-v3-reframe", label: "Ideogram Reframe 🔥"   },
      ],
      paramMap: { image: "image_url", ratio: "aspect_ratio" },
      dynamicCost: true,
    },
  },
  {
    id: "change-angle",
    layout: "angle",
    title: "تغيير الزاوية",
    desc: "غير زاوية رؤية الصورة كما لو تم التقاطها من جديد.",
    icon: Wand2,
    image: "/api/cdn/c/application_main/29dc499c-84a0-43c3-8c6b-1e278a6cc474.mp4",
    credits: 4,
    isNew: true,
    inputs: [
      {
        id: "image",
        type: "upload",
        label: "ارفع الصورة",
        accept: "image/*",
        required: true,
      },
      {
        id: "rotation",
        type: "slider",
        label: "الدوران",
        min: 0,
        max: 360,
        step: 1,
        defaultValue: 270,
        unit: "°",
      },
      {
        id: "tilt",
        type: "slider",
        label: "الإمالة",
        min: 0,
        max: 90,
        step: 1,
        defaultValue: 60,
        unit: "°",
      },
      {
        id: "zoom",
        type: "slider",
        label: "التقريب",
        min: 0,
        max: 2,
        step: 0.1,
        defaultValue: 0.2,
        unit: "x",
      },
      {
        id: "best12",
        type: "toggle",
        label: "توليد من 12 زاوية مثالية",
        defaultValue: false,
      },
    ],
    muapi: {
      category: "i2i",
      // qwen-image-edit-plus-lora is THE muapi endpoint with real
      // structured camera-control fields (rotate_right_left,
      // vertical_angle, move_forward, wide_angle_lens). The reference
      // platform's Angles 2.0 routes through the same Qwen model under
      // the hood. The other edit models (nano-banana, flux-kontext,
      // gpt4o) are kept as fallbacks for prompt-driven attempts when
      // the structured fields aren't a perfect match.
      models: [
        { id: "qwen-image-edit-plus-lora", label: "Qwen Camera Control 🔥" },
        { id: "nano-banana-pro-edit",      label: "Nano Banana Pro"        },
        { id: "gpt4o-edit",                label: "GPT-4o Edit"            },
        { id: "qwen-image-edit-plus",      label: "Qwen Edit Plus"         },
      ],
      // image-edit models on muapi accept images_list[] (not image_url).
      // executeTool wraps the single URL into an array. The
      // rotation/tilt/zoom values are sent as native fields when
      // qwen-camera-control is selected — see AngleWorkspace.
      paramMap: {
        image:    "images_list",
        rotation: "rotate_right_left",
        tilt:     "vertical_angle",
        zoom:     "move_forward",
      },
      dynamicCost: true,
    },
  },
  {
    id: "multi-scene",
    layout: "multi-scene" as const,
    title: "لقطات سينمائية",
    desc: "صورة واحدة تُولّد 9 زوايا سينمائية مختلفة.",
    icon: Layers,
    image: "/api/cdn/c/application_main/1ae1f1a8-3994-4ead-af2a-fa30c37ea7fb.mp4",
    credits: 3,
    isNew: true,
    inputs: [
      {
        id: "image",
        type: "upload",
        label: "ارفع الصورة",
        accept: "image/*",
        required: true,
        hint: "ستحصل على 9 لقطات سينمائية مختلفة",
      },
    ],
    muapi: {
      category: "i2i",
      // Workspace fans out N parallel calls (one per cinematic angle)
      // each with num_images:1, then merges. See MultiSceneWorkspace.
      // Earlier the tool sent num_images:9 in one call which Flux
      // Kontext capped at 4 AND the variants drifted the subject's
      // identity randomly. Per-shot prompts produce a coherent series.
      models: [
        { id: "nano-banana-pro-edit", label: "Nano Banana Pro 🔥" },
        { id: "flux-kontext-pro-i2i", label: "Flux Kontext Pro"   },
      ],
      paramMap: { image: "images_list" },
      dynamicCost: true,
    },
  },
  {
    id: "relighting",
    layout: "relight",
    title: "توزيع الإضاءة",
    desc: "تحكم كامل في إضاءة صورتك لإبراز التفاصيل.",
    icon: Zap,
    image: "/api/cdn/c/application_main/ff6c6ba0-3c47-416a-a473-e2b2bd425160.mp4",
    credits: 4,
    isNew: true,
    inputs: [
      {
        id: "image",
        type: "upload",
        label: "ارفع الصورة",
        accept: "image/*",
        required: true,
      },
      {
        id: "direction",
        type: "button-group",
        label: "اتجاه الإضاءة",
        options: LIGHT_DIRECTION,
        defaultValue: "front",
      },
      {
        id: "lightType",
        type: "button-group",
        label: "نوع الإضاءة",
        options: [
          { value: "hard", label: "حادة" },
          { value: "soft", label: "ناعمة" },
        ],
        defaultValue: "hard",
      },
      {
        id: "brightness",
        type: "slider",
        label: "السطوع",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        unit: "%",
      },
      {
        id: "color",
        type: "color",
        label: "لون الإضاءة",
        defaultValue: "#ffffff",
      },
    ],
    muapi: {
      category: "i2i",
      models: [
        { id: "flux-kontext-pro-i2i", label: "Flux Kontext Pro 🔥" },
        { id: "nano-banana-pro-edit", label: "Nano Banana Pro"     },
        { id: "qwen-image-edit-plus", label: "Qwen Edit Plus"      },
      ],
      paramMap: { image: "images_list" },
      // direction/lightType/brightness/color get baked into the prompt via UI
      dynamicCost: true,
    },
  },
  {
    id: "change-clothes",
    layout: "change-clothes" as const,
    title: "تغيير الملابس",
    desc: "قم بتغيير أزياء شخصياتك بأناقة وسهولة غير مسبوقة.",
    icon: ImageIcon,
    image: "/api/cdn/c/application_main/da91da29-9fc7-41fd-a99d-b07e4bb010b6.mp4",
    credits: 5,
    isNew: true,
    inputs: [
      {
        id: "person",
        type: "upload",
        label: "صورتك",
        accept: "image/*",
        required: true,
        hint: "PNG أو JPG — صورة كاملة للشخص",
      },
      {
        id: "outfit",
        type: "upload",
        label: "صورة الملابس",
        accept: "image/*",
        required: true,
        hint: "صورة الزي أو الملابس المراد تطبيقها",
      },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "ai-dress-change", label: "AI Dress Change" }],
      // ai-dress-change uses `model_image_url` (the person/mannequin
      // wearing the garment) and `garment_image_url`. Was previously
      // sending `image_url` which the model rejects with 422.
      paramMap: { person: "model_image_url", outfit: "garment_image_url" },
      dynamicCost: true,
    },
  },
  {
    id: "fashion-designer",
    layout: "fashion-designer" as const,
    title: "مصمم الأزياء",
    desc: "صمم أزياءك الخاصة وشاهدها على عارضين واقعيين.",
    icon: Wand2,
    image: "/api/cdn/c/application_main/bb9d59e1-0493-4031-a97d-27fc7f660c89.mp4",
    credits: 6,
    isNew: true,
    inputs: [
      {
        id: "prompt",
        type: "prompt",
        label: "وصف تصميم الأزياء",
        placeholder: "مثال: فستان سهرة أحمر طويل بأكمام واسعة وتطريز ذهبي...",
        required: true,
      },
      {
        id: "person",
        type: "upload",
        label: "صورة مرجعية (اختياري)",
        accept: "image/*",
        hint: "صورة شخص أو مانيكان",
      },
    ],
    muapi: {
      // No reference → t2i (generate the design from scratch).
      // We reuse the t2i path; if a reference is uploaded the executor
      // will just include it as image_url and most t2i models will pass it.
      category: "t2i",
      models: [
        { id: "nano-banana",                    label: "Nano Banana ✨"     },
        { id: "flux-dev",                       label: "Flux Dev"           },
        { id: "midjourney-v7-text-to-image",    label: "Midjourney v7"      },
        { id: "google-imagen4-ultra",           label: "Imagen 4 Ultra 🔥"  },
      ],
      // Map `person` to images_list — when the workspace overrides
      // the endpoint to nano-banana-pro-edit (because a reference
      // person was uploaded), the auto-wrap helper turns the single
      // URL into [url] which the edit model expects. T2I models
      // ignore the field entirely (no images_list on their schema),
      // so this is safe even without the override.
      paramMap: { person: "images_list" },
      staticPayload: { aspect_ratio: "3:4", num_images: 4 },
      dynamicCost: true,
    },
  },
  {
    id: "face-swap",
    layout: "face-swap" as const,
    title: "تغيير الوجه",
    desc: "تبديل الوجوه بلمسة واحدة بشكل واقعي ومذهل.",
    icon: Wand2,
    image: "/api/cdn/c/application_main/2e53be4f-3594-47ce-a5f6-89c627d14be6.mp4",
    credits: 4,
    isNew: true,
    inputs: [
      {
        id: "faceSource",
        type: "upload",
        label: "صورة الوجه الجديد",
        accept: "image/*",
        required: true,
        hint: "صورة واضحة للوجه المراد إدراجه",
      },
      {
        id: "targetImage",
        type: "upload",
        label: "الصورة الهدف",
        accept: "image/*",
        required: true,
        hint: "الصورة التي تريد تغيير الوجه فيها",
      },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "ai-image-face-swap", label: "AI Face Swap" }],
      // muapi schema: image_url = base/target image, swap_url = the face
      // to apply onto it. Earlier paramMap used source_/target_image_url
      // which is the wrong contract.
      paramMap: {
        faceSource:  "swap_url",
        targetImage: "image_url",
      },
      dynamicCost: true,
    },
  },
  {
    id: "whats-next",
    layout: "whats-next" as const,
    title: "ماذا بعد ؟",
    desc: "صورة واحدة تُولّد 8 احتمالات للمشهد التالي.",
    icon: Sparkles,
    image: "/api/cdn/c/application_main/5600ef95-0305-4b8a-b407-dfa6f5d1f73d.mp4",
    credits: 3,
    isNew: true,
    inputs: [
      {
        id: "image",
        type: "upload",
        label: "ارفع الصورة",
        accept: "image/*",
        required: true,
        hint: "ستحصل على 8 تكملات للمشهد",
      },
    ],
    muapi: {
      category: "i2i",
      models: [
        // Workspace fans out 8 parallel calls (one per narrative
        // progression — turn around, pull back, dramatic beat, etc)
        // each with num_images:1, then merges. See WhatsNextWorkspace.
        { id: "nano-banana-pro-edit",  label: "Nano Banana Pro 🔥" },
        { id: "flux-kontext-pro-i2i",  label: "Flux Kontext Pro"   },
      ],
      paramMap: { image: "images_list" },
      dynamicCost: true,
    },
  },

  // ── Cinema Sub-tools ───────────────────────────────────────────────
  // Three companion tools to the main Cinema Studio, mirroring the
  // image-3d / soul-cast / soul-location sub-modes the reference
  // platform exposes. Each is a thin workspace on top of nano-banana-
  // pro with a composed prompt — they don't share state with the
  // main /cinema page so users can use them standalone.

  {
    id: "cinema-3d",
    title: "صورة 3D — تجسيم",
    desc: "حوّل أي صورة لـfigurine ثلاثي الأبعاد بإضاءة استوديو وعمق واقعي.",
    icon: Box,
    image: "/tool-thumbnails/soul-cinema.png",
    credits: 8,
    isNew: true,
    layout: "centered",
    inputs: [
      {
        id: "image",
        type: "upload",
        label: "ارفع الصورة",
        accept: "image/*",
        required: true,
        hint: "أحسن نتيجة مع موضوع رئيسي واضح (شخص، منتج، أو أيقونة)",
      },
    ],
    muapi: {
      // image-edit models accept images_list[] + a prompt. We inject
      // a fixed 3D-figurine descriptor via staticPayload so the user
      // doesn't have to type anything — just upload and press run.
      category: "i2i",
      models: [
        { id: "nano-banana-pro-edit", label: "Nano Banana Pro 🔥" },
        { id: "flux-kontext-pro-i2i", label: "Flux Kontext Pro"   },
      ],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt: "Convert into a high-quality 3D figurine / collectible toy render. " +
                "Isometric angle on a clean studio surface, soft directional studio lighting, " +
                "subtle ambient occlusion shadows, vinyl-toy material, chunky proportions, " +
                "preserve identity, likeness, costume, and key details. " +
                "Professional 3D render, ultra-detailed, 8K, sharp focus.",
        aspect_ratio: "1:1",
      },
      dynamicCost: true,
    },
  },

  {
    id: "cinema-location",
    title: "Cinema: مولّد الأماكن",
    desc: "اكتب اسم المكان أو وصفه القصير + اختر ستايل، نولّد صورة سينمائية كاملة للمكان.",
    icon: MapPin,
    image: "/tool-thumbnails/soul-cinema.png",
    credits: 6,
    isNew: true,
    layout: "centered",
    inputs: [
      {
        id: "location_name",
        type: "prompt",
        label: "اسم المكان أو وصفه",
        placeholder: "مثال: شارع في طوكيو ليلاً، ساحل أمالفي، مكتبة قديمة، مسجد دمشق…",
        required: true,
        hint: "كل ما الوصف أوضح، كل ما النتيجة أدق",
      },
      {
        id: "style",
        type: "style-picker",
        label: "ستايل الـlocation",
        // Re-using the same Soul-style catalog so users have one
        // visual vocabulary across tools. Defaults to "movie" for a
        // cinematic establishing-shot feel.
        options: IMAGE_STYLES,
        defaultValue: "movie",
        hint: "اختياري — يحدد المزاج البصري والإضاءة والـcolor grade",
      },
      {
        id: "aspect_ratio",
        type: "ratio-picker",
        label: "نسبة الأبعاد",
        options: [
          { value: "16:9", label: "16:9 سينمائي", aspect: [16, 9] },
          { value: "21:9", label: "21:9 ألترا" },
          { value: "9:16", label: "9:16 عمودي",  aspect: [9, 16] },
          { value: "3:2",  label: "3:2",          aspect: [3, 2]  },
          { value: "2:3",  label: "2:3",          aspect: [2, 3]  },
          { value: "1:1",  label: "1:1 مربع",     aspect: [1, 1]  },
        ],
        defaultValue: "16:9",
      },
    ],
    customRunner: {
      // The location workspace composes a long-form English prompt
      // from the user-supplied name + selected style, then routes
      // through nano-banana-pro via /api/tools/cinema-location.
      endpoint:    "/api/tools/cinema-location",
      paramMap: {
        location_name: "location_name",
        style:         "style",
        aspect_ratio:  "aspect_ratio",
      },
    },
  },

  {
    id: "cinema-cast",
    title: "Cinema: مولّد الشخصيات",
    desc: "ابني شخصية سينمائية بـmuhandasa structured — اسم، وصف، حقبة، نوع، طراز جسم، وجاذبية.",
    icon: Users,
    image: "/tool-thumbnails/soul-cinema.png",
    credits: 12,
    isNew: true,
    layout: "centered",
    inputs: [
      {
        id: "full_name",
        type: "prompt",
        label: "اسم الشخصية الكامل",
        placeholder: "مثال: ناصر بن مالك، Sarah Chen، أحمد المصري…",
        required: true,
      },
      {
        id: "description",
        type: "prompt",
        label: "الوصف القصير / الـbackstory",
        placeholder: "مثال: عداء سعودي انهار في ماراثون جدة 2018 ويسعى لكشف راعيه السابق…",
        required: true,
        hint: "جملة أو اتنين — هتظهر في الـprompt كـcharacter context",
      },
      {
        id: "archetype",
        type: "button-group",
        label: "النمط الأصلي (Archetype)",
        options: [
          // The 11 archetypes Higgsfield ships visual thumbnails for.
          { value: "hero",       label: "بطل (Hero)",            image: "/api/cdn/s/cast/archetype/hero.webp"        },
          { value: "everyman",   label: "إنسان عادي (Everyman)", image: "/api/cdn/s/cast/archetype/everyman.webp"    },
          { value: "innocent",   label: "بريء (Innocent)",       image: "/api/cdn/s/cast/archetype/innocent.webp"    },
          { value: "explorer",   label: "مستكشف (Explorer)",     image: "/api/cdn/s/cast/archetype/expolrer.webp"    },
          { value: "ruler",      label: "حاكم (Ruler)",          image: "/api/cdn/s/cast/archetype/ruler.webp"       },
          { value: "creator",    label: "مبدع (Creator)",        image: "/api/cdn/s/cast/archetype/creator.webp"     },
          { value: "rebel",      label: "متمرد (Rebel)",         image: "/api/cdn/s/cast/archetype/rebel.webp"       },
          { value: "lover",      label: "محب (Lover)",           image: "/api/cdn/s/cast/archetype/lover.webp"       },
          { value: "sage",       label: "حكيم (Sage)"            /* no Higgsfield thumbnail */ },
          { value: "jester",     label: "مهرّج (Jester)",        image: "/api/cdn/s/cast/archetype/jester.webp"      },
          { value: "magician",   label: "ساحر (Magician)",       image: "/api/cdn/s/cast/archetype/magician-upd.webp"},
          { value: "caregiver",  label: "راعي (Caregiver)",      image: "/api/cdn/s/cast/archetype/caregiver.webp"   },
          // Yilow-original extras — no Higgsfield thumbnail.
          { value: "antihero",   label: "بطل مضاد (Antihero)"  },
          { value: "villain",    label: "شرير (Villain)"       },
          { value: "mentor",     label: "موجّه (Mentor)"       },
          { value: "trickster",  label: "محتال (Trickster)"    },
        ],
        defaultValue: "hero",
      },
      {
        id: "gender",
        type: "button-group",
        label: "النوع",
        options: [
          { value: "male",       label: "ذكر",      image: "/api/cdn/s/cast/male.webp"   },
          { value: "female",     label: "أنثى",     image: "/api/cdn/s/cast/female.webp" },
          { value: "non-binary", label: "غير ثنائي" },
        ],
        defaultValue: "male",
      },
      {
        id: "body_type",
        type: "button-group",
        label: "طراز الجسم",
        options: [
          { value: "slim",       label: "نحيف",  image: "/api/cdn/s/cast/body_type/slim.webp"      },
          { value: "lean",       label: "رشيق",  image: "/api/cdn/s/cast/body_type/lean.webp"      },
          { value: "average",    label: "متوسط", image: "/api/cdn/s/cast/body_type/average.webp"   },
          { value: "muscular",   label: "عضلي",  image: "/api/cdn/s/cast/body_type/muscular.webp"  },
          { value: "stocky",     label: "متين",  image: "/api/cdn/s/cast/body_type/stocky.webp"    },
          { value: "plus_size",  label: "ضخم",   image: "/api/cdn/s/cast/body_type/plus_size.webp" },
          // Yilow-original extras
          { value: "athletic",   label: "رياضي" },
          { value: "curvy",      label: "ممتلئ" },
        ],
        defaultValue: "average",
      },
      {
        id: "era",
        type: "select",
        label: "الحقبة الزمنية",
        options: [
          { value: "ancient",      label: "قديم (Ancient)"        },
          { value: "medieval",     label: "قرون وسطى (Medieval)"  },
          { value: "renaissance",  label: "نهضة (Renaissance)"    },
          { value: "victorian",    label: "فيكتوري (Victorian)"   },
          { value: "1920s",        label: "العشرينات"             },
          { value: "noir-1940s",   label: "نوار الأربعينات"        },
          { value: "1970s",        label: "السبعينات"              },
          { value: "1980s",        label: "الثمانينات"             },
          { value: "modern",       label: "حديث (Modern)"          },
          { value: "near-future",  label: "مستقبل قريب"            },
          { value: "cyberpunk",    label: "Cyberpunk"              },
          { value: "post-apoc",    label: "Post-apocalyptic"       },
          { value: "space-opera",  label: "Space Opera"            },
        ],
        defaultValue: "modern",
      },
      {
        id: "genre",
        type: "button-group",
        label: "النوع السينمائي",
        options: [
          // The 14 genres Higgsfield ships visual thumbnails for.
          { value: "action",     label: "أكشن",     image: "/api/cdn/s/cast/genres/action.webp"    },
          { value: "adventure",  label: "مغامرة",   image: "/api/cdn/s/cast/genres/adventure.webp" },
          { value: "comedy",     label: "كوميدي",   image: "/api/cdn/s/cast/genres/comedy.webp"    },
          { value: "detective",  label: "تحقيق",    image: "/api/cdn/s/cast/genres/detective.webp" },
          { value: "drama",      label: "درامي",    image: "/api/cdn/s/cast/genres/drama.webp"     },
          { value: "fantasy",    label: "خيالي",    image: "/api/cdn/s/cast/genres/fantasy.webp"   },
          { value: "historical", label: "تاريخي",   image: "/api/cdn/s/cast/genres/historical.webp"},
          { value: "horror",     label: "رعب",      image: "/api/cdn/s/cast/genres/horror.webp"    },
          { value: "romance",    label: "رومانسي",  image: "/api/cdn/s/cast/genres/romance.webp"   },
          { value: "sci-fi",     label: "خيال علمي", image: "/api/cdn/s/cast/genres/sci-fi.webp"   },
          { value: "sitcom",     label: "سيتكوم",   image: "/api/cdn/s/cast/genres/sitcom.webp"    },
          { value: "thriller",   label: "إثارة",    image: "/api/cdn/s/cast/genres/thriller.webp"  },
          { value: "war",        label: "حرب",      image: "/api/cdn/s/cast/genres/war.webp"       },
          { value: "western",    label: "ويسترن",   image: "/api/cdn/s/cast/genres/western.webp"   },
          // Yilow-original extras
          { value: "noir",       label: "نوار"     },
          { value: "epic",       label: "ملحمي"    },
        ],
        defaultValue: "drama",
      },
      {
        id: "attractiveness",
        type: "slider",
        label: "الجاذبية / الـcharisma",
        hint:  "أعلى = wider appeal أكثر، أقل = vibe خام / واقعي",
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 7,
      },
      // ── Higgsfield Cast extras (optional) ─────────────────────
      {
        id: "hair_style",
        type: "button-group",
        label: "تسريحة الشعر (اختياري)",
        options: [
          { value: "short",       label: "قصير",      image: "/api/cdn/s/cast/hair_style/short.webp"       },
          { value: "medium",      label: "متوسط",     image: "/api/cdn/s/cast/hair_style/medium.webp"      },
          { value: "long",        label: "طويل",      image: "/api/cdn/s/cast/hair_style/long.webp"        },
          { value: "very_long",   label: "طويل جداً",  image: "/api/cdn/s/cast/hair_style/very_long.webp"   },
          { value: "bangs",       label: "غُرة",       image: "/api/cdn/s/cast/hair_style/bangs.webp"       },
          { value: "bun",         label: "كعكة",      image: "/api/cdn/s/cast/hair_style/bun.webp"         },
          { value: "ponytail",    label: "ذيل حصان",  image: "/api/cdn/s/cast/hair_style/ponytail.webp"    },
          { value: "afro",        label: "أفرو",      image: "/api/cdn/s/cast/hair_style/afro.webp"        },
          { value: "braids",      label: "ضفائر",     image: "/api/cdn/s/cast/hair_style/braids.webp"      },
          { value: "dreadlocks",  label: "Dreadlocks", image: "/api/cdn/s/cast/hair_style/readlocks.webp"  },
          { value: "messy",       label: "Messy",      image: "/api/cdn/s/cast/hair_style/messy.webp"      },
          { value: "slick_back",  label: "Slick back", image: "/api/cdn/s/cast/hair_style/slick_back.webp" },
          { value: "shave_sides", label: "Shave sides",image: "/api/cdn/s/cast/hair_style/shave_slides.webp"},
          { value: "undercut",    label: "Undercut",   image: "/api/cdn/s/cast/hair_style/undercat.webp"   },
          { value: "blade",       label: "حليق",      image: "/api/cdn/s/cast/hair_style/blade.webp"       },
        ],
      },
      {
        id: "hair_color",
        type: "button-group",
        label: "لون الشعر (اختياري)",
        options: [
          { value: "black",  label: "أسود",  image: "/api/cdn/s/cast/hair_color/black.webp"  },
          { value: "brown",  label: "بني",   image: "/api/cdn/s/cast/hair_color/brown.webp"  },
          { value: "blonde", label: "أشقر",  image: "/api/cdn/s/cast/hair_color/blonde.webp" },
          { value: "auburn", label: "كستنائي", image: "/api/cdn/s/cast/hair_color/auburn.webp" },
          { value: "red",    label: "أحمر",  image: "/api/cdn/s/cast/hair_color/red.webp"    },
          { value: "grey",   label: "رمادي", image: "/api/cdn/s/cast/hair_color/grey.webp"   },
          { value: "white",  label: "أبيض",  image: "/api/cdn/s/cast/hair_color/white.webp"  },
        ],
      },
      {
        id: "eye_color",
        type: "button-group",
        label: "لون العين (اختياري)",
        options: [
          { value: "brown",  label: "بني",  image: "/api/cdn/s/cast/eye_color_2/brown.webp"  },
          { value: "blue",   label: "أزرق", image: "/api/cdn/s/cast/eye_color_2/blue.webp"   },
          { value: "green",  label: "أخضر", image: "/api/cdn/s/cast/eye_color_2/green.webp"  },
          { value: "hazel",  label: "عسلي", image: "/api/cdn/s/cast/eye_color_2/hazel.webp"  },
          { value: "amber",  label: "كهرماني", image: "/api/cdn/s/cast/eye_color_2/ambar.webp" },
          { value: "gray",   label: "رمادي", image: "/api/cdn/s/cast/eye_color_2/gray.webp"  },
        ],
      },
      {
        id: "outfit",
        type: "button-group",
        label: "اللبس (اختياري)",
        options: [
          { value: "casual",      label: "كاجوال",     image: "/api/cdn/s/cast/outfit/casual.webp"      },
          { value: "formal",      label: "رسمي",       image: "/api/cdn/s/cast/outfit/formal.webp"      },
          { value: "sporty",      label: "رياضي",      image: "/api/cdn/s/cast/outfit/sporty.webp"      },
          { value: "highfashion", label: "High fashion", image: "/api/cdn/s/cast/outfit/highfashion.webp" },
          { value: "military",    label: "عسكري",      image: "/api/cdn/s/cast/outfit/military.webp"    },
          { value: "workwear",    label: "Workwear",   image: "/api/cdn/s/cast/outfit/workwear.webp"    },
          { value: "vintage",     label: "Vintage",    image: "/api/cdn/s/cast/outfit/vintage.webp"     },
          { value: "punk",        label: "Punk",       image: "/api/cdn/s/cast/outfit/pank.webp"        },
        ],
      },
      {
        id: "beard",
        type: "button-group",
        label: "لحية (اختياري — للذكور)",
        options: [
          { value: "clean-shaven", label: "حليق",       image: "/api/cdn/s/cast/beard/clean-shaven.webp" },
          { value: "stubble",      label: "Stubble",    image: "/api/cdn/s/cast/beard/stubble.webp"      },
          { value: "short_beard",  label: "لحية قصيرة", image: "/api/cdn/s/cast/beard/short_beard.webp"  },
          { value: "beard",        label: "لحية كاملة", image: "/api/cdn/s/cast/beard/beard.webp"        },
          { value: "long_beard",   label: "لحية طويلة", image: "/api/cdn/s/cast/beard/long_beard.webp"   },
          { value: "mustache",     label: "شارب",       image: "/api/cdn/s/cast/beard/mustache.webp"     },
        ],
      },
      {
        id: "beard_color",
        type: "button-group",
        label: "لون اللحية (اختياري)",
        hint:  "يطبّق فقط لو فيه لحية — للذكور",
        options: [
          { value: "black",       label: "أسود",   image: "/api/cdn/s/cast/beard_color/black.webp"       },
          { value: "brown",       label: "بني",    image: "/api/cdn/s/cast/beard_color/brown.webp"       },
          { value: "light-brown", label: "بني فاتح", image: "/api/cdn/s/cast/beard_color/light-brown.webp" },
          { value: "auburn",      label: "كستنائي", image: "/api/cdn/s/cast/beard_color/auburn.webp"     },
          { value: "red",         label: "أحمر",   image: "/api/cdn/s/cast/beard_color/red.webp"         },
          { value: "gray",        label: "رمادي",  image: "/api/cdn/s/cast/beard_color/gray.webp"        },
          { value: "white",       label: "أبيض",   image: "/api/cdn/s/cast/beard_color/white.webp"       },
        ],
      },
      {
        id: "hair_type",
        type: "button-group",
        label: "نسيج الشعر (اختياري)",
        options: [
          { value: "straight", label: "أملس",   image: "/api/cdn/s/cast/hair_type/straight.webp" },
          { value: "wavy",     label: "مموّج",  image: "/api/cdn/s/cast/hair_type/wavy.webp"     },
          { value: "curly",    label: "مجعّد",  image: "/api/cdn/s/cast/hair_type/curly.webp"    },
          { value: "coily",    label: "كثيف",  image: "/api/cdn/s/cast/hair_type/coily.webp"    },
        ],
      },
      {
        id: "imperfections",
        type: "button-group",
        label: "ملامح مميزة (اختياري)",
        options: [
          { value: "none",         label: "لا شيء" },
          { value: "freckles",     label: "نمش",       image: "/api/cdn/s/cast/imperfections/freckless.webp" },
          { value: "facial_scar",  label: "ندبة وجه",   image: "/api/cdn/s/cast/imperfections/facial_scar.webp" },
          { value: "tattoos",      label: "تاتو",      image: "/api/cdn/s/cast/imperfections/tattoos.webp" },
          { value: "eye_patch",    label: "Eye patch",  image: "/api/cdn/s/cast/imperfections/eye_patch.webp" },
        ],
      },
    ],
    customRunner: {
      // The cast workspace composes a richly-structured English
      // prompt from the 14 fields and submits through nano-banana-pro
      // via /api/tools/cinema-cast.
      endpoint:    "/api/tools/cinema-cast",
      paramMap: {
        full_name:      "full_name",
        description:    "description",
        archetype:      "archetype",
        gender:         "gender",
        body_type:      "body_type",
        era:            "era",
        genre:          "genre",
        attractiveness: "attractiveness",
        hair_style:     "hair_style",
        hair_color:     "hair_color",
        hair_type:      "hair_type",
        eye_color:      "eye_color",
        outfit:         "outfit",
        beard:          "beard",
        beard_color:    "beard_color",
        imperfections:  "imperfections",
      },
    },
  },

  // ── Soul Studio counterparts ─────────────────────────────────────────
  {
    id: "soul-cast",
    title: "Soul: مولّد شخصيات",
    desc: "ابني شخصية بـportrait stamp جاهز للاستخدام كـSoul ID — clean studio + identity preservation.",
    icon: Users,
    image: "/tool-thumbnails/soul-cinema.png",
    credits: 6,
    isNew: true,
    layout: "centered",
    inputs: [
      {
        id: "full_name",
        type: "prompt",
        label: "اسم الشخصية",
        placeholder: "مثال: نورة، Sarah Chen، أحمد المصري…",
        required: true,
      },
      {
        id: "description",
        type: "prompt",
        label: "وصف قصير",
        placeholder: "مثال: مذيعة بودكاست هادئة في الثلاثينات، تركيز عميق وثقة دافئة",
        required: true,
      },
      {
        id: "archetype",
        type: "button-group",
        label: "Archetype",
        options: [
          { value: "hero",       label: "بطل (Hero)",         image: "/api/cdn/s/cast/archetype/hero.webp"        },
          { value: "everyman",   label: "عادي (Everyman)",    image: "/api/cdn/s/cast/archetype/everyman.webp"    },
          { value: "innocent",   label: "بريء (Innocent)",    image: "/api/cdn/s/cast/archetype/innocent.webp"    },
          { value: "explorer",   label: "مستكشف (Explorer)",  image: "/api/cdn/s/cast/archetype/expolrer.webp"    },
          { value: "ruler",      label: "حاكم (Ruler)",       image: "/api/cdn/s/cast/archetype/ruler.webp"       },
          { value: "creator",    label: "مبدع (Creator)",     image: "/api/cdn/s/cast/archetype/creator.webp"     },
          { value: "rebel",      label: "متمرّد (Rebel)",     image: "/api/cdn/s/cast/archetype/rebel.webp"       },
          { value: "lover",      label: "مُحبّ (Lover)",      image: "/api/cdn/s/cast/archetype/lover.webp"       },
          { value: "sage",       label: "حكيم (Sage)"  /* no Higgsfield thumbnail */ },
          { value: "jester",     label: "مهرّج (Jester)",     image: "/api/cdn/s/cast/archetype/jester.webp"      },
          { value: "magician",   label: "ساحر (Magician)",    image: "/api/cdn/s/cast/archetype/magician-upd.webp"},
          { value: "caregiver",  label: "راعي (Caregiver)",   image: "/api/cdn/s/cast/archetype/caregiver.webp"   },
          { value: "antihero",   label: "بطل مضاد (Antihero)" },
          { value: "villain",    label: "شرير (Villain)"      },
          { value: "mentor",     label: "موجّه (Mentor)"      },
          { value: "trickster",  label: "ماكر (Trickster)"    },
        ],
        defaultValue: "everyman",
      },
      {
        id: "gender",
        type: "button-group",
        label: "الجنس",
        options: [
          { value: "female",     label: "أنثى",     image: "/api/cdn/s/cast/female.webp" },
          { value: "male",       label: "ذكر",      image: "/api/cdn/s/cast/male.webp"   },
          { value: "non-binary", label: "غير ثنائي" },
        ],
        defaultValue: "female",
      },
      {
        id: "body_type",
        type: "button-group",
        label: "نوع الجسم",
        options: [
          { value: "slim",      label: "نحيف",  image: "/api/cdn/s/cast/body_type/slim.webp"      },
          { value: "lean",      label: "رشيق",  image: "/api/cdn/s/cast/body_type/lean.webp"      },
          { value: "average",   label: "متوسط", image: "/api/cdn/s/cast/body_type/average.webp"   },
          { value: "muscular",  label: "عضلي",  image: "/api/cdn/s/cast/body_type/muscular.webp"  },
          { value: "stocky",    label: "متين",  image: "/api/cdn/s/cast/body_type/stocky.webp"    },
          { value: "plus_size", label: "ضخم",   image: "/api/cdn/s/cast/body_type/plus_size.webp" },
          { value: "athletic",  label: "رياضي" },
          { value: "curvy",     label: "ممتلئ" },
        ],
        defaultValue: "average",
      },
      {
        id: "age_range",
        type: "button-group",
        label: "السن",
        options: [
          { value: "teen",     label: "مراهق"  },
          { value: "20s",      label: "٢٠ها"   },
          { value: "30s",      label: "٣٠ها"   },
          { value: "40s",      label: "٤٠ها"   },
          { value: "50s",      label: "٥٠ها"   },
          { value: "60-plus",  label: "٦٠+"   },
        ],
        defaultValue: "30s",
      },
      {
        id: "hair_style",
        type: "button-group",
        label: "تسريحة الشعر",
        // The 15 hair styles Higgsfield ships visual thumbnails for.
        options: [
          { value: "short",         label: "قصير",      image: "/api/cdn/s/cast/hair_style/short.webp"        },
          { value: "medium",        label: "متوسط",     image: "/api/cdn/s/cast/hair_style/medium.webp"       },
          { value: "long",          label: "طويل",      image: "/api/cdn/s/cast/hair_style/long.webp"         },
          { value: "very_long",     label: "طويل جداً",  image: "/api/cdn/s/cast/hair_style/very_long.webp"    },
          { value: "bangs",         label: "غُرة",       image: "/api/cdn/s/cast/hair_style/bangs.webp"        },
          { value: "bun",           label: "كعكة",      image: "/api/cdn/s/cast/hair_style/bun.webp"          },
          { value: "ponytail",      label: "ذيل حصان",  image: "/api/cdn/s/cast/hair_style/ponytail.webp"     },
          { value: "afro",          label: "أفرو",      image: "/api/cdn/s/cast/hair_style/afro.webp"         },
          { value: "braids",        label: "ضفائر",     image: "/api/cdn/s/cast/hair_style/braids.webp"       },
          { value: "dreadlocks",    label: "Dreadlocks", image: "/api/cdn/s/cast/hair_style/readlocks.webp"   },
          { value: "messy",         label: "Messy",      image: "/api/cdn/s/cast/hair_style/messy.webp"       },
          { value: "slick_back",    label: "Slick back", image: "/api/cdn/s/cast/hair_style/slick_back.webp"  },
          { value: "shave_sides",   label: "Shave sides",image: "/api/cdn/s/cast/hair_style/shave_slides.webp"},
          { value: "undercut",      label: "Undercut",   image: "/api/cdn/s/cast/hair_style/undercat.webp"    },
          { value: "blade",         label: "حليق",      image: "/api/cdn/s/cast/hair_style/blade.webp"        },
        ],
      },
      {
        id: "ethnicity_hint",
        type: "button-group",
        label: "العِرق / المنطقة",
        // Higgsfield ships 6 identity buckets — same set per gender.
        // We surface the female variant in the picker for visual
        // consistency; the executor uses just the slug for the
        // composed prompt.
        options: [
          { value: "asian",    label: "آسيوي",  image: "/api/cdn/s/cast/female-identity/asian.webp"    },
          { value: "black",    label: "أفريقي", image: "/api/cdn/s/cast/female-identity/black.webp"    },
          { value: "european", label: "أوروبي", image: "/api/cdn/s/cast/female-identity/european.webp" },
          { value: "hindi",    label: "هندي",   image: "/api/cdn/s/cast/female-identity/hindi.webp"    },
          { value: "latina",   label: "لاتيني", image: "/api/cdn/s/cast/female-identity/latina.webp"   },
          { value: "mixed",    label: "مختلط",  image: "/api/cdn/s/cast/female-identity/mixed.webp"    },
        ],
      },
      {
        id: "num_images",
        type: "counter",
        label: "عدد البورتريهات",
        hint: "هتتولّد بالتوازي — كلهم لنفس الشخصية بـvariation خفيف في الوضعية",
        min: 1, max: 4, step: 1, defaultValue: 1,
      },
    ],
    customRunner: {
      endpoint: "/api/tools/soul-cast",
      paramMap: {
        full_name:      "full_name",
        description:    "description",
        archetype:      "archetype",
        gender:         "gender",
        body_type:      "body_type",
        age_range:      "age_range",
        hair_style:     "hair_style",
        ethnicity_hint: "ethnicity_hint",
        num_images:     "num_images",
      },
    },
  },

  {
    id: "soul-location",
    title: "Soul: مولّد أماكن",
    desc: "اكتب اسم المكان، نولّد لوحة خلفية نظيفة للـcompositing مع Soul IDs.",
    icon: MapPin,
    image: "/tool-thumbnails/soul-cinema.png",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      {
        id: "location_name",
        type: "prompt",
        label: "اسم المكان أو وصفه",
        placeholder: "مثال: مقهى دمشقي قديم، شاطئ خليجي عند الغروب، شارع طوكيو ليلاً…",
        required: true,
      },
      {
        id: "style",
        type: "style-picker",
        label: "ستايل المكان",
        options: IMAGE_STYLES,
        defaultValue: "realistic",
        hint: "اختياري — يحدد المزاج البصري للخلفية",
      },
      {
        id: "aspect_ratio",
        type: "ratio-picker",
        label: "نسبة الأبعاد",
        options: [
          { value: "16:9", label: "16:9 سينمائي", aspect: [16, 9] },
          { value: "21:9", label: "21:9 ألترا" },
          { value: "9:16", label: "9:16 عمودي",  aspect: [9, 16] },
          { value: "3:2",  label: "3:2",          aspect: [3, 2]  },
          { value: "2:3",  label: "2:3",          aspect: [2, 3]  },
          { value: "1:1",  label: "1:1 مربع",     aspect: [1, 1]  },
        ],
        defaultValue: "16:9",
      },
      {
        id: "num_images",
        type: "counter",
        label: "عدد اللوحات",
        min: 1, max: 4, step: 1, defaultValue: 1,
      },
    ],
    customRunner: {
      endpoint: "/api/tools/soul-location",
      paramMap: {
        location_name: "location_name",
        style:         "style",
        aspect_ratio:  "aspect_ratio",
        num_images:    "num_images",
      },
    },
  },

  // ── Viral Effect Apps ────────────────────────────────────────────
  // 10 single-tap viral effects mirroring the reference platform's
  // most popular `/apps/*` slugs. Each is a thin wrapper over
  // nano-banana-pro-edit with a hand-written prompt template baked in
  // via `staticPayload`. The user just uploads a photo and runs.
  // Cost: 4 credits per render (matches the reference's per-effect tier).

  {
    id: "plushies",
    title: "Plushie",
    desc: "حوّل صورتك لـcute plushie / دمية soft toy.",
    icon: Heart,
    image: "/api/cdn/c/application_main/29dc499c-84a0-43c3-8c6b-1e278a6cc474.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true,
        hint: "أحسن نتيجة مع شخص أو حيوان واضح" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Transform into an adorable plushie / soft-toy version of the subject. " +
          "Fluffy felt and minky fabric texture, embroidered eyes and mouth, " +
          "huggable chunky proportions, soft pastel palette, clean studio surface, " +
          "soft directional studio lighting, vinyl-toy collectible aesthetic. " +
          "Preserve identity, costume, and pose. 8K finishing.",
        aspect_ratio: "1:1",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "comic-book-effect",
    title: "Comic Book",
    desc: "حوّل صورتك لـcomic strip panel بأسلوب action.",
    icon: BookOpen,
    image: "/api/cdn/c/application_main/2e53be4f-3594-47ce-a5f6-89c627d14be6.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Transform into a vivid American comic-book panel illustration. " +
          "Bold black inked outlines, halftone Ben-Day dots, saturated 4-color palette, " +
          "speech-bubble-ready negative space, dynamic action pose, dramatic Dutch angle, " +
          "Marvel-style shading and impact effects. " +
          "Preserve identity and likeness. 8K finishing, no text overlays.",
        aspect_ratio: "3:4",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "gtai",
    title: "GTAI 🎮",
    desc: "حوّل صورتك لـloading-screen ستايل لعبة GTA.",
    icon: Gamepad2,
    image: "/api/cdn/c/application_main/da91da29-9fc7-41fd-a99d-b07e4bb010b6.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Transform into a GTA-style loading-screen character art. " +
          "Bold cel-shaded illustration with thick black outlines, exaggerated proportions, " +
          "stylized open-world urban backdrop, swagger pose, sunglasses + chain detail, " +
          "vibrant saturated palette, hand-painted texture, 2D game-cover aesthetic. " +
          "Preserve identity and pose. Vertical 3:4 framing. No text overlays.",
        aspect_ratio: "3:4",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "ai-headshot",
    title: "AI Headshot 💼",
    desc: "حوّل سيلفي لـheadshot احترافي ستوديو quality.",
    icon: Camera,
    image: "/api/cdn/c/application_main/fb84f803-64b0-4259-b9a3-b2fc57073da4.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع سيلفي", accept: "image/*", required: true,
        hint: "أحسن نتيجة مع صورة وجه واضحة وإضاءة جيدة" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Transform into a polished corporate headshot. " +
          "Three-quarter framing, clean neutral grey or soft gradient background, " +
          "professional studio lighting (large softbox key + subtle rim), " +
          "tailored business attire suited to the subject's vibe, confident composed expression, " +
          "natural skin retouching with retained texture, executive magazine quality. " +
          "Preserve facial identity precisely. 8K finishing.",
        aspect_ratio: "3:4",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "meme-effect",
    title: "Meme Generator 😂",
    desc: "حوّل صورتك لـmeme فايرل بستايل تيك توك / تويتر.",
    icon: Smile,
    image: "/api/cdn/c/application_main/5600ef95-0305-4b8a-b407-dfa6f5d1f73d.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true },
      { id: "vibe", type: "prompt", label: "وصف الـmeme أو المزاج (اختياري)",
        placeholder: "مثال: shocked Pikachu face، disaster girl، side-eye dog…",
        attachments: { accept: "image/*", max: 0 } },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", vibe: "prompt" },
      staticPayload: {
        // The user's `vibe` is appended automatically by buildPayload
        // when paramMap maps it to `prompt` — but we provide a default
        // when they leave it empty.
        aspect_ratio: "1:1",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "mugshot",
    title: "Mugshot 👮",
    desc: "حوّل صورتك لـmugshot شرطة بستايل crime show.",
    icon: ShieldAlert,
    image: "/api/cdn/c/application_main/c75be66a-b6a9-4cfb-add1-d2a98fa78080.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Transform into a classic police-station mugshot photograph. " +
          "Plain pale grey backdrop with height markers, harsh fluorescent overhead lighting, " +
          "front-facing deadpan expression, slight slouch, casual clothes (no formal attire), " +
          "crime-show production-photo aesthetic, slight police-camera tonal flatness. " +
          "Preserve facial identity. Square framing. No date stamps, no text overlays.",
        aspect_ratio: "1:1",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "color-grading",
    title: "Color Grading 🎨",
    desc: "طبّق color grade سينمائي على صورتك بدون تعديل الشكل.",
    icon: Palette,
    image: "/api/cdn/c/application_main/ff6c6ba0-3c47-416a-a473-e2b2bd425160.mp4",
    credits: 3,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true },
      { id: "grade", type: "button-group", label: "نوع الـgrade",
        options: [
          { value: "teal-orange",  label: "Teal & Orange" },
          { value: "bleach-bypass", label: "Bleach Bypass" },
          { value: "kodachrome",   label: "Kodachrome" },
          { value: "cyberpunk",    label: "Cyberpunk Neon" },
          { value: "noir-bw",      label: "Noir B&W" },
          { value: "warm-vintage", label: "Warm Vintage" },
        ],
        defaultValue: "teal-orange" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", grade: "prompt" },
      staticPayload: {
        // Grade picker writes a short slug into `prompt` — the muapi
        // executor stitches it into the final call. To make the prompt
        // human-grade we'd need a workspace-level translator; for the
        // batch MVP we rely on the model understanding the slug.
        aspect_ratio: "auto",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "j-magazine",
    title: "Japanese Magazine 🇯🇵",
    desc: "حوّل صورتك لـcover ستايل مجلة يابانية fashion.",
    icon: ImageIcon,
    image: "/api/cdn/c/application_main/030c784c-6618-430b-a4d6-e024e9f7973e.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Transform into a Japanese fashion magazine cover layout. " +
          "Editorial portrait composition, vertical 3:4 framing, soft pastel-and-pop palette, " +
          "Tokyo street fashion styling, gentle film grain, magazine paper-stock texture, " +
          "clean negative space at the top for an imagined masthead and at the side for " +
          "imagined cover lines. Preserve facial identity. " +
          "No actual text, no logos — just the composition.",
        aspect_ratio: "3:4",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "mukbang-effect",
    title: "Mukbang 🍜",
    desc: "حوّل صورتك لـmukbang show بـcrash zoom على طعام.",
    icon: Utensils,
    image: "/api/cdn/c/application_main/77335af7-3bf5-4491-bf12-4b695ec524b1.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true },
      { id: "food", type: "prompt", label: "نوع الأكل (اختياري)",
        placeholder: "مثال: spicy noodles، sushi roll، fried chicken bucket" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", food: "prompt" },
      staticPayload: {
        aspect_ratio: "9:16",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "renaissance",
    title: "Renaissance 🖼️",
    desc: "حوّل صورتك لـoil painting بستايل عصر النهضة.",
    icon: Drama,
    image: "/api/cdn/c/application_main/ff6c6ba0-3c47-416a-a473-e2b2bd425160.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Transform into a Renaissance-era oil painting in the style of the 15th–17th century European masters. " +
          "Rich chiaroscuro lighting, dramatic single-source key like a candle, " +
          "deep velvet draperies in burgundy and gold, classical period costume, " +
          "painterly visible brushwork, museum-grade aged canvas texture, " +
          "soft sfumato edges, mahogany frame implied at the edges. " +
          "Preserve facial identity. 8K finishing.",
        aspect_ratio: "3:4",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  // ── Tier 1 Viral Effects — POV / Creature / Surreal ────────────────────────

  {
    id: "sand-worm",
    title: "Sand Worm 🐉",
    desc: "ابتلاع POV من جوف ديدان رمل ضخمة، فك مفتوح ملايين الأسنان.",
    icon: Drama,
    image: "/api/cdn/c/application_main/sand-worm.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة المكان أو الشخصية", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Transform into a cinematic Dune-style sand-worm POV swallow scene. " +
          "Massive desert sand worm bursting up from below with cavernous open maw, " +
          "rows of crystalline teeth, swirling sand vortex around the throat, " +
          "low-angle hero shot looking up into the mouth, bright desert sun rim-lighting the silhouette, " +
          "orange-amber Arrakis color grade, photographic 35 mm anamorphic style, " +
          "hyper-real texture on sand grains. Preserve the original subject in frame. 16:9 wide.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "storm-creature",
    title: "Storm Creature ⚡",
    desc: "حوّل صورتك لمخلوق العاصفة — كائن مصنوع من برق وغيوم.",
    icon: CloudLightning,
    image: "/api/cdn/c/application_main/storm-creature.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Reimagine the subject as a colossal storm creature — towering humanoid silhouette composed of swirling thunder clouds, " +
          "veins of blue-white lightning crackling across the body, eyes glowing with electric plasma, " +
          "torrential rain streaks below the figure, dramatic low-angle hero composition, " +
          "ominous dark teal sky, godrays slicing through the storm. " +
          "Preserve facial features inside the cloud-form. Cinematic 16:9, 8K detail on lightning filaments.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "magic-button",
    title: "Magic Button ✨",
    desc: "كبسة زر سحرية بتغيّر العالم حواليك — POV ساحر.",
    icon: MousePointer,
    image: "/api/cdn/c/application_main/magic-button.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
      { id: "transform", type: "prompt", label: "نتيجة الكبسة (اختياري)",
        placeholder: "مثال: المدينة بتتقلب لـcyberpunk neon" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", transform: "prompt" },
      staticPayload: {
        prompt:
          "Subject pressing a glowing magical button — sudden reality-warp moment, " +
          "concentric shock-wave of golden light radiating from the fingertip, " +
          "the surrounding scene visibly cracking and re-forming into a new world, " +
          "split-second of duality between old and new environment, " +
          "cinematic POV close-up of the hand and button, particle sparkles, lens flare. 16:9.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "cloud-surf",
    title: "Cloud Surf ☁️",
    desc: "اركب موجة من السحاب فوق المدينة — POV هوائي.",
    icon: Cloud,
    image: "/api/cdn/c/application_main/cloud-surf.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Subject surfing on a wave of soft cumulus clouds high above a sprawling city skyline. " +
          "Golden-hour sun catching the cloud edges, motion-blur trailing behind the surfboard-shaped cloud, " +
          "wide aerial cinematic composition, the city below tilted on the horizon, " +
          "Studio-Ghibli–meets-Marvel vibe, photoreal but dreamlike. " +
          "Preserve facial identity. 16:9 anamorphic.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "skibidi",
    title: "Skibidi 🚽",
    desc: "وش بيطلع من تواليت — meme effect شهير.",
    icon: Drama,
    image: "/api/cdn/c/application_main/skibidi.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة الوش", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Place the subject's head emerging out of an open ceramic toilet bowl in a clean tiled bathroom. " +
          "Mid-shot framing, the bowl rim at chin level, exaggerated cartoonish meme expression, " +
          "bright bathroom lighting, slight fish-eye distortion for comedic POV, " +
          "tiled wall background. Preserve facial identity. Square 1:1 composition for social-meme reuse.",
        aspect_ratio: "1:1",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "urban-cuts",
    title: "Urban Cuts ✂️",
    desc: "POV قص شعر من حلاق شارع نيويوركي — fast cuts.",
    icon: Scissors,
    image: "/api/cdn/c/application_main/urban-cuts.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Subject seated in a classic urban barber-shop chair, large mirror behind, " +
          "barber's clippers and scissors mid-action around the head, " +
          "warm tungsten salon lighting, vintage neon barber-pole reflection in the mirror, " +
          "documentary close-up framing, slight motion-blur on the clippers. " +
          "Preserve facial identity. Editorial 4:5 portrait composition.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "nano-strike",
    title: "Nano Strike 💥",
    desc: "ضربة سريعة من شخصية نانوية — POV قتالي.",
    icon: Zap,
    image: "/api/cdn/c/application_main/nano-strike.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة الشخصية", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Action hero-style strike moment — the subject in dynamic mid-air kick or punch pose, " +
          "freeze-frame of impact with concentric energy shock-wave radiating outward, " +
          "neon-electric particles trailing the limb, motion-blur on the moving parts but pin-sharp on the face, " +
          "low-angle dramatic camera, dark moody industrial backdrop with rim lighting. " +
          "Preserve facial identity. Wide 16:9 cinematic.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "nano-theft",
    title: "Nano Theft 🦹",
    desc: "POV لصوص نانو سرقة سريعة من قلب حركة.",
    icon: ShieldAlert,
    image: "/api/cdn/c/application_main/nano-theft.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Stylish heist moment — subject grabbing a glowing object mid-run, " +
          "shallow depth-of-field tracking shot, neon-noir alley backdrop, " +
          "rain-slicked pavement reflecting purple-and-cyan lights, " +
          "dynamic Dutch tilt angle, motion-blur streaks on the periphery while the face stays sharp. " +
          "Preserve facial identity. Cinematic 21:9 letterbox feel inside a 16:9 frame.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "roller-coaster",
    title: "Roller Coaster 🎢",
    desc: "POV من قمة قطار الموت — صراخ وريح.",
    icon: Waves,
    image: "/api/cdn/c/application_main/roller-coaster.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة الراكب", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "First-row POV on a giant roller-coaster at the very top of the first drop. " +
          "Subject in the front seat with hands up and exaggerated screaming/laughing expression, " +
          "the track plunging down into a tiny park below, wide blue sky, " +
          "wind-blown hair, slight wide-angle lens distortion, sun flare. " +
          "Preserve facial identity. 16:9 immersive.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "sketch-to-real",
    title: "Sketch → Real ✏️",
    desc: "حوّل رسمك (sketch / line-art) لصورة واقعية.",
    icon: Pencil,
    image: "/api/cdn/c/application_main/sketch-to-real.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الـsketch", accept: "image/*", required: true },
      { id: "vibe", type: "button-group", label: "الستايل المطلوب",
        options: [
          { value: "photoreal",    label: "Photorealistic" },
          { value: "concept-art",  label: "Concept Art" },
          { value: "anime",        label: "Anime" },
          { value: "oil-painting", label: "Oil Painting" },
        ],
        defaultValue: "photoreal" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", vibe: "prompt" },
      staticPayload: {
        // The vibe slug is appended to the prompt by the muapi executor; the
        // model interprets the slug directly. Sketch references should be
        // followed precisely for composition, only the rendering style changes.
        aspect_ratio: "auto",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  // ── Tier 2 Viral Effects — Brand / Commerce ───────────────────────────────

  {
    id: "billboard",
    title: "Billboard 🏙️",
    desc: "حط منتجك أو شخصيتك على بيلبورد ضخم في وسط المدينة.",
    icon: Frame,
    image: "/api/cdn/c/application_main/billboard.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة المنتج / الشخصية", accept: "image/*", required: true },
      { id: "city", type: "prompt", label: "المدينة (اختياري)",
        placeholder: "مثال: Times Square نيويورك، شارع تشي تشي تشي طوكيو، Dubai Marina" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", city: "prompt" },
      staticPayload: {
        prompt:
          "Composite the uploaded subject onto a massive city-center billboard. " +
          "Wide hero shot of the billboard from street level, dense surrounding skyscrapers, " +
          "evening blue-hour with the billboard's LED glow lighting the buildings, " +
          "yellow taxis or local equivalent traffic in the foreground, atmospheric haze, " +
          "photographic 35 mm look, deep crisp detail on the billboard art. 16:9.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "packshot",
    title: "Packshot 📦",
    desc: "صورة استوديو نظيفة لمنتجك على خلفية بيضاء.",
    icon: Box,
    image: "/api/cdn/c/application_main/packshot.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع المنتج", accept: "image/*", required: true },
      { id: "bg", type: "button-group", label: "الخلفية",
        options: [
          { value: "white",    label: "أبيض نقي" },
          { value: "gradient", label: "جراديانت" },
          { value: "black",    label: "أسود استوديو" },
          { value: "pastel",   label: "باستيل" },
        ],
        defaultValue: "white" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", bg: "prompt" },
      staticPayload: {
        prompt:
          "Clean studio packshot of the product. Centered hero composition, soft three-point softbox lighting " +
          "with subtle gradient falloff, sharp catchlights on glossy surfaces, ground-shadow contact, " +
          "Amazon/Shopify-grade product photography standard, no props, no human hands, " +
          "preserve product geometry, labels, and colours exactly. 1:1 square.",
        aspect_ratio: "1:1",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "kick-ad",
    title: "Kick Ad 👟",
    desc: "ركلة سريعة بتدخل المنتج في الكادر — ad shot ديناميكي.",
    icon: Zap,
    image: "/api/cdn/c/application_main/kick-ad.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع المنتج", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Dynamic ad shot — a sneaker / shoe kicking the product into frame from the side. " +
          "Freeze-frame of the impact, dust burst around the contact, " +
          "motion-blur trailing the foot but pin-sharp on the product, " +
          "studio backdrop with a bold pop-color gradient (orange or electric blue), " +
          "low-angle hero composition. 16:9 commercial ad aspect.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "truck-ad",
    title: "Truck Ad 🚛",
    desc: "إعلان منتجك على جانب شاحنة متحركة.",
    icon: Frame,
    image: "/api/cdn/c/application_main/truck-ad.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة المنتج / الإعلان", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Composite the artwork as the full side-panel print of a moving commercial truck or trailer. " +
          "Highway shot with motion-blur on the wheels and ground, sun catching the truck's glossy paint, " +
          "shallow depth-of-field background of road and distant scenery, " +
          "wide cinematic 16:9 composition, photographic realism. Preserve artwork colours and detail.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "fridge-ad",
    title: "Fridge Reveal 🥤",
    desc: "كشف منتجك من جوة ثلاجة تتفتح — مشروبات/أكل.",
    icon: Box,
    image: "/api/cdn/c/application_main/fridge-ad.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع المنتج", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Fridge-reveal product ad. The product sits prominently on the centre shelf of an open refrigerator, " +
          "soft cold light spilling out, condensation droplets on the bottle/can/packaging, " +
          "subtle fog of cold air drifting toward the camera, " +
          "rest of the fridge slightly out of focus, " +
          "low-angle hero composition, photographic 50 mm look. 4:5 portrait ad framing.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "vending-machine",
    title: "Vending Machine 🥫",
    desc: "ضع منتجك جوة ماكينة بيع — POV حنين.",
    icon: Box,
    image: "/api/cdn/c/application_main/vending-machine.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع المنتج", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Tokyo-style street vending machine at night, the uploaded product featured behind the glass " +
          "in the centre column, illuminated by the vending machine's internal fluorescent glow. " +
          "Rainy alley reflection on the wet pavement in foreground, neon signs softly bokeh'd, " +
          "cool blue ambient with warm machine glow contrast, " +
          "front-on documentary framing, 4:5 portrait aspect.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "volcano-ad",
    title: "Volcano Ad 🌋",
    desc: "منتجك في قلب منظر بركاني درامي.",
    icon: Pyramid,
    image: "/api/cdn/c/application_main/volcano-ad.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع المنتج", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Epic volcanic-landscape product hero shot. The product placed on a basalt rock in the foreground, " +
          "actively erupting volcano in the mid-ground with lava fountains and ash plumes lit orange-red, " +
          "dark moody clouds, smoke drifting across, glowing rim-light on the product from the lava, " +
          "wide 16:9 cinematic composition, photoreal 35 mm anamorphic style.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "graffiti-ad",
    title: "Graffiti Ad 🎨",
    desc: "حوّل إعلانك لجرافيتي ضخم على حيطة شارع.",
    icon: Palette,
    image: "/api/cdn/c/application_main/graffiti-ad.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الإعلان / المنتج", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Render the uploaded artwork as a full-wall street-graffiti mural on an urban brick or concrete facade. " +
          "Hand-painted spray-paint texture with drips and stencil edges, paint over real wall imperfections, " +
          "wide angle street-level photograph, mild perspective distortion, " +
          "passing pedestrian silhouettes for scale, golden-hour street lighting, " +
          "photoreal 35 mm documentary look. 16:9.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "signboard",
    title: "Roadside Sign 🛣️",
    desc: "إعلانك كـsignboard جنب الطريق السريع.",
    icon: Frame,
    image: "/api/cdn/c/application_main/signboard.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الإعلان", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Composite the artwork as a large rectangular roadside billboard / signboard alongside a desert highway. " +
          "Sunset golden-hour light raking across the sign, long shadow on the asphalt, " +
          "vanishing-point perspective with the road stretching to the horizon, " +
          "occasional power-poles, deep cyan-magenta sky gradient. 16:9 cinematic.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "giant-product",
    title: "Giant Product 🏛️",
    desc: "منتجك بحجم ضخم وسط مدينة أو منظر طبيعي.",
    icon: Pyramid,
    image: "/api/cdn/c/application_main/giant-product.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع المنتج", accept: "image/*", required: true },
      { id: "scene", type: "prompt", label: "المكان (اختياري)",
        placeholder: "مثال: وسط ميدان عام، فوق جبل، على شاطئ" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", scene: "prompt" },
      staticPayload: {
        prompt:
          "Surreal oversized product composition — the product scaled to the size of a building, " +
          "placed prominently in a real-world environment. Pedestrians and cars at the base for scale, " +
          "photoreal lighting matching the scene's sun direction, " +
          "subtle ground-shadow contact and atmospheric perspective on the product's far side, " +
          "wide 16:9 hero composition.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "macroshot-product",
    title: "Macro Product 🔬",
    desc: "ماكرو شوت تفصيلي لتفاصيل المنتج.",
    icon: Aperture,
    image: "/api/cdn/c/application_main/macroshot-product.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع المنتج", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Extreme macro photograph of the product, focused on the most visually-rich detail — " +
          "texture / stitching / label-print / liquid surface / ingredient texture. " +
          "Razor-thin depth-of-field with creamy bokeh fall-off, " +
          "perfect studio rim-light catching the surface micro-detail, " +
          "no surrounding clutter, hyper-real 100 mm macro lens look. 1:1 square.",
        aspect_ratio: "1:1",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "macroshot-scene",
    title: "Macro Scene 🌿",
    desc: "ماكرو شوت لجزء من المشهد حوالين المنتج.",
    icon: Aperture,
    image: "/api/cdn/c/application_main/macroshot-scene.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع المنتج / الصورة", accept: "image/*", required: true },
      { id: "subject", type: "prompt", label: "تركيز الماكرو (اختياري)",
        placeholder: "مثال: قطرة مياه على ورقة، تكستشر الجلد، حبيبات السكر" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", subject: "prompt" },
      staticPayload: {
        prompt:
          "Macro detail of the scene surrounding the product — a sensory close-up that complements the product. " +
          "Water droplets, surface textures, fabric fibers, food ingredients, dust motes in light, " +
          "shallow depth-of-field, soft natural-window lighting, photographic colour science, " +
          "evokes a tactile premium ad mood. 16:9.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  // ── Tier 3 Viral Effects — 3D / format ────────────────────────────────────

  {
    id: "3d-figure",
    title: "3D Figurine 🧸",
    desc: "حوّل صورتك لـcollectible figurine بستايل 3D طبع plastic.",
    icon: Box,
    image: "/api/cdn/c/application_main/3d-figure.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
      { id: "style", type: "button-group", label: "ستايل الـfigure",
        options: [
          { value: "anime",      label: "Anime Figure" },
          { value: "collector",  label: "Collector PVC" },
          { value: "chibi",      label: "Chibi" },
          { value: "marvel",     label: "Marvel Statue" },
        ],
        defaultValue: "collector" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", style: "prompt" },
      staticPayload: {
        prompt:
          "Transform the subject into a high-end collectible 3D figurine. " +
          "Hand-painted PVC / resin material with subtle glossy clear-coat highlights, " +
          "displayed on a circular round base with the character name visible (use a placeholder), " +
          "studio softbox lighting, slight shallow depth-of-field with the figure razor-sharp, " +
          "premium product-photography composition. 3:4 portrait.",
        aspect_ratio: "3:4",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "3d-rotation",
    title: "360° Rotation 🔄",
    desc: "حوّل صورتك لفيديو 360° دوران كامل حول الشخصية / المنتج.",
    icon: Video,
    image: "/api/cdn/c/application_main/3d-rotation.mp4",
    credits: 12,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true },
      { id: "duration", type: "button-group", label: "المدة",
        options: [
          { value: "5",  label: "٥ ث" },
          { value: "10", label: "١٠ ث" },
        ],
        defaultValue: "5" },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image", duration: "duration" },
      staticPayload: {
        prompt:
          "Smooth seamless 360-degree turntable rotation around the subject. " +
          "Subject stays exactly centred, background is a clean infinite seamless backdrop, " +
          "consistent studio lighting throughout the rotation, " +
          "uniform constant rotation speed, no zoom or vertical motion. " +
          "Hyper-real product / character turntable for e-commerce or character preview.",
        aspect_ratio: "1:1",
      },
      dynamicCost: true,
    },
  },

  {
    id: "bullet-time-scene",
    title: "Bullet Time Scene 🎯",
    desc: "تجميد لحظة درامية مع دوران كاميرا حول المشهد.",
    icon: Camera,
    image: "/api/cdn/c/application_main/bullet-time-scene.mp4",
    credits: 12,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع لقطة المشهد", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image" },
      staticPayload: {
        prompt:
          "Matrix-style bullet-time effect — the entire scene is frozen mid-action, " +
          "camera orbits 180 degrees around the central subject revealing depth. " +
          "Subtle particle / dust motion still in the air, the rest pin-frozen, " +
          "cinematic anamorphic lens distortion, deep contrast. " +
          "Subject stays perfectly identity-preserved throughout the orbit.",
        aspect_ratio: "16:9",
        duration: 5,
      },
      dynamicCost: true,
    },
  },

  {
    id: "bullet-time-splash",
    title: "Bullet Time Splash 💧",
    desc: "تجميد رشة سوائل مع دوران كاميرا.",
    icon: Camera,
    image: "/api/cdn/c/application_main/bullet-time-splash.mp4",
    credits: 12,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع لقطة السائل / المشهد", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image" },
      staticPayload: {
        prompt:
          "Frozen-in-time water / liquid splash with camera orbiting 180 degrees around it. " +
          "Suspended droplets and crown-shaped splash crown, slow-motion within the orbit, " +
          "shallow depth-of-field with the splash razor-sharp, premium drink ad aesthetic, " +
          "rim-lit against dark studio backdrop, high contrast. 16:9.",
        aspect_ratio: "16:9",
        duration: 5,
      },
      dynamicCost: true,
    },
  },

  {
    id: "bullet-time-white",
    title: "Bullet Time White 🤍",
    desc: "تجميد لقطة في استوديو أبيض مع دوران 360.",
    icon: Camera,
    image: "/api/cdn/c/application_main/bullet-time-white.mp4",
    credits: 12,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع لقطة الشخصية", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image" },
      staticPayload: {
        prompt:
          "Bullet-time scene against a pure infinite white studio backdrop. " +
          "Subject frozen mid-action — jump / kick / spin — camera orbits 360 degrees fully around them. " +
          "Soft even softbox lighting from above, slight shadow on the white floor, " +
          "fashion-editorial-meets-action-hero look, perfectly sharp subject throughout. " +
          "Preserve facial identity. 16:9.",
        aspect_ratio: "16:9",
        duration: 5,
      },
      dynamicCost: true,
    },
  },

  {
    id: "outfit-shot",
    title: "Outfit Shot 👗",
    desc: "صورة fashion campaign للملابس.",
    icon: Users,
    image: "/api/cdn/c/application_main/outfit-shot.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة العميل / الملابس", accept: "image/*", required: true },
      { id: "vibe", type: "button-group", label: "نوع الحملة",
        options: [
          { value: "editorial",  label: "Editorial" },
          { value: "streetwear", label: "Streetwear" },
          { value: "luxury",     label: "Luxury" },
          { value: "campaign",   label: "Campaign" },
        ],
        defaultValue: "editorial" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", vibe: "prompt" },
      staticPayload: {
        prompt:
          "High-fashion campaign portrait. Model in confident standing pose, neutral seamless studio backdrop, " +
          "professional softbox lighting with a defined catchlight, full-body or three-quarter framing, " +
          "garments rendered with crisp texture and accurate colour, " +
          "editorial magazine-grade colour science, slight film-grain finish. " +
          "Preserve facial identity. 4:5 portrait fashion aspect.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  // ── Tier 4 Viral Effects — ASMR family ────────────────────────────────────

  {
    id: "asmr-classic",
    title: "ASMR Classic 🎧",
    desc: "بورتريه ASMR كلاسيك بإضاءة هادئة وألوان دافئة.",
    icon: Smile,
    image: "/api/cdn/c/application_main/asmr-classic.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Classic ASMR aesthetic portrait. Warm tungsten key light, soft fall-off, gentle blurred ambient, " +
          "subject in calm centred pose with relaxed expression, " +
          "close-up framing with the head and shoulders, " +
          "subtle hand or fingertip detail in foreground, " +
          "wood / linen / candle textures suggested in the background bokeh. " +
          "Preserve facial identity. 4:5 portrait aspect.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "asmr-add-on",
    title: "ASMR Add-on 🤫",
    desc: "ضيف طبقة ASMR على صورتك الحالية — إضاءة + props.",
    icon: Sparkles,
    image: "/api/cdn/c/application_main/asmr-add-on.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true },
      { id: "prop", type: "button-group", label: "الإضافة",
        options: [
          { value: "soap-cutting", label: "Soap Cutting" },
          { value: "honey",        label: "Honey Drip" },
          { value: "kinetic-sand", label: "Kinetic Sand" },
          { value: "ice",          label: "Ice / Crystal" },
        ],
        defaultValue: "soap-cutting" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", prop: "prompt" },
      staticPayload: {
        prompt:
          "Add an ASMR-aesthetic prop layer to the scene without changing the main subject. " +
          "Soft natural-window light, shallow depth-of-field on the prop, " +
          "tactile macro-style materials, calming palette, " +
          "subtle steam / drip / particle motion suggested. Preserve facial identity. 4:5.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "asmr-host",
    title: "ASMR Host 🎙️",
    desc: "بورتريه استوديو ASMR podcast host.",
    icon: Smile,
    image: "/api/cdn/c/application_main/asmr-host.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "ASMR podcast host portrait — subject behind a large studio condenser microphone, " +
          "soft purple-blue LED ambient lighting from behind, single warm key on the face, " +
          "headphones on, cosy plant-and-acoustic-panel background bokeh, " +
          "intimate close-up framing. Preserve facial identity. 4:5.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "asmr-promo",
    title: "ASMR Promo 📣",
    desc: "بانر إعلاني لقناة / حلقة ASMR — fit للسوشيال.",
    icon: Megaphone,
    image: "/api/cdn/c/application_main/asmr-promo.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة الـhost", accept: "image/*", required: true },
      { id: "title", type: "prompt", label: "اسم الحلقة (اختياري)",
        placeholder: "مثال: Whisper Story 042" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", title: "prompt" },
      staticPayload: {
        prompt:
          "ASMR episode promo poster composition. Host in soft purple-pink studio ambient with mic and headphones, " +
          "clean space on the right for an imagined episode title, " +
          "social-media optimized 9:16 vertical, premium ASMR-channel branding aesthetic, " +
          "subtle film-grain. Preserve facial identity. No actual text — just composition.",
        aspect_ratio: "9:16",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  // ── Tier 5 Viral Effects — Style transforms (1/2) ─────────────────────────

  {
    id: "character-swap",
    title: "Character Swap 🔁",
    desc: "استبدل شخصية في مشهد بشخصيتك أنت.",
    icon: Users,
    image: "/api/cdn/c/application_main/character-swap.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "scene", type: "upload", label: "ارفع المشهد", accept: "image/*", required: true },
      { id: "face",  type: "upload", label: "ارفع وش الشخصية الجديدة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { scene: "images_list[0]", face: "images_list[1]" },
      staticPayload: {
        prompt:
          "Swap the main character in the first image with the person from the second image. " +
          "Preserve the original scene's lighting, perspective, framing, clothing style, and pose. " +
          "Match the swap-in face's identity precisely. Photoreal seamless integration, " +
          "no telltale halo or seam at the neck. Keep the rest of the scene untouched.",
        aspect_ratio: "auto",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "chameleon",
    title: "Chameleon 🦎",
    desc: "وش / منتج بألوان متغيرة بستايل حرباء.",
    icon: Sparkles,
    image: "/api/cdn/c/application_main/chameleon.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Apply a chameleon colour-shift effect to the subject. " +
          "Skin / surface tone transitions through iridescent gradients " +
          "— teal-to-magenta, gold-to-purple — like an oil-slick or beetle carapace. " +
          "Subtle texture preserved underneath, otherworldly but photoreal. " +
          "Studio backdrop neutral. Preserve facial identity. 4:5.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "cosplay-ahegao",
    title: "Cosplay ⛩️",
    desc: "حوّل صورتك لـcosplay aesthetic ياباني.",
    icon: Drama,
    image: "/api/cdn/c/application_main/cosplay.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
      { id: "character", type: "prompt", label: "الشخصية (اختياري)",
        placeholder: "مثال: anime warrior, magical girl, mecha pilot" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", character: "prompt" },
      staticPayload: {
        prompt:
          "Anime-cosplay portrait in convention-grade costume. " +
          "Stylised hair colour, anime-accurate prop weapon / accessory, " +
          "studio softbox lighting with a coloured rim, professional cosplay-photography composition, " +
          "subtle anime-tint colour grade but photoreal skin. Preserve facial identity. 4:5.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "giallo-horror",
    title: "Giallo Horror 🩸",
    desc: "ستايل أفلام الرعب الإيطالية في السبعينات.",
    icon: ShieldAlert,
    image: "/api/cdn/c/application_main/giallo.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "1970s Italian giallo horror film aesthetic. Saturated primary-colour gel lighting — " +
          "crimson red and electric blue raking across the face, deep shadow contrast, " +
          "subtle film grain and slight gate-weave, Dario-Argento-style composition. " +
          "Subject in suspenseful glance pose. Preserve facial identity. 4:3 retro film aspect.",
        aspect_ratio: "4:3",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "60s-cafe",
    title: "60s Café ☕",
    desc: "ستايل كافيه أمريكي ستينات.",
    icon: Camera,
    image: "/api/cdn/c/application_main/60s-cafe.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "1960s American diner / café aesthetic. Subject in retro period-accurate fashion " +
          "(beehive hair / pomade / slim tie), seated in a vinyl booth, jukebox in the background, " +
          "neon signage reflecting on glass, warm pastel pink-and-mint palette, " +
          "Kodachrome film colour science, slight grain. Preserve facial identity. 4:5.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "j-poster",
    title: "Japanese Poster 🗾",
    desc: "ملصق فني ياباني بستايل graphic design.",
    icon: ImageIcon,
    image: "/api/cdn/c/application_main/j-poster.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Japanese graphic-design poster composition. Bold flat-colour zones, halftone screen-print texture, " +
          "off-centre subject framing with negative space on one side, " +
          "vertical 3:4 portrait layout, muted cream paper background, " +
          "subtle imagined kanji / katakana shapes (not real text). Preserve facial identity.",
        aspect_ratio: "3:4",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "japanese-show",
    title: "Japanese TV Show 📺",
    desc: "بانر برنامج تلفزيوني ياباني — variety show.",
    icon: Drama,
    image: "/api/cdn/c/application_main/japanese-show.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة المضيف", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Japanese variety-show TV-banner composition. Host in dynamic surprised expression, " +
          "vivid pop colours with bright yellow / pink / cyan gradient backdrop, " +
          "speech-bubble shapes around the figure (empty — no real text), comic-style action lines, " +
          "high-energy 90s-Japanese-TV aesthetic. Preserve facial identity. 16:9.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "latex",
    title: "Latex Material ✨",
    desc: "تحويل الملابس / السطح لـlatex shiny material.",
    icon: Sparkles,
    image: "/api/cdn/c/application_main/latex.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Transform the subject's clothing into glossy latex / vinyl material. " +
          "Sharp specular highlights, deep blacks, faint reflections of studio lights, " +
          "fashion-editorial composition, dark moody background, " +
          "preserve the original garment cut and the facial identity precisely. 4:5 portrait.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "mascot",
    title: "Cute Mascot 🐻",
    desc: "حوّل شخصيتك لـmascot كارتوني cute.",
    icon: Heart,
    image: "/api/cdn/c/application_main/mascot.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
      { id: "style", type: "button-group", label: "نوع الماسكوت",
        options: [
          { value: "bear",    label: "Bear" },
          { value: "robot",   label: "Robot" },
          { value: "alien",   label: "Alien" },
          { value: "veggie",  label: "Veggie/Fruit" },
        ],
        defaultValue: "bear" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", style: "prompt" },
      staticPayload: {
        prompt:
          "Stylised cute brand mascot character. Big head, small body, oversized expressive eyes, " +
          "clean vector-art-meets-3D-render look, soft pastel palette, " +
          "central hero pose on a plain colour background, " +
          "preserve the spirit of the subject's identity but cartoonify the proportions. 1:1.",
        aspect_ratio: "1:1",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "paint-app",
    title: "Paint App 🎨",
    desc: "حوّل صورتك لرسمة paint-app digital art.",
    icon: Palette,
    image: "/api/cdn/c/application_main/paint-app.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Render the subject as a digital paint-app artwork. " +
          "Visible Procreate-style brush strokes, slight digital paper texture, " +
          "harmonious complementary colour palette, simplified background, " +
          "Instagram-friendly portrait illustration look. Preserve facial likeness. 4:5.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  // ── Tier 5 Viral Effects — Style transforms (2/2) ─────────────────────────

  {
    id: "pixel-game",
    title: "Pixel Game 🕹️",
    desc: "حوّل صورتك لشخصية لعبة بكسل ٨ بت / ١٦ بت.",
    icon: Gamepad2,
    image: "/api/cdn/c/application_main/pixel-game.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
      { id: "era", type: "button-group", label: "حقبة البكسل",
        options: [
          { value: "8bit",  label: "8-bit (NES)" },
          { value: "16bit", label: "16-bit (SNES)" },
          { value: "32bit", label: "32-bit (PSX)" },
        ],
        defaultValue: "16bit" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", era: "prompt" },
      staticPayload: {
        prompt:
          "Pixel-art video-game character sprite based on the subject. " +
          "Limited retro palette, hard pixel edges, chibi-style proportions, " +
          "side-scroller or RPG-overworld pose, simple tile background. " +
          "Keep recognisable facial features. 1:1 square.",
        aspect_ratio: "1:1",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "poster",
    title: "Vintage Poster 📜",
    desc: "بوستر فينتاج بستايل سينما السبعينات.",
    icon: Frame,
    image: "/api/cdn/c/application_main/poster.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Vintage 1970s film poster composition. Subject as the central hero figure, " +
          "muted ochre / brown / cream palette, halftone print texture and faint creases / paper-fold marks, " +
          "negative space at the bottom for an imagined title (no real text). " +
          "Preserve facial identity. 3:4 portrait poster.",
        aspect_ratio: "3:4",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "rapgod",
    title: "Rap God 🎤",
    desc: "بورتريه رابر hip-hop premium.",
    icon: Music2,
    image: "/api/cdn/c/application_main/rapgod.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Premium hip-hop artist portrait. Subject in confident street fashion — gold chains, designer hoodie, " +
          "snapback or beanie — dramatic side-lit composition against a moody urban backdrop, " +
          "subtle smoke haze, magazine-cover-grade colour science, " +
          "Travis-Scott-meets-Drake editorial vibe. Preserve facial identity. 4:5.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "recast",
    title: "Recast Scene 🎬",
    desc: "أعد توزيع المشهد بألوان / vibe جديد.",
    icon: Wand2,
    image: "/api/cdn/c/application_main/recast.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع المشهد", accept: "image/*", required: true },
      { id: "vibe", type: "prompt", label: "الـvibe الجديد",
        placeholder: "مثال: cyberpunk neon، moody noir، Studio Ghibli، Wes Anderson pastel", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", vibe: "prompt" },
      staticPayload: {
        // The vibe goes directly into the prompt — the model interprets the
        // descriptor as a wholesale colour-grade + production-design swap.
        aspect_ratio: "auto",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "surrounded-by-animals",
    title: "Surrounded by Animals 🐾",
    desc: "محاط بحيوانات في مشهد سحري.",
    icon: Heart,
    image: "/api/cdn/c/application_main/surrounded-by-animals.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
      { id: "animals", type: "prompt", label: "نوع الحيوانات (اختياري)",
        placeholder: "مثال: قطط، كلاب، طيور، deer وأرانب" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", animals: "prompt" },
      staticPayload: {
        prompt:
          "Subject sitting peacefully in a magical natural setting — meadow / forest clearing — " +
          "surrounded by friendly animals approaching and gathering around. " +
          "Golden-hour soft sunlight filtering through leaves, gentle dust motes in beams, " +
          "Studio-Ghibli-meets-photoreal aesthetic, intimate medium-wide composition. " +
          "Preserve facial identity. 16:9.",
        aspect_ratio: "16:9",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "this-is-fine",
    title: "This Is Fine 🔥",
    desc: "ميم this-is-fine — مبسوط وسط كل الفوضى.",
    icon: Drama,
    image: "/api/cdn/c/application_main/this-is-fine.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Recreate the classic 'this is fine' meme composition with the subject as the central character. " +
          "Subject sitting at a small table inside a burning room, sipping coffee, " +
          "calm and dazed smile, flames licking everywhere around them, " +
          "cartoon-meets-photoreal style, square 1:1 social-meme composition. " +
          "Preserve facial identity.",
        aspect_ratio: "1:1",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "social-media-icon",
    title: "Social Icon 💖",
    desc: "بورتريه بستايل profile picture للسوشيال.",
    icon: Heart,
    image: "/api/cdn/c/application_main/social-icon.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
      { id: "platform", type: "button-group", label: "المنصة",
        options: [
          { value: "instagram",  label: "Instagram" },
          { value: "linkedin",   label: "LinkedIn" },
          { value: "tiktok",     label: "TikTok" },
          { value: "twitter",    label: "X / Twitter" },
        ],
        defaultValue: "instagram" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", platform: "prompt" },
      staticPayload: {
        prompt:
          "Premium social-media profile picture. Tight head-and-shoulders crop, " +
          "subject in soft confident smile, even softbox lighting, " +
          "clean blurred neutral background, platform-appropriate styling. " +
          "Preserve facial identity precisely. 1:1 square for avatar.",
        aspect_ratio: "1:1",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  // ── Tier 7 Viral Effects — Utility apps ───────────────────────────────────

  {
    id: "simlife",
    title: "SimLife 🎮",
    desc: "حوّل صورتك لمشهد لعبة The Sims — 3D render aesthetic.",
    icon: Gamepad2,
    image: "/api/cdn/c/application_main/simlife.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list" },
      staticPayload: {
        prompt:
          "Render the subject as a Sims-game-style 3D character in their environment. " +
          "Cute stylised proportions, slightly cartoony face but recognisable, " +
          "isometric-ish 3D-render look, Plumbob hovering above the head, " +
          "playful UI hint at the top, but mostly clean. Preserve facial identity. 4:5.",
        aspect_ratio: "4:5",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "relight",
    title: "Relight 💡",
    desc: "غيّر اتجاه ونوع الإضاءة في صورة موجودة.",
    icon: Sparkles,
    image: "/api/cdn/c/application_main/relight.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true },
      { id: "direction", type: "button-group", label: "اتجاه الإضاءة",
        options: [
          { value: "left",       label: "من اليسار" },
          { value: "right",      label: "من اليمين" },
          { value: "front",      label: "من قدام" },
          { value: "back",       label: "خلفية (rim)" },
          { value: "top",        label: "من فوق" },
        ],
        defaultValue: "left" },
      { id: "mood", type: "button-group", label: "نوع الإضاءة",
        options: [
          { value: "studio",     label: "Studio" },
          { value: "golden",     label: "Golden hour" },
          { value: "neon",       label: "Neon" },
          { value: "moody",      label: "Moody دراما" },
        ],
        defaultValue: "studio" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", direction: "prompt", mood: "prompt" },
      staticPayload: {
        prompt:
          "Relight the subject according to the supplied direction and mood. " +
          "Preserve the original subject, composition, and pose precisely — only the light changes. " +
          "Generate new realistic shadows, catchlights, and rim-lighting matching the new direction. " +
          "Match the colour temperature of the chosen mood. No environmental changes.",
        aspect_ratio: "auto",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "outfit-swap",
    title: "Outfit Swap 👕",
    desc: "استبدل ملابس الشخصية بمرجع تاني.",
    icon: Users,
    image: "/api/cdn/c/application_main/outfit-swap.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "subject", type: "upload", label: "ارفع صورة الشخصية", accept: "image/*", required: true },
      { id: "outfit",  type: "upload", label: "ارفع مرجع الملابس",  accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { subject: "images_list[0]", outfit: "images_list[1]" },
      staticPayload: {
        prompt:
          "Replace the subject's clothing with the outfit shown in the second reference image. " +
          "Preserve the subject's pose, face, body shape, and the original background exactly. " +
          "Drape and fit the new garments naturally — match folds, shadows, and surface texture. " +
          "Don't change the subject's identity or skin tone.",
        aspect_ratio: "auto",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },

  {
    id: "breakdown",
    title: "Breakdown 🔍",
    desc: "اعرف كل عنصر في الصورة — اسم العلامة، المنتج، الخامة، اللون.",
    icon: FileText,
    image: "/api/cdn/c/application_main/breakdown.mp4",
    credits: 2,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    customRunner: {
      endpoint: "/api/tools/breakdown",
      paramMap: { image: "image_url" },
    },
  },

  {
    id: "similarity-score",
    title: "Similarity Score 📊",
    desc: "قارن صورتين واحصل على نسبة تشابه + نقاط الاختلاف.",
    icon: FileText,
    image: "/api/cdn/c/application_main/similarity-score.mp4",
    credits: 2,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "imageA", type: "upload", label: "الصورة الأولى", accept: "image/*", required: true },
      { id: "imageB", type: "upload", label: "الصورة الثانية", accept: "image/*", required: true },
    ],
    customRunner: {
      endpoint: "/api/tools/similarity-score",
      paramMap: { imageA: "image_a_url", imageB: "image_b_url" },
    },
  },

  {
    id: "storyboard-extractor",
    title: "Storyboard Extractor 🎬",
    desc: "ارفع ورقة storyboard — الذكاء الاصطناعي بيقسمها لـshots جاهزة للجيل.",
    icon: BookOpen,
    image: "/api/cdn/c/application_main/storyboard-extractor.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع ورقة الـstoryboard", accept: "image/*", required: true },
      { id: "expectedPanels", type: "counter", label: "عدد البانلات المتوقع (اختياري)",
        min: 2, max: 30, step: 1 },
    ],
    customRunner: {
      endpoint: "/api/tools/storyboard-extractor",
      paramMap: { image: "image_url", expectedPanels: "expectedPanels" },
    },
  },

  {
    id: "style-snap",
    title: "Style Snap ⚡",
    desc: "تحويل سريع لستايل معروف — pick & shoot.",
    icon: Wand2,
    image: "/api/cdn/c/application_main/style-snap.mp4",
    credits: 4,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
      { id: "style", type: "button-group", label: "الستايل",
        options: [
          { value: "studio-ghibli", label: "Studio Ghibli" },
          { value: "pixar-3d",      label: "Pixar 3D" },
          { value: "ukiyo-e",       label: "Ukiyo-e" },
          { value: "watercolor",    label: "Watercolor" },
          { value: "low-poly",      label: "Low-poly 3D" },
          { value: "claymation",    label: "Claymation" },
        ],
        defaultValue: "studio-ghibli" },
    ],
    muapi: {
      category: "i2i",
      models: [{ id: "nano-banana-pro-edit", label: "Nano Banana Pro" }],
      paramMap: { image: "images_list", style: "prompt" },
      staticPayload: {
        // Style slug appended to the prompt — model interprets the descriptor.
        // Preserve composition exactly; only the rendering style changes.
        aspect_ratio: "auto",
        resolution:   "2k",
      },
      dynamicCost: true,
    },
  },
];

// ── Video Tools ───────────────────────────────────────────────────────────────

export const VIDEO_TOOLS: Tool[] = [
  {
    id: "marketing-studio",
    title: "استوديو التسويق 📢",
    desc: "إعلانات احترافية بقوالب جاهزة (UGC، فتح صندوق، شرح، مراجعة).",
    icon: Megaphone,
    image: "/marketing/formats/ugc.mp4",
    credits: 90,
    isNew: true,
    studio: true,
    customRoute: "/marketing",
    inputs: [
      // Marketing Studio uses its own bespoke UI — these are kept minimal
      // so it satisfies the Tool schema for the generations API.
      {
        id: "prompt",
        type: "prompt",
        label: "وصف الإعلان",
        required: true,
      },
    ],
  },
  {
    id: "text-to-video",
    title: "إنشاء فيديو",
    desc: "حوّل صورك ونصوصك إلى فيديو ينبض بالحياة.",
    icon: Video,
    image: "/api/cdn/s/explore/create-video.mp4",
    credits: 20,
    isNew: true,
    inputs: [
      {
        id: "media",
        type: "upload",
        label: "مرجع اختياري (صورة / فيديو / صوت)",
        accept: "image/*,video/*,audio/*",
        hint: "اختياري — يساعد على توجيه التوليد",
      },
      {
        id: "prompt",
        type: "prompt",
        label: "صف المشهد",
        placeholder: "صف المشهد الذي تريد توليده بالتفصيل. استخدم @ للإشارة إلى العناصر...",
        required: true,
      },
      {
        id: "model",
        type: "select",
        label: "النموذج",
        options: VIDEO_MODELS,
        defaultValue: "kling-v3.0-pro-text-to-video",
      },
      {
        id: "ratio",
        type: "ratio-picker",
        label: "نسبة الفيديو",
        options: RATIO_VIDEO,
        defaultValue: "16:9",
      },
      {
        id: "duration",
        type: "button-group",
        label: "المدة",
        options: DURATION_VIDEO,
        defaultValue: "8",
      },
      {
        id: "resolution",
        type: "button-group",
        label: "الجودة",
        options: RESOLUTION_VIDEO,
        defaultValue: "1080p",
      },
    ],
    muapi: {
      category: "t2v",
      models: VIDEO_MODELS.map((m) => ({ id: m.value, label: m.label })),
      paramMap: {
        ratio: "aspect_ratio",
      },
      dynamicCost: true,
    },
  },
  {
    id: "sketch-to-video",
    title: "سكيتش لفيديو",
    desc: "حول الرسومات البسيطة لفيديو مبهر ومتحرك.",
    icon: Video,
    image: "/api/cdn/s/draw/sora/web-sketch-low.mp4",
    credits: 15,
    isNew: true,
    layout: "sketch-to-video" as const,
    inputs: [
      {
        id: "sketch",
        type: "upload",
        label: "ارفع الرسم",
        accept: "image/*",
        required: true,
        hint: "رسم يدوي أو رقمي",
      },
      {
        id: "prompt",
        type: "prompt",
        label: "صف الحركة (اختياري)",
        placeholder: "صف ما يحدث في الفيديو والحركات المطلوبة...",
      },
    ],
    muapi: {
      category: "i2v",
      models: [
        { id: "kling-v2.1-pro-i2v",         label: "Kling 2.1 Pro 🔥" },
        { id: "veo3.1-image-to-video",      label: "Veo 3.1"         },
        { id: "wan2.2-image-to-video",      label: "Wan 2.2"         },
        { id: "midjourney-v7-image-to-video", label: "Midjourney v7"  },
      ],
      paramMap: { sketch: "image_url" },
      dynamicCost: true,
    },
  },
  {
    id: "motion-transfer",
    title: "محاكاة الحركة",
    desc: "انقل الحركات من أي فيديو إلى صور شخصياتك — أو اختر من ١٢١ حركة جاهزة.",
    icon: Layers,
    image: "/media/motion-transfer.mp4",
    credits: 15,
    inputs: [
      {
        id: "motionPreset",
        type: "motion-picker",
        label: "اختر حركة من الكاتالوج",
        hint: "بدل ما ترفع فيديو، اختار من ١٢١ حركة جاهزة — أو سيب فاضي وارفع فيديو تحت",
      },
      {
        id: "motionVideo",
        type: "upload",
        label: "أو ارفع فيديو الحركة بنفسك",
        accept: "video/*",
        hint: "اختياري لو اخترت من الكاتالوج فوق — مدة الفيديو: 3–30 ثانية",
      },
      {
        id: "targetImage",
        type: "upload",
        label: "صورة الشخصية",
        accept: "image/*",
        required: true,
        hint: "صورة واضحة للوجه والجسم",
      },
      {
        id: "quality",
        type: "button-group",
        label: "الجودة",
        options: RESOLUTION,
        defaultValue: "1080p",
      },
      {
        id: "sceneMode",
        type: "button-group",
        label: "مصدر الخلفية",
        hint: "اختر من أين تأتي خلفية المشهد",
        options: [
          { value: "video", label: "من الفيديو" },
          { value: "image", label: "من الصورة"  },
        ],
        defaultValue: "video",
      },
    ],
    muapi: {
      category: "v2v",
      models: [
        { id: "kling-v3.0-pro-motion-control", label: "Kling 3.0 Pro Motion 🔥" },
        { id: "kling-v3.0-std-motion-control", label: "Kling 3.0 Standard"     },
        { id: "kling-v2.6-std-motion-control", label: "Kling 2.6 Standard"     },
        { id: "runway-act-two-i2v",            label: "Runway Act Two"         },
      ],
      paramMap: {
        // Both motionPreset (preview URL from the picker) and
        // motionVideo (user upload) collapse to video_url — only one is
        // populated at submit time per the UI's exclusive selection.
        motionPreset: "video_url",
        motionVideo:  "video_url",
        targetImage:  "image_url",
        quality:      "resolution",
      },
      dynamicCost: true,
    },
  },
  {
    id: "video-editor",
    title: "تعديل الفيديو",
    desc: "حرّر فيديوهاتك باحتراف مع تأثيرات مذهلة.",
    icon: Zap,
    image: "/api/cdn/s/explore/edit-video.mp4",
    credits: 10,
    inputs: [
      {
        id: "video",
        type: "upload",
        label: "ارفع الفيديو",
        accept: "video/*",
        required: true,
        hint: "MP4 — بحد أقصى 100MB",
      },
      {
        id: "prompt",
        type: "prompt",
        label: "التعديل المطلوب",
        placeholder: "صف التعديل الذي تريد إجراؤه على الفيديو...",
        required: true,
        attachments: { accept: "image/*", max: 5 },
      },
    ],
    muapi: {
      category: "v2v",
      // Real v2v editors — accept (prompt + video_url) and rewrite
      // the video per the prompt. Earlier the tool was wired to
      // kling-*-motion-control which is for transferring motion onto
      // a still image, not editing video. Wrong tool/model match.
      models: [
        { id: "runway-aleph-v2v",   label: "Runway Aleph 🔥"  },
        { id: "wan2.7-video-edit",  label: "Wan 2.7 Edit"     },
        { id: "wan2.2-edit-video",  label: "Wan 2.2 Edit"     },
        { id: "luma-modify-video",  label: "Luma Modify"      },
      ],
      paramMap: { video: "video_url" },
      dynamicCost: true,
    },
  },
  {
    id: "lip-sync",
    title: "تحريك الشفاه",
    desc: "مزامنة صورتك مع الصوت وشاهد صورك تتكلم بدقة.",
    icon: Radio,
    image: "/api/cdn/s/explore/lipsync-studio.mp4",
    credits: 15,
    isNew: true,
    inputs: [
      {
        id: "image",
        type: "upload",
        label: "ارفع الصورة أو الفيديو",
        accept: "image/*,video/*",
        required: true,
        hint: "صورة الشخص أو مقطع فيديو",
      },
      {
        id: "audio",
        type: "upload",
        label: "ارفع ملف الصوت (اختياري)",
        accept: "audio/*",
        hint: "MP3 أو WAV — بديل عن كتابة النص",
      },
      {
        id: "speech",
        type: "prompt",
        label: "ماذا يقول الشخص؟",
        placeholder: "اكتب النص الذي تريد أن يقوله الشخص (أو ارفع ملف صوت بدلاً من ذلك)...",
      },
      {
        id: "model",
        type: "select",
        label: "النموذج",
        options: LIPSYNC_MODELS,
        defaultValue: "sync-lipsync",
      },
      {
        id: "duration",
        type: "button-group",
        label: "المدة",
        options: DURATION_SHORT,
        defaultValue: "5",
      },
      {
        id: "resolution",
        type: "button-group",
        label: "الجودة",
        options: RESOLUTION,
        defaultValue: "720p",
      },
    ],
    muapi: {
      category: "lipsync",
      models: LIPSYNC_MODELS.map((m) => ({ id: m.value, label: m.label })),
      paramMap: {
        image: "video_url",   // muapi expects a URL after upload
        audio: "audio_url",
        speech: "text",
      },
      dynamicCost: true,
    },
  },
  {
    id: "video-resize",
    title: "تغيير أبعاد الفيديو",
    desc: "فيديو واحد، قياس مثالي لكل شاشة، بلا حدود!",
    icon: Frame,
    image: "/media/video-resize.webm",
    credits: 5,
    customRunner: {
      endpoint: "/api/video/resize",
      paramMap: { video: "video_url", ratio: "ratio" },
    },
    inputs: [
      {
        id: "video",
        type: "upload",
        label: "ارفع الفيديو",
        accept: "video/*",
        required: true,
      },
      {
        id: "ratio",
        type: "button-group",
        label: "النسبة الجديدة",
        options: [
          { value: "16:9", label: "16:9 — أفقي"    },
          { value: "9:16", label: "9:16 — عمودي"   },
          { value: "1:1",  label: "1:1 — مربع"     },
          { value: "4:3",  label: "4:3"             },
          { value: "21:9", label: "21:9 — سينمائي" },
        ],
        defaultValue: "16:9",
      },
    ],
  },
  {
    id: "video-vfx",
    title: "تأثيرات بصرية",
    desc: "أضف مؤثرات بصرية مذهلة تحبس الأنفاس.",
    icon: Sparkles,
    image: "/api/cdn/c/flow/video-vfx.mp4",
    credits: 12,
    isNew: true,
    inputs: [
      {
        id: "media",
        type: "upload",
        label: "ارفع الصورة أو الفيديو",
        accept: "image/*,video/*",
        required: true,
      },
      {
        id: "effect",
        type: "button-group",
        label: "نوع التأثير",
        // Values must match `ai-video-effects.name` enum exactly
        // (case-sensitive). Earlier values like "fire"/"lightning"/
        // "rain"/"explosion" weren't in the enum at all — every
        // request 422'd. Curated list below uses the most-recognised
        // entries from the real enum (~65 options total).
        options: [
          { value: "Fire",                   label: "🔥 نار"            },
          { value: "Tsunami",                label: "🌊 تسونامي"        },
          { value: "Wind Blast",             label: "💨 عاصفة"          },
          { value: "Cakeify",                label: "🎂 تحويل لكيك"     },
          { value: "Crush It",               label: "💥 تحطيم"          },
          { value: "Inflate It",             label: "🎈 تضخيم"          },
          { value: "Squish It",              label: "🍡 سحق"            },
          { value: "Pixar",                  label: "🎬 ستايل بيكسار"   },
          { value: "Cyberpunk 2077",         label: "🤖 سايبربانك"      },
          { value: "Lego",                   label: "🧱 ليجو"           },
          { value: "Hulk Transformation",    label: "💪 تحول هالك"      },
          { value: "Super Saiyan Transformation", label: "⚡ سوبر سايان" },
          { value: "Film Noir",              label: "🎞️ فيلم نوار"      },
          { value: "VHS Footage",            label: "📼 VHS قديم"       },
          { value: "360 Rotation",           label: "🔄 دوران 360"      },
        ],
        defaultValue: "Fire",
      },
      {
        id: "prompt",
        type: "prompt",
        label: "تفاصيل التأثير",
        placeholder: "صف التأثير البصري الذي تريده بالتفصيل...",
        required: true,
      },
    ],
    muapi: {
      category: "i2v",
      // ai-video-effects (registry alias `generate_wan_ai_effects`)
      // requires `name` (the effect identifier) — NOT `effect_type`.
      // Removed phantom `vfx` model id (not in registry).
      models: [
        { id: "ai-video-effects", label: "AI Video Effects" },
      ],
      paramMap: { media: "image_url", effect: "name" },
      dynamicCost: true,
    },
  },
  {
    id: "video-transitions",
    title: "انتقالات سلسة",
    desc: "انتقالات ذكية وسلسة تربط مشاهدك بإبداع.",
    icon: Zap,
    image: "/api/cdn/s/feed/step-3.mp4",
    credits: 6,
    isNew: true,
    layout: "video-transitions" as const,
    inputs: [
      {
        id: "startFrame",
        type: "upload",
        label: "الإطار الأول",
        accept: "image/*,video/*",
        required: true,
        hint: "صورة أو فيديو — بحد أقصى 5 ثوانٍ",
      },
      {
        id: "style",
        type: "select",
        label: "نمط الانتقال",
        options: TRANSITIONS_STYLES,
        defaultValue: "raven",
      },
      {
        id: "duration",
        type: "button-group",
        label: "مدة الانتقال",
        options: DURATION_SHORT,
        defaultValue: "5",
      },
      {
        id: "endFrame",
        type: "upload",
        label: "الإطار الأخير",
        accept: "image/*,video/*",
        required: true,
        hint: "صورة أو فيديو — بحد أقصى 5 ثوانٍ",
      },
      {
        id: "prompt",
        type: "prompt",
        label: "وصف الانتقال",
        placeholder: "مثال: انتقال سلس مع حركة كاميرا دافئة...",
        required: true,
        hint: "Kling i2v بيحتاج prompt للانتقال — اكتب وصف قصير",
      },
    ],
    muapi: {
      // Real first-last-frame transition models. The earlier
      // paramMap sent `tail_image_url` (doesn't exist) and
      // `transition_style` (doesn't exist) — both fields were
      // silently dropped, so the API ran a single-frame I2V.
      // Kling exposes the end-frame field as `last_image`.
      // VideoTransitionsWorkspace bakes the chosen `style` (raven /
      // flying_cam / melt / …) into the prompt itself.
      category: "i2v",
      models: [
        { id: "kling-v2.1-pro-i2v",      label: "Kling 2.1 Pro 🔥" },
        { id: "kling-v2.1-master-i2v",   label: "Kling 2.1 Master" },
      ],
      paramMap: {
        startFrame: "image_url",
        endFrame:   "last_image",
      },
      dynamicCost: true,
    },
  },
  {
    id: "video-bg-remover",
    // Title + desc updated to match what the underlying endpoint
    // actually does (watermark removal, not background removal).
    // Tool id kept stable so old URLs / Generation rows still work.
    title: "إزالة العلامة المائية",
    desc: "احذف العلامات المائية واللوغوهات من الفيديوهات تلقائياً.",
    icon: Layers,
    image: "/api/cdn/c/application_main/6f93883b-e8e3-4c77-9f50-3d20090f8ec3.mp4",
    credits: 8,
    isNew: true,
    layout: "centered" as const,
    inputs: [
      {
        id: "video",
        type: "upload",
        label: "ارفع الفيديو",
        accept: "video/*",
        required: true,
        hint: "MP4 أو MOV — بحد أقصى 100MB",
      },
    ],
    muapi: {
      category: "v2v",
      // Tool was previously misnamed "إزالة خلفية الفيديو" — the
      // muapi endpoint behind it (`video-watermark-remover`) actually
      // removes watermarks, not backgrounds. Renamed to reflect truth.
      models: [{ id: "video-watermark-remover", label: "Video Watermark Remover" }],
      paramMap: { video: "video_url" },
      dynamicCost: true,
    },
  },
  {
    id: "product-video",
    title: "فيديو منتج",
    desc: "شاهد منتجك في بيئة واقعية بفيديو احترافي.",
    layout: "centered",
    icon: Frame,
    image: [
      "/api/cdn/c/application_main/c75be66a-b6a9-4cfb-add1-d2a98fa78080.mp4",
      "/api/cdn/c/application_main/dfe1b41b-2b58-4cf3-aa0d-fda4ebbaae19.mp4",
    ],
    credits: 10,
    isNew: true,
    inputs: [
      {
        id: "product",
        type: "upload",
        label: "صورة المنتج",
        accept: "image/*",
        required: true,
        hint: "صورة واضحة للمنتج",
      },
      {
        id: "prompt",
        type: "prompt",
        label: "وصف الإعلان",
        placeholder: "مثال: منتج في مطبخ عصري مع إضاءة طبيعية...",
        required: true,
      },
    ],
    muapi: {
      category: "i2v",
      models: [
        { id: "kling-v2.1-pro-i2v",   label: "Kling 2.1 Pro" },
        { id: "veo3.1-image-to-video", label: "Veo 3.1"      },
        { id: "wan2.2-image-to-video", label: "Wan 2.2"      },
      ],
      paramMap: { product: "image_url" },
      dynamicCost: true,
    },
  },
  {
    // id stable for back-compat. Old title was "لوحة إعلانية" — but
    // the underlying I2V model just animates whatever the user uploads;
    // it does NOT compose the logo onto a real billboard. To put a
    // logo on a billboard we'd need a 2-stage pipeline (composite via
    // flux-kontext THEN animate via I2V) — deferred. For now we set
    // honest expectations: this animates your image as an ad visual.
    id: "billboard-video",
    title: "حرّك صورتك",
    desc: "حوّل صورتك أو شعارك إلى فيديو إعلاني متحرّك.",
    layout: "centered",
    icon: Frame,
    image: "/api/cdn/c/application_main/a5928bf1-8cca-4f11-80c1-d48602facf5a.mp4",
    credits: 8,
    isNew: true,
    inputs: [
      {
        id: "media",
        type: "upload",
        label: "ارفع صورتك أو شعارك",
        accept: "image/*",
        required: true,
        hint: "أحسن نتيجة مع شعار/ملصق على خلفية متباينة",
      },
      {
        id: "prompt",
        type: "prompt",
        label: "رسالة الإعلان",
        placeholder: "ما الرسالة التي تريد إيصالها للجمهور؟",
        required: true,
      },
    ],
    muapi: {
      category: "i2v",
      models: [
        { id: "kling-v2.1-pro-i2v",      label: "Kling 2.1 Pro 🔥" },
        { id: "veo3.1-image-to-video",   label: "Veo 3.1"          },
        { id: "wan2.2-image-to-video",   label: "Wan 2.2"          },
      ],
      paramMap: { media: "image_url" },
      dynamicCost: true,
    },
  },

  // ── Tier 6 Viral Effects — Video-specific ──────────────────────────────────

  {
    id: "video-face-swap",
    title: "Face Swap (Video) 🎭",
    desc: "استبدل الوش في فيديو موجود بوش جديد — frame-accurate.",
    icon: Users,
    image: "/api/cdn/c/application_main/video-face-swap.mp4",
    credits: 18,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "video", type: "upload", label: "ارفع الفيديو الأصلي", accept: "video/*", required: true },
      { id: "face",  type: "upload", label: "ارفع وش بديل (صورة)", accept: "image/*", required: true },
    ],
    muapi: {
      category: "v2v",
      models: [{ id: "video-face-swap", label: "Face Swap Engine" }],
      paramMap: { video: "video_url", face: "face_image_url" },
      dynamicCost: true,
    },
  },

  {
    id: "video-background-remover",
    title: "إزالة الخلفية (فيديو) 🪄",
    desc: "Real-time background removal لفيديوهاتك — output PNG sequence أو alpha.",
    icon: Wand2,
    image: "/api/cdn/c/application_main/video-bg-remover.mp4",
    credits: 12,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "video", type: "upload", label: "ارفع الفيديو", accept: "video/*", required: true },
    ],
    muapi: {
      category: "v2v",
      models: [{ id: "video-bg-remover", label: "BG Remover" }],
      paramMap: { video: "video_url" },
      dynamicCost: true,
    },
  },

  {
    id: "behind-the-scenes",
    title: "Behind the Scenes 🎥",
    desc: "حوّل فيديو لفلم وثائقي behind-the-scenes ستايل.",
    icon: Camera,
    image: "/api/cdn/c/application_main/bts.mp4",
    credits: 14,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع لقطة من المشهد", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image" },
      staticPayload: {
        prompt:
          "Behind-the-scenes documentary-style video clip. Handheld slightly-shaky camera movement around the subject, " +
          "natural ambient lighting, candid moments — adjusting hair, sipping water, chatting off-frame — " +
          "16 mm film grain texture, slight zoom-in then pull-back, " +
          "warm vintage colour grade. 16:9, ~5 sec.",
        aspect_ratio: "16:9",
        duration: 5,
      },
      dynamicCost: true,
    },
  },

  {
    id: "comic-book-video",
    title: "Comic Book (Video) 📚",
    desc: "حوّل صورتك لمشهد comic book متحرك.",
    icon: BookOpen,
    image: "/api/cdn/c/application_main/comic-book-video.mp4",
    credits: 14,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image" },
      staticPayload: {
        prompt:
          "Animate the image as a Western comic-book panel coming to life. " +
          "Inked outlines, halftone dots, vibrant flat colours, " +
          "subtle motion of speed-lines, hair movement, dust particles, " +
          "dramatic camera push-in toward the subject. 16:9 hero, ~5 sec.",
        aspect_ratio: "16:9",
        duration: 5,
      },
      dynamicCost: true,
    },
  },

  {
    id: "mukbang-video",
    title: "Mukbang (Video) 🎬",
    desc: "فيديو mukbang كامل بـcrash zooms على الأكل.",
    icon: Utensils,
    image: "/api/cdn/c/application_main/mukbang-video.mp4",
    credits: 14,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع لقطة الـmukbang", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image" },
      staticPayload: {
        prompt:
          "Mukbang show video — dramatic close-up zoom into the food, glistening steam, " +
          "subject reacting with exaggerated satisfied expression, " +
          "Korean / Japanese ASMR-mukbang YouTube aesthetic, warm tungsten light. " +
          "9:16 vertical reels format, ~5 sec.",
        aspect_ratio: "9:16",
        duration: 5,
      },
      dynamicCost: true,
    },
  },

  {
    id: "clipcut",
    title: "ClipCut 👕",
    desc: "outfit reel — بدلات متغيرة على beat الموسيقى.",
    icon: Scissors,
    image: "/api/cdn/c/application_main/clipcut.mp4",
    credits: 18,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "subject", type: "upload", label: "ارفع صورة الموديل", accept: "image/*", required: true },
      { id: "outfits", type: "multi-upload", label: "ارفع outfits (٣-٦ صور)",
        accept: "image/*", maxFiles: 6 },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { subject: "init_image", outfits: "outfit_refs" },
      staticPayload: {
        prompt:
          "Outfit-change reel. Subject standing centred against a clean studio backdrop, " +
          "cycling through the provided outfit references with beat-synced flash transitions between each look. " +
          "Confident model poses, dynamic but identity-preserving. 9:16 vertical reel, ~6 sec.",
        aspect_ratio: "9:16",
        duration: 6,
      },
      dynamicCost: true,
    },
  },

  {
    id: "glitter-sticker",
    title: "Glitter Sticker ✨",
    desc: "أضف طبقة glitter متحركة على الفيديو.",
    icon: Sparkles,
    image: "/api/cdn/c/application_main/glitter-sticker.mp4",
    credits: 10,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع لقطة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image" },
      staticPayload: {
        prompt:
          "Add an animated glitter / sparkle overlay layer drifting across the scene. " +
          "Twinkling specular particles, occasional starburst flares, " +
          "pastel pink-gold-silver palette, gentle particle drift motion, " +
          "the main subject stays sharp underneath. 9:16, ~4 sec.",
        aspect_ratio: "9:16",
        duration: 4,
      },
      dynamicCost: true,
    },
  },

  {
    id: "melting-doodle",
    title: "Melting Doodle 🎨",
    desc: "حوّل رسمتك لرسمة بتذوب على الكادر.",
    icon: Pencil,
    image: "/api/cdn/c/application_main/melting-doodle.mp4",
    credits: 12,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع الرسمة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image" },
      staticPayload: {
        prompt:
          "Animate the doodle / drawing as if the ink and paint are slowly melting downward off the page. " +
          "Drips of liquid colour run from each stroke, gravity pulls the design apart, " +
          "the paper texture stays put underneath, surreal stop-motion vibe. 1:1, ~4 sec.",
        aspect_ratio: "1:1",
        duration: 4,
      },
      dynamicCost: true,
    },
  },

  {
    id: "brick-cube",
    title: "Brick Cube 🧱",
    desc: "تكسير المشهد لـbricks / cubes متفجرة.",
    icon: Box,
    image: "/api/cdn/c/application_main/brick-cube.mp4",
    credits: 12,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع لقطة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image" },
      staticPayload: {
        prompt:
          "The scene shatters into hundreds of small floating cubes / bricks that pull apart and drift outward, " +
          "revealing the empty space behind. Voxel-style breakdown animation, " +
          "slight motion-blur on each cube, dust particles, dramatic camera pull-back. 16:9, ~4 sec.",
        aspect_ratio: "16:9",
        duration: 4,
      },
      dynamicCost: true,
    },
  },

  {
    id: "idol",
    title: "K-pop Idol 🎤",
    desc: "بورتريه K-pop idol بأسلوب stage.",
    icon: Smile,
    image: "/api/cdn/c/application_main/idol.mp4",
    credits: 14,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image" },
      staticPayload: {
        prompt:
          "K-pop idol stage performance clip. Subject in stylish stage outfit, dynamic dance pose, " +
          "stage lights swirling with pink-purple-blue beams, " +
          "subtle confetti particles, dramatic high-contrast lighting, " +
          "music-video grade colour science. Preserve facial identity. 9:16 vertical, ~5 sec.",
        aspect_ratio: "9:16",
        duration: 5,
      },
      dynamicCost: true,
    },
  },

  {
    id: "victory-card",
    title: "Victory Card 🏆",
    desc: "احتفال نصر بكلمة Victory! و confetti.",
    icon: Sparkles,
    image: "/api/cdn/c/application_main/victory-card.mp4",
    credits: 12,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع صورة الفائز", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image" },
      staticPayload: {
        prompt:
          "Victory celebration card animation. Subject in triumphant arms-raised pose, " +
          "confetti raining from above, golden sparkles, " +
          "warm-light vignette, soft slow-motion punch-in toward the face, " +
          "celebration-card mood. 4:5 portrait, ~4 sec.",
        aspect_ratio: "4:5",
        duration: 4,
      },
      dynamicCost: true,
    },
  },

  {
    id: "yes-kiss",
    title: "Yes Kiss 💋",
    desc: "لقطة kiss رومانسية بسرعة slow-motion.",
    icon: Heart,
    image: "/api/cdn/c/application_main/yes-kiss.mp4",
    credits: 14,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع لقطة الـcouple", accept: "image/*", required: true },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image" },
      staticPayload: {
        prompt:
          "Romantic slow-motion kiss scene. Subject leaning in with eyes closed, " +
          "warm golden-hour rim light, dreamy bokeh background, " +
          "subtle hair drift, gentle camera dolly-in, soft film-grain. " +
          "Preserve facial identities. 16:9, ~5 sec.",
        aspect_ratio: "16:9",
        duration: 5,
      },
      dynamicCost: true,
    },
  },

  {
    id: "virality-predictor",
    title: "Virality Predictor 🧠",
    desc: "ارفع clip — الذكاء الاصطناعي بيتنبأ بنسبة الانتشار + يطلع خريطة انتباه.",
    icon: Sparkles,
    image: "/api/cdn/c/application_main/virality-predictor.mp4",
    credits: 6,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "video", type: "upload", label: "ارفع الـclip", accept: "video/*", required: true,
        hint: "MP4 — أفضل دقة تحت ٦٠ ثانية" },
      { id: "platform", type: "button-group", label: "المنصة المستهدفة",
        options: [
          { value: "any",     label: "كل المنصات" },
          { value: "tiktok",  label: "TikTok" },
          { value: "reels",   label: "Reels" },
          { value: "shorts",  label: "Shorts" },
        ],
        defaultValue: "any" },
    ],
    customRunner: {
      endpoint: "/api/tools/virality-predictor",
      paramMap: { video: "video_url", platform: "platform" },
    },
  },

  {
    id: "zooms",
    title: "Zoom Pack 🔭",
    desc: "تنويعات zoom-in / zoom-out / crash-zoom للفيديو.",
    icon: Aperture,
    image: "/api/cdn/c/application_main/zooms.mp4",
    credits: 10,
    isNew: true,
    layout: "centered",
    inputs: [
      { id: "image", type: "upload", label: "ارفع لقطة", accept: "image/*", required: true },
      { id: "zoom", type: "button-group", label: "نوع الزووم",
        options: [
          { value: "in",        label: "Zoom In" },
          { value: "out",       label: "Zoom Out" },
          { value: "crash",     label: "Crash Zoom" },
          { value: "dolly",     label: "Dolly Zoom" },
        ],
        defaultValue: "crash" },
    ],
    muapi: {
      category: "i2v",
      models: [{ id: "kling-v3.0-pro-image-to-video", label: "Kling 3.0 Pro" }],
      paramMap: { image: "init_image", zoom: "prompt" },
      staticPayload: {
        // The zoom slug becomes the prompt suffix — the model interprets it
        // directly into the camera-move spec.
        aspect_ratio: "16:9",
        duration: 4,
      },
      dynamicCost: true,
    },
  },
];

// ── Audio Tools ───────────────────────────────────────────────────────────────

export const AUDIO_TOOLS: Tool[] = [
  {
    id: "text-to-speech",
    title: "كلام واقعي بصوت بشري",
    desc: "استمع فوراً لما تكتبه بصوت طبيعي وواضح.",
    icon: Music,
    // Custom-branded thumbnail generated via OpenRouter (gpt-5.4-image-2)
    // — see scripts/gen-audio-thumbnails.mjs.
    image: "/tool-thumbnails/text-to-speech.png",
    credits: 3,
    customRunner: {
      endpoint: "/api/audio/tts",
      paramMap: {
        text:             "text",
        voice:            "voice",
        format:           "format",
        stability:        "stability",
        similarity_boost: "similarity_boost",
        style:            "style",
      },
    },
    inputs: [
      {
        id: "text",
        type: "prompt",
        label: "النص المراد تحويله",
        placeholder: "اكتب هنا النص الذي تريد تحويله إلى صوت...",
        required: true,
      },
      {
        id: "voice",
        type: "select",
        label: "الصوت",
        // Pulls real voices from ElevenLabs at render time — no more
        // mock list. Defaults to whichever voice the endpoint returns
        // first (multilingual voices sort to the top server-side).
        dynamicOptions: {
          endpoint:     "/api/audio/voices",
          loadingLabel: "جاري تحميل الأصوات…",
        },
      },
      {
        id: "stability",
        type: "slider",
        label: "ثبات الأداء",
        hint:  "أعلى = أداء أكثر تحفظاً، أقل = أكثر تعبيراً",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.55,
      },
      {
        id: "similarity_boost",
        type: "slider",
        label: "تطابق هوية الصوت",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.75,
      },
      {
        id: "style",
        type: "slider",
        label: "تعبيرية الأداء",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.30,
      },
      {
        id: "format",
        type: "button-group",
        label: "صيغة الملف",
        options: [
          { value: "mp3", label: "MP3" },
          { value: "wav", label: "WAV" },
        ],
        defaultValue: "mp3",
      },
    ],
  },
  {
    id: "audio-separate",
    title: "فصل الصوت",
    desc: "افصل الكلام عن الموسيقى بسهولة ودقة عالية.",
    layout: "centered",
    icon: Layers,
    image: "/tool-thumbnails/audio-separate.png",
    credits: 3,
    customRunner: {
      endpoint: "/api/audio/separate",
      paramMap: { audio: "audio_url" },
      staticPayload: { stems: 2 },
    },
    inputs: [
      {
        id: "audio",
        type: "upload",
        label: "ارفع الملف الصوتي أو الفيديو",
        accept: "audio/*,video/*",
        required: true,
        hint: "MP3، WAV، MP4 — بحد أقصى 100MB",
      },
    ],
  },
  {
    id: "audio-enhance",
    title: "تحسين الصوت",
    desc: "نقي صوتك من الضوضاء واجعله أكثر وضوحاً.",
    layout: "centered",
    icon: Sparkles,
    image: "/tool-thumbnails/audio-enhance.png",
    credits: 2,
    customRunner: {
      endpoint: "/api/audio/enhance",
      paramMap: { audio: "audio_url" },
    },
    inputs: [
      {
        id: "audio",
        type: "upload",
        label: "ارفع الملف الصوتي",
        accept: "audio/*",
        required: true,
        hint: "MP3 أو WAV",
      },
    ],
  },

  // ── Music creation (Suno via MuAPI) ─────────────────────────────────────────
  {
    id: "music-create",
    title: "أنشئ أغنية كاملة",
    desc: "ولّد أغنية أصلية بكلمات وموسيقى من وصف الستايل اللي عاوزه — Suno V5.",
    icon: Music2,
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop",
    credits: 8,
    isNew: true,
    customRunner: {
      endpoint: "/api/audio/music-create",
      paramMap: {
        style:         "style",
        prompt:        "prompt",
        title:         "title",
        instrumental:  "instrumental",
        custom_mode:   "custom_mode",
        negative_tags: "negative_tags",
        model:         "model",
      },
    },
    inputs: [
      {
        id: "style",
        type: "prompt",
        label: "الستايل / النوع الموسيقي",
        placeholder: "مثال: pop, upbeat, female vocals, modern arabic",
        required: true,
        hint: "اوصف نوع الموسيقى — البيت، السرعة، الآلات، المزاج",
      },
      {
        id: "prompt",
        type: "prompt",
        label: "كلمات الأغنية (اختياري)",
        placeholder: "اكتب كلمات الأغنية هنا… سيبه فاضي لو عاوز موسيقى بدون كلام",
      },
      {
        id: "title",
        type: "prompt",
        label: "اسم الأغنية",
        placeholder: "مثال: حلم الصحراء",
      },
      {
        id: "instrumental",
        type: "toggle",
        label: "موسيقى بدون كلام",
        defaultValue: false,
      },
      {
        id: "model",
        type: "select",
        label: "موديل Suno",
        options: [
          { value: "V5",      label: "V5 — الأحدث (موصى)" },
          { value: "V5_5",    label: "V5.5 — تجريبي" },
          { value: "V4_5ALL", label: "V4.5 ALL — متوازن" },
          { value: "V4_5",    label: "V4.5" },
          { value: "V4",      label: "V4" },
          { value: "V3_5",    label: "V3.5" },
        ],
        defaultValue: "V5",
      },
      {
        id: "negative_tags",
        type: "prompt",
        label: "ما يجب تجنّبه (اختياري)",
        placeholder: "مثال: heavy metal, distorted vocals",
      },
    ],
  },

  // ── Music remix (Suno) ──────────────────────────────────────────────────────
  {
    id: "music-remix",
    title: "ريميكس لأغنية",
    desc: "حوّل أغنية موجودة لأسلوب مختلف — احتفظ بالهوية الموسيقية وغيّر الـ vibe.",
    icon: Disc3,
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
    credits: 8,
    isNew: true,
    customRunner: {
      endpoint: "/api/audio/music-remix",
      paramMap: {
        audio_url: "audio_url",
        style:     "style",
        prompt:    "prompt",
        title:     "title",
        model:     "model",
      },
    },
    inputs: [
      {
        id: "audio_url",
        type: "upload",
        label: "ارفع الأغنية الأصلية",
        accept: "audio/*",
        required: true,
        hint: "MP3 أو WAV — حد أقصى ٦٠ ثانية للأفضل",
      },
      {
        id: "style",
        type: "prompt",
        label: "الستايل الجديد",
        placeholder: "مثال: lo-fi hiphop, dreamy, slow tempo",
        required: true,
        hint: "اوصف الأسلوب اللي عاوزها بيه بعد الريميكس",
      },
      {
        id: "title",
        type: "prompt",
        label: "اسم الإصدار الجديد",
        placeholder: "مثال: Sahara Dream — Remix",
      },
      {
        id: "model",
        type: "select",
        label: "موديل Suno",
        options: [
          { value: "V5",      label: "V5 — الأحدث" },
          { value: "V4_5ALL", label: "V4.5 ALL" },
          { value: "V4",      label: "V4" },
        ],
        defaultValue: "V5",
      },
    ],
  },

  // ── Speech-to-Text / Transcription (Whisper) ────────────────────────────────
  {
    id: "transcribe",
    title: "تحويل صوت إلى نص",
    desc: "ارفع تسجيل وحوّله لنص دقيق — داعم للعربي والإنجليزي وأكتر.",
    icon: FileText,
    image: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?q=80&w=600&auto=format&fit=crop",
    credits: 1,
    isNew: true,
    layout: "centered",
    customRunner: {
      endpoint: "/api/audio/transcribe",
      paramMap: { audio: "audio_url", language: "language" },
    },
    inputs: [
      {
        id: "audio",
        type: "upload",
        label: "ارفع الملف الصوتي أو الفيديو",
        accept: "audio/*,video/*",
        required: true,
        hint: "MP3، WAV، MP4، WEBM…",
      },
      {
        id: "language",
        type: "select",
        label: "اللغة (اختياري)",
        options: [
          { value: "auto", label: "تلقائي" },
          { value: "ar",   label: "عربي" },
          { value: "en",   label: "إنجليزي" },
          { value: "fr",   label: "فرنسي" },
          { value: "es",   label: "إسباني" },
          { value: "de",   label: "ألماني" },
          { value: "tr",   label: "تركي" },
          { value: "fa",   label: "فارسي" },
        ],
        defaultValue: "auto",
      },
    ],
  },

  // ── Lipsync / Speak (Image + Audio → Talking video) ─────────────────────────
  {
    id: "lipsync-speak",
    title: "Lipsync — ينطق صورتك 🎤",
    desc: "ارفع صورة بورتريه + ملف صوتي يبقى الوش بينطق المحتوى بالظبط.",
    icon: Music2,
    image: "/tool-thumbnails/lipsync-speak.png",
    credits: 14,
    isNew: true,
    layout: "centered",
    customRunner: {
      endpoint: "/api/audio/lipsync",
      paramMap: {
        image:      "image_url",
        audio:      "audio_url",
        model:      "model",
        resolution: "resolution",
        prompt:     "prompt",
      },
    },
    inputs: [
      {
        id: "image",
        type: "upload",
        label: "ارفع البورتريه",
        accept: "image/*",
        required: true,
        hint: "صورة قريبة من الوش لأفضل نتيجة",
      },
      {
        id: "audio",
        type: "upload",
        label: "ارفع الصوت",
        accept: "audio/*",
        required: true,
        hint: "MP3 أو WAV — حتى ٣٠ ثانية",
      },
      {
        id: "model",
        type: "select",
        label: "النموذج",
        options: [
          { value: "ltx-2.3-lipsync",          label: "LTX 2.3 — أعلى جودة" },
          { value: "ltx-2-19b-lipsync",        label: "LTX 2 19B" },
          { value: "wan2.2-speech-to-video",   label: "Wan 2.2" },
          { value: "infinitetalk-image-to-video", label: "Infinite Talk" },
        ],
        defaultValue: "ltx-2.3-lipsync",
      },
      {
        id: "resolution",
        type: "button-group",
        label: "الجودة",
        options: [
          { value: "480p",  label: "480p" },
          { value: "720p",  label: "720p" },
          { value: "1080p", label: "1080p" },
        ],
        defaultValue: "720p",
      },
      {
        id: "prompt",
        type: "prompt",
        label: "وصف اختياري",
        placeholder: "مثال: ابتسامة خفيفة، حماس متوسط، إضاءة استوديو",
      },
    ],
  },

  // ── Dubbing + Lipsync (Video → Dubbed + Lip-synced Video) ──────────────────
  {
    id: "dubbing-lipsync",
    title: "دبلجة + Lipsync 🌍",
    desc: "حوّل أي فيديو لأي لغة مع مزامنة شفايف دقيقة.",
    icon: Music,
    image: "/tool-thumbnails/dubbing.png",
    credits: 22,
    isNew: true,
    layout: "centered",
    customRunner: {
      endpoint: "/api/audio/dubbing",
      paramMap: {
        video:          "video_url",
        target_language: "target_language",
        source_language: "source_language",
        watermark:      "watermark",
      },
    },
    inputs: [
      {
        id: "video",
        type: "upload",
        label: "ارفع الفيديو",
        accept: "video/*",
        required: true,
        hint: "حتى ٢ دقيقة لأفضل دقة",
      },
      {
        id: "target_language",
        type: "select",
        label: "اللغة المستهدفة",
        options: [
          { value: "ara", label: "🇸🇦 العربية" },
          { value: "eng", label: "🇬🇧 إنجليزي" },
          { value: "spa", label: "🇪🇸 إسباني" },
          { value: "fra", label: "🇫🇷 فرنسي" },
          { value: "deu", label: "🇩🇪 ألماني" },
          { value: "ita", label: "🇮🇹 إيطالي" },
          { value: "por", label: "🇵🇹 برتغالي" },
          { value: "pol", label: "🇵🇱 بولندي" },
          { value: "tur", label: "🇹🇷 تركي" },
          { value: "rus", label: "🇷🇺 روسي" },
          { value: "nld", label: "🇳🇱 هولندي" },
          { value: "ces", label: "🇨🇿 تشيكي" },
          { value: "ara_egy", label: "🇪🇬 مصري" },
          { value: "ara_lev", label: "شامي" },
          { value: "ara_gulf", label: "خليجي" },
          { value: "zho", label: "🇨🇳 صيني" },
          { value: "jpn", label: "🇯🇵 ياباني" },
          { value: "kor", label: "🇰🇷 كوري" },
          { value: "hin", label: "🇮🇳 هندي" },
          { value: "ind", label: "🇮🇩 إندونيسي" },
          { value: "fil", label: "فلبيني" },
          { value: "vie", label: "🇻🇳 فيتنامي" },
          { value: "ron", label: "🇷🇴 روماني" },
          { value: "hun", label: "🇭🇺 مجري" },
          { value: "fin", label: "🇫🇮 فنلندي" },
          { value: "swe", label: "🇸🇪 سويدي" },
          { value: "nor", label: "🇳🇴 نرويجي" },
          { value: "dan", label: "🇩🇰 دنماركي" },
          { value: "ell", label: "🇬🇷 يوناني" },
          { value: "ukr", label: "🇺🇦 أوكراني" },
        ],
        defaultValue: "ara",
      },
      {
        id: "source_language",
        type: "select",
        label: "لغة المصدر (اختياري)",
        options: [
          { value: "auto", label: "كشف تلقائي" },
          { value: "eng",  label: "🇬🇧 إنجليزي" },
          { value: "ara",  label: "🇸🇦 عربي" },
          { value: "spa",  label: "🇪🇸 إسباني" },
          { value: "fra",  label: "🇫🇷 فرنسي" },
        ],
        defaultValue: "auto",
      },
      {
        id: "watermark",
        type: "toggle",
        label: "علامة Yilow.ai في الزاوية",
        defaultValue: false,
      },
    ],
  },

  // ── Voice Change Merge (Replace voice in video, keep lipsync) ─────────────
  {
    id: "voice-change-merge",
    title: "تغيير الصوت في فيديو 🔄",
    desc: "غيّر صوت المتحدث في فيديو بصوت آخر — يحافظ على نفس التوقيت.",
    icon: Disc3,
    image: "/tool-thumbnails/voice-change.png",
    credits: 12,
    isNew: true,
    layout: "centered",
    customRunner: {
      endpoint: "/api/audio/voice-change",
      paramMap: {
        video:    "video_url",
        voice:    "voice_id",
        stability:  "stability",
        similarity: "similarity",
      },
    },
    inputs: [
      {
        id: "video",
        type: "upload",
        label: "ارفع الفيديو",
        accept: "video/*",
        required: true,
        hint: "MP4 — حتى ٦٠ ثانية",
      },
      {
        id: "voice",
        type: "select",
        label: "الصوت البديل",
        dynamicOptions: {
          endpoint:     "/api/audio/voices",
          loadingLabel: "جاري تحميل الأصوات…",
        },
      },
      {
        id: "stability",
        type: "slider",
        label: "ثبات الأداء",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.55,
      },
      {
        id: "similarity",
        type: "slider",
        label: "تطابق هوية الصوت",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.75,
      },
    ],
  },

  // ── Voice Cloning (Upload 30s+ sample → Custom voice) ─────────────────────
  {
    id: "voice-cloning",
    title: "استنساخ صوت 🎙️",
    desc: "ارفع ٣٠ ثانية+ من صوتك واحصل على voice id جديد للاستخدام في TTS وLipsync.",
    icon: Radio,
    image: "/tool-thumbnails/voice-clone.png",
    credits: 30,
    isNew: true,
    layout: "centered",
    customRunner: {
      endpoint: "/api/audio/voice-clone",
      paramMap: {
        sample:      "sample_url",
        name:        "name",
        description: "description",
      },
    },
    inputs: [
      {
        id: "sample",
        type: "upload",
        label: "ارفع عينة الصوت",
        accept: "audio/*",
        required: true,
        hint: "WAV / MP3 — مدة لا تقل عن ٣٠ ثانية، الأفضل دقيقة كاملة، تسجيل نظيف",
      },
      {
        id: "name",
        type: "prompt",
        label: "اسم الصوت",
        placeholder: "مثال: صوتي الخاص",
        required: true,
      },
      {
        id: "description",
        type: "prompt",
        label: "وصف (اختياري)",
        placeholder: "مثال: صوت رجالي عربي مصري، نبرة دافئة، مناسب للإعلانات",
      },
    ],
  },
];

// ── Category Config ───────────────────────────────────────────────────────────

export type ToolCategory = "image" | "video" | "audio";

export interface CategoryConfig {
  name: string;
  title: string;
  colorClass: string;
  shadowColor: string;
  icon: LucideIcon;
  tools: Tool[];
}

export const STUDIO_CATEGORIES: Record<ToolCategory, CategoryConfig> = {
  image: {
    name: "الصور",
    title: "ترسانة الصور الفائقة",
    colorClass: "text-neon-yellow",
    shadowColor: "254, 228, 64",
    icon: ImageIcon,
    tools: IMAGE_TOOLS,
  },
  video: {
    name: "الفيديو",
    title: "استوديو الفيديو السينمائي",
    colorClass: "text-neon-yellow",
    shadowColor: "254, 228, 64",
    icon: Video,
    tools: VIDEO_TOOLS,
  },
  audio: {
    name: "الصوت",
    title: "الهندسة الصوتية الرقمية",
    colorClass: "text-neon-yellow",
    shadowColor: "254, 228, 64",
    icon: Music,
    tools: AUDIO_TOOLS,
  },
};

export const ALL_TOOLS_FLAT = (Object.keys(STUDIO_CATEGORIES) as ToolCategory[]).flatMap((catKey) =>
  STUDIO_CATEGORIES[catKey].tools.map((tool) => ({
    ...tool,
    categoryKey: catKey,
    categoryName: STUDIO_CATEGORIES[catKey].name,
    colorClass: STUDIO_CATEGORIES[catKey].colorClass,
    shadowColor: STUDIO_CATEGORIES[catKey].shadowColor,
  }))
);
