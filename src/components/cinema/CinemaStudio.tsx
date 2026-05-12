"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, Sparkles, Camera, Image as ImageIcon, X, Loader2,
  Download, Maximize2, Plus, ChevronDown, Drama, Palette, Bot,
  Video as VideoIcon, Zap, Layers, Volume2, VolumeX, User, Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  CAMERAS, LENSES, FOCAL_LENGTHS, APERTURES,
  CINEMA_ASPECTS, CINEMA_RESOLUTIONS,
  CINEMA_VIDEO_ASPECTS, CINEMA_VIDEO_DURATIONS, CINEMA_VIDEO_RESOLUTIONS,
  CINEMA_DEFAULTS,
  GENRES, COLOR_PALETTES, LIGHTING_STYLES, MOVESETS,
  VARIANTS_OPTIONS, SPEEDRAMP_OPTIONS, CINEMA_VERSIONS,
  MULTI_SHOT_MODES, parseMultiShotPrompts,
  buildCinemaPrompt, resolveCinemaEndpointV2, computeCinemaCost,
  renderContactSheetPrompt, CONTACT_SHEET_DIMENSIONS,
  type CinemaMode, type CinemaVersionId,
} from "@/lib/data/cinema";
import { CameraSettingsOverlay, type CameraConfig } from "./CameraSettingsOverlay";
import { GenrePicker } from "./GenrePicker";
import { StylePicker, type StyleValue } from "./StylePicker";
import { AiDirectorSidebar, type DirectorPicks } from "./AiDirectorSidebar";
import { uploadFile } from "@/lib/muapi";
import { runMuapiTool } from "@/lib/run-tool";
import { EnhancePromptButton } from "@/components/studio-shared/EnhancePromptButton";
import { RefineButton } from "@/components/studio-shared/RefineButton";
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
  /** Server-side Generation row id — used by the Refiner to update the
   *  history record after upscaling. Optional for back-compat with v1. */
  generationId?: string;
  url:       string;
  /** Whether the saved url is a still image or a motion clip. Older
   *  rows (pre-video-mode) won't have this — they're always images. */
  mode?:     CinemaMode;
  /** When set, the shot has been run through the Refiner. */
  originalUrl?: string;
  refined?:     boolean;
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
  // reference-parity layers — each picker writes its id here. The
  // prompt builder treats "auto"/"general" as no-op so previous prompts
  // keep working until the user explicitly opts in.
  const [genreId,    setGenreId]    = useState<string>(CINEMA_DEFAULTS.genreId);
  const [style,      setStyle]      = useState<StyleValue>({
    paletteId:  CINEMA_DEFAULTS.paletteId,
    lightingId: CINEMA_DEFAULTS.lightingId,
    movesetId:  CINEMA_DEFAULTS.movesetId,
  });
  // ── reference-parity additions (Cinema 3.5 controls) ──────────────
  const [variants,         setVariants]         = useState<number>(CINEMA_DEFAULTS.variants);
  const [generateAudio,    setGenerateAudio]    = useState<boolean>(CINEMA_DEFAULTS.generateAudio);
  const [speedramp,        setSpeedramp]        = useState<string>(CINEMA_DEFAULTS.speedramp);
  const [versionId,        setVersionId]        = useState<CinemaVersionId>(CINEMA_DEFAULTS.versionId);
  const [multiShotMode,    setMultiShotMode]    = useState<string>(CINEMA_DEFAULTS.multiShotMode);
  const [multiShotPrompts, setMultiShotPrompts] = useState<string>(CINEMA_DEFAULTS.multiShotPrompts);
  // Soul ID character refs — array of character IDs the user has
  // pinned for this generation. Each becomes a "Featuring: <name>"
  // line in the final prompt + a thumbnail in `images_list`.
  const [characterIds, setCharacterIds] = useState<string[]>([]);
  const [characterCatalog, setCharacterCatalog] = useState<Array<{
    id: string; name: string; hintText: string | null; thumbnail: string | null; trained: boolean;
  }>>([]);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [characterPickerOpen, setCharacterPickerOpen] = useState(false);
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
        variants: number; generateAudio: boolean; speedramp: string;
        versionId: CinemaVersionId;
        multiShotMode: string; multiShotPrompts: string;
        characterIds: string[];
      }>;
      if (parsed.config)     setConfig(parsed.config);
      if (parsed.aspect)     setAspect(parsed.aspect);
      if (parsed.resolution) setResolution(parsed.resolution);
      if (typeof parsed.reference === "string" || parsed.reference === null) setReference(parsed.reference);
      if (Array.isArray(parsed.history)) setHistory(parsed.history);
      if (typeof parsed.genreId === "string") setGenreId(parsed.genreId);
      if (parsed.style)      setStyle(parsed.style);
      if (parsed.mode === "image" || parsed.mode === "video" || parsed.mode === "grid") setMode(parsed.mode);
      if (typeof parsed.videoAspect === "string")     setVideoAspect(parsed.videoAspect);
      if (typeof parsed.videoResolution === "string") setVideoResolution(parsed.videoResolution);
      if (typeof parsed.videoDuration === "number")   setVideoDuration(parsed.videoDuration);
      if (parsed.advanced)   setAdvanced(parsed.advanced);
      // reference-parity additions — restore each one if present.
      if (typeof parsed.variants === "number")         setVariants(parsed.variants);
      if (typeof parsed.generateAudio === "boolean")   setGenerateAudio(parsed.generateAudio);
      if (typeof parsed.speedramp === "string")        setSpeedramp(parsed.speedramp);
      if (typeof parsed.versionId === "string")        setVersionId(parsed.versionId as CinemaVersionId);
      if (typeof parsed.multiShotMode === "string")    setMultiShotMode(parsed.multiShotMode);
      if (typeof parsed.multiShotPrompts === "string") setMultiShotPrompts(parsed.multiShotPrompts);
      if (Array.isArray(parsed.characterIds))          setCharacterIds(parsed.characterIds);
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify({
          config, aspect, resolution, reference, history, genreId, style,
          mode, videoAspect, videoResolution, videoDuration, advanced,
          variants, generateAudio, speedramp, versionId,
          multiShotMode, multiShotPrompts, characterIds,
        }));
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [config, aspect, resolution, reference, history, genreId, style,
      mode, videoAspect, videoResolution, videoDuration, advanced,
      variants, generateAudio, speedramp, versionId,
      multiShotMode, multiShotPrompts, characterIds]);

  // ── Lazy-load the user's Soul Character catalog when the picker is
  // first opened (or referenced characters need resolving for the
  // current generation). Cached in component state across reopens. */
  useEffect(() => {
    if (!characterPickerOpen && characterIds.length === 0) return;
    if (characterCatalog.length > 0) return;
    setCharactersLoading(true);
    fetch("/api/tools/soul/characters", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.characters)) {
          setCharacterCatalog(d.characters.map((c: { id: string; name: string; hintText?: string | null; thumbnail?: string | null; trained?: boolean }) => ({
            id:        c.id,
            name:      c.name,
            hintText:  c.hintText ?? null,
            thumbnail: c.thumbnail ?? null,
            trained:   c.trained ?? false,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setCharactersLoading(false));
  }, [characterPickerOpen, characterIds.length, characterCatalog.length]);

  // Resolved character objects for the active selection (used by the
  // chip preview above the textarea + by onShoot for prompt enrichment).
  const selectedCharacters = useMemo(
    () => characterIds
      .map((id) => characterCatalog.find((c) => c.id === id))
      .filter((c): c is typeof characterCatalog[number] => !!c),
    [characterIds, characterCatalog],
  );

  // ── derived ───────────────────────────────────────────────────────────
  // All lookups use a fallback to the catalog default. This protects
  // against stale localStorage values from a previous catalog version
  // (we just migrated 6 cameras → 4, 11 lenses → 6, etc — old IDs
  // like "warm-cinema-prime" wouldn't be found).
  const camera   = useMemo(() => CAMERAS.find((c) => c.id === config.cameraId) ?? CAMERAS[0]!, [config.cameraId]);
  const lens     = useMemo(() => LENSES.find((l)  => l.id === config.lensId)   ?? LENSES[0]!,   [config.lensId]);
  const focal    = useMemo(() => FOCAL_LENGTHS.find((f) => f.id === config.focal) ?? FOCAL_LENGTHS[2]!, [config.focal]);
  const aperture = useMemo(() => APERTURES.find((a) => a.id === config.apertureId) ?? APERTURES[3]!, [config.apertureId]);

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
  // Effective shot count = N variants for single-prompt mode, OR one
  // generation per multi-shot prompt line. We display this in the cost
  // badge so the user sees the real total before clicking.
  // When multi-shot mode is ON, we parse the prompt textarea by line
  // — each non-empty line is one shot. Otherwise we just repeat the
  // single prompt N times where N = variants.
  const multiShotPromptList = useMemo(
    () => multiShotMode === "custom" ? parseMultiShotPrompts(prompt) : [],
    [multiShotMode, prompt],
  );
  const effectiveShotCount = multiShotPromptList.length > 0 ? multiShotPromptList.length : variants;

  const cost = useMemo(
    () => computeCinemaCost({
      mode,
      duration:   mode === "video" ? videoDuration : undefined,
      resolution: effectiveResolution,
    }) * effectiveShotCount,
    [mode, videoDuration, effectiveResolution, effectiveShotCount],
  );

  const onShoot = async () => {
    if (!prompt.trim() || isGenerating) return;

    // Grid (Contact Sheet) mode requires a reference image — the
    // 9-shot template needs a subject/scene to riff on.
    if (mode === "grid" && !reference) {
      toast.error("Contact Sheet يحتاج صورة مرجعية للشخصية أو المشهد.");
      return;
    }

    // Endpoint resolver is version-aware: 3.5 → kling-v3.0-pro,
    // 3.0 → kling-v2.6-pro, 2.5 → kling-v2.1-pro, Soul Cinema → same
    // as 3.5 with a Soul descriptor stitched into the prompt.
    const endpoint = resolveCinemaEndpointV2({
      mode,
      hasReference: !!reference,
      versionId,
    });

    const DEFAULT_NEG = "blurry, low quality, distortion, bad composition";
    const negative_prompt = advanced.negativePrompt.trim()
      ? `${DEFAULT_NEG}, ${advanced.negativePrompt.trim()}`
      : DEFAULT_NEG;

    // Build the list of prompts to fan out:
    //   • Grid mode → always 1 call (the template renders all 9 shots)
    //   • Multi-shot mode → use each non-empty line as its own prompt
    //   • Otherwise → repeat the single prompt N times (variants)
    const basePrompts = mode === "grid"
      ? [prompt.trim()]
      : multiShotPromptList.length > 0
        ? multiShotPromptList
        : Array.from({ length: variants }, () => prompt.trim());

    setIsGenerating(true);
    setProgress(
      mode === "grid"
        ? "جاري إنشاء Contact Sheet (٩ لقطات)…"
        : effectiveShotCount > 1
          ? `جاري التوليد… (1/${effectiveShotCount})`
          : (mode === "video" ? "جاري إنشاء الفيديو…" : "جاري التوليد…")
    );

    try {
      // Build the character-reference fragment once for all variants
      // (same characters apply to every shot in this batch). When the
      // user has pinned 1+ Soul Characters via the @ picker, we:
      //   1. Append "Featuring: <names>" + each character's hintText
      //      to the prompt, so the model knows who the subjects are.
      //   2. Add each character's main thumbnail to images_list so
      //      the model has visual reference for identity consistency.
      const characterFragment = selectedCharacters.length > 0
        ? [
            `Featuring: ${selectedCharacters.map((c) => c.name).join(", ")}.`,
            ...selectedCharacters.map((c) => c.hintText).filter((h): h is string => !!h),
          ].join(" ")
        : "";
      const characterThumbs = selectedCharacters
        .map((c) => c.thumbnail)
        .filter((t): t is string => !!t);

      // Fan out N parallel calls. Track completion to update progress.
      let completed = 0;
      const results = await Promise.allSettled(basePrompts.map(async (basePrompt, idx) => {
        // Compose the per-shot base prompt with the character
        // fragment (if any). For grid mode, the character context
        // becomes additional direction inside the contact-sheet
        // template; for image/video, it's stitched at the head.
        const promptWithCharacters = characterFragment
          ? `${basePrompt}. ${characterFragment}`
          : basePrompt;

        // Grid mode uses the verbatim 9-shot Contact Sheet template
        // — the user's prompt becomes "additional direction" appended
        // to the template's standing 9-cell brief.
        const finalPrompt = mode === "grid"
          ? renderContactSheetPrompt({
              aspectRatio:         effectiveAspect,
              additionalDirection: promptWithCharacters,
            })
          : buildCinemaPrompt({
              basePrompt: promptWithCharacters,
              cameraId:   config.cameraId,
              lensId:     config.lensId,
              focal:      config.focal,
              apertureId: config.apertureId,
              genreId,
              paletteId:  style.paletteId,
              lightingId: style.lightingId,
              movesetId:  style.movesetId,
            });

        const payload: Record<string, unknown> = {
          prompt:          finalPrompt,
          aspect_ratio:    mode === "grid" ? "9:16" : effectiveAspect, // contact sheet defaults to 9:16 portrait
          negative_prompt,
        };
        if (typeof advanced.seed === "number") {
          // Stagger the seed per variant so we don't get identical outputs.
          payload.seed = advanced.seed + idx;
        }
        if (mode === "video") {
          payload.duration       = videoDuration;
          payload.resolution     = videoResolution;
          payload.generate_audio = generateAudio;
          payload.speedramp      = speedramp;
          // Video models accept a single image_url. Character refs
          // for video mode live only in the prompt (visual reference
          // would need a multi-input video model — not yet wired).
          if (reference) payload.image_url = reference;
        } else if (mode === "grid") {
          // Contact sheet renders at 4K to keep each cell legible.
          payload.resolution  = "4k";
          payload.width       = CONTACT_SHEET_DIMENSIONS["3x3"].width;
          payload.height      = CONTACT_SHEET_DIMENSIONS["3x3"].height;
          // Reference is required — checked above. Character thumbs
          // get merged in so the model has visual identity refs.
          payload.images_list = [reference!, ...characterThumbs];
        } else {
          payload.resolution = resolution;
          // Combine the user's reference (if any) with any pinned
          // character thumbnails — image-edit models accept the full
          // images_list array as multi-image conditioning.
          const imagesList = [
            ...(reference ? [reference] : []),
            ...characterThumbs,
          ];
          if (imagesList.length > 0) payload.images_list = imagesList;
        }

        const { result, generationId } = await runMuapiTool({
          toolId:      "cinema-studio",
          endpoint,
          payload,
          overrideCredits: computeCinemaCost({
            mode,
            duration:   mode === "video" ? videoDuration : undefined,
            resolution: effectiveResolution,
          }),
          inputsForDb: {
            prompt: basePrompt, ...config,
            mode,
            aspect: effectiveAspect,
            resolution: effectiveResolution,
            duration:   mode === "video" ? videoDuration : undefined,
            reference,
            versionId,
            generateAudio: mode === "video" ? generateAudio : undefined,
            speedramp:     mode === "video" ? speedramp     : undefined,
            variantIndex: idx,
            multiShot:    multiShotPromptList.length > 0,
          },
          pollOptions: {
            onStatus: (s) => {
              if (effectiveShotCount > 1) {
                setProgress(`جاري التوليد… (${completed + 1}/${effectiveShotCount}) — ${statusToArabic(s, mode)}`);
              } else {
                setProgress(statusToArabic(s, mode));
              }
            },
          },
        });

        completed += 1;

        const url = pickUrl(result);
        if (!url) throw new Error("لم يتم استلام الناتج");

        const shot: CinemaShot = {
          id:        crypto.randomUUID(),
          generationId,
          url,
          mode,
          timestamp: Date.now(),
          prompt: basePrompt,
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
        return shot;
      }));

      // Collect successful shots in order (newest first added to history).
      const newShots = results
        .filter((r): r is PromiseFulfilledResult<CinemaShot> => r.status === "fulfilled")
        .map((r) => r.value);
      const failures = results.filter((r) => r.status === "rejected").length;

      if (newShots.length > 0) {
        setHistory((h) => [...newShots, ...h].slice(0, HISTORY_LIMIT));
      }
      if (failures > 0 && newShots.length === 0) {
        const firstReject = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
        throw firstReject.reason;
      }
      if (newShots.length > 0) {
        const verb = mode === "video" ? "فيديو" : mode === "grid" ? "Contact Sheet" : "لقطة";
        if (newShots.length === 1) {
          const noun = mode === "video"
            ? "الفيديو"
            : mode === "grid"
              ? "الـ Contact Sheet (٩ لقطات)"
              : "اللقطة";
          toast.success(`تم تصوير ${noun} 🎬`);
        } else {
          toast.success(`تم تصوير ${newShots.length} ${verb}${failures > 0 ? ` (فشل ${failures})` : ""} 🎬`);
        }
      }
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
                  {/* Refine — image mode only. MuAPI's upscaler is image-only. */}
                  {shot.mode !== "video" && (
                    <RefineButton
                      url={shot.url}
                      generationId={shot.generationId}
                      refined={shot.refined}
                      onResult={({ url, originalUrl }) => {
                        setHistory((h) => h.map((s) =>
                          s.id === shot.id
                            ? { ...s, url, originalUrl: s.originalUrl ?? originalUrl, refined: true }
                            : s,
                        ));
                      }}
                    />
                  )}
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {shot.refined && (
                    <span
                      className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/90 text-black"
                      title="مُحسّنة"
                    >
                      ✨ مُحسّنة
                    </span>
                  )}
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
            {/* Mode segmented control — Image / Video / Grid (contact sheet).
                Persists per side so flipping doesn't reset selections. */}
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
              <ModeTab
                active={mode === "grid"}
                onClick={() => setMode("grid")}
                icon={<Layers className="w-3.5 h-3.5" />}
                label="٩ لقطات"
              />
            </div>

            <div className="flex flex-col gap-3">
              {/* Pinned-character chips above the textarea — show
                  the user which Soul Characters are wired in for this
                  shot. Each chip has an X to unpin. */}
              {selectedCharacters.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className="text-gray-500 font-bold">@ شخصيات:</span>
                  {selectedCharacters.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-400/15 border border-accent-400/30 text-accent-400 font-bold"
                    >
                      {c.thumbnail && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={c.thumbnail} alt="" className="w-4 h-4 rounded object-cover" />
                      )}
                      {c.name}
                      <button
                        onClick={() => setCharacterIds((ids) => ids.filter((id) => id !== c.id))}
                        type="button"
                        className="ml-0.5 opacity-70 hover:opacity-100"
                        aria-label={`إزالة ${c.name}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  multiShotMode === "custom"
                    ? "اكتب لقطاتك — كل سطر = لقطة منفصلة..."
                    : mode === "grid"
                      ? "اوصف الشخصية أو المشهد للـ Contact Sheet (نولّد 9 لقطات سينمائية مختلفة من نفس المشهد)..."
                      : mode === "video"
                        ? "اوصف الفيديو السينمائي اللي عاوزه..."
                        : "اوصف مشهدك السينمائي..."
                }
                rows={multiShotMode === "custom" ? 5 : 2}
                className="w-full bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none px-1 text-right"
                style={{ maxHeight: multiShotMode === "custom" ? 280 : 160 }}
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
                    prompt. Same pattern the reference exposes. */}
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

                {/* @ Character picker — pin Soul Characters to this
                    shoot. Each picked character gets injected into the
                    prompt + their thumbnail merged into images_list
                    (where the model accepts multi-image conditioning). */}
                <CharacterPickerChip
                  count={characterIds.length}
                  onClick={() => setCharacterPickerOpen((o) => !o)}
                />

                {/* aspect dropdown — mode-aware (image gets 21:9 etc, video doesn't) */}
                <SelectChip
                  label="نسبة"
                  value={effectiveAspect}
                  options={(mode === "video" ? CINEMA_VIDEO_ASPECTS : CINEMA_ASPECTS)
                    .map((a) => ({ value: a.id, label: a.label }))}
                  onChange={(v) => mode === "video" ? setVideoAspect(v) : setAspect(v)}
                />
                {/* Quality chip — hidden in grid mode (contact sheet is
                    always rendered at 4K to keep cells legible) */}
                {mode !== "grid" && (
                  <SelectChip
                    label="جودة"
                    value={effectiveResolution}
                    options={(mode === "video" ? CINEMA_VIDEO_RESOLUTIONS : CINEMA_RESOLUTIONS)
                      .map((r) => ({ value: r.id, label: r.label }))}
                    onChange={(v) => mode === "video" ? setVideoResolution(v) : setResolution(v)}
                  />
                )}
                {/* Duration chip — video mode only */}
                {mode === "video" && (
                  <SelectChip
                    label="مدة"
                    value={String(videoDuration)}
                    options={CINEMA_VIDEO_DURATIONS.map((d) => ({ value: String(d.id), label: d.label }))}
                    onChange={(v) => setVideoDuration(Number(v))}
                  />
                )}

                {/* ── reference-parity controls ─────────────────────── */}

                {/* Cinema version selector — 3.5 / 3.0 / 2.5 / Soul */}
                <SelectChip
                  label="الإصدار"
                  value={versionId}
                  options={CINEMA_VERSIONS.map((v) => ({ value: v.id, label: v.label }))}
                  onChange={(v) => setVersionId(v as CinemaVersionId)}
                />

                {/* Variants counter — 1 to 4. Hidden when multi-shot
                    is active (multi-shot already controls fan-out) or
                    in grid mode (single render produces 9 shots). */}
                {multiShotMode === "disabled" && mode !== "grid" && (
                  <SelectChip
                    label="العدد"
                    value={String(variants)}
                    options={VARIANTS_OPTIONS.map((v) => ({ value: String(v.id), label: v.label }))}
                    onChange={(v) => setVariants(Number(v))}
                  />
                )}

                {/* Multi-shot toggle. When ON, each line in the prompt
                    becomes its own shot (parallel fan-out). Hidden in
                    grid mode (the contact sheet template already
                    handles 9 shots in a single render). */}
                {mode !== "grid" && (
                  <button
                    onClick={() => setMultiShotMode(multiShotMode === "disabled" ? "custom" : "disabled")}
                    type="button"
                    className={cn(
                      "h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors",
                      multiShotMode === "custom"
                        ? "bg-accent-400/15 border-accent-400/40 text-accent-400"
                        : "border-white/10 text-gray-300 hover:bg-white/[0.03]",
                    )}
                    title={multiShotMode === "custom"
                      ? "Multi-shot ON — كل سطر = لقطة منفصلة"
                      : "Multi-shot OFF — اضغط للتفعيل"}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Multi-shot</span>
                    {multiShotMode === "custom" && multiShotPromptList.length > 0 && (
                      <span className="text-[10px] opacity-75">({multiShotPromptList.length})</span>
                    )}
                  </button>
                )}

                {/* Audio toggle — video mode only. Maps to
                    `generate_audio: true` in the Cinema 3.5 payload. */}
                {mode === "video" && (
                  <button
                    onClick={() => setGenerateAudio(!generateAudio)}
                    type="button"
                    className={cn(
                      "h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors",
                      generateAudio
                        ? "bg-accent-400/15 border-accent-400/40 text-accent-400"
                        : "border-white/10 text-gray-300 hover:bg-white/[0.03]",
                    )}
                    title={generateAudio ? "صوت تلقائي مفعّل" : "بدون صوت"}
                  >
                    {generateAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">صوت</span>
                  </button>
                )}

                {/* Speedramp dropdown — video mode only */}
                {mode === "video" && (
                  <SelectChip
                    label="السرعة"
                    value={speedramp}
                    options={SPEEDRAMP_OPTIONS.map((s) => ({ value: s.id, label: s.label }))}
                    onChange={setSpeedramp}
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
                  <CameraThumb camera={camera} />
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
                    badge mirrors the reference platform's "GENERATE +96.80" UX. */}
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
                      {mode === "video" ? "صوّر فيديو" : mode === "grid" ? "إنشاء Contact Sheet" : "صوّر"}
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

      <CharactersPopover
        open={characterPickerOpen}
        catalog={characterCatalog}
        loading={charactersLoading}
        selectedIds={characterIds}
        onToggle={(id) => {
          setCharacterIds((ids) =>
            ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
          );
        }}
        onClear={() => setCharacterIds([])}
        onClose={() => setCharacterPickerOpen(false)}
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
  const verb = mode === "video"
    ? "إنشاء الفيديو"
    : mode === "grid"
      ? "إنشاء الـ Contact Sheet"
      : "التوليد";
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

// ── Camera thumbnail with graceful fallback ────────────────────────────
// the reference platform's Cinema 3.5 catalog ships with thumbnails for each preset
// at /cinema/cameras/<slug>.webp. We don't have those visual assets yet
// (would need to be generated/sourced separately) — so when the img
// 404s we show a flat coloured chip with the english initial instead
// of the broken-image icon.
function CameraThumb({ camera }: { camera: { thumbnail: string; englishName: string } }) {
  const [errored, setErrored] = useState(false);
  if (errored || !camera.thumbnail) {
    const initial = camera.englishName.charAt(0).toUpperCase();
    return (
      <div
        className="w-7 h-7 rounded-md border border-white/10 shrink-0 flex items-center justify-center bg-gradient-to-br from-white/[0.08] to-white/[0.02] text-gray-300 text-[10px] font-black"
        aria-hidden
      >
        {initial}
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={camera.thumbnail}
      alt=""
      className="w-7 h-7 rounded-md object-cover border border-white/10 shrink-0"
      onError={() => setErrored(true)}
    />
  );
}

// ── Character picker chip — opens a Soul Character popover ────────────
// Displays a button with the count of pinned characters (or just the
// @ icon when none picked). The actual popover lives at the page level
// (rendered conditionally by the parent) so positioning + outside-click
// behave consistently with the other floating chips.
function CharacterPickerChip({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors",
        count > 0
          ? "bg-accent-400/15 border-accent-400/40 text-accent-400"
          : "border-white/10 text-gray-300 hover:bg-white/[0.03]",
      )}
      title="ضع شخصيات Soul ID في المشهد"
    >
      <User className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">شخصيات</span>
      {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
    </button>
  );
}

// ── Characters popover — multi-select Soul Character picker ──────────
// Centred modal listing the user's Soul Characters as toggleable tiles.
// Sits at z-[80] (above the bottom shoot bar but under fullscreen
// overlays). Each tile shows the character's avatar + name + a check
// when picked. Header has a "Clear all" link + a CTA to create new
// characters at /soul/characters.
function CharactersPopover({
  open, catalog, loading, selectedIds, onToggle, onClear, onClose,
}: {
  open:        boolean;
  catalog:     Array<{ id: string; name: string; thumbnail: string | null; trained: boolean }>;
  loading:     boolean;
  selectedIds: string[];
  onToggle:    (id: string) => void;
  onClear:     () => void;
  onClose:     () => void;
}) {
  // Close on Escape — matches every other overlay in this studio.
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-2xl bg-[#0a0a0f] border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-[0_-12px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
            style={{ maxHeight: "82vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-6 rounded-full bg-accent-400" />
                <div>
                  <h3 className="text-white font-bold text-base">شخصيات Soul ID</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">اختر شخصية واحدة أو أكثر — هتتدمج في كل لقطة</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedIds.length > 0 && (
                  <button
                    onClick={onClear}
                    className="h-8 px-2.5 rounded-lg text-[11px] text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    type="button"
                  >
                    إزالة الكل
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
                  type="button"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading && (
                <div className="flex items-center justify-center py-14 text-gray-500 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري تحميل الشخصيات…
                </div>
              )}
              {!loading && catalog.length === 0 && (
                <div className="text-center py-14">
                  <div className="w-14 h-14 mx-auto rounded-full border border-accent-400/30 bg-accent-400/5 flex items-center justify-center mb-4">
                    <User className="w-6 h-6 text-accent-400" />
                  </div>
                  <p className="text-white text-sm font-bold mb-1">مفيش شخصيات Soul ID لسه</p>
                  <p className="text-gray-500 text-xs max-w-xs mx-auto mb-4">
                    اعمل شخصية جديدة من Soul Studio — هتقدر تستخدمها في كل لقطة سينمائية بثبات.
                  </p>
                  <a
                    href="/soul"
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-accent-400 text-black text-xs font-black hover:scale-[1.02] active:scale-95 transition-transform"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    اعمل شخصية جديدة
                  </a>
                </div>
              )}
              {!loading && catalog.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {catalog.map((c) => {
                    const picked = selectedIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => onToggle(c.id)}
                        type="button"
                        className={cn(
                          "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group",
                          picked
                            ? "border-accent-400 shadow-[0_0_20px_rgba(254,228,64,0.35)]"
                            : "border-white/10 hover:border-white/30",
                        )}
                      >
                        {c.thumbnail ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={c.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex items-center justify-center">
                            <User className="w-10 h-10 text-gray-500" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        {picked && (
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-accent-400 text-black flex items-center justify-center shadow-lg">
                            <Check className="w-4 h-4" strokeWidth={3} />
                          </div>
                        )}
                        {!c.trained && (
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-500/90 text-black">
                            تدريب…
                          </span>
                        )}
                        <div className="absolute bottom-0 inset-x-0 p-2.5 text-right">
                          <div className="text-white text-xs font-black truncate">{c.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-500 flex-shrink-0">
              <span>
                {selectedIds.length === 0
                  ? "اختياري — مفيد للحفاظ على شخصية ثابتة"
                  : `${selectedIds.length} شخصية مختارة`}
              </span>
              <button
                onClick={onClose}
                className="h-8 px-3 rounded-lg bg-accent-400/15 border border-accent-400/40 text-accent-400 text-[11px] font-bold hover:bg-accent-400/25 transition-colors"
                type="button"
              >
                تم
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
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
