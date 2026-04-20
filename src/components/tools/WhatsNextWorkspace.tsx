"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Sparkles, Zap, Upload, X,
  Download, RefreshCw, Check,
} from "lucide-react";
import type { Tool } from "@/lib/data/tools";
import type { STUDIO_CATEGORIES, ToolCategory } from "@/lib/data/tools";

type Phase = "idle" | "processing" | "result";

interface Props {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}

// ── Grid layout definitions ────────────────────────────────────────────────────
// cells: normalized rects [x, y, w, h] in a 1×1 space (gap=0.03 between cells)

const G = 0.03; // gap

interface GridLayout {
  id:    string;
  label: string;
  count: number;
  cols:  string;                            // Tailwind class for result grid
  rows:  string;                            // Tailwind class for result grid rows
  cells: [number, number, number, number][]; // [x, y, w, h] normalized 0-1
}

const GRID_LAYOUTS: GridLayout[] = [
  {
    id: "1x1", label: "١ صورة", count: 1, cols: "grid-cols-1", rows: "",
    cells: [[0, 0, 1, 1]],
  },
  {
    id: "1x2", label: "٢ جنباً", count: 2, cols: "grid-cols-2", rows: "",
    cells: [
      [0,        0, (1-G)/2, 1],
      [(1+G)/2,  0, (1-G)/2, 1],
    ],
  },
  {
    id: "2x2", label: "٢×٢", count: 4, cols: "grid-cols-2", rows: "",
    cells: [
      [0,       0,       (1-G)/2, (1-G)/2],
      [(1+G)/2, 0,       (1-G)/2, (1-G)/2],
      [0,       (1+G)/2, (1-G)/2, (1-G)/2],
      [(1+G)/2, (1+G)/2, (1-G)/2, (1-G)/2],
    ],
  },
  {
    id: "big-top", label: "كبيرة + ٢", count: 3, cols: "grid-cols-2", rows: "",
    cells: [
      [0,        0,         1,        0.58],
      [0,        0.58+G,    (1-G)/2,  1-(0.58+G)],
      [(1+G)/2,  0.58+G,    (1-G)/2,  1-(0.58+G)],
    ],
  },
  {
    id: "big-right", label: "٢ + كبيرة", count: 3, cols: "grid-cols-2", rows: "",
    cells: [
      [0,        0,         (1-G)*0.48, (1-G)/2],
      [0,        (1+G)/2,   (1-G)*0.48, (1-G)/2],
      [(1-G)*0.48+G, 0,     1-((1-G)*0.48+G), 1],
    ],
  },
  {
    id: "3x2", label: "٣×٢", count: 6, cols: "grid-cols-3", rows: "",
    cells: Array.from({ length: 6 }, (_, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cw  = (1 - G*2) / 3;
      const rh  = (1 - G) / 2;
      return [col*(cw+G), row*(rh+G), cw, rh] as [number,number,number,number];
    }),
  },
  {
    id: "1+3", label: "كبيرة + ٣", count: 4, cols: "grid-cols-3", rows: "",
    cells: [
      [0,          0,    0.6-G/2,  1],
      [0.6+G/2,    0,    0.4-G/2,  (1-G*2)/3],
      [0.6+G/2,    (1-G*2)/3+G,   0.4-G/2,  (1-G*2)/3],
      [0.6+G/2,    (1-G*2)/3*2+G*2, 0.4-G/2, (1-G*2)/3],
    ],
  },
  {
    id: "4x2", label: "٤×٢", count: 8, cols: "grid-cols-4", rows: "",
    cells: Array.from({ length: 8 }, (_, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const cw  = (1 - G*3) / 4;
      const rh  = (1 - G) / 2;
      return [col*(cw+G), row*(rh+G), cw, rh] as [number,number,number,number];
    }),
  },
];

// ── GridPreview SVG component ──────────────────────────────────────────────────

