"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// ── 3D Math ───────────────────────────────────────────────────────────────────

type V3 = [number, number, number];

// Rotate around Y axis (horizontal spin)
function rotY(p: V3, a: number): V3 {
  return [
    Math.cos(a) * p[0] + Math.sin(a) * p[2],
    p[1],
    -Math.sin(a) * p[0] + Math.cos(a) * p[2],
  ];
}

// Rotate around X axis (vertical tilt)
function rotX(p: V3, a: number): V3 {
  return [
    p[0],
    Math.cos(a) * p[1] - Math.sin(a) * p[2],
    Math.sin(a) * p[1] + Math.cos(a) * p[2],
  ];
}

function transform(p: V3, rx: number, ry: number): V3 {
  return rotX(rotY(p, ry), rx);
}

// ── Sphere geometry ───────────────────────────────────────────────────────────

const SEGS = 64; // segments per circle (smoothness)

function latCircle(latDeg: number): V3[] {
  const phi = (latDeg * Math.PI) / 180;
  const r   = Math.cos(phi);
  const y   = Math.sin(phi);
  return Array.from({ length: SEGS + 1 }, (_, i) => {
    const t = (i / SEGS) * Math.PI * 2;
    return [r * Math.cos(t), y, r * Math.sin(t)] as V3;
  });
}

function lonCircle(lonDeg: number): V3[] {
  const lam = (lonDeg * Math.PI) / 180;
  return Array.from({ length: SEGS + 1 }, (_, i) => {
    const phi = ((i / SEGS) * 2 - 1) * Math.PI;
    const r   = Math.cos(phi);
    const y   = Math.sin(phi);
    return [r * Math.cos(lam), y, r * Math.sin(lam)] as V3;
  });
}

const LATITUDES  = [-60, -30, 0, 30, 60];
const LONGITUDES = [0, 30, 60, 90, 120, 150];

const ALL_CIRCLES: V3[][] = [
  ...LATITUDES.map(latCircle),
  ...LONGITUDES.map(lonCircle),
];

// ── Globe SVG renderer ────────────────────────────────────────────────────────

const R_SVG = 100;
const CX    = 120;
const CY    = 120;
const SENS  = 0.008; // radians per pixel drag

