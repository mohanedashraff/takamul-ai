"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  LayoutGrid, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Code,
  ChevronRight,
  ChevronDown,
  Settings,
  CreditCard,
  History,
  TerminalSquare
} from "lucide-react";

export const Sidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(true);

  const isToolsPage = pathname === "/tools";
  const currentTab = searchParams.get("tab");

  const mainLinks = [
    { name: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
  ];

  const toolSubCategories = [
    { name: "ترسانة الصور", tab: "image", icon: ImageIcon },
    { name: "استوديو الفيديو", tab: "video", icon: Video },
    { name: "الهندسة الصوتية", tab: "audio", icon: Music },
    { name: "محرك الأكواد", tab: "code", icon: Code },
  ];

  const bottomLinks = [
    { name: "سجل الاستخدام", href: "/history", icon: History },
    { name: "الاشتراك والكريديت", href: "/billing", icon: CreditCard },
    { name: "الإعدادات", href: "/settings", icon: Settings },
  ];

  return (
    <aside 
      className={cn(
        "sticky right-0 top-0 z-40 h-screen shrink-0 transition-all duration-300 ease-in-out bg-[#000000] border-l border-[#1a1a1a] flex flex-col font-alexandria",
        collapsed ? "w-[5.5rem]" : "w-[16rem]"
      )}
    >
      {/* ── LOGO HEADER ── */}
      <div className="h-20 flex items-center justify-between px-6 shrink-0 relative">
        <Link href="/dashboard" className={cn("flex items-center gap-3 transition-opacity duration-300", collapsed && "opacity-0 pointer-events-none")}>
          <TerminalSquare className="w-6 h-6 text-white" strokeWidth={2} />
          <span className="text-lg font-bold text-white tracking-wide">Yilow</span>
        </Link>
        
        {collapsed && (
          <div className="mx-auto flex items-center justify-center h-full">
            <TerminalSquare className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
        )}

        {/* Minimal Toggle Button */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#000000] border border-[#222222] text-[#888888] flex items-center justify-center hover:text-white transition-colors z-50 shadow-sm"
        >
          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* ── MENUS ── */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        
        {/* Quick Access */}
        <div className="space-y-1">
          {!collapsed && (
             <p className="px-3 mb-3 text-[11px] font-semibold text-[#666666] tracking-wider">القائمة الرئيسية</p>
          )}
          
          {mainLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-colors group text-sm font-medium",
                  isActive ? "text-white" : "text-[#888888] hover:text-[#cccccc]"
                )}
                title={collapsed ? link.name : undefined}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-[#111111] border border-[#222222] rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <link.icon className="w-4 h-4 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
                {!collapsed && <span className="truncate flex-1 relative z-10 tracking-wide">{link.name}</span>}
              </Link>
            )
          })}
        </div>

        {/* Tools Section */}
        <div className="space-y-1">
          {!collapsed && (
             <p className="px-3 mb-3 text-[11px] font-semibold text-[#666666] tracking-wider">الترسانة</p>
          )}

          <div>
            {/* All Tools Button */}
            <button
              onClick={() => {
                if (collapsed) {
                  window.location.href = "/tools";
                } else {
                  setToolsExpanded(!toolsExpanded);
                }
              }}
              className={cn(
                "relative w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-colors group text-sm font-medium",
                isToolsPage && !currentTab ? "text-white" : "text-[#888888] hover:text-[#cccccc]"
              )}
              title={collapsed ? "كل الأدوات" : undefined}
            >
              {isToolsPage && !currentTab && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-[#111111] border border-[#222222] rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <LayoutGrid className="w-4 h-4 relative z-10" strokeWidth={isToolsPage && !currentTab ? 2.5 : 2} />
              
              {!collapsed && (
                <>
                  <Link href="/tools" className="truncate flex-1 text-right relative z-10 tracking-wide">الكل</Link>
                  <ChevronDown className={cn("w-3.5 h-3.5 relative z-10 transition-transform duration-300", toolsExpanded ? "rotate-180" : "")} />
                </>
              )}
            </button>

            {/* Minimialist Sub-Categories Tree */}
            <AnimatePresence initial={false}>
              {!collapsed && toolsExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-1 space-y-0.5"
                >
                  {toolSubCategories.map((sub) => {
                    const isActive = isToolsPage && currentTab === sub.tab;
                    return (
                      <Link 
                        key={sub.tab} 
                        href={`/tools?tab=${sub.tab}`}
                        className={cn(
                          "relative flex items-center gap-3 pr-10 pl-3 py-2.5 rounded-xl transition-colors text-sm font-medium",
                          isActive ? "text-white" : "text-[#888888] hover:text-[#cccccc]"
                        )}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="sidebar-active"
                            className="absolute inset-0 bg-[#111111] border border-[#222222] rounded-xl"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <sub.icon className="w-3.5 h-3.5 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
                        <span className="truncate relative z-10 tracking-wide">{sub.name}</span>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="p-4 shrink-0 space-y-1">
        {bottomLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-colors group text-sm font-medium",
                isActive ? "text-white" : "text-[#888888] hover:text-[#cccccc]"
              )}
              title={collapsed ? link.name : undefined}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-[#111111] border border-[#222222] rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <link.icon className="w-4 h-4 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
              {!collapsed && <span className="truncate relative z-10 tracking-wide">{link.name}</span>}
            </Link>
          )
        })}
      </div>
    </aside>
  );
};
