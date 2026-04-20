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
  { value: "1:1",  label: "1:1" },
  { value: "3:4",  label: "3:4" },
  { value: "4:3",  label: "4:3" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
  { value: "21:9", label: "21:9" },
];

const RATIO_VIDEO: ToolInputOption[] = [
  { value: "auto", label: "تلقائي" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "1:1",  label: "1:1" },
  { value: "4:3",  label: "4:3" },
];

const DURATION: ToolInputOption[] = [
  { value: "5",  label: "5 ثوانٍ" },
  { value: "10", label: "10 ثوانٍ" },
];

const RESOLUTION: ToolInputOption[] = [
  { value: "720p",  label: "720p" },
  { value: "1080p", label: "1080p" },
];

const LIGHT_DIRECTION: ToolInputOption[] = [
  { value: "top",    label: "أعلى" },
  { value: "front",  label: "أمام" },
  { value: "right",  label: "يمين" },
  { value: "left",   label: "يسار" },
  { value: "back",   label: "خلف" },
  { value: "bottom", label: "أسفل" },
];

// ── Image Tools ───────────────────────────────────────────────────────────────

export const IMAGE_TOOLS: Tool[] = [
  {
    id: "text-to-image",
    title: "حول النص إلى صورة",
    desc: "حوّل كلماتك إلى صور مميزة وفريدة.",
    icon: ImageIcon,
    image: "https://static.higgsfield.ai/explore/create-image.mp4",
    credits: 5,
    isNew: true,
    inputs: [
      { id: "prompt",  type: "prompt",       label: "الأمر النصي",               placeholder: "صف الصورة التي تريد توليدها بالتفصيل...", required: true },
      { id: "ref",     type: "upload",       label: "صورة مرجعية (اختياري)",       accept: "image/*", hint: "PNG أو JPG" },
      { id: "ratio",   type: "button-group", label: "نسبة الصورة",                options: RATIO_IMAGE, defaultValue: "1:1" },
      { id: "quality", type: "button-group", label: "الجودة",                      options: [{ value: "1k", label: "1K" }, { value: "2k", label: "2K" }, { value: "4k", label: "4K" }], defaultValue: "1k" },
      { id: "count",   type: "counter",      label: "عدد الصور",                   min: 1, max: 4, defaultValue: 1 },
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
      { id: "media", type: "upload", label: "الصورة أو الفيديو", accept: "image/*,video/*", required: true, hint: "PNG، JPG، MP4 — بحد أقصى 50MB" },
    ],
  },
  {
    id: "edit-image",
    title: "تعديل الصورة",
    desc: "أضف أو احذف تفاصيل من صورتك بذكاء.",
    icon: Wand2,
    image: "https://static.higgsfield.ai/explore/Edit-image-video-inpaint.mp4",
    credits: 4,
    isNew: true,
    inputs: [
      { id: "image",  type: "upload", label: "الصورة الأصلية",    accept: "image/*", required: true },
      { id: "prompt", type: "prompt", label: "التعديل المطلوب",    placeholder: "صف ما تريد تغييره أو إضافته في الصورة...", required: true },
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
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true, hint: "PNG أو JPG" },
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
      { id: "product", type: "upload", label: "صورة المنتج",           accept: "image/*", required: true, hint: "خلفية بيضاء أو شفافة أفضل" },
      { id: "prompt",  type: "prompt", label: "المشهد المحيط (اختياري)", placeholder: "مثال: منتج على طاولة خشبية مع إضاءة دافئة وزهور..." },
    ],
  },
  {
    id: "sketch-to-image",
    title: "رسم إلى صور",
    desc: "حوّل رسوماتك اليدوية إلى أعمال فنية ساحرة.",
    icon: ImageIcon,
    image: "https://static.higgsfield.ai/nano_draw/image_draw.mp4",
    credits: 5,
    isNew: true,
    inputs: [
      { id: "sketch", type: "upload", label: "ارفع الرسم",              accept: "image/*", required: true, hint: "رسم يدوي أو رقمي" },
      { id: "prompt", type: "prompt", label: "الأسلوب الفني (اختياري)", placeholder: "مثال: رسم زيتي، واقعي فوتوغرافي، أنمي ياباني..." },
    ],
  },
  {
    id: "restore-image",
    title: "ترميم الصور",
    desc: "أعد الحياة إلى صورك التالفة وأحيِ ذكرياتك الثمينة من جديد.",
    icon: Frame,
    image: "https://c.topshort.org/fluxai/flux_kontext_apps/old_photo_restore/key_feature/2.webp",
    credits: 4,
    inputs: [
      { id: "image", type: "upload", label: "الصورة التالفة أو القديمة", accept: "image/*", required: true, hint: "PNG أو JPG — بحد أقصى 20MB" },
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
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true, hint: "يفضل صورة وجه واضحة وعالية الدقة" },
    ],
  },
  {
    id: "image-outpaint",
    title: "تمديد الصورة",
    desc: "وسع أبعاد صورتك وتخيل ما خارج الإطار.",
    icon: Frame,
    image: "https://cdn.higgsfield.ai/application_main/18f1d529-5a2d-4f60-9a9a-a7d012464d40.mp4",
    credits: 5,
    isNew: true,
    inputs: [
      { id: "image", type: "upload",       label: "ارفع الصورة",     accept: "image/*", required: true },
      { id: "ratio", type: "button-group", label: "النسبة المستهدفة", options: [
        { value: "auto", label: "تلقائي" },
        { value: "1:1",  label: "1:1" },
        { value: "4:3",  label: "4:3" },
        { value: "16:9", label: "16:9" },
        { value: "21:9", label: "21:9" },
        { value: "9:16", label: "9:16" },
      ], defaultValue: "16:9" },
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
      { id: "image",     type: "upload",       label: "ارفع الصورة",      accept: "image/*", required: true },
      { id: "direction", type: "button-group", label: "اتجاه الكاميرا",   options: LIGHT_DIRECTION, defaultValue: "front" },
      { id: "rotation",  type: "slider",       label: "الدوران",          min: -180, max: 180, step: 1,  defaultValue: 0,  unit: "°" },
      { id: "tilt",      type: "slider",       label: "الإمالة",          min: -90,  max: 90,  step: 1,  defaultValue: 0,  unit: "°" },
      { id: "zoom",      type: "slider",       label: "التقريب",          min: -50,  max: 50,  step: 1,  defaultValue: 0,  unit: "%" },
      { id: "best12",    type: "toggle",       label: "توليد من 12 زاوية مثالية", defaultValue: false },
    ],
  },
  {
    id: "multi-scene",
    title: "مشاهد متعددة",
    desc: "اكتشف كيف تبدو العناصر في بيئات ومناخات مختلفة.",
    icon: Layers,
    image: "https://cdn.higgsfield.ai/application_main/1ae1f1a8-3994-4ead-af2a-fa30c37ea7fb.mp4",
    credits: 3,
    isNew: true,
    inputs: [
      { id: "image",  type: "upload",       label: "ارفع الصورة",              accept: "image/*", required: true },
      { id: "scene",  type: "button-group", label: "البيئة",                   options: [
        { value: "nature",  label: "طبيعة"   },
        { value: "city",    label: "مدينة"   },
        { value: "beach",   label: "شاطئ"    },
        { value: "desert",  label: "صحراء"   },
        { value: "snow",    label: "ثلج"     },
        { value: "studio",  label: "ستوديو"  },
      ], defaultValue: "nature" },
      { id: "prompt", type: "prompt",       label: "تفاصيل إضافية (اختياري)", placeholder: "أضف تفاصيل عن البيئة والجو المطلوب..." },
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
      { id: "image",     type: "upload",       label: "ارفع الصورة",    accept: "image/*", required: true },
      { id: "direction", type: "button-group", label: "اتجاه الإضاءة",  options: LIGHT_DIRECTION, defaultValue: "front" },
      { id: "lightType", type: "button-group", label: "نوع الإضاءة",    options: [{ value: "soft", label: "ناعمة" }, { value: "hard", label: "حادة" }], defaultValue: "soft" },
      { id: "brightness",type: "slider",       label: "السطوع",         min: 0, max: 100, step: 1, defaultValue: 50, unit: "%" },
      { id: "color",     type: "color",        label: "لون الإضاءة",    defaultValue: "#ffffff" },
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
      { id: "person", type: "upload", label: "صورتك",         accept: "image/*", required: true, hint: "صورة كاملة للشخص" },
      { id: "outfit", type: "upload", label: "الزي المطلوب",  accept: "image/*", required: true, hint: "صورة الملابس أو الزي" },
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
      { id: "person", type: "upload", label: "صورة مرجعية (اختياري)", accept: "image/*", hint: "صورة شخص أو مانيكان" },
      { id: "prompt", type: "prompt", label: "وصف تصميم الأزياء",      placeholder: "مثال: فستان سهرة أحمر طويل بأكمام واسعة وتطريز ذهبي...", required: true },
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
      { id: "faceSource",  type: "upload", label: "صورة الوجه الجديد", accept: "image/*", required: true, hint: "صورة واضحة للوجه المراد إضافته" },
      { id: "targetImage", type: "upload", label: "الصورة الهدف",       accept: "image/*", required: true, hint: "الصورة التي تريد تغيير الوجه فيها" },
    ],
  },
  {
    id: "whats-next",
    title: "ماذا بعد ؟",
    desc: "دع الذكاء الاصطناعي يتخيل تكملة صورتك السحرية.",
    icon: Sparkles,
    image: "https://cdn.higgsfield.ai/application_main/5600ef95-0305-4b8a-b407-dfa6f5d1f73d.mp4",
    credits: 3,
    isNew: true,
    inputs: [
      { id: "image", type: "upload", label: "ارفع الصورة", accept: "image/*", required: true, hint: "ما الذي سيحدث بعد هذه اللحظة؟" },
    ],
  },
];

