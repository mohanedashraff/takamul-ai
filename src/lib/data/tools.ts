import {
  Sparkles, Terminal, Zap, Frame, Radio, Layers,
  Wand2, Image as ImageIcon, Video, Music, Code, AlignLeft, Database
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
  defaultValue?: any;
  min?: number;              // slider / counter
  max?: number;
  step?: number;
  unit?: string;             // slider display unit
  maxFiles?: number;         // multi-upload: max number of files (default 5)
  attachments?: { accept: string; max: number }; // prompt: inline attachment strip
}

// ── Tool Interface ────────────────────────────────────────────────────────────

export interface Tool {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  image: string | string[];
  credits: number;
  isNew?: boolean;
  layout?: "default" | "centered" | "inpaint" | "sketch"; // "sketch" = drawing canvas
  inputs: ToolInput[];
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

const IMAGE_MODELS: ToolInputOption[] = [
  { value: "nano_banana_pro",  label: "Nano Banana Pro"  },
  { value: "seedream_v5_lite", label: "Seedream 5.0 Lite" },
  { value: "seedream_4_5",     label: "Seedream 4.5"      },
];

const VIDEO_MODELS: ToolInputOption[] = [
  { value: "seedance_2_0",       label: "Seedance 2.0"         },
  { value: "kling_3_0",          label: "Kling 3.0"            },
  { value: "kling_o1_edit",      label: "Kling O1 Edit"        },
  { value: "open_sora_video",    label: "Sora 2"               },
  { value: "veo_3_1_lite",       label: "Google Veo 3.1 Lite"  },
  { value: "veo_3_1",            label: "Google Veo 3.1"       },
  { value: "grok_imagine",       label: "Grok Imagine"         },
  { value: "wan2_7",             label: "Wan 2.7"              },
];

const LIPSYNC_MODELS: ToolInputOption[] = [
  { value: "wan_2_5_fast",         label: "Wan 2.5 Fast"           },
  { value: "kling_2_6_lipsync",    label: "Kling 2.6 Lipsync"      },
  { value: "veo_3",                label: "Google Veo 3"           },
  { value: "veo_3_fast",           label: "Google Veo 3 Fast"      },
  { value: "wan_2_5_speak",        label: "Wan 2.5 Speak"          },
  { value: "wan_2_5_speak_fast",   label: "Wan 2.5 Speak Fast"     },
  { value: "kling_avatars_2_0",    label: "Kling Avatars 2.0"      },
  { value: "higgsfield_speak",     label: "Higgsfield Speak 2.0"   },
  { value: "infinite_talk",        label: "Infinite Talk"          },
  { value: "kling_lipsync",        label: "Kling Lipsync"          },
  { value: "sync_lipsync_2_pro",   label: "Sync Lipsync 2 Pro"     },
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
        label: "الصورة أو الفيديو",
        accept: "image/*,video/*",
        required: true,
        hint: "PNG، JPG، MP4 — بحد أقصى 50MB",
      },
    ],
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
  },
  {
    id: "restore-image",
    title: "ترميم الصور",
    desc: "أعد الحياة إلى صورك التالفة وأحيِ ذكرياتك الثمينة.",
    icon: Frame,
    image: "https://c.topshort.org/fluxai/flux_kontext_apps/old_photo_restore/key_feature/2.webp",
    credits: 4,
    layout: "centered",
    inputs: [
      {
        id: "image",
        type: "upload",
        label: "الصورة التالفة أو القديمة",
        accept: "image/*",
        required: true,
        hint: "PNG أو JPG — بحد أقصى 20MB",
      },
    ],
  },
  {
    id: "skin-retouch",
    title: "تحسين البشرة",
    desc: "أزل الشوائب وحسن مظهر البشرة بضغطة زر.",
    icon: Sparkles,
    image: "https://cdn.higgsfield.ai/application_main/fb84f803-64b0-4259-b9a3-b2fc57073da4.mp4",
    credits: 2,
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
  },
  {
    id: "image-outpaint",
    title: "تمديد الصورة",
    desc: "وسع أبعاد صورتك — الذكاء الاصطناعي يملأ ما خارج الإطار.",
    icon: Frame,
    image: "https://cdn.higgsfield.ai/application_main/18f1d529-5a2d-4f60-9a9a-a7d012464d40.mp4",
    credits: 5,
    isNew: true,
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
  },
  {
    id: "change-angle",
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
  },
  {
    id: "multi-scene",
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
  },
  {
    id: "relighting",
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
  },
  {
    id: "change-clothes",
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
  },
  {
    id: "fashion-designer",
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
  },
  {
    id: "face-swap",
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
  },
  {
    id: "whats-next",
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
  },
];

