import React from "react";
import Link from "next/link";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/Button";

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-bg-primary/20 backdrop-blur-2xl border-b border-border-glass">
    <div className="site-container h-16 md:h-20 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-400 to-accent-400 opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
          <Terminal className="w-4 h-4 md:w-5 md:h-5 text-white relative z-10" />
        </div>
        <span className="text-xl md:text-2xl font-black text-white tracking-tighter">Yilow<span className="text-accent-400">.ai</span></span>
      </Link>
      <div className="hidden lg:flex items-center gap-10">
        <Link href="/" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">الرئيسية</Link>
        <Link href="/tools" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">الأدوات</Link>
        <Link href="/chat" className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-l from-primary-400 to-accent-400 hover:opacity-80 transition-opacity drop-shadow-[0_0_10px_rgba(157,78,221,0.5)]">Yilow AI</Link>
        <Link href="/dashboard" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">لوحة التحكم</Link>
        <Link href="/spaces" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider">Spaces</Link>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="hidden sm:flex text-sm tracking-wide font-bold">تسجيل الدخول</Button>
        <Link href="/dashboard">
          <Button variant="cosmic" className="text-sm tracking-wide font-bold px-8">ابدأ الآن</Button>
        </Link>
      </div>
    </div>
  </nav>
);

export default Navbar;
