"use client";

// ════════════════════════════════════════════════════════════════
// Edit Canvas — unified image-edit workspace at /edit
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's `/edit` page: one image, a sidebar
// of operations, and the result replacing the working image after each
// edit. Operations are routed to the same MuAPI endpoints we already
// expose as standalone tools, so the heavy lifting is reusing existing
// pipes, not building new ones.
//
// MVP operations (no brush canvas yet — that comes as a polish pass):
//   • Style edit  → flux-kontext-pro-i2i (free-form prompt → applied
//                    edit). Stand-in for "paint/inpaint" until brush is in.
//   • Background remove → ai-background-remover
//   • Outpaint    → ai-image-extension / ideogram-v3-reframe
//   • Relight     → flux-kontext + structured lighting hints
//   • Skin retouch→ ai-skin-enhancer
//   • Upscale     → topaz-image-upscale (post-edit polish)

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit3, Layers, Frame, Zap, Sparkles, ImageUp, Loader2, X,
  Maximize2, Download, Undo2, Redo2, Wand2,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/muapi";
import { runMuapiTool } from "@/lib/run-tool";

const PERSIST_KEY = "yilow_edit_canvas_v1";

// ── Operation definitions ──────────────────────────────────────────

type OpId = "style" | "bg-remove" | "outpaint" | "relight" | "skin" | "upscale";

interface Operation {
  id:         OpId;
  name:       string;            // Arabic label
  englishName:string;
  icon:       typeof Edit3;
  desc:       string;
  /** When true, the operation requires a free-text prompt. */
  needsPrompt: boolean;
  /** When true, the operation has structured params (e.g. ratio for
   *  outpaint). The UI renders these inline. */
  needsRatio?: boolean;
  /** Operation cost (matches the equivalent standalone tool). */
  cost: number;
}

const OPERATIONS: Operation[] = [
  { id: "style",     name: "تعديل بأسلوب",  englishName: "Style Edit",     icon: Wand2,    desc: "اوصف التعديل بـكلمات",          needsPrompt: true,  cost: 4 },
  { id: "bg-remove", name: "إزالة الخلفية",  englishName: "Background",     icon: Layers,   desc: "احذف الخلفية بضغطة",            needsPrompt: false, cost: 2 },
  { id: "outpaint",  name: "تمديد الصورة",   englishName: "Outpaint",       icon: Frame,    desc: "وسّع الإطار بـAI",              needsPrompt: false, needsRatio: true, cost: 5 },
  { id: "relight",   name: "إعادة الإضاءة",  englishName: "Relight",        icon: Zap,      desc: "غيّر الإضاءة + المزاج",         needsPrompt: true,  cost: 4 },
  { id: "skin",      name: "تنعيم البشرة",    englishName: "Skin Enhancer", icon: Sparkles, desc: "نعّم وحسّن البشرة",             needsPrompt: false, cost: 2 },
  { id: "upscale",   name: "Upscale",          englishName: "Upscale",       icon: ImageUp,  desc: "رفع الدقة 2× بـTopaz",          needsPrompt: false, cost: 3 },
];

const OUTPAINT_RATIOS = [
  { id: "16:9", label: "16:9 — أفقي" },
  { id: "9:16", label: "9:16 — عمودي" },
  { id: "1:1",  label: "1:1 — مربع" },
  { id: "21:9", label: "21:9 — ألترا" },
  { id: "4:5",  label: "4:5 — IG" },
  { id: "3:2",  label: "3:2" },
];

interface EditStep {
  id:        string;
  url:       string;
  opId:      OpId;
  prompt?:   string;
  timestamp: number;
}

