"use client";

import React, { use, useState } from "react";
import { MediaRenderer } from "@/components/tools/MediaRenderer";
import { notFound, useRouter } from "next/navigation";
import { STUDIO_CATEGORIES, ToolCategory, Tool } from "@/lib/data/tools";
import {
  renderToolInput,
  isFormValid,
  initValues,
  type InputValues,
  type InputSetters,
} from "@/components/tools/ToolInputRenderer";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Download, RotateCcw, Loader2, History, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";

function findToolById(toolId: string): { tool: Tool; categoryKey: ToolCategory } | null {
  for (const catKey of Object.keys(STUDIO_CATEGORIES) as ToolCategory[]) {
    const found = STUDIO_CATEGORIES[catKey].tools.find((t) => t.id === toolId);
    if (found) return { tool: found, categoryKey: catKey };
  }
  return null;
}

export default function WorkspacePage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = use(params);
  const result = findToolById(toolId);
  if (!result) notFound();
  const { tool, categoryKey } = result;
  return <WorkspaceInterface tool={tool} config={STUDIO_CATEGORIES[categoryKey]} />;
}

function WorkspaceInterface({
  tool,
  config,
}: {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}) {
  const router = useRouter();

  // Form state
  const [values, setValues] = useState<Record<string, any>>(() => initValues(tool.inputs));
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const state: InputValues = { values, files, previews };
  const setters: InputSetters = {
    setValue: (id, val) => setValues((prev) => ({ ...prev, [id]: val })),
    setFile: (id, file) => setFiles((prev) => ({ ...prev, [id]: file })),
    setPreview: (id, url) => setPreviews((prev) => ({ ...prev, [id]: url })),
  };

  const valid = isFormValid(tool.inputs, values, files);

  const handleGenerate = () => {
    if (!valid) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setHasResult(true);
    }, 3000);
  };

  const handleReset = () => {
    setValues(initValues(tool.inputs));
    setFiles({});
    Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    setPreviews({});
    setHasResult(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Navbar />

      <div className="flex flex-1 overflow-hidden pt-16 md:pt-20">
        {/* ── RIGHT: INPUT SIDEBAR ──────────────────────────────────────── */}
        <aside className="w-full md:w-[400px] lg:w-[440px] shrink-0 border-l border-white/5 bg-black/50 backdrop-blur-3xl flex flex-col z-10">
          {/* Sidebar Header */}
          <div className="h-16 shrink-0 border-b border-white/5 flex items-center px-5 gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-base truncate">{tool.title}</h1>
              <p className="text-gray-500 text-xs truncate">{config.name}</p>
            </div>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 shrink-0"
              style={{ backgroundColor: `rgba(${config.shadowColor}, 0.12)` }}
            >
              <tool.icon className={cn("w-4 h-4", config.colorClass)} />
            </div>
          </div>

          {/* Inputs */}
          <div className="flex-1 overflow-y-auto px-5 py-6 hide-scroll space-y-5">
            {tool.inputs.map((input) =>
              renderToolInput(input, state, setters, config.shadowColor)
            )}
          </div>

          {/* Generate Button — sticky bottom */}
          <div className="shrink-0 p-5 border-t border-white/5 bg-black/60">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500">التكلفة</span>
              <span
                className="flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full"
                style={{ color: `rgb(${config.shadowColor})`, backgroundColor: `rgba(${config.shadowColor}, 0.1)` }}
              >
                <Zap className="w-3.5 h-3.5" /> {tool.credits} كريديت
              </span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isProcessing || !valid}
              className={cn(
                "w-full h-13 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300",
                isProcessing ? "bg-white/5 text-gray-500 cursor-wait" : "",
                !isProcessing && valid ? "text-white hover:scale-[1.02] hover:brightness-110 cursor-pointer" : "",
                !isProcessing && !valid ? "bg-white/5 text-gray-600 cursor-not-allowed" : ""
              )}
              style={
                !isProcessing && valid
                  ? {
                      backgroundColor: `rgba(${config.shadowColor}, 0.25)`,
                      border: `1px solid rgba(${config.shadowColor}, 0.5)`,
                      boxShadow: `0 0 30px rgba(${config.shadowColor}, 0.25)`,
                      height: "52px",
                    }
                  : { height: "52px" }
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> جاري التوليد...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> ابدأ التوليد
                </>
              )}
            </button>
          </div>
        </aside>

        {/* ── LEFT: RESULT WORKSPACE ───────────────────────────────────── */}
        <main className="flex-1 flex flex-col relative bg-[#020204] overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

          {/* Toolbar */}
          <div className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/5 z-10 bg-black/20 backdrop-blur-sm relative">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-400">مساحة العمل</span>
              <AnimatePresence>
                {hasResult && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="w-2 h-2 rounded-full bg-green-400"
                    style={{ boxShadow: "0 0 8px rgba(74,222,128,0.6)" }}
                  />
                )}
              </AnimatePresence>
            </div>
            <button className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <History className="w-3.5 h-3.5" /> السجل
            </button>
          </div>

          {/* Result Area */}
          <div className="flex-1 flex items-center justify-center p-8 relative z-10 overflow-y-auto">
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center"
                >
                  <div className="relative w-28 h-28 mx-auto mb-8">
                    <div
                      className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                      style={{ borderTopColor: `rgb(${config.shadowColor})`, borderRightColor: `rgba(${config.shadowColor}, 0.3)` }}
                    />
                    <div
                      className="absolute inset-3 rounded-full border-2 border-transparent animate-spin"
                      style={{ borderBottomColor: `rgb(${config.shadowColor})`, animationDirection: "reverse", animationDuration: "2s", opacity: 0.5 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <tool.icon className={cn("w-9 h-9 animate-pulse", config.colorClass)} />
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">جاري المعالجة...</h3>
                  <p className="text-gray-500 text-sm">محرك الذكاء الاصطناعي يعمل على طلبك</p>
                </motion.div>
              ) : hasResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
                  className="w-full max-w-2xl flex flex-col items-center gap-6"
                >
                  <div
                    className="w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                    style={{ boxShadow: `0 0 60px rgba(${config.shadowColor}, 0.15)` }}
                  >
                    <div className="w-full aspect-video bg-black relative">
                      <MediaRenderer media={tool.image} alt="نتيجة التوليد" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button className="h-12 px-7 rounded-2xl font-bold text-sm flex items-center gap-2 bg-white text-black hover:bg-gray-100 transition-colors shadow-xl">
                      <Download className="w-4 h-4" /> تحميل النتيجة
                    </button>
                    <button
                      onClick={handleReset}
                      className="h-12 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm flex items-center gap-2 hover:bg-white/10 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> توليد جديد
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center select-none"
                >
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5"
                    style={{ backgroundColor: `rgba(${config.shadowColor}, 0.05)` }}
                  >
                    <tool.icon
                      className={cn("w-12 h-12 opacity-20", config.colorClass)}
                    />
                  </div>
                  <h2 className="text-xl font-bold text-white/20 mb-2">مساحة الإبداع</h2>
                  <p className="text-gray-600 text-sm max-w-xs mx-auto leading-relaxed">
                    أكمل الإدخالات في الشريط الجانبي ثم اضغط على &quot;ابدأ التوليد&quot;
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
