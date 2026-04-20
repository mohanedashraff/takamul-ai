import {
  Sparkles, Terminal, Zap, Frame, Radio, Layers,
  Wand2, Image as ImageIcon, Video, Music, Code, AlignLeft, Database
} from "lucide-react";
import { LucideIcon } from "lucide-react";

// ── Input Schema ─────────────────────────────────────────────────────────────

export type InputType =
  | "upload"
  | "prompt"
  | "button-group"
  | "slider"
  | "color"
  | "toggle"
  | "counter"
  | "select";

export interface ToolInputOption {
  value: string;
  label: string;
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
  inputs: ToolInput[];
}

// ── Shared option sets ────────────────────────────────────────────────────────

const RATIO_IMAGE: ToolInputOption[] = [
  { value: "auto", label: "تلقائي" },
  { value: "1:1",  label: "1:1"   },
  { value: "3:4",  label: "3:4"   },
  { value: "4:3",  label: "4:3"   },
  { value: "2:3",  label: "2:3"   },
  { value: "3:2",  label: "3:2"   },
  { value: "9:16", label: "9:16"  },
  { value: "16:9", label: "16:9"  },
  { value: "5:4",  label: "5:4"   },
  { value: "4:5",  label: "4:5"   },
  { value: "21:9", label: "21:9"  },
];

const RATIO_IMAGE_EXPAND: ToolInputOption[] = [
  { value: "21:9", label: "21:9"  },
  { value: "auto", label: "تلقائي" },
  { value: "1:1",  label: "1:1"   },
  { value: "3:2",  label: "3:2"   },
  { value: "2:3",  label: "2:3"   },
  { value: "4:3",  label: "4:3"   },
  { value: "3:4",  label: "3:4"   },
  { value: "4:5",  label: "4:5"   },
  { value: "5:4",  label: "5:4"   },
  { value: "9:16", label: "9:16"  },
  { value: "16:9", label: "16:9"  },
];

const RATIO_VIDEO: ToolInputOption[] = [
  { value: "auto", label: "تلقائي" },
  { value: "16:9", label: "16:9"  },
  { value: "9:16", label: "9:16"  },
  { value: "4:3",  label: "4:3"   },
  { value: "3:4",  label: "3:4"   },
  { value: "1:1",  label: "1:1"   },
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
        type: "button-group",
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
    ],
  },
  {
    id: "enhance-image",
    title: "تحسين الصور",
    desc: "إجعل صورك أكثر وضوحاً وبدقة عالية جداً.",
    icon: Sparkles,
    image: "https://static.higgsfield.ai/explore/upscale.mp4",
    credits: 3,
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
        type: "button-group",
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
        type: "button-group",
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
