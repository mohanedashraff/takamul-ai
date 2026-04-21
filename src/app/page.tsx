"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence, type Variants } from "framer-motion";
import Link from "next/link";
import { 
  Sparkles, Terminal, Cpu, Zap, AlignLeft, Frame, Radio, Layers, 
  Wand2, Image as ImageIcon, Video, Music, Code, PenTool, Database, MessageSquare, ArrowDown,
  Clock, ArrowUpLeft
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";
import { ElasticModelsTicker } from "@/components/home/ElasticModelsTicker";

// Lazy-load the Spaces live preview (React Flow adds ~100KB of JS)
const SpacesLivePreview = dynamic(() => import("@/components/home/SpacesLivePreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-accent-400 animate-spin" />
    </div>
  ),
});

// Animations
const fadeUpVar: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
};

const staggerVar: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

// Components
const AdvancedLineDivider = ({ colorHex }: { colorHex: string }) => (
  <div className="w-full flex items-center justify-center py-2 relative overflow-hidden">
    <div className="relative w-full max-w-4xl h-px flex items-center justify-center">
       {/* Background track */}
       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
       
       {/* Moving laser scanner */}
       <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
         <motion.div 
           animate={{ x: ["-200%", "200%"] }}
           transition={{ duration: 3, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
           className="h-[2px] w-1/3 absolute top-1/2 -translate-y-1/2"
           style={{ 
             background: `linear-gradient(90deg, transparent, ${colorHex}, transparent)`,
             boxShadow: `0 0 20px ${colorHex}`
           }}
         />
       </div>

       {/* Central Tech Pill */}
       <div className="px-3 py-1.5 rounded-full border border-white/10 bg-[#0a0a0f] relative z-10 flex items-center gap-1.5 shadow-xl">
         <div className="w-0.5 h-2 rounded-full" style={{ backgroundColor: colorHex, opacity: 0.4 }} />
         <div className="w-0.5 h-3.5 rounded-full" style={{ backgroundColor: colorHex, boxShadow: `0 0 10px ${colorHex}` }} />
         <div className="w-0.5 h-2 rounded-full" style={{ backgroundColor: colorHex, opacity: 0.4 }} />
       </div>
    </div>
  </div>
);

const StoreTransitionDivider = () => (
  <div className="w-full border-y border-white/5 bg-[#050508] py-4 relative overflow-hidden flex items-center" dir="ltr">
    {/* Fade Edges */}
    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />
    
    <motion.div 
      className="flex whitespace-nowrap gap-12 w-max text-xs font-bold tracking-[0.2em] uppercase text-accent-400 opacity-60"
      animate={{ x: ["0%", "-50%"] }}
      transition={{ duration: 40, ease: "linear", repeat: Infinity }}
    >
       {[...Array(10)].map((_, i) => (
         <div key={i} className="flex items-center gap-12 whitespace-nowrap">
           <span>SECURE AGENT NETWORK</span>
           <span className="text-white/30 text-lg">✦</span>
           <span>AUTONOMOUS PROTOCOLS</span>
           <span className="text-white/30 text-lg">✦</span>
           <span>SYSTEM READY</span>
           <span className="text-white/30 text-lg">✦</span>
         </div>
       ))}
    </motion.div>
  </div>
);

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MediaRenderer } from "@/components/tools/MediaRenderer";

import { IMAGE_TOOLS, VIDEO_TOOLS, AUDIO_TOOLS, CODE_TOOLS } from "@/lib/data/tools";
import { AGENTS_LIST } from "@/lib/data/agents";

const IMAGE_VIDEOS = [
  "https://cdn.higgsfield.ai/application_main/a7aa648c-6d7b-463a-8c47-998e25342aaa.mp4",
  "https://cdn.higgsfield.ai/application_main/fb84f803-64b0-4259-b9a3-b2fc57073da4.mp4",
  "https://cdn.higgsfield.ai/application_main/ff6c6ba0-3c47-416a-a473-e2b2bd425160.mp4",
  "https://cdn.higgsfield.ai/application_main/bb9d59e1-0493-4031-a97d-27fc7f660c89.mp4",
  "https://cdn.higgsfield.ai/application_main/2e53be4f-3594-47ce-a5f6-89c627d14be6.mp4"
];

const VOICE_PROFILES = [
  { name: "Adam", flag: "🇺🇸", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", tag: "وثائقي عميق" },
  { name: "سارة", flag: "🇪🇬", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", tag: "قصصي ومرح" },
  { name: "Yuki", flag: "🇯🇵", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop", tag: "أنمي حماسي" },
  { name: "فهد", flag: "🇸🇦", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop", tag: "إخباري رسمي" },
];

const AGENT_PROFILES = [
  { name: "خبير الـ SEO", task: "تحليل وتصدر نتائج البحث", desc: "محرك مصمم لتحليل الكلمات المفتاحية، قراءة استراتيجيات المنافسين، وبناء خطط محتوى تضمن تصدر صفحاتك في محرك بحث جوجل بسهولة.", icon: Sparkles, iconColor: "text-blue-400", bgClass: "bg-blue-400/10 border-blue-400/30", glow: "shadow-[0_0_60px_rgba(59,130,246,0.15)]" },
  { name: "المبرمج المساعد", task: "كتابة ومراجعة الأكواد", desc: "أقرأ الأكواد، أكتشف الثغرات، وأقوم بكتابة تطبيقات كاملة بلغات البرمجة الحديثة. مهندس برمجيات متكامل يعمل لخدمتك.", icon: Code, iconColor: "text-primary-400", bgClass: "bg-primary-400/10 border-primary-400/30", glow: "shadow-[0_0_60px_rgba(254,228,64,0.15)]" },
  { name: "مدير التسويق", task: "إدارة الحملات الإعلانية", desc: "أقوم بإدارة حملاتك، كتابة نصوص الإعلانات، وتحليل بيانات السوشيال ميديا لرفع نسبة التحويل والمبيعات بشكل استثنائي.", icon: MessageSquare, iconColor: "text-neon-pink", bgClass: "bg-neon-pink/10 border-neon-pink/30", glow: "shadow-[0_0_60px_rgba(255,105,180,0.15)]" },
  { name: "المحلل المالي", task: "قراءة وتحليل البيانات", desc: "أقرأ الجداول، البيانات المالية، وتحركات السوق لأعطيك تقارير تحليلية بالذكاء الاصطناعي تدعم قراراتك الاستثمارية بدقة.", icon: Database, iconColor: "text-neon-yellow", bgClass: "bg-neon-yellow/10 border-neon-yellow/30", glow: "shadow-[0_0_60px_rgba(255,255,0,0.15)]" },
];

const AI_MODELS_LOGOS = [
  { name: "OpenAI", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-white"><path d="M22.28 9.82a6 6 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.06 6.06 0 0 0 5 4.18a6 6 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 6 6 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9 6.06 6.06 0 0 0 10.27-2.18 6 6 0 0 0 4-2.9 6.05 6.05 0 0 0-.75-7.09zm-9 12.61a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.79.79 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.5 4.5zm-10.7-6.8a4.48 4.48 0 0 1-.27-3l.14.08 4.78 2.76a.8.8 0 0 0 .79 0l5.84-3.37v2.33a.08.08 0 0 1-.03.06l-4.84 2.8a4.5 4.5 0 0 1-6.41-1.66zm1.77-11.4a4.48 4.48 0 0 1 2.6-1.39v9.34l-2.18-1.26a.07.07 0 0 1-.07-.01v-5.58a4.5 4.5 0 0 1-.35-1.1zm15.32 4.15-4.78-2.76a.79.79 0 0 0-.79 0l-5.84 3.37v-2.33a.08.08 0 0 1 .03-.06l4.84-2.8a4.5 4.5 0 0 1 6.54 4.58zm.59 8.96a4.48 4.48 0 0 1-2.6 1.39v-9.34l4.78-2.76a.07.07 0 0 1 .07.01v5.58a4.5 4.5 0 0 1-2.25 5.12zm-6.99-8.58-2.02-1.17V6.44a.08.08 0 0 1 .12-.06l4.84 2.8a4.5 4.5 0 0 1 2.95 3l-.14-.08-4.78-2.76a.79.79 0 0 0-.39-.68v6.74z"/></svg> },
  { name: "Anthropic", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-white"><path d="M21.2 5.8L12 1 2.8 5.8v10.4L12 21l9.2-4.8V5.8Zm-2.2 9.2L12 18.6 5 15V7L12 3.4 19 7v8Z"/><path d="M12 5L7 7.7v5.6L12 16l5-2.7V7.7L12 5Zm0 9.2-3.4-1.8v-3.8L12 6.8l3.4 1.8v3.8L12 14.2Z"/></svg> },
  { name: "Midjourney", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-white"><path d="M3 3v2h2v2H3v2h2v2H3v2h2v2H3v2h2v2H3v2h18v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2V9h-2V7h2V5h-2V3H3zm4 4h2v10H7V7zm4 0h2v10h-2V7zm4 0h2v10h-2V7z"/></svg> },
  { name: "Stability.ai", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-white"><path d="M12 2L1 21h22L12 2zm0 3.8l7.5 13H4.5L12 5.8zM12 10l-4 7h8l-4-7z"/></svg> },
  { name: "Runway", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-white"><g transform="skewX(-15)"><path d="M4 4h4v16H3.5zm6 0h4v16H9.5zm6 0h4v16H15.5z"/></g></svg> },
  { name: "Meta", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-white"><path d="M17.5 5c-1.8 0-3.3 1-4.2 2.4-1.2-1.6-3.2-2.6-5.4-2.6C3.5 4.8 0 8.3 0 12.8 0 17 3.2 20.3 7.3 20.3c2.4 0 4.6-1.1 5.9-2.9 1-1.4 2.6-2.4 4.3-2.4 2.8 0 5 2.1 5 4.8s-2.1 4.5-4.8 4.5v-3.5c1.1 0 1.9-.9 1.9-2 0-1.2-.9-2.2-2-2.2-1.9 0-3.6 1.1-4.6 2.7-1.1 1.6-2.9 2.5-4.9 2.5-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.7.8 4.7 2.3.9 1.4 2.4 2.2 4.1 2.2 3.1 0 5.6-2.6 5.6-5.8S20.7 5 17.5 5z"/></svg> },
  { name: "ElevenLabs", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-white"><path d="M2 12h5v8H2zm7-5h5v13H9zm7-4h5v17h-5z"/></svg> }
];

const AgentStoreVisual = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % AGENT_PROFILES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[140px] flex items-center mt-2 perspective-[1000px]">
       <AnimatePresence>
         {AGENT_PROFILES.map((agent, idx) => {
            const offset = (idx - activeIndex + AGENT_PROFILES.length) % AGENT_PROFILES.length;
            
            return (
               <motion.div
                 key={agent.name}
                 initial={false}
                 style={{ left: "5%" }}
                 animate={{ 
                   y: offset * -8, 
                   x: offset * 120,
                   scale: 1 - offset * 0.05, 
                   opacity: offset === 0 ? 1 : 1 - offset * 0.25,
                   filter: `blur(${offset * 2.5}px)`,
                   zIndex: 30 - offset
                 }}
                 transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                 className={`absolute w-[280px] glass-card rounded-2xl p-4 flex items-center gap-4 border border-white/10 ${agent.bgClass.split(' ')[0]} shadow-2xl backdrop-blur-md origin-left`}
               >
                  <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center shrink-0 border border-white/5">
                    <agent.icon className={`w-6 h-6 ${agent.iconColor}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-white mb-1">{agent.name}</span>
                    <span className="text-xs text-gray-400 truncate">{agent.task}</span>
                  </div>
                  {offset === 0 && (
                     <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="absolute -right-1.5 -top-1.5">
                         <span className="relative flex h-3.5 w-3.5">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                         </span>
                     </motion.div>
                  )}
               </motion.div>
            )
         })}
       </AnimatePresence>
    </div>
  );
};

const ToolSliderSection = ({ title, desc, colorClass, shadowColor, items }: { title: string, desc: string, colorClass: string, shadowColor: string, items: any[] }) => (
  <section className="py-12 md:py-16 relative z-20 overflow-hidden">
    <div className="site-container mb-8 relative">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-2 h-8 rounded-full ${colorClass.split(" ")[0].replace("text-", "bg-")}`} />
        <h2 className={`text-3xl md:text-5xl font-black ${colorClass}`}>{title}</h2>
      </div>
      <p className="text-gray-400 font-light max-w-2xl text-lg">{desc}</p>
    </div>

    <div className="relative w-full">
      <div className="absolute top-0 bottom-0 left-0 w-8 md:w-16 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-8 md:w-16 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

      <div className="flex overflow-x-auto hide-scroll snap-x snap-mandatory gap-6 px-6 md:px-16 pb-12 pt-10">
        {items.map((tool, idx) => {
          const baseStyle = { 
            '--hover-border': `rgb(${shadowColor})`, 
            '--hover-shadow': `rgba(${shadowColor}, 0.25)` 
          } as React.CSSProperties;

          const activeStyle = idx === 0 ? {
            borderColor: `rgb(${shadowColor})`,
            boxShadow: `0 0 20px rgba(${shadowColor}, 0.25)`,
            transform: 'translateY(-5px) scale(1.02)',
            background: 'rgba(10, 10, 15, 0.8)'
          } : {};

          return (
            <Link
              key={tool.title}
              href={`/tool/${tool.id}`}
              style={{ ...baseStyle, ...activeStyle }}
              className={`shrink-0 w-[280px] md:w-[340px] snap-center bento-card rounded-[2rem] p-3 group hover:scale-[1.02] hover:-translate-y-2 transition-all duration-500 cursor-pointer`}
            >
            <div className="w-full h-[200px] rounded-[1.5rem] bg-black mb-5 overflow-hidden relative">
              <MediaRenderer media={tool.image} alt={tool.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-5">
                <tool.icon className={`w-7 h-7 ${colorClass}`} />
              </div>
            </div>
            <div className="px-3 pb-3">
              <h3 className="text-xl font-bold text-white mb-2">{tool.title}</h3>
              <p className="text-sm text-gray-400 font-light leading-relaxed">{tool.desc}</p>
            </div>
          </Link>
          );
        })}

        {/* View All Card */}
        <Link href="/dashboard" className={`shrink-0 w-[280px] md:w-[340px] snap-center bento-card rounded-[2rem] p-6 flex flex-col items-center justify-center group hover:scale-[1.02] transition-all duration-500 cursor-pointer min-h-[300px]`}>
           <div className={`w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors duration-500`}>
              <svg className={`w-8 h-8 ${colorClass} group-hover:-translate-x-2 transition-transform duration-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
           </div>
           <h3 className="text-2xl font-bold text-white mb-2">عرض الجميع</h3>
           <p className="text-sm text-gray-400 font-light text-center">استكشف كافة الأدوات والقدرات المتاحة لهذا القسم</p>
        </Link>
      </div>
    </div>
  </section>
);

const SpacesSection = () => {
  return (
    <section className="py-16 relative w-full bg-bg-primary overflow-hidden flex flex-col items-center">
      
      {/* Background Gradients & Effects */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-bg-primary to-transparent z-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-accent-400/5 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#fee440]/5 rounded-full blur-[100px] pointer-events-none z-0" />
      
      <div 
        className="absolute inset-0 opacity-20 z-0" 
        style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} 
      />

      <div className="site-container relative z-10 flex flex-col items-center">
        
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/5 text-white text-sm font-bold mb-10 tracking-widest backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <Sparkles className="w-5 h-5 text-accent-400" />
          <span>التجربة اللانهائية للإبداع</span>
        </div>
        
        {/* Center Main Text */}
        <h2 className="text-7xl md:text-[130px] font-black text-white mb-6 tracking-tighter text-center uppercase drop-shadow-[0_0_80px_rgba(255,255,255,0.15)]">SPACES</h2>
        <p className="text-xl md:text-[26px] text-gray-300 font-light mb-4 text-center max-w-3xl leading-relaxed">
          لوحتك اللانهائية للإبداع <strong className="text-white tracking-wide font-bold">التعاوني المباشر</strong>.<br />
          أربط أدوات الذكاء الاصطناعي وصمم مسارات عمل حرة لا متناهية.
        </p>

        {/* Main Interface — Live Spaces Preview (real nodes, draggable, no wrapper) */}
        <div className="relative w-full mt-4 h-[500px] md:h-[580px] lg:h-[640px]">
          {/* Floating "Try" badge */}
          <div className="absolute top-5 right-5 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-accent-400/30 backdrop-blur-md shadow-[0_0_20px_rgba(254,228,64,0.2)]">
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse shadow-[0_0_8px_rgba(254,228,64,0.8)]" />
            <span className="text-xs font-bold text-white tracking-wide">تجربة حية — اسحب العقد</span>
          </div>

          <SpacesLivePreview />
        </div>


        {/* Floating Call to Action */}
        <div className="mt-8 z-20 z-relative">
          <Link href="/spaces/canvas">
            <Button variant="cosmic" className="h-[64px] px-14 text-xl font-bold rounded-full shadow-[0_0_60px_rgba(254,228,64,0.4)] hover:scale-110 transition-transform duration-300 relative z-20">
              جرّب التجربة الكاملة ←
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
};

const AgentsStoreSection = () => {
  return (
    <section className="pt-20 pb-24 relative bg-bg-primary overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-400/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="site-container relative z-10 flex flex-col items-center">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="-mt-8 mb-12 inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/10 bg-white/5 text-white text-sm font-bold tracking-widest backdrop-blur-md shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <Cpu className="w-5 h-5 text-accent-400" />
            <span>AI AGENTS متجر</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-6">
            وظف فريقاً <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary-400 to-accent-400">آلياً متكاملاً</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
            استكشف متجر الوكلاء الذكيين المجهزين بالكامل لأداء أصعب مهامك. من خدمة العملاء والمبيعات إلى صيانة الأنظمة وكتابة المحتوى. جاهزون للعمل بضغطة زر.
          </p>
        </div>

        {/* Filtration & Search System */}
        <div className="w-full max-w-5xl mx-auto mb-16 flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-full md:w-1/2 group">
             <div className="absolute inset-0 bg-accent-400/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
             <div className="relative flex items-center w-full h-14 bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
               <div className="pl-4 pr-3 text-gray-500 hidden sm:block">
                  <Sparkles className="w-5 h-5" />
               </div>
               <input 
                 type="text" 
                 placeholder="ابحث عن وكيل (مثال: خبير SEO)..."
                 className="w-full h-full bg-transparent border-none outline-none text-white placeholder-gray-500 font-light px-4 sm:px-0"
               />
             </div>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scroll snap-x">
            {['الكل', 'المبيعات', 'التسويق', 'العمليات', 'البرمجة'].map((tag, i) => (
              <button key={tag} className={`snap-center px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${i===0 ? 'bg-neon-yellow text-black shadow-[0_0_20px_rgba(254,228,64,0.4)] border border-transparent' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:bg-white/10'}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* The Agents Grid (matching slider cards exactly) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {AGENTS_LIST.map((agent) => (
             <div
               key={agent.title}
               className="bento-card rounded-[2rem] p-3 group hover:scale-[1.02] hover:-translate-y-2 transition-all duration-500 cursor-pointer w-full bg-black/40"
               style={{ '--hover-border': 'rgba(254, 228, 64, 0.4)', '--hover-shadow': 'rgba(254, 228, 64, 0.1)' } as React.CSSProperties}
             >
               {/* Card Image Wrapper */}
               <div className="w-full h-[220px] rounded-[1.5rem] bg-black mb-5 overflow-hidden relative">
                 <img 
                   src={agent.image} 
                   alt={agent.title} 
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100 grayscale-[0.3] group-hover:grayscale-0" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex items-end p-5">
                   <agent.icon className={`w-7 h-7 ${agent.colorClass}`} />
                 </div>
               </div>
               
               {/* Card Text Content */}
               <div className="px-3 pb-4">
                 <h3 className="text-xl font-bold text-white mb-2">{agent.title}</h3>
                 <p className="text-sm text-gray-400 font-light leading-relaxed mb-6">{agent.desc}</p>
                 
                 {/* Action Button */}
                 <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-400 opacity-70 group-hover:opacity-100 transition-opacity">
                   <span>تفعيل واستئجار</span>
                   <svg className="w-4 h-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                   </svg>
                 </div>
               </div>
             </div>
          ))}
        </div>

      </div>
    </section>
  );
};

const CATEGORIES = [
  "الكل", "عطر", "مجوهرات", "أي منتج", "حقيبة", "ساعة", "مكياج", "أحذية", "إلكترونيات", "مشروب", "طعام", "عناية بالبشرة", "موديل رجل/امرأة"
];

const TRENDING_IMAGES = [
  { id: 1, url: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80" },
  { id: 2, url: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=600&q=80" },
  { id: 3, url: "https://images.unsplash.com/photo-1599643477874-95880468f763?auto=format&fit=crop&w=600&q=80" },
  { id: 4, url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80" },
  { id: 5, url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80" },
  { id: 6, url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80" },
  { id: 7, url: "https://images.unsplash.com/photo-1512496015851-a1fbca69259c?auto=format&fit=crop&w=600&q=80" },
  { id: 8, url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80" },
  { id: 9, url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=600&q=80" },
  { id: 10, url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" },
  { id: 11, url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80" },
  { id: 12, url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80" },
  { id: 13, url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80" },
  { id: 14, url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80" },
  { id: 15, url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80" },
  { id: 16, url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80" },
  { id: 17, url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80" },
  { id: 18, url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80" },
  { id: 19, url: "https://images.unsplash.com/photo-1524312220945-19ae2f7c4a1e?auto=format&fit=crop&w=600&q=80" },
  { id: 20, url: "https://images.unsplash.com/photo-1550029402-226115b7c579?auto=format&fit=crop&w=600&q=80" }
];

const TrendingGallerySection = () => {
  const [activeTab, setActiveTab] = useState("الكل");
  return (
    <section className="py-20 relative z-20 overflow-hidden" dir="rtl">
       <div className="site-container">
         {/* Header */}
         <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 w-full pb-2">
            <h2 className="text-3xl md:text-5xl font-black text-white whitespace-nowrap">محتوى رائج</h2>
            
            {/* Filter Tabs */}
            <div className="flex w-full overflow-x-auto hide-scroll gap-3 pb-2 items-center justify-start md:justify-end">
               {CATEGORIES.map(cat => (
                 <button 
                   key={cat}
                   onClick={() => setActiveTab(cat)}
                   className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${activeTab === cat ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-gray-400 border-white/5 hover:bg-white/5'}`}
                 >
                   {cat}
                 </button>
               ))}
            </div>
         </div>

         {/* Masonry Grid Wrapper with Fade Out */}
         <div className="relative">
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
               {TRENDING_IMAGES.map((img) => (
                 <motion.div 
                   key={img.id} 
                   initial="rest"
                   whileHover="hover"
                   animate="rest"
                   className="relative overflow-hidden bg-[#0A0A0F] border border-white/5 rounded-[1.5rem] break-inside-avoid shadow-xl cursor-default"
                 >
                    <motion.img 
                      src={img.url} 
                      variants={{ rest: { scale: 1, opacity: 0.8 }, hover: { scale: 1.1, opacity: 1 } }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="w-full block h-auto object-cover" 
                      loading="lazy" 
                    />
                    
                    {/* Hover Overlay */}
                    <motion.div 
                      variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]"
                    >
                       <motion.div
                          variants={{ rest: { y: 20, opacity: 0, scale: 0.9 }, hover: { y: 0, opacity: 1, scale: 1 } }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                       >
                          <Button variant="cosmic" className="shadow-[0_0_30px_rgba(255,255,255,0.3)] px-8 h-12 text-sm font-bold tracking-widest cursor-pointer">
                             تجربة
                          </Button>
                       </motion.div>
                    </motion.div>
                 </motion.div>
               ))}
            </div>

            {/* Seamless Bottom Fade Mask */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent pointer-events-none flex items-end justify-center pb-8 z-10">
               <Button variant="ghost" className="pointer-events-auto border border-white/10 bg-bg-primary/80 backdrop-blur-xl hover:bg-white/10 hover:scale-105 hover:border-white/20 px-10 h-14 rounded-2xl text-gray-200 font-bold tracking-widest transition-all">
                  عرض جميع القوالب
               </Button>
            </div>
         </div>
       </div>
    </section>
  );
};

const PromotionalBanner = () => {
    const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 59, seconds: 35 });
    
    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
           let { hours, minutes, seconds } = prev;
           if (seconds > 0) { seconds--; }
           else {
              if (minutes > 0) { minutes--; seconds = 59; }
              else {
                 if (hours > 0) { hours--; minutes = 59; seconds = 59; }
                 else { hours = 24; minutes = 0; seconds = 0; } // Loop
              }
           }
           return { hours, minutes, seconds };
        });
      }, 1000);
      return () => clearInterval(timer);
    }, []);
  
    const formatNumber = (num: number) => num.toString().padStart(2, '0');
  
    return (
      <div className="site-container relative z-40 mt-[50px]">
        <div className="w-full rounded-[1.5rem] bg-gradient-to-l from-neon-pink/10 to-transparent border border-neon-pink/20 p-2 sm:p-3 flex flex-col md:flex-row items-center gap-4 lg:gap-8 justify-between shadow-[0_0_40px_rgba(254,228,64,0.05)] relative overflow-hidden backdrop-blur-xl group hover:border-neon-pink/40 transition-colors">
          
          {/* Glow overlay */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-r from-transparent to-neon-pink/5 pointer-events-none" />
  
          {/* Left/RTL Right: The Timer Card */}
          <div className="relative z-10 bg-gradient-to-br from-neon-pink/80 to-primary-500/80 rounded-xl p-3 shadow-[0_0_30px_rgba(254,228,64,0.2)] border border-white/20 shrink-0 w-full md:w-auto">
            <div className="flex items-center justify-center gap-2 mb-2 text-white/90 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <svg className="w-3.5 h-3.5 animate-pulse text-neon-yellow" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              عرض حصري لفترة محدودة
            </div>
            <div className="flex items-center gap-2 sm:gap-3 justify-center">
              <div className="bg-black/30 rounded-lg p-2 min-w-[50px] sm:min-w-[55px] text-center border border-white/10 backdrop-blur-md">
                <div className="text-xl sm:text-2xl font-black text-white leading-none">{formatNumber(timeLeft.hours)}</div>
                <div className="text-[9px] sm:text-[10px] text-white/70 mt-1 uppercase">ساعات</div>
              </div>
              <div className="text-white/50 font-bold">:</div>
              <div className="bg-black/30 rounded-lg p-2 min-w-[50px] sm:min-w-[55px] text-center border border-white/10 backdrop-blur-md">
                <div className="text-xl sm:text-2xl font-black text-white leading-none">{formatNumber(timeLeft.minutes)}</div>
                <div className="text-[9px] sm:text-[10px] text-white/70 mt-1 uppercase">دقائق</div>
              </div>
              <div className="text-white/50 font-bold">:</div>
              <div className="bg-black/30 rounded-lg p-2 min-w-[50px] sm:min-w-[55px] text-center border border-white/10 backdrop-blur-md">
                <div className="text-xl sm:text-2xl font-black text-white leading-none text-neon-yellow drop-shadow-[0_0_5px_rgba(255,255,0,0.5)]">{formatNumber(timeLeft.seconds)}</div>
                <div className="text-[9px] sm:text-[10px] text-white/70 mt-1 uppercase">ثواني</div>
              </div>
            </div>
          </div>
  
          {/* Center: Text Content */}
          <div className="flex-1 text-center md:text-right relative z-10" dir="rtl">
            <h3 className="text-white font-black text-lg sm:text-xl lg:text-2xl mb-1 flex items-center justify-center md:justify-start flex-wrap gap-x-2">
              <span className="text-neon-pink tracking-wide uppercase drop-shadow-[0_0_10px_rgba(254,228,64,0.5)]">Yilow اللامحدودة</span> 
              <span>— متاح الآن للجميع! خصم أكثر من 70% 🚀</span>
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm font-medium">
              اصنع فيديوهات وصور بلا حدود، مع وصول حصري لكافة أدوات ونماذج الذكاء الاصطناعي الـ 40 بالموقع.
            </p>
          </div>
  
          {/* Right/RTL Left: CTA Button */}
          <div className="relative z-10 shrink-0 w-full md:w-auto pb-1 md:pb-0" dir="ltr">
            <Button className="w-full md:w-auto bg-neon-yellow hover:bg-primary-500 text-black font-black py-4 sm:py-6 px-6 lg:px-10 rounded-xl shadow-[0_0_20px_rgba(254,228,64,0.5)] transition-all hover:scale-105 flex items-center justify-center gap-3 text-sm sm:text-base border border-white/20">
              احصل على خصم 70% الآن
              <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Button>
          </div>
  
        </div>
      </div>
    );
};

const SEEDANCE_VIDEOS = [
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094513_629920b7-4009-46de-b3b6-b80cc2185275_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094445_b0de712b-ae62-4fb9-9b07-2757b2d0338b_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094417_ba8bf934-a387-4bf5-8a24-f34be2a65d46_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094615_1849e0bf-3c53-4790-80d7-d83d03968910_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094601_f698d8f7-c96a-42c6-ad0c-8e830417201e_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094612_2b122af8-b47a-4518-9d91-9675dd8e3f41_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094557_c0e3952b-1ecf-4621-9b06-eb86a7fe29e8_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094505_e898193e-ec14-4ecc-92ed-be976174fc88_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094412_fbc2c33e-b861-4744-8aa3-13047b3b83c3_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094509_a0443ee0-fd26-4f6a-9938-ee153fde5822_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094654_27691a7e-7a4c-4511-95e2-cd3ae1a11273_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094622_41c4ed95-c7c2-49a8-933e-1cec2ea4e6d9_min.mp4"
];

const SeedancePromoWidget = () => {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 34, seconds: 52 });
    
    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
           let { hours, minutes, seconds } = prev;
           if (seconds > 0) seconds--;
           else {
              seconds = 59;
              if (minutes > 0) minutes--;
              else {
                 minutes = 59;
                 if (hours > 0) hours--;
              }
           }
           return { hours, minutes, seconds };
        });
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    const format = (num: number) => num.toString().padStart(2, '0');

    return (
        <section className="site-container relative z-40 my-8">
            <div className="w-full bg-[#0a0a0f] rounded-[2rem] border border-white/5 p-6 lg:p-8 flex flex-col lg:flex-row gap-8 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                
                {/* Visual Ambient Glows */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-br from-accent-400/10 to-primary-500/10 pointer-events-none blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
                <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-accent-400/30 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

                {/* Left Panel */}
                <div className="w-full lg:w-[40%] flex flex-col justify-center items-center lg:items-start text-center lg:text-right relative z-10" dir="rtl">
                    <p className="text-xs font-bold tracking-widest text-[#f5f6f8] drop-shadow-md mb-6 uppercase flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" /> متاح الآن للجميع
                    </p>
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 tracking-normal uppercase" dir="ltr" style={{fontFamily: "'Oswald', 'Impact', sans-serif"}}>
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-lg">SEEDANCE</span>
                        <span className="text-accent-400 text-3xl lg:text-5xl align-top lg:inline mt-2 lg:mt-0 font-bold ml-1 relative"><span className="absolute -inset-1 blur-md bg-accent-400/30 rounded-full" />2.0</span>
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8 max-w-[320px] lg:max-w-none">
                        أفضل نموذج فيديو في العالم بخصم يصل لـ <span className="text-white font-bold">70%</span> مع توليد لا محدود و محتوى احترافي فائق الدقة.
                    </p>

                    {/* Countdown Box similar to screenshot */}
                    <div className="w-full max-w-sm bg-[#11161d] rounded-2xl border border-white/5 p-5 mb-4 shadow-inner">
                        <div className="flex items-center justify-center gap-2 mb-4 text-gray-400 text-[10px] font-bold tracking-widest uppercase">
                            <Clock className="w-3.5 h-3.5 text-gray-500" /> ينتهي العرض لمرة واحدة خلال...
                        </div>
                        <div className="flex items-center justify-center gap-6 text-center">
                            <div className="flex flex-col">
                                <span className="text-3xl md:text-4xl font-black text-white" dir="ltr">{format(timeLeft.hours)}</span>
                                <span className="text-[10px] text-gray-500 mt-1 uppercase font-medium tracking-wide">ساعات</span>
                            </div>
                            <span className="text-white/20 text-3xl font-black -mt-4">:</span>
                            <div className="flex flex-col">
                                <span className="text-3xl md:text-4xl font-black text-white" dir="ltr">{format(timeLeft.minutes)}</span>
                                <span className="text-[10px] text-gray-500 mt-1 uppercase font-medium tracking-wide">دقائق</span>
                            </div>
                            <span className="text-white/20 text-3xl font-black -mt-4">:</span>
                            <div className="flex flex-col">
                                <span className="text-3xl md:text-4xl font-black text-white" dir="ltr">{format(timeLeft.seconds)}</span>
                                <span className="text-[10px] text-gray-500 mt-1 uppercase font-medium tracking-wide">ثواني</span>
                            </div>
                        </div>

                        <Button className="w-full mt-6 bg-neon-yellow hover:bg-primary-500 text-black shadow-[0_0_20px_rgba(254,228,64,0.4)] border-none rounded-xl py-6 font-black text-sm md:text-base transition-all hover:scale-[1.02]">
                            احصل على العرض الحصري اللامحدود
                        </Button>
                    </div>
                </div>

                {/* Right Panel (Videos Grid) */}
                <div className="w-full lg:w-[60%] relative z-10 flex flex-col justify-center">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                        {SEEDANCE_VIDEOS.map((src, i) => (
                            <div key={i} className="relative rounded-lg overflow-hidden aspect-video bg-black/60 group/vid border border-white/5 transition-transform duration-300 hover:z-20 hover:scale-[1.05] hover:border-white/20 hover:shadow-2xl">
                                <video src={src} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-70 group-hover/vid:opacity-100 transition-opacity duration-500 border-none m-0 p-0 block" />
                            </div>
                        ))}
                    </div>
                    {/* View All Button */}
                    <div className="w-full flex justify-end mt-4">
                        <Button className="bg-[#11161d] hover:bg-[#1a202c] text-white border border-white/10 rounded-[10px] font-bold shadow-2xl backdrop-blur-md px-6 py-2.5 flex items-center gap-2 transition-all group/btn hover:border-white/20 text-xs">
                           تصفح كامل فيديوهات SEEDANCE 2.0 <ArrowUpLeft className="w-4 h-4 rtl:-scale-x-100 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};
// ─── Hero Ambient Background ─────────────────────────────────────────────────
// Soft colored blur blobs + 3-tier particle system: dust (small drifting),
// stars (4-point twinkle), hero-stars (8-point with rotation). Creates depth.
const HeroAmbientBackground = () => {
  const [dust, setDust] = useState<
    Array<{ left: number; top: number; size: number; delay: number; duration: number; driftX: number; driftY: number }>
  >([]);
  const [stars, setStars] = useState<
    Array<{ left: number; top: number; size: number; delay: number; duration: number }>
  >([]);
  const [heroStars, setHeroStars] = useState<
    Array<{ left: number; top: number; delay: number; duration: number }>
  >([]);

  useEffect(() => {
    // Dust: tiny drifting particles (atmospheric)
    setDust(
      Array.from({ length: 30 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 0.5 + Math.random() * 1.2,
        delay: Math.random() * 6,
        duration: 7 + Math.random() * 8,
        driftX: (Math.random() - 0.5) * 40,
        driftY: -(20 + Math.random() * 60),
      }))
    );
    // Medium stars: 4-point cross glare, twinkle
    setStars(
      Array.from({ length: 12 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1.5 + Math.random() * 2.5,
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 3,
      }))
    );
    // Hero stars: 8-point with subtle rotation, few but prominent
    setHeroStars(
      Array.from({ length: 5 }, () => ({
        left: 12 + Math.random() * 76,
        top: 12 + Math.random() * 76,
        delay: Math.random() * 3,
        duration: 4 + Math.random() * 3,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Blur blob 1 — top-left, bright yellow, big and slow */}
      <motion.div
        animate={{ x: [0, 40, -10, 0], y: [0, 30, 10, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[5%] left-[5%] w-[42vw] h-[42vh] rounded-full blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, rgba(254,228,64,0.25) 0%, rgba(254,228,64,0) 70%)",
        }}
      />

      {/* Blur blob 2 — top-right, warm gold */}
      <motion.div
        animate={{ x: [0, -35, 15, 0], y: [0, 25, -10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[10%] right-[5%] w-[38vw] h-[38vh] rounded-full blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(244,196,48,0.22) 0%, rgba(244,196,48,0) 70%)",
        }}
      />

      {/* Blur blob 3 — bottom-left, amber, deep color */}
      <motion.div
        animate={{ x: [0, 30, -15, 0], y: [0, -20, 15, 0], scale: [1.05, 0.95, 1.05] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute bottom-[8%] left-[10%] w-[35vw] h-[35vh] rounded-full blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,180,0,0.2) 0%, rgba(255,180,0,0) 70%)",
        }}
      />

      {/* Blur blob 4 — bottom-right, cream highlight */}
      <motion.div
        animate={{ x: [0, -25, 10, 0], y: [0, -30, 15, 0], scale: [1, 1.25, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[10%] right-[8%] w-[40vw] h-[40vh] rounded-full blur-[115px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,243,163,0.2) 0%, rgba(255,243,163,0) 70%)",
        }}
      />

      {/* Blur blob 5 — center core, pulsing breath */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[25vw] h-[25vh] rounded-full blur-[70px]"
        style={{
          background:
            "radial-gradient(circle, rgba(254,228,64,0.3) 0%, rgba(254,228,64,0) 70%)",
        }}
      />

      {/* ── TIER 1: DUST — tiny drifting particles (atmospheric) ── */}
      {dust.map((p, i) => (
        <motion.div
          key={`dust-${i}`}
          animate={{
            y: [0, p.driftY, 0],
            x: [0, p.driftX, 0],
            opacity: [0.15, 0.7, 0.15],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
          className="absolute rounded-full bg-neon-yellow"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            boxShadow: `0 0 ${p.size * 3}px rgba(254,228,64,0.7)`,
          }}
        />
      ))}

      {/* ── TIER 2: STARS — 4-point cross glare, twinkle ── */}
      {stars.map((s, i) => (
        <motion.div
          key={`star-${i}`}
          animate={{
            scale: [0.6, 1.2, 0.6],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: s.delay,
          }}
          className="absolute"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: 0, height: 0 }}
        >
          {/* Horizontal glare */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-px"
            style={{
              width: `${s.size * 8}px`,
              background:
                "linear-gradient(to right, transparent, rgba(254,228,64,0.9), transparent)",
            }}
          />
          {/* Vertical glare */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px"
            style={{
              height: `${s.size * 8}px`,
              background:
                "linear-gradient(to bottom, transparent, rgba(254,228,64,0.9), transparent)",
            }}
          />
          {/* Bright core */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{
              width: `${s.size}px`,
              height: `${s.size}px`,
              boxShadow: `0 0 ${s.size * 3}px rgba(254,228,64,1), 0 0 ${s.size * 6}px rgba(254,228,64,0.5)`,
            }}
          />
        </motion.div>
      ))}

      {/* ── TIER 3: HERO STARS — 8-point glare with slow rotation ── */}
      {heroStars.map((h, i) => (
        <motion.div
          key={`hero-${i}`}
          animate={{
            scale: [0.7, 1.3, 0.7],
            opacity: [0.5, 1, 0.5],
            rotate: [0, 45, 0],
          }}
          transition={{
            duration: h.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: h.delay,
          }}
          className="absolute"
          style={{ left: `${h.left}%`, top: `${h.top}%`, width: 0, height: 0 }}
        >
          {/* Main cross — horizontal */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: "44px",
              height: "1.5px",
              background:
                "linear-gradient(to right, transparent, rgba(254,228,64,1) 50%, transparent)",
            }}
          />
          {/* Main cross — vertical */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: "1.5px",
              height: "44px",
              background:
                "linear-gradient(to bottom, transparent, rgba(254,228,64,1) 50%, transparent)",
            }}
          />
          {/* Diagonal cross — 45° */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45"
            style={{
              width: "26px",
              height: "1px",
              background:
                "linear-gradient(to right, transparent, rgba(254,228,64,0.6) 50%, transparent)",
            }}
          />
          {/* Diagonal cross — -45° */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45"
            style={{
              width: "26px",
              height: "1px",
              background:
                "linear-gradient(to right, transparent, rgba(254,228,64,0.6) 50%, transparent)",
            }}
          />
          {/* Bright core */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{
              width: "4px",
              height: "4px",
              boxShadow:
                "0 0 6px rgba(255,255,255,1), 0 0 14px rgba(254,228,64,1), 0 0 26px rgba(254,228,64,0.6)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default function PremiumLanding() {
  const containerRef = useRef(null);
  const [imageVideoIndex, setImageVideoIndex] = useState(0);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-bg-primary overflow-hidden selection:bg-primary-500/30">
      <Navbar />

      {/* ── 1. THE SINGULARITY HERO SECTION (MILLION DOLLAR LOOK) ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-start px-6 pt-36 md:pt-44 pb-4 overflow-hidden">
        
        {/* Bottom Fade Gradient for smooth transition */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent z-20 pointer-events-none" />

        {/* Background Depth Effects */}
        <div className="absolute inset-0 bg-transparent opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }} />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-yellow/10 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-yellow/6 rounded-full blur-[180px] pointer-events-none" />

        {/* Ambient background — blur blobs + particles */}
        <HeroAmbientBackground />

        {/* Floating Complex Glass Widgets (Background App Mockups) - TEMPORARILY DISABLED */}
        {/*
        <div className="absolute inset-0 pointer-events-none z-0">
           <motion.div animate={{ y: [-15, 15, -15] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] right-[2%] lg:right-[5%] xl:right-[10%] w-60 p-4 rounded-[1.5rem] bento-card border border-white/10 bg-[#0a0a0f]/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(254,228,64,0.2)] hidden lg:block opacity-60">
              <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                 <div className="w-8 h-8 rounded-xl bg-accent-400/20 flex items-center justify-center border border-accent-400/30"><Music className="w-4 h-4 text-accent-400" /></div>
                 <span className="text-white text-xs font-bold tracking-widest">تحليل الموجات</span>
              </div>
              <div className="flex items-end gap-1.5 h-12 w-full">
                 {[...Array(16)].map((_,i) => <motion.div key={i} animate={{ height: ["20%", "100%", "20%"] }} transition={{ duration: Math.random() * 1.5 + 0.5, repeat: Infinity }} className="flex-1 bg-gradient-to-t from-accent-400/20 to-accent-400 rounded-full" />)}
              </div>
           </motion.div>

           <motion.div animate={{ y: [15, -15, 15] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[45%] left-[2%] lg:left-[5%] xl:left-[10%] w-72 p-4 rounded-[1.5rem] bento-card border border-white/10 bg-[#0a0a0f]/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(254,228,64,0.2)] hidden lg:block opacity-60">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-400/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-yellow-400/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-green-400/50" />
                 </div>
                 <span className="text-gray-500 text-[10px] font-mono font-bold tracking-widest">engine.ts</span>
              </div>
              <div className="font-mono text-[11px] text-primary-400 opacity-90 leading-loose font-bold" dir="ltr">
                 <span><span className="text-pink-500">import</span> {`{ Core }`} <span className="text-pink-500">from</span> 'yilow';</span><br/>
                 <motion.span animate={{ opacity: [0, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>$ Initializing neurolink...</motion.span><br/>
                 <motion.span animate={{ opacity: [0, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}>$ Generating components...</motion.span><br/>
              </div>
           </motion.div>
           
           <motion.div animate={{ y: [-10, 10, -10], rotate: [-2, 2, -2] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[15%] right-[8%] lg:right-[15%] xl:right-[22%] w-48 p-3 rounded-[1.5rem] bento-card border border-white/10 bg-[#0a0a0f]/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(74,222,128,0.2)] hidden xl:flex flex-col opacity-60">
              <div className="w-full h-32 rounded-[1rem] bg-gradient-to-tr from-green-400 to-blue-500 overflow-hidden relative shadow-inner mb-2">
                 <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
                 <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="w-8 h-8 text-white/50" /></div>
              </div>
              <div className="h-8 w-full flex items-center justify-center gap-2">
                 <span className="relative flex h-1.5 w-1.5">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                 </span>
                 <span className="text-white text-[10px] font-bold tracking-widest uppercase">Rendering 4K</span>
              </div>
           </motion.div>
        </div>
        */}

        {/* Hero Content (Foreground) */}
        <motion.div variants={staggerVar} initial="hidden" animate="show" className="relative z-10 text-center max-w-[1000px] mx-auto w-full flex flex-col items-center mt-10 md:mt-16">
          
          <motion.div variants={fadeUpVar} className="mb-8">
             <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-inner hover:scale-105 transition-transform cursor-pointer">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-400"></span>
                </span>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-white">إطلاق المحرك القادم من المستقبل 🚀</span>
             </div>
          </motion.div>

          <motion.h1 variants={fadeUpVar} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.25] text-white mb-6 drop-shadow-2xl pb-2">
            نظام <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 pb-2 inline-block">خارق</span><br/>
            لبناء <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-accent-400 to-neon-pink drop-shadow-[0_0_40px_rgba(254,228,64,0.5)] pb-2 inline-block">أي شيء.</span>
          </motion.h1>

          <motion.p variants={fadeUpVar} className="text-base md:text-lg text-gray-400 font-light max-w-2xl leading-relaxed mb-10 mx-auto">
            منصة "Yilow.ai" تضع قوة 40 نموذج ذكاء اصطناعي عالمي بين يديك. اكتب أوامرك، ودع المحرك يتولى <strong className="text-white font-bold tracking-wide">البرمجة، التصميم، الكتابة، وصناعة الفيديو</strong> في ثوانٍ.
          </motion.p>

          {/* Interactive Core: The Majestic Prompt Bar - TEMPORARILY DISABLED */}
          {/*
          <motion.div variants={fadeUpVar} className="w-full max-w-[800px] relative group z-20 mb-16">
             <div className="absolute inset-[-2px] bg-gradient-to-r from-primary-500 via-accent-400 to-neon-pink rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
             <div className="relative w-full h-16 sm:h-20 bg-[#050508]/80 border border-white/10 rounded-full flex items-center p-2 sm:p-2.5 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                <div className="h-full px-5 sm:px-6 flex-1 flex items-center border-l border-white/10">
                   <Sparkles className="w-5 h-5 text-accent-400 ml-3 hidden sm:block opacity-70" />
                   <input 
                     type="text" 
                     placeholder="تخيل أي شيء واستدعِه للوجود..." 
                     className="w-full bg-transparent border-none text-base md:text-lg text-white placeholder-gray-500/50 outline-none font-bold"
                     readOnly
                   />
                </div>
                <Link href="/dashboard" className="h-full group/btn">
                  <Button className="h-full px-6 md:px-10 rounded-full bg-white text-black hover:bg-gray-200 text-sm md:text-base font-bold tracking-wide transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] flex gap-2 items-center">
                    <span>توليد الآن</span>
                    <Wand2 className="w-4 h-4 opacity-70 group-hover/btn:opacity-100 group-hover/btn:scale-110 transition-all" />
                  </Button>
                </Link>
             </div>
             
             <div className="mt-5 flex flex-wrap justify-center gap-2 opacity-70">
                 <span className="px-3 py-1.5 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold text-gray-300">🔥 صمم متجر عطور</span>
                 <span className="px-3 py-1.5 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold text-gray-300">✨ توليد فيديو سينمائي</span>
                 <span className="px-3 py-1.5 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold text-gray-300">💡 كتابة خطة تسويق</span>
             </div>
          </motion.div>
          */}

          {/* Trusted Companies or Sub Text */}
          {/* Removed static list for the animated ticker below */}

        </motion.div>

        {/* ── 2. HERO CTA BUTTONS ── */}
        <motion.div
          variants={fadeUpVar}
          initial="hidden"
          animate="show"
          className="relative z-20 flex flex-wrap items-center justify-center gap-4 mb-10 md:mb-14"
        >
          <Link href="/dashboard">
            <Button
              variant="cosmic"
              size="lg"
              className="rounded-full shadow-[0_0_40px_rgba(254,228,64,0.35)] hover:scale-105 transition-transform"
            >
              <Sparkles className="w-5 h-5" />
              ابدأ مجاناً
            </Button>
          </Link>
          <Link href="/tools">
            <Button
              variant="cyber"
              size="lg"
              className="rounded-full hover:scale-105 transition-transform"
            >
              استكشف الأدوات
              <ArrowDown className="w-4 h-4 rotate-[-90deg]" />
            </Button>
          </Link>
        </motion.div>

        {/* ── 3. AI MODELS ELASTIC FILM-STRIP TICKER (break out of section padding) ── */}
        <div className="w-screen -mx-6 mt-auto mb-28 md:mb-36 relative z-30 flex flex-col items-center justify-center overflow-visible">
          <ElasticModelsTicker logos={AI_MODELS_LOGOS} />
          {/* Left fade — sits above both strips */}
          <div className="absolute top-[-250px] bottom-[-250px] left-0 w-28 md:w-40 pointer-events-none" style={{ zIndex: 50, background: "linear-gradient(to right, #030305 35%, transparent)" }} />
          {/* Right fade */}
          <div className="absolute top-[-250px] bottom-[-250px] right-0 w-28 md:w-40 pointer-events-none" style={{ zIndex: 50, background: "linear-gradient(to left, #030305 35%, transparent)" }} />
        </div>
      </section>
      
      {/* ── ADVANCED LINE DIVIDER ── */}
      <div className="w-full max-w-5xl mx-auto py-2 relative z-20 opacity-80 mt-[-10px] md:mt-[-20px] mb-8 md:mb-10">
        <AdvancedLineDivider colorHex="#fee440" />
      </div>

      {/* ── 3. HOLOGRAPHIC BENTO GRID ── */}
      <section className="site-container pt-2 pb-6 relative z-20" id="features">
        <div className="text-center mb-10 relative">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">قدرات تتجاوز المُتوقع</h2>
          <p className="text-lg text-gray-400 font-light max-w-2xl mx-auto">صندوق أدوات متكامل مصمم كـ Bento Board ليعطيك كل ما تحتاجه في مساحة قوية ومرتبة.</p>
        </div>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerVar}
          className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8 auto-rows-[280px]"
        >
          {/* Card 1: Video (Large) */}
          <motion.div variants={fadeUpVar} style={{ '--hover-border': 'rgba(254, 228, 64, 0.5)', '--hover-shadow': 'rgba(254, 228, 64, 0.2)' } as React.CSSProperties} className="bento-card col-span-1 md:col-span-4 lg:col-span-4 row-span-1 md:row-span-2 p-8 md:p-10 flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center shrink-0">
                <Video className="w-7 h-7 text-accent-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white">إنتاج الفيديو السينمائي</h3>
            </div>
            <p className="text-gray-400 text-lg leading-relaxed max-w-lg mb-4">قم بتوليد مقاطع فيديو متحركة عالية الدقة من مجرد وصف نصي، مع مزامنة الشفاه لأي وجه ليتحدث بكلماتك فوراً.</p>
            
            {/* Visual Abstract - Auto playing Video */}
            <div className="mt-auto relative w-full h-72 md:h-80 rounded-xl flex items-center justify-center overflow-hidden">
              <video 
                autoPlay={true} 
                loop={true} 
                muted={true} 
                playsInline={true} 
                className="absolute inset-0 w-full h-full object-cover z-10 rounded-xl"
              >
                <source src="https://cdn-front.freepik.com/landings/ai/video-generator/video/v4-home-video-with-logos.webm" type="video/webm" />
              </video>
            </div>
          </motion.div>

           {/* Card 2: Image Studio (Tall) - SWAPPED */}
           <motion.div variants={fadeUpVar} style={{ '--hover-border': 'rgba(254, 228, 64, 0.5)', '--hover-shadow': 'rgba(254, 228, 64, 0.2)' } as React.CSSProperties} className="bento-card col-span-1 md:col-span-2 lg:col-span-2 row-span-1 md:row-span-2 p-8 md:p-10 flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-neon-pink/10 border border-neon-pink/20 flex items-center justify-center shrink-0">
                <ImageIcon className="w-7 h-7 text-neon-pink" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white">استوديو الصور 4K</h3>
            </div>
            <p className="text-gray-400 text-lg leading-relaxed mb-4">توليد، تكبير، وإزالة للخلفيات بدقة خرافية ومذهلة.</p>
            
            {/* Visual: Sequential Videos Playlist */}
            <div className="mt-auto relative w-full h-72 md:h-80 rounded-xl flex items-center justify-center overflow-hidden">
              {IMAGE_VIDEOS.map((src, idx) => (
                <video 
                  key={src}
                  src={src}
                  muted={true} 
                  playsInline={true}
                  preload="auto"
                  onEnded={idx === imageVideoIndex ? () => setImageVideoIndex((prev) => (prev + 1) % IMAGE_VIDEOS.length) : undefined}
                  className={`absolute inset-0 w-full h-full object-cover z-10 rounded-xl transition-opacity duration-1000 ${idx === imageVideoIndex ? 'opacity-100' : 'opacity-0'}`}
                  ref={(el) => {
                     if (el) {
                       if (idx === imageVideoIndex) {
                         const playPromise = el.play();
                         if (playPromise !== undefined) playPromise.catch(() => {});
                       } else {
                         el.pause();
                         if (el.currentTime > 0) el.currentTime = 0;
                       }
                     }
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Card 3: AI Agents Store (Wide) */}
          <motion.div variants={fadeUpVar} style={{ '--hover-border': 'rgba(74, 222, 128, 0.5)', '--hover-shadow': 'rgba(74, 222, 128, 0.2)' } as React.CSSProperties} className="bento-card col-span-1 md:col-span-2 lg:col-span-3 row-span-1 p-8 flex flex-col justify-between overflow-hidden group">
            <div className="relative z-10 mb-2">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center justify-center shrink-0">
                  <Cpu className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white">متجر وكلاء الذكاء الاصطناعي</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">وظّف موظفين افتراضيين! اختر الـ AI Agent المناسب لمهام شركتك (تسويق، برمجة، إدارة) ليبدأ العمل فوراً.</p>
            </div>

            {/* Visual: 3D Stack Active Agents */}
            <AgentStoreVisual />
          </motion.div>

          {/* Card 4: Audio (Wide) */}
          <motion.div variants={fadeUpVar} style={{ '--hover-border': 'rgba(254, 228, 64, 0.5)', '--hover-shadow': 'rgba(254, 228, 64, 0.2)' } as React.CSSProperties} className="bento-card col-span-1 md:col-span-2 lg:col-span-3 row-span-1 p-8 flex flex-col justify-between overflow-hidden group">
            <div className="relative z-10 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-neon-yellow/10 border border-neon-yellow/20 flex items-center justify-center shrink-0">
                  <Music className="w-6 h-6 text-neon-yellow" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white">الهندسة الصوتية</h3>
              </div>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">تحويل النصوص لتعليق صوتي واقعي بمختلف اللهجات، وعزل الضوضاء المتقدم.</p>
            </div>

            {/* Visual: Voice Profiles Marquee */}
            <div className="mt-auto relative w-full h-[85px] rounded-xl flex items-center overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_15%,black_85%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_15%,black_85%,transparent_100%)]" dir="ltr">
               <motion.div 
                 animate={{ x: ["0%", "-33.333%"] }} 
                 transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                 className="flex gap-4 absolute left-0 w-max"
               >
                 {[...VOICE_PROFILES, ...VOICE_PROFILES, ...VOICE_PROFILES].map((voice, idx) => (
                   <div key={idx} className="w-[180px] shrink-0 glass-card rounded-2xl p-2.5 flex items-center gap-3 border border-white/5 bg-black/40 hover:bg-black/80 hover:border-neon-yellow/50 transition-all cursor-pointer group/voice">
                     <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5">
                        <img src={voice.avatar} alt={voice.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/voice:scale-110" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/voice:opacity-100 transition-opacity">
                           <div className="w-7 h-7 rounded-full bg-neon-yellow flex items-center justify-center pl-0.5 shadow-[0_0_10px_rgba(255,255,0,0.5)]">
                              <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                           </div>
                        </div>
                     </div>
                     <div className="flex flex-col justify-center flex-1 overflow-hidden" dir="rtl">
                       <div className="flex items-center justify-between w-full mb-1.5">
                          <span className="text-sm font-bold text-white truncate">{voice.name}</span>
                          <span className="text-xs shrink-0">{voice.flag}</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-neon-yellow whitespace-nowrap">{voice.tag}</span>
                          <div className="h-0.5 flex-1 bg-neon-yellow/20 rounded-full overflow-hidden">
                             <div className="h-full bg-neon-yellow w-1/3 group-hover/voice:w-full transition-all duration-700" />
                          </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <PromotionalBanner />

      {/* ── 3.5. SEPARATE TOOL SLIDER SECTIONS ── */}
      <div className="bg-bg-primary relative py-4">
        <ToolSliderSection
          title="ترسانة الصور الفائقة"
          desc="حوّل مخيلتك إلى صور حقيقية عالية الدقة باستخدام حزمة مذهلة من المولدات الرسومية."
          colorClass="text-neon-yellow"
          shadowColor="254, 228, 64"
          items={IMAGE_TOOLS}
        />

        <AdvancedLineDivider colorHex="#fee440" />

        <ToolSliderSection
          title="استوديو الفيديو السينمائي"
          desc="لا توجد معدات؟ لا مشكلة. أنتج فيديوهات وإعلانات خرافية بنصوصك."
          colorClass="text-neon-yellow"
          shadowColor="254, 228, 64"
          items={VIDEO_TOOLS}
        />

        {/* SEEDANCE NEW WIDGET */}
        <SeedancePromoWidget />

        <AdvancedLineDivider colorHex="#fee440" />

        <ToolSliderSection
          title="الهندسة الصوتية الرقمية"
          desc="أصوات بشرية، تنقية ضوضاء ومؤثرات سينمائية بضغطة زر واحدة."
          colorClass="text-neon-yellow"
          shadowColor="254, 228, 64"
          items={AUDIO_TOOLS}
        />

        <AdvancedLineDivider colorHex="#fee440" />

        <ToolSliderSection
          title="محرك الأكواد المتقدم"
          desc="مساعدك البرمجي الخاص، دع الذكاء الاصطناعي يبني وينقح نظامك بكفاءة عالية."
          colorClass="text-neon-yellow"
          shadowColor="254, 228, 64"
          items={CODE_TOOLS}
        />
      </div>

      {/* ── TRANSITION DIVIDER ── */}
      <StoreTransitionDivider />

      {/* ── 3.75. AI AGENTS STORE SECTION ── */}
      <AgentsStoreSection />

      {/* ── 3.8. SPACES (INFINITE COLLABORATION) SECTION ── */}
      <SpacesSection />

      {/* ── 4. TRENDING TEMPLATES GALLERY ── */}
      <TrendingGallerySection />

      {/* ── 5. THE SINGULARITY FOOTER ── */}
      <Footer />
    </div>
  );
}


