"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Zap, Loader2, Download, RefreshCw,
  Undo2, Redo2, Trash2, Minus, Plus,
  Paintbrush, Eraser, PaintBucket,
  MousePointer2, Type, ImagePlus, Video, X, Sparkles,
} from "lucide-react";
import type { Tool } from "@/lib/data/tools";
import type { STUDIO_CATEGORIES, ToolCategory } from "@/lib/data/tools";

// ── Types ──────────────────────────────────────────────────────────────────────

type ActiveTool = "select" | "brush" | "eraser" | "fill";
type Phase      = "draw" | "processing" | "result";
type AspectKey  = "1:1" | "4:3" | "3:4" | "16:9" | "9:16";

interface CanvasEl {
  id:       string;
  kind:     "image" | "text";
  x: number; y: number; // % of container  (0–100)
  w: number; h: number; // % of container
  src?:     string;
  text?:    string;
  fontSize?: number;   // px absolute
  color?:    string;
  bold?:     boolean;
  editing?:  boolean;
}

interface DragState {
  type:    "move" | "resize";
  id:      string;
  handle?: string;
  startPx: number; startPy: number;
  origX:   number; origY: number;
  origW:   number; origH: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ASPECTS: { key: AspectKey; label: string; w: number; h: number }[] = [
  { key: "1:1",  label: "مربع",     w: 800, h: 800 },
  { key: "4:3",  label: "أفقي",    w: 800, h: 600 },
  { key: "3:4",  label: "عمودي",   w: 600, h: 800 },
  { key: "16:9", label: "سينمائي", w: 800, h: 450 },
  { key: "9:16", label: "ستوري",   w: 450, h: 800 },
];

const VIDEO_MODELS = [
  { value: "seedance_2_0", label: "SeeAD 2.0" },
  { value: "wan_2_1",      label: "WAN 2.1"   },
  { value: "kling_1_6",    label: "Kling 1.6" },
];

const DURATIONS   = ["4", "8", "16"];
const RESOLUTIONS = ["720p", "1080p"];

const PALETTE = [
  "#ffffff","#fef08a","#fed7aa","#fca5a5","#f0abfc",
  "#facc15","#fb923c","#f87171","#e879f9","#c084fc",
  "#22c55e","#2dd4bf","#60a5fa","#a78bfa","#f472b6",
  "#15803d","#0e7490","#1d4ed8","#7c3aed","#db2777",
  "#d1d5db","#9ca3af","#6b7280","#374151","#000000",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

function floodFill(canvas: HTMLCanvasElement, sx: number, sy: number, fillHex: string) {
  const ctx  = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const img  = ctx.getImageData(0, 0, width, height);
  const d    = img.data;
  const [fr, fg, fb] = hexToRgb(fillHex);
  const px   = Math.max(0, Math.min(width  - 1, Math.floor(sx)));
  const py   = Math.max(0, Math.min(height - 1, Math.floor(sy)));
  const si   = (py * width + px) * 4;
  const [tr, tg, tb, ta] = [d[si], d[si+1], d[si+2], d[si+3]];
  if (tr===fr && tg===fg && tb===fb && ta===255) return;
  const stack = [px + py * width];
  const vis   = new Uint8Array(width * height);
  const T     = 32;
  while (stack.length) {
    const p = stack.pop()!;
    if (vis[p]) continue; vis[p] = 1;
    const x = p % width, y = (p - x) / width, i = p * 4;
    if (Math.abs(d[i]-tr)>T||Math.abs(d[i+1]-tg)>T||Math.abs(d[i+2]-tb)>T||Math.abs(d[i+3]-ta)>T) continue;
    d[i]=fr; d[i+1]=fg; d[i+2]=fb; d[i+3]=255;
    if (x > 0)          stack.push(p - 1);
    if (x < width  - 1) stack.push(p + 1);
    if (y > 0)          stack.push(p - width);
    if (y < height - 1) stack.push(p + width);
  }
  ctx.putImageData(img, 0, 0);
}

let _elId = 0;
const nextId = () => `el-${++_elId}`;

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  tool:   Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SketchToVideoWorkspace({ tool, config }: Props) {
  const router = useRouter();
  const rgb    = config.shadowColor;
  const BG     = "#ffffff";

  // ── Sidebar state
  const [prompt,     setPrompt]     = useState("");
  const [model,      setModel]      = useState("seedance_2_0");
  const [aspect,     setAspect]     = useState<AspectKey>("16:9");
  const [duration,   setDuration]   = useState("8");
  const [resolution, setResolution] = useState("1080p");

  // ── Tool & draw state
  const [activeTool,      setActiveTool]      = useState<ActiveTool>("brush");
  const [color,           setColor]           = useState("#000000");
  const [brushSize,       setBrushSize]       = useState(8);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [canUndo,         setCanUndo]         = useState(false);
  const [canRedo,         setCanRedo]         = useState(false);
  const [cursorPos,       setCursorPos]       = useState<{x:number;y:number}|null>(null);

  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const imgInputRef    = useRef<HTMLInputElement>(null);
  const historyRef  = useRef<ImageData[]>([]);
  const futureRef   = useRef<ImageData[]>([]);
  const isDrawing   = useRef(false);
  const lastPos     = useRef<{x:number;y:number}|null>(null);

  // ── Elements (overlay objects)
  const [elements,   setElements]   = useState<CanvasEl[]>([]);
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const dragRef      = useRef<DragState|null>(null);

  // ── Phase
  const [phase,     setPhase]     = useState<Phase>("draw");
  const [resultUrl, setResultUrl] = useState("");

  const currentAspect = ASPECTS.find(a => a.key === aspect)!;
  const isDrawMode    = activeTool !== "select";

  // ── Canvas init ────────────────────────────────────────────────────────────
  const initCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width  = currentAspect.w;
    c.height = currentAspect.h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, c.width, c.height);
    historyRef.current = [];
    futureRef.current  = [];
    setCanUndo(false);
    setCanRedo(false);
  }, [currentAspect]);

  useEffect(() => { initCanvas(); }, [initCanvas]);

  // Close color picker on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!(e.target as Element)?.closest?.("[data-color-picker]")) {
        setColorPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Delete key removes selected element
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        if (elements.find(el => el.id === selectedId)?.editing) return;
        // don't delete if focus is in textarea/input
        if (document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT") return;
        setElements(p => p.filter(el => el.id !== selectedId));
        setSelectedId(null);
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [selectedId, elements]);

  // ── Canvas position helpers ───────────────────────────────────────────────
  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const c    = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const sx   = c.width  / rect.width;
    const sy   = c.height / rect.height;
    return {
      cx: (clientX - rect.left) * sx,
      cy: (clientY - rect.top)  * sy,
      dx: clientX - rect.left,
      dy: clientY - rect.top,
    };
  }, []);

  // ── History ────────────────────────────────────────────────────────────────
  const saveHistory = useCallback(() => {
    const c   = canvasRef.current!;
    const img = c.getContext("2d")!.getImageData(0, 0, c.width, c.height);
    historyRef.current = [...historyRef.current.slice(-29), img];
    futureRef.current  = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = () => {
    const c   = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    if (!historyRef.current.length) return;
    futureRef.current = [ctx.getImageData(0,0,c.width,c.height), ...futureRef.current.slice(0,29)];
    if (historyRef.current.length === 1) {
      ctx.fillStyle = BG; ctx.fillRect(0,0,c.width,c.height);
      historyRef.current = [];
      setCanUndo(false); setCanRedo(true);
    } else {
      ctx.putImageData(historyRef.current[historyRef.current.length-2], 0, 0);
      historyRef.current = historyRef.current.slice(0,-1);
      setCanUndo(historyRef.current.length > 0); setCanRedo(true);
    }
  };

  const redo = () => {
    const c   = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    if (!futureRef.current.length) return;
    historyRef.current = [...historyRef.current, ctx.getImageData(0,0,c.width,c.height)];
    ctx.putImageData(futureRef.current[0], 0, 0);
    futureRef.current = futureRef.current.slice(1);
    setCanUndo(true); setCanRedo(futureRef.current.length > 0);
  };

  const clearCanvas = () => {
    const c   = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    saveHistory();
    ctx.fillStyle = BG; ctx.fillRect(0,0,c.width,c.height);
  };

  // ── Drawing ────────────────────────────────────────────────────────────────
  const paint = useCallback((cx: number, cy: number, fromX?: number, fromY?: number) => {
    const c      = canvasRef.current!;
    const ctx    = c.getContext("2d")!;
    const rect   = c.getBoundingClientRect();
    const size   = brushSize * (c.width / rect.width);
    const stroke = activeTool === "eraser" ? BG : color;
    ctx.lineCap  = "round"; ctx.lineJoin = "round";
    if (fromX !== undefined && fromY !== undefined) {
      ctx.beginPath(); ctx.lineWidth = size; ctx.strokeStyle = stroke;
      ctx.moveTo(fromX, fromY); ctx.lineTo(cx, cy); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.fillStyle = stroke;
      ctx.arc(cx, cy, size/2, 0, Math.PI*2); ctx.fill();
    }
  }, [activeTool, color, brushSize]);

  // Canvas mouse handlers — only fire in draw mode
  const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "select") return;
    const { cx, cy } = getCanvasPos(e.clientX, e.clientY);
    if (activeTool === "fill") { saveHistory(); floodFill(canvasRef.current!, cx, cy, color); return; }
    isDrawing.current = true; lastPos.current = { x: cx, y: cy };
    paint(cx, cy);
  };

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { cx, cy, dx, dy } = getCanvasPos(e.clientX, e.clientY);
    setCursorPos({ x: dx, y: dy });
    if (!isDrawing.current || activeTool === "select") return;
    paint(cx, cy, lastPos.current?.x, lastPos.current?.y);
    lastPos.current = { x: cx, y: cy };
  };

  const stopDraw = useCallback(() => {
    if (isDrawing.current) { saveHistory(); isDrawing.current = false; lastPos.current = null; }
  }, [saveHistory]);

  const onCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool === "select") return;
    e.preventDefault();
    const t = e.touches[0];
    const { cx, cy } = getCanvasPos(t.clientX, t.clientY);
    if (activeTool === "fill") { saveHistory(); floodFill(canvasRef.current!, cx, cy, color); return; }
    isDrawing.current = true; lastPos.current = { x: cx, y: cy }; paint(cx, cy);
  };

  const onCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool === "select" || !isDrawing.current) return;
    e.preventDefault();
    const t = e.touches[0];
    const { cx, cy } = getCanvasPos(t.clientX, t.clientY);
    paint(cx, cy, lastPos.current?.x, lastPos.current?.y);
    lastPos.current = { x: cx, y: cy };
  };

  // ── Element helpers ────────────────────────────────────────────────────────

  // Compute % sizes using the canvas's virtual pixel dimensions (same aspect ratio as container)
  const calcImageSize = (naturalW: number, naturalH: number) => {
    const cW = currentAspect.w;
    const cH = currentAspect.h;
    // Fit image so longest side = 35% of the matching container dimension
    const targetW = cW * 0.35;
    const targetH = cH * 0.35;
    const scale   = Math.min(targetW / naturalW, targetH / naturalH);
    const elWpx   = naturalW * scale;
    const elHpx   = naturalH * scale;
    const w = (elWpx / cW) * 100;
    const h = (elHpx / cH) * 100;
    const x = (100 - w) / 2;
    const y = (100 - h) / 2;
    return { x, y, w, h };
  };

  const addText = () => {
    const el: CanvasEl = {
      id: nextId(), kind: "text",
      x: 25, y: 40, w: 50, h: 15,
      text: "اكتب هنا", fontSize: 32, color: "#111111", bold: false,
    };
    setElements(p => [...p, el]);
    setSelectedId(el.id);
    setActiveTool("select");
  };

  const addImage = (file: File) => {
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const { x, y, w, h } = calcImageSize(img.naturalWidth, img.naturalHeight);
      const el: CanvasEl = {
        id: nextId(), kind: "image",
        x, y, w, h, src,
      };
      setElements(p => [...p, el]);
      setSelectedId(el.id);
      setActiveTool("select");
    };
    img.onerror = () => URL.revokeObjectURL(src);
    img.src = src;
  };

  // ── Element drag / resize ─────────────────────────────────────────────────

  // Converts client coords to % of canvas container using event.currentTarget bounds
  const clientToContainerPct = (clientX: number, clientY: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    return {
      px: ((clientX - rect.left)  / rect.width)  * 100,
      py: ((clientY - rect.top)   / rect.height) * 100,
    };
  };

  const onContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const { px, py } = clientToContainerPct(e.clientX, e.clientY, e.currentTarget);
    const dx = px - d.startPx;
    const dy = py - d.startPy;

    setElements(prev => prev.map(el => {
      if (el.id !== d.id) return el;
      if (d.type === "move") {
        return {
          ...el,
          x: Math.max(0, Math.min(100 - el.w, d.origX + dx)),
          y: Math.max(0, Math.min(100 - el.h, d.origY + dy)),
        };
      }
      // resize
      const handle = d.handle!;
      let x = d.origX, y = d.origY, w = d.origW, elH = d.origH;
      if (handle.includes("e")) w    = Math.max(5, d.origW + dx);
      if (handle.includes("s")) elH  = Math.max(5, d.origH + dy);
      if (handle.includes("w")) { x  = d.origX + dx;  w   = Math.max(5, d.origW - dx); }
      if (handle.includes("n")) { y  = d.origY + dy;  elH = Math.max(5, d.origH - dy); }
      return { ...el, x, y, w, h: elH };
    }));
  };

  const onContainerMouseUp = () => { dragRef.current = null; };

  const onElMouseDown = (e: React.MouseEvent, el: CanvasEl, handle?: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (activeTool !== "select" || el.editing) return;
    setSelectedId(el.id);
    const container = containerRef.current;
    if (!container) return;
    const { px, py } = clientToContainerPct(e.clientX, e.clientY, container);
    dragRef.current = {
      type:    handle ? "resize" : "move",
      id:      el.id, handle,
      startPx: px,   startPy: py,
      origX:   el.x, origY:   el.y,
      origW:   el.w, origH:   el.h,
    };
  };

  const onTextDblClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setElements(p => p.map(el => el.id === id ? { ...el, editing: true } : el));
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    if (!prompt.trim() || phase === "processing") return;
    setPhase("processing");
    setTimeout(() => {
      setResultUrl(canvasRef.current?.toDataURL("image/png") ?? "");
      setPhase("result");
    }, 4000);
  };

  const valid = !!prompt.trim();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-16 md:pt-20">

        {/* ── RIGHT SIDEBAR ──────────────────────────────────────────────── */}
        <aside className="w-[280px] shrink-0 border-l border-white/5 bg-black/50 backdrop-blur-3xl flex flex-col z-10">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 hide-scroll">

            {/* Prompt */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                صف الحركة
                <span className="text-red-500 mr-1.5">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="صف الحركة... مثال: الشخصية تمشي ببطء، الضوء يتغير..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-white/25 transition-colors leading-relaxed"
                style={{ direction: "rtl" }}
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">النموذج</label>
              <div className="grid grid-cols-1 gap-1.5">
                {VIDEO_MODELS.map(m => (
                  <button key={m.value} onClick={() => setModel(m.value)}
                    className={cn("w-full px-3 py-2 rounded-xl text-sm font-medium text-right transition-all",
                      model === m.value ? "text-white" : "bg-white/4 text-gray-500 hover:text-gray-300")}
                    style={model === m.value
                      ? { backgroundColor:`rgba(${rgb},0.15)`, border:`1px solid rgba(${rgb},0.3)`, color:`rgb(${rgb})` }
                      : { border:"1px solid transparent" }}
                  >{m.label}</button>
                ))}
              </div>
            </div>

            {/* Aspect ratio */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">نسبة الأبعاد</label>
              <div className="grid grid-cols-1 gap-1.5">
                {ASPECTS.map(a => (
                  <button key={a.key}
                    onClick={() => { historyRef.current=[]; futureRef.current=[]; setCanUndo(false); setCanRedo(false); setAspect(a.key); }}
                    className={cn("w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all",
                      aspect === a.key ? "text-white" : "bg-white/4 text-gray-500 hover:text-gray-300")}
                    style={aspect === a.key
                      ? { backgroundColor:`rgba(${rgb},0.15)`, border:`1px solid rgba(${rgb},0.3)`, color:`rgb(${rgb})` }
                      : { border:"1px solid transparent" }}
                  >
                    <span className="font-medium">{a.label} · {a.key}</span>
                    <div className="flex items-center justify-center w-8 h-8">
                      <div className="border rounded-sm opacity-60"
                        style={{
                          borderColor: aspect===a.key ? `rgb(${rgb})` : "#6b7280",
                          width:  Math.round(20*Math.min(1,a.w/a.h)),
                          height: Math.round(20*Math.min(1,a.h/a.w)),
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">مدة الفيديو</label>
              <div className="flex gap-1.5">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={cn("flex-1 h-9 rounded-xl text-sm font-bold transition-all",
                      duration===d ? "text-white" : "bg-white/5 text-gray-500 hover:text-gray-300")}
                    style={duration===d ? { backgroundColor:`rgba(${rgb},0.2)`, border:`1px solid rgba(${rgb},0.4)`, color:`rgb(${rgb})` } : {}}
                  >{d}s</button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">الجودة</label>
              <div className="flex gap-1.5">
                {RESOLUTIONS.map(r => (
                  <button key={r} onClick={() => setResolution(r)}
                    className={cn("flex-1 h-9 rounded-xl text-sm font-bold transition-all",
                      resolution===r ? "text-white" : "bg-white/5 text-gray-500 hover:text-gray-300")}
                    style={resolution===r ? { backgroundColor:`rgba(${rgb},0.2)`, border:`1px solid rgba(${rgb},0.4)`, color:`rgb(${rgb})` } : {}}
                  >{r}</button>
                ))}
              </div>
            </div>

          </div>

          {/* Generate */}
          <div className="shrink-0 p-5 border-t border-white/5 bg-black/60 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>التكلفة</span>
              <span className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-full"
                style={{ color:`rgb(${rgb})`, backgroundColor:`rgba(${rgb},0.1)` }}>
                <Zap className="w-3 h-3" /> {tool.credits} كريديت
              </span>
            </div>
            <button onClick={handleGenerate} disabled={!valid || phase==="processing"}
              className={cn("w-full rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300",
                valid && phase!=="processing" ? "text-white hover:scale-[1.02] hover:brightness-110 cursor-pointer" : "bg-white/5 text-gray-600 cursor-not-allowed")}
              style={{ height:"52px", ...(valid && phase!=="processing" ? {
                backgroundColor:`rgba(${rgb},0.2)`, border:`1px solid rgba(${rgb},0.45)`, boxShadow:`0 0 25px rgba(${rgb},0.2)`,
              } : {}) }}
            >
              {phase==="processing"
                ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري التحويل...</>
                : <><Video className="w-5 h-5" /> حوّل إلى فيديو</>}
            </button>
          </div>
        </aside>

        {/* ── CANVAS AREA ────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#020204]">

          {/* Top bar */}
          <div className="h-14 shrink-0 flex items-center gap-3 px-5 border-b border-white/5 bg-black/20 backdrop-blur-sm">
            <button onClick={() => router.back()}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10"
              style={{ backgroundColor:`rgba(${rgb},0.12)` }}>
              <tool.icon className={cn("w-4 h-4", config.colorClass)} />
            </div>
            <span className="text-white font-bold text-sm">{tool.title}</span>
            <span className="mr-auto text-xs text-gray-600 hidden md:block">
              {activeTool==="select" ? "↖ سحب للتحريك · زوايا للتكبير · دبل-كليك للتعديل"
               : activeTool==="brush" ? "فرشاة — ارسم بحرية"
               : activeTool==="eraser" ? "ممحاة"
               : "تعبئة — انقر لتعبئة المنطقة"}
            </span>
          </div>

          {/* ── TOOLBAR
               FIX: NO overflow-x-auto (clips popup), ADD relative z-20 (popup above canvas) ── */}
          <div className="shrink-0 h-14 flex items-center justify-between gap-2 px-4 border-b border-white/5 bg-black/30 relative z-20">

            {/* LEFT tools */}
            <div className="flex items-center gap-1.5 min-w-0">

              {/* Select */}
              <button onClick={() => setActiveTool("select")} title="تحديد ونقل"
                className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  activeTool==="select" ? "bg-white/15 text-white" : "text-gray-500 hover:text-white hover:bg-white/8")}>
                <MousePointer2 className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-white/10 mx-0.5" />

              {/* Draw tools */}
              <div className="flex items-center gap-0.5 bg-white/6 rounded-xl p-1">
                {([
                  { id:"brush"  as ActiveTool, Icon:Paintbrush,  title:"فرشاة"  },
                  { id:"eraser" as ActiveTool, Icon:Eraser,       title:"ممحاة"  },
                  { id:"fill"   as ActiveTool, Icon:PaintBucket,  title:"تعبئة"  },
                ] as const).map(({ id, Icon, title }) => (
                  <button key={id} onClick={() => setActiveTool(id)} title={title}
                    className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                      activeTool===id ? "bg-white/15 text-white" : "text-gray-500 hover:text-white")}>
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>

              <div className="w-px h-5 bg-white/10 mx-0.5" />

              {/* ── Color picker
                   FIX: data-color-picker attribute, z-[9999] on popup ── */}
              <div className="relative" data-color-picker>
                <button
                  onClick={() => setColorPickerOpen(o => !o)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/6 hover:bg-white/10 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 shadow-sm"
                    style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-400 font-mono">{color}</span>
                </button>

                <AnimatePresence>
                  {colorPickerOpen && (
                    <motion.div
                      data-color-picker
                      initial={{ opacity:0, y:6, scale:0.97 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      exit={{ opacity:0, y:6, scale:0.97 }}
                      transition={{ duration:0.15 }}
                      className="absolute top-full mt-2 left-0 p-3 rounded-2xl border border-white/10 shadow-2xl"
                      style={{ backgroundColor:"#0d0d12", zIndex:9999 }}
                    >
                      <div className="grid grid-cols-5 gap-1.5 mb-2">
                        {PALETTE.map(c => (
                          <button key={c}
                            onClick={() => { setColor(c); setActiveTool("brush"); setColorPickerOpen(false); }}
                            className="w-7 h-7 rounded-lg border transition-transform hover:scale-110"
                            style={{
                              backgroundColor: c,
                              borderColor: color===c ? "white" : "rgba(255,255,255,0.1)",
                              boxShadow: color===c ? `0 0 0 2px ${c}` : "none",
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 border-t border-white/8 pt-2">
                        <div className="w-6 h-6 rounded-lg border border-white/20 shrink-0"
                          style={{ backgroundColor:color }} />
                        <input type="color" value={color}
                          onChange={e => setColor(e.target.value)}
                          className="w-full h-7 rounded-lg cursor-pointer bg-transparent border border-white/10 px-1"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-px h-5 bg-white/10 mx-0.5" />

              {/* Brush size */}
              <div className="flex items-center gap-1 bg-white/6 rounded-xl px-2 py-1.5">
                <button onClick={() => setBrushSize(s => Math.max(1,s-2))}
                  className="text-gray-400 hover:text-white transition-colors">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-white text-xs font-mono w-5 text-center">{brushSize}</span>
                <button onClick={() => setBrushSize(s => Math.min(80,s+2))}
                  className="text-gray-400 hover:text-white transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-px h-5 bg-white/10 mx-0.5" />

              {/* Add text */}
              <button onClick={addText} title="إضافة نص"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/6 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs font-semibold">
                <Type className="w-3.5 h-3.5" />
                <span>نص</span>
              </button>

              {/* Add image */}
              <button onClick={() => imgInputRef.current?.click()} title="إضافة صورة"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/6 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs font-semibold">
                <ImagePlus className="w-3.5 h-3.5" />
                <span>صورة</span>
              </button>
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f=e.target.files?.[0]; if(f) addImage(f); e.target.value=""; }} />

              {/* Contextual text controls */}
              {(() => {
                const sel = elements.find(el => el.id===selectedId && el.kind==="text");
                if (!sel) return null;
                return (
                  <>
                    <div className="w-px h-5 bg-white/10 mx-0.5" />
                    <div className="flex items-center gap-1 bg-white/6 rounded-xl px-2 py-1">
                      <button onClick={() => setElements(p=>p.map(el=>el.id===selectedId?{...el,fontSize:Math.max(10,(el.fontSize??32)-2)}:el))}
                        className="text-gray-400 hover:text-white"><Minus className="w-3 h-3" /></button>
                      <span className="text-white text-xs font-mono w-5 text-center">{sel.fontSize??32}</span>
                      <button onClick={() => setElements(p=>p.map(el=>el.id===selectedId?{...el,fontSize:Math.min(120,(el.fontSize??32)+2)}:el))}
                        className="text-gray-400 hover:text-white"><Plus className="w-3 h-3" /></button>
                    </div>
                    <button
                      onClick={() => setElements(p=>p.map(el=>el.id===selectedId?{...el,bold:!el.bold}:el))}
                      className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-all",
                        sel.bold ? "bg-white/15 text-white" : "text-gray-500 hover:text-white bg-white/6")}
                    >B</button>
                  </>
                );
              })()}
            </div>

            {/* RIGHT — history */}
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={undo} disabled={!canUndo} title="تراجع"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                <Undo2 className="w-4 h-4" />
              </button>
              <button onClick={redo} disabled={!canRedo} title="إعادة"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                <Redo2 className="w-4 h-4" />
              </button>

              {selectedId && (
                <>
                  <div className="w-px h-5 bg-white/10 mx-0.5" />
                  <button
                    onClick={() => { setElements(p=>p.filter(el=>el.id!==selectedId)); setSelectedId(null); }}
                    title="حذف العنصر"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-white/8 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}

              <div className="w-px h-5 bg-white/10 mx-0.5" />
              <button onClick={clearCanvas} title="مسح الرسم"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-white/8 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas area */}
          <div className="flex-1 flex items-center justify-center overflow-hidden p-4 bg-[#060608]">
            <AnimatePresence mode="wait">

              {/* ── Result ── */}
              {phase==="result" && resultUrl && (
                <motion.div key="result"
                  initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                  transition={{ duration:0.4, ease:[0.16,1,0.3,1] }}
                  className="flex flex-col items-center gap-4 w-full max-w-2xl"
                >
                  <div className="rounded-3xl overflow-hidden border border-white/10 w-full"
                    style={{ boxShadow:`0 0 50px rgba(${rgb},0.15)` }}>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 bg-black/30">
                      <span className="text-sm font-bold px-3 py-1 rounded-full"
                        style={{ color:`rgb(${rgb})`, backgroundColor:`rgba(${rgb},0.1)` }}>
                        ✨ تم التحويل بنجاح
                      </span>
                      <span className="text-xs text-gray-600">
                        {prompt.slice(0,40)}{prompt.length>40?"...":""}
                      </span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resultUrl} alt="نتيجة" className="w-full object-contain bg-black/50"
                      style={{ maxHeight:"60vh" }} />
                  </div>
                  <div className="flex gap-3 w-full">
                    <a href={resultUrl} download="sketch-video-frame.png"
                      className="flex-1 h-12 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-xl">
                      <Download className="w-4 h-4" /> تحميل
                    </a>
                    <button onClick={() => setPhase("draw")}
                      className="h-12 px-5 rounded-2xl border border-white/10 text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-white/5 hover:text-white transition-colors">
                      <RefreshCw className="w-4 h-4" /> رسم جديد
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Drawing canvas ── */}
              {phase!=="result" && (
                <motion.div
                  key="canvas"
                  ref={containerRef}
                  data-canvas-container
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="relative rounded-lg shadow-2xl"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "calc(100vh - 200px)",
                    aspectRatio: `${currentAspect.w} / ${currentAspect.h}`,
                    boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 25px 60px rgba(0,0,0,0.5)`,
                    /* FIX: white background so canvas looks correct before paint */
                    backgroundColor: BG,
                  }}
                  onMouseMove={onContainerMouseMove}
                  onMouseUp={onContainerMouseUp}
                  onMouseLeave={onContainerMouseUp}
                >
                  {/* ── Freehand canvas (normal flow — gives the container its size) ── */}
                  <canvas
                    ref={canvasRef}
                    className="block w-full h-full rounded-lg"
                    style={{
                      cursor: isDrawMode ? "none" : "default",
                      touchAction: "none",
                      imageRendering: "pixelated",
                      backgroundColor: BG,
                    }}
                    onMouseDown={onCanvasMouseDown}
                    onMouseMove={onCanvasMouseMove}
                    onMouseUp={stopDraw}
                    onMouseLeave={() => { stopDraw(); setCursorPos(null); }}
                    onTouchStart={onCanvasTouchStart}
                    onTouchMove={onCanvasTouchMove}
                    onTouchEnd={stopDraw}
                  />

                  {/* ── Elements overlay (z:1)
                       FIX: pointer-events only auto in select mode
                       FIX: no overflow:hidden here — that was clipping elements ── */}
                  <div
                    className="absolute inset-0"
                    style={{
                      zIndex: 1,
                      pointerEvents: activeTool === "select" ? "auto" : "none",
                    }}
                    onMouseDown={e => {
                      // Deselect when clicking empty canvas in select mode
                      if (e.target === e.currentTarget) setSelectedId(null);
                    }}
                  >
                    {elements.map(el => {
                      const isSelected = selectedId === el.id;
                      return (
                        <div
                          key={el.id}
                          className="absolute"
                          style={{
                            left:   `${el.x}%`,
                            top:    `${el.y}%`,
                            width:  `${el.w}%`,
                            height: `${el.h}%`,
                            cursor: el.editing ? "text" : (activeTool==="select" ? "move" : "default"),
                            userSelect: "none",
                            /* FIX: outline for selection, not affected by children */
                            outline:       isSelected ? "2px solid rgba(96,165,250,0.9)" : "none",
                            outlineOffset: "2px",
                          }}
                          onMouseDown={e => onElMouseDown(e, el)}
                          onClick={e => e.stopPropagation()}  /* FIX: prevent deselect click bubbling */
                          onDoubleClick={el.kind==="text" ? e => onTextDblClick(e, el.id) : undefined}
                        >
                          {/* ── Image element ── */}
                          {el.kind === "image" && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={el.src} alt=""
                              className="w-full h-full"
                              style={{ objectFit:"contain", display:"block" }}
                              draggable={false}
                            />
                          )}

                          {/* ── Text element ── */}
                          {el.kind === "text" && (
                            el.editing ? (
                              <textarea
                                autoFocus
                                defaultValue={el.text}
                                className="w-full h-full bg-transparent border-none outline-none resize-none text-center"
                                style={{
                                  fontSize:   `${el.fontSize ?? 32}px`,
                                  color:      el.color ?? "#111",
                                  fontWeight: el.bold ? "bold" : "normal",
                                  direction:  "rtl",
                                  lineHeight: "1.3",
                                  padding:    "2px",
                                }}
                                onBlur={e => {
                                  setElements(p => p.map(x =>
                                    x.id===el.id ? { ...x, text:e.target.value, editing:false } : x
                                  ));
                                }}
                                onMouseDown={e2 => e2.stopPropagation()}
                                onClick={e2 => e2.stopPropagation()}
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center overflow-hidden"
                                style={{
                                  fontSize:   `${el.fontSize ?? 32}px`,
                                  color:      el.color ?? "#111",
                                  fontWeight: el.bold ? "bold" : "normal",
                                  direction:  "rtl",
                                  lineHeight: "1.3",
                                  whiteSpace: "pre-wrap",
                                  wordBreak:  "break-word",
                                  textAlign:  "center",
                                }}
                              >
                                {el.text}
                              </div>
                            )
                          )}

                          {/* ── Resize handles (selected, not editing) ── */}
                          {isSelected && !el.editing && (
                            <>
                              {/* Corner handles */}
                              {(["nw","ne","sw","se"] as const).map(handle => (
                                <div key={handle}
                                  className="absolute w-3 h-3 bg-white rounded-full border-2 border-blue-400 shadow-lg"
                                  style={{
                                    top:    handle.includes("n") ? -6   : undefined,
                                    bottom: handle.includes("s") ? -6   : undefined,
                                    left:   handle.includes("w") ? -6   : undefined,
                                    right:  handle.includes("e") ? -6   : undefined,
                                    cursor: `${handle}-resize`,
                                    zIndex: 10,
                                  }}
                                  onMouseDown={e => { e.stopPropagation(); onElMouseDown(e, el, handle); }}
                                />
                              ))}
                              {/* Edge handles */}
                              {(["n","s","e","w"] as const).map(handle => (
                                <div key={handle}
                                  className="absolute w-2.5 h-2.5 bg-white border border-blue-400 shadow"
                                  style={{
                                    top:    handle==="n" ? -5 : handle==="s" ? undefined : "calc(50% - 5px)",
                                    bottom: handle==="s" ? -5 : undefined,
                                    left:   handle==="w" ? -5 : handle==="e" ? undefined : "calc(50% - 5px)",
                                    right:  handle==="e" ? -5 : undefined,
                                    cursor: (handle==="n"||handle==="s") ? "ns-resize" : "ew-resize",
                                    zIndex: 9,
                                    borderRadius: "3px",
                                  }}
                                  onMouseDown={e => { e.stopPropagation(); onElMouseDown(e, el, handle); }}
                                />
                              ))}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Custom draw cursor
                       FIX: use box-shadow outline instead of mix-blend-difference
                            (mix-blend-difference makes black cursor invisible on white canvas) ── */}
                  {cursorPos && isDrawMode && phase === "draw" && (
                    <div
                      className="absolute pointer-events-none rounded-full"
                      style={{
                        width:  activeTool==="fill" ? 20 : brushSize,
                        height: activeTool==="fill" ? 20 : brushSize,
                        left:   cursorPos.x - (activeTool==="fill" ? 10 : brushSize/2),
                        top:    cursorPos.y - (activeTool==="fill" ? 10 : brushSize/2),
                        border:     `2px solid ${activeTool==="eraser" ? "#888" : color}`,
                        boxShadow:  "0 0 0 1px rgba(0,0,0,0.6)",
                        backgroundColor: activeTool==="fill" ? `${color}30` : "transparent",
                        zIndex: 20,
                      }}
                    />
                  )}

                  {/* ── Processing overlay ── */}
                  {phase==="processing" && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-5 backdrop-blur-sm"
                      style={{ zIndex:30 }}>
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderTopColor:`rgb(${rgb})`, borderRightColor:`rgba(${rgb},0.3)` }} />
                        <div className="absolute inset-2 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderBottomColor:`rgb(${rgb})`, animationDirection:"reverse", animationDuration:"1.8s", opacity:0.5 }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className={cn("w-6 h-6 animate-pulse", config.colorClass)} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg mb-1">جاري توليد الفيديو...</p>
                        <p className="text-gray-400 text-sm">الذكاء الاصطناعي يحوّل رسمك إلى فيديو</p>
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
