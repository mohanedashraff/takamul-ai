"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { STUDIO_CATEGORIES, ToolCategory } from "@/lib/data/tools";
import { ArrowRight, Sparkles, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Extract category from URL
  const segments = pathname.split("/");
  const currentCategory = segments[segments.length - 1];

  return (
    <div className="min-h-screen bg-bg-primary pt-32 md:pt-40 pb-20 relative overflow-hidden">
      <Navbar />
      {/* Background Ambience */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-primary-600/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="site-container relative z-10 mb-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-white flex items-center gap-4">
            <Sparkles className="w-8 h-8 text-accent-400" />
            الاستوديو
          </h1>
          <p className="text-gray-400 mt-4 text-lg md:text-xl">منصة الذكاء الاصطناعي الشاملة لتوليد المحتوى والأدوات</p>
        </div>

        {/* Tabs and Search Row */}
        <div className="w-full flex flex-col-reverse md:flex-row gap-6 md:items-center justify-between pb-4 border-b border-white/10 relative mb-8">
          
          {/* Categories Tabs Navigation */}
          <div className="flex overflow-x-auto hide-scroll gap-2 md:gap-4 flex-1">
            {(Object.keys(STUDIO_CATEGORIES) as ToolCategory[]).map((cat) => {
              const isActive = currentCategory === cat;
              const config = STUDIO_CATEGORIES[cat];
              
              return (
                <Link 
                  key={cat} 
                  href={`/studio/${cat}`} 
                  className={`relative px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabStudio"
                      className="absolute inset-0 bg-white/10 border border-white/20 rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {config.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-80 shrink-0 group relative">
            <div className="absolute inset-0 bg-accent-400/10 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full pointer-events-none" />
            <div className="relative flex items-center w-full h-12 bg-black/40 border border-white/10 rounded-full overflow-hidden backdrop-blur-md focus-within:border-accent-400/50 transition-colors">
              <div className="pl-4 pr-4 text-gray-500">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                placeholder="ابحث عن أداة الذكاء الاصطناعي..."
                className="w-full h-full bg-transparent border-none outline-none text-white placeholder-gray-500 font-light text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="site-container relative z-10 flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
