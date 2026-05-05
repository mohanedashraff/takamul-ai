"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Sparkles, Loader2, Plus, X, ChevronDown,
  Download, Maximize2, Package, User, ImagePlus, Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  MARKETING_FORMATS, MARKETING_AVATARS,
  MARKETING_RATIOS, MARKETING_RESOLUTIONS, MARKETING_DURATIONS,
  MARKETING_DEFAULTS, resolveMarketingEndpoint,
  type MarketingFormat,
} from "@/lib/data/marketing";
import { uploadFile } from "@/lib/muapi";
import { runMuapiTool } from "@/lib/run-tool";

const PERSIST_KEY = "yilow_marketing_studio_v1";
const HISTORY_LIMIT = 30;

interface MarketingAd {
  id:        string;
  url:       string;
  prompt:    string;
  format:    string;     // format id
  ratio:     string;
  resolution:string;
  duration:  number;
  timestamp: number;
}

export function MarketingStudio() {
  // ── state ─────────────────────────────────────────────────────────
  const [prompt,           setPrompt]           = useState("");
  const [formatId,         setFormatId]         = useState<string>(MARKETING_DEFAULTS.formatId);
  const [ratio,            setRatio]            = useState<string>(MARKETING_DEFAULTS.ratio);
  const [resolution,       setResolution]       = useState<string>(MARKETING_DEFAULTS.resolution);
  const [duration,         setDuration]         = useState<number>(MARKETING_DEFAULTS.duration);
  const [productImage,     setProductImage]     = useState<string | null>(null);
  const [avatarImage,      setAvatarImage]      = useState<string | null>(null);
  const [extraImages,      setExtraImages]      = useState<string[]>([]);
  const [isUploading,      setIsUploading]      = useState<"product" | "avatar" | "extras" | null>(null);
  const [isGenerating,     setIsGenerating]     = useState(false);
  const [progress,         setProgress]         = useState("");
  const [history,          setHistory]          = useState<MarketingAd[]>([]);
  const [openMenu,         setOpenMenu]         = useState<null | "format" | "avatar" | "ratio" | "res" | "dur">(null);
  const [fullscreen,       setFullscreen]       = useState<string | null>(null);

  const productInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef  = useRef<HTMLInputElement>(null);
  const extrasInputRef  = useRef<HTMLInputElement>(null);

  // ── persistence ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (typeof p.prompt === "string") setPrompt(p.prompt);
      if (p.formatId)     setFormatId(p.formatId);
      if (p.ratio)        setRatio(p.ratio);
      if (p.resolution)   setResolution(p.resolution);
      if (typeof p.duration === "number") setDuration(p.duration);
      if (p.productImage) setProductImage(p.productImage);
      if (p.avatarImage)  setAvatarImage(p.avatarImage);
      if (Array.isArray(p.extraImages)) setExtraImages(p.extraImages);
      if (Array.isArray(p.history))     setHistory(p.history);
    } catch {}
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify({
          prompt, formatId, ratio, resolution, duration,
          productImage, avatarImage, extraImages, history,
        }));
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [prompt, formatId, ratio, resolution, duration, productImage, avatarImage, extraImages, history]);

  // ── derived ───────────────────────────────────────────────────────
  const format = useMemo(() => MARKETING_FORMATS.find((f) => f.id === formatId)!, [formatId]);
  const cost   = useMemo(
    () => Math.ceil((resolution === "1080p" ? duration * 0.675 : duration * 0.3) * 100),
    [resolution, duration],
  );

  // ── upload handlers ───────────────────────────────────────────────
  const upload = async (file: File, slot: "product" | "avatar" | "extras") => {
    setIsUploading(slot);
    try {
      const { url } = await uploadFile(file);
      if (slot === "product") setProductImage(url);
      else if (slot === "avatar") setAvatarImage(url);
      else setExtraImages((x) => [...x, url].slice(0, 6));
      toast.success("تم الرفع");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الرفع");
    } finally {
      setIsUploading(null);
    }
  };

  // ── generate ──────────────────────────────────────────────────────
  const onGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    const endpoint   = resolveMarketingEndpoint(resolution);
    const imagesList = [productImage, avatarImage, ...extraImages].filter(Boolean) as string[];
    const payload: Record<string, unknown> = {
      prompt:       prompt.trim(),
      aspect_ratio: ratio,
      duration,
      images_list:  imagesList,
      video_files:  [format.videoUrl],
    };

    setIsGenerating(true);
    setProgress("جاري التوليد…");

    try {
      const { result } = await runMuapiTool({
        toolId:       "marketing-studio",
        endpoint,
        payload,
        inputsForDb:  { prompt, formatId, ratio, resolution, duration, imagesList },
        pollOptions: {
          onStatus: (s) => setProgress(statusToArabic(s)),
        },
      });
      const url = pickUrl(result);
      if (!url) throw new Error("لم يتم استلام الناتج");

      const ad: MarketingAd = {
        id: crypto.randomUUID(),
        url,
        prompt,
        format:     formatId,
        ratio, resolution, duration,
        timestamp: Date.now(),
      };
      setHistory((h) => [ad, ...h].slice(0, HISTORY_LIMIT));
      toast.success("تم إنشاء الإعلان 🎯");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل التوليد");
    } finally {
      setIsGenerating(false);
      setProgress("");
    }
  };

  // ── render ────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-[calc(100vh-80px)] pb-44">
      {/* Hero */}
      <div className="relative pt-10 md:pt-16 pb-10 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-400/30 bg-accent-400/5 text-accent-400 text-xs font-black mb-5">
          <Megaphone className="w-3 h-3" />
          استوديو التسويق
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-5 leading-[1.5] md:leading-[1.4] max-w-3xl mx-auto">
          إعلانات احترافية <span className="text-accent-400">في دقائق</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          منتجك + شخصية + قوالب جاهزة (UGC، فتح صندوق، شرح، مراجعة) — والذكاء الاصطناعي يعمل الباقي.
        </p>
      </div>

      {/* History gallery */}
      {history.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto px-4">
          {history.map((ad) => {
            const fmt = MARKETING_FORMATS.find((f) => f.id === ad.format);
            return (
              <motion.div
                key={ad.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative bento-card rounded-2xl overflow-hidden border border-white/10 group"
              >
                <div className="relative bg-black aspect-[9/16] sm:aspect-video">
                  <video
                    src={ad.url}
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setFullscreen(ad.url)}
                      className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80"
                      type="button"
                      aria-label="ملء الشاشة"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                    </button>
                    <a
                      href={ad.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80"
                      aria-label="تنزيل"
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                    </a>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-accent-400/90 text-black">
                      {fmt?.englishName ?? ad.format}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-white font-bold line-clamp-2 mb-1">{ad.prompt}</p>
                  <p className="text-[10px] text-gray-500">{ad.ratio} · {ad.resolution} · {ad.duration}s</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <div className="w-24 h-24 rounded-full border-2 border-accent-400/30 bg-accent-400/5 flex items-center justify-center mb-6">
            <Megaphone className="w-12 h-12 text-accent-400" />
          </div>
          <p className="text-white text-lg font-bold mb-1">جاهز لأول إعلان؟</p>
          <p className="text-gray-500 text-sm max-w-xs">
            ارفع منتجك، اختار قالب، اكتب وصفك، واضغط <span className="text-accent-400 font-bold">إنشاء</span>.
          </p>
        </div>
      )}

      {/* ── Bottom prompt bar ─────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-5 pointer-events-none">
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <div className="bento-card rounded-3xl border border-white/10 p-3 md:p-4 backdrop-blur-2xl bg-black/60 shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
            {/* Extra image pills */}
            {extraImages.length > 0 && (
              <div className="flex gap-2 mb-2.5 px-1 overflow-x-auto no-scrollbar">
                {extraImages.map((src, i) => (
                  <div key={i} className="relative shrink-0 w-12 h-12 rounded-lg border border-white/10 overflow-hidden group/pill">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setExtraImages((x) => x.filter((_, j) => j !== i))}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover/pill:opacity-100 flex items-center justify-center"
                      aria-label="إزالة"
                      type="button"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="اوصف الإعلان… مثال: امرأة تستخدم المنتج وتعرض فوائده في 3 ثواني"
              rows={2}
              className="w-full bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none px-1 mb-3"
              style={{ maxHeight: 200 }}
            />

            <div className="flex items-center gap-2 flex-wrap">
              {/* Upload slots */}
              <UploadSlot
                icon={Package}
                tip="صورة المنتج"
                fileUrl={productImage}
                isLoading={isUploading === "product"}
                onClear={() => setProductImage(null)}
                onClick={() => productInputRef.current?.click()}
              />
              <input
                ref={productInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "product"); e.target.value = ""; }}
              />

              <UploadSlot
                icon={User}
                tip="صورة العارض/الشخصية"
                fileUrl={avatarImage}
                isLoading={isUploading === "avatar"}
                onClear={() => setAvatarImage(null)}
                onClick={() => avatarInputRef.current?.click()}
              />
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "avatar"); e.target.value = ""; }}
              />

              <UploadSlot
                icon={ImagePlus}
                tip={`صور مرجعية إضافية (${extraImages.length}/6)`}
                fileUrl={null}
                isLoading={isUploading === "extras"}
                onClear={null}
                onClick={() => extraImages.length < 6 && extrasInputRef.current?.click()}
                disabled={extraImages.length >= 6}
              />
              <input
                ref={extrasInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "extras"); e.target.value = ""; }}
              />

              {/* Format mega-dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === "format" ? null : "format")}
                  className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/[0.03] text-xs font-bold text-white flex items-center gap-2"
                  type="button"
                >
                  <span className="text-gray-500">قالب:</span>
                  {format.name}
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
                {openMenu === "format" && (
                  <FormatGalleryDropdown
                    selected={formatId}
                    onPick={(id) => { setFormatId(id); setOpenMenu(null); }}
                    onClose={() => setOpenMenu(null)}
                  />
                )}
              </div>

              {/* Avatar preset */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === "avatar" ? null : "avatar")}
                  className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/[0.03] text-xs font-bold text-white flex items-center gap-2"
                  type="button"
                >
                  <span className="text-gray-500">عارض:</span>
                  {MARKETING_AVATARS.find((a) => a.thumbnail === avatarImage)?.name ?? "اختر"}
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
                {openMenu === "avatar" && (
                  <AvatarGalleryDropdown
                    selected={avatarImage}
                    onPick={(url) => { setAvatarImage(url); setOpenMenu(null); }}
                    onClose={() => setOpenMenu(null)}
                  />
                )}
              </div>

              {/* Simple chips */}
              <SimpleChip
                label="نسبة"
                value={ratio}
                options={MARKETING_RATIOS.map((r) => ({ value: r.id, label: r.label }))}
                onChange={setRatio}
              />
              <SimpleChip
                label="جودة"
                value={resolution}
                options={MARKETING_RESOLUTIONS.map((r) => ({ value: r.id, label: r.label }))}
                onChange={setResolution}
              />
              <SimpleChip
                label="مدة"
                value={String(duration)}
                options={MARKETING_DURATIONS.map((d) => ({ value: String(d), label: `${d}s` }))}
                onChange={(v) => setDuration(Number(v))}
              />

              <div className="flex-1" />

              {/* Generate button */}
              <button
                onClick={onGenerate}
                disabled={!prompt.trim() || isGenerating}
                className={cn(
                  "h-10 px-5 rounded-xl font-black text-sm flex items-center gap-2 transition-all whitespace-nowrap",
                  !prompt.trim() || isGenerating
                    ? "bg-white/5 text-gray-600 cursor-not-allowed"
                    : "bg-accent-400 text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_24px_rgba(254,228,64,0.35)]",
                )}
                type="button"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {progress || "جاري التوليد…"}</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    إنشاء
                    <span className="inline-flex items-center gap-0.5 text-[10px] opacity-75 px-1.5 py-0.5 rounded bg-black/20">
                      <Zap className="w-2.5 h-2.5" />{cost}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setFullscreen(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
              onClick={() => setFullscreen(null)}
              aria-label="إغلاق"
              type="button"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <video src={fullscreen} controls autoPlay loop className="max-w-full max-h-full rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────

function UploadSlot({
  icon: Icon, tip, fileUrl, isLoading, onClick, onClear, disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tip: string;
  fileUrl: string | null;
  isLoading?: boolean;
  onClick: () => void;
  onClear: (() => void) | null;
  disabled?: boolean;
}) {
  if (fileUrl) {
    return (
      <div className="relative w-10 h-10 rounded-xl border border-accent-400/40 overflow-hidden group" title={tip}>
        <img src={fileUrl} alt="" className="w-full h-full object-cover" />
        {onClear && (
          <button
            onClick={onClear}
            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            aria-label="إزالة"
            type="button"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      title={tip}
      className={cn(
        "w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center transition-colors",
        disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5",
      )}
      type="button"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-accent-400" /> : <Icon className="w-4 h-4 text-gray-300" />}
    </button>
  );
}

/**
 * Renders into <body> via a portal so the dropdown isn't clipped by
 * the bottom bar's `backdrop-blur` / `rounded-3xl` stacking context.
 * `usePortal` returns null on the server (SSR), then mounts on client.
 */
function usePortalReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  return ready;
}

function FormatGalleryDropdown({
  selected, onPick, onClose,
}: {
  selected: string;
  onPick:  (id: string) => void;
  onClose: () => void;
}) {
  const ready = usePortalReady();
  if (!ready) return null;

  return createPortal(
    <>
      {/* Click-outside backdrop */}
      <div className="fixed inset-0 z-[80]" onClick={onClose} aria-hidden />
      {/* Dropdown panel — sits above the bottom bar, centred. */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[90] w-[640px] max-w-[94vw] bg-bg-primary border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-3"
        style={{ bottom: 110 }}
      >
        <div className="flex items-center justify-between px-1 pb-2 mb-2 border-b border-white/5">
          <h4 className="text-sm font-black text-white">اختر قالب الإعلان</h4>
          <button
            onClick={onClose}
            className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors"
            type="button"
          >
            إغلاق
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MARKETING_FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => onPick(f.id)}
              className={cn(
                "text-right rounded-xl overflow-hidden border transition-all hover:scale-[1.02]",
                selected === f.id ? "border-accent-400/60 ring-1 ring-accent-400/40" : "border-white/10",
              )}
              type="button"
            >
              <div className="relative aspect-video bg-black">
                <video
                  src={f.videoUrl}
                  muted loop playsInline
                  onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                  onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                  className="w-full h-full object-cover"
                />
                {selected === f.id && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-accent-400 text-black">
                    مختار
                  </span>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-bold text-white">{f.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{f.englishName}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
}

function AvatarGalleryDropdown({
  selected, onPick, onClose,
}: {
  selected: string | null;
  onPick:  (url: string) => void;
  onClose: () => void;
}) {
  const ready = usePortalReady();
  if (!ready) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[80]" onClick={onClose} aria-hidden />
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[90] w-[420px] max-w-[94vw] bg-bg-primary border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-3"
        style={{ bottom: 110 }}
      >
        <div className="flex items-center justify-between px-1 pb-2 mb-2 border-b border-white/5">
          <h4 className="text-sm font-black text-white">اختر العارض</h4>
          <button
            onClick={onClose}
            className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors"
            type="button"
          >
            إغلاق
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MARKETING_AVATARS.map((a) => (
            <button
              key={a.id}
              onClick={() => onPick(a.thumbnail)}
              className={cn(
                "rounded-xl overflow-hidden border transition-all hover:scale-[1.05]",
                selected === a.thumbnail ? "border-accent-400/60 ring-1 ring-accent-400/40" : "border-white/10",
              )}
              type="button"
              title={a.name}
            >
              <img src={a.thumbnail} alt={a.name} className="w-full aspect-square object-cover" />
              <div className="px-2 py-1.5 text-center">
                <p className="text-[10px] font-bold text-white">{a.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
}

function SimpleChip({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/[0.03] text-xs font-bold text-white flex items-center gap-1.5"
        type="button"
      >
        <span className="text-gray-500">{label}:</span>
        {active?.label ?? value}
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute bottom-full mb-2 right-0 z-40 min-w-[180px] bg-bg-primary border border-white/10 rounded-xl shadow-2xl p-1 max-h-72 overflow-y-auto">
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={cn(
                  "w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                  o.value === value ? "bg-accent-400/15 text-accent-400" : "text-gray-300 hover:bg-white/5",
                )}
                type="button"
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

// ── helpers ──────────────────────────────────────────────────────────

function statusToArabic(s: string): string {
  switch (s) {
    case "queued":
    case "pending":    return "في قائمة الانتظار…";
    case "processing":
    case "running":    return "جاري التوليد…";
    case "completed":  return "تم!";
    default:            return "جاري المعالجة…";
  }
}

function pickUrl(r: { url?: string; urls?: string[]; outputs?: unknown }): string | null {
  if (typeof r.url === "string" && r.url) return r.url;
  if (Array.isArray(r.urls) && r.urls[0]) return r.urls[0];
  if (Array.isArray(r.outputs) && r.outputs.length) {
    const first = r.outputs[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first && "url" in first) return (first as { url: string }).url;
  }
  return null;
}
