"use client";

import React, { use, useState } from "react";
import { MediaRenderer } from "@/components/tools/MediaRenderer";
import { notFound, useRouter } from "next/navigation";
import { STUDIO_CATEGORIES, ToolCategory, Tool } from "@/lib/data/tools";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Upload, Sparkles, Zap, Download, RotateCcw, Loader2, Settings, History } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";

// Find a tool by its ID across all categories
function findToolById(toolId: string): { tool: Tool; categoryKey: ToolCategory; } | null {
  for (const catKey of Object.keys(STUDIO_CATEGORIES) as ToolCategory[]) {
    const config = STUDIO_CATEGORIES[catKey];
    const foundTool = config.tools.find((t) => t.id === toolId);
    if (foundTool) return { tool: foundTool, categoryKey: catKey };
  }
  return null;
}

export default function WorkspacePage({ params }: { params: Promise<{ toolId: string }> }) {
  const resolvedParams = use(params);
  const result = findToolById(resolvedParams.toolId);

  if (!result) {
    notFound();
  }

  const { tool, categoryKey } = result;
  const config = STUDIO_CATEGORIES[categoryKey];

  return <WorkspaceInterface tool={tool} categoryKey={categoryKey} config={config} />;
}

function WorkspaceInterface({ tool, categoryKey, config }: { tool: Tool; categoryKey: ToolCategory; config: typeof STUDIO_CATEGORIES[ToolCategory] }) {
  const router = useRouter();
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
    <div className="flex flex-col min-h-screen bg-bg-primary font-alexandria">
      <Navbar />
      <div className="flex flex-1 w-full overflow-hidden pt-16 md:pt-20">
      {/* ── RIGHT LAYOUT: INPUT SIDEBAR ── */}
      <div className="w-full md:w-[400px] lg:w-[450px] shrink-0 border-l border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col z-10 shadow-2xl relative">
        
        {/* Header inside Sidebar */}
        <div className="h-20 shrink-0 border-b border-white/5 flex items-center px-6 gap-4">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg truncate">{tool.title}</h1>
            <p className="text-gray-500 text-xs truncate">{config.name}</p>
          </div>
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 shrink-0"
            style={{ backgroundColor: `rgba(${config.shadowColor}, 0.1)` }}
          >
            <tool.icon className={`w-5 h-5 ${config.colorClass}`} />
          </div>
        </div>

        {/* Inputs Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 hide-scroll">
          <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" /> لوحة التحكم
          </h2>

          <div className="space-y-6">
            
            {/* Prompt Area */}
            <div>
              <label className="text-sm text-gray-400 font-medium mb-2 block">الأمر النصي الذكي</label>
              <div className="relative">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`اكتب هنا ما تتخيله...\nمثال: ${tool.desc}`}
                  className="w-full h-40 bg-[#0a0a0c] border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-600 resize-none focus:outline-none focus:border-transparent transition-all text-sm leading-relaxed"
                  style={{ boxShadow: prompt ? `0 0 0 1px rgba(${config.shadowColor}, 0.5)` : 'none' }}
                  dir="rtl"
                />
                <button 
                  className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  title="تحسين الأمر بالذكاء الاصطناعي"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Upload Area for specific tool types */}
            {(categoryKey === "image" || categoryKey === "video" || categoryKey === "audio") && (
              <div>
                <label className="text-sm text-gray-400 font-medium mb-2 block">ملفات مرجعية</label>
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-white/20 transition-colors cursor-pointer group bg-[#0a0a0c]">
                  <Upload className="w-6 h-6 text-gray-600 mx-auto mb-2 group-hover:text-gray-400 transition-colors" />
                  <p className="text-xs text-gray-500 group-hover:text-gray-400">
                    اسحب ملفاتك أو <span className={`${config.colorClass} font-bold`}>استعرض</span>
                  </p>
                </div>
              </div>
            )}

            {/* Quality & Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">الجودة المستهدفة</label>
                <select className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 transition-all" style={{ '--tw-ring-color': `rgba(${config.shadowColor}, 0.5)` } as React.CSSProperties}>
                  <option value="high">عالية الدقة</option>
                  <option value="ultra">فائقة 4K</option>
                  <option value="fast">سريعة</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">وضع المحرك</label>
                <select className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 transition-all" style={{ '--tw-ring-color': `rgba(${config.shadowColor}, 0.5)` } as React.CSSProperties}>
                  <option value="creative">إبداعي</option>
                  <option value="precise">دقيق جداً</option>
                  <option value="balanced">متوازن</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Generate Action Area (Sticky Bottom) */}
        <div className="shrink-0 p-6 border-t border-white/5 bg-black/60 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-4">
             <span className="text-xs text-gray-500">التكلفة المتوقعة:</span>
             <span className="flex items-center gap-1.5 text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-full">
               <Zap className={`w-3.5 h-3.5 ${config.colorClass}`} /> {tool.credits} كريديت
             </span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isProcessing || !prompt.trim()}
            className={cn(
              "w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-500",
              isProcessing 
                ? "bg-white/5 text-gray-500 cursor-wait"
                : prompt.trim()
                  ? "text-white shadow-lg hover:scale-[1.02] hover:shadow-xl cursor-pointer"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
            )}
            style={
              !isProcessing && prompt.trim() 
                ? { 
                    backgroundColor: `rgba(${config.shadowColor}, 0.3)`,
                    borderWidth: '1px',
                    borderColor: `rgba(${config.shadowColor}, 0.5)`,
                    boxShadow: `0 0 30px rgba(${config.shadowColor}, 0.3)`
                  } 
                : {}
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> جاري التوليد...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> بناء النتيجة
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── LEFT LAYOUT: WORKSPACE/RESULT AREA ── */}
      <div className="flex-1 flex flex-col relative bg-[#020202]">
        
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
        
        {/* Workspace Toolbar */}
        <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/5 z-10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-300">مساحة العمل</span>
            {hasResult && <span className="w-2 h-2 rounded-full bg-success animate-pulse" title="اكتملت العملية" />}
          </div>
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
               <History className="w-4 h-4" /> السجل
             </button>
          </div>
        </div>

        {/* Result Container */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10 overflow-y-auto">
          {isProcessing ? (
            /* Loading State */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: `rgb(${config.shadowColor})`, borderRightColor: `rgb(${config.shadowColor})` }} />
                <div className="absolute inset-4 rounded-full border-2 border-transparent animate-spin" style={{ borderBottomColor: `rgb(${config.shadowColor})`, animationDirection: 'reverse', animationDuration: '2s', opacity: 0.6 }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <tool.icon className={`w-10 h-10 ${config.colorClass} animate-pulse`} />
                </div>
              </div>
              <h3 className="text-white font-bold text-2xl mb-2">جاري بناء خيالك...</h3>
              <p className="text-gray-500">خوارزميات {config.name} تقوم بمعالجة ملايين البيانات للوصول للنتيجة المبهرة.</p>
            </motion.div>
          ) : hasResult ? (
            /* Result State */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ease: [0.16, 1, 0.3, 1] as const, duration: 0.5 }}
              className="w-full max-w-3xl flex flex-col items-center"
            >
              <div className="w-full relative rounded-3xl overflow-hidden glass-card p-2 shadow-2xl mb-6">
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black relative">
                  <MediaRenderer media={tool.image} alt="Result generated by AI" />
                  {/* Subtle Gradient Overlay inside image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 justify-center w-full">
                <button className="h-14 px-8 rounded-2xl font-bold flex items-center gap-3 transition-colors bg-white text-black hover:bg-gray-200 shadow-xl">
                  <Download className="w-5 h-5" /> تحميل النتيجة بدقة عالية
                </button>
                <button 
                  onClick={handleReset}
                  className="h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center gap-3 hover:bg-white/10 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" /> توليد جديد
                </button>
              </div>
            </motion.div>
          ) : (
            /* Empty State */
            <div className="text-center max-w-md opacity-30 select-none">
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10" 
                style={{ backgroundColor: `rgba(${config.shadowColor}, 0.05)` }}
              >
                <tool.icon className={`w-14 h-14 ${config.colorClass}`} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">مساحة الإبداع الخاصة بك</h2>
              <p className="text-gray-400 leading-relaxed">
                اكتب الأمر الخاص بك في لوحة التحكم الجانبية واضغط على زر بناء النتيجة لتشاهد السحر هنا بملء الشاشة.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
