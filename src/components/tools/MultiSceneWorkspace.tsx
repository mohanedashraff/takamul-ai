"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Sparkles, Zap, Download, Loader2,
  Upload, ImageIcon, X, RefreshCw, Film,
} from "lucide-react";
import type { Tool } from "@/lib/data/tools";
import type { STUDIO_CATEGORIES, ToolCategory } from "@/lib/data/tools";

type Phase = "idle" | "ready" | "processing" | "result";

interface Props {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}

const SCENE_OPTIONS = [1, 2, 4, 6, 9, 12];

const SHOT_LABELS = [
  "إستاتيكي",  "زووم للداخل",  "زووم للخارج", "بان يمين",
  "بان يسار",  "رافع من الأسفل","هابط من فوق",  "دوران",
  "فوق الكتف", "وجه كريب",     "بانورامي",     "درامي",
];

function gridCols(n: number) {
  if (n === 1) return "grid-cols-1";
  if (n === 2) return "grid-cols-2";
  if (n <= 4)  return "grid-cols-2";
  if (n <= 6)  return "grid-cols-3";
  return "grid-cols-3";
}

export function MultiSceneWorkspace({ tool, config }: Props) {
  const router  = useRouter();
  const rgb     = config.shadowColor;

  const [phase,      setPhase]      = useState<Phase>("idle");
  const [preview,    setPreview]    = useState("");
  const [file,       setFile]       = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sceneCount, setSceneCount] = useState(6);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef   = useRef("");

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  const pickFile = useCallback((f: File) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(f);
    previewRef.current = url;
    setFile(f);
    setPreview(url);
    setPhase("ready");
  }, []);

  const reset = () => {
    if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = ""; }
    setFile(null);
    setPreview("");
    setPhase("idle");
  };

  // ── Scene count picker ─────────────────────────────────────────────────────
  const ScenePicker = (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 shrink-0">عدد المشاهد:</span>
      <div className="flex gap-1.5">
        {SCENE_OPTIONS.map(n => (
          <button
            key={n}
            onClick={() => setSceneCount(n)}
            className={cn(
              "w-9 h-8 rounded-xl text-sm font-bold transition-all",
              sceneCount === n
                ? "text-white scale-105"
                : "text-gray-500 bg-white/5 border border-white/10 hover:text-gray-200 hover:bg-white/10"
            )}
            style={sceneCount === n ? {
              backgroundColor: `rgba(${rgb},0.2)`,
              border: `1px solid rgba(${rgb},0.5)`,
              color: `rgb(${rgb})`,
            } : {}}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Navbar />
      <div className="flex flex-1 flex-col overflow-hidden pt-16 md:pt-20">

        {/* Top bar */}
        <div className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10"
              style={{ backgroundColor: `rgba(${rgb},0.12)` }}>
              <tool.icon className={cn("w-4 h-4", config.colorClass)} />
            </div>
            <span className="text-white font-bold text-sm">{tool.title}</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ color: `rgb(${rgb})`, backgroundColor: `rgba(${rgb},0.1)` }}>
            <Zap className="w-3 h-3" /> {tool.credits} كريديت
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-6">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait">

              {/* ── idle ── */}
              {phase === "idle" && (
                <motion.div key="idle"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-5"
                >
                  {/* Header */}
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 mx-auto mb-4"
                      style={{ backgroundColor: `rgba(${rgb},0.1)` }}>
                      <tool.icon className={cn("w-8 h-8", config.colorClass)} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-1">{tool.title}</h1>
                    <p className="text-gray-500 text-sm">{tool.desc}</p>
                  </div>

                  {/* Scene picker card */}
                  <div className="rounded-2xl bg-white/4 border border-white/8 px-5 py-4 flex items-center justify-between">
                    {ScenePicker}
                    <span className="text-xs text-gray-600">
                      {sceneCount} لقطة سينمائية
                    </span>
                  </div>

                  {/* Drop zone */}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }} />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); }}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    className={cn(
                      "rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 select-none",
                      "flex flex-col items-center justify-center gap-5 py-16 px-8 text-center",
                      isDragging ? "scale-[1.01]" : "hover:scale-[1.005]"
                    )}
                    style={{
                      borderColor: isDragging ? `rgba(${rgb},0.7)` : `rgba(${rgb},0.25)`,
                      backgroundColor: isDragging ? `rgba(${rgb},0.04)` : "rgba(255,255,255,0.02)",
                      boxShadow: isDragging ? `0 0 40px rgba(${rgb},0.12)` : undefined,
                    }}
                  >
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center border-2"
                        style={{ borderColor: `rgba(${rgb},0.3)`, backgroundColor: `rgba(${rgb},0.07)` }}>
                        <Upload className="w-8 h-8" style={{ color: `rgb(${rgb})` }} />
                      </div>
                      {isDragging && (
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                          style={{ backgroundColor: `rgb(${rgb})` }} />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg mb-1">
                        {isDragging ? "أفلت الصورة هنا" : "اسحب صورتك هنا"}
                      </p>
                      <p className="text-gray-500 text-sm">
                        أو <span style={{ color: `rgb(${rgb})` }} className="font-semibold">انقر للاختيار</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-600 flex items-center gap-2 bg-white/4 rounded-full px-4 py-2 border border-white/8">
                      <ImageIcon className="w-3.5 h-3.5" /> PNG أو JPG
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ── ready ── */}
              {phase === "ready" && (
                <motion.div key="ready"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-4"
                >
                  {/* Scene picker */}
                  <div className="rounded-2xl bg-white/4 border border-white/8 px-5 py-3 flex items-center justify-between">
                    {ScenePicker}
                    <span className="text-xs text-gray-600">{sceneCount} لقطة</span>
                  </div>

                  {/* Preview card */}
                  <div className="rounded-3xl overflow-hidden border border-white/10"
                    style={{ boxShadow: `0 0 40px rgba(${rgb},0.08)` }}>
                    <div className="w-full max-h-[50vh] flex items-center justify-center bg-black/50 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="معاينة" className="max-w-full max-h-[50vh] object-contain" />
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 border-t border-white/8 bg-black/30">
                      <div className="flex items-center gap-2 text-sm text-gray-400 truncate">
                        <ImageIcon className="w-4 h-4 shrink-0" style={{ color: `rgb(${rgb})` }} />
                        <span className="truncate">{file?.name}</span>
                        {file && <span className="text-gray-600 shrink-0 text-xs">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>}
                      </div>
                      <button onClick={reset}
                        className="shrink-0 w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Generate */}
                  <button
                    onClick={() => { setPhase("processing"); setTimeout(() => setPhase("result"), 3500); }}
                    className="w-full rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:brightness-110 text-white"
                    style={{
                      height: "56px",
                      backgroundColor: `rgba(${rgb},0.2)`,
                      border: `1px solid rgba(${rgb},0.45)`,
                      boxShadow: `0 0 30px rgba(${rgb},0.2)`,
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                    توليد {sceneCount} لقطات سينمائية
                  </button>
                </motion.div>
              )}

              {/* ── processing ── */}
              {phase === "processing" && (
                <motion.div key="processing"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-3xl overflow-hidden border border-white/10"
                  style={{ boxShadow: `0 0 40px rgba(${rgb},0.1)` }}
                >
                  <div className="relative w-full flex items-center justify-center bg-black/50 overflow-hidden" style={{ height: 320 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="" className="w-full h-full object-cover blur-sm opacity-30 scale-105 absolute inset-0" />
                    <div className="relative z-10 flex flex-col items-center gap-5">
                      <div className="relative w-20 h-20">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderTopColor: `rgb(${rgb})`, borderRightColor: `rgba(${rgb},0.3)` }} />
                        <div className="absolute inset-3 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderBottomColor: `rgb(${rgb})`, animationDirection: "reverse", animationDuration: "1.8s", opacity: 0.5 }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Film className={cn("w-7 h-7 animate-pulse", config.colorClass)} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg mb-1">جاري توليد اللقطات...</p>
                        <p className="text-gray-400 text-sm">يتم إنشاء {sceneCount} لقطات سينمائية</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 bg-black/30 border-t border-white/5">
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ backgroundColor: `rgb(${rgb})` }}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3.5, ease: "linear" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── result ── */}
              {phase === "result" && (
                <motion.div key="result"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-4"
                >
                  {/* Result header */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold px-3 py-1.5 rounded-full"
                      style={{ color: `rgb(${rgb})`, backgroundColor: `rgba(${rgb},0.1)` }}>
                      ✨ {sceneCount} لقطات جاهزة
                    </span>
                    <div className="flex gap-2">
                      <button onClick={reset}
                        className="h-9 px-4 rounded-xl border border-white/10 text-gray-400 text-sm font-medium flex items-center gap-1.5 hover:bg-white/5 hover:text-white transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" /> من جديد
                      </button>
                      <button className="h-9 px-4 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all hover:brightness-110"
                        style={{ backgroundColor: `rgba(${rgb},0.2)`, border: `1px solid rgba(${rgb},0.4)`, color: `rgb(${rgb})` }}>
                        <Download className="w-3.5 h-3.5" /> تحميل الكل
                      </button>
                    </div>
                  </div>

                  {/* Scenes grid */}
                  <div className={cn("grid gap-2", gridCols(sceneCount))}>
                    {Array.from({ length: sceneCount }, (_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.93 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="group relative rounded-2xl overflow-hidden border border-white/10 cursor-pointer"
                        style={{ boxShadow: `0 0 20px rgba(${rgb},0.05)` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt={SHOT_LABELS[i] ?? `لقطة ${i + 1}`}
                          className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          style={{ aspectRatio: "16/9", filter: `hue-rotate(${i * 15}deg) brightness(${0.85 + i * 0.02})` }} />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                          <div className="self-end">
                            <button className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                              <Download className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                          <span className="text-white text-xs font-bold">
                            {SHOT_LABELS[i] ?? `لقطة ${i + 1}`}
                          </span>
                        </div>

                        {/* Scene number badge */}
                        <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-gray-300 border border-white/10 group-hover:opacity-0 transition-opacity">
                          {i + 1}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }} />
    </div>
  );
}
