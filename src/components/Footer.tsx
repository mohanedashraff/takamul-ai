import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const Footer = () => (
  <footer className="relative pt-60 pb-20 overflow-hidden bg-bg-primary mt-auto">
    {/* Glow emerging from bottom */}
    <div className="absolute bottom-[-50%] left-1/2 -translate-x-1/2 w-[150%] h-[100%] rounded-[100%] bg-gradient-to-t from-primary-600 via-accent-400 to-transparent blur-[150px] opacity-30 pointer-events-none" />
    
    <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
      <h2 className="text-5xl md:text-7xl font-black text-white mb-8">هل أنت جاهز لتجاوز حدودك؟</h2>
      <p className="text-xl text-gray-400 mb-16">انضم الآن واحصل على 50 كريديت مجاني لتجربة منصة الجيل القادم.</p>
      
      <Link href="/dashboard">
        <Button size="lg" variant="default" className="h-16 px-12 text-lg rounded-2xl group shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:scale-105 transition-all">
          ابتكر عالمك الخاص الآن
        </Button>
      </Link>
    </div>

    <div className="site-container mt-40 flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-gray-500 text-sm">
      <p>© 2026 Yilow.ai. جميع الحقوق محفوظة.</p>
      <div className="flex gap-6 mt-4 md:mt-0">
        <a href="#" className="hover:text-white transition-colors">عن المنصة</a>
        <a href="#" className="hover:text-white transition-colors">شروط الاستخدام</a>
        <a href="#" className="hover:text-white transition-colors">الخصوصية</a>
      </div>
    </div>
  </footer>
);

export default Footer;
