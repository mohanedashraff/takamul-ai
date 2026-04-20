"use client";

import React, { use, useState } from "react";
import { MediaRenderer } from "@/components/tools/MediaRenderer";
import { notFound } from "next/navigation";
import { STUDIO_CATEGORIES, ToolCategory, Tool } from "@/lib/data/tools";
import { motion } from "framer-motion";
import { ArrowRight, Upload, Sparkles, Zap, Download, RotateCcw, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Find a tool by its ID across all categories
function findToolById(toolId: string): { tool: Tool; categoryKey: ToolCategory; } | null {
  for (const catKey of Object.keys(STUDIO_CATEGORIES) as ToolCategory[]) {
    const config = STUDIO_CATEGORIES[catKey];
    const foundTool = config.tools.find((t) => t.id === toolId);
    if (foundTool) return { tool: foundTool, categoryKey: catKey };
  }
  return null;
}

export default function ToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  const resolvedParams = use(params);
  const result = findToolById(resolvedParams.toolId);

  if (!result) {
    notFound();
  }

  const { tool, categoryKey } = result;
  const config = STUDIO_CATEGORIES[categoryKey];

  return <ToolInterface tool={tool} categoryKey={categoryKey} config={config} />;
}

function ToolInterface({ tool, categoryKey, config }: { tool: Tool; categoryKey: ToolCategory; config: typeof STUDIO_CATEGORIES[ToolCategory] }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [hasResult, setHasResult] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setHasResult(true);
    }, 3000);
  };

  const handleReset = () => {
    setPrompt("");
    setHasResult(false);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      {/* ── BREADCRUMB ── */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/tools" className="hover:text-white transition-colors">الأدوات</Link>
        <ArrowRight className="w-3 h-3 rotate-180" />
        <Link href={`/tools?tab=${categoryKey}`} className={`hover:text-white transition-colors ${config.colorClass}`}>{config.name}</Link>
        <ArrowRight className="w-3 h-3 rotate-180" />
        <span className="text-white font-medium">{tool.title}</span>
      </div>

      {/* ── TOOL HEADER ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
        className="mb-10"
      >
        <div className="flex items-center gap-5 mb-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10"
            style={{ backgroundColor: `rgba(${config.shadowColor}, 0.1)` }}
          >
            <tool.icon className={`w-8 h-8 ${config.colorClass}`} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">{tool.title}</h1>
            <p className="text-gray-400 mt-1 text-lg">{tool.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.colorClass}`} style={{ borderColor: `rgba(${config.shadowColor}, 0.3)`, backgroundColor: `rgba(${config.shadowColor}, 0.1)` }}>
            {config.name}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Zap className="w-4 h-4" /> {tool.credits} كريديت لكل استخدام
          </span>
        </div>
      </motion.div>

      {/* ── MAIN WORKSPACE ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* ── INPUT PANEL ── */}
        <div className="bento-card rounded-[2rem] p-8 flex flex-col" style={{ '--hover-border': `rgb(${config.shadowColor})`, '--hover-shadow': `rgba(${config.shadowColor}, 0.15)` } as React.CSSProperties}>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-2 h-6 rounded-full" style={{ backgroundColor: `rgb(${config.shadowColor})` }} />
            المدخلات
          </h2>

          {/* Prompt Input */}
          <div className="flex-1 flex flex-col gap-5">
            <div>
              <label className="text-sm text-gray-400 font-medium mb-2 block">الأمر النصي (Prompt)</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`اكتب وصفاً لما تريد... مثال: "${tool.desc}"`}
                className="w-full h-36 bg-bg-primary border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-600 resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm leading-relaxed"
                style={{ '--tw-ring-color': `rgba(${config.shadowColor}, 0.5)` } as React.CSSProperties}
                dir="rtl"
              />
            </div>

            {/* Upload Area */}
            {(categoryKey === "image" || categoryKey === "video" || categoryKey === "audio") && (
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-white/20 transition-colors cursor-pointer group">
                <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3 group-hover:text-gray-400 transition-colors" />
                <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                  اسحب الملف هنا أو <span className={`${config.colorClass} font-bold`}>اختر ملف</span>
                </p>
                <p className="text-xs text-gray-700 mt-1">PNG, JPG, MP4, WAV — بحد أقصى 50MB</p>
              </div>
            )}

            {/* Advanced Settings Placeholder */}
            <details className="group">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-white transition-colors flex items-center gap-2 select-none">
                <ArrowRight className="w-3 h-3 rotate-90 group-open:rotate-[-90deg] transition-transform" />
                إعدادات متقدمة
              </summary>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">الجودة</label>
                  <select className="w-full bg-bg-primary border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': `rgba(${config.shadowColor}, 0.5)` } as React.CSSProperties}>
                    <option value="standard">قياسية</option>
                    <option value="hd">عالية الدقة HD</option>
                    <option value="ultra">فائقة الدقة 4K</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">الأسلوب</label>
                  <select className="w-full bg-bg-primary border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': `rgba(${config.shadowColor}, 0.5)` } as React.CSSProperties}>
                    <option value="natural">طبيعي</option>
                    <option value="cinematic">سينمائي</option>
                    <option value="anime">أنمي</option>
                    <option value="3d">3D واقعي</option>
                  </select>
                </div>
              </div>
            </details>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !prompt.trim()}
            className={cn(
              "mt-6 w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-500",
              isProcessing 
                ? "bg-white/5 text-gray-500 cursor-wait"
                : prompt.trim()
                  ? "text-white shadow-lg hover:scale-[1.02] hover:shadow-xl cursor-pointer"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
            )}
            style={
              !isProcessing && prompt.trim() 
                ? { 
                    backgroundColor: `rgba(${config.shadowColor}, 0.2)`,
                    borderWidth: '1px',
                    borderColor: `rgba(${config.shadowColor}, 0.4)`,
                    boxShadow: `0 0 30px rgba(${config.shadowColor}, 0.2)`
                  } 
                : {}
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> جاري المعالجة...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> ابدأ التوليد
              </>
            )}
          </button>
        </div>

        {/* ── OUTPUT PANEL ── */}
        <div className="bento-card rounded-[2rem] p-8 flex flex-col" style={{ '--hover-border': `rgb(${config.shadowColor})`, '--hover-shadow': `rgba(${config.shadowColor}, 0.15)` } as React.CSSProperties}>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-2 h-6 rounded-full" style={{ backgroundColor: `rgb(${config.shadowColor})` }} />
            النتيجة
          </h2>

          <div className="flex-1 flex items-center justify-center">
            {isProcessing ? (
              /* Processing State */
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: `rgb(${config.shadowColor})`, borderRightColor: `rgb(${config.shadowColor})` }} />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent animate-spin" style={{ borderBottomColor: `rgb(${config.shadowColor})`, animationDirection: 'reverse', animationDuration: '1.5s', opacity: 0.5 }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className={`w-8 h-8 ${config.colorClass} animate-pulse`} />
                  </div>
                </div>
                <p className="text-white font-bold text-lg mb-1">المحرك يعمل...</p>
                <p className="text-gray-500 text-sm">يتم معالجة طلبك بواسطة الذكاء الاصطناعي</p>
              </div>
            ) : hasResult ? (
              /* Result State */
              <div className="w-full">
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black mb-6 relative">
                  <MediaRenderer media={tool.image} alt="Result" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 h-12 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-all">
                    <Download className="w-4 h-4" /> تحميل
                  </button>
                  <button 
                    onClick={handleReset}
                    className="h-12 px-5 rounded-xl border border-white/10 text-gray-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <RotateCcw className="w-4 h-4" /> إعادة
                  </button>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-10">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 border border-white/5" style={{ backgroundColor: `rgba(${config.shadowColor}, 0.05)` }}>
                  <tool.icon className={`w-9 h-9 ${config.colorClass} opacity-40`} />
                </div>
                <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
                  اكتب الأمر النصي في الجانب الأيسر ثم اضغط "ابدأ التوليد" لتشاهد النتيجة هنا
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
