"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Sparkles, Zap, Download, Loader2,
  Paintbrush, Eraser, Undo2, Trash2, Minus, Plus,
  Upload, ImageIcon, X, RefreshCw,
} from "lucide-react";
import type { Tool } from "@/lib/data/tools";
import type { STUDIO_CATEGORIES, ToolCategory } from "@/lib/data/tools";

// ── Types ─────────────────────────────────────────────────────────────────────

type DrawTool = "brush" | "eraser";
type Phase = "edit" | "processing" | "result";

// ── Palette ───────────────────────────────────────────────────────────────────

const PALETTE = [
  { hex: "#ef4444", label: "أحمر" },
  { hex: "#3b82f6", label: "أزرق" },
  { hex: "#22c55e", label: "أخضر" },
  { hex: "#eab308", label: "أصفر" },
  { hex: "#a855f7", label: "بنفسجي" },
];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InpaintWorkspace({ tool, config }: Props) {
  const router = useRouter();
  const rgb = config.shadowColor;

  // ── Files ──────────────────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const previewUrlRef = useRef("");
  const mainInputRef = useRef<HTMLInputElement>(null);

  const [refPreview, setRefPreview] = useState("");
  const refUrlRef = useRef("");
  const refInputRef = useRef<HTMLInputElement>(null);

  // ── Form ───────────────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState("");

  // ── Canvas ─────────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [drawTool, setDrawTool] = useState<DrawTool>("brush");
  const [color, setColor] = useState(PALETTE[0].hex);
  const [size, setSize] = useState(30);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [hasStrokes, setHasStrokes] = useState(false);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  // ── Phase ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("edit");

  // Cleanup on unmount
  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (refUrlRef.current) URL.revokeObjectURL(refUrlRef.current);
  }, []);

  // Set canvas dimensions after naturalSize is known and canvas is in DOM
  useEffect(() => {
    if (!naturalSize || !canvasRef.current) return;
    canvasRef.current.width = naturalSize.w;
    canvasRef.current.height = naturalSize.h;
  }, [naturalSize]);

  // ── File pickers ───────────────────────────────────────────────────────────
  const pickMainFile = useCallback((f: File) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(f);
    previewUrlRef.current = url;
    setFile(f);
    setPreview(url);
    setNaturalSize(null);
    setHistory([]);
    setHasStrokes(false);
    setPhase("edit");
  }, []);

  const pickRefFile = useCallback((f: File) => {
    if (refUrlRef.current) URL.revokeObjectURL(refUrlRef.current);
    const url = URL.createObjectURL(f);
    refUrlRef.current = url;
    setRefPreview(url);
  }, []);

  const removeRef = () => {
    if (refUrlRef.current) { URL.revokeObjectURL(refUrlRef.current); refUrlRef.current = ""; }
    setRefPreview("");
  };

  // ── Canvas drawing ─────────────────────────────────────────────────────────
  const getPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return {
      cx: (clientX - rect.left) * sx,
      cy: (clientY - rect.top) * sy,
      dx: clientX - rect.left,
      dy: clientY - rect.top,
    };
  }, []);

  const paint = useCallback((
    cx: number, cy: number,
    fromX?: number, fromY?: number,
  ) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const canvasSize = size * (canvas.width / rect.width);

    ctx.globalCompositeOperation = drawTool === "eraser" ? "destination-out" : "source-over";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (fromX !== undefined && fromY !== undefined) {
      ctx.beginPath();
      ctx.lineWidth = canvasSize;
      ctx.strokeStyle = drawTool === "eraser" ? "rgba(0,0,0,1)" : hexToRgba(color, 0.65);
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.fillStyle = drawTool === "eraser" ? "rgba(0,0,0,1)" : hexToRgba(color, 0.65);
      ctx.arc(cx, cy, canvasSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [drawTool, color, size]);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(h => [...h.slice(-19), snap]);
    setHasStrokes(true);
  }, []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const { cx, cy } = getPos(e.clientX, e.clientY);
    lastPosRef.current = { x: cx, y: cy };
    paint(cx, cy);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { cx, cy, dx, dy } = getPos(e.clientX, e.clientY);
    setCursor({ x: dx, y: dy });
    if (!isDrawingRef.current) return;
    paint(cx, cy, lastPosRef.current?.x, lastPosRef.current?.y);
    lastPosRef.current = { x: cx, y: cy };
  };

  const stopDraw = useCallback(() => {
    if (isDrawingRef.current) {
      pushHistory();
      isDrawingRef.current = false;
      lastPosRef.current = null;
    }
  }, [pushHistory]);

  // Touch events
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const t = e.touches[0];
    const { cx, cy } = getPos(t.clientX, t.clientY);
    lastPosRef.current = { x: cx, y: cy };
    paint(cx, cy);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const t = e.touches[0];
    const { cx, cy } = getPos(t.clientX, t.clientY);
    paint(cx, cy, lastPosRef.current?.x, lastPosRef.current?.y);
    lastPosRef.current = { x: cx, y: cy };
  };

  // Undo / clear
  const undo = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    if (history.length <= 1) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHistory([]);
      setHasStrokes(false);
    } else {
      ctx.putImageData(history[history.length - 2], 0, 0);
      setHistory(h => h.slice(0, -1));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
    setHasStrokes(false);
  };

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const valid = !!file && !!prompt.trim();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Navbar />

      <div className="flex flex-1 overflow-hidden pt-16 md:pt-20">

        {/* ── EDITOR MAIN AREA ─────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#020204]">
          {/* Top bar */}
          <div className="h-14 shrink-0 flex items-center px-5 gap-3 border-b border-white/5 bg-black/20 backdrop-blur-sm">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10 shrink-0"
              style={{ backgroundColor: `rgba(${rgb}, 0.12)` }}
            >
              <tool.icon className={cn("w-4 h-4", config.colorClass)} />
            </div>
            <span className="text-white font-bold text-sm">{tool.title}</span>
            <span className="text-gray-700 text-xs hidden md:inline">·</span>
            <span className="text-gray-500 text-xs hidden md:inline">{tool.desc}</span>
          </div>

          {/* Canvas / upload area */}
          <div className="flex-1 flex items-center justify-center overflow-hidden p-4 relative">
            <AnimatePresence mode="wait">

              {/* No image yet — upload zone */}
              {!file && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="w-full max-w-lg"
                >
                  <input
                    ref={mainInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickMainFile(f); e.target.value = ""; }}
                  />
                  <div
                    onClick={() => mainInputRef.current?.click()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) pickMainFile(f); }}
                    onDragOver={e => e.preventDefault()}
                    className="rounded-3xl border-2 border-dashed cursor-pointer transition-all hover:scale-[1.005] flex flex-col items-center justify-center gap-5 py-20 px-8 text-center select-none"
                    style={{
                      borderColor: `rgba(${rgb}, 0.25)`,
                      backgroundColor: "rgba(255,255,255,0.015)",
                    }}
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center border-2"
                      style={{ borderColor: `rgba(${rgb}, 0.3)`, backgroundColor: `rgba(${rgb}, 0.07)` }}
                    >
                      <Upload className="w-9 h-9" style={{ color: `rgb(${rgb})` }} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-xl mb-1">ارفع الصورة للتعديل</p>
                      <p className="text-gray-500 text-sm">
                        أو{" "}
                        <span style={{ color: `rgb(${rgb})` }} className="font-semibold">انقر للاختيار</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-600 bg-white/4 rounded-full px-4 py-2 border border-white/8 flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5" /> PNG، JPG
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Result view */}
              {file && phase === "result" && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-4 w-full max-w-2xl"
                >
                  <div
                    className="rounded-3xl overflow-hidden border border-white/10 w-full"
                    style={{ boxShadow: `0 0 50px rgba(${rgb}, 0.15)` }}
                  >
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 bg-black/30">
                      <span
                        className="text-sm font-bold px-3 py-1 rounded-full"
                        style={{ color: `rgb(${rgb})`, backgroundColor: `rgba(${rgb}, 0.1)` }}
                      >
                        ✨ تم التعديل بنجاح
                      </span>
                      <span className="text-xs text-gray-600">{file.name}</span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="نتيجة"
                      className="w-full max-h-[60vh] object-contain bg-black/40"
                    />
                  </div>
                  <div className="flex gap-3 w-full">
                    <button
                      className="flex-1 h-12 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-xl"
                    >
                      <Download className="w-4 h-4" /> تحميل النتيجة
                    </button>
                    <button
                      onClick={() => setPhase("edit")}
                      className="h-12 px-5 rounded-2xl border border-white/10 text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> تعديل جديد
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Canvas editor */}
              {file && phase !== "result" && (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative inline-block max-w-full select-none"
                  style={{ maxHeight: "calc(100vh - 260px)" }}
                >
                  {/* Base image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="تحرير"
                    className="block max-w-full rounded-2xl"
                    style={{ maxHeight: "calc(100vh - 260px)" }}
                    onLoad={onImgLoad}
                    draggable={false}
                  />

                  {/* Mask canvas (always rendered, dimensions set after img loads) */}
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full rounded-2xl"
                    style={{ cursor: "none", touchAction: "none" }}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={stopDraw}
                    onMouseLeave={() => { stopDraw(); setCursor(null); }}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={stopDraw}
                  />

                  {/* Brush cursor ring */}
                  {cursor && phase === "edit" && (
                    <div
                      className="absolute pointer-events-none rounded-full border-2"
                      style={{
                        width: size,
                        height: size,
                        left: cursor.x - size / 2,
                        top: cursor.y - size / 2,
                        borderColor: drawTool === "eraser"
                          ? "rgba(255,255,255,0.8)"
                          : hexToRgba(color, 0.9),
                        boxShadow: drawTool === "eraser"
                          ? "none"
                          : `0 0 8px ${hexToRgba(color, 0.5)}`,
                      }}
                    />
                  )}

                  {/* Processing overlay */}
                  {phase === "processing" && (
                    <div className="absolute inset-0 bg-black/65 rounded-2xl flex flex-col items-center justify-center gap-5 backdrop-blur-sm">
                      <div className="relative w-16 h-16">
                        <div
                          className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderTopColor: `rgb(${rgb})`, borderRightColor: `rgba(${rgb},0.3)` }}
                        />
                        <div
                          className="absolute inset-2 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderBottomColor: `rgb(${rgb})`, animationDirection: "reverse", animationDuration: "1.8s", opacity: 0.5 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <tool.icon className={cn("w-6 h-6 animate-pulse", config.colorClass)} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg mb-1">جاري التعديل...</p>
                        <p className="text-gray-400 text-sm">الذكاء الاصطناعي يعدّل المنطقة المحددة</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Drawing toolbar */}
          <AnimatePresence>
            {file && phase === "edit" && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="shrink-0 h-16 flex items-center justify-between px-5 border-t border-white/5 bg-black/50 backdrop-blur-sm"
              >
                {/* Start group: drawing tools + palette + size + history */}
                <div className="flex items-center gap-2">

                  {/* Brush / Eraser toggle */}
                  <div className="flex items-center gap-0.5 bg-white/6 rounded-xl p-1">
                    <button
                      onClick={() => setDrawTool("brush")}
                      title="فرشاة"
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                        drawTool === "brush" ? "bg-white/15 text-white" : "text-gray-500 hover:text-white"
                      )}
                    >
                      <Paintbrush className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDrawTool("eraser")}
                      title="ممحاة"
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                        drawTool === "eraser" ? "bg-white/15 text-white" : "text-gray-500 hover:text-white"
                      )}
                    >
                      <Eraser className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-px h-5 bg-white/10" />

                  {/* Color palette */}
                  <div className="flex items-center gap-1.5">
                    {PALETTE.map(({ hex, label }) => (
                      <button
                        key={hex}
                        onClick={() => { setColor(hex); setDrawTool("brush"); }}
                        title={label}
                        className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: hex,
                          boxShadow: color === hex && drawTool === "brush"
                            ? `0 0 0 2px #0a0a0f, 0 0 0 3.5px ${hex}`
                            : "none",
                          opacity: drawTool === "eraser" ? 0.45 : 1,
                        }}
                      />
                    ))}
                  </div>

                  <div className="w-px h-5 bg-white/10" />

                  {/* Brush size */}
                  <div className="flex items-center gap-1.5 bg-white/6 rounded-xl px-2.5 py-1.5">
                    <button
                      onClick={() => setSize(s => Math.max(5, s - 5))}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-white text-xs font-mono w-5 text-center">{size}</span>
                    <button
                      onClick={() => setSize(s => Math.min(120, s + 5))}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="w-px h-5 bg-white/10" />

                  {/* Undo */}
                  <button
                    onClick={undo}
                    disabled={history.length === 0}
                    title="تراجع"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>

                  {/* Clear all */}
                  <button
                    onClick={clearCanvas}
                    disabled={!hasStrokes}
                    title="مسح الكل"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-white/8 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* End group: change image */}
                <button
                  onClick={() => mainInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-white/8"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> تغيير الصورة
                </button>
                <input
                  ref={mainInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) pickMainFile(f); e.target.value = ""; }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────────── */}
        <aside className="w-[340px] shrink-0 border-l border-white/5 bg-black/50 backdrop-blur-3xl flex flex-col z-10">
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 hide-scroll">

            {/* Prompt */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                التعديل المطلوب
                <span className="text-red-500 mr-1.5">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="صف التغيير أو الإضافة التي تريدها في المنطقة المحددة..."
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-white/25 transition-colors leading-relaxed"
                style={{ direction: "rtl" }}
              />
            </div>

            {/* Reference image */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                صورة مرجعية
                <span className="text-gray-600 text-xs font-normal mr-2">(اختياري)</span>
              </label>
              {refPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={refPreview} alt="مرجع" className="w-full h-28 object-cover" />
                  <button
                    onClick={removeRef}
                    className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={refInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickRefFile(f); e.target.value = ""; }}
                  />
                  <button
                    onClick={() => refInputRef.current?.click()}
                    className="w-full h-20 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1.5 text-gray-600 hover:text-gray-400 hover:border-white/20 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-xs">أضف منتجاً أو صورة كمرجع للتعديل</span>
                  </button>
                </>
              )}
            </div>

            {/* Inpaint hint — shown when image is loaded but no strokes yet */}
            {file && !hasStrokes && phase === "edit" && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 text-xs leading-relaxed text-center"
                style={{
                  backgroundColor: `rgba(${rgb}, 0.06)`,
                  color: `rgba(255,255,255,0.45)`,
                  border: `1px solid rgba(${rgb}, 0.15)`,
                }}
              >
                <Paintbrush className="w-4 h-4 mx-auto mb-2 opacity-60" style={{ color: `rgb(${rgb})` }} />
                ارسم على الصورة في المنطقة التي تريد تعديلها، ثم اكتب التعديل المطلوب واضغط &quot;ابدأ التعديل&quot;
              </motion.div>
            )}

            {/* Active strokes indicator */}
            {hasStrokes && phase === "edit" && (
              <div
                className="flex items-center gap-2 text-xs rounded-xl px-3 py-2"
                style={{ backgroundColor: `rgba(${rgb}, 0.08)`, color: `rgb(${rgb})` }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: `rgb(${rgb})` }} />
                منطقة التعديل محددة — يمكنك إضافة المزيد أو الكتابة وبدء التعديل
              </div>
            )}

          </div>

          {/* Generate button */}
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
                if (!valid || phase === "processing") return;
                setPhase("processing");
                setTimeout(() => setPhase("result"), 3500);
              }}
              disabled={!valid || phase === "processing"}
              className={cn(
                "w-full rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300",
                valid && phase !== "processing"
                  ? "text-white hover:scale-[1.02] hover:brightness-110 cursor-pointer"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
              )}
              style={{
                height: "52px",
                ...(valid && phase !== "processing" ? {
                  backgroundColor: `rgba(${rgb}, 0.2)`,
                  border: `1px solid rgba(${rgb}, 0.45)`,
                  boxShadow: `0 0 25px rgba(${rgb}, 0.2)`,
                } : {}),
              }}
            >
              {phase === "processing" ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> جاري التعديل...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> ابدأ التعديل</>
              )}
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}
