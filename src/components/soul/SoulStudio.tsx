"use client";

// ════════════════════════════════════════════════════════════════
// Soul 2.0 Studio — main page
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's Soul 2.0 page:
//
//   • Hero header with the giant SOUL2 wordmark
//   • Generation history (gallery) below the hero
//   • Bottom shoot bar with the 4 axes:
//       1. Prompt (textbox + [+] for one-off Soul Reference image)
//       2. Mood Board chip   → opens MoodboardPicker
//       3. Color Signature   → opens ColorSignaturePicker
//       4. Soul ID character → opens SoulIDPicker
//     + utility chips: aspect / quality / variations / enhance toggle / generate
//
// Persistence: shoot-bar state + last 50 shots are saved to localStorage
// so refreshing keeps everything intact (matches what Cinema Studio does).

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, X, Loader2, Download, Maximize2, Plus, Image as ImageIcon,
  ChevronDown, Palette, User, Wand2, Aperture,
} from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  MOODBOARDS, COLOR_PALETTES, SOUL_ASPECTS, SOUL_QUALITIES, SOUL_DEFAULTS,
} from "@/lib/data/soul";
import { uploadFile } from "@/lib/muapi";
import { MoodboardPicker } from "./MoodboardPicker";
import { BuildMoodboardModal } from "./BuildMoodboardModal";
import { ColorSignaturePicker, type ColorPick } from "./ColorSignaturePicker";
import { SoulIDPicker } from "./SoulIDPicker";
import type { SoulConfig, SoulShot, SoulMoodboardRow, SoulCharacterRow } from "./types";
import { EnhancePromptButton } from "@/components/studio-shared/EnhancePromptButton";
import { RefineButton } from "@/components/studio-shared/RefineButton";
import {
  AdvancedSettingsModal, AdvancedSettingsChip, ADVANCED_DEFAULTS,
  type AdvancedSettings,
} from "@/components/studio-shared/AdvancedSettingsModal";

const PERSIST_KEY = "yilow_soul_studio_v1";
const HISTORY_LIMIT = 50;

