"use client";

import React, { useState, useMemo, Suspense } from "react";
import { Search, Sparkles, Zap, Cpu, Star } from "lucide-react";
import { AGENTS_LIST, AgentCategory } from "@/lib/data/agents";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const CATEGORIES: AgentCategory[] = ["الكل", "استشارات مبيعات", "تسويق رقمي", "عمليات وبيانات", "هندسة وبرمجة"];

const staggerVar = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const fadeUpVar = {
  hidden: { opacity: 0, y: 20, filter: "blur(5px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
};

export default function AgentsStorePage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">جاري التحميل...</div>}>
      <AgentsContent />
    </Suspense>
  );
}

function AgentsContent() {
  const [activeCategory, setActiveCategory] = useState<AgentCategory>("الكل");
  const [search, setSearch] = useState("");

  const filteredAgents = useMemo(() => {
    return AGENTS_LIST.filter((agent) => {
      const matchSearch = search === "" || agent.title.includes(search) || agent.desc.includes(search);
      const matchCategory = activeCategory === "الكل" || agent.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [activeCategory, search]);

  return (
    <div className="site-container py-8 space-y-8 pb-12">
      
      {/* ── HEADER ── */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white text-xs font-bold tracking-widest backdrop-blur-md mb-4 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <Cpu className="w-4 h-4 text-accent-400" />
          <span>AI AGENTS متجر</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-2 flex items-center gap-3">
          وظف فريقاً آلياً متكاملاً
        </h1>
        <p className="text-text-secondary text-base md:text-lg max-w-3xl leading-relaxed mt-4">
          استكشف متجر الوكلاء الذكيين المجهزين بالكامل لأداء أصعب مهامك. 
          من خدمة العملاء والمبيعات إلى صيانة الأنظمة وكتابة المحتوى. جاهزون للعمل بضغطة زر لدفع مشروعك للأمام بأسطول من <span className="text-white font-bold">{AGENTS_LIST.length} وكلاء.</span>
        </p>
      </div>

      {/* ── FILTERS & SEARCH BAR ── */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-bg-secondary/50 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-xl">
        
        {/* Search */}
        <div className="relative w-full md:w-96 group">
           <div className="absolute inset-0 bg-accent-400/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl pointer-events-none" />
           <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-accent-400 transition-colors z-10" />
           <input 
             placeholder="ابحث عن خبير، محلل،مبرمج..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="relative z-10 w-full h-12 pr-12 pl-4 rounded-xl bg-bg-primary border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/30 transition-all font-light"
           />
        </div>
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300",
                  isActive 
                    ? `bg-white/10 text-white border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]` 
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── AGENTS GRID ── */}
      {filteredAgents.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeCategory + search}
            variants={staggerVar}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredAgents.map((agent, idx) => {
              const baseStyle = { 
                '--hover-border': `rgb(${agent.shadowColor})`, 
                '--hover-shadow': `rgba(${agent.shadowColor}, 0.15)` 
              } as React.CSSProperties;

              // Apply the exact glow/border from the tools/page to the first card
              const activeStyle = idx === 0 ? {
                borderColor: `rgb(${agent.shadowColor})`,
                boxShadow: `0 0 25px rgba(${agent.shadowColor}, 0.3)`,
                transform: 'translateY(-5px) scale(1.02)',
                background: 'rgba(10, 10, 15, 0.8)'
              } : {};

              return (
                <motion.div 
                  variants={fadeUpVar}
                  style={{ ...baseStyle, ...activeStyle }}
                  key={agent.id}
                  className="bento-card rounded-[2rem] p-3 group hover:scale-[1.02] hover:-translate-y-2 transition-all duration-500 cursor-pointer w-full bg-black/40 border border-white/5 relative"
                >
                  {/* New Badge */}
                  {agent.isNew && (
                    <div className="absolute top-5 left-5 z-20">
                      <Badge variant="success" className="shadow-lg shadow-success/20 text-[10px] font-black">جديد</Badge>
                    </div>
                  )}

                  {/* Image Header */}
                  <div className="w-full h-[220px] rounded-[1.5rem] bg-black mb-5 overflow-hidden relative">
                    <img 
                      src={agent.image} 
                      alt={agent.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100 grayscale-[0.3] group-hover:grayscale-0" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex items-end p-5">
                      <agent.icon className={cn("w-7 h-7", agent.colorClass)} />
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="px-3 pb-3">
                    <div className="flex items-center justify-between mb-2 gap-2">
                       <h3 className="text-xl font-bold text-white group-hover:text-white/90 transition-colors truncate">{agent.title}</h3>
                       <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-md text-xs font-bold text-white shrink-0">
                         <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                         {agent.rating}
                       </div>
                    </div>

                    <div className="mb-3">
                       <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          <Cpu className="w-3 h-3 text-gray-500" />
                          {agent.platform}
                       </span>
                    </div>

                    <p className="text-sm text-gray-400 font-light leading-relaxed mb-4 line-clamp-2">{agent.desc}</p>
                    
                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-400 opacity-70 group-hover:opacity-100 transition-opacity">
                        <span>تفعيل واستئجار</span>
                        <svg className="w-4 h-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <div className="flex items-baseline gap-px">
                          <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
                             ${agent.price}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-500 tracking-widest">/ شهرياً</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      ) : (
         <div className="text-center py-20 bg-bg-secondary/30 rounded-3xl border border-white/5">
           <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-lg">
             <Search className="w-8 h-8 text-gray-500" />
           </div>
           <h3 className="text-2xl font-bold text-white mb-2">الوكيل غير موجود</h3>
           <p className="text-gray-400">لم يتم العثور على وكيل اصطناعي يطابق بحثك الحالي، هل جربت الاستعانة بمبرمج الطوارئ؟ 🤖</p>
         </div>
      )}
    </div>
  );
}