// ── Video Tools ───────────────────────────────────────────────────────────────

export const VIDEO_TOOLS: Tool[] = [
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
        defaultValue: "seedance_2_0",
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
  },
  {
    id: "sketch-to-video",
    title: "سكيتش لفيديو",
    desc: "حول الرسومات البسيطة لفيديو مبهر ومتحرك.",
    icon: Video,
    image: "https://static.higgsfield.ai/draw/sora/web-sketch-low.mp4",
    credits: 15,
    isNew: true,
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
  },
  {
    id: "video-editor",
    title: "تعديل الفيديو",
    desc: "حرّر فيديوهاتك باحتراف مع تأثيرات مذهلة.",
    icon: Terminal,
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
      },
    ],
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
        defaultValue: "kling_2_6_lipsync",
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
  },
  {
    id: "video-resize",
    title: "تغيير أبعاد الفيديو",
    desc: "فيديو واحد، قياس مثالي لكل شاشة، بلا حدود!",
    icon: Frame,
    image: "/media/video-resize.webm",
    credits: 5,
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
        options: [
          { value: "fire",      label: "نار"    },
          { value: "lightning", label: "برق"    },
          { value: "rain",      label: "مطر"    },
          { value: "explosion", label: "انفجار" },
          { value: "smoke",     label: "دخان"   },
          { value: "magic",     label: "سحر"    },
        ],
        defaultValue: "fire",
      },
      {
        id: "prompt",
        type: "prompt",
        label: "تفاصيل التأثير (اختياري)",
        placeholder: "صف التأثير البصري الذي تريده بالتفصيل...",
      },
    ],
  },
  {
    id: "video-transitions",
    title: "انتقالات سلسة",
    desc: "انتقالات ذكية وسلسة تربط مشاهدك بإبداع.",
    icon: Terminal,
    image: "https://static.higgsfield.ai/feed/step-3.mp4",
    credits: 6,
    isNew: true,
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
    ],
  },
  {
    id: "video-bg-remover",
    title: "إزالة خلفية الفيديو",
    desc: "احذف خلفيات الفيديوهات واستبدلها فوراً.",
    icon: Layers,
    image: "https://cdn.higgsfield.ai/application_main/6f93883b-e8e3-4c77-9f50-3d20090f8ec3.mp4",
    credits: 8,
    isNew: true,
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
  },
  {
    id: "product-video",
    title: "فيديو منتج",
    desc: "شاهد منتجك في بيئة واقعية بفيديو احترافي.",
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
        label: "وصف الإعلان (اختياري)",
        placeholder: "مثال: منتج في مطبخ عصري مع إضاءة طبيعية...",
      },
    ],
  },
  {
    id: "billboard-video",
    title: "لوحة إعلانية",
    desc: "ضع شعارك وإعلانك على أكبر لوحات العالم الافتراضية.",
    icon: Frame,
    image: "https://cdn.higgsfield.ai/application_main/a5928bf1-8cca-4f11-80c1-d48602facf5a.mp4",
    credits: 8,
    isNew: true,
    inputs: [
      {
        id: "media",
        type: "upload",
        label: "صورتك أو شعارك",
        accept: "image/*,video/*",
        required: true,
      },
      {
        id: "prompt",
        type: "prompt",
        label: "رسالة الإعلان (اختياري)",
        placeholder: "ما الرسالة التي تريد إيصالها للجمهور؟",
      },
    ],
  },
];

// ── Audio Tools ───────────────────────────────────────────────────────────────

