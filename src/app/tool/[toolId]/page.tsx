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

export default function WorkspacePage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = use(params);
  const result = findToolById(toolId);
  if (!result) notFound();
  const { tool, categoryKey } = result;
  const config = STUDIO_CATEGORIES[categoryKey];

  if (tool.layout === "centered") {
    return <CenteredWorkspace tool={tool} config={config} />;
  }
  if (tool.layout === "inpaint") {
    return <InpaintWorkspace tool={tool} config={config} />;
  }
  if (tool.layout === "sketch") {
    return <SketchWorkspace tool={tool} config={config} />;
  }
  if (tool.layout === "outpaint") {
    return <OutpaintWorkspace tool={tool} config={config} />;
  }
  if (tool.layout === "angle") {
    return <AngleWorkspace tool={tool} config={config} />;
  }
  if (tool.layout === "relight") {
    return <RelightWorkspace tool={tool} config={config} />;
  }
  if (tool.layout === "multi-scene") {
    return <MultiSceneWorkspace tool={tool} config={config} />;
  }
  if (tool.layout === "change-clothes") {
    return <ChangeClothesWorkspace tool={tool} config={config} />;
  }
  return <WorkspaceInterface tool={tool} config={config} />;
}

// ─── Centered workspace (single-upload tools like enhance-image) ──────────────

type Phase = "idle" | "ready" | "processing" | "result";

