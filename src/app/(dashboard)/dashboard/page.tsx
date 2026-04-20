"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Sparkles, PenTool, Image as ImageIcon, ArrowUpRight, Zap, Clock, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardOverview() {
  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 mt-4">
      
      {/* ── ALIEN GLOW BACKGROUND FOR DASHBOARD ── */}
      <div className="fixed top-0 right-0 w-full h-[500px] bg-gradient-to-b from-primary-600/10 to-transparent pointer-events-none -z-10" />

      {/* ── CINEMATIC WELCOME BANNER ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-10 sm:p-16 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/90 to-transparent"></div>
        <div className="absolute inset-0 grid-pattern opacity-30"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 h-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center mb-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-white backdrop-blur-md">
                الخطة الحالية: PRO
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight leading-tight">
              أهلاً بعودتك، <span className="text-gradient-neon">أحمد الطارق</span>
            </h1>
            <p className="text-gray-300 text-lg font-light max-w-lg">
              جاهز لإبداع جديد؟ أدواتك العصبية جاهزة لمعالجة الأوامر أسرع من أي وقت مضى.
            </p>
          </div>
          <Button variant="cosmic" size="lg" className="rounded-2xl h-14 px-8 shrink-0">
            فتح استوديو الإبداع <Sparkles className="w-5 h-5 mr-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credits Card */}
        <Card className="border-border-glass group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-400/20 blur-3xl rounded-full transition-all group-hover:bg-accent-400/40"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-400 flex items-center justify-between uppercase tracking-wider">
              طاقة المعالجة (Credits)
              <Zap className="w-5 h-5 text-accent-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-5xl font-black text-white">42,850</div>
              <div className="text-sm text-gray-500 mb-2 font-medium">/ 50,000</div>
            </div>
            <div className="mt-6 h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-accent-400 via-primary-400 to-neon-pink w-[85%] rounded-full shadow-[0_0_10px_rgba(254,228,64,0.8)]"></div>
            </div>
          </CardContent>
        </Card>

        {/* History Card */}
        <Card className="border-border-glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-400 flex items-center justify-between uppercase tracking-wider">
              الزمن المتوفر
              <Clock className="w-5 h-5 text-primary-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-5xl font-black text-white">124</div>
              <div className="text-sm text-gray-500 mb-2 font-medium">ساعة مستخدمة</div>
            </div>
            <p className="text-sm text-green-400 flex items-center mt-6 font-medium">
              <ArrowUpRight className="w-4 h-4 ml-1" /> +12% نشاط متزايد
            </p>
          </CardContent>
        </Card>

        {/* Saved Items */}
        <Card className="border-border-glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-400 flex items-center justify-between uppercase tracking-wider">
              الأرشيف السحابي
              <ImageIcon className="w-5 h-5 text-neon-pink" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-white">1,048</div>
            <p className="text-sm text-gray-400 mt-6 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-pink shadow-[0_0_8px_rgba(254,228,64,0.8)]"></span>
              مزامنة نشطة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Suggested Tools */}
      <div className="pt-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
             <span className="w-2 h-8 rounded-full bg-primary-400"></span>
             محطات الذكاء الاصطناعي المفضلة
          </h2>
          <Button variant="link" className="text-gray-400 hover:text-white">عرض الكل</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "المساعد المعماري", icon: Sparkles, category: "تحليل", color: "text-accent-400", bg: "bg-accent-400/10" },
            { title: "استوديو الصور 4K", icon: ImageIcon, category: "تصميم", color: "text-neon-pink", bg: "bg-neon-pink/10" },
            { title: "صياغة النصوص المتقدمة", icon: PenTool, category: "محتوى", color: "text-primary-400", bg: "bg-primary-500/10" },
            { title: "التحويل السينمائي", icon: Video, category: "فيديو", color: "text-neon-yellow", bg: "bg-neon-yellow/10" },
          ].map((tool, i) => (
            <Card key={i} className="group cursor-pointer border-white/5 hover:border-primary-400/50 hover:-translate-y-2 transition-all duration-500">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-white/10 ${tool.bg} group-hover:scale-110 group-hover:shadow-[0_0_20px_currentColor] transition-all duration-500`} style={{ color: "var(--color-primary-400)" }}>
                  <tool.icon className={`w-8 h-8 ${tool.color}`} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{tool.title}</h3>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">{tool.category}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
