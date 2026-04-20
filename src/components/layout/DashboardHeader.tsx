"use client";

import React from "react";
import { Search, Bell, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const DashboardHeader = () => {
  return (
    <header className="h-20 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        {/* Search Bar */}
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input 
            type="text"
            placeholder="ابحث عن أداة (مثال: أداة كتابة الإعلانات)..."
            className="w-full h-10 pr-10 pl-4 rounded-xl bg-bg-secondary border border-white/10 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 border-r border-white/5 pr-4 mr-4">
        <Button variant="cosmic" size="sm" className="hidden sm:flex rounded-full px-5">
          ترقية الباقة
        </Button>
        <button className="relative p-2 rounded-full hover:bg-bg-secondary text-text-secondary transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-error border border-bg-primary"></span>
        </button>
        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary-600 to-accent-500 p-[2px] cursor-pointer hover:scale-105 transition-transform">
          <div className="w-full h-full rounded-full bg-bg-secondary flex items-center justify-center">
             <UserIcon className="w-4 h-4 text-text-secondary" />
          </div>
        </div>
      </div>
    </header>
  );
};