export function SoulStudio() {
  // ── State ──────────────────────────────────────────────────────────
  const [config, setConfig] = useState<SoulConfig>({
    prompt:        "",
    moodboardId:   SOUL_DEFAULTS.moodboardId,
    paletteId:     SOUL_DEFAULTS.paletteId,
    characterId:   null,
    aspect:        SOUL_DEFAULTS.aspect,
    quality:       SOUL_DEFAULTS.quality,
    variations:    SOUL_DEFAULTS.variations,
    enhancePrompt: SOUL_DEFAULTS.enhancePrompt,
    referenceUrl:  null,
    customPaletteHexes: null,
  });
  const [history,  setHistory]  = useState<SoulShot[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress,   setProgress]   = useState("");
  const [fullscreen, setFullscreen] = useState<string | null>(null);
  const [uploadingRef, setUploadingRef] = useState(false);
  // Advanced settings (negative prompt / seed / style strength) —
  // hidden behind a chip so the main shoot bar stays clean.
  const [advanced, setAdvanced] = useState<AdvancedSettings>(ADVANCED_DEFAULTS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [refUploadProgress, setRefUploadProgress] = useState(0);

  // Modal toggles
  const [moodOpen,  setMoodOpen]  = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [charOpen,  setCharOpen]  = useState(false);

  // User-saved moodboards/characters loaded once at mount so we can
  // resolve their labels in the chip without re-fetching.
  const [userMoodboards, setUserMoodboards] = useState<SoulMoodboardRow[]>([]);
  const [userCharacters, setUserCharacters] = useState<SoulCharacterRow[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Persistence ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PERSIST_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<{
        config: SoulConfig;
        history: SoulShot[];
        advanced: AdvancedSettings;
      }>;
      if (parsed.config)               setConfig(parsed.config);
      if (Array.isArray(parsed.history)) setHistory(parsed.history);
      if (parsed.advanced)               setAdvanced(parsed.advanced);
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify({ config, history, advanced }));
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [config, history, advanced]);

  // Refresh user moodboards/characters lists at mount + after each modal
  // closes (cheap, gives instant chip-label updates after creating one).
  useEffect(() => {
    fetch("/api/tools/soul/moodboards", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => Array.isArray(d.moodboards) && setUserMoodboards(d.moodboards))
      .catch(() => {});
    fetch("/api/tools/soul/characters", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => Array.isArray(d.characters) && setUserCharacters(d.characters))
      .catch(() => {});
  }, [moodOpen, charOpen, buildOpen]);

  // ── Derived chip labels (Arabic-first) ─────────────────────────────
  const moodboardLabel = useMemo(() => {
    const curated = MOODBOARDS.find((m) => m.id === config.moodboardId);
    if (curated) return curated.name;
    const mine = userMoodboards.find((m) => m.id === config.moodboardId);
    return mine?.name ?? "عام";
  }, [config.moodboardId, userMoodboards]);

  const moodboardThumb = useMemo(() => {
    const curated = MOODBOARDS.find((m) => m.id === config.moodboardId);
    if (curated) return curated.thumbnail;
    const mine = userMoodboards.find((m) => m.id === config.moodboardId);
    return mine?.thumbnail ?? null;
  }, [config.moodboardId, userMoodboards]);

  const colorLabel = useMemo(() => {
    if (config.customPaletteHexes && config.customPaletteHexes.length > 0) return "مخصصة";
    const palette = COLOR_PALETTES.find((p) => p.id === config.paletteId);
    return palette?.name ?? "تلقائي";
  }, [config.paletteId, config.customPaletteHexes]);

  const characterLabel = useMemo(() => {
    if (!config.characterId) return null;
    return userCharacters.find((c) => c.id === config.characterId)?.name ?? null;
  }, [config.characterId, userCharacters]);

  const characterThumb = useMemo(() => {
    if (!config.characterId) return null;
    return userCharacters.find((c) => c.id === config.characterId)?.thumbnail ?? null;
  }, [config.characterId, userCharacters]);

  // ── Handlers ───────────────────────────────────────────────────────
  const onColorChange = (next: ColorPick) => {
    setConfig((c) => ({
      ...c,
      paletteId:          next.paletteId,
      customPaletteHexes: next.hexes,
    }));
  };

  const onPickReference = async (file: File) => {
    setUploadingRef(true);
    setRefUploadProgress(0);
    try {
      const { url } = await uploadFile(file, (p) => setRefUploadProgress(p));
      setConfig((c) => ({ ...c, referenceUrl: url }));
      toast.success("تم رفع الصورة المرجعية");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الرفع");
    } finally {
      setUploadingRef(false);
      setRefUploadProgress(0);
    }
  };

  const onGenerate = async () => {
    if (!config.prompt.trim() || generating) return;
    setGenerating(true);
    setProgress("جاري إرسال الطلب…");
    try {
      const r = await fetch("/api/tools/soul/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:               config.prompt,
          moodboardId:          config.moodboardId,
          paletteId:            config.paletteId || undefined,
          characterId:          config.characterId ?? undefined,
          aspect_ratio:         config.aspect,
          quality:              config.quality,
          num_outputs:          config.variations,
          enhance_prompt:       config.enhancePrompt,
          custom_palette_hexes: config.customPaletteHexes ?? undefined,
          reference_url:        config.referenceUrl ?? undefined,
          // Advanced reference-parity controls
          negative_prompt:           advanced.negativePrompt.trim() || undefined,
          seed:                      advanced.seed,
          style_strength:            advanced.styleStrength,
          custom_reference_strength: advanced.customReferenceStrength,
          use_refiner:               advanced.useRefiner,
        }),
      });
      setProgress("جاري التوليد…");
      const data = await r.json();
      if (!r.ok || !data.url) throw new Error(data.error || "فشل التوليد");

      const shot: SoulShot = {
        id:           crypto.randomUUID(),
        generationId: typeof data.generationId === "string" ? data.generationId : undefined,
        url:          data.url,
        timestamp:    Date.now(),
        prompt:       config.prompt,
        config:       { ...config },
      };
      setHistory((h) => [shot, ...h].slice(0, HISTORY_LIMIT));
      toast.success("تم التوليد ✨");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setGenerating(false);
      setProgress("");
    }
  };

  const restore = (s: SoulShot) => {
    setConfig(s.config);
    toast.success("تم استرجاع الإعدادات");
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-[calc(100vh-80px)] pb-72 sm:pb-56 md:pb-44">
      {/* Hero */}
      <div className="relative pt-12 md:pt-16 pb-10 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-400/30 bg-accent-400/5 text-accent-400 text-xs font-black mb-5">
          <Aperture className="w-3 h-3" />
          Soul
        </div>
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-accent-400 mb-4 tracking-tight">
          SOUL
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
          صور إديتوريال فاشن بحس ثقافي حديث. اختار موود بورد ولوحة ألوان وشخصية ثابتة.
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
              <div className="relative aspect-[3/4] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setFullscreen(shot.url)}
                    className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80 transition-colors"
                    type="button"
                    aria-label="ملء الشاشة"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                  </button>
                  <a
                    href={shot.url} download target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80 transition-colors"
                    aria-label="تنزيل"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                  </a>
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
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {shot.refined && (
                    <span
                      className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/90 text-black flex items-center gap-1"
                      title="مُحسّنة"
                    >
                      ✨ مُحسّنة
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-accent-400/90 text-black">
                    {MOODBOARDS.find((m) => m.id === shot.config.moodboardId)?.englishName
                      ?? userMoodboards.find((m) => m.id === shot.config.moodboardId)?.name
                      ?? "Custom"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => restore(shot)}
                className="w-full text-right p-3 hover:bg-white/[0.03] transition-colors"
                type="button"
              >
                <p className="text-xs text-white font-bold line-clamp-2 mb-1">{shot.prompt}</p>
                <p className="text-[10px] text-gray-500">
                  {shot.config.aspect} · {shot.config.quality}
                </p>
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-12 px-4">
          <div className="w-20 h-20 rounded-full border-2 border-accent-400/30 bg-accent-400/5 flex items-center justify-center mb-5">
            <Sparkles className="w-10 h-10 text-accent-400" />
          </div>
          <p className="text-white text-base sm:text-lg font-bold mb-1">صورتك الأولى تنتظرك</p>
          <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
            اوصف المشهد، اختار <span className="text-accent-400 font-bold">موود بورد</span> و
            <span className="text-accent-400 font-bold"> لوحة ألوان</span> و
            <span className="text-accent-400 font-bold"> شخصية</span>، واضغط
            <span className="text-accent-400 font-bold"> توليد</span>.
          </p>
        </div>
      )}

      {/* ── Bottom shoot bar ────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-5 pointer-events-none" dir="rtl">
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <div className="bento-card rounded-3xl border border-white/10 p-3 md:p-4 backdrop-blur-2xl bg-black/60 shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col gap-3">
              {/* Prompt row — textarea + inline reference upload */}
              <div className="flex items-start gap-2">
                {/* Reference upload (one-off Soul Reference image) */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickReference(f); e.target.value = ""; }}
                />
                {config.referenceUrl ? (
                  <div className="relative w-10 h-10 rounded-xl border border-accent-400/40 overflow-hidden group shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={config.referenceUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setConfig((c) => ({ ...c, referenceUrl: null }))}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      type="button" aria-label="إزالة الصورة"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingRef}
                    type="button"
                    aria-label="إضافة صورة مرجعية"
                    className="w-10 h-10 shrink-0 rounded-xl border border-white/10 hover:bg-white/5 flex items-center justify-center transition-colors"
                  >
                    {uploadingRef ? (
                      <div className="relative">
                        <Loader2 className="w-4 h-4 animate-spin text-accent-400" />
                        <span className="absolute -bottom-3.5 right-1/2 translate-x-1/2 text-[8px] text-accent-400">
                          {refUploadProgress}%
                        </span>
                      </div>
                    ) : <Plus className="w-4 h-4 text-gray-300" />}
                  </button>
                )}

                <textarea
                  value={config.prompt}
                  onChange={(e) => setConfig((c) => ({ ...c, prompt: e.target.value }))}
                  placeholder="اوصف المشهد اللي عاوز تصوّره"
                  rows={2}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none px-1 text-right"
                  style={{ maxHeight: 160 }}
                  dir="rtl"
                />
                <EnhancePromptButton
                  prompt={config.prompt}
                  variant="soul"
                  onResult={(enhanced) => setConfig((c) => ({ ...c, prompt: enhanced }))}
                  disabled={generating}
                  compact
                  className="shrink-0"
                />
              </div>

              {/* Chips row — primary axes + utility */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Soul model badge (display-only, future-proofing for
                    the model picker) */}
                <span className="h-10 px-3 rounded-xl border border-white/10 bg-accent-400/8 text-accent-400 text-xs font-black flex items-center gap-1.5">
                  <Aperture className="w-3.5 h-3.5" /> Soul
                </span>

                {/* Aspect */}
                <SelectChip
                  icon={<span className="text-[11px] font-mono">📱</span>}
                  label={config.aspect}
                  options={SOUL_ASPECTS.map((a) => ({ value: a.id, label: a.label }))}
                  onChange={(v) => setConfig((c) => ({ ...c, aspect: v }))}
                />
                {/* Quality */}
                <SelectChip
                  icon={<span className="text-[11px]">♥</span>}
                  label={config.quality}
                  options={SOUL_QUALITIES.map((q) => ({ value: q.id, label: q.label }))}
                  onChange={(v) => setConfig((c) => ({ ...c, quality: v }))}
                />
                {/* Enhance prompt toggle */}
                <button
                  onClick={() => setConfig((c) => ({ ...c, enhancePrompt: !c.enhancePrompt }))}
                  type="button"
                  className={cn(
                    "h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors",
                    config.enhancePrompt
                      ? "border-accent-400/40 bg-accent-400/10 text-accent-400"
                      : "border-white/10 text-gray-400 hover:bg-white/5",
                  )}
                  title="تعزيز البرومبت تلقائياً"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {config.enhancePrompt ? "تعزيز" : "بدون"}
                </button>
                {/* Variations counter */}
                <div className="h-10 px-2 rounded-xl border border-white/10 flex items-center gap-2">
                  <button
                    onClick={() => setConfig((c) => ({ ...c, variations: Math.max(1, c.variations - 1) }))}
                    type="button"
                    className="w-6 h-6 rounded-lg text-gray-300 hover:bg-white/10 flex items-center justify-center"
                    aria-label="نقص"
                  >−</button>
                  <span className="text-xs font-bold text-white tabular-nums w-7 text-center">
                    {config.variations}/4
                  </span>
                  <button
                    onClick={() => setConfig((c) => ({ ...c, variations: Math.min(4, c.variations + 1) }))}
                    type="button"
                    className="w-6 h-6 rounded-lg text-gray-300 hover:bg-white/10 flex items-center justify-center"
                    aria-label="زيادة"
                  >+</button>
                </div>

                {/* Color signature chip */}
                <button
                  onClick={() => setColorOpen(true)}
                  type="button"
                  className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/[0.03] text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                  title="Soul HEX — لوحة الألوان"
                >
                  <Palette className="w-3.5 h-3.5 text-accent-400" />
                  <span className="truncate max-w-[120px]">{colorLabel}</span>
                </button>

                {/* Advanced settings (negative prompt / seed / style strength) */}
                <AdvancedSettingsChip value={advanced} onClick={() => setAdvancedOpen(true)} />

                {/* Spacer pushes the right group out */}
                <div className="flex-1" />

                {/* Soul ID character chip */}
                <button
                  onClick={() => setCharOpen(true)}
                  type="button"
                  className={cn(
                    "h-12 px-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-colors min-w-[60px]",
                    config.characterId
                      ? "border-accent-400/40 bg-accent-400/8"
                      : "border-white/10 hover:bg-white/[0.03]",
                  )}
                  title="Soul ID — الشخصية"
                >
                  {characterThumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={characterThumb} alt="" className="w-5 h-5 rounded-md object-cover" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-gray-300" />
                  )}
                  <span className="text-[8px] text-gray-400 font-bold tracking-wider truncate max-w-[60px]">
                    {characterLabel ?? "شخصية"}
                  </span>
                </button>

                {/* Mood Board chip — shows label + Change badge */}
                <button
                  onClick={() => setMoodOpen(true)}
                  type="button"
                  className="h-12 px-2 rounded-xl border border-white/10 hover:bg-white/[0.03] flex flex-col items-center justify-center gap-0.5 transition-colors min-w-[80px] relative overflow-hidden"
                  title="موود بورد"
                >
                  {moodboardThumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={moodboardThumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-0.5">
                    <span className="text-[8px] text-white/80 font-bold flex items-center gap-1">
                      <ChevronDown className="w-2.5 h-2.5" /> تغيير
                    </span>
                    <span className="text-[10px] font-black text-accent-400 tracking-wider truncate max-w-[80px]">
                      {moodboardLabel}
                    </span>
                  </div>
                </button>

                {/* Generate button */}
                <button
                  onClick={onGenerate}
                  disabled={!config.prompt.trim() || generating}
                  type="button"
                  className={cn(
                    "h-12 px-5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all w-full sm:w-auto",
                    !config.prompt.trim() || generating
                      ? "bg-white/5 text-gray-600 cursor-not-allowed"
                      : "bg-accent-400 text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_24px_rgba(254,228,64,0.35)]",
                  )}
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {progress || "جاري…"}</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> توليد</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Picker overlays */}
      <MoodboardPicker
        open={moodOpen}
        value={config.moodboardId}
        onChange={(id) => setConfig((c) => ({ ...c, moodboardId: id }))}
        onClose={() => setMoodOpen(false)}
        onBuildOwn={() => { setMoodOpen(false); setBuildOpen(true); }}
      />
      <BuildMoodboardModal
        open={buildOpen}
        onClose={() => setBuildOpen(false)}
        onSaved={(m) => {
          setUserMoodboards((arr) => [m, ...arr]);
          setConfig((c) => ({ ...c, moodboardId: m.id }));
        }}
      />
      <ColorSignaturePicker
        open={colorOpen}
        value={{
          paletteId: config.paletteId,
          hexes:     config.customPaletteHexes,
          reference: COLOR_PALETTES.find((p) => p.id === config.paletteId)?.reference ?? null,
        }}
        onChange={onColorChange}
        onClose={() => setColorOpen(false)}
      />
      <SoulIDPicker
        open={charOpen}
        value={config.characterId}
        onChange={(id) => setConfig((c) => ({ ...c, characterId: id }))}
        onClose={() => setCharOpen(false)}
      />
      <AdvancedSettingsModal
        open={advancedOpen}
        value={advanced}
        onChange={setAdvanced}
        onClose={() => setAdvancedOpen(false)}
        // Show the customReferenceStrength slider only when a Soul ID
        // is actually pinned — pointless to expose otherwise.
        fields={[
          "negativePrompt",
          "seed",
          "styleStrength",
          ...(config.characterId ? ["customReferenceStrength" as const] : []),
          "useRefiner",
        ]}
        suggestedNegativePrompt="blurry, low quality, plastic skin, distorted face, watermark, text, oversaturated"
      />

      {/* Fullscreen image viewer */}
      <AnimatePresence>
        {fullscreen && createPortal(
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setFullscreen(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
              onClick={() => setFullscreen(null)}
              type="button"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fullscreen} alt="" className="max-w-full max-h-full object-contain rounded-2xl" />
          </motion.div>,
          document.body,
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tiny portal-positioned select chip (shared with Cinema Studio
//    pattern but inlined here so the Soul module is self-contained)
function SelectChip({
  icon, label, options, onChange,
}: {
  icon:    React.ReactNode;
  label:   string;
  options: { value: string; label: string }[];
  onChange:(v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const active = options.find((o) => o.value === label);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const w = 220;
    setPos({
      left: Math.max(8, Math.min(window.innerWidth - w - 8, rect.right - w)),
      bottom: window.innerHeight - rect.top + 8,
    });
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        type="button"
        className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/[0.03] text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
      >
        {icon}
        {active?.label ?? label}
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>
      {open && mounted && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[180]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[190] bg-bg-primary border border-white/10 rounded-xl shadow-2xl p-1 max-h-72 overflow-y-auto"
            style={{ left: pos.left, bottom: pos.bottom, width: 220, backgroundColor: "#0a0a0f" }}
          >
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                type="button"
                className={cn(
                  "w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                  o.value === label
                    ? "bg-accent-400/15 text-accent-400"
                    : "text-gray-300 hover:bg-white/5",
                )}
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

// Suppress the unused-import warning — `ImageIcon` is not currently
// used but kept for future placeholder rendering.
void ImageIcon;
void User;
