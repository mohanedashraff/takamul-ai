"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Sparkles, Zap, Download, Loader2,
  Upload, X, RefreshCw,
} from "lucide-react";
import type { Tool } from "@/lib/data/tools";
import type { STUDIO_CATEGORIES, ToolCategory } from "@/lib/data/tools";

type Phase = "idle" | "processing" | "result";

interface Props {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}

interface UploadSlot { file: File | null; preview: string }

function useUploadSlot() {
  const [slot, setSlot] = useState<UploadSlot>({ file: null, preview: "" });
  const urlRef = useRef("");

  const pick = useCallback((f: File) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(f);
    urlRef.current = url;
    setSlot({ file: f, preview: url });
  }, []);

  const clear = useCallback(() => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = ""; }
    setSlot({ file: null, preview: "" });
  }, []);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);
  return { slot, pick, clear };
}

// ── UploadCard ─────────────────────────────────────────────────────────────────

function UploadCard({ label, hint, slot, onPick, onClear, rgb, disabled, shape = "portrait" }: {
  label: string; hint: string;
  slot: UploadSlot; onPick: (f: File) => void; onClear: () => void;
  rgb: string; disabled?: boolean;
  shape?: "square" | "portrait";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const cardStyle = shape === "square"
    ? "aspect-square max-w-[180px] w-full"
    : "flex-1";

  return (
    <div className={cn("flex flex-col gap-2", shape === "square" ? "" : "flex-1")}>
      <p className="text-sm font-semibold text-gray-300">{label}</p>

      {slot.preview ? (
        <div className={cn("relative rounded-2xl overflow-hidden border border-white/15 group", cardStyle)}
          style={{ boxShadow: `0 0 24px rgba(${rgb},0.08)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slot.preview} alt={label}
            className="w-full h-full object-cover"
            style={{ objectPosition: "top", minHeight: shape === "square" ? 0 : 180, maxHeight: shape === "square" ? "100%" : 260 }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent
            opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
            <span className="text-white text-xs font-medium truncate">{slot.file?.name}</span>
            <button onClick={onClear}
              className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/70 transition-colors shrink-0">
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
          <div
            onClick={() => !disabled && inputRef.current?.click()}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f && !disabled) onPick(f); }}
            onDragOver={e => { e.preventDefault(); if (!disabled) setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            className={cn(
              "rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 text-center select-none transition-all duration-300",
              shape === "square" ? "aspect-square max-w-[180px] w-full p-4" : "py-12 px-4 flex-1",
              disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-[1.01]"
            )}
            style={{
              borderColor: drag ? `rgba(${rgb},0.7)` : `rgba(${rgb},0.25)`,
              backgroundColor: drag ? `rgba(${rgb},0.05)` : "rgba(255,255,255,0.02)",
            }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: `rgba(${rgb},0.3)`, backgroundColor: `rgba(${rgb},0.07)` }}>
              <Upload className="w-5 h-5" style={{ color: `rgb(${rgb})` }} />
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-0.5">ارفع الصورة</p>
              <p className="text-gray-600 text-xs">{hint}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function FaceSwapWorkspace({ tool, config }: Props) {
  const router = useRouter();
  const rgb    = config.shadowColor;

  const [phase, setPhase] = useState<Phase>("idle");
  const face   = useUploadSlot();   // new face
  const target = useUploadSlot();   // target image

  const bothReady = !!face.slot.preview && !!target.slot.preview;

  const reset = () => { face.clear(); target.clear(); setPhase("idle"); };

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

        {/* Main */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-6">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait">

              {/* ── idle ── */}
              {phase === "idle" && (
                <motion.div key="upload"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-5"
                >
                  {/* Header */}
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 mx-auto mb-3"
                      style={{ backgroundColor: `rgba(${rgb},0.1)` }}>
                      <tool.icon className={cn("w-7 h-7", config.colorClass)} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-1">{tool.title}</h1>
                    <p className="text-gray-500 text-sm">{tool.desc}</p>
                  </div>

                  {/* Upload area: target (large) + face (small square) */}
                  <div className="flex gap-4 items-start">
                    {/* Target image — portrait */}
                    <UploadCard
                      label="الصورة الهدف"
                      hint="الصورة التي تريد تغيير الوجه فيها"
                      slot={target.slot}
                      onPick={target.pick}
                      onClear={target.clear}
                      rgb={rgb}
                    />

                    {/* Face source — square on the side */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <p className="text-sm font-semibold text-gray-300">الوجه الجديد</p>
                      {face.slot.preview ? (
                        <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-white/15 group"
                          style={{ boxShadow: `0 0 20px rgba(${rgb},0.12)` }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={face.slot.preview} alt="وجه"
                            className="w-full h-full object-cover object-top" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent
                            opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2">
                            <button onClick={face.clear}
                              className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/70 transition-colors">
                              <X className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                          {/* Face frame overlay */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-[20%] rounded-full border-2 border-dashed opacity-30"
                              style={{ borderColor: `rgb(${rgb})` }} />
                          </div>
                        </div>
                      ) : (
                        <>
                          <input type="file" accept="image/*" id="face-input" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) face.pick(f); e.target.value = ""; }} />
                          <label htmlFor="face-input"
                            className="w-40 h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] transition-all"
                            style={{
                              borderColor: `rgba(${rgb},0.3)`,
                              backgroundColor: "rgba(255,255,255,0.02)",
                            }}
                          >
                            {/* Face icon */}
                            <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
                              style={{ borderColor: `rgba(${rgb},0.3)`, backgroundColor: `rgba(${rgb},0.07)` }}>
                              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"
                                stroke={`rgb(${rgb})`} strokeWidth="1.5">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
                              </svg>
                            </div>
                            <p className="text-white font-semibold text-xs text-center px-2">صورة وجه واضحة</p>
                          </label>
                        </>
                      )}
                      <p className="text-[10px] text-gray-600 text-center max-w-[10rem]">وجه مواجه للكاميرا</p>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  {bothReady && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-3 py-1">
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent"
                        style={{ backgroundImage: `linear-gradient(to left, transparent, rgba(${rgb},0.4))` }} />
                      <div className="text-xs font-bold px-3 py-1 rounded-full border"
                        style={{ color: `rgb(${rgb})`, borderColor: `rgba(${rgb},0.3)`, backgroundColor: `rgba(${rgb},0.08)` }}>
                        جاهز للتبديل ✓
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent"
        style={{ backgroundImage: `linear-gradient(to right, transparent, rgba(${rgb},0.4))` }} />
                    </motion.div>
                  )}

                  {/* Generate button */}
                  <button
                    onClick={() => {
                      if (!bothReady) return;
                      setPhase("processing");
                      setTimeout(() => setPhase("result"), 3500);
                    }}
                    disabled={!bothReady}
                    className={cn(
                      "w-full rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300",
                      bothReady
                        ? "text-white hover:scale-[1.02] hover:brightness-110 cursor-pointer"
                        : "bg-white/5 text-gray-600 cursor-not-allowed"
                    )}
                    style={{
                      height: "54px",
                      ...(bothReady ? {
                        backgroundColor: `rgba(${rgb},0.2)`,
                        border: `1px solid rgba(${rgb},0.45)`,
                        boxShadow: `0 0 28px rgba(${rgb},0.2)`,
                      } : {}),
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                    {bothReady ? "ابدأ تغيير الوجه" : "ارفع الصورتين للبدء"}
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
                  <div className="relative flex items-center justify-center bg-black/50 overflow-hidden" style={{ height: 320 }}>
                    {/* Split blurred preview */}
                    <div className="absolute inset-0 flex">
                      <div className="w-1/2 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={face.slot.preview} alt="" className="w-full h-full object-cover object-top blur-sm opacity-30 scale-110" />
                      </div>
                      <div className="w-1/2 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={target.slot.preview} alt="" className="w-full h-full object-cover object-top blur-sm opacity-30 scale-110" />
                      </div>
                    </div>
                    <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />

                    {/* Spinner */}
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="relative w-20 h-20">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderTopColor: `rgb(${rgb})`, borderRightColor: `rgba(${rgb},0.3)` }} />
                        <div className="absolute inset-3 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderBottomColor: `rgb(${rgb})`, animationDirection: "reverse", animationDuration: "1.8s", opacity: 0.5 }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className={cn("w-7 h-7 animate-spin", config.colorClass)} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg mb-1">جاري تغيير الوجه...</p>
                        <p className="text-gray-400 text-sm">الذكاء الاصطناعي يدمج الوجوه</p>
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
                  <div className="rounded-3xl overflow-hidden border border-white/10"
                    style={{ boxShadow: `0 0 50px rgba(${rgb},0.12)` }}>
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 bg-black/30">
                      <span className="text-sm font-bold px-3 py-1 rounded-full"
                        style={{ color: `rgb(${rgb})`, backgroundColor: `rgba(${rgb},0.1)` }}>
                        ✨ تم تغيير الوجه
                      </span>
                      <span className="text-xs text-gray-600">قبل / بعد</span>
                    </div>

                    {/* Before / After */}
                    <div className="grid grid-cols-2 gap-px bg-white/8">
                      <div className="relative bg-black/50 overflow-hidden">
                        <div className="absolute top-2 right-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 text-gray-400 border border-white/10">قبل</div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={target.slot.preview} alt="قبل"
                          className="w-full object-cover object-top" style={{ maxHeight: "55vh" }} />
                      </div>
                      <div className="relative bg-black/50 overflow-hidden">
                        <div className="absolute top-2 right-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded border"
                          style={{ color: `rgb(${rgb})`, backgroundColor: `rgba(${rgb},0.15)`, borderColor: `rgba(${rgb},0.3)` }}>
                          بعد
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={target.slot.preview} alt="بعد"
                          className="w-full object-cover object-top"
                          style={{ maxHeight: "55vh", filter: "hue-rotate(15deg) brightness(1.03) saturate(1.1)" }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 h-12 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                      <Download className="w-4 h-4" /> تحميل النتيجة
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
