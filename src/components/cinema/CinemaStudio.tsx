"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, Sparkles, Camera, Image as ImageIcon, X, Loader2,
  Download, Maximize2, Plus, ChevronDown, Drama, Palette, Bot,
  Video as VideoIcon, Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  CAMERAS, LENSES, FOCAL_LENGTHS, APERTURES,
  CINEMA_ASPECTS, CINEMA_RESOLUTIONS,
  CINEMA_VIDEO_ASPECTS, CINEMA_VIDEO_DURATIONS, CINEMA_VIDEO_RESOLUTIONS,
  CINEMA_DEFAULTS,
  GENRES, COLOR_PALETTES, LIGHTING_STYLES, MOVESETS,
  buildCinemaPrompt, resolveCinemaEndpoint, computeCinemaCost,
  type CinemaMode,
} from "@/lib/data/cinema";
import { CameraSettingsOverlay, type CameraConfig } from "./CameraSettingsOverlay";
import { GenrePicker } from "./GenrePicker";
import { StylePicker, type StyleValue } from "./StylePicker";
import { AiDirectorSidebar, type DirectorPicks } from "./AiDirectorSidebar";
import { uploadFile } from "@/lib/muapi";
import { runMuapiTool } from "@/lib/run-tool";
import { EnhancePromptButton } from "@/components/studio-shared/EnhancePromptButton";
import {
  AdvancedSettingsModal, AdvancedSettingsChip, ADVANCED_DEFAULTS,
  type AdvancedSettings,
} from "@/components/studio-shared/AdvancedSettingsModal";

// Bumped to v2 when the image/video toggle landed — old v1 history
// rows didn't carry a `mode` field, so we fall back to "image" when
// reading them back.
const PERSIST_KEY = "yilow_cinema_studio_v2";
const HISTORY_LIMIT = 50;

export interface CinemaShot {
  id:        string;
  url:       string;
  /** Whether the saved url is a still image or a motion clip. Older
   *  rows (pre-video-mode) won't have this — they're always images. */
  mode?:     CinemaMode;
  timestamp: number;
  prompt:    string;
  config:    CameraConfig & {
    aspect:     string;
    resolution: string;
    reference?: string;
    /** Video-mode duration in seconds. Undefined for image shots. */
    duration?:  number;
    genreId?:   string;
    paletteId?: string;
    lightingId?:string;
    movesetId?: string;
  };
}

