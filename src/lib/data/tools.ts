import { 
  Sparkles, Terminal, Cpu, Zap, AlignLeft, Frame, Radio, Layers, 
  Wand2, Image as ImageIcon, Video, Music, Code, PenTool, Database, MessageSquare 
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface Tool {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  image: string | string[];
  credits: number;
  isNew?: boolean;
}

export const IMAGE_TOOLS: Tool[] = [
  { id: "text-to-image", title: "حول النص إلى صورة", desc: "حوّل كلماتك إلى صور مميزة وفريدة.", icon: ImageIcon, image: "https://static.higgsfield.ai/explore/create-image.mp4", credits: 5, isNew: true },
  { id: "enhance-image", title: "تحسين الصور", desc: "إجعل صورك أكثر وضوحاً وبدقة عالية جداً.", icon: Sparkles, image: "https://static.higgsfield.ai/explore/upscale.mp4", credits: 3 },
  { id: "edit-image", title: "تعديل الصورة", desc: "أضف أو احذف تفاصيل من صورتك بذكاء.", icon: Wand2, image: "https://static.higgsfield.ai/explore/Edit-image-video-inpaint.mp4", credits: 4, isNew: true },
  { id: "bg-remover", title: "إزالة الخلفية", desc: "احذف خلفية صورك بدقة تامة خلال ثوانٍ.", icon: Layers, image: "https://claid.ai/static/remove_bg-f6045fe63f17a1a42b07ff97ce4e20af.mp4", credits: 2 },
  { id: "product-mockup", title: "نماذج منتجات", desc: "أنشئ صور واقعية للمنتجات بصيغ متعددة.", icon: Frame, image: [
    "https://cdn.higgsfield.ai/application_main/a7aa648c-6d7b-463a-8c47-998e25342aaa.mp4",
    "https://cdn.higgsfield.ai/application_main/030c784c-6618-430b-a4d6-e024e9f7973e.mp4",
    "https://cdn.higgsfield.ai/application_main/77335af7-3bf5-4491-bf12-4b695ec524b1.mp4",
    "https://cdn.higgsfield.ai/application_main/6359cba2-3e14-4e2a-bba0-567501c750f9.mp4",
    "https://cdn.higgsfield.ai/application_main/61c1d461-d715-4218-a0f7-62cd41f1e3dc.mp4"
  ], credits: 3 },
  { id: "sketch-to-image", title: "رسم إلى صور", desc: "حوّل رسوماتك اليدوية إلى أعمال فنية ساحرة.", icon: ImageIcon, image: "https://static.higgsfield.ai/nano_draw/image_draw.mp4", credits: 5, isNew: true },
  { id: "restore-image", title: "ترميم الصور", desc: "أعد الحياة إلى صورك التالفة وأحيِ ذكرياتك الثمينة من جديد.", icon: Frame, image: "https://c.topshort.org/fluxai/flux_kontext_apps/old_photo_restore/key_feature/2.webp", credits: 4 },
  { id: "skin-retouch", title: "تحسين البشرة", desc: "أزل الشوائب وحسن مظهر البشرة بضغطة زر.", icon: Sparkles, image: "https://cdn.higgsfield.ai/application_main/fb84f803-64b0-4259-b9a3-b2fc57073da4.mp4", credits: 2, isNew: true },
  { id: "image-outpaint", title: "تمديد الصورة", desc: "وسع أبعاد صورتك وتخيل ما خارج الإطار.", icon: Frame, image: "https://cdn.higgsfield.ai/application_main/18f1d529-5a2d-4f60-9a9a-a7d012464d40.mp4", credits: 5, isNew: true },
  { id: "change-angle", title: "تغيير الزاوية", desc: "غير زاوية رؤية الصورة كما لو تم التقاطها من جديد.", icon: Wand2, image: "https://cdn.higgsfield.ai/application_main/29dc499c-84a0-43c3-8c6b-1e278a6cc474.mp4", credits: 4, isNew: true },
  { id: "multi-scene", title: "مشاهد متعددة", desc: "اكتشف كيف تبدو العناصر في بيئات ومناخات مختلفة.", icon: Layers, image: "https://cdn.higgsfield.ai/application_main/1ae1f1a8-3994-4ead-af2a-fa30c37ea7fb.mp4", credits: 3, isNew: true },
  { id: "relighting", title: "توزيع الإضاءة", desc: "تحكم كامل في إضاءة صورتك لإبراز التفاصيل.", icon: Zap, image: "https://cdn.higgsfield.ai/application_main/ff6c6ba0-3c47-416a-a473-e2b2bd425160.mp4", credits: 4, isNew: true },
  { id: "change-clothes", title: "تغيير الملابس", desc: "قم بتغيير أزياء شخصياتك بأناقة وسهولة غير مسبوقة.", icon: ImageIcon, image: "https://cdn.higgsfield.ai/application_main/da91da29-9fc7-41fd-a99d-b07e4bb010b6.mp4", credits: 5, isNew: true },
  { id: "fashion-designer", title: "مصمم الأزياء", desc: "صمم أزياءك الخاصة وشاهدها على عارضين واقعيين.", icon: Wand2, image: "https://cdn.higgsfield.ai/application_main/bb9d59e1-0493-4031-a97d-27fc7f660c89.mp4", credits: 6, isNew: true },
  { id: "face-swap", title: "تغيير الوجه", desc: "تبديل الوجوه بلمسة واحدة بشكل واقعي ومذهل.", icon: Wand2, image: "https://cdn.higgsfield.ai/application_main/2e53be4f-3594-47ce-a5f6-89c627d14be6.mp4", credits: 4, isNew: true },
  { id: "whats-next", title: "ماذا بعد ؟", desc: "دع الذكاء الاصطناعي يتخيل تكملة صورتك السحرية.", icon: Sparkles, image: "https://cdn.higgsfield.ai/application_main/5600ef95-0305-4b8a-b407-dfa6f5d1f73d.mp4", credits: 3, isNew: true },
];

export const VIDEO_TOOLS: Tool[] = [
  { id: "text-to-video", title: "إنشاء فيديو", desc: "حوّل صورك إلى فيديو ينبض بالحياة.", icon: Video, image: "https://static.higgsfield.ai/explore/create-video.mp4", credits: 20, isNew: true },
  { id: "sketch-to-video", title: "سكيتش لفيديو", desc: "حول الرسومات البسيطة لفيديو مبهر ومتحرك.", icon: Video, image: "https://static.higgsfield.ai/draw/sora/web-sketch-low.mp4", credits: 15, isNew: true },
  { id: "motion-transfer", title: "محاكاة الحركة", desc: "انقل الحركات من أي فيديو إلى صور شخصياتك.", icon: Layers, image: "/media/motion-transfer.mp4", credits: 15 },
  { id: "video-editor", title: "تعديل الفيديو", desc: "حرّر فيديوهاتك باحتراف مع تأثيرات مذهلة.", icon: Terminal, image: "https://static.higgsfield.ai/explore/edit-video.mp4", credits: 10 },
  { id: "lip-sync", title: "تحريك الشفاه", desc: "مزامنة صورتك مع الصوت وشاهد صورك تتكلم بدقة.", icon: Radio, image: "https://static.higgsfield.ai/explore/lipsync-studio.mp4", credits: 15, isNew: true },
  { id: "video-resize", title: "تغيير أبعاد الفيديو", desc: "فيديو واحد، قياس مثالي لكل شاشة، بلا حدود!", icon: Frame, image: "/media/video-resize.webm", credits: 5 },
  { id: "video-vfx", title: "تأثيرات بصرية", desc: "أضف مؤثرات بصرية مذهلة تحبس الأنفاس.", icon: Sparkles, image: "https://higgsfield.ai/flow/video-vfx.mp4", credits: 12, isNew: true },
  { id: "video-transitions", title: "إنتقالات (Transitions)", desc: "إنتقالات ذكية وسلسة تربط مشاهدك بإبداع.", icon: Terminal, image: "https://static.higgsfield.ai/feed/step-3.mp4", credits: 6, isNew: true },
  { id: "video-bg-remover", title: "إزالة الخلفية", desc: "احذف خلفيات الفيديوهات واستبدلها فوراً.", icon: Layers, image: "https://cdn.higgsfield.ai/application_main/6f93883b-e8e3-4c77-9f50-3d20090f8ec3.mp4", credits: 8, isNew: true },
  { id: "product-video", title: "تجربة منتج", desc: "شاهد كيف تبدو منتجاتك وفكرتك في بيئة حقيقية.", icon: Frame, image: ["https://cdn.higgsfield.ai/application_main/c75be66a-b6a9-4cfb-add1-d2a98fa78080.mp4", "https://cdn.higgsfield.ai/application_main/dfe1b41b-2b58-4cf3-aa0d-fda4ebbaae19.mp4"], credits: 10, isNew: true },
  { id: "billboard-video", title: "لوحة إعلانية", desc: "ضع شعارك وإعلانك على أكبر لوحات العالم الافتراضية.", icon: Frame, image: "https://cdn.higgsfield.ai/application_main/a5928bf1-8cca-4f11-80c1-d48602facf5a.mp4", credits: 8, isNew: true },
];

export const AUDIO_TOOLS: Tool[] = [
  { id: "text-to-speech", title: "كلام واقعي بصوت بشري", desc: "استمع فوراً لما تكتبه بصوت طبيعي وواضح.", icon: Music, image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=600&auto=format&fit=crop", credits: 3 },
  { id: "audio-separate", title: "فصل الصوت", desc: "افصل الكلام عن الموسيقى بسهولة ودقة عالية.", icon: Layers, image: "https://images.unsplash.com/photo-1516280440502-3c66f6517170?q=80&w=600&auto=format&fit=crop", credits: 3 },
  { id: "audio-enhance", title: "تحسين الصوت", desc: "نقي صوتك من الضوضاء واجعله أكثر وضوحاً.", icon: Sparkles, image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=600&auto=format&fit=crop", credits: 2 },
  { id: "sfx-generator", title: "إنشاء تأثيرات صوتية", desc: "حوّل النصوص إلى مؤثرات صوتية ساحرة.", icon: Radio, image: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=600&auto=format&fit=crop", credits: 4, isNew: true },
];

export const CODE_TOOLS: Tool[] = [
  { id: "ui-builder", title: "صانع الواجهات", desc: "ولد واجهات وتطبيقات React كاملة من الأوامر النصية.", icon: Code, image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop", credits: 10, isNew: true },
  { id: "bug-finder", title: "مكتشف الأخطاء", desc: "دع الذكاء الاصطناعي يصلح ثغرات الكود المعقدة.", icon: Terminal, image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop", credits: 5 },
  { id: "sql-generator", title: "مبرمج قواعد البيانات", desc: "سيقوم المحرك بتوليد جداول وأوامر SQL مباشرة.", icon: Database, image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop", credits: 5 },
  { id: "code-explainer", title: "مترجم الأكواد", desc: "اشرح الأكواد المعقدة لسطور سهلة الفهم.", icon: AlignLeft, image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop", credits: 2 },
];

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
    tools: IMAGE_TOOLS
  },
  video: {
    name: "الفيديو",
    title: "استوديو الفيديو السينمائي",
    colorClass: "text-accent-400",
    shadowColor: "0, 245, 212",
    icon: Video,
    tools: VIDEO_TOOLS
  },
  audio: {
    name: "الصوت",
    title: "الهندسة الصوتية الرقمية",
    colorClass: "text-neon-yellow",
    shadowColor: "254, 228, 64",
    icon: Music,
    tools: AUDIO_TOOLS
  },
  code: {
    name: "الأكواد",
    title: "محرك الأكواد المتقدم",
    colorClass: "text-primary-400",
    shadowColor: "157, 78, 221",
    icon: Code,
    tools: CODE_TOOLS
  }
};

// Helper: Get all tools flattened with their category key
export const ALL_TOOLS_FLAT = (Object.keys(STUDIO_CATEGORIES) as ToolCategory[]).flatMap((catKey) =>
  STUDIO_CATEGORIES[catKey].tools.map((tool) => ({
    ...tool,
    categoryKey: catKey,
    categoryName: STUDIO_CATEGORIES[catKey].name,
    colorClass: STUDIO_CATEGORIES[catKey].colorClass,
    shadowColor: STUDIO_CATEGORIES[catKey].shadowColor,
  }))
);