function buildPaths(rx: number, ry: number) {
  const proj = (p: V3) => {
    const [x, y, z] = transform(p, rx, ry);
    return { x: CX + R_SVG * x, y: CY - R_SVG * y, z };
  };

  const front: string[] = [];
  const back:  string[] = [];

  for (const circle of ALL_CIRCLES) {
    const pts = circle.map(proj);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const seg = `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      if ((a.z + b.z) >= 0) front.push(seg);
      else                   back.push(seg);
    }
  }

  return { frontD: front.join(""), backD: back.join("") };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AngleWorkspace({ tool, config }: Props) {
  const router = useRouter();
  const rgb    = config.shadowColor;

  const [phase,   setPhase]   = useState<Phase>("idle");
  const [preview, setPreview] = useState("");
  const previewRef   = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Primary sphere rotation in radians (rotRX = vertical, rotRY = horizontal)
  const [rotRX, setRotRX] = useState(-0.38); // ~-22° elevation
  const [rotRY, setRotRY] = useState(0.79);  // ~45° azimuth

  const [prompt, setPrompt] = useState("");
  const [gen12,  setGen12]  = useState(false);

  // Derived display angles
  const azimuth   = Math.round((((rotRY * 180) / Math.PI) % 360 + 360) % 360);
  const elevation = Math.round(Math.max(-85, Math.min(85, (-rotRX * 180) / Math.PI)));

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  // ── File pick ──────────────────────────────────────────────────────────────
  const pickFile = useCallback((f: File) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(f);
    previewRef.current = url;
    setPreview(url);
    setPhase("edit");
  }, []);

  // ── Drag ───────────────────────────────────────────────────────────────────
  const dragRef = useRef<{ startX: number; startY: number; startRX: number; startRY: number } | null>(null);

  const onSphereDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startRX: rotRX, startRY: rotRY };
  };

  useEffect(() => {
    const MAX_EL = (85 * Math.PI) / 180;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { startX, startY, startRX, startRY } = dragRef.current;
      setRotRY(startRY + (e.clientX - startX) * SENS);
      setRotRX(Math.max(-MAX_EL, Math.min(MAX_EL, startRX + (e.clientY - startY) * SENS)));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  // ── Nudge / slider helpers ─────────────────────────────────────────────────
  const nudge = (dAz: number, dEl: number) => {
    const MAX_EL = (85 * Math.PI) / 180;
    setRotRY(ry => ry + (dAz * Math.PI) / 180);
    setRotRX(rx => Math.max(-MAX_EL, Math.min(MAX_EL, rx - (dEl * Math.PI) / 180)));
  };

  const setAzEl = (az: number, el: number) => {
    setRotRY((az * Math.PI) / 180);
    setRotRX((-el * Math.PI) / 180);
  };

  // ── Computed sphere paths (memoized) ───────────────────────────────────────
  const { frontD, backD } = useMemo(() => buildPaths(rotRX, rotRY), [rotRX, rotRY]);

  // ── Camera indicator position ──────────────────────────────────────────────
  const [indFX, indFY, indFZ] = transform([0, 0, 1], rotRX, rotRY);
  const indX    = CX + R_SVG * indFX;
  const indY    = CY - R_SVG * indFY;
  const isFront = indFZ >= 0;

  // ── Globe SVG ──────────────────────────────────────────────────────────────
  const Globe = (
    <svg
      viewBox="0 0 240 240"
      className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      onMouseDown={onSphereDown}
    >
      {/* Sphere background */}
      <circle cx={CX} cy={CY} r={R_SVG + 2} fill="rgba(0,0,0,0.3)" />

      {/* Back-face wireframe (behind sphere centre) */}
      {backD && (
        <path d={backD} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.7" />
      )}

      {/* Image thumbnail (always centered, not rotating) */}
      {preview && (
        <>
          <defs>
            <clipPath id="thumb-clip">
              <rect x={CX - 26} y={CY - 26} width={52} height={52} rx={5} />
            </clipPath>
          </defs>
          <image
            href={preview}
            x={CX - 26} y={CY - 26} width={52} height={52}
            clipPath="url(#thumb-clip)"
            preserveAspectRatio="xMidYMid slice"
          />
          <rect x={CX - 26} y={CY - 26} width={52} height={52} rx={5}
            fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        </>
      )}

      {/* Front-face wireframe (in front of sphere centre) */}
      {frontD && (
        <path d={frontD} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.9" />
      )}

      {/* Outer rim */}
      <circle cx={CX} cy={CY} r={R_SVG} fill="none"
        stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

      {/* Camera indicator */}
      {isFront ? (
        <g transform={`translate(${indX.toFixed(1)},${indY.toFixed(1)})`}>
          {/* line to center */}
          <line x1={0} y1={0}
            x2={(CX - indX).toFixed(1)} y2={(CY - indY).toFixed(1)}
            stroke={`rgba(${rgb},0.5)`} strokeWidth="1" strokeDasharray="3 2" />
          {/* camera body */}
          <rect x={-12} y={-8} width={24} height={15} rx={3.5}
            fill={`rgb(${rgb})`} />
          {/* lens */}
          <circle cx={0} cy={-1} r={5}
            fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" />
          <circle cx={0} cy={-1} r={2.5} fill={`rgba(${rgb},0.7)`} />
          {/* viewfinder */}
          <rect x={9} y={-6} width={5} height={4} rx={1.5}
            fill={`rgb(${rgb})`} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
        </g>
      ) : (
        /* Back-face indicator — dim ghost */
        <circle cx={indX.toFixed(1)} cy={indY.toFixed(1)} r={5}
          fill={`rgba(${rgb},0.2)`} stroke={`rgba(${rgb},0.4)`}
          strokeWidth="1" strokeDasharray="2 2" />
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
                <p className="text-xs text-gray-500 text-center">اسحب الكرة لتدويرها وتحديد الزاوية</p>

                {/* Globe + arrows */}
                <div className="relative flex items-center justify-center py-3">
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

                {/* Generate 12 */}
                <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
                  <input type="checkbox" checked={gen12}
                    onChange={e => setGen12(e.target.checked)}
                    className="rounded"
                    style={{ accentColor: `rgb(${rgb})` }} />
                  <span className="text-xs text-gray-400">توليد من أفضل 12 زاوية</span>
                </label>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">الدوران</span>
                  <span className="text-sm font-mono font-bold" style={{ color: `rgb(${rgb})` }}>
                    {azimuth}°
                  </span>
                </div>
                <input type="range" min={0} max={360} value={azimuth}
                  onChange={e => setAzEl(Number(e.target.value), elevation)}
                  className="w-full h-1.5 rounded-full"
                  style={{ accentColor: `rgb(${rgb})` }} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">الإمالة</span>
                  <span className="text-sm font-mono font-bold" style={{ color: `rgb(${rgb})` }}>
                    {elevation > 0 ? "+" : ""}{elevation}°
                  </span>
                </div>
                <input type="range" min={-85} max={85} value={elevation}
                  onChange={e => setAzEl(azimuth, Number(e.target.value))}
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
                  <img src={preview} alt="الصورة"
                    className="max-w-full max-h-full object-contain rounded-2xl"
                    style={{
                      boxShadow: `0 0 60px rgba(${rgb}, 0.15)`,
                      filter: phase === "processing" ? "blur(4px) brightness(0.5)" : undefined,
                    }}
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="text-xs font-mono bg-black/70 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-xl text-white">
                      {azimuth}°
                    </span>
                    <span className="text-xs font-mono bg-black/70 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-xl text-white">
                      {elevation > 0 ? "+" : ""}{elevation}°
                    </span>
                  </div>
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