export function CinemaStudio() {
  // ── state ─────────────────────────────────────────────────────────────
  const [config, setConfig] = useState<CameraConfig>({
    cameraId:   CINEMA_DEFAULTS.cameraId,
    lensId:     CINEMA_DEFAULTS.lensId,
    focal:      CINEMA_DEFAULTS.focal,
    apertureId: CINEMA_DEFAULTS.apertureId,
  });
  // Image-mode controls
  const [aspect,     setAspect]     = useState<string>(CINEMA_DEFAULTS.aspect);
  const [resolution, setResolution] = useState<string>(CINEMA_DEFAULTS.resolution);
  // Video-mode controls (separate state so flipping the toggle preserves
  // each side's last selection)
  const [mode,            setMode]            = useState<CinemaMode>(CINEMA_DEFAULTS.mode);
  const [videoAspect,     setVideoAspect]     = useState<string>(CINEMA_DEFAULTS.videoAspect);
  const [videoResolution, setVideoResolution] = useState<string>(CINEMA_DEFAULTS.videoResolution);
  const [videoDuration,   setVideoDuration]   = useState<number>(CINEMA_DEFAULTS.videoDuration);
  // Higgsfield-parity layers — each picker writes its id here. The
  // prompt builder treats "auto"/"general" as no-op so previous prompts
  // keep working until the user explicitly opts in.
  const [genreId,    setGenreId]    = useState<string>(CINEMA_DEFAULTS.genreId);
  const [style,      setStyle]      = useState<StyleValue>({
    paletteId:  CINEMA_DEFAULTS.paletteId,
    lightingId: CINEMA_DEFAULTS.lightingId,
    movesetId:  CINEMA_DEFAULTS.movesetId,
  });
  const [prompt,     setPrompt]     = useState("");
  const [reference,  setReference]  = useState<string | null>(null); // uploaded image URL
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading,    setIsUploading]    = useState(false);
  const [isGenerating,   setIsGenerating]   = useState(false);
  const [progress,       setProgress]       = useState("");
  const [history, setHistory] = useState<CinemaShot[]>([]);
  const [overlayOpen,  setOverlayOpen]  = useState(false);
  const [genreOpen,    setGenreOpen]    = useState(false);
  const [styleOpen,    setStyleOpen]    = useState(false);
  const [directorOpen, setDirectorOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // Negative prompt + seed (no styleStrength here — Cinema doesn't
  // share Soul's heavy descriptor injection).
  const [advanced,     setAdvanced]     = useState<AdvancedSettings>(ADVANCED_DEFAULTS);
  const [fullscreen,  setFullscreen]  = useState<{ url: string; mode: CinemaMode } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── persistence ───────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PERSIST_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<{
        config: CameraConfig; aspect: string; resolution: string;
        reference: string | null; history: CinemaShot[];
        genreId: string; style: StyleValue;
        mode: CinemaMode;
        videoAspect: string; videoResolution: string; videoDuration: number;
        advanced: AdvancedSettings;
      }>;
      if (parsed.config)     setConfig(parsed.config);
      if (parsed.aspect)     setAspect(parsed.aspect);
      if (parsed.resolution) setResolution(parsed.resolution);
      if (typeof parsed.reference === "string" || parsed.reference === null) setReference(parsed.reference);
      if (Array.isArray(parsed.history)) setHistory(parsed.history);
      if (typeof parsed.genreId === "string") setGenreId(parsed.genreId);
      if (parsed.style)      setStyle(parsed.style);
      if (parsed.mode === "image" || parsed.mode === "video") setMode(parsed.mode);
      if (typeof parsed.videoAspect === "string")     setVideoAspect(parsed.videoAspect);
      if (typeof parsed.videoResolution === "string") setVideoResolution(parsed.videoResolution);
      if (typeof parsed.videoDuration === "number")   setVideoDuration(parsed.videoDuration);
      if (parsed.advanced)   setAdvanced(parsed.advanced);
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify({
          config, aspect, resolution, reference, history, genreId, style,
          mode, videoAspect, videoResolution, videoDuration, advanced,
        }));
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [config, aspect, resolution, reference, history, genreId, style,
      mode, videoAspect, videoResolution, videoDuration, advanced]);

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

  // Effective aspect/resolution depend on mode — video has its own
  // axis set (no 21:9 / no 1k‑4k), so we route accordingly when
  // composing the payload AND when the user clicks aspect/quality.
  const effectiveAspect      = mode === "video" ? videoAspect      : aspect;
  const effectiveResolution  = mode === "video" ? videoResolution  : resolution;
  const cost = useMemo(
    () => computeCinemaCost({
      mode,
      duration:   mode === "video" ? videoDuration : undefined,
      resolution: effectiveResolution,
    }),
    [mode, videoDuration, effectiveResolution],
  );

  const onShoot = async () => {
    if (!prompt.trim() || isGenerating) return;

    const finalPrompt = buildCinemaPrompt({
      basePrompt: prompt,
      cameraId:   config.cameraId,
      lensId:     config.lensId,
      focal:      config.focal,
      apertureId: config.apertureId,
      genreId,
      paletteId:  style.paletteId,
      lightingId: style.lightingId,
      movesetId:  style.movesetId,
    });

    const endpoint = resolveCinemaEndpoint({ mode, hasReference: !!reference });

    // Image vs video have different payload shapes. Kling expects
    // `duration` (and `image_url` when seeded), nano-banana takes
    // `aspect_ratio` + `resolution`.
    // Combine the default safety-net negative prompt with whatever the
    // user added in advanced settings. Order matters: Higgsfield-style
    // models give earlier tokens more weight.
    const DEFAULT_NEG = "blurry, low quality, distortion, bad composition";
    const negative_prompt = advanced.negativePrompt.trim()
      ? `${DEFAULT_NEG}, ${advanced.negativePrompt.trim()}`
      : DEFAULT_NEG;

    const payload: Record<string, unknown> = {
      prompt:          finalPrompt,
      aspect_ratio:    effectiveAspect,
      negative_prompt,
    };
    if (typeof advanced.seed === "number") payload.seed = advanced.seed;

    if (mode === "video") {
      payload.duration   = videoDuration;
      payload.resolution = videoResolution;        // "720p" | "1080p"
      if (reference) payload.image_url = reference;
    } else {
      payload.resolution = resolution;             // "1k" | "2k" | "4k"
      if (reference) payload.images_list = [reference];
    }

    setIsGenerating(true);
    setProgress(mode === "video" ? "جاري إنشاء الفيديو…" : "جاري التوليد…");

    try {
      const { result } = await runMuapiTool({
        toolId:      "cinema-studio",
        endpoint,
        payload,
        overrideCredits: cost,
        inputsForDb: {
          prompt, ...config,
          mode,
          aspect: effectiveAspect,
          resolution: effectiveResolution,
          duration:   mode === "video" ? videoDuration : undefined,
          reference,
        },
        pollOptions: {
          onStatus: (s) => setProgress(statusToArabic(s, mode)),
        },
      });

      const url = pickUrl(result);
      if (!url) throw new Error("لم يتم استلام الناتج");

      const shot: CinemaShot = {
        id:        crypto.randomUUID(),
        url,
        mode,
        timestamp: Date.now(),
        prompt,
        config:    {
          ...config,
          aspect:     effectiveAspect,
          resolution: effectiveResolution,
          duration:   mode === "video" ? videoDuration : undefined,
          reference:  reference ?? undefined,
          genreId,
          paletteId:  style.paletteId,
          lightingId: style.lightingId,
          movesetId:  style.movesetId,
        },
      };
      setHistory((h) => [shot, ...h].slice(0, HISTORY_LIMIT));
      toast.success(mode === "video" ? "تم تصوير الفيديو 🎬" : "تم تصوير اللقطة 🎬");
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
    // Per-mode aspect/resolution restore so flipping the toggle later
    // brings back the right axis values.
    const shotMode = shot.mode ?? "image";
    setMode(shotMode);
    if (shotMode === "video") {
      setVideoAspect(shot.config.aspect);
      setVideoResolution(shot.config.resolution);
      if (typeof shot.config.duration === "number") setVideoDuration(shot.config.duration);
    } else {
      setAspect(shot.config.aspect);
      setResolution(shot.config.resolution);
    }
    if (shot.config.reference) setReference(shot.config.reference);
    if (shot.config.genreId)    setGenreId(shot.config.genreId);
    if (shot.config.paletteId || shot.config.lightingId || shot.config.movesetId) {
      setStyle({
        paletteId:  shot.config.paletteId  ?? CINEMA_DEFAULTS.paletteId,
        lightingId: shot.config.lightingId ?? CINEMA_DEFAULTS.lightingId,
        movesetId:  shot.config.movesetId  ?? CINEMA_DEFAULTS.movesetId,
      });
    }
    toast.success("تم استرجاع الإعدادات");
  };

  // ── AI Director hand-off ──────────────────────────────────────────────
  // The sidebar returns a pick set; we replace state with whatever the
  // model chose (only fields it filled). The user can still tweak any
  // chip after — the picker overlays read directly from this state.
  const applyDirectorPicks = (picks: DirectorPicks) => {
    if (picks.prompt)     setPrompt(picks.prompt);
    if (picks.cameraId || picks.lensId || picks.focal !== undefined || picks.apertureId) {
      setConfig((c) => ({
        cameraId:   picks.cameraId   ?? c.cameraId,
        lensId:     picks.lensId     ?? c.lensId,
        focal:      picks.focal      ?? c.focal,
        apertureId: picks.apertureId ?? c.apertureId,
      }));
    }
    if (picks.aspect)     setAspect(picks.aspect);
    if (picks.resolution) setResolution(picks.resolution);
    if (picks.genreId)    setGenreId(picks.genreId);
    if (picks.paletteId || picks.lightingId || picks.movesetId) {
      setStyle((s) => ({
        paletteId:  picks.paletteId  ?? s.paletteId,
        lightingId: picks.lightingId ?? s.lightingId,
        movesetId:  picks.movesetId  ?? s.movesetId,
      }));
    }
  };

  // ── render ────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-[calc(100vh-80px)] pb-72 sm:pb-56 md:pb-40">
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
                {shot.mode === "video" ? (
                  <video
                    src={shot.url}
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={shot.url} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setFullscreen({ url: shot.url, mode: shot.mode ?? "image" })}
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
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {shot.mode === "video" && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-violet-500/90 text-white flex items-center gap-1">
                      <VideoIcon className="w-2.5 h-2.5" />
                      {shot.config.duration ? `${shot.config.duration}s` : "فيديو"}
                    </span>
                  )}
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
      <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-5 pointer-events-none" dir="rtl">
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <div className="bento-card rounded-3xl border border-white/10 p-3 md:p-4 backdrop-blur-2xl bg-black/60 shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
            {/* Mode segmented control — Image / Video. Mirrors Higgsfield's
                Cinema Studio toggle. Persists per side so flipping doesn't
                reset the user's selections. */}
            <div className="flex items-center gap-1 mb-3 p-1 rounded-2xl border border-white/10 bg-white/[0.02] w-fit">
              <ModeTab
                active={mode === "image"}
                onClick={() => setMode("image")}
                icon={<ImageIcon className="w-3.5 h-3.5" />}
                label="صورة"
              />
              <ModeTab
                active={mode === "video"}
                onClick={() => setMode("video")}
                icon={<VideoIcon className="w-3.5 h-3.5" />}
                label="فيديو"
              />
            </div>

            <div className="flex flex-col gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === "video" ? "اوصف الفيديو السينمائي اللي عاوزه..." : "اوصف مشهدك السينمائي..."}
                rows={2}
                className="w-full bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none px-1 text-right"
                style={{ maxHeight: 160 }}
                dir="rtl"
              />

              <div className="flex items-center gap-2 flex-wrap">
                {/* AI prompt enhancer — auto-expands the user's text. */}
                <EnhancePromptButton
                  prompt={prompt}
                  variant="cinema"
                  onResult={setPrompt}
                  disabled={isGenerating}
                />
                {/* AI Director — opens the right-side chat sidebar that
                    picks every Cinema setting from a natural-language
                    prompt. Same pattern Higgsfield exposes. */}
                <button
                  onClick={() => setDirectorOpen(true)}
                  type="button"
                  className="h-10 px-3 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5"
                  title="افتح المخرج الذكي"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">المخرج الذكي</span>
                </button>

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

                {/* Genre + Style preview chips. Both open full overlays;
                    each chip shows the active pick(s) in its label so
                    the user always knows what's wired in. */}
                <PickerChip
                  icon={<Drama className="w-3.5 h-3.5" />}
                  label="نوع"
                  value={GENRES.find((g) => g.id === genreId)?.name ?? "عام"}
                  onClick={() => setGenreOpen(true)}
                />
                <PickerChip
                  icon={<Palette className="w-3.5 h-3.5" />}
                  label="أسلوب"
                  value={summarizeStyle(style)}
                  onClick={() => setStyleOpen(true)}
                />

                {/* aspect dropdown — mode-aware (image gets 21:9 etc, video doesn't) */}
                <SelectChip
                  label="نسبة"
                  value={effectiveAspect}
                  options={(mode === "video" ? CINEMA_VIDEO_ASPECTS : CINEMA_ASPECTS)
                    .map((a) => ({ value: a.id, label: a.label }))}
                  onChange={(v) => mode === "video" ? setVideoAspect(v) : setAspect(v)}
                />
                <SelectChip
                  label="جودة"
                  value={effectiveResolution}
                  options={(mode === "video" ? CINEMA_VIDEO_RESOLUTIONS : CINEMA_RESOLUTIONS)
                    .map((r) => ({ value: r.id, label: r.label }))}
                  onChange={(v) => mode === "video" ? setVideoResolution(v) : setResolution(v)}
                />
                {/* Duration chip — video mode only */}
                {mode === "video" && (
                  <SelectChip
                    label="مدة"
                    value={String(videoDuration)}
                    options={CINEMA_VIDEO_DURATIONS.map((d) => ({ value: String(d.id), label: d.label }))}
                    onChange={(v) => setVideoDuration(Number(v))}
                  />
                )}

                {/* Advanced settings (negative prompt + seed) */}
                <AdvancedSettingsChip value={advanced} onClick={() => setAdvancedOpen(true)} />

                {/* camera summary card — collapses to icon-only on
                    very narrow screens so the rest of the chips have
                    room to breathe. */}
                <button
                  onClick={() => setOverlayOpen(true)}
                  className="flex-1 min-w-0 sm:min-w-[180px] flex items-center gap-3 px-3.5 h-10 rounded-xl border border-white/10 hover:bg-white/[0.03] transition-colors"
                  type="button"
                >
                  <img src={camera.thumbnail} alt="" className="w-7 h-7 rounded-md object-cover border border-white/10 shrink-0" />
                  <div className="flex-1 text-right min-w-0 hidden sm:block">
                    <div className="text-[10px] text-gray-500">{camera.englishName}</div>
                    <div className="text-xs font-bold text-white truncate">
                      {lens.englishName} · {focal.label} · {aperture.id}
                    </div>
                  </div>
                  <Camera className="w-4 h-4 text-gray-500 shrink-0" />
                </button>

                {/* shoot button — full-width on the smallest screens so
                    it always reads as the primary CTA. Inline cost
                    badge mirrors Higgsfield's "GENERATE +96.80" UX. */}
                <button
                  onClick={onShoot}
                  disabled={!prompt.trim() || isGenerating}
                  className={cn(
                    "h-10 px-5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all w-full sm:w-auto whitespace-nowrap",
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
                      {mode === "video" ? "صوّر فيديو" : "صوّر"}
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
      </div>

      {/* Camera settings overlay */}
      <CameraSettingsOverlay
        open={overlayOpen}
        config={config}
        onChange={setConfig}
        onClose={() => setOverlayOpen(false)}
      />

      {/* Genre + Style overlays + AI Director sidebar */}
      <GenrePicker
        open={genreOpen}
        value={genreId}
        onChange={setGenreId}
        onClose={() => setGenreOpen(false)}
      />
      <StylePicker
        open={styleOpen}
        value={style}
        onChange={setStyle}
        onClose={() => setStyleOpen(false)}
      />
      <AiDirectorSidebar
        open={directorOpen}
        onApply={applyDirectorPicks}
        onClose={() => setDirectorOpen(false)}
      />
      <AdvancedSettingsModal
        open={advancedOpen}
        value={advanced}
        onChange={setAdvanced}
        onClose={() => setAdvancedOpen(false)}
        fields={["negativePrompt", "seed"]}
        suggestedNegativePrompt="blurry, low quality, distortion, bad composition, text, watermark"
      />

      {/* Fullscreen — handles both images and videos */}
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
            {fullscreen.mode === "video" ? (
              <video
                src={fullscreen.url}
                controls
                autoPlay
                loop
                className="max-w-full max-h-full rounded-2xl"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={fullscreen.url} alt="" className="max-w-full max-h-full object-contain rounded-2xl" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────

function statusToArabic(s: string, mode: CinemaMode = "image"): string {
  const verb = mode === "video" ? "إنشاء الفيديو" : "التوليد";
  switch (s) {
    case "queued":
    case "pending":    return "في قائمة الانتظار…";
    case "processing":
    case "running":    return `جاري ${verb}…`;
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

// ── Mode segmented control (Image / Video) ─────────────────────────────
function ModeTab({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "h-8 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all",
        active
          ? "bg-accent-400 text-black shadow-[0_0_24px_rgba(254,228,64,0.35)]"
          : "text-gray-300 hover:text-white hover:bg-white/5",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ── chip that opens an overlay (genre / style) ─────────────────────────
function PickerChip({
  icon, label, value, onClick,
}: {
  icon:    React.ReactNode;
  label:   string;
  value:   string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/[0.03] text-xs font-bold text-white flex items-center gap-1.5 transition-colors max-w-[180px]"
    >
      <span className="text-gray-400">{icon}</span>
      <span className="text-gray-500">{label}:</span>
      <span className="truncate">{value}</span>
    </button>
  );
}

// Summarise the active style picks for the chip label. "Auto" means
// the model is free to choose; we surface only the layers the user
// has explicitly tweaked.
function summarizeStyle(s: StyleValue): string {
  const parts: string[] = [];
  const palette  = COLOR_PALETTES.find((p) => p.id === s.paletteId);
  const lighting = LIGHTING_STYLES.find((l) => l.id === s.lightingId);
  const moveset  = MOVESETS.find((m)        => m.id === s.movesetId);
  if (palette  && palette.id  !== "auto") parts.push(palette.name);
  if (lighting && lighting.id !== "auto") parts.push(lighting.name);
  if (moveset  && moveset.id  !== "auto") parts.push(moveset.name);
  return parts.length === 0 ? "تلقائي" : parts.slice(0, 2).join("، ") + (parts.length > 2 ? "…" : "");
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
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const active = options.find((o) => o.value === value);

  useEffect(() => { setMounted(true); }, []);

  // Recompute the dropdown's absolute position whenever it opens —
  // anchored above the trigger so it works regardless of where the
  // chip ends up on the page.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = 220;
    const left = Math.max(8, Math.min(window.innerWidth - dropdownWidth - 8, rect.right - dropdownWidth));
    const bottom = window.innerHeight - rect.top + 8;
    setPos({ left, bottom });
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/[0.03] text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
        type="button"
      >
        <span className="text-gray-500">{label}:</span>
        {active?.label ?? value}
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>
      {open && mounted && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="fixed z-[90] min-w-[200px] bg-bg-primary border border-white/10 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-1 max-h-72 overflow-y-auto"
            style={{ left: pos.left, bottom: pos.bottom, width: 220 }}
          >
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
        </>,
        document.body,
      )}
    </div>
  );
}
