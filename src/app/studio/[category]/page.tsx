"use client";

import React, { use } from "react";
import { notFound } from "next/navigation";
import { STUDIO_CATEGORIES, ToolCategory } from "@/lib/data/tools";
import { motion } from "framer-motion";
import { MediaRenderer } from "@/components/tools/MediaRenderer";

const staggerVar = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUpVar = {
  hidden: { opacity: 0, y: 20, filter: "blur(5px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
};

export default function StudioCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  // Extract category route from promise cleanly inside next.js dynamic route
  const resolvedParams = use(params);
  const category = resolvedParams.category as ToolCategory;
  
  const config = STUDIO_CATEGORIES[category];

  if (!config) {
    notFound();
  }

  return (
    <div className="w-full pb-20">
      {/* Category Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-2 h-8 rounded-full ${config.colorClass.split(" ")[0].replace("text-", "bg-")}`} />
        <h2 className={`text-2xl md:text-4xl font-black ${config.colorClass}`}>{config.title}</h2>
      </div>

      {/* Grid Rendering */}
      <motion.div 
        variants={staggerVar} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {config.tools.map((tool, idx) => {
          const baseStyle = { 
            '--hover-border': `rgb(${config.shadowColor})`, 
            '--hover-shadow': `rgba(${config.shadowColor}, 0.25)` 
          } as React.CSSProperties;

          const activeStyle = idx === 0 ? {
            borderColor: `rgb(${config.shadowColor})`,
            boxShadow: `0 0 25px rgba(${config.shadowColor}, 0.3)`,
            transform: 'translateY(-5px) scale(1.02)',
            background: 'rgba(10, 10, 15, 0.8)'
          } : {};

          return (
            <motion.div 
              variants={fadeUpVar}
              key={tool.title}
              style={{ ...baseStyle, ...activeStyle }}
              className={`w-full h-full bento-card rounded-[2rem] p-3 group hover:scale-[1.02] hover:-translate-y-2 transition-all duration-500 cursor-pointer relative`}
            >
              <div className="w-full h-[180px] rounded-[1.5rem] bg-black mb-5 overflow-hidden relative pointer-events-none">
                <MediaRenderer media={tool.image} alt={tool.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-5">
                  <tool.icon className={`w-7 h-7 ${config.colorClass}`} />
                </div>
              </div>
              <div className="px-3 pb-3">
                <h3 className="text-xl font-bold text-white mb-2">{tool.title}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">{tool.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
