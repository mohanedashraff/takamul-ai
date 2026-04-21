"use client";

import React, { use, useCallback, useEffect, useRef, useState } from "react";
import { MediaRenderer } from "@/components/tools/MediaRenderer";
import { notFound, useRouter } from "next/navigation";
import { STUDIO_CATEGORIES, ToolCategory, Tool } from "@/lib/data/tools";
import { InpaintWorkspace } from "@/components/tools/InpaintWorkspace";
import { SketchWorkspace } from "@/components/tools/SketchWorkspace";
import { OutpaintWorkspace } from "@/components/tools/OutpaintWorkspace";
import { AngleWorkspace } from "@/components/tools/AngleWorkspace";
import { RelightWorkspace } from "@/components/tools/RelightWorkspace";
import { MultiSceneWorkspace } from "@/components/tools/MultiSceneWorkspace";
import { ChangeClothesWorkspace } from "@/components/tools/ChangeClothesWorkspace";
import { FashionDesignerWorkspace } from "@/components/tools/FashionDesignerWorkspace";
import { FaceSwapWorkspace } from "@/components/tools/FaceSwapWorkspace";
import { WhatsNextWorkspace } from "@/components/tools/WhatsNextWorkspace";
import { SketchToVideoWorkspace } from "@/components/tools/SketchToVideoWorkspace";
import { VideoTransitionsWorkspace } from "@/components/tools/VideoTransitionsWorkspace";
import {
  renderToolInput,
  isFormValid,
  initValues,
  type InputValues,
  type InputSetters,
} from "@/components/tools/ToolInputRenderer";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Zap, Download, RotateCcw, Loader2, History,
  ArrowRight, Upload, ImageIcon, X, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";

function findToolById(toolId: string): { tool: Tool; categoryKey: ToolCategory } | null {
  for (const catKey of Object.keys(STUDIO_CATEGORIES) as ToolCategory[]) {
    const found = STUDIO_CATEGORIES[catKey].tools.find((t) => t.id === toolId);
    if (found) return { tool: found, categoryKey: catKey };
  }
  return null;
}

const ToolDotsBackground = () => (
  <div
    className="fixed inset-0 pointer-events-none tool-dots-bg"
    style={{ zIndex: 0 }}
  />
);

export default function WorkspacePage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = use(params);
  const result = findToolById(toolId);
  if (!result) notFound();
  const { tool, categoryKey } = result;
  const config = STUDIO_CATEGORIES[categoryKey];

  const workspace = (() => {
    if (tool.layout === "centered")        return <CenteredWorkspace tool={tool} config={config} />;
    if (tool.layout === "inpaint")         return <InpaintWorkspace tool={tool} config={config} />;
    if (tool.layout === "sketch")          return <SketchWorkspace tool={tool} config={config} />;
    if (tool.layout === "outpaint")        return <OutpaintWorkspace tool={tool} config={config} />;
    if (tool.layout === "angle")           return <AngleWorkspace tool={tool} config={config} />;
    if (tool.layout === "relight")         return <RelightWorkspace tool={tool} config={config} />;
    if (tool.layout === "multi-scene")     return <MultiSceneWorkspace tool={tool} config={config} />;
    if (tool.layout === "change-clothes")  return <ChangeClothesWorkspace tool={tool} config={config} />;
    if (tool.layout === "fashion-designer")return <FashionDesignerWorkspace tool={tool} config={config} />;
    if (tool.layout === "face-swap")       return <FaceSwapWorkspace tool={tool} config={config} />;
    if (tool.layout === "whats-next")      return <WhatsNextWorkspace tool={tool} config={config} />;
    if (tool.layout === "sketch-to-video") return <SketchToVideoWorkspace tool={tool} config={config} />;
    if (tool.layout === "video-transitions")return <VideoTransitionsWorkspace tool={tool} config={config} />;
    return <WorkspaceInterface tool={tool} config={config} />;
  })();

  return (
    <>
      <ToolDotsBackground />
      {workspace}
    </>
  );
}

// ─── Centered workspace — split layout (form left | preview video right) ────────

type Phase = "idle" | "ready" | "processing" | "result";

