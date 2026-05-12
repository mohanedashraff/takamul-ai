"use client";

// ════════════════════════════════════════════════════════════════
// Marketplace Cards Studio — workspace
// ════════════════════════════════════════════════════════════════
// 13 marketplace listing assets (1 main + 5 secondary + 7 A+) backed
// by per-asset Claude system prompts. The user picks a SCOPE bundle
// (or à la carte assets), uploads a product image, types a 1-line
// intent + optional brand context, and gets every asset rendered.

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Sparkles, Loader2, X, Upload, Maximize2, Download,
  ChevronDown, Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  MARKETPLACE_ASSETS, SCOPE_BUNDLES, MARKETPLACE_DEFAULTS,
  MARKETPLACE_COST_PER_ASSET,
} from "@/lib/data/marketplace-cards";
import { uploadFile } from "@/lib/muapi";

const PERSIST_KEY    = "yilow_marketplace_cards_v1";
const HISTORY_LIMIT  = 20;

interface CardResult {
  assetId: string;
  url:     string;
  prompt:  string;
}
interface MarketplaceJob {
  id:         string;
  intent:     string;
  productUrl: string;
  results:    CardResult[];
  failedCount: number;
  timestamp:  number;
}

export function MarketplaceCardsStudio() {
  // ── state ─────────────────────────────────────────────────────────
  const [productUrl,   setProductUrl]   = useState<string | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadPct,    setUploadPct]    = useState(0);
  const [intent,       setIntent]       = useState<string>("");
  const [scopeId,      setScopeId]      = useState<string>(MARKETPLACE_DEFAULTS.scopeId);
  const [selectedIds,  setSelectedIds]  = useState<string[]>(MARKETPLACE_DEFAULTS.selectedIds);
  const [brandContext, setBrandContext] = useState<string>("");
  const [category,     setCategory]     = useState<string>("");
  const [visualStyle,  setVisualStyle]  = useState<string>("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [progress,     setProgress]     = useState("");
  const [history,      setHistory]      = useState<MarketplaceJob[]>([]);
  const [fullscreen,   setFullscreen]   = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── persistence ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PERSIST_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<{
        productUrl: string | null; intent: string;
        scopeId: string; selectedIds: string[];
        brandContext: string; category: string; visualStyle: string;
        history: MarketplaceJob[];
      }>;
      if (typeof parsed.productUrl === "string" || parsed.productUrl === null) setProductUrl(parsed.productUrl);
      if (typeof parsed.intent === "string")        setIntent(parsed.intent);
      if (typeof parsed.scopeId === "string")       setScopeId(parsed.scopeId);
      if (Array.isArray(parsed.selectedIds))        setSelectedIds(parsed.selectedIds);
      if (typeof parsed.brandContext === "string")  setBrandContext(parsed.brandContext);
      if (typeof parsed.category === "string")      setCategory(parsed.category);
      if (typeof parsed.visualStyle === "string")   setVisualStyle(parsed.visualStyle);
      if (Array.isArray(parsed.history))            setHistory(parsed.history);
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify({
          productUrl, intent, scopeId, selectedIds, brandContext, category, visualStyle, history,
        }));
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [productUrl, intent, scopeId, selectedIds, brandContext, category, visualStyle, history]);

  // ── handlers ──────────────────────────────────────────────────────
  const onPickScope = (id: string) => {
    setScopeId(id);
    const scope = SCOPE_BUNDLES.find((s) => s.id === id);
    if (scope) setSelectedIds(scope.assetIds.slice());
  };
  const onToggleAsset = (assetId: string) => {
    setSelectedIds((cur) => {
      const next = cur.includes(assetId) ? cur.filter((x) => x !== assetId) : [...cur, assetId];
      // Clear scope label when the user diverges from the bundle.
      const matchedScope = SCOPE_BUNDLES.find((s) =>
        s.assetIds.length === next.length && s.assetIds.every((id) => next.includes(id))
      );
      setScopeId(matchedScope?.id ?? "custom");
      return next;
    });
  };

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
    if (!intent.trim()) { toast.error("اوصف المنتج بجملة قصيرة"); return; }
    if (selectedIds.length === 0) { toast.error("اختر أصلاً واحداً على الأقل"); return; }
    if (generating) return;

    setGenerating(true);
    setProgress(`جاري إنشاء ${selectedIds.length} أصل…`);
    try {
      const r = await fetch("/api/tools/marketplace-cards/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          selectedAssetIds: selectedIds,
          intent:           intent.trim(),
          productUrl,
          brand_context:    brandContext.trim() || undefined,
          category:         category.trim()     || undefined,
          visual_style:     visualStyle.trim()  || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok || !Array.isArray(data.results)) {
        throw new Error(data?.error || "فشل التوليد");
      }
      const successResults: CardResult[] = (data.results as { assetId: string; url: string | null; prompt: string; ok: boolean }[])
        .filter((res) => res.ok && res.url)
        .map((res) => ({ assetId: res.assetId, url: res.url!, prompt: res.prompt }));
      const job: MarketplaceJob = {
        id:          crypto.randomUUID(),
        intent:      intent.trim(),
        productUrl,
        results:     successResults,
        failedCount: typeof data.failedCount === "number" ? data.failedCount : 0,
        timestamp:   Date.now(),
      };
      setHistory((h) => [job, ...h].slice(0, HISTORY_LIMIT));
      toast.success(
        job.failedCount > 0
          ? `تم ${successResults.length}، فشل ${job.failedCount} 📦`
          : `تم ${successResults.length} أصول 📦`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setGenerating(false);
      setProgress("");
    }
  };

  // ── derived ───────────────────────────────────────────────────────
  const cost = selectedIds.length * MARKETPLACE_COST_PER_ASSET;

  // Group assets by family for the picker
  const grouped = {
    main:      MARKETPLACE_ASSETS.filter((a) => a.family === "main"),
    secondary: MARKETPLACE_ASSETS.filter((a) => a.family === "secondary"),
    aplus:     MARKETPLACE_ASSETS.filter((a) => a.family === "aplus"),
  };

  // ── render ────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-[calc(100vh-80px)] pb-44">
      {/* Hero */}
      <div className="relative pt-10 md:pt-14 pb-6 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-400/30 bg-accent-400/5 text-accent-400 text-xs font-black mb-5">
          <ShoppingBag className="w-3 h-3" />
          Marketplace Cards Studio
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-[1.4] max-w-3xl mx-auto">
          ١٣ أصل لقائمة منتجك في <span className="text-accent-400">Amazon</span> — في جلسة واحدة
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          صورة رئيسية + 5 صور ثانوية + 7 وحدات A+ Content. كل أصل بـClaude system prompt خاص بقواعد المتجر.
        </p>
      </div>

      {/* Scope bundles */}
      <div className="max-w-5xl mx-auto px-4 mb-4">
        <div className="text-[11px] text-gray-500 font-bold mb-2">حزمة جاهزة</div>
        <div className="flex items-center gap-2 flex-wrap">
          {SCOPE_BUNDLES.map((scope) => {
            const active = scope.id === scopeId;
            return (
              <button
                key={scope.id}
                onClick={() => onPickScope(scope.id)}
                type="button"
                className={cn(
                  "h-12 px-4 rounded-2xl border text-right transition-all flex flex-col items-end justify-center gap-0.5",
                  active
                    ? "border-accent-400 bg-accent-400/10 shadow-[0_0_16px_rgba(254,228,64,0.25)]"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]",
                )}
              >
                <span className={cn("text-xs font-black", active ? "text-accent-400" : "text-white")}>
                  {scope.name}
                </span>
                <span className="text-[10px] text-gray-500">{scope.desc}</span>
              </button>
            );
          })}
          {scopeId === "custom" && (
            <span className="h-12 px-4 rounded-2xl border border-accent-400/40 bg-accent-400/5 flex items-center text-[11px] font-bold text-accent-400">
              مخصص
            </span>
          )}
        </div>
      </div>

      {/* Asset picker — grouped by family */}
      <div className="max-w-5xl mx-auto px-4 mb-6 space-y-4">
        <AssetGroup title="الصورة الرئيسية" englishTitle="Main Image" assets={grouped.main}      selectedIds={selectedIds} onToggle={onToggleAsset} />
        <AssetGroup title="الصور الثانوية"  englishTitle="Secondary"  assets={grouped.secondary} selectedIds={selectedIds} onToggle={onToggleAsset} />
        <AssetGroup title="A+ Content"       englishTitle="A+ Content" assets={grouped.aplus}     selectedIds={selectedIds} onToggle={onToggleAsset} />
      </div>

      {/* History */}
      {history.length > 0 ? (
        <div className="max-w-6xl mx-auto px-4 space-y-6 mb-8">
          {history.map((job) => (
            <motion.section
              key={job.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bento-card rounded-2xl border border-white/10 p-4"
            >
              <header className="flex items-baseline justify-between mb-3">
                <div>
                  <h4 className="text-white font-black text-sm">{job.intent}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {job.results.length} أصل{job.failedCount > 0 ? ` (فشل ${job.failedCount})` : ""}
                  </p>
                </div>
                <span className="text-[10px] text-gray-500">{new Date(job.timestamp).toLocaleString("ar-EG")}</span>
              </header>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {job.results.map((r, i) => {
                  const meta = MARKETPLACE_ASSETS.find((a) => a.id === r.assetId);
                  return (
                    <div key={i} className="relative bento-card rounded-xl overflow-hidden border border-white/10 group">
                      <div className="aspect-square bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="px-2 py-1.5 text-[10px] font-bold text-white truncate">
                        {meta?.name ?? r.assetId}
                      </div>
                      <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setFullscreen(r.url)}
                          type="button"
                          aria-label="ملء الشاشة"
                          className="w-6 h-6 rounded-md bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                          <Maximize2 className="w-2.5 h-2.5 text-white" />
                        </button>
                        <a
                          href={r.url} download target="_blank" rel="noopener noreferrer"
                          aria-label="تنزيل"
                          className="w-6 h-6 rounded-md bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                          <Download className="w-2.5 h-2.5 text-white" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-4">
          <p className="text-gray-500 text-xs">قائمتك الأولى تنتظرك — ارفع المنتج، اختر الحزمة، واضغط <span className="text-accent-400 font-bold">إنشاء</span></p>
        </div>
      )}

      {/* Bottom shoot bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-5 pointer-events-none" dir="rtl">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bento-card rounded-3xl border border-white/10 p-3 backdrop-blur-2xl bg-black/60 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] flex flex-col gap-3">
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
                placeholder="اوصف المنتج بجملة قصيرة. مثال: عطر منتعش رجالي بـnotes ليمون وعطر وُد"
                rows={2}
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none px-1 text-right"
                style={{ maxHeight: 120 }}
                dir="rtl"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setAdvancedOpen((v) => !v)}
                type="button"
                className={cn(
                  "h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors",
                  brandContext.trim() || category.trim() || visualStyle.trim()
                    ? "border-accent-400/40 bg-accent-400/8 text-accent-400"
                    : "border-white/10 text-gray-300 hover:bg-white/[0.03]",
                )}
              >
                <Sparkles className="w-3 h-3" />
                <span>سياق إضافي</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", advancedOpen && "rotate-180")} />
              </button>
              <span className="text-[11px] text-gray-500">
                <span className="text-white font-bold">{selectedIds.length}</span> أصل مختار
              </span>
              <div className="flex-1" />
              <button
                onClick={onGenerate}
                disabled={generating || !productUrl || !intent.trim() || selectedIds.length === 0}
                type="button"
                className={cn(
                  "h-10 px-5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all",
                  generating || !productUrl || !intent.trim() || selectedIds.length === 0
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

            {advancedOpen && (
              <div className="border-t border-white/[0.04] pt-2.5 space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">سياق العلامة (اختياري)</label>
                  <input
                    value={brandContext}
                    onChange={(e) => setBrandContext(e.target.value)}
                    placeholder="مثال: علامة عطور سعودية فاخرة، palette ذهبي وأبيض"
                    className="w-full h-9 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-accent-400/40 text-right"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">فئة المنتج (اختياري)</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="مثال: عطور / Beauty / Skincare / Electronics"
                    className="w-full h-9 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-accent-400/40 text-right"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">نمط بصري (اختياري)</label>
                  <input
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value)}
                    placeholder="مثال: minimal-luxury / playful-pop / clinical-clean"
                    className="w-full h-9 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-accent-400/40 text-right"
                    dir="rtl"
                  />
                </div>
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

// ── Asset group — renders one family (main / secondary / aplus) ──
function AssetGroup({
  title, englishTitle, assets, selectedIds, onToggle,
}: {
  title:        string;
  englishTitle: string;
  assets:       typeof MARKETPLACE_ASSETS;
  selectedIds:  string[];
  onToggle:     (id: string) => void;
}) {
  const pickedInGroup = assets.filter((a) => selectedIds.includes(a.id)).length;
  return (
    <section>
      <header className="flex items-baseline justify-between mb-2">
        <div>
          <h4 className="text-white font-black text-sm">{title}</h4>
          <p className="text-[10px] text-gray-500 mt-0.5">{englishTitle}</p>
        </div>
        <span className="text-[10px] text-gray-500">
          <span className="text-accent-400 font-bold">{pickedInGroup}</span> / {assets.length}
        </span>
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {assets.map((a) => {
          const picked = selectedIds.includes(a.id);
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => onToggle(a.id)}
              type="button"
              className={cn(
                "relative p-3 rounded-2xl border text-right transition-all",
                picked
                  ? "border-accent-400 bg-accent-400/10 shadow-[0_0_18px_rgba(254,228,64,0.25)]"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20",
              )}
            >
              {picked && (
                <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-accent-400 text-black flex items-center justify-center">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
              )}
              <Icon className={cn("w-4 h-4 mb-2", picked ? "text-accent-400" : "text-gray-400")} />
              <div className={cn("text-xs font-black mb-0.5", picked ? "text-accent-400" : "text-white")}>
                {a.name}
              </div>
              <div className="text-[10px] text-gray-500 leading-snug">{a.desc}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
