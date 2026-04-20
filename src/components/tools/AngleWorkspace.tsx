"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Sparkles, Zap, Download, Loader2,
  Upload, ImageIcon, RefreshCw,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { Tool } from "@/lib/data/tools";
import type { STUDIO_CATEGORIES, ToolCategory } from "@/lib/data/tools";

type Phase = "idle" | "edit" | "processing" | "result";

interface Props {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}

// ── Globe constants ────────────────────────────────────────────────────────────
const R   = 100;
const CX  = 120;
const CY  = 120;
const PER = 0.33; // perspective ratio for horizontal ellipses

const LAT_LINES = [-60, -30, 0, 30, 60];
// Meridian angles from the "facing" meridian (0 = straight line, 90 = outer circle)
const MER_ANGLES = [0, 30, 60, 90, 120, 150];

const WIRE_STROKE = "rgba(255,255,255,0.13)";

// ── Component ─────────────────────────────────────────────────────────────────
export function AngleWorkspace({ tool, config }: Props) {
  const router  = useRouter();
  const rgb     = config.shadowColor;

  const [phase,   setPhase]   = useState<Phase>("idle");
  const [preview, setPreview] = useState("");
  const previewRef   = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [azimuth,   setAzimuth]   = useState(45);   // 0–360
  const [elevation, setElevation] = useState(30);   // −85 – 85
  const [prompt,    setPrompt]    = useState("");
  const [gen12,     setGen12]     = useState(false);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  // ── File ───────────────────────────────────────────────────────────────────
  const pickFile = useCallback((f: File) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(f);
    previewRef.current = url;
    setPreview(url);
    setPhase("edit");
  }, []);

  // ── Sphere drag ────────────────────────────────────────────────────────────
  const dragRef = useRef<{ startX: number; startY: number; startAz: number; startEl: number } | null>(null);

  const onSphereDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startAz: azimuth, startEl: elevation };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { startX, startY, startAz, startEl } = dragRef.current;
      const newAz = ((startAz + (e.clientX - startX) * 0.5) % 360 + 360) % 360;
      const newEl = Math.max(-85, Math.min(85, startEl - (e.clientY - startY) * 0.5));
      setAzimuth(Math.round(newAz));
      setElevation(Math.round(newEl));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  // ── Nudge buttons ──────────────────────────────────────────────────────────
  const nudge = (dAz: number, dEl: number) => {
    setAzimuth(az => ((az + dAz) % 360 + 360) % 360);
    setElevation(el => Math.max(-85, Math.min(85, el + dEl)));
  };

  // ── Indicator projection ───────────────────────────────────────────────────
  const azRad = (azimuth   * Math.PI) / 180;
  const elRad = (elevation * Math.PI) / 180;
  // 3D point on unit sphere → orthographic projection
  const indX   = CX + R * Math.cos(elRad) * Math.sin(azRad);
  const indY   = CY - R * Math.sin(elRad);
  const isFront = Math.cos(azRad) * Math.cos(elRad) >= 0;

  // ── Globe SVG ──────────────────────────────────────────────────────────────
  const Globe = (
    <svg
      viewBox="0 0 240 240"
      className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      onMouseDown={onSphereDown}
    >
      {/* Outer glow ring */}
      <circle cx={CX} cy={CY} r={R + 2} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      {/* Outer circle */}
      <circle cx={CX} cy={CY} r={R} fill="rgba(0,0,0,0.15)" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />

      {/* Latitude lines */}
      {LAT_LINES.map(lat => {
        const φ  = (lat * Math.PI) / 180;
        const cy = CY - R * Math.sin(φ);
        const rx = R * Math.cos(φ);
        const ry = rx * PER;
        return <ellipse key={lat} cx={CX} cy={cy} rx={rx} ry={ry}
          fill="none" stroke={WIRE_STROKE} strokeWidth="0.8" />;
      })}

      {/* Meridian lines */}
      {MER_ANGLES.map(ang => {
        const rad = (ang * Math.PI) / 180;
        const rx  = R * Math.sin(rad);
        if (rx < 1.5) {
          return <line key={ang} x1={CX} y1={CY - R} x2={CX} y2={CY + R}
            stroke={WIRE_STROKE} strokeWidth="0.8" />;
        }
        return <ellipse key={ang} cx={CX} cy={CY} rx={rx} ry={R}
          fill="none" stroke={WIRE_STROKE} strokeWidth="0.8" />;
      })}

      {/* ── Image thumbnail clipped to square in center ── */}
      {preview && (
        <>
          <defs>
            <clipPath id="thumb-clip">
              <rect x={CX - 28} y={CY - 28} width={56} height={56} rx={6} />
            </clipPath>
          </defs>
          <image href={preview} x={CX - 28} y={CY - 28} width={56} height={56}
            clipPath="url(#thumb-clip)" preserveAspectRatio="xMidYMid slice" />
          <rect x={CX - 28} y={CY - 28} width={56} height={56} rx={6}
            fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        </>
      )}

      {/* ── Camera indicator (back — dimmed dot) ── */}
      {!isFront && (
        <circle cx={indX} cy={indY} r={5}
          fill={`rgba(${rgb},0.25)`} stroke={`rgba(${rgb},0.45)`} strokeWidth="1" />
      )}

      {/* ── Camera indicator (front — camera icon) ── */}
      {isFront && (
        <g transform={`translate(${indX},${indY})`}>
          {/* dashed line to center */}
          <line x1={0} y1={0} x2={CX - indX} y2={CY - indY}
            stroke={`rgba(${rgb},0.45)`} strokeWidth="1" strokeDasharray="3 2" />
          {/* camera body */}
          <rect x={-11} y={-7} width={22} height={14} rx={3}
            fill={`rgb(${rgb})`} />
          {/* lens */}
          <circle cx={0} cy={0} r={4.5} fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
          <circle cx={0} cy={0} r={2.5} fill={`rgba(${rgb},0.6)`} />
          {/* viewfinder bump */}
          <rect x={8} y={-4.5} width={5} height={4} rx={1.5}
            fill={`rgb(${rgb})`} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
        </g>
      )}
    </svg>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-16 md:pt-20">

        {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
        <aside className="w-[300px] shrink-0 border-l border-white/5 bg-black/50 backdrop-blur-3xl flex flex-col z-10">
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 hide-scroll">

            {/* Globe picker */}
            <div>
              <p className="text-sm font-semibold text-gray-300 mb-3">زاوية الكاميرا</p>
              <div className="rounded-2xl bg-white/4 border border-white/8 p-3 space-y-2">
                <p className="text-xs text-gray-500 text-center">اسحب للتحكم في الزاوية</p>

                {/* Globe + arrow buttons */}
                <div className="relative flex items-center justify-center py-2">
                  <button onClick={() => nudge(0, 10)}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10">
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <button onClick={() => nudge(0, -10)}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10">
                    <ChevronDown className="w-5 h-5" />
                  </button>
                  <button onClick={() => nudge(-10, 0)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => nudge(10, 0)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10">
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="w-[200px] h-[200px]">{Globe}</div>
                </div>

                {/* Generate from 12 */}
                <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
                  <input type="checkbox" checked={gen12} onChange={e => setGen12(e.target.checked)}
                    className="rounded accent-current"
                    style={{ accentColor: `rgb(${rgb})` }} />
                  <span className="text-xs text-gray-400">توليد من أفضل 12 زاوية</span>
                </label>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              {/* Rotation */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">الدوران</span>
                  <span className="text-sm font-mono font-bold" style={{ color: `rgb(${rgb})` }}>
                    {azimuth}°
                  </span>
                </div>
                <input type="range" min={0} max={360} value={azimuth}
                  onChange={e => setAzimuth(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full"
                  style={{ accentColor: `rgb(${rgb})` }} />
              </div>

              {/* Tilt */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">الإمالة</span>
                  <span className="text-sm font-mono font-bold" style={{ color: `rgb(${rgb})` }}>
                    {elevation > 0 ? "+" : ""}{elevation}°
                  </span>
                </div>
                <input type="range" min={-85} max={85} value={elevation}
                  onChange={e => setElevation(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full"
                  style={{ accentColor: `rgb(${rgb})` }} />
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">وصف إضافي
                <span className="text-gray-600 text-xs font-normal mr-2">(اختياري)</span>
              </label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="أي تفاصيل إضافية عن المشهد..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-white/25 transition-colors leading-relaxed"
                style={{ direction: "rtl" }} />
            </div>

          </div>

          {/* Generate */}
          <div className="shrink-0 p-5 border-t border-white/5 bg-black/60 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>التكلفة</span>
              <span className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-full"
                style={{ color: `rgb(${rgb})`, backgroundColor: `rgba(${rgb}, 0.1)` }}>
                <Zap className="w-3 h-3" /> {tool.credits} كريديت
              </span>
            </div>
            <button
              onClick={() => {
                if (!preview || phase === "processing") return;
                setPhase("processing");
                setTimeout(() => setPhase("result"), 3500);
              }}
              disabled={!preview || phase === "processing"}
              className={cn(
                "w-full rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300",
                preview && phase !== "processing"
                  ? "text-white hover:scale-[1.02] hover:brightness-110 cursor-pointer"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
              )}
              style={{
                height: "52px",
                ...(preview && phase !== "processing" ? {
                  backgroundColor: `rgba(${rgb}, 0.2)`,
                  border: `1px solid rgba(${rgb}, 0.45)`,
                  boxShadow: `0 0 25px rgba(${rgb}, 0.2)`,
                } : {}),
              }}
            >
              {phase === "processing"
                ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري التوليد...</>
                : <><Sparkles className="w-5 h-5" /> توليد الزاوية الجديدة</>}
            </button>
          </div>
        </aside>

        {/* ── MAIN ─────────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#060608]">

          {/* Top bar */}
          <div className="h-14 shrink-0 flex items-center gap-3 px-5 border-b border-white/5 bg-black/20 backdrop-blur-sm">
            <button onClick={() => router.back()}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10"
              style={{ backgroundColor: `rgba(${rgb}, 0.12)` }}>
              <tool.icon className={cn("w-4 h-4", config.colorClass)} />
            </div>
            <span className="text-white font-bold text-sm">{tool.title}</span>
            <span className="text-xs text-gray-600 font-mono">
              {azimuth}° / {elevation > 0 ? "+" : ""}{elevation}°
            </span>
            {phase === "edit" && preview && (
              <button onClick={() => fileInputRef.current?.click()}
                className="mr-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-white/8">
                <ImageIcon className="w-3.5 h-3.5" /> تغيير الصورة
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }} />
          </div>

          {/* Editor area */}
          <div className="flex-1 flex items-center justify-center overflow-hidden p-8">
            <AnimatePresence mode="wait">

              {/* Upload zone */}
              {phase === "idle" && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="w-full max-w-lg">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); }}
                    onDragOver={e => e.preventDefault()}
                    className="rounded-3xl border-2 border-dashed cursor-pointer transition-all hover:scale-[1.005] flex flex-col items-center justify-center gap-5 py-20 px-8 text-center select-none"
                    style={{ borderColor: `rgba(${rgb}, 0.25)`, backgroundColor: "rgba(255,255,255,0.015)" }}
                  >
                    <div className="w-20 h-20 rounded-full flex items-center justify-center border-2"
                      style={{ borderColor: `rgba(${rgb}, 0.3)`, backgroundColor: `rgba(${rgb}, 0.07)` }}>
                      <Upload className="w-9 h-9" style={{ color: `rgb(${rgb})` }} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-xl mb-1">ارفع الصورة</p>
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

              {/* Preview + processing */}
              {(phase === "edit" || phase === "processing") && preview && (
                <motion.div key="edit"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="الصورة"
                    className="max-w-full max-h-full object-contain rounded-2xl"
                    style={{
                      boxShadow: `0 0 60px rgba(${rgb}, 0.15)`,
                      filter: phase === "processing" ? "blur(4px) brightness(0.5)" : undefined,
                    }}
                  />

                  {/* Angle badge */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="text-xs font-mono bg-black/70 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-xl text-white">
                      {azimuth}°
                    </span>
                    <span className="text-xs font-mono bg-black/70 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-xl text-white">
                      {elevation > 0 ? "+" : ""}{elevation}°
                    </span>
                  </div>

                  {/* Processing overlay */}
                  {phase === "processing" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderTopColor: `rgb(${rgb})`, borderRightColor: `rgba(${rgb},0.3)` }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <tool.icon className={cn("w-6 h-6 animate-pulse", config.colorClass)} />
                        </div>
                      </div>
                      <p className="text-white font-bold text-lg">جاري تغيير الزاوية...</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Result */}
              {phase === "result" && (
                <motion.div key="result"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-4 w-full max-w-2xl"
                >
                  <div className="rounded-3xl overflow-hidden border border-white/10 w-full"
                    style={{ boxShadow: `0 0 50px rgba(${rgb}, 0.15)` }}>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 bg-black/30">
                      <span className="text-sm font-bold px-3 py-1 rounded-full"
                        style={{ color: `rgb(${rgb})`, backgroundColor: `rgba(${rgb}, 0.1)` }}>
                        ✨ تم تغيير الزاوية
                      </span>
                      <span className="text-xs text-gray-600 font-mono">
                        {azimuth}° / {elevation > 0 ? "+" : ""}{elevation}°
                      </span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="نتيجة"
                      className="w-full object-contain bg-black/40" style={{ maxHeight: "60vh" }} />
                  </div>
                  <div className="flex gap-3 w-full">
                    <button className="flex-1 h-12 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                      <Download className="w-4 h-4" /> تحميل النتيجة
                    </button>
                    <button onClick={() => setPhase("edit")}
                      className="h-12 px-5 rounded-2xl border border-white/10 text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-white/5 hover:text-white transition-colors">
                      <RefreshCw className="w-4 h-4" /> تجربة زاوية أخرى
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>

      </div>
    </div>
  );
}