export function EditCanvas() {
  // ── state ─────────────────────────────────────────────────────────
  const [steps,        setSteps]        = useState<EditStep[]>([]);
  const [stepIndex,    setStepIndex]    = useState<number>(-1);          // -1 = no image yet
  const [activeOp,     setActiveOp]     = useState<OpId>("style");
  const [prompt,       setPrompt]       = useState<string>("");
  const [outpaintRatio,setOutpaintRatio]= useState<string>("16:9");
  const [uploading,    setUploading]    = useState(false);
  const [uploadPct,    setUploadPct]    = useState(0);
  const [running,      setRunning]      = useState(false);
  const [progress,     setProgress]     = useState("");
  const [fullscreen,   setFullscreen]   = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const currentUrl = stepIndex >= 0 ? steps[stepIndex]?.url : null;
  const opMeta = OPERATIONS.find((o) => o.id === activeOp)!;
  const canUndo = stepIndex > 0;
  const canRedo = stepIndex >= 0 && stepIndex < steps.length - 1;

  // ── persistence ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PERSIST_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<{
        steps: EditStep[]; stepIndex: number; activeOp: OpId;
      }>;
      if (Array.isArray(parsed.steps)) setSteps(parsed.steps);
      if (typeof parsed.stepIndex === "number") setStepIndex(parsed.stepIndex);
      if (parsed.activeOp) setActiveOp(parsed.activeOp);
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify({ steps, stepIndex, activeOp }));
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [steps, stepIndex, activeOp]);

  // ── handlers ──────────────────────────────────────────────────────
  const onPickFile = async (file: File) => {
    setUploading(true); setUploadPct(0);
    try {
      const { url } = await uploadFile(file, (p) => setUploadPct(p));
      // Replace history with the new starting image
      const root: EditStep = { id: crypto.randomUUID(), url, opId: "style", timestamp: Date.now() };
      setSteps([root]);
      setStepIndex(0);
      toast.success("تم رفع الصورة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الرفع");
    } finally {
      setUploading(false); setUploadPct(0);
    }
  };

  const pushStep = (url: string, opId: OpId, p?: string) => {
    setSteps((prev) => {
      // Drop any redo-able future steps when committing a new edit.
      const truncated = prev.slice(0, stepIndex + 1);
      const next: EditStep = { id: crypto.randomUUID(), url, opId, prompt: p, timestamp: Date.now() };
      return [...truncated, next];
    });
    setStepIndex((i) => i + 1);
  };

  const onUndo = () => { if (canUndo) setStepIndex((i) => i - 1); };
  const onRedo = () => { if (canRedo) setStepIndex((i) => i + 1); };

  const onApply = async () => {
    if (!currentUrl || running) return;
    if (opMeta.needsPrompt && !prompt.trim()) {
      toast.error("اكتب وصف التعديل");
      return;
    }
    setRunning(true);
    setProgress("جاري التعديل…");
    try {
      const { url } = await runOperation({
        opId:       activeOp,
        imageUrl:   currentUrl,
        prompt:     prompt.trim(),
        ratio:      outpaintRatio,
        onStatus:   (s) => setProgress(s),
      });
      pushStep(url, activeOp, prompt.trim() || undefined);
      setPrompt("");
      toast.success("تم التعديل ✨");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل التعديل");
    } finally {
      setRunning(false);
      setProgress("");
    }
  };

  // ── render ────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-[calc(100vh-80px)] pb-44">
      {/* Hero */}
      <div className="relative pt-10 md:pt-14 pb-6 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-400/30 bg-accent-400/5 text-accent-400 text-xs font-black mb-5">
          <Edit3 className="w-3 h-3" />
          Edit Canvas
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-[1.4] max-w-3xl mx-auto">
          صورة واحدة، <span className="text-accent-400">كل أدوات التحرير</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          ارفع صورة، اختار العملية من السايدبار، طبّقها — كل خطوة تتحفظ كـlayer مع Undo/Redo.
        </p>
      </div>

      {/* Main canvas + sidebar */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Canvas */}
        <div className="bento-card rounded-3xl border border-white/10 p-4 min-h-[480px] flex items-center justify-center relative">
          {currentUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentUrl} alt="" className="max-w-full max-h-[60vh] object-contain rounded-2xl" />
              <div className="absolute top-3 right-3 flex gap-1.5">
                <button
                  onClick={() => setFullscreen(currentUrl)}
                  type="button"
                  aria-label="ملء الشاشة"
                  className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
                <a
                  href={currentUrl} download target="_blank" rel="noopener noreferrer"
                  aria-label="تنزيل"
                  className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <Download className="w-4 h-4 text-white" />
                </a>
                <button
                  onClick={() => fileRef.current?.click()}
                  type="button"
                  aria-label="ابدأ من جديد"
                  title="ابدأ من جديد بصورة أخرى"
                  className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <ImageUp className="w-4 h-4 text-white" />
                </button>
              </div>
              {/* Undo/Redo */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  type="button"
                  aria-label="تراجع"
                  title="تراجع"
                  className={cn(
                    "w-9 h-9 rounded-xl backdrop-blur border flex items-center justify-center transition-colors",
                    canUndo ? "bg-black/60 border-white/15 text-white hover:bg-black/80" : "bg-black/30 border-white/5 text-gray-600 cursor-not-allowed",
                  )}
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  type="button"
                  aria-label="إعادة"
                  title="إعادة"
                  className={cn(
                    "w-9 h-9 rounded-xl backdrop-blur border flex items-center justify-center transition-colors",
                    canRedo ? "bg-black/60 border-white/15 text-white hover:bg-black/80" : "bg-black/30 border-white/5 text-gray-600 cursor-not-allowed",
                  )}
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full border-2 border-accent-400/30 bg-accent-400/5 flex items-center justify-center mb-5">
                <ImageUp className="w-10 h-10 text-accent-400" />
              </div>
              <p className="text-white text-base font-bold mb-1">ابدأ بصورة</p>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-5">
                ارفع صورة من جهازك للبدء — كل التعديلات هتظهر هنا layer-by-layer.
              </p>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                type="button"
                className="h-11 px-5 rounded-xl bg-accent-400 text-black font-black text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform shadow-[0_0_24px_rgba(254,228,64,0.35)]"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {uploadPct}%</>
                ) : (
                  <><ImageUp className="w-4 h-4" /> ارفع صورة</>
                )}
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = ""; }}
          />
        </div>

        {/* Sidebar — operations + params */}
        <aside className="bento-card rounded-3xl border border-white/10 p-3 space-y-2">
          <div className="text-[11px] text-gray-500 font-bold mb-1 px-1">العملية</div>
          {OPERATIONS.map((op) => {
            const Icon = op.icon;
            const active = op.id === activeOp;
            return (
              <button
                key={op.id}
                onClick={() => setActiveOp(op.id)}
                type="button"
                className={cn(
                  "w-full p-2.5 rounded-xl border text-right flex items-center gap-2.5 transition-all",
                  active
                    ? "border-accent-400 bg-accent-400/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]",
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", active ? "text-accent-400" : "text-gray-400")} />
                <div className="flex-1 min-w-0">
                  <div className={cn("text-xs font-black", active ? "text-accent-400" : "text-white")}>
                    {op.name}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">{op.desc}</div>
                </div>
                <span className="text-[10px] text-gray-500 shrink-0">{op.cost}</span>
              </button>
            );
          })}

          {/* Per-op params */}
          {opMeta.needsPrompt && (
            <div className="pt-3 border-t border-white/[0.04]">
              <label className="block text-[11px] font-bold text-gray-400 mb-1.5">
                {activeOp === "relight" ? "اوصف الإضاءة الجديدة" : "اوصف التعديل"}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  activeOp === "relight"
                    ? "مثال: ضوء غروب دافئ من اليمين، rim light خلفي"
                    : "مثال: غيّر الخلفية لقهوة باريسية، احتفظ بالشخص"
                }
                rows={3}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-2 text-[12px] text-white placeholder-gray-600 resize-none focus:outline-none focus:border-accent-400/40 text-right"
                dir="rtl"
              />
            </div>
          )}

          {opMeta.needsRatio && (
            <div className="pt-3 border-t border-white/[0.04]">
              <label className="block text-[11px] font-bold text-gray-400 mb-1.5">النسبة الجديدة</label>
              <div className="grid grid-cols-3 gap-1">
                {OUTPAINT_RATIOS.map((r) => {
                  const picked = r.id === outpaintRatio;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setOutpaintRatio(r.id)}
                      type="button"
                      className={cn(
                        "h-8 rounded-lg text-[10px] font-bold transition-colors border",
                        picked
                          ? "bg-accent-400 text-black border-accent-400"
                          : "bg-white/[0.03] text-gray-300 border-white/10 hover:bg-white/[0.06]",
                      )}
                    >
                      {r.id}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Apply */}
          <div className="pt-3">
            <button
              onClick={onApply}
              disabled={!currentUrl || running || (opMeta.needsPrompt && !prompt.trim())}
              type="button"
              className={cn(
                "w-full h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all",
                !currentUrl || running || (opMeta.needsPrompt && !prompt.trim())
                  ? "bg-white/5 text-gray-600 cursor-not-allowed"
                  : "bg-accent-400 text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(254,228,64,0.3)]",
              )}
            >
              {running ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {progress || "جاري…"}</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  طبّق
                  <span className="text-[10px] opacity-75 px-1.5 py-0.5 rounded bg-black/20">{opMeta.cost}</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* Steps timeline (history of layers) */}
      {steps.length > 1 && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="text-[11px] text-gray-500 font-bold mb-2">الـlayers ({steps.length})</div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {steps.map((s, i) => {
              const meta = OPERATIONS.find((o) => o.id === s.opId);
              const isActive = i === stepIndex;
              return (
                <button
                  key={s.id}
                  onClick={() => setStepIndex(i)}
                  type="button"
                  className={cn(
                    "shrink-0 w-20 rounded-xl overflow-hidden border transition-all",
                    isActive ? "border-accent-400 ring-1 ring-accent-400/40" : "border-white/10 hover:border-white/30 opacity-70",
                  )}
                  title={`${i === 0 ? "الأصلية" : meta?.name ?? s.opId}`}
                >
                  <div className="aspect-square bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="px-1.5 py-1 text-[9px] font-bold text-white truncate">
                    {i === 0 ? "الأصلية" : meta?.name ?? s.opId}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fullscreen */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setFullscreen(null)}
          >
            <button
              onClick={() => setFullscreen(null)}
              type="button"
              aria-label="إغلاق"
              className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fullscreen} alt="" className="max-w-full max-h-full object-contain rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Operation router ──────────────────────────────────────────────
// Maps each Edit Canvas operation to the appropriate MuAPI endpoint
// + payload shape. Reuses the same `runMuapiTool` helper that powers
// every other tool in the app, so credit accounting + history work
// the same way.

async function runOperation(opts: {
  opId:     OpId;
  imageUrl: string;
  prompt?:  string;
  ratio?:   string;
  onStatus: (s: string) => void;
}): Promise<{ url: string }> {
  const { opId, imageUrl, prompt, ratio, onStatus } = opts;

  // Build endpoint + payload per op. We reuse the SAME MuAPI calls our
  // standalone tools use — single source of truth.
  const cfg: { endpoint: string; payload: Record<string, unknown>; toolId: string } = (() => {
    switch (opId) {
      case "style":
        return {
          toolId:   "edit-image",
          endpoint: "flux-kontext-pro-i2i",
          payload:  { images_list: [imageUrl], prompt: prompt ?? "" },
        };
      case "bg-remove":
        return {
          toolId:   "bg-remover",
          endpoint: "ai-background-remover",
          payload:  { image_url: imageUrl },
        };
      case "outpaint":
        return {
          toolId:   "image-outpaint",
          endpoint: "ai-image-extension",
          payload:  { image_url: imageUrl, aspect_ratio: ratio ?? "16:9" },
        };
      case "relight":
        return {
          toolId:   "relighting",
          endpoint: "flux-kontext-pro-i2i",
          payload:  { images_list: [imageUrl], prompt: `Relight this scene: ${prompt ?? "natural daylight, soft shadows"}` },
        };
      case "skin":
        return {
          toolId:   "skin-retouch",
          endpoint: "ai-skin-enhancer",
          payload:  { image_url: imageUrl },
        };
      case "upscale":
        return {
          toolId:   "enhance-image",
          endpoint: "topaz-image-upscale",
          payload:  { image_url: imageUrl },
        };
    }
  })();

  onStatus("جاري المعالجة…");
  const { result } = await runMuapiTool({
    toolId:    cfg.toolId,
    endpoint:  cfg.endpoint,
    payload:   cfg.payload,
    pollOptions: {
      onStatus: (s) => onStatus(typeof s === "string" ? s : "جاري…"),
    },
  });

  // Pick the result URL — every endpoint returns either `url` or
  // `urls[0]` or `outputs[0]`. Same shape we handle elsewhere.
  const url =
    (typeof result.url === "string" && result.url) ||
    (Array.isArray(result.urls) ? result.urls[0] : undefined) ||
    (Array.isArray(result.outputs) ? (result.outputs[0] as string) : undefined);
  if (!url || typeof url !== "string") {
    throw new Error("لم نستلم نتيجة التعديل");
  }
  return { url };
}
