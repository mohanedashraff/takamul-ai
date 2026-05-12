"use client";

// ════════════════════════════════════════════════════════════════
// Product Photoshoot Studio — workspace
// ════════════════════════════════════════════════════════════════
// 10 product-photography modes, each backed by a Claude Sonnet 4.5
// system prompt that rewrites the user's short intent into a 200-word
// brief, then submits to nano-banana-pro-edit with the uploaded
// product image.

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Sparkles, Loader2, X, Upload, Maximize2, Download,
  ChevronDown, Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  PRODUCT_PHOTOSHOOT_MODES, PRODUCT_ASPECTS, PRODUCT_VARIANT_COUNTS,
  PRODUCT_PHOTOSHOOT_DEFAULTS, PRODUCT_PHOTOSHOOT_COST_PER_IMAGE,
} from "@/lib/data/product-photoshoot";
import { uploadFile } from "@/lib/muapi";

const PERSIST_KEY    = "yilow_product_photoshoot_v1";
const HISTORY_LIMIT  = 30;

interface ProductShot {
  id:         string;
  url:        string;
  modeId:     string;
  intent:     string;
  prompt:     string;        // the LLM-enhanced brief that was sent
  aspect:     string;
  productUrl: string;
  timestamp:  number;
}

export function ProductPhotoshootStudio() {
  // ── state ─────────────────────────────────────────────────────────
  const [productUrl,  setProductUrl]  = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [uploadPct,   setUploadPct]   = useState(0);
  const [intent,      setIntent]      = useState<string>("");
  const [modeId,      setModeId]      = useState<string>(PRODUCT_PHOTOSHOOT_DEFAULTS.modeId);
  const [aspect,      setAspect]      = useState<string>(PRODUCT_PHOTOSHOOT_DEFAULTS.aspect);
  const [count,       setCount]       = useState<number>(PRODUCT_PHOTOSHOOT_DEFAULTS.count);
  const [brandContext,setBrandContext]= useState<string>("");
  const [generating,  setGenerating]  = useState(false);
  const [progress,    setProgress]    = useState("");
  const [history,     setHistory]     = useState<ProductShot[]>([]);
  const [fullscreen,  setFullscreen]  = useState<string | null>(null);
  const [advancedOpen,setAdvancedOpen]= useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── persistence ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PERSIST_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<{
        productUrl: string | null; intent: string;
        modeId: string; aspect: string; count: number;
        brandContext: string; history: ProductShot[];
      }>;
      if (typeof parsed.productUrl === "string" || parsed.productUrl === null) setProductUrl(parsed.productUrl);
      if (typeof parsed.intent === "string")      setIntent(parsed.intent);
      if (typeof parsed.modeId === "string")      setModeId(parsed.modeId);
      if (typeof parsed.aspect === "string")      setAspect(parsed.aspect);
      if (typeof parsed.count === "number")       setCount(parsed.count);
      if (typeof parsed.brandContext === "string")setBrandContext(parsed.brandContext);
      if (Array.isArray(parsed.history))          setHistory(parsed.history);
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify({
          productUrl, intent, modeId, aspect, count, brandContext, history,
        }));
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [productUrl, intent, modeId, aspect, count, brandContext, history]);

  // ── derived ───────────────────────────────────────────────────────
  const mode = PRODUCT_PHOTOSHOOT_MODES.find((m) => m.id === modeId)!;
  // When the user switches modes we follow the new mode's default
  // aspect — but only once (subsequent manual changes stick).
  const onModeChange = (nextId: string) => {
    setModeId(nextId);
    const next = PRODUCT_PHOTOSHOOT_MODES.find((m) => m.id === nextId);
    if (next && aspect === mode.defaultAspect) {
      setAspect(next.defaultAspect);
    }
  };
  const cost = count * PRODUCT_PHOTOSHOOT_COST_PER_IMAGE;

  // ── handlers ──────────────────────────────────────────────────────
  const onPickFile = async (file: File) => {
    setUploading(true); setUploadPct(0);
    try {
      const { url } = await uploadFile(file, (p) => setUploadPct(p));
      setProductUrl(url);
      toast.success("تم رفع المنتج");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل رفع المنتج");
    } finally {
      setUploading(false); setUploadPct(0);
    }
  };

  const onGenerate = async () => {
    if (!productUrl) { toast.error("ارفع صورة المنتج أولاً"); return; }
    if (!intent.trim()) { toast.error("اوصف اللي عاوزه"); return; }
    if (generating) return;
    setGenerating(true);
    setProgress(`جاري التوليد… (1/${count})`);
    try {
      const r = await fetch("/api/tools/product-photoshoot/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          mode:           modeId,
          intent:         intent.trim(),
          productUrl,
          count,
          aspect,
          brand_context:  brandContext.trim() || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok || !Array.isArray(data.urls) || data.urls.length === 0) {
        throw new Error(data?.error || "فشل التوليد");
      }
      const shots: ProductShot[] = data.urls.map((url: string, i: number) => ({
        id:         crypto.randomUUID(),
        url,
        modeId,
        intent:     intent.trim(),
        prompt:     Array.isArray(data.finalPrompts) ? (data.finalPrompts[i] ?? "") : "",
        aspect,
        productUrl,
        timestamp:  Date.now() + i,
      }));
      setHistory((h) => [...shots, ...h].slice(0, HISTORY_LIMIT));
      const failed = typeof data.failedCount === "number" ? data.failedCount : 0;
      toast.success(failed > 0 ? `تم ${shots.length} صور (فشل ${failed}) 📸` : `تم ${shots.length} صور 📸`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setGenerating(false);
      setProgress("");
    }
  };

  // ── render ────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-[calc(100vh-80px)] pb-44">
      {/* Hero */}
      <div className="relative pt-10 md:pt-14 pb-6 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-400/30 bg-accent-400/5 text-accent-400 text-xs font-black mb-5">
          <Camera className="w-3 h-3" />
          Product Photoshoot Studio
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-[1.4] max-w-3xl mx-auto">
          ٠١ صورة منتج، <span className="text-accent-400">١٠ مزاج مختلف</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          ارفع المنتج، اختار الـmode، اكتب الفكرة في جملة، وClaude يكتب البريف الكامل ويبعته للـimage model.
        </p>
      </div>

      {/* Mode picker grid */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {PRODUCT_PHOTOSHOOT_MODES.map((m) => {
            const active = m.id === modeId;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                type="button"
                className={cn(
                  "relative p-3 rounded-2xl border text-right transition-all",
                  active
                    ? "border-accent-400 bg-accent-400/10 shadow-[0_0_18px_rgba(254,228,64,0.25)]"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20",
                )}
              >
                <Icon className={cn("w-4 h-4 mb-2", active ? "text-accent-400" : "text-gray-400")} />
                <div className={cn("text-xs font-black mb-0.5", active ? "text-accent-400" : "text-white")}>
                  {m.name}
                </div>
                <div className="text-[10px] text-gray-500 leading-snug">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generation history */}
      {history.length > 0 ? (
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {history.map((shot) => (
            <motion.div
              key={shot.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative bento-card rounded-2xl overflow-hidden border border-white/10 group"
            >
              <div className="relative aspect-square bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setFullscreen(shot.url)}
                    type="button"
                    aria-label="ملء الشاشة"
                    className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <Maximize2 className="w-3 h-3 text-white" />
                  </button>
                  <a
                    href={shot.url} download target="_blank" rel="noopener noreferrer"
                    aria-label="تنزيل"
                    className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <Download className="w-3 h-3 text-white" />
                  </a>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-accent-400/90 text-black">
                    {PRODUCT_PHOTOSHOOT_MODES.find((m) => m.id === shot.modeId)?.englishName}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-4">
          <p className="text-gray-500 text-xs">صورتك الأولى تنتظرك — ارفع منتجك، اوصف اللي عاوزه، واضغط <span className="text-accent-400 font-bold">إنشاء</span></p>
        </div>
      )}

      {/* Bottom shoot bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-5 pointer-events-none" dir="rtl">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bento-card rounded-3xl border border-white/10 p-3 backdrop-blur-2xl bg-black/60 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] flex flex-col gap-3">
            {/* Upload + intent row */}
            <div className="flex items-start gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = ""; }}
              />
              {productUrl ? (
                <div className="relative w-12 h-12 rounded-xl border border-accent-400/40 overflow-hidden group shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={productUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setProductUrl(null)}
                    type="button"
                    aria-label="إزالة"
                    className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  type="button"
                  aria-label="ارفع المنتج"
                  className="w-12 h-12 shrink-0 rounded-xl border border-accent-400/40 bg-accent-400/8 hover:bg-accent-400/15 flex flex-col items-center justify-center transition-colors"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-accent-400" />
                      <span className="text-[8px] text-accent-400 mt-0.5">{uploadPct}%</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-accent-400" />
                      <span className="text-[8px] text-accent-400 mt-0.5 font-bold">منتج</span>
                    </>
                  )}
                </button>
              )}
              <textarea
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="اوصف الفكرة بجملة قصيرة. مثال: زجاجة كولد بريو على كاونتر مطبخ مشمس، IG feed"
                rows={2}
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none px-1 text-right"
                style={{ maxHeight: 120 }}
                dir="rtl"
              />
            </div>

            {/* Chips row */}
            <div className="flex items-center gap-2 flex-wrap">
              <SelectChip
                label="نسبة"
                value={aspect}
                options={PRODUCT_ASPECTS.map((a) => ({ value: a.id, label: a.label }))}
                onChange={setAspect}
              />
              <SelectChip
                label="عدد"
                value={String(count)}
                options={PRODUCT_VARIANT_COUNTS.map((n) => ({ value: String(n), label: `${n} صورة` }))}
                onChange={(v) => setCount(Number(v))}
              />
              <button
                onClick={() => setAdvancedOpen((v) => !v)}
                type="button"
                className={cn(
                  "h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors",
                  brandContext.trim()
                    ? "border-accent-400/40 bg-accent-400/8 text-accent-400"
                    : "border-white/10 text-gray-300 hover:bg-white/[0.03]",
                )}
              >
                <Sparkles className="w-3 h-3" />
                <span>سياق العلامة</span>
              </button>
              <div className="flex-1" />
              <button
                onClick={onGenerate}
                disabled={generating || !productUrl || !intent.trim()}
                type="button"
                className={cn(
                  "h-10 px-5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all",
                  generating || !productUrl || !intent.trim()
                    ? "bg-white/5 text-gray-600 cursor-not-allowed"
                    : "bg-accent-400 text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_24px_rgba(254,228,64,0.35)]",
                )}
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {progress || "جاري…"}</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    إنشاء
                    <span className="text-[10px] opacity-75 px-1.5 py-0.5 rounded bg-black/20">{cost}</span>
                  </>
                )}
              </button>
            </div>

            {/* Advanced — brand context inline expandable */}
            {advancedOpen && (
              <div className="border-t border-white/[0.04] pt-2.5">
                <label className="block text-[11px] font-bold text-gray-400 mb-1.5">
                  سياق العلامة (اختياري) — يساعد Claude يلوّن البريف بصوت العلامة
                </label>
                <textarea
                  value={brandContext}
                  onChange={(e) => setBrandContext(e.target.value)}
                  placeholder="مثال: علامة لوكس عربية، palette ذهبي وأسود، تخاطب جيل Z السعودي، vibe quiet luxury"
                  rows={2}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-2 text-[12px] text-white placeholder-gray-600 resize-none focus:outline-none focus:border-accent-400/40 text-right"
                  style={{ maxHeight: 100 }}
                  dir="rtl"
                />
              </div>
            )}
          </div>
        </div>
      </div>

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

// ── Tiny portal-positioned select chip ────────────────────────────
function SelectChip({
  label, value, options, onChange,
}: {
  label:    string;
  value:    string;
  options:  { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        type="button"
        className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/[0.03] text-xs font-bold text-white flex items-center gap-1.5"
      >
        <span className="text-gray-500">{label}:</span>
        {active?.label ?? value}
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="absolute bottom-full mb-2 right-0 z-[90] min-w-[180px] bg-bg-primary border border-white/10 rounded-xl shadow-2xl p-1 max-h-64 overflow-y-auto"
            style={{ backgroundColor: "#0a0a0f" }}
          >
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                type="button"
                className={cn(
                  "w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                  o.value === value
                    ? "bg-accent-400/15 text-accent-400"
                    : "text-gray-300 hover:bg-white/5",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
