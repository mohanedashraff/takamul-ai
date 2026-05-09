import {
  Sparkles, Zap, Frame, Radio, Layers,
  Wand2, Image as ImageIcon, Video, Music, Film, Megaphone,
  Music2, Disc3, FileText, Aperture,
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
  | "style-picker";

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
  { value: "gpt4o-text-to-image",         label: "GPT-4o Image"         },
  { value: "midjourney-v7-text-to-image", label: "Midjourney v7"        },
  { value: "qwen-image",                  label: "Qwen Image"           },
  { value: "hunyuan-image-3.0",           label: "Hunyuan Image 3.0"    },
];

const VIDEO_MODELS: ToolInputOption[] = [
  { value: "kling-v3.0-pro-text-to-video",      label: "Kling 3.0 Pro 🔥"     },
  { value: "kling-v2.6-pro-t2v",                label: "Kling 2.6 Pro"        },
  { value: "veo3.1-text-to-video",              label: "Google Veo 3.1"       },
  { value: "veo3.1-fast-text-to-video",         label: "Veo 3.1 Fast"         },
  { value: "openai-sora-2-text-to-video",       label: "OpenAI Sora 2"        },
  { value: "wan2.6-text-to-video",              label: "Wan 2.6"              },
  { value: "wan2.5-text-to-video-fast",         label: "Wan 2.5 Fast — أرخص"  },
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

const CDN = "https://cdn.higgsfield.ai/soul-style/";

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
    id: "cinema-studio",
    title: "استوديو السينما 🎬",
    desc: "كاميرات وعدسات سينمائية احترافية بميزانية لانهائية.",
    icon: Film,
    image: "https://static.higgsfield.ai/explore/create-image.mp4",
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

  // ── Soul — Higgsfield-style aesthetic image model ──────────────────
  // Full-fidelity port of Higgsfield's flagship aesthetic generator
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

  // ── Soul Cinema (Higgsfield-style cinematic image gen) ──────────────
  // Replicates Higgsfield's "Soul Cinema" model on top of nano-banana-pro
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
    image: "https://static.higgsfield.ai/explore/create-image.mp4",
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
    desc: "إجعل صورك أكثر وضوحاً وبدقة عالية جداً.",
    icon: Sparkles,
    image: "https://static.higgsfield.ai/explore/upscale.mp4",
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
    ],
    muapi: {
      category: "i2i",
      models: [
        { id: "ai-image-upscaler",   label: "AI Upscaler — السريع" },
        { id: "topaz-image-upscale", label: "Topaz — أعلى جودة 🔥" },
        { id: "seedvr2-image-upscale", label: "SeedVR2 — متقدم" },
      ],
      paramMap: { media: "image_url" },
      dynamicCost: true,
    },
  },
  {
    id: "edit-image",
    title: "تعديل الصورة",
    desc: "ارسم على المنطقة التي تريد تعديلها وصف التغيير.",
    icon: Wand2,
    image: "https://static.higgsfield.ai/explore/Edit-image-video-inpaint.mp4",
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
      "https://cdn.higgsfield.ai/application_main/a7aa648c-6d7b-463a-8c47-998e25342aaa.mp4",
      "https://cdn.higgsfield.ai/application_main/030c784c-6618-430b-a4d6-e024e9f7973e.mp4",
      "https://cdn.higgsfield.ai/application_main/77335af7-3bf5-4491-bf12-4b695ec524b1.mp4",
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
    image: "https://static.higgsfield.ai/nano_draw/image_draw.mp4",
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
    image: "https://cdn.higgsfield.ai/application_main/fb84f803-64b0-4259-b9a3-b2fc57073da4.mp4",
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
    image: "https://cdn.higgsfield.ai/application_main/18f1d529-5a2d-4f60-9a9a-a7d012464d40.mp4",
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
    image: "https://cdn.higgsfield.ai/application_main/29dc499c-84a0-43c3-8c6b-1e278a6cc474.mp4",
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
      // vertical_angle, move_forward, wide_angle_lens). Confirmed by
      // inspecting Higgsfield's own Angles 2.0 network call — they
      // route to the same Qwen model under the hood. The other edit
      // models (nano-banana, flux-kontext, gpt4o) are kept as
      // fallbacks for prompt-driven attempts when the structured
      // fields aren't a perfect match.
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
    image: "https://cdn.higgsfield.ai/application_main/1ae1f1a8-3994-4ead-af2a-fa30c37ea7fb.mp4",
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
    image: "https://cdn.higgsfield.ai/application_main/ff6c6ba0-3c47-416a-a473-e2b2bd425160.mp4",
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
    image: "https://cdn.higgsfield.ai/application_main/da91da29-9fc7-41fd-a99d-b07e4bb010b6.mp4",
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
    image: "https://cdn.higgsfield.ai/application_main/bb9d59e1-0493-4031-a97d-27fc7f660c89.mp4",
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
    image: "https://cdn.higgsfield.ai/application_main/2e53be4f-3594-47ce-a5f6-89c627d14be6.mp4",
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
    image: "https://cdn.higgsfield.ai/application_main/5600ef95-0305-4b8a-b407-dfa6f5d1f73d.mp4",
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
    image: "https://static.higgsfield.ai/explore/create-video.mp4",
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
    image: "https://static.higgsfield.ai/draw/sora/web-sketch-low.mp4",
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
    desc: "انقل الحركات من أي فيديو إلى صور شخصياتك.",
    icon: Layers,
    image: "/media/motion-transfer.mp4",
    credits: 15,
    inputs: [
      {
        id: "motionVideo",
        type: "upload",
        label: "فيديو الحركة المصدر",
        accept: "video/*",
        required: true,
        hint: "مدة الفيديو: 3–30 ثانية",
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
        motionVideo: "video_url",
        targetImage: "image_url",
        quality:     "resolution",
      },
      dynamicCost: true,
    },
  },
  {
    id: "video-editor",
    title: "تعديل الفيديو",
    desc: "حرّر فيديوهاتك باحتراف مع تأثيرات مذهلة.",
    icon: Zap,
    image: "https://static.higgsfield.ai/explore/edit-video.mp4",
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
    image: "https://static.higgsfield.ai/explore/lipsync-studio.mp4",
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
    image: "https://higgsfield.ai/flow/video-vfx.mp4",
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
    image: "https://static.higgsfield.ai/feed/step-3.mp4",
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
    image: "https://cdn.higgsfield.ai/application_main/6f93883b-e8e3-4c77-9f50-3d20090f8ec3.mp4",
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
      "https://cdn.higgsfield.ai/application_main/c75be66a-b6a9-4cfb-add1-d2a98fa78080.mp4",
      "https://cdn.higgsfield.ai/application_main/dfe1b41b-2b58-4cf3-aa0d-fda4ebbaae19.mp4",
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
    image: "https://cdn.higgsfield.ai/application_main/a5928bf1-8cca-4f11-80c1-d48602facf5a.mp4",
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
