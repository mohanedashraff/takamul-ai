"use client";

import React, { useState, useMemo, Suspense, useEffect } from "react";
import { Search, Sparkles, Zap } from "lucide-react";
import { STUDIO_CATEGORIES, ToolCategory, ALL_TOOLS_FLAT } from "@/lib/data/tools";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { MediaRenderer } from "@/components/tools/MediaRenderer";

const CATEGORY_KEYS = Object.keys(STUDIO_CATEGORIES) as ToolCategory[];

const staggerVar = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const fadeUpVar = {
  hidden: { opacity: 0, y: 20, filter: "blur(5px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
};

export default function AllToolsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">جاري التحميل...</div>}>
      <ToolsContent />
    </Suspense>
  );
}

function ToolsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as ToolCategory | null;
  
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">(
    tabParam && CATEGORY_KEYS.includes(tabParam) ? tabParam : "all"
  );
  const [search, setSearch] = useState("");

  // Sync URL params → state (when sidebar links are clicked)
  useEffect(() => {
    if (tabParam && CATEGORY_KEYS.includes(tabParam)) {
      setActiveCategory(tabParam);
    } else if (!tabParam) {
      setActiveCategory("all");
    }
  }, [tabParam]);

  const filteredTools = useMemo(() => {
    return ALL_TOOLS_FLAT.filter((tool) => {
      const matchSearch = search === "" || tool.title.includes(search) || tool.desc.includes(search);
      const matchCategory = activeCategory === "all" || tool.categoryKey === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [activeCategory, search]);

  const activeConfig = activeCategory !== "all" ? STUDIO_CATEGORIES[activeCategory] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* ── HEADER ── */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 flex items-center gap-3 transition-colors duration-300">
          مكتبة الأدوات الشاملة <Sparkles className={cn("w-6 h-6 transition-colors duration-300", activeConfig ? activeConfig.colorClass : "text-primary-400")} />
        </h1>
        <p className="text-text-secondary text-lg">
          اختر أدوات الذكاء الاصطناعي الأنسب لمهمتك من بين <span className="text-white font-bold">{ALL_TOOLS_FLAT.length}</span> أداة قوية.
        </p>
      </div>

      {/* ── FILTERS & SEARCH BAR ── */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-bg-secondary/50 backdrop-blur-md p-4 rounded-2xl border border-white/5">
        
        {/* Search */}
        <div className="relative w-full md:w-96 group">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary-400 transition-colors" />
          <input 
            placeholder="ابحث عن أداة..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pr-10 pl-4 rounded-xl bg-bg-primary border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/30 transition-all"
          />
        </div>
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {/* All Tab */}
          <button
            onClick={() => { setActiveCategory("all"); router.push("/tools"); }}
            className={cn(
              "relative px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300",
              activeCategory === "all" 
                ? "bg-white/10 text-white border border-white/20 shadow-lg" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            الكل
            <span className="mr-2 text-xs opacity-60">{ALL_TOOLS_FLAT.length}</span>
          </button>

          {CATEGORY_KEYS.map((catKey) => {
            const config = STUDIO_CATEGORIES[catKey];
            const isActive = activeCategory === catKey;
            const toolCount = config.tools.length;
            const CategoryIcon = config.icon;
            
            return (
              <button
                key={catKey}
                onClick={() => { setActiveCategory(catKey); router.push(`/tools?tab=${catKey}`); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300",
                  isActive 
                    ? `${config.colorClass} bg-white/10 border border-white/10 shadow-lg` 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <CategoryIcon className={cn("w-4 h-4", isActive ? config.colorClass : "text-gray-500")} />
                {config.name}
                <span className="text-xs opacity-60">{toolCount}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVE CATEGORY BANNER ── */}
      {activeConfig && (
        <div className="flex items-center gap-4">
          <div className={`w-1.5 h-8 rounded-full`} style={{ backgroundColor: `rgb(${activeConfig.shadowColor})` }} />
          <h2 className={`text-xl md:text-2xl font-black ${activeConfig.colorClass}`}>
            {activeConfig.title}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent" style={{ backgroundImage: `linear-gradient(to left, transparent, rgba(${activeConfig.shadowColor}, 0.3))` }} />
        </div>
      )}

      {/* ── TOOLS GRID ── */}
      {filteredTools.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeCategory + search}
            variants={staggerVar}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredTools.map((tool, idx) => {
              const baseStyle = { 
                '--hover-border': `rgb(${tool.shadowColor})`, 
                '--hover-shadow': `rgba(${tool.shadowColor}, 0.25)` 
              } as React.CSSProperties;

              const activeStyle = idx === 0 ? {
                borderColor: `rgb(${tool.shadowColor})`,
                boxShadow: `0 0 25px rgba(${tool.shadowColor}, 0.3)`,
                transform: 'translateY(-5px) scale(1.02)',
                background: 'rgba(10, 10, 15, 0.8)'
              } : {};

              return (
                <Link href={`/tool/${tool.id}`} key={tool.id}>
                  <motion.div 
                    variants={fadeUpVar}
                    style={{ ...baseStyle, ...activeStyle }}
                    className="w-full h-full bento-card rounded-[2rem] p-3 group hover:scale-[1.02] hover:-translate-y-2 transition-all duration-500 cursor-pointer relative"
                  >
                    {/* New Badge */}
                    {tool.isNew && (
                      <div className="absolute top-5 left-5 z-20">
                        <Badge variant="success" className="shadow-lg shadow-success/20 text-[10px] font-black">جديد</Badge>
                      </div>
                    )}

                    {/* Image */}
                    <div className="w-full h-[180px] rounded-[1.5rem] bg-black mb-4 overflow-hidden relative pointer-events-none">
                      <MediaRenderer media={tool.image} alt={tool.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-5">
                        <tool.icon className={`w-7 h-7 ${tool.colorClass}`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-3 pb-3">
                      <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-white/90 transition-colors">{tool.title}</h3>
                      <p className="text-sm text-gray-400 font-light leading-relaxed line-clamp-2 mb-4">{tool.desc}</p>
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className={`text-xs font-bold ${tool.colorClass} uppercase tracking-wider`}>{tool.categoryName}</span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Zap className="w-3.5 h-3.5" />
                          <span>{tool.credits} كريديت</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center mx-auto mb-4 border border-white/5">
            <Search className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">لا يوجد نتائج</h3>
          <p className="text-gray-500">لم يتم العثور على أي أداة تطابق بحثك الحالي.</p>
        </div>
      )}
    </div>
  );
}