// ── Video Tools ───────────────────────────────────────────────────────────────

export const VIDEO_TOOLS: Tool[] = [
  {
    id: "text-to-video",
    title: "إنشاء فيديو",
    desc: "حوّل صورك إلى فيديو ينبض بالحياة.",
    icon: Video,
    image: "https://static.higgsfield.ai/explore/create-video.mp4",
    credits: 20,
    isNew: true,
    inputs: [
      { id: "media",      type: "upload",       label: "مرجع اختياري (صورة / فيديو / صوت)", accept: "image/*,video/*,audio/*", hint: "اختياري — يساعد على توجيه التوليد" },
      { id: "prompt",     type: "prompt",       label: "وصف المشهد",                         placeholder: "صف المشهد الذي تريد توليده بالتفصيل...", required: true },
      { id: "ratio",      type: "button-group", label: "نسبة الفيديو",                        options: RATIO_VIDEO, defaultValue: "16:9" },
      { id: "duration",   type: "button-group", label: "المدة",                               options: DURATION, defaultValue: "5" },
      { id: "resolution", type: "button-group", label: "الجودة",                              options: [{ value: "720p", label: "720p" }, { value: "1080p", label: "1080p" }], defaultValue: "1080p" },
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
      { id: "sketch", type: "upload", label: "ارفع الرسم",              accept: "image/*", required: true, hint: "رسم يدوي أو رقمي" },
      { id: "prompt", type: "prompt", label: "صف الحركة (اختياري)",     placeholder: "صف ما يحدث في الفيديو والحركات المطلوبة..." },
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
      { id: "motionVideo",  type: "upload", label: "فيديو الحركة المصدر",   accept: "video/*",  required: true, hint: "الفيديو الذي تريد نقل حركاته" },
      { id: "targetImage",  type: "upload", label: "صورة الشخصية الهدف",   accept: "image/*",  required: true, hint: "ستُطبق الحركة على هذه الصورة" },
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
      { id: "video",  type: "upload", label: "ارفع الفيديو",       accept: "video/*", required: true, hint: "MP4 — بحد أقصى 100MB" },
      { id: "prompt", type: "prompt", label: "التعديل المطلوب",    placeholder: "صف التعديل الذي تريد إجراؤه على الفيديو...", required: true },
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
      { id: "image",      type: "upload",       label: "ارفع الصورة",         accept: "image/*", required: true, hint: "صورة الشخص أو الشخصية" },
      { id: "speech",     type: "prompt",       label: "ماذا يقول؟",          placeholder: "اكتب الكلام الذي تريد أن يقوله الشخص...", required: true },
      { id: "scene",      type: "prompt",       label: "وصف المشهد (اختياري)", placeholder: "صف المشهد والخلفية..." },
      { id: "duration",   type: "button-group", label: "المدة",               options: DURATION, defaultValue: "5" },
      { id: "resolution", type: "button-group", label: "الجودة",              options: RESOLUTION, defaultValue: "720p" },
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
      { id: "video", type: "upload",       label: "ارفع الفيديو",   accept: "video/*", required: true },
      { id: "ratio", type: "button-group", label: "النسبة الجديدة", options: [
        { value: "16:9", label: "16:9 — أفقي"    },
        { value: "9:16", label: "9:16 — عمودي"   },
        { value: "1:1",  label: "1:1 — مربع"     },
        { value: "4:3",  label: "4:3"             },
        { value: "21:9", label: "21:9 — سينمائي" },
      ], defaultValue: "16:9" },
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
      { id: "media",  type: "upload",       label: "ارفع الصورة أو الفيديو", accept: "image/*,video/*", required: true },
      { id: "effect", type: "button-group", label: "نوع التأثير",             options: [
        { value: "fire",      label: "نار"      },
        { value: "lightning", label: "برق"      },
        { value: "rain",      label: "مطر"      },
        { value: "explosion", label: "انفجار"   },
        { value: "smoke",     label: "دخان"     },
        { value: "magic",     label: "سحر"      },
      ], defaultValue: "fire" },
      { id: "prompt", type: "prompt", label: "تفاصيل التأثير (اختياري)", placeholder: "صف التأثير البصري الذي تريده بالتفصيل..." },
    ],
  },
  {
    id: "video-transitions",
    title: "إنتقالات (Transitions)",
    desc: "إنتقالات ذكية وسلسة تربط مشاهدك بإبداع.",
    icon: Terminal,
    image: "https://static.higgsfield.ai/feed/step-3.mp4",
    credits: 6,
    isNew: true,
    inputs: [
      { id: "startFrame", type: "upload",       label: "الإطار الأول",     accept: "image/*,video/*", required: true, hint: "صورة أو فيديو — بحد أقصى 5 ثوانٍ" },
      { id: "endFrame",   type: "upload",       label: "الإطار الأخير",    accept: "image/*,video/*", required: true, hint: "صورة أو فيديو — بحد أقصى 5 ثوانٍ" },
      { id: "duration",   type: "button-group", label: "مدة الانتقال",     options: DURATION, defaultValue: "5" },
    ],
  },
  {
    id: "video-bg-remover",
    title: "إزالة الخلفية",
    desc: "احذف خلفيات الفيديوهات واستبدلها فوراً.",
    icon: Layers,
    image: "https://cdn.higgsfield.ai/application_main/6f93883b-e8e3-4c77-9f50-3d20090f8ec3.mp4",
    credits: 8,
    isNew: true,
    inputs: [
      { id: "video", type: "upload", label: "ارفع الفيديو", accept: "video/*", required: true, hint: "MP4 — بحد أقصى 100MB" },
    ],
  },
  {
    id: "product-video",
    title: "تجربة منتج",
    desc: "شاهد كيف تبدو منتجاتك وفكرتك في بيئة حقيقية.",
    icon: Frame,
    image: [
      "https://cdn.higgsfield.ai/application_main/c75be66a-b6a9-4cfb-add1-d2a98fa78080.mp4",
      "https://cdn.higgsfield.ai/application_main/dfe1b41b-2b58-4cf3-aa0d-fda4ebbaae19.mp4",
    ],
    credits: 10,
    isNew: true,
    inputs: [
      { id: "product", type: "upload", label: "صورة المنتج",           accept: "image/*", required: true, hint: "صورة واضحة للمنتج" },
      { id: "prompt",  type: "prompt", label: "وصف الإعلان (اختياري)", placeholder: "مثال: منتج في مطبخ عصري مع إضاءة طبيعية..." },
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
      { id: "media",  type: "upload", label: "صورتك أو شعارك",          accept: "image/*,video/*", required: true },
      { id: "prompt", type: "prompt", label: "رسالة الإعلان (اختياري)", placeholder: "ما الرسالة التي تريد إيصالها للجمهور؟" },
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
      { id: "text",   type: "prompt",       label: "النص المراد تحويله",   placeholder: "اكتب هنا النص الذي تريد تحويله إلى صوت...", required: true },
      { id: "voice",  type: "button-group", label: "نوع الصوت",            options: [{ value: "male", label: "ذكر" }, { value: "female", label: "أنثى" }], defaultValue: "male" },
      { id: "speed",  type: "slider",       label: "سرعة الكلام",          min: 0.5, max: 2.0, step: 0.1, defaultValue: 1.0, unit: "x" },
      { id: "format", type: "button-group", label: "صيغة الملف",           options: [{ value: "mp3", label: "MP3" }, { value: "wav", label: "WAV" }], defaultValue: "mp3" },
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
      { id: "audio", type: "upload", label: "ارفع الملف الصوتي أو الفيديو", accept: "audio/*,video/*", required: true, hint: "MP3، WAV، MP4 — بحد أقصى 100MB" },
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
      { id: "audio", type: "upload", label: "ارفع الملف الصوتي", accept: "audio/*", required: true, hint: "MP3 أو WAV" },
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
      { id: "prompt",   type: "prompt",       label: "صف المؤثر الصوتي",   placeholder: "مثال: صوت رعد ومطر في غابة استوائية...", required: true },
      { id: "duration", type: "button-group", label: "المدة",              options: [{ value: "5", label: "5 ث" }, { value: "10", label: "10 ث" }, { value: "30", label: "30 ث" }], defaultValue: "10" },
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
      { id: "prompt",    type: "prompt",       label: "صف الواجهة المطلوبة", placeholder: "مثال: لوحة تحكم إدارية بها جداول وإحصائيات ورسوم بيانية...", required: true },
      { id: "framework", type: "button-group", label: "الإطار البرمجي",      options: [{ value: "react", label: "React" }, { value: "next", label: "Next.js" }, { value: "html", label: "HTML/CSS" }], defaultValue: "react" },
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
      { id: "prompt", type: "prompt", label: "الكود الذي يحتوي على خطأ", placeholder: "الصق الكود هنا أو صف المشكلة التي تواجهها...", required: true },
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
      { id: "prompt", type: "prompt", label: "صف ما تحتاجه", placeholder: "مثال: جدول لقاعدة بيانات مستخدمين مع علاقة بجدول الطلبات...", required: true },
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
      { id: "prompt", type: "prompt", label: "الكود المراد شرحه", placeholder: "الصق الكود هنا وسيشرحه لك الذكاء الاصطناعي بالعربية...", required: true },
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
