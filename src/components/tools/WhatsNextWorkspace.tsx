"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Sparkles, Zap, Upload, X,
  Download, RefreshCw, ImageIcon,
} from "lucide-react";
import type { Tool } from "@/lib/data/tools";
import type { STUDIO_CATEGORIES, ToolCategory } from "@/lib/data/tools";

type Phase = "idle" | "ready" | "processing" | "result";

interface Props {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}

const RESULT_COUNT = 8;

const RESULT_FILTERS = [
  "none",
  "hue-rotate(25deg) brightness(1.05)",
  "hue-rotate(180deg) saturate(0.8)",
  "hue-rotate(280deg) brightness(0.95)",
  "sepia(0.3) brightness(1.1)",
  "hue-rotate(90deg) saturate(1.3)",
  "brightness(1.15) contrast(1.1)",
  "hue-rotate(320deg) saturate(0.9)",
];

export function WhatsNextWorkspace({ tool, config }: Props) {
  const router = useRouter();
  const rgb    = config.shadowColor;

  const [phase,   setPhase]   = useState<Phase>("idle");
  const [preview, setPreview] = useState("");
  const [file,    setFile]    = useState<File | null>(null);
  const [drag,    setDrag]    = useState(false);

  const urlRef  = useRef("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const pickFile = useCallback((f: File) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(f);
    urlRef.current = url;
    setFile(f);
    setPreview(url);
    setPhase("ready");
  }, []);

  const reset = () => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = ""; }
    setFile(null);
    setPreview("");
    setPhase("idle");
  };

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

        {/* Main scroll area */}
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

                  {/* Drop zone */}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }} />
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); }}
                    onDragOver={e => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    className={cn(
                      "rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 select-none",
                      "flex flex-col items-center justify-center gap-5 py-20 px-8 text-center",
                      drag ? "scale-[1.01]" : "hover:scale-[1.005]"
                    )}
                    style={{
                      borderColor: drag ? `rgba(${rgb},0.7)` : `rgba(${rgb},0.25)`,
                      backgroundColor: drag ? `rgba(${rgb},0.04)` : "rgba(255,255,255,0.02)",
                      boxShadow: drag ? `0 0 40px rgba(${rgb},0.12)` : undefined,
                    }}
                  >
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center border-2"
                        style={{ borderColor: `rgba(${rgb},0.3)`, backgroundColor: `rgba(${rgb},0.07)` }}>
                        <Upload className="w-8 h-8" style={{ color: `rgb(${rgb})` }} />
                      </div>
                      {drag && (
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                          style={{ backgroundColor: `rgb(${rgb})` }} />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg mb-1">
                        {drag ? "أفلت الصورة هنا" : "اسحب صورتك هنا"}
                      </p>
                      <p className="text-gray-500 text-sm">
                        أو <span style={{ color: `rgb(${rgb})` }} className="font-semibold">انقر للاختيار</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-600 flex items-center gap-2 bg-white/4 rounded-full px-4 py-2 border border-white/8">
                      <ImageIcon className="w-3.5 h-3.5" /> PNG أو JPG · سيتم توليد {RESULT_COUNT} احتمالات
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
                  {/* Preview card */}
                  <div className="rounded-3xl overflow-hidden border border-white/10"
                    style={{ boxShadow: `0 0 40px rgba(${rgb},0.08)` }}>
                    <div className="w-full flex items-center justify-center bg-black/50 overflow-hidden" style={{ maxHeight: "55vh" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="معاينة" className="max-w-full object-contain" style={{ maxHeight: "55vh" }} />
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
                    onClick={() => { setPhase("processing"); setTimeout(() => setPhase("result"), 4000); }}
                    className="w-full rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:brightness-110 text-white"
                    style={{
                      height: "56px",
                      backgroundColor: `rgba(${rgb},0.2)`,
                      border: `1px solid rgba(${rgb},0.45)`,
                      boxShadow: `0 0 30px rgba(${rgb},0.2)`,
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                    توليد {RESULT_COUNT} احتمالات
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
                  <div className="relative w-full flex items-center justify-center bg-black/50 overflow-hidden" style={{ height: 280 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="" className="w-full h-full object-cover blur-sm opacity-30 scale-105 absolute inset-0" />
                    <div className="relative z-10 flex flex-col items-center gap-5">
                      <div className="relative w-20 h-20">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderTopColor: `rgb(${rgb})`, borderRightColor: `rgba(${rgb},0.3)` }} />
                        <div className="absolute inset-3 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderBottomColor: `rgb(${rgb})`, animationDirection: "reverse", animationDuration: "1.8s", opacity: 0.5 }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className={cn("w-7 h-7 animate-pulse", config.colorClass)} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg mb-1">جاري التوليد...</p>
                        <p className="text-gray-400 text-sm">{RESULT_COUNT} احتمالات للمشهد التالي</p>
                      </div>
                    </div>
                  </div>

                  {/* Skeleton grid */}
                  <div className="grid grid-cols-4 gap-px bg-white/5">
                    {Array.from({ length: RESULT_COUNT }).map((_, i) => (
                      <motion.div key={i}
                        className="bg-black/80 relative overflow-hidden"
                        style={{ height: 80 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1, duration: 0.35 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.15, ease: "linear" }}
                        />
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-5 bg-black/30 border-t border-white/5">
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ backgroundColor: `rgb(${rgb})` }}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 4, ease: "linear" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── result ── */}
              {phase === "result" && (
                <motion.div key="result"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-4"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold px-3 py-1.5 rounded-full"
                      style={{ color: `rgb(${rgb})`, backgroundColor: `rgba(${rgb},0.1)` }}>
                      ✨ {RESULT_COUNT} احتمالات جاهزة
                    </span>
                    <button onClick={reset}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                      <RefreshCw className="w-3 h-3" /> جديد
                    </button>
                  </div>

                  {/* Results 4×2 grid */}
                  <div className="rounded-3xl overflow-hidden border border-white/10"
                    style={{ boxShadow: `0 0 50px rgba(${rgb},0.12)` }}>
                    <div className="grid grid-cols-4 gap-px bg-white/5">
                      {Array.from({ length: RESULT_COUNT }, (_, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="relative bg-black/50 overflow-hidden group"
                          style={{ height: 130 }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preview} alt={`احتمال ${i + 1}`}
                            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                            style={{ filter: RESULT_FILTERS[i] }} />

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                              <Download className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>

                          {/* Number badge */}
                          <div className="absolute bottom-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-gray-400 border border-white/10 group-hover:opacity-0 transition-opacity">
                            {i + 1}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button className="flex-1 h-12 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                      <Download className="w-4 h-4" /> تحميل الكل
                    </button>
                    <button onClick={reset}
                      className="h-12 px-5 rounded-2xl border border-white/10 text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-white/5 hover:text-white transition-colors">
                      <RefreshCw className="w-4 h-4" /> تجربة جديدة
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
