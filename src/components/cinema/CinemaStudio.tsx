"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, Sparkles, Camera, Image as ImageIcon, X, Loader2,
  Download, Maximize2, Plus, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  CAMERAS, LENSES, FOCAL_LENGTHS, APERTURES,
  CINEMA_ASPECTS, CINEMA_RESOLUTIONS,
  CINEMA_DEFAULTS,
  buildCinemaPrompt,
} from "@/lib/data/cinema";
import { CameraSettingsOverlay, type CameraConfig } from "./CameraSettingsOverlay";
import { uploadFile } from "@/lib/muapi";
import { runMuapiTool } from "@/lib/run-tool";

const PERSIST_KEY = "yilow_cinema_studio_v1";
const HISTORY_LIMIT = 50;

export interface CinemaShot {
  id:        string;
  url:       string;
  timestamp: number;
  prompt:    string;
  config:    CameraConfig & { aspect: string; resolution: string; reference?: string };
}

export function CinemaStudio() {
  // ── state ─────────────────────────────────────────────────────────────
  const [config, setConfig] = useState<CameraConfig>({
    cameraId:   CINEMA_DEFAULTS.cameraId,
    lensId:     CINEMA_DEFAULTS.lensId,
    focal:      CINEMA_DEFAULTS.focal,
    apertureId: CINEMA_DEFAULTS.apertureId,
  });
  const [aspect,     setAspect]     = useState<string>(CINEMA_DEFAULTS.aspect);
  const [resolution, setResolution] = useState<string>(CINEMA_DEFAULTS.resolution);
  const [prompt,     setPrompt]     = useState("");
  const [reference,  setReference]  = useState<string | null>(null); // uploaded image URL
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading,    setIsUploading]    = useState(false);
  const [isGenerating,   setIsGenerating]   = useState(false);
  const [progress,       setProgress]       = useState("");
  const [history, setHistory] = useState<CinemaShot[]>([]);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [fullscreen,  setFullscreen]  = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── persistence ───────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PERSIST_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<{
        config: CameraConfig; aspect: string; resolution: string;
        reference: string | null; history: CinemaShot[];
      }>;
      if (parsed.config)     setConfig(parsed.config);
      if (parsed.aspect)     setAspect(parsed.aspect);
      if (parsed.resolution) setResolution(parsed.resolution);
      if (typeof parsed.reference === "string" || parsed.reference === null) setReference(parsed.reference);
      if (Array.isArray(parsed.history)) setHistory(parsed.history);
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify({ config, aspect, resolution, reference, history }));
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [config, aspect, resolution, reference, history]);

  // ── derived ───────────────────────────────────────────────────────────
  const camera   = useMemo(() => CAMERAS.find((c) => c.id === config.cameraId)!, [config.cameraId]);
  const lens     = useMemo(() => LENSES.find((l)  => l.id === config.lensId)!,   [config.lensId]);
  const focal    = useMemo(() => FOCAL_LENGTHS.find((f) => f.id === config.focal)!, [config.focal]);
  const aperture = useMemo(() => APERTURES.find((a) => a.id === config.apertureId)!, [config.apertureId]);

  // ── handlers ──────────────────────────────────────────────────────────
  const onPickFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const { url } = await uploadFile(file, (p) => setUploadProgress(p));
      setReference(url);
      toast.success("تم رفع الصورة المرجعية");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل رفع الصورة");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onShoot = async () => {
    if (!prompt.trim() || isGenerating) return;

    const finalPrompt = buildCinemaPrompt({
      basePrompt: prompt,
      cameraId:   config.cameraId,
      lensId:     config.lensId,
      focal:      config.focal,
      apertureId: config.apertureId,
    });

    const endpoint = reference ? "nano-banana-pro-edit" : "nano-banana-pro";
    const payload: Record<string, unknown> = {
      prompt:          finalPrompt,
      aspect_ratio:    aspect,
      resolution,
      negative_prompt: "blurry, low quality, distortion, bad composition",
    };
    if (reference) payload.images_list = [reference];

    setIsGenerating(true);
    setProgress("جاري التوليد…");

    try {
      const { result } = await runMuapiTool({
        toolId:      "cinema-studio",
        endpoint,
        payload,
        inputsForDb: { prompt, ...config, aspect, resolution, reference },
        pollOptions: {
          onStatus: (s) => setProgress(statusToArabic(s)),
        },
      });

      const url = pickUrl(result);
      if (!url) throw new Error("لم يتم استلام الناتج");

      const shot: CinemaShot = {
        id:        crypto.randomUUID(),
        url,
        timestamp: Date.now(),
        prompt,
        config:    { ...config, aspect, resolution, reference: reference ?? undefined },
      };
      setHistory((h) => [shot, ...h].slice(0, HISTORY_LIMIT));
      toast.success("تم تصوير اللقطة 🎬");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل التوليد");
    } finally {
      setIsGenerating(false);
      setProgress("");
    }
  };

  const restoreShot = (shot: CinemaShot) => {
    setPrompt(shot.prompt);
    setConfig({
      cameraId: shot.config.cameraId,
      lensId:   shot.config.lensId,
      focal:    shot.config.focal,
      apertureId: shot.config.apertureId,
    });
    setAspect(shot.config.aspect);
    setResolution(shot.config.resolution);
    if (shot.config.reference) setReference(shot.config.reference);
    toast.success("تم استرجاع الإعدادات");
  };

  // ── render ────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-[calc(100vh-80px)] pb-40">
      {/* Hero header */}
      <div className="relative pt-10 md:pt-16 pb-10 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-400/30 bg-accent-400/5 text-accent-400 text-xs font-black mb-5">
          <Film className="w-3 h-3" />
          استوديو السينما
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-5 leading-[1.5] md:leading-[1.4] max-w-3xl mx-auto">
          إيه اللي هتصوّره <span className="text-accent-400">بميزانية لانهائية</span>؟
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          كاميرات، عدسات، وأطوال بؤرية احترافية — كل اللقطات اللي حلمت بيها بضغطة زر.
        </p>
      </div>

      {/* History gallery */}
      {history.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto px-4">
          {history.map((shot) => (
            <motion.div
              key={shot.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative bento-card rounded-2xl overflow-hidden border border-white/10 group"
            >
              <div className="relative aspect-[4/3] bg-black">
                <img src={shot.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setFullscreen(shot.url)}
                    className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80 transition-colors"
                    aria-label="ملء الشاشة"
                    type="button"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                  </button>
                  <a
                    href={shot.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80 transition-colors"
                    aria-label="تنزيل"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                  </a>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-accent-400/90 text-black">
                    {CAMERAS.find((c) => c.id === shot.config.cameraId)?.englishName ?? ""}
                  </span>
                </div>
              </div>
              <button
                onClick={() => restoreShot(shot)}
                className="w-full text-right p-3 hover:bg-white/[0.03] transition-colors"
                type="button"
              >
                <p className="text-xs text-white font-bold line-clamp-2 mb-1">{shot.prompt}</p>
                <p className="text-[10px] text-gray-500">
                  {LENSES.find((l) => l.id === shot.config.lensId)?.englishName} · {shot.config.focal}mm · {shot.config.apertureId} · {shot.config.aspect}
                </p>
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <div className="w-24 h-24 rounded-full border-2 border-accent-400/30 bg-accent-400/5 flex items-center justify-center mb-6">
            <Film className="w-12 h-12 text-accent-400" />
          </div>
          <p className="text-white text-lg font-bold mb-1">لقطتك الأولى تنتظرك</p>
          <p className="text-gray-500 text-sm max-w-xs">
            اوصف المشهد، اختار تجهيزاتك السينمائية، واضغط <span className="text-accent-400 font-bold">صوّر</span>.
          </p>
        </div>
      )}

      {/* ── Bottom shoot bar ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-5 pointer-events-none">
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <div className="bento-card rounded-3xl border border-white/10 p-3 md:p-4 backdrop-blur-2xl bg-black/60 shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="اوصف مشهدك السينمائي..."
                rows={2}
                className="w-full bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none px-1"
                style={{ maxHeight: 160 }}
              />

              <div className="flex items-center gap-2 flex-wrap">
                {/* upload */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = ""; }}
                />
                {reference ? (
                  <div className="relative w-10 h-10 rounded-xl border border-accent-400/40 overflow-hidden group">
                    <img src={reference} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setReference(null)}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      aria-label="إزالة الصورة"
                      type="button"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={isUploading}
                    className="w-10 h-10 rounded-xl border border-white/10 hover:bg-white/5 flex items-center justify-center transition-colors"
                    type="button"
                    aria-label="إضافة صورة مرجعية"
                  >
                    {isUploading ? (
                      <div className="relative">
                        <Loader2 className="w-4 h-4 animate-spin text-accent-400" />
                        <span className="absolute -bottom-3.5 right-1/2 translate-x-1/2 text-[8px] text-accent-400">
                          {uploadProgress}%
                        </span>
                      </div>
                    ) : (
                      <Plus className="w-4 h-4 text-gray-300" />
                    )}
                  </button>
                )}

                {/* aspect dropdown */}
                <SelectChip
                  label="نسبة"
                  value={aspect}
                  options={CINEMA_ASPECTS.map((a) => ({ value: a.id, label: a.label }))}
                  onChange={setAspect}
                />
                <SelectChip
                  label="جودة"
                  value={resolution}
                  options={CINEMA_RESOLUTIONS.map((r) => ({ value: r.id, label: r.label }))}
                  onChange={setResolution}
                />

                {/* camera summary card */}
                <button
                  onClick={() => setOverlayOpen(true)}
                  className="flex-1 min-w-[180px] flex items-center gap-3 px-3.5 h-10 rounded-xl border border-white/10 hover:bg-white/[0.03] transition-colors"
                  type="button"
                >
                  <img src={camera.thumbnail} alt="" className="w-7 h-7 rounded-md object-cover border border-white/10" />
                  <div className="flex-1 text-right min-w-0">
                    <div className="text-[10px] text-gray-500">{camera.englishName}</div>
                    <div className="text-xs font-bold text-white truncate">
                      {lens.englishName} · {focal.label} · {aperture.id}
                    </div>
                  </div>
                  <Camera className="w-4 h-4 text-gray-500" />
                </button>

                {/* shoot button */}
                <button
                  onClick={onShoot}
                  disabled={!prompt.trim() || isGenerating}
                  className={cn(
                    "h-10 px-5 rounded-xl font-black text-sm flex items-center gap-2 transition-all",
                    !prompt.trim() || isGenerating
                      ? "bg-white/5 text-gray-600 cursor-not-allowed"
                      : "bg-accent-400 text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_24px_rgba(254,228,64,0.35)]",
                  )}
                  type="button"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {progress || "جاري التوليد…"}</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> صوّر</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera settings overlay */}
      <CameraSettingsOverlay
        open={overlayOpen}
        config={config}
        onChange={setConfig}
        onClose={() => setOverlayOpen(false)}
      />

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
            <img src={fullscreen} alt="" className="max-w-full max-h-full object-contain rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────

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

// ── tiny chip <Select> ────────────────────────────────────────────────

function SelectChip({
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
        className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/[0.03] text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
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