function CenteredWorkspace({
  tool,
  config,
}: {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}) {
  const router = useRouter();
  const uploadInput = tool.inputs[0];
  const accept = uploadInput?.accept ?? "image/*";
  const colorRgb = config.shadowColor;

  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string>("");

  // Revoke on unmount
  useEffect(() => {
    return () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); };
  }, []);

  const pickFile = useCallback((f: File) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(f);
    previewRef.current = url;
    setFile(f);
    setPreview(url);
    setPhase("ready");
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
    e.target.value = "";
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }, [pickFile]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const handleGenerate = () => {
    if (phase !== "ready") return;
    setPhase("processing");
    setTimeout(() => setPhase("result"), 3000);
  };

  const handleReset = () => {
    if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = ""; }
    setFile(null);
    setPreview("");
    setPhase("idle");
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Navbar />

      <div className="flex-1 flex flex-col pt-16 md:pt-20 overflow-y-auto">
        {/* Top bar */}
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
              <span className="text-gray-600 text-xs mr-2">·</span>
              <span className="text-gray-500 text-xs">{config.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ color: `rgb(${colorRgb})`, backgroundColor: `rgba(${colorRgb}, 0.1)` }}
            >
              <Zap className="w-3 h-3" /> {tool.credits} كريديت
            </span>
          </div>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-xl">
            <AnimatePresence mode="wait">

              {/* ── idle: drop zone ── */}
              {phase === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={onInputChange}
                  />

                  {/* Tool heading */}
                  <div className="text-center mb-8">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 mx-auto mb-4"
                      style={{ backgroundColor: `rgba(${colorRgb}, 0.1)` }}
                    >
                      <tool.icon className={cn("w-8 h-8", config.colorClass)} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-1">{tool.title}</h1>
                    <p className="text-gray-500 text-sm">{tool.desc}</p>
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    className={cn(
                      "rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 select-none",
                      "flex flex-col items-center justify-center gap-5 py-16 px-8 text-center",
                      isDragging ? "scale-[1.01]" : "hover:scale-[1.005]"
                    )}
                    style={{
                      borderColor: isDragging ? `rgba(${colorRgb}, 0.7)` : `rgba(${colorRgb}, 0.25)`,
                      backgroundColor: isDragging ? `rgba(${colorRgb}, 0.04)` : `rgba(255,255,255,0.02)`,
                      boxShadow: isDragging ? `0 0 40px rgba(${colorRgb}, 0.12), inset 0 0 40px rgba(${colorRgb}, 0.04)` : undefined,
                    }}
                  >
                    {/* Icon ring */}
                    <div className="relative">
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center border-2"
                        style={{
                          borderColor: `rgba(${colorRgb}, 0.3)`,
                          backgroundColor: `rgba(${colorRgb}, 0.07)`,
                        }}
                      >
                        <Upload className="w-8 h-8" style={{ color: `rgb(${colorRgb})` }} />
                      </div>
                      {isDragging && (
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-20"
                          style={{ backgroundColor: `rgb(${colorRgb})` }}
                        />
                      )}
                    </div>

                    <div>
                      <p className="text-white font-bold text-lg mb-1">
                        {isDragging ? "أفلت الملف هنا" : "اسحب ملفك هنا"}
                      </p>
                      <p className="text-gray-500 text-sm">
                        أو{" "}
                        <span style={{ color: `rgb(${colorRgb})` }} className="font-semibold">
                          انقر للاختيار
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-white/4 rounded-full px-4 py-2 border border-white/8">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{uploadInput?.hint ?? "PNG، JPG، MP4 — بحد أقصى 50MB"}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── ready: preview + generate ── */}
              {phase === "ready" && (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-4"
                >
                  {/* Preview */}
                  <div
                    className="rounded-3xl overflow-hidden border border-white/10"
                    style={{ boxShadow: `0 0 40px rgba(${colorRgb}, 0.08)` }}
                  >
                    <div className="w-full max-h-[55vh] flex items-center justify-center bg-black/50 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt="معاينة"
                        className="max-w-full max-h-[55vh] object-contain"
                      />
                    </div>
                    {/* File info bar */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-white/8 bg-black/30">
                      <div className="flex items-center gap-2 text-sm text-gray-400 truncate">
                        <ImageIcon className="w-4 h-4 shrink-0" style={{ color: `rgb(${colorRgb})` }} />
                        <span className="truncate">{file?.name}</span>
                        <span className="text-gray-600 shrink-0 text-xs">
                          {file ? `(${(file.size / 1024 / 1024).toFixed(1)} MB)` : ""}
                        </span>
                      </div>
                      <button
                        onClick={handleReset}
                        className="shrink-0 w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all"
                        title="تغيير الصورة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Generate button */}
                  <button
                    onClick={handleGenerate}
                    className="w-full rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:brightness-110 text-white"
                    style={{
                      height: "56px",
                      backgroundColor: `rgba(${colorRgb}, 0.2)`,
                      border: `1px solid rgba(${colorRgb}, 0.45)`,
                      boxShadow: `0 0 30px rgba(${colorRgb}, 0.2)`,
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                    ابدأ التحسين
                  </button>
                </motion.div>
              )}

              {/* ── processing ── */}
              {phase === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-3xl overflow-hidden border border-white/10"
                  style={{ boxShadow: `0 0 40px rgba(${colorRgb}, 0.1)` }}
                >
                  {/* Blurred preview */}
                  <div className="relative w-full max-h-[55vh] flex items-center justify-center bg-black/50 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="معاينة"
                      className="max-w-full max-h-[55vh] object-contain blur-sm opacity-40 scale-105"
                    />
                    {/* Spinner overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                      <div className="relative w-20 h-20">
                        <div
                          className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                          style={{
                            borderTopColor: `rgb(${colorRgb})`,
                            borderRightColor: `rgba(${colorRgb}, 0.3)`,
                          }}
                        />
                        <div
                          className="absolute inset-2 rounded-full border-2 border-transparent animate-spin"
                          style={{
                            borderBottomColor: `rgb(${colorRgb})`,
                            animationDirection: "reverse",
                            animationDuration: "1.8s",
                            opacity: 0.5,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <tool.icon className={cn("w-7 h-7 animate-pulse", config.colorClass)} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg mb-1">جاري التحسين...</p>
                        <p className="text-gray-400 text-sm">يتم رفع جودة الصورة بالذكاء الاصطناعي</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="p-5 bg-black/30 border-t border-white/5">
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: `rgb(${colorRgb})` }}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3, ease: "linear" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── result ── */}
              {phase === "result" && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-4"
                >
                  {/* Before / After */}
                  <div
                    className="rounded-3xl overflow-hidden border border-white/10"
                    style={{ boxShadow: `0 0 50px rgba(${colorRgb}, 0.12)` }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 bg-black/30">
                      <span
                        className="text-sm font-bold px-3 py-1 rounded-full"
                        style={{
                          color: `rgb(${colorRgb})`,
                          backgroundColor: `rgba(${colorRgb}, 0.1)`,
                        }}
                      >
                        ✨ تم التحسين بنجاح
                      </span>
                      <span className="text-xs text-gray-600">قبل / بعد</span>
                    </div>

                    {/* Side-by-side */}
                    <div className="grid grid-cols-2 gap-px bg-white/8">
                      <div className="relative bg-black/50 overflow-hidden">
                        <div className="absolute top-2 right-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 text-gray-400 border border-white/10">
                          قبل
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt="قبل"
                          className="w-full max-h-[45vh] object-cover"
                        />
                      </div>
                      <div className="relative bg-black/50 overflow-hidden">
                        <div
                          className="absolute top-2 right-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded border"
                          style={{
                            color: `rgb(${colorRgb})`,
                            backgroundColor: `rgba(${colorRgb}, 0.15)`,
                            borderColor: `rgba(${colorRgb}, 0.3)`,
                          }}
                        >
                          بعد
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt="بعد"
                          className="w-full max-h-[45vh] object-cover"
                          style={{ filter: "brightness(1.06) contrast(1.08) saturate(1.1)" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      className="flex-1 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-xl"
                      style={{ height: "52px" }}
                    >
                      <Download className="w-4 h-4" /> تحميل الصورة المحسّنة
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-5 rounded-2xl border border-white/10 text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-white/5 hover:text-white transition-colors"
                      style={{ height: "52px" }}
                    >
                      <RefreshCw className="w-4 h-4" /> صورة جديدة
                    </button>
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
