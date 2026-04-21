import { 
  MessageSquare, Sparkles, Database, Terminal, 
  PenTool, Cpu, Settings, LineChart, Code, Shield
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface Agent {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  image: string;
  colorClass: string;
  shadowColor: string; // Used for glowing borders
  category: AgentCategory;
  price: number; // e.g., 299
  rating: number; // e.g., 4.9
  platform: string; // e.g., "n8n", "Custom API", etc.
  isNew?: boolean;
}

export type AgentCategory = "استشارات مبيعات" | "تسويق رقمي" | "عمليات وبيانات" | "هندسة وبرمجة" | "الكل";

// Extended list of AI Agents
export const AGENTS_LIST: Agent[] = [
  { 
    id: "digital-sales-rep",
    category: "استشارات مبيعات",
    title: "مساعد المبيعات الرقمي", 
    desc: "وكيل يتصل بحساباتك وصندوق الوارد ليرد على العملاء ويِغلق المبيعات نيابة عنك 24/7 بلهجتك المحلية.", 
    icon: MessageSquare, 
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600&auto=format&fit=crop", 
    colorClass: "text-neon-yellow",
    shadowColor: "254, 228, 64",
    price: 299,
    rating: 4.8,
    platform: "Yilow Native"
  },
  { 
    id: "seo-expert-agent",
    category: "تسويق رقمي",
    title: "خبير تحسين محركات البحث", 
    desc: "وكيل تسويقي يحلل المنافسين، ويقوم بصياغة مقالات مُحسنة ونشرها على مدونتك تلقائياً ليجلب لك زواراً مجانيين.", 
    icon: Sparkles, 
    image: "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?q=80&w=600&auto=format&fit=crop", 
    colorClass: "text-neon-yellow",
    shadowColor: "254, 228, 64",
    price: 199,
    rating: 4.9,
    platform: "Custom Engine"
  },
  { 
    id: "data-accountant-agent",
    category: "عمليات وبيانات",
    title: "مُدقق البيانات والمحاسب", 
    desc: "يقرأ آلاف الإيميلات والفواتير المعقدة يومياً، ويستخرج الأرقام الحيوية ليضعها في جداول منظمة بدقة متناهية.", 
    icon: Database, 
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop", 
    colorClass: "text-neon-yellow",
    shadowColor: "254, 228, 64",
    price: 349,
    isNew: true,
    rating: 5.0,
    platform: "n8n Framework"
  },
  { 
    id: "sysadmin-agent",
    category: "هندسة وبرمجة",
    title: "مُبرمج طوارئ النظام", 
    desc: "وكيل يراقب سيرفراتك وأكوادك ليلاً ونهاراً، يكتشف ثغرات الأمان، ويرسل حزم وإصلاحات برمجية دون أدنى تدخل.", 
    icon: Terminal, 
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop", 
    colorClass: "text-neon-yellow",
    shadowColor: "254, 228, 64",
    price: 499,
    rating: 4.7,
    platform: "Yilow Native"
  },
  { 
    id: "content-creator-agent",
    category: "تسويق رقمي",
    title: "صانع المحتوى الاستراتيجي", 
    desc: "وكيل يخطط روزنامة المحتوى الشهرية، ويكتب نصوص المنشورات ويقترح تصاميم مناسبة، ثم يقوم بنشرها جدولياً.", 
    icon: PenTool, 
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600&auto=format&fit=crop", 
    colorClass: "text-neon-yellow",
    shadowColor: "254, 228, 64",
    price: 149,
    rating: 4.8,
    platform: "LangChain"
  },
  { 
    id: "devops-engineer-agent",
    category: "هندسة وبرمجة",
    title: "مهندس DevOps السحابي", 
    desc: "وكيل متخصص في إدارة السيرفرات والبنى التحتية السحابية وإعداد وتوجيه الحاويات لضمان استقرار الخوادم.", 
    icon: Cpu, 
    image: "https://images.unsplash.com/photo-1661956602868-6ae368943878?q=80&w=600&auto=format&fit=crop", 
    colorClass: "text-neon-yellow",
    shadowColor: "254, 228, 64",
    price: 599,
    isNew: true,
    rating: 4.9,
    platform: "Docker / n8n"
  },
  {
    id: "cybersecurity-agent",
    category: "هندسة وبرمجة",
    title: "حارس الأمن السيبراني",
    desc: "مستشار أمني ذكي يعيش في بيئتك البرمجية لصد هجمات DDoS تلقائياً وإدارة التشفير وجدران الحماية المعقدة.",
    icon: Shield,
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop",
    colorClass: "text-neon-yellow",
    shadowColor: "254, 228, 64",
    price: 899,
    rating: 5.0,
    platform: "Custom Engine"
  },
  {
    id: "business-analyst-agent",
    category: "عمليات وبيانات",
    title: "محلل استراتيجيات الأعمال",
    desc: "قرارات مُدعمة بالبيانات! يقرأ هذا الوكيل أداء مشاريعك أسبوعياً ويزودك بتوصيات فورية لزيادة أرباح التُجار.",
    icon: LineChart,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop",
    colorClass: "text-neon-yellow",
    shadowColor: "254, 228, 64",
    price: 299,
    rating: 4.6,
    platform: "Yilow Native"
  }
];
