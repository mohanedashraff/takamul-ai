"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Sparkles, Zap, Download, Loader2,
  Upload, ImageIcon, RefreshCw, Move,
} from "lucide-react";
import type { Tool } from "@/lib/data/tools";
import type { STUDIO_CATEGORIES, ToolCategory } from "@/lib/data/tools";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Expand { top: number; right: number; bottom: number; left: number; }
type Handle = "top" | "right" | "bottom" | "left" | "tl" | "tr" | "bl" | "br";
type Phase = "idle" | "edit" | "processing" | "result";

interface DragState {
  handle: Handle;
  startX: number;
  startY: number;
  startExpand: Expand;
  scale: number;
}

// ── Presets (as ratio multipliers of image dimensions) ────────────────────────

const PRESETS = [
  { label: "16:9",        icon: "▬", ratio: { w: 16, h: 9  } },
  { label: "9:16",        icon: "▮", ratio: { w: 9,  h: 16 } },
  { label: "4:3",         icon: "▭", ratio: { w: 4,  h: 3  } },
  { label: "1:1",         icon: "■", ratio: { w: 1,  h: 1  } },
  { label: "+25% جوانب",  icon: "⟺", custom: (w: number, _h: number): Expand =>
      ({ top: 0, right: Math.round(w * 0.25), bottom: 0, left: Math.round(w * 0.25) }) },
  { label: "+25% أعلى/أسفل", icon: "⟸", custom: (_w: number, h: number): Expand =>
      ({ top: Math.round(h * 0.25), right: 0, bottom: Math.round(h * 0.25), left: 0 }) },
  { label: "+25% كل الجهات", icon: "⤢", custom: (w: number, h: number): Expand =>
      ({ top: Math.round(h * 0.25), right: Math.round(w * 0.25), bottom: Math.round(h * 0.25), left: Math.round(w * 0.25) }) },
] as const;

// ── Cursor map ────────────────────────────────────────────────────────────────

const CURSOR: Record<Handle, string> = {
  top: "ns-resize", bottom: "ns-resize",
  left: "ew-resize", right: "ew-resize",
  tl: "nwse-resize", br: "nwse-resize",
  tr: "nesw-resize", bl: "nesw-resize",
};

// ── Checkerboard bg ───────────────────────────────────────────────────────────

