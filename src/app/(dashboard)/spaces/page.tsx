"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Layers, Film, Type, AudioLines, Bot, Frame, ArrowUpLeft } from "lucide-react";

export default function SpacesPage() {
  const router = useRouter();

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-bg-primary overflow-hidden relative">
      {/* Background Ambience (Subtle) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-400/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-10 z-0 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 1.5px, transparent 1.5px)', backgroundSize: '40px 40px', WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 80%)' }} 
      />

      <div className="site-container relative z-10 py-12 flex flex-col gap-16">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 bg-[#0a0a0f]/50 backdrop-blur-3xl border border-white/5 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          {/* Gradient strictly on the right half, fading out seamlessly on BOTH its right and left edges */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-transparent via-accent-400/10 to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 z-10 relative">
            <div className="w-20 h-20 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:border-accent-400/30 transition-colors">
              <Frame className="w-10 h-10 text-accent-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
                  Spaces
                </h1>
                <span className="px-3 py-1 bg-accent-400/10 border border-accent-400/20 text-accent-400 text-xs font-bold rounded-lg tracking-widest">
                  استوديو متقدم
                </span>
              </div>
              <p className="text-gray-400 font-light text-base md:text-lg max-w-xl leading-relaxed">
                لوحتك اللانهائية للإبداع. قم ببناء مسارات عمل ذكية لإنتاج النصوص، الصور، والفيديو في بيئة مرئية فائقة التطور.
              </p>
            </div>
          </div>

          <div className="z-10 shrink-0 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={() => router.push("/spaces/canvas")}
              className="w-full md:w-auto bg-gradient-to-l from-primary-500 to-accent-500 hover:scale-105 text-white shadow-[0_0_30px_rgba(157,78,221,0.3)] px-8 py-5 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all border border-white/10"
            >
              <Plus className="w-5 h-5" />
              الذهاب إلى استوديو التصميم
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 rounded-full bg-accent-400" />
             <h2 className="text-2xl font-bold text-white">إمكانيات الاستوديو</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: "محركات لغوية",
                desc: "اربط مع Claude 3.5 و GPT-4o لتوليد وتحليل النصوص بصرياً وبشكل تسلسلي.",
                gradient: "group-hover:shadow-[0_0_30px_rgba(157,78,221,0.1)]",
                iconStyle: "text-primary-400 bg-primary-400/10 border-primary-400/20",
              },
              {
                icon: Layers,
                title: "توليد الصور والفن",
                desc: "دمج مباشر لـ FLUX.1 و DALL-E 3 لتصميم لوحات، شعارات وملصقات من نصوص بسيطة.",
                gradient: "group-hover:shadow-[0_0_30px_rgba(0,245,212,0.1)]",
                iconStyle: "text-accent-400 bg-accent-400/10 border-accent-400/20",
              },
              {
                icon: Film,
                title: "الإنتاج المرئي والصوتي",
                desc: "انشئ فيديوهات سينمائية واصوات واقعية من العقد مباشرة دون كتابة سطر كود واحد.",
                gradient: "group-hover:shadow-[0_0_30px_rgba(241,91,181,0.1)]",
                iconStyle: "text-neon-pink bg-neon-pink/10 border-neon-pink/20",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`bg-black/30 border border-white/5 rounded-[2rem] p-8 transition-all duration-300 group hover:-translate-y-1 hover:border-white/10 ${feature.gradient} cursor-pointer`}
                onClick={() => router.push("/spaces/canvas")}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-transform group-hover:scale-110 ${feature.iconStyle}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Nodes Catalog */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 rounded-full bg-primary-500" />
               <h2 className="text-2xl font-bold text-white">العقد المتاحة للمسارات</h2>
            </div>
            <button
               onClick={() => router.push("/spaces/canvas")}
               className="text-xs font-bold tracking-widest text-accent-400 hover:text-white transition-colors flex items-center gap-1 group"
            >
               اكتشف المزيد <ArrowUpLeft className="w-4 h-4 rtl:-scale-x-100 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { icon: Type, label: "النصوص (Text)", color: "text-purple-400", bg: "bg-purple-400/5" },
              { icon: Sparkles, label: "مولّد الصور", color: "text-accent-400", bg: "bg-accent-400/5" },
              { icon: Film, label: "مولّد الفيديو", color: "text-orange-400", bg: "bg-orange-400/5" },
              { icon: AudioLines, label: "مولّد الصوت", color: "text-green-400", bg: "bg-green-400/5" },
              { icon: Bot, label: "مساعد ذكي", color: "text-primary-400", bg: "bg-primary-400/5" },
            ].map((node, i) => (
              <div
                key={i}
                className={`border border-white/[0.04] rounded-2xl p-5 flex flex-col items-center gap-3 hover:border-white/10 transition-all group cursor-pointer ${node.bg} hover:bg-white/[0.04]`}
                onClick={() => router.push("/spaces/canvas")}
              >
                <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
                  <node.icon className={`w-5 h-5 ${node.color}`} />
                </div>
                <span className="text-sm text-gray-300 font-medium tracking-wide">{node.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