function CenteredWorkspace({
  tool,
  config,
}: {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}) {
  const router = useRouter();
  const colorRgb = config.shadowColor;

  // Collect all upload inputs + extra non-upload inputs
  const uploadInputs = tool.inputs.filter((i) => i.type === "upload");
  const extraInputs  = tool.inputs.filter((i) => i.type !== "upload");

  // Per-slot file state
  const [files,    setFiles]    = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const previewUrls = useRef<Record<string, string>>({});

  const [phase,      setPhase]      = useState<Phase>("idle");
  const [extraVals,  setExtraVals]  = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      Object.values(previewUrls.current).forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const pickFile = useCallback((id: string, f: File) => {
    if (previewUrls.current[id]) URL.revokeObjectURL(previewUrls.current[id]);
    const url = URL.createObjectURL(f);
    previewUrls.current[id] = url;
    setFiles((prev)    => ({ ...prev, [id]: f }));
    setPreviews((prev) => ({ ...prev, [id]: url }));
  }, []);

  const allFilled = uploadInputs.every((i) => files[i.id]);

  const handleGenerate = () => {
    if (!allFilled || phase === "processing") return;
    setPhase("processing");
    setTimeout(() => setPhase("result"), 3000);
  };

  const handleReset = () => {
    Object.values(previewUrls.current).forEach((u) => URL.revokeObjectURL(u));
    previewUrls.current = {};
    setFiles({});
    setPreviews({});
    setPhase("idle");
  };

  // Video src from tool.image (pick first if array)
  const demoSrc = Array.isArray(tool.image) ? tool.image[0] : tool.image;
  const isVideo = typeof demoSrc === "string" && demoSrc.endsWith(".mp4");

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Navbar />

      <div className="flex-1 flex flex-col pt-16 md:pt-20">
        {/* ── Top bar ── */}
        <div className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10"
              style={{ backgroundColor: `rgba(${colorRgb}, 0.12)` }}
            >
              <tool.icon className={cn("w-4 h-4", config.colorClass)} />
            </div>
            <div>
              <span className="text-white font-bold text-sm">{tool.title}</span>
              <span className="text-gray-600 text-xs mx-2">·</span>
              <span className="text-gray-500 text-xs">{config.name}</span>
            </div>
          </div>
          <span
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ color: `rgb(${colorRgb})`, backgroundColor: `rgba(${colorRgb}, 0.1)` }}
          >
            <Zap className="w-3 h-3" /> {tool.credits} كريديت
          </span>
        </div>

        {/* ── Split body ── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

          {/* ── LEFT: Form ── */}
          <div className="flex flex-col overflow-y-auto border-l border-white/5 bg-black/30" dir="rtl">
            <div className="flex-1 px-8 py-8 space-y-6">

              {/* Title */}
              <div>
                <h1 className="text-2xl font-black text-white uppercase leading-tight tracking-tight">
                  {tool.title}
                </h1>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">{tool.desc}</p>
              </div>

              {/* Upload slots */}
              {uploadInputs.length > 0 && (
                <div className={cn(
                  "grid gap-4",
                  uploadInputs.length === 1 ? "grid-cols-1" : "grid-cols-2"
                )}>
                  {uploadInputs.map((inp) => {
                    const hasFile = !!files[inp.id];
                    const isDrag  = dragging === inp.id;
                    return (
                      <div key={inp.id}>
                        <input
                          ref={(el) => { fileRefs.current[inp.id] = el; }}
                          type="file"
                          accept={inp.accept ?? "image/*"}
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) pickFile(inp.id, f);
                            e.target.value = "";
                          }}
                        />
                        <div
                          onClick={() => fileRefs.current[inp.id]?.click()}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragging(null);
                            const f = e.dataTransfer.files?.[0];
                            if (f) pickFile(inp.id, f);
                          }}
                          onDragOver={(e) => { e.preventDefault(); setDragging(inp.id); }}
                          onDragLeave={() => setDragging(null)}
                          className={cn(
                            "relative rounded-2xl border border-dashed cursor-pointer transition-all duration-200 select-none overflow-hidden",
                            "flex flex-col items-center justify-center gap-2 text-center",
                            hasFile ? "aspect-square" : "aspect-square",
                            isDrag && "scale-[1.02]"
                          )}
                          style={{
                            borderColor: isDrag
                              ? `rgba(${colorRgb}, 0.7)`
                              : hasFile
                                ? `rgba(${colorRgb}, 0.4)`
                                : `rgba(255,255,255,0.12)`,
                            backgroundColor: isDrag
                              ? `rgba(${colorRgb}, 0.06)`
                              : "rgba(255,255,255,0.02)",
                          }}
                        >
                          {hasFile && previews[inp.id] ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={previews[inp.id]}
                                alt={inp.label}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full">
                                  تغيير
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (previewUrls.current[inp.id]) URL.revokeObjectURL(previewUrls.current[inp.id]);
                                  setFiles((prev) => ({ ...prev, [inp.id]: null }));
                                  setPreviews((prev) => ({ ...prev, [inp.id]: "" }));
                                }}
                                className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white hover:bg-red-500/70 transition-colors z-10"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <div className="py-6 px-3 flex flex-col items-center gap-2">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
                                style={{ backgroundColor: `rgba(${colorRgb}, 0.1)` }}
                              >
                                <Upload className="w-5 h-5" style={{ color: `rgb(${colorRgb})` }} />
                              </div>
                              <p className="text-white/80 font-semibold text-sm leading-tight">{inp.label}</p>
                              <p className="text-gray-600 text-xs">{inp.hint ?? "PNG, JPG أو Paste"}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Extra inputs (text, select, etc.) */}
              {extraInputs.map((inp) => (
                <div key={inp.id} className="space-y-2">
                  <label className="text-sm font-semibold text-white/70">{inp.label}</label>
                  {inp.type === "prompt" ? (
                    <textarea
                      value={extraVals[inp.id] ?? ""}
                      onChange={(e) => setExtraVals((p) => ({ ...p, [inp.id]: e.target.value }))}
                      placeholder={inp.placeholder}
                      rows={3}
                      dir="auto"
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-white/20 transition-all"
                    />
                  ) : null}
                </div>
              ))}

            </div>

            {/* Generate button — sticky bottom */}
            <div className="shrink-0 px-8 py-6 border-t border-white/5 bg-black/40">
              <AnimatePresence mode="wait">
                {phase === "result" ? (
                  <motion.div
                    key="result-actions"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3"
                  >
                    <button
                      className="flex-1 h-14 rounded-2xl bg-white text-black font-black text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-xl"
                    >
                      <Download className="w-4 h-4" /> تحميل النتيجة
                    </button>
                    <button
                      onClick={handleReset}
                      className="h-14 px-5 rounded-2xl border border-white/10 text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="generate"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={handleGenerate}
                    disabled={!allFilled || phase === "processing"}
                    className={cn(
                      "w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all duration-300",
                      allFilled && phase !== "processing"
                        ? "text-black hover:scale-[1.02] hover:brightness-110 cursor-pointer"
                        : "text-gray-600 cursor-not-allowed"
                    )}
                    style={
                      allFilled && phase !== "processing"
                        ? {
                            backgroundColor: `rgb(${colorRgb})`,
                            boxShadow: `0 0 40px rgba(${colorRgb}, 0.4)`,
                          }
                        : { backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    {phase === "processing" ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> جاري المعالجة...</>
                    ) : (
                      <><Sparkles className="w-5 h-5" /> توليد الآن · {tool.credits} كريديت</>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── RIGHT: Demo video or result ── */}
          <div className="relative flex items-center justify-center bg-[#020204] overflow-hidden">
            {/* grid dot bg */}
            <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />

            <AnimatePresence mode="wait">
              {phase === "result" ? (
                /* Result state — show uploaded file as "result" */
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
                  className="relative w-full h-full flex items-center justify-center p-8"
                >
                  <div
                    className="relative rounded-3xl overflow-hidden border border-white/10 w-full max-h-full"
                    style={{ boxShadow: `0 0 80px rgba(${colorRgb}, 0.2)` }}
                  >
                    {/* Result badge */}
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: `rgba(${colorRgb}, 0.9)`, color: "#000" }}>
                      ✨ تم بنجاح
                    </div>
                    {previews[uploadInputs[0]?.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previews[uploadInputs[0].id]}
                        alt="نتيجة"
                        className="w-full h-full object-contain max-h-[75vh]"
                        style={{ filter: "brightness(1.06) contrast(1.08) saturate(1.1)" }}
                      />
                    ) : (
                      <div className="aspect-video bg-black/50 flex items-center justify-center">
                        <tool.icon className={cn("w-16 h-16 opacity-20", config.colorClass)} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : phase === "processing" ? (
                /* Processing state */
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center gap-6 p-8"
                >
                  <div className="relative w-24 h-24">
                    <div
                      className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                      style={{ borderTopColor: `rgb(${colorRgb})`, borderRightColor: `rgba(${colorRgb}, 0.3)` }}
                    />
                    <div
                      className="absolute inset-3 rounded-full border-2 border-transparent animate-spin"
                      style={{ borderBottomColor: `rgb(${colorRgb})`, animationDirection: "reverse", animationDuration: "2s", opacity: 0.5 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <tool.icon className={cn("w-8 h-8 animate-pulse", config.colorClass)} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg mb-1">جاري المعالجة...</p>
                    <p className="text-gray-500 text-sm">محرك الذكاء الاصطناعي يعمل على طلبك</p>
                  </div>
                  {/* Progress bar */}
                  <div className="w-64 h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: `rgb(${colorRgb})` }}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, ease: "linear" }}
                    />
                  </div>
                </motion.div>
              ) : (
                /* Idle / ready state — show demo preview */
                <motion.div
                  key="demo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative w-full h-full flex items-center justify-center p-8"
                >
                  <div
                    className="relative rounded-3xl overflow-hidden border border-white/10 w-full"
                    style={{ boxShadow: `0 0 60px rgba(${colorRgb}, 0.12)` }}
                  >
                    {isVideo ? (
                      <video
                        src={demoSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover max-h-[75vh]"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={demoSrc}
                        alt={tool.title}
                        className="w-full h-full object-cover max-h-[75vh]"
                      />
                    )}
                    {/* Subtle overlay label */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs font-medium text-white/70">معاينة النتائج</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Standard sidebar workspace ───────────────────────────────────────────────

function WorkspaceInterface({
  tool,
  config,
}: {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}) {
  const router = useRouter();

  const [values, setValues] = useState(() => initValues(tool.inputs));
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

  const colorRgb = config.shadowColor;

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
              style={{ backgroundColor: `rgba(${colorRgb}, 0.12)` }}
            >
              <tool.icon className={cn("w-4 h-4", config.colorClass)} />
            </div>
          </div>

          {/* Inputs */}
          <div className="flex-1 overflow-y-auto px-5 py-6 hide-scroll space-y-5">
            {tool.inputs.map((input) =>
              renderToolInput(input, state, setters, colorRgb)
            )}
          </div>

          {/* Generate Button — sticky bottom */}
          <div className="shrink-0 p-5 border-t border-white/5 bg-black/60">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500">التكلفة</span>
              <span
                className="flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full"
                style={{ color: `rgb(${colorRgb})`, backgroundColor: `rgba(${colorRgb}, 0.1)` }}
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
                      backgroundColor: `rgba(${colorRgb}, 0.25)`,
                      border: `1px solid rgba(${colorRgb}, 0.5)`,
                      boxShadow: `0 0 30px rgba(${colorRgb}, 0.25)`,
                      height: "52px",
                    }
                  : { height: "52px" }
              }
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> جاري التوليد...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> ابدأ التوليد</>
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
                      style={{ borderTopColor: `rgb(${colorRgb})`, borderRightColor: `rgba(${colorRgb}, 0.3)` }}
                    />
                    <div
                      className="absolute inset-3 rounded-full border-2 border-transparent animate-spin"
                      style={{ borderBottomColor: `rgb(${colorRgb})`, animationDirection: "reverse", animationDuration: "2s", opacity: 0.5 }}
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
                    style={{ boxShadow: `0 0 60px rgba(${colorRgb}, 0.15)` }}
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
                    style={{ backgroundColor: `rgba(${colorRgb}, 0.05)` }}
                  >
                    <tool.icon className={cn("w-12 h-12 opacity-20", config.colorClass)} />
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