function GridPreview({ cells, active, rgb }: {
  cells: GridLayout["cells"]; active: boolean; rgb: string;
}) {
  const W = 56; const H = 40; // viewBox size
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ display: "block" }}>
      {cells.map(([x, y, w, h], i) => (
        <rect
          key={i}
          x={x * W + 1} y={y * H + 1}
          width={Math.max(1, w * W - 2)} height={Math.max(1, h * H - 2)}
          rx="2"
          fill={active ? `rgba(${rgb},0.35)` : "rgba(255,255,255,0.12)"}
          stroke={active ? `rgba(${rgb},0.7)` : "rgba(255,255,255,0.18)"}
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function WhatsNextWorkspace({ tool, config }: Props) {
  const router  = useRouter();
  const rgb     = config.shadowColor;

  const [phase,      setPhase]      = useState<Phase>("idle");
  const [preview,    setPreview]    = useState("");
  const [layoutId,   setLayoutId]   = useState("2x2");

  const urlRef    = useRef("");
  const fileRef   = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const pickFile = useCallback((f: File) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(f);
    urlRef.current = url;
    setPreview(url);
  }, []);

  const clearFile = useCallback(() => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = ""; }
    setPreview("");
  }, []);

  const reset = () => { clearFile(); setPhase("idle"); setLayoutId("2x2"); };

  const canGenerate  = !!preview;
  const activeLayout = GRID_LAYOUTS.find(l => l.id === layoutId)!;

  // Fake result images (same preview with slight filter variations)
  const resultImages = Array.from({ length: activeLayout.count }, (_, i) => ({
    key: i,
    filter: [
      "none",
      "hue-rotate(25deg) brightness(1.05)",
      "hue-rotate(180deg) saturate(0.8)",
      "hue-rotate(280deg) brightness(0.95)",
      "sepia(0.3) brightness(1.1)",
      "hue-rotate(90deg) saturate(1.3)",
      "brightness(1.15) contrast(1.1)",
      "hue-rotate(320deg) saturate(0.9)",
    ][i % 8],
  }));

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
        <div className="flex-1 overflow-y-auto flex items-start justify-center p-6">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait">

              {/* ── idle / configure ── */}
              {phase === "idle" && (
                <motion.div key="idle"
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

                  {/* ── Upload area ── */}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }} />

                  {preview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/15 group"
                      style={{ boxShadow: `0 0 30px rgba(${rgb},0.1)` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="الصورة"
                        className="w-full object-cover"
                        style={{ maxHeight: 280, objectPosition: "top" }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                        <button onClick={() => fileRef.current?.click()}
                          className="text-xs px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                          تغيير الصورة
                        </button>
                        <button onClick={clearFile}
                          className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/70 transition-colors">
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileRef.current?.click()}
                      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); }}
                      onDragOver={e => { e.preventDefault(); setDrag(true); }}
                      onDragLeave={() => setDrag(false)}
                      className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-14 cursor-pointer hover:scale-[1.005] transition-all duration-300"
                      style={{
                        borderColor: drag ? `rgba(${rgb},0.7)` : `rgba(${rgb},0.25)`,
                        backgroundColor: drag ? `rgba(${rgb},0.05)` : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div className="w-14 h-14 rounded-full flex items-center justify-center border-2"
                        style={{ borderColor: `rgba(${rgb},0.3)`, backgroundColor: `rgba(${rgb},0.07)` }}>
                        <Upload className="w-6 h-6" style={{ color: `rgb(${rgb})` }} />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold mb-0.5">ارفع الصورة</p>
                        <p className="text-gray-600 text-sm">PNG أو JPG · صورة المشهد الأساسي</p>
                      </div>
                    </div>
                  )}

                  {/* ── Grid layout picker ── */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-300">شكل الـ Grid</p>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-white/8"
                        style={{ color: `rgba(${rgb},0.9)` }}>
                        {activeLayout.count} {activeLayout.count === 1 ? "صورة" : "صور"}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {GRID_LAYOUTS.map(layout => {
                        const active = layoutId === layout.id;
                        return (
                          <button
                            key={layout.id}
                            onClick={() => setLayoutId(layout.id)}
                            className={cn(
                              "relative flex flex-col items-center gap-1.5 p-2 pt-2.5 rounded-2xl border transition-all duration-200 hover:scale-[1.04]",
                              active ? "text-white" : "text-gray-500 hover:text-gray-300 border-white/8"
                            )}
                            style={{
                              backgroundColor: active ? `rgba(${rgb},0.1)` : "rgba(255,255,255,0.02)",
                              borderColor:     active ? `rgba(${rgb},0.5)` : undefined,
                              boxShadow:       active ? `0 0 18px rgba(${rgb},0.18)` : undefined,
                            }}
                          >
                            {/* Visual grid preview */}
                            <div className="w-full px-0.5">
                              <GridPreview cells={layout.cells} active={active} rgb={rgb} />
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold leading-none mt-0.5",
                              active ? "text-white" : "text-gray-500"
                            )}>
                              {layout.label}
                            </span>
                            {active && (
                              <div className="absolute top-1 left-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `rgb(${rgb})` }}>
                                <Check className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Generate button ── */}
                  <button
                    onClick={() => {
                      if (!canGenerate) return;
                      setPhase("processing");
                      setTimeout(() => setPhase("result"), 4000);
                    }}
                    disabled={!canGenerate}
                    className={cn(
                      "w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300",
                      canGenerate
                        ? "text-white hover:scale-[1.02] hover:brightness-110 cursor-pointer"
                        : "bg-white/5 text-gray-600 cursor-not-allowed"
                    )}
                    style={canGenerate ? {
                      backgroundColor: `rgba(${rgb},0.2)`,
                      border: `1px solid rgba(${rgb},0.45)`,
                      boxShadow: `0 0 28px rgba(${rgb},0.2)`,
                    } : {}}
                  >
                    <Sparkles className="w-5 h-5" />
                    {canGenerate
                      ? `توليد ${activeLayout.count} مشاهد — ${activeLayout.label}`
                      : "ارفع صورة للبدء"}
                  </button>
                </motion.div>
              )}

              {/* ── processing ── */}
              {phase === "processing" && (
                <motion.div key="processing"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-5"
                >
                  {/* Source image blurred */}
                  <div className="rounded-3xl overflow-hidden border border-white/10 relative"
                    style={{ boxShadow: `0 0 40px rgba(${rgb},0.12)` }}>
                    <div className="relative" style={{ height: 220 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="" className="w-full h-full object-cover object-top blur-sm opacity-25 scale-105" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="relative w-20 h-20">
                          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                            style={{ borderTopColor: `rgb(${rgb})`, borderRightColor: `rgba(${rgb},0.3)` }} />
                          <div className="absolute inset-3 rounded-full border-2 border-transparent animate-spin"
                            style={{ borderBottomColor: `rgb(${rgb})`, animationDirection: "reverse", animationDuration: "1.8s", opacity: 0.5 }} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className={cn("w-7 h-7", config.colorClass)} />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-bold text-lg mb-1">جاري توليد المشاهد...</p>
                          <p className="text-gray-400 text-sm">{activeLayout.count} احتمالات · {activeLayout.label}</p>
                        </div>
                      </div>
                    </div>

                    {/* Animated result grid preview (skeletons) */}
                    <div className={cn("grid gap-px bg-white/5", activeLayout.cols)}>
                      {Array.from({ length: activeLayout.count }).map((_, i) => (
                        <motion.div key={i}
                          className="bg-black/80 relative overflow-hidden"
                          style={{ height: 100 }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.12, duration: 0.4 }}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2, ease: "linear" }}
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold px-3 py-1.5 rounded-full"
                        style={{ color: `rgb(${rgb})`, backgroundColor: `rgba(${rgb},0.1)` }}>
                        ✨ {activeLayout.count} مشاهد محتملة
                      </span>
                      <span className="text-xs text-gray-600 border border-white/8 px-2 py-0.5 rounded-full">
                        {activeLayout.label}
                      </span>
                    </div>
                    <button onClick={reset}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                      <RefreshCw className="w-3 h-3" /> جديد
                    </button>
                  </div>

                  {/* Source + results layout */}
                  <div className="rounded-3xl overflow-hidden border border-white/10"
                    style={{ boxShadow: `0 0 50px rgba(${rgb},0.12)` }}>

                    {/* Source image row */}
                    <div className="relative border-b border-white/8">
                      <div className="absolute top-2 right-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 text-gray-400 border border-white/10">
                        الصورة الأصلية
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="أصلية"
                        className="w-full object-cover object-top"
                        style={{ maxHeight: 180 }} />
                    </div>

                    {/* Results grid */}
                    <div className={cn("grid gap-px bg-white/5", activeLayout.cols)}>
                      {resultImages.map(({ key, filter }) => (
                        <motion.div key={key}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: key * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="relative bg-black/50 overflow-hidden group"
                          style={{ height: activeLayout.count <= 4 ? 160 : 110 }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preview} alt={`مشهد ${key + 1}`}
                            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                            style={{ filter }} />

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                              <Download className="w-4 h-4 text-white" />
                            </button>
                          </div>

                          {/* Shot label */}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent py-2 px-2">
                            <p className="text-white text-[10px] font-bold">
                              مشهد {key + 1}
                            </p>
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