const CHECKER_STYLE: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(45deg,#2a2a2a 25%,transparent 25%),
    linear-gradient(-45deg,#2a2a2a 25%,transparent 25%),
    linear-gradient(45deg,transparent 75%,#2a2a2a 75%),
    linear-gradient(-45deg,transparent 75%,#2a2a2a 75%)`,
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
  backgroundColor: "#1a1a1a",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OutpaintWorkspace({ tool, config }: Props) {
  const router = useRouter();
  const rgb = config.shadowColor;

  // ── File ───────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const previewRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Outpaint state ─────────────────────────────────────────────────────────
  const [expand, setExpand] = useState<Expand>({ top: 0, right: 0, bottom: 0, left: 0 });
  const [prompt, setPrompt] = useState("");

  // ── Container size ─────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [cSize, setCSize] = useState({ w: 900, h: 600 });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setCSize({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  // ── File pick ──────────────────────────────────────────────────────────────
  const pickFile = useCallback((f: File) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(f);
    previewRef.current = url;
    setFile(f);
    setPreview(url);
    setNat(null);
    setExpand({ top: 0, right: 0, bottom: 0, left: 0 });
    setPhase("edit");
  }, []);

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  };

  // ── Scale calculation ──────────────────────────────────────────────────────
  const PAD = 56;
  const totalW = (nat?.w ?? 1) + expand.left + expand.right;
  const totalH = (nat?.h ?? 1) + expand.top + expand.bottom;
  const scale = nat
    ? Math.min((cSize.w - PAD * 2) / totalW, (cSize.h - PAD * 2) / totalH, 1)
    : 1;

  const dTotalW = Math.round(totalW * scale);
  const dTotalH = Math.round(totalH * scale);
  const dImgW   = Math.round((nat?.w ?? 0) * scale);
  const dImgH   = Math.round((nat?.h ?? 0) * scale);
  const dLeft   = Math.round(expand.left * scale);
  const dTop    = Math.round(expand.top * scale);

  // ── Drag ───────────────────────────────────────────────────────────────────
  const dragRef = useRef<DragState | null>(null);

  const startDrag = useCallback((handle: Handle, e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, startExpand: { ...expand }, scale };
  }, [expand, scale]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current || !nat) return;
      const { handle, startX, startY, startExpand, scale: s } = dragRef.current;
      const dx = Math.round((e.clientX - startX) / s);
      const dy = Math.round((e.clientY - startY) / s);
      const MAX = Math.max(nat.w, nat.h) * 3;

      setExpand(_prev => {
        const next = { ...startExpand };
        if (handle === "right" || handle === "tr" || handle === "br")
          next.right  = Math.max(0, Math.min(MAX, startExpand.right  + dx));
        if (handle === "left"  || handle === "tl" || handle === "bl")
          next.left   = Math.max(0, Math.min(MAX, startExpand.left   - dx));
        if (handle === "bottom" || handle === "bl" || handle === "br")
          next.bottom = Math.max(0, Math.min(MAX, startExpand.bottom + dy));
        if (handle === "top"   || handle === "tl" || handle === "tr")
          next.top    = Math.max(0, Math.min(MAX, startExpand.top    - dy));
        return next;
      });
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [nat]);

  // ── Presets ────────────────────────────────────────────────────────────────
  const applyPreset = (p: typeof PRESETS[number]) => {
    if (!nat) return;
    if ("custom" in p) {
      setExpand(p.custom(nat.w, nat.h));
    } else {
      // ratio preset: compute expansion to reach target ratio
      const { w: rw, h: rh } = p.ratio;
      const targetAr = rw / rh;
      const currentAr = nat.w / nat.h;
      if (targetAr > currentAr) {
        // need wider: expand left + right equally
        const targetW = Math.round(nat.h * targetAr);
        const diff = targetW - nat.w;
        setExpand({ top: 0, bottom: 0, left: Math.round(diff / 2), right: Math.round(diff / 2) });
      } else {
        // need taller: expand top + bottom equally
        const targetH = Math.round(nat.w / targetAr);
        const diff = targetH - nat.h;
        setExpand({ left: 0, right: 0, top: Math.round(diff / 2), bottom: Math.round(diff / 2) });
      }
    }
  };

  // ── Handle renderer ────────────────────────────────────────────────────────
  const H = 10; // handle hit area size
  const handles: { id: Handle; style: React.CSSProperties }[] = [
    // Edges
    { id: "top",    style: { top: -H/2, left: "50%", transform: "translateX(-50%)", width: 48, height: H, cursor: CURSOR.top } },
    { id: "bottom", style: { bottom: -H/2, left: "50%", transform: "translateX(-50%)", width: 48, height: H, cursor: CURSOR.bottom } },
    { id: "left",   style: { left: -H/2, top: "50%", transform: "translateY(-50%)", width: H, height: 48, cursor: CURSOR.left } },
    { id: "right",  style: { right: -H/2, top: "50%", transform: "translateY(-50%)", width: H, height: 48, cursor: CURSOR.right } },
    // Corners
    { id: "tl", style: { top: -H/2, left: -H/2, width: H*2, height: H*2, cursor: CURSOR.tl } },
    { id: "tr", style: { top: -H/2, right: -H/2, width: H*2, height: H*2, cursor: CURSOR.tr } },
    { id: "bl", style: { bottom: -H/2, left: -H/2, width: H*2, height: H*2, cursor: CURSOR.bl } },
    { id: "br", style: { bottom: -H/2, right: -H/2, width: H*2, height: H*2, cursor: CURSOR.br } },
  ];

  const hasExpansion = expand.top > 0 || expand.right > 0 || expand.bottom > 0 || expand.left > 0;
  const outputW = nat ? nat.w + expand.left + expand.right : 0;
  const outputH = nat ? nat.h + expand.top + expand.bottom : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-16 md:pt-20">

        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <aside className="w-[300px] shrink-0 border-l border-white/5 bg-black/50 backdrop-blur-3xl flex flex-col z-10">
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 hide-scroll">

            {/* Prompt */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">وصف المنطقة الجديدة
                <span className="text-gray-600 text-xs font-normal mr-2">(اختياري)</span>
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="مثال: سماء زرقاء صافية، غابة كثيفة، استمرار نفس المشهد..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-white/25 transition-colors leading-relaxed"
                style={{ direction: "rtl" }}
              />
            </div>

            {/* Presets */}
            <div>
              <p className="text-sm font-semibold text-gray-300 mb-2">توسيع سريع</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => applyPreset(p)}
                    disabled={!nat}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/8 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="text-base leading-none opacity-70">{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expansion info */}
            {nat && hasExpansion && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 space-y-2 text-xs"
                style={{ backgroundColor: `rgba(${rgb}, 0.06)`, border: `1px solid rgba(${rgb}, 0.15)` }}
              >
                <p className="font-semibold text-gray-300 mb-3">حجم الإخراج</p>
                <div className="flex justify-between text-gray-500">
                  <span>الأصلية</span>
                  <span className="font-mono text-gray-400">{nat.w} × {nat.h}px</span>
                </div>
                <div className="flex justify-between" style={{ color: `rgb(${rgb})` }}>
                  <span className="font-semibold">الناتجة</span>
                  <span className="font-mono font-bold">{outputW} × {outputH}px</span>
                </div>
                {expand.top > 0 && <div className="flex justify-between text-gray-600"><span>أعلى +</span><span className="font-mono">{expand.top}px</span></div>}
                {expand.bottom > 0 && <div className="flex justify-between text-gray-600"><span>أسفل +</span><span className="font-mono">{expand.bottom}px</span></div>}
                {expand.left > 0 && <div className="flex justify-between text-gray-600"><span>يسار +</span><span className="font-mono">{expand.left}px</span></div>}
                {expand.right > 0 && <div className="flex justify-between text-gray-600"><span>يمين +</span><span className="font-mono">{expand.right}px</span></div>}
              </motion.div>
            )}

            {/* Hint */}
            {phase === "edit" && !hasExpansion && (
              <div
                className="rounded-2xl p-3 text-xs text-center leading-relaxed"
                style={{ backgroundColor: `rgba(${rgb}, 0.05)`, color: "rgba(255,255,255,0.4)", border: `1px solid rgba(${rgb}, 0.12)` }}
              >
                <Move className="w-4 h-4 mx-auto mb-2 opacity-50" style={{ color: `rgb(${rgb})` }} />
                اسحب المقابض حول الصورة لتحديد منطقة التمديد، أو استخدم أزرار التوسيع السريع
              </div>
            )}

          </div>

          {/* Generate */}
          <div className="shrink-0 p-5 border-t border-white/5 bg-black/60 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>التكلفة</span>
              <span
                className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-full"
                style={{ color: `rgb(${rgb})`, backgroundColor: `rgba(${rgb}, 0.1)` }}
              >
                <Zap className="w-3 h-3" /> {tool.credits} كريديت
              </span>
            </div>
            <button
              onClick={() => {
                if (!file || !hasExpansion || phase === "processing") return;
                setPhase("processing");
                setTimeout(() => setPhase("result"), 3500);
              }}
              disabled={!file || !hasExpansion || phase === "processing"}
              className={cn(
                "w-full rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300",
                file && hasExpansion && phase !== "processing"
                  ? "text-white hover:scale-[1.02] hover:brightness-110 cursor-pointer"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
              )}
              style={{
                height: "52px",
                ...(file && hasExpansion && phase !== "processing" ? {
                  backgroundColor: `rgba(${rgb}, 0.2)`,
                  border: `1px solid rgba(${rgb}, 0.45)`,
                  boxShadow: `0 0 25px rgba(${rgb}, 0.2)`,
                } : {}),
              }}
            >
              {phase === "processing"
                ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري التمديد...</>
                : <><Sparkles className="w-5 h-5" /> ابدأ التمديد</>}
            </button>
          </div>
        </aside>

        {/* ── MAIN CANVAS ──────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#060608]">

          {/* Top bar */}
          <div className="h-14 shrink-0 flex items-center gap-3 px-5 border-b border-white/5 bg-black/20 backdrop-blur-sm">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10"
              style={{ backgroundColor: `rgba(${rgb}, 0.12)` }}
            >
              <tool.icon className={cn("w-4 h-4", config.colorClass)} />
            </div>
            <span className="text-white font-bold text-sm">{tool.title}</span>
            {nat && (
              <span className="text-xs text-gray-600 font-mono">
                {nat.w}×{nat.h}
                {hasExpansion && <> → <span style={{ color: `rgb(${rgb})` }}>{outputW}×{outputH}</span></>}
              </span>
            )}
            {phase === "edit" && file && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mr-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-white/8"
              >
                <ImageIcon className="w-3.5 h-3.5" /> تغيير الصورة
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }} />
          </div>

          {/* Editor area */}
          <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">

              {/* ── Upload zone ── */}
              {phase === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-lg px-6"
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }} />
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

              {/* ── Result ── */}
              {phase === "result" && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-4 w-full max-w-2xl px-6"
                >
                  <div className="rounded-3xl overflow-hidden border border-white/10 w-full"
                    style={{ boxShadow: `0 0 50px rgba(${rgb}, 0.15)` }}>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 bg-black/30">
                      <span className="text-sm font-bold px-3 py-1 rounded-full"
                        style={{ color: `rgb(${rgb})`, backgroundColor: `rgba(${rgb}, 0.1)` }}>
                        ✨ تم التمديد بنجاح
                      </span>
                      <span className="text-xs text-gray-600 font-mono">{outputW}×{outputH}px</span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="نتيجة" className="w-full object-contain bg-black/40" style={{ maxHeight: "60vh" }} />
                  </div>
                  <div className="flex gap-3 w-full">
                    <button className="flex-1 h-12 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-xl">
                      <Download className="w-4 h-4" /> تحميل النتيجة
                    </button>
                    <button onClick={() => setPhase("edit")}
                      className="h-12 px-5 rounded-2xl border border-white/10 text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-white/5 hover:text-white transition-colors">
                      <RefreshCw className="w-4 h-4" /> تعديل جديد
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Outpaint editor ── */}
              {(phase === "edit" || phase === "processing") && nat && (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="relative select-none"
                  style={{ width: dTotalW, height: dTotalH, ...CHECKER_STYLE }}
                >
                  {/* Uploaded image positioned within expanded canvas */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="صورة"
                    onLoad={onImgLoad}
                    draggable={false}
                    className="absolute"
                    style={{ left: dLeft, top: dTop, width: dImgW, height: dImgH, display: "block" }}
                  />

                  {/* Dashed border around the whole outpaint area */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      outline: `2px dashed rgba(255,255,255,0.35)`,
                      outlineOffset: "-1px",
                    }}
                  />

                  {/* Corner bracket decorations (visual only) */}
                  {(["tl", "tr", "bl", "br"] as const).map(c => (
                    <div
                      key={c}
                      className="absolute pointer-events-none"
                      style={{
                        width: 16, height: 16,
                        top:    c.startsWith("t") ? -1 : undefined,
                        bottom: c.startsWith("b") ? -1 : undefined,
                        left:   c.endsWith("l")   ? -1 : undefined,
                        right:  c.endsWith("r")   ? -1 : undefined,
                        borderTop:    c.startsWith("t") ? "2px solid white" : undefined,
                        borderBottom: c.startsWith("b") ? "2px solid white" : undefined,
                        borderLeft:   c.endsWith("l")   ? "2px solid white" : undefined,
                        borderRight:  c.endsWith("r")   ? "2px solid white" : undefined,
                      }}
                    />
                  ))}

                  {/* Edge midpoint indicators */}
                  {(["top", "bottom", "left", "right"] as const).map(e => (
                    <div
                      key={e}
                      className="absolute pointer-events-none bg-white/50 rounded-full"
                      style={{
                        width:  e === "top" || e === "bottom" ? 28 : 4,
                        height: e === "left" || e === "right" ? 28 : 4,
                        top:    e === "top" ? -2 : e === "bottom" ? undefined : "50%",
                        bottom: e === "bottom" ? -2 : undefined,
                        left:   e === "left" ? -2 : e === "right" ? undefined : "50%",
                        right:  e === "right" ? -2 : undefined,
                        transform:
                          e === "top" || e === "bottom" ? "translateX(-50%)" :
                          e === "left" || e === "right" ? "translateY(-50%)" : undefined,
                      }}
                    />
                  ))}

                  {/* Invisible drag handles */}
                  {handles.map(({ id, style }) => (
                    <div
                      key={id}
                      className="absolute z-20"
                      style={{ ...style, position: "absolute" }}
                      onMouseDown={e => startDrag(id, e)}
                    />
                  ))}

                  {/* Expansion labels */}
                  {expand.top > 0 && (
                    <div className="absolute pointer-events-none text-[10px] font-mono text-white/60 bg-black/50 px-1.5 py-0.5 rounded"
                      style={{ top: 4, left: "50%", transform: "translateX(-50%)" }}>
                      +{expand.top}px
                    </div>
                  )}
                  {expand.bottom > 0 && (
                    <div className="absolute pointer-events-none text-[10px] font-mono text-white/60 bg-black/50 px-1.5 py-0.5 rounded"
                      style={{ bottom: 4, left: "50%", transform: "translateX(-50%)" }}>
                      +{expand.bottom}px
                    </div>
                  )}
                  {expand.left > 0 && (
                    <div className="absolute pointer-events-none text-[10px] font-mono text-white/60 bg-black/50 px-1.5 py-0.5 rounded"
                      style={{ left: 4, top: "50%", transform: "translateY(-50%) rotate(-90deg)", transformOrigin: "center" }}>
                      +{expand.left}px
                    </div>
                  )}
                  {expand.right > 0 && (
                    <div className="absolute pointer-events-none text-[10px] font-mono text-white/60 bg-black/50 px-1.5 py-0.5 rounded"
                      style={{ right: 4, top: "50%", transform: "translateY(-50%) rotate(90deg)", transformOrigin: "center" }}>
                      +{expand.right}px
                    </div>
                  )}

                  {/* Processing overlay */}
                  {phase === "processing" && (
                    <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-5 backdrop-blur-sm">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderTopColor: `rgb(${rgb})`, borderRightColor: `rgba(${rgb},0.3)` }} />
                        <div className="absolute inset-2 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderBottomColor: `rgb(${rgb})`, animationDirection: "reverse", animationDuration: "1.8s", opacity: 0.5 }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <tool.icon className={cn("w-6 h-6 animate-pulse", config.colorClass)} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg mb-1">جاري تمديد الصورة...</p>
                        <p className="text-gray-400 text-sm">الذكاء الاصطناعي يملأ المنطقة الجديدة</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>

      </div>
    </div>
  );
}