export const AUDIO_TOOLS: Tool[] = [
  {
    id: "text-to-speech",
    title: "كلام واقعي بصوت بشري",
    desc: "استمع فوراً لما تكتبه بصوت طبيعي وواضح.",
    icon: Music,
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=600&auto=format&fit=crop",
    credits: 3,
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
        type: "button-group",
        label: "نوع الصوت",
        options: [
          { value: "male",   label: "ذكر"  },
          { value: "female", label: "أنثى" },
        ],
        defaultValue: "male",
      },
      {
        id: "speed",
        type: "slider",
        label: "سرعة الكلام",
        min: 0.5,
        max: 2.0,
        step: 0.1,
        defaultValue: 1.0,
        unit: "x",
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
    icon: Layers,
    image: "https://images.unsplash.com/photo-1516280440502-3c66f6517170?q=80&w=600&auto=format&fit=crop",
    credits: 3,
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
    icon: Sparkles,
    image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=600&auto=format&fit=crop",
    credits: 2,
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
  {
    id: "sfx-generator",
    title: "إنشاء تأثيرات صوتية",
    desc: "حوّل النصوص إلى مؤثرات صوتية ساحرة.",
    icon: Radio,
    image: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=600&auto=format&fit=crop",
    credits: 4,
    isNew: true,
    inputs: [
      {
        id: "prompt",
        type: "prompt",
        label: "صف المؤثر الصوتي",
        placeholder: "مثال: صوت رعد ومطر في غابة استوائية...",
        required: true,
      },
      {
        id: "duration",
        type: "button-group",
        label: "المدة",
        options: [
          { value: "5",  label: "5 ث"  },
          { value: "10", label: "10 ث" },
          { value: "30", label: "30 ث" },
        ],
        defaultValue: "10",
      },
    ],
  },
];

// ── Code Tools ────────────────────────────────────────────────────────────────

export const CODE_TOOLS: Tool[] = [
  {
    id: "ui-builder",
    title: "صانع الواجهات",
    desc: "ولد واجهات وتطبيقات React كاملة من الأوامر النصية.",
    icon: Code,
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop",
    credits: 10,
    isNew: true,
    inputs: [
      {
        id: "prompt",
        type: "prompt",
        label: "صف الواجهة المطلوبة",
        placeholder: "مثال: لوحة تحكم إدارية بها جداول وإحصائيات ورسوم بيانية...",
        required: true,
      },
      {
        id: "framework",
        type: "button-group",
        label: "الإطار البرمجي",
        options: [
          { value: "react", label: "React"    },
          { value: "next",  label: "Next.js"  },
          { value: "html",  label: "HTML/CSS" },
        ],
        defaultValue: "react",
      },
    ],
  },
  {
    id: "bug-finder",
    title: "مكتشف الأخطاء",
    desc: "دع الذكاء الاصطناعي يصلح ثغرات الكود المعقدة.",
    icon: Terminal,
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop",
    credits: 5,
    inputs: [
      {
        id: "prompt",
        type: "prompt",
        label: "الكود الذي يحتوي على خطأ",
        placeholder: "الصق الكود هنا أو صف المشكلة التي تواجهها...",
        required: true,
      },
    ],
  },
  {
    id: "sql-generator",
    title: "مبرمج قواعد البيانات",
    desc: "سيقوم المحرك بتوليد جداول وأوامر SQL مباشرة.",
    icon: Database,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop",
    credits: 5,
    inputs: [
      {
        id: "prompt",
        type: "prompt",
        label: "صف ما تحتاجه",
        placeholder: "مثال: جدول لقاعدة بيانات مستخدمين مع علاقة بجدول الطلبات...",
        required: true,
      },
    ],
  },
  {
    id: "code-explainer",
    title: "مترجم الأكواد",
    desc: "اشرح الأكواد المعقدة لسطور سهلة الفهم.",
    icon: AlignLeft,
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop",
    credits: 2,
    inputs: [
      {
        id: "prompt",
        type: "prompt",
        label: "الكود المراد شرحه",
        placeholder: "الصق الكود هنا وسيشرحه لك الذكاء الاصطناعي بالعربية...",
        required: true,
      },
    ],
  },
];

// ── Category Config ───────────────────────────────────────────────────────────

export type ToolCategory = "image" | "video" | "audio" | "code";

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
    colorClass: "text-neon-pink",
    shadowColor: "241, 91, 181",
    icon: ImageIcon,
    tools: IMAGE_TOOLS,
  },
  video: {
    name: "الفيديو",
    title: "استوديو الفيديو السينمائي",
    colorClass: "text-accent-400",
    shadowColor: "0, 245, 212",
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
  code: {
    name: "الأكواد",
    title: "محرك الأكواد المتقدم",
    colorClass: "text-primary-400",
    shadowColor: "157, 78, 221",
    icon: Code,
    tools: CODE_TOOLS,
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
