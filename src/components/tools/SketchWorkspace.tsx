"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Sparkles, Zap, Download, Loader2,
  Undo2, Redo2, Trash2, Minus, Plus,
  Paintbrush, Eraser, PaintBucket, RefreshCw,
} from "lucide-react";
import type { Tool } from "@/lib/data/tools";
import type { STUDIO_CATEGORIES, ToolCategory } from "@/lib/data/tools";

// ── Types ─────────────────────────────────────────────────────────────────────

type DrawTool = "brush" | "eraser" | "fill";
type AspectKey = "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
type Phase = "draw" | "processing" | "result";

// ── Constants ─────────────────────────────────────────────────────────────────

const ASPECTS: { key: AspectKey; label: string; w: number; h: number }[] = [
  { key: "1:1",  label: "مربع 1:1",       w: 800, h: 800 },
  { key: "4:3",  label: "أفقي 4:3",       w: 800, h: 600 },
  { key: "3:4",  label: "عمودي 3:4",      w: 600, h: 800 },
  { key: "16:9", label: "سينمائي 16:9",   w: 800, h: 450 },
  { key: "9:16", label: "ستوري 9:16",     w: 450, h: 800 },
];

// 5×5 palette: warm → vibrant → deep → dark → neutral
const PALETTE = [
  "#ffffff", "#fef08a", "#fed7aa", "#fca5a5", "#f0abfc",
  "#facc15", "#fb923c", "#f87171", "#e879f9", "#c084fc",
  "#22c55e", "#2dd4bf", "#60a5fa", "#a78bfa", "#f472b6",
  "#15803d", "#0e7490", "#1d4ed8", "#7c3aed", "#db2777",
  "#d1d5db", "#9ca3af", "#6b7280", "#374151", "#000000",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function floodFill(
  canvas: HTMLCanvasElement,
  startX: number,
  startY: number,
  fillHex: string,
) {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const [fr, fg, fb] = hexToRgb(fillHex);

  const sx = Math.max(0, Math.min(width - 1, Math.floor(startX)));
  const sy = Math.max(0, Math.min(height - 1, Math.floor(startY)));
  const si = (sy * width + sx) * 4;
  const tr = data[si], tg = data[si + 1], tb = data[si + 2], ta = data[si + 3];

  // Already same color
  if (tr === fr && tg === fg && tb === fb && ta === 255) return;

  const stack = [sx + sy * width];
  const visited = new Uint8Array(width * height);
  const TOL = 32;

  while (stack.length) {
    const pos = stack.pop()!;
    if (visited[pos]) continue;
    visited[pos] = 1;
    const x = pos % width;
    const y = (pos - x) / width;
    const i = pos * 4;
    if (
      Math.abs(data[i]     - tr) > TOL ||
      Math.abs(data[i + 1] - tg) > TOL ||
      Math.abs(data[i + 2] - tb) > TOL ||
      Math.abs(data[i + 3] - ta) > TOL
    ) continue;
    data[i] = fr; data[i + 1] = fg; data[i + 2] = fb; data[i + 3] = 255;
    if (x > 0)          stack.push(pos - 1);
    if (x < width - 1)  stack.push(pos + 1);
    if (y > 0)          stack.push(pos - width);
    if (y < height - 1) stack.push(pos + width);
  }
  ctx.putImageData(imageData, 0, 0);
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SketchWorkspace({ tool, config }: Props) {
  const router = useRouter();
  const rgb = config.shadowColor;

  // ── Form ───────────────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState("");

  // ── Canvas state ───────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aspect, setAspect] = useState<AspectKey>("1:1");
  const [drawTool, setDrawTool] = useState<DrawTool>("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(8);
  const [bgColor] = useState("#ffffff");
  const historyRef = useRef<ImageData[]>([]);
  const futureRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const bumpHistory = useCallback((u: boolean, r: boolean) => {
    setCanUndo(u);
    setCanRedo(r);
  }, []);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  // ── Phase ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("draw");
  const [resultUrl, setResultUrl] = useState<string>("");

  // ── Canvas init ────────────────────────────────────────────────────────────
  const currentAspect = ASPECTS.find(a => a.key === aspect)!;

  // Only canvas DOM ops — NO setState (called from useEffect)
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = currentAspect.w;
    canvas.height = currentAspect.h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
    futureRef.current = [];
  }, [currentAspect, bgColor]);

  useEffect(() => { initCanvas(); }, [initCanvas]);

  // Called from event handler (not effect) — safe to call setState here
  const changeAspect = (key: AspectKey) => {
    historyRef.current = [];
    futureRef.current = [];
    bumpHistory(false, false);
    setAspect(key);
  };

  // Close color picker on outside click
  useEffect(() => {
    const handler = () => setColorPickerOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Canvas pos helper ──────────────────────────────────────────────────────
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

  // ── History ────────────────────────────────────────────────────────────────
  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current!;
    const snap = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [...historyRef.current.slice(-29), snap];
    futureRef.current = [];
    bumpHistory(true, false);
  }, [bumpHistory]);

  const undo = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    if (historyRef.current.length === 0) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    futureRef.current = [current, ...futureRef.current.slice(0, 29)];
    if (historyRef.current.length === 1) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      historyRef.current = [];
      bumpHistory(false, true);
    } else {
      ctx.putImageData(historyRef.current[historyRef.current.length - 2], 0, 0);
      historyRef.current = historyRef.current.slice(0, -1);
      bumpHistory(historyRef.current.length > 0, true);
    }
  };

  const redo = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    if (futureRef.current.length === 0) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [...historyRef.current, current];
    ctx.putImageData(futureRef.current[0], 0, 0);
    futureRef.current = futureRef.current.slice(1);
    bumpHistory(true, futureRef.current.length > 0);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    saveHistory();
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // ── Drawing ────────────────────────────────────────────────────────────────
  const paint = useCallback((
    cx: number, cy: number,
    fromX?: number, fromY?: number,
  ) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const canvasSize = brushSize * (canvas.width / rect.width);

    ctx.globalCompositeOperation = drawTool === "eraser" ? "source-over" : "source-over";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const strokeColor = drawTool === "eraser" ? bgColor : color;

    if (fromX !== undefined && fromY !== undefined) {
      ctx.beginPath();
      ctx.lineWidth = canvasSize;
      ctx.strokeStyle = strokeColor;
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.fillStyle = strokeColor;
      ctx.arc(cx, cy, canvasSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [drawTool, color, brushSize, bgColor]);

  // Mouse
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { cx, cy } = getPos(e.clientX, e.clientY);
    if (drawTool === "fill") {
      saveHistory();
      floodFill(canvasRef.current!, cx, cy, color);
      return;
    }
    isDrawingRef.current = true;
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
      saveHistory();
      isDrawingRef.current = false;
      lastPosRef.current = null;
    }
  }, [saveHistory]);

  // Touch
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const t = e.touches[0];
    const { cx, cy } = getPos(t.clientX, t.clientY);
    if (drawTool === "fill") {
      saveHistory();
      floodFill(canvasRef.current!, cx, cy, color);
      return;
    }
    isDrawingRef.current = true;
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

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    if (!prompt.trim() || phase === "processing") return;
    setPhase("processing");
    setTimeout(() => {
      setResultUrl(canvasRef.current?.toDataURL("image/png") ?? "");
      setPhase("result");
    }, 3500);
  };

  const valid = !!prompt.trim();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Navbar />

      <div className="flex flex-col flex-1 overflow-hidden pt-16 md:pt-20">

        {/* ── TOP BAR ──────────────────────────────────────────────────── */}
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
        </div>

        {/* ── PROMPT + SETTINGS BAR ────────────────────────────────────── */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-black/30">

          {/* Ratio picker — compact horizontal */}
          <div className="shrink-0 flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {ASPECTS.map(a => (
              <button
                key={a.key}
                onClick={() => changeAspect(a.key)}
                className={cn(
                  "h-7 px-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                  aspect === a.key
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300"
                )}
                style={aspect === a.key ? {
                  backgroundColor: `rgba(${rgb}, 0.2)`,
                  color: `rgb(${rgb})`,
                } : {}}
              >
                {a.key}
              </button>
            ))}
          </div>

          {/* Prompt textarea */}
          <textarea
            rows={2}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="مثال: رسم زيتي، أنمي ياباني، واقعي فوتوغرافي، ألوان مائية..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-white/25 transition-colors leading-relaxed"
            style={{ direction: "rtl" }}
          />

          {/* Credits + generate */}
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <span
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ color: `rgb(${rgb})`, backgroundColor: `rgba(${rgb}, 0.1)` }}
            >
              <Zap className="w-3 h-3" /> {tool.credits} كريديت
            </span>
            <button
              onClick={handleGenerate}
              disabled={!valid || phase === "processing"}
              className={cn(
                "h-10 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 whitespace-nowrap",
                valid && phase !== "processing"
                  ? "text-white hover:brightness-110 cursor-pointer"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
              )}
              style={{
                ...(valid && phase !== "processing" ? {
                  backgroundColor: `rgba(${rgb}, 0.2)`,
                  border: `1px solid rgba(${rgb}, 0.45)`,
                  boxShadow: `0 0 20px rgba(${rgb}, 0.2)`,
                } : {}),
              }}
            >
              {phase === "processing"
                ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري التحويل...</>
                : <><Sparkles className="w-4 h-4" /> حوّل إلى صورة</>}
            </button>
          </div>
        </div>

        {/* ── DRAWING TOOLBAR ──────────────────────────────────────────── */}
        <div className="shrink-0 h-14 flex items-center justify-between gap-2 px-5 border-b border-white/5 bg-black/30">

          {/* Left: tools */}
          <div className="flex items-center gap-2">

            {/* Tool toggle */}
            <div className="flex items-center gap-0.5 bg-white/6 rounded-xl p-1">
              {([
                { id: "brush" as DrawTool, Icon: Paintbrush,  title: "فرشاة" },
                { id: "eraser" as DrawTool, Icon: Eraser,      title: "ممحاة" },
                { id: "fill"  as DrawTool, Icon: PaintBucket, title: "تعبئة" },
              ] as const).map(({ id, Icon, title }) => (
                <button
                  key={id}
                  onClick={() => setDrawTool(id)}
                  title={title}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    drawTool === id ? "bg-white/15 text-white" : "text-gray-500 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-white/10" />

            {/* Color picker */}
            <div className="relative" onMouseDown={e => e.stopPropagation()}>
              <button
                onClick={() => setColorPickerOpen(o => !o)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/6 hover:bg-white/10 transition-colors"
                title="اختر اللون"
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-white/30 shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-400 font-mono">{color}</span>
              </button>

              {/* Color palette popup */}
              <AnimatePresence>
                {colorPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 right-0 z-50 p-3 rounded-2xl border border-white/10 shadow-2xl"
                    style={{ backgroundColor: "#0d0d12" }}
                  >
                    {/* Grid 5×5 */}
                    <div className="grid grid-cols-5 gap-1.5 mb-2">
                      {PALETTE.map(c => (
                        <button
                          key={c}
                          onClick={() => { setColor(c); setDrawTool("brush"); setColorPickerOpen(false); }}
                          className="w-7 h-7 rounded-lg border transition-transform hover:scale-110"
                          style={{
                            backgroundColor: c,
                            borderColor: color === c ? "white" : "rgba(255,255,255,0.1)",
                            boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
                          }}
                        />
                      ))}
                    </div>
                    {/* Custom hex input */}
                    <div className="flex items-center gap-2 border-t border-white/8 pt-2">
                      <div className="w-6 h-6 rounded-lg border border-white/20" style={{ backgroundColor: color }} />
                      <input
                        type="color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        className="w-full h-7 rounded-lg cursor-pointer bg-transparent border border-white/10 px-1"
                        title="لون مخصص"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-5 bg-white/10" />

            {/* Brush size */}
            <div className="flex items-center gap-1.5 bg-white/6 rounded-xl px-2.5 py-1.5">
              <button
                onClick={() => setBrushSize(s => Math.max(1, s - 2))}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-white text-xs font-mono w-5 text-center">{brushSize}</span>
              <button
                onClick={() => setBrushSize(s => Math.min(80, s + 2))}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: history actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              title="تراجع"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="إعادة"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onClick={clearCanvas}
              title="مسح الكل"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-white/8 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── CANVAS AREA ──────────────────────────────────────────────── */}
        <main className="flex-1 flex items-center justify-center overflow-hidden p-4 bg-[#060608]">
          <AnimatePresence mode="wait">

            {/* ── Result view ── */}
            {phase === "result" && resultUrl && (
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
                      ✨ تم التحويل بنجاح
                    </span>
                    <span className="text-xs text-gray-600">{prompt.slice(0, 40)}{prompt.length > 40 ? "..." : ""}</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resultUrl}
                    alt="نتيجة"
                    className="w-full object-contain bg-black/50"
                    style={{ maxHeight: "60vh" }}
                  />
                </div>
                <div className="flex gap-3 w-full">
                  <a
                    href={resultUrl}
                    download="sketch-result.png"
                    className="flex-1 h-12 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-xl"
                  >
                    <Download className="w-4 h-4" /> تحميل النتيجة
                  </a>
                  <button
                    onClick={() => setPhase("draw")}
                    className="h-12 px-5 rounded-2xl border border-white/10 text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> رسم جديد
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Drawing canvas ── */}
            {phase !== "result" && (
              <motion.div
                key="canvas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative shadow-2xl"
                style={{
                  maxWidth: "100%",
                  maxHeight: "calc(100vh - 200px)",
                  aspectRatio: `${currentAspect.w} / ${currentAspect.h}`,
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 25px 60px rgba(0,0,0,0.5)`,
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="block w-full h-full rounded-lg"
                  style={{
                    cursor: "none",
                    touchAction: "none",
                    imageRendering: "pixelated",
                  }}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={stopDraw}
                  onMouseLeave={() => { stopDraw(); setCursor(null); }}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={stopDraw}
                />

                {/* Brush cursor */}
                {cursor && phase === "draw" && (
                  <div
                    className="absolute pointer-events-none rounded-full border-2 mix-blend-difference"
                    style={{
                      width: drawTool === "fill" ? 20 : brushSize,
                      height: drawTool === "fill" ? 20 : brushSize,
                      left: cursor.x - (drawTool === "fill" ? 10 : brushSize / 2),
                      top:  cursor.y - (drawTool === "fill" ? 10 : brushSize / 2),
                      borderColor: drawTool === "eraser" ? "#888" : color,
                      backgroundColor: drawTool === "fill" ? `${color}40` : "transparent",
                    }}
                  />
                )}

                {/* Processing overlay */}
                {phase === "processing" && (
                  <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center gap-5 backdrop-blur-sm">
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
                      <p className="text-white font-bold text-lg mb-1">جاري تحويل الرسم...</p>
                      <p className="text-gray-400 text-sm">الذكاء الاصطناعي يفسّر رسمك</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}
