"use client";

import React, { use, useState } from "react";
import { MediaRenderer } from "@/components/tools/MediaRenderer";
import { notFound } from "next/navigation";
import { STUDIO_CATEGORIES, ToolCategory, Tool } from "@/lib/data/tools";
import {
  renderToolInput,
  isFormValid,
  initValues,
  type InputValues,
  type InputSetters,
} from "@/components/tools/ToolInputRenderer";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Download, RotateCcw, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function findToolById(toolId: string): { tool: Tool; categoryKey: ToolCategory } | null {
  for (const catKey of Object.keys(STUDIO_CATEGORIES) as ToolCategory[]) {
    const found = STUDIO_CATEGORIES[catKey].tools.find((t) => t.id === toolId);
    if (found) return { tool: found, categoryKey: catKey };
  }
  return null;
}

export default function ToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = use(params);
  const result = findToolById(toolId);
  if (!result) notFound();
  const { tool, categoryKey } = result;
  return <ToolInterface tool={tool} config={STUDIO_CATEGORIES[categoryKey]} categoryKey={categoryKey} />;
}

function ToolInterface({
  tool,
  config,
  categoryKey,
}: {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
  categoryKey: ToolCategory;
}) {
  const [values, setValues] = useState<Record<string, any>>(() => initValues(tool.inputs));
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
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
    setTimeout(() => { setIsProcessing(false); setHasResult(true); }, 3000);
  };

  const handleReset = () => {
    setValues(initValues(tool.inputs));
    setFiles({});
    Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    setPreviews({});
    setHasResult(false);
  };

  return (
    <div className="pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/tools" className="hover:text-white transition-colors">الأدوات</Link>
        <ArrowRight className="w-3 h-3 rotate-180" />
        <Link href={`/studio/${categoryKey}`} className={cn("hover:text-white transition-colors", config.colorClass)}>
          {config.name}
        </Link>
        <ArrowRight className="w-3 h-3 rotate-180" />
        <span className="text-white font-medium">{tool.title}</span>
      </div>

      {/* Tool Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10"
            style={{ backgroundColor: `rgba(${config.shadowColor}, 0.1)` }}
          >
            <tool.icon className={cn("w-7 h-7", config.colorClass)} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">{tool.title}</h1>
            <p className="text-gray-400 mt-0.5">{tool.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold border"
            style={{
              color: `rgb(${config.shadowColor})`,
              borderColor: `rgba(${config.shadowColor}, 0.3)`,
              backgroundColor: `rgba(${config.shadowColor}, 0.08)`,
            }}
          >
            {config.name}
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Zap className="w-3.5 h-3.5" /> {tool.credits} كريديت
          </span>
        </div>
      </motion.div>

      {/* Workspace: 2-column */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Input Panel */}
        <div
          className="bento-card rounded-[2rem] p-7 flex flex-col gap-5"
          style={{ "--hover-border": `rgb(${config.shadowColor})`, "--hover-shadow": `rgba(${config.shadowColor}, 0.12)` } as React.CSSProperties}
        >
          <h2 className="text-base font-bold text-white flex items-center gap-2.5">
            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: `rgb(${config.shadowColor})` }} />
            الإدخالات
          </h2>

          <div className="flex-1 flex flex-col gap-5">
            {tool.inputs.map((input) =>
              renderToolInput(input, state, setters, config.shadowColor)
            )}
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !valid}
            className={cn(
              "mt-2 w-full h-13 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300",
              isProcessing ? "bg-white/5 text-gray-500 cursor-wait" : "",
              !isProcessing && valid ? "text-white hover:scale-[1.02] hover:brightness-110" : "",
              !isProcessing && !valid ? "bg-white/5 text-gray-600 cursor-not-allowed" : ""
            )}
            style={
              !isProcessing && valid
                ? {
                    backgroundColor: `rgba(${config.shadowColor}, 0.2)`,
                    border: `1px solid rgba(${config.shadowColor}, 0.4)`,
                    boxShadow: `0 0 25px rgba(${config.shadowColor}, 0.2)`,
                    height: "52px",
                  }
                : { height: "52px" }
            }
          >
            {isProcessing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> جاري المعالجة...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> ابدأ التوليد</>
            )}
          </button>
        </div>

        {/* Output Panel */}
        <div
          className="bento-card rounded-[2rem] p-7 flex flex-col"
          style={{ "--hover-border": `rgb(${config.shadowColor})`, "--hover-shadow": `rgba(${config.shadowColor}, 0.12)` } as React.CSSProperties}
        >
          <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2.5">
            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: `rgb(${config.shadowColor})` }} />
            النتيجة
          </h2>

          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    <div
                      className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                      style={{ borderTopColor: `rgb(${config.shadowColor})`, borderRightColor: `rgba(${config.shadowColor}, 0.3)` }}
                    />
                    <div
                      className="absolute inset-2 rounded-full border-2 border-transparent animate-spin"
                      style={{ borderBottomColor: `rgb(${config.shadowColor})`, animationDirection: "reverse", animationDuration: "1.8s", opacity: 0.5 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <tool.icon className={cn("w-7 h-7 animate-pulse", config.colorClass)} />
                    </div>
                  </div>
                  <p className="text-white font-bold mb-1">المحرك يعمل...</p>
                  <p className="text-gray-500 text-sm">يتم معالجة طلبك بالذكاء الاصطناعي</p>
                </motion.div>
              ) : hasResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
                  className="w-full"
                >
                  <div
                    className="w-full rounded-2xl overflow-hidden mb-5 border border-white/10"
                    style={{ boxShadow: `0 0 40px rgba(${config.shadowColor}, 0.12)` }}
                  >
                    <div className="w-full aspect-video bg-black relative">
                      <MediaRenderer media={tool.image} alt="النتيجة" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 h-11 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-lg">
                      <Download className="w-4 h-4" /> تحميل
                    </button>
                    <button
                      onClick={handleReset}
                      className="h-11 px-4 rounded-xl border border-white/10 text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> إعادة
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8 select-none"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5"
                    style={{ backgroundColor: `rgba(${config.shadowColor}, 0.05)` }}
                  >
                    <tool.icon className={cn("w-7 h-7 opacity-25", config.colorClass)} />
                  </div>
                  <p className="text-gray-600 text-sm max-w-[220px] mx-auto leading-relaxed">
                    أكمل الإدخالات واضغط &quot;ابدأ التوليد&quot; لرؤية النتيجة هنا
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
