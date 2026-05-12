"use client";

// ════════════════════════════════════════════════════════════════
// AI Influencer Studio — character-builder workspace
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's `/ai-influencer-studio` page:
//
//   • Hero header with "Create Your AI Influencer"
//   • 4 panel tabs (Core / Face / Body / Style) — Core always visible
//     by default, the other three open as accordions
//   • Each subcategory renders as a chip grid (single-select radio
//     OR multi-select checkbox depending on `selection`)
//   • Bottom shoot bar: aspect / quality / generate
//   • Generation history grid

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, X, Maximize2, Download, ChevronDown, RefreshCw, Users } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  INFLUENCER_PANELS, INFLUENCER_DEFAULTS, INFLUENCER_ASPECTS, INFLUENCER_RESOLUTIONS,
  INFLUENCER_COST, TOTAL_INFLUENCER_OPTIONS, composeInfluencerPrompt,
  INFLUENCER_PRESETS, applyInfluencerPreset,
  type InfluencerConfig, type InfluencerSubcategory,
} from "@/lib/data/ai-influencer";

const PERSIST_KEY    = "yilow_ai_influencer_studio_v1";
const HISTORY_LIMIT  = 30;

interface InfluencerShot {
  id:          string;
  url:         string;
  prompt:      string;
  config:      InfluencerConfig;
  aspectRatio: string;
  resolution:  string;
  timestamp:   number;
}

export function AiInfluencerStudio() {
  // ── state ─────────────────────────────────────────────────────────
  const [config, setConfig]         = useState<InfluencerConfig>(INFLUENCER_DEFAULTS);
  const [aspectRatio, setAspectRatio] = useState<string>(INFLUENCER_ASPECTS[0]!.id);
  const [resolution, setResolution]   = useState<string>(INFLUENCER_RESOLUTIONS[0]!.id);
  const [activePanel, setActivePanel] = useState<string>("core");
  const [generating, setGenerating]   = useState(false);
  const [progress, setProgress]       = useState("");
  const [history, setHistory]         = useState<InfluencerShot[]>([]);
  const [fullscreen, setFullscreen]   = useState<string | null>(null);

  // ── persistence ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PERSIST_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<{
        config:       InfluencerConfig;
        aspectRatio:  string;
        resolution:   string;
        activePanel:  string;
        history:      InfluencerShot[];
      }>;
      if (parsed.config)      setConfig({ ...INFLUENCER_DEFAULTS, ...parsed.config });
      if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
      if (parsed.resolution)  setResolution(parsed.resolution);
      if (parsed.activePanel) setActivePanel(parsed.activePanel);
      if (Array.isArray(parsed.history)) setHistory(parsed.history);
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify({
          config, aspectRatio, resolution, activePanel, history,
        }));
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [config, aspectRatio, resolution, activePanel, history]);

  // ── derived ───────────────────────────────────────────────────────
  const previewPrompt = useMemo(() => composeInfluencerPrompt(config), [config]);
  const pickedCount   = useMemo(() => Object.values(config).filter((v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)).length, [config]);

  // ── handlers ──────────────────────────────────────────────────────
  const onPickSingle = (subId: string, optId: string) => {
    setConfig((c) => ({ ...c, [subId]: c[subId] === optId ? undefined : optId }));
  };
  const onToggleMulti = (subId: string, optId: string) => {
    setConfig((c) => {
      const cur = (c[subId] as string[] | undefined) ?? [];
      const next = cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId];
      return { ...c, [subId]: next.length > 0 ? next : undefined };
    });
  };
  const onResetDefaults = () => {
    setConfig(INFLUENCER_DEFAULTS);
    toast.success("تم إعادة الإعدادات الافتراضية");
  };

  const onGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setProgress("جاري بناء الشخصية…");
    try {
      const r = await fetch("/api/tools/ai-influencer/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ config, aspect_ratio: aspectRatio, resolution }),
      });
      const data = await r.json();
      if (!r.ok || !data.url) throw new Error(data.error || "فشل التوليد");
      const shot: InfluencerShot = {
        id:          crypto.randomUUID(),
        url:         data.url,
        prompt:      data.finalPrompt ?? previewPrompt,
        config:      { ...config },
        aspectRatio,
        resolution,
        timestamp:   Date.now(),
      };
      setHistory((h) => [shot, ...h].slice(0, HISTORY_LIMIT));
      toast.success("تم توليد الشخصية ✨");
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
          <Users className="w-3 h-3" />
          AI Influencer Studio
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-[1.4] max-w-3xl mx-auto">
          ابني <span className="text-accent-400">شخصيتك الافتراضية</span> الكاملة
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-3">
          {TOTAL_INFLUENCER_OPTIONS} اختيار عبر {INFLUENCER_PANELS.length} لوحات — اختار كل تفصيلة وعالم AI ينفذها بدقة.
        </p>
        <p className="text-[11px] text-gray-600">
          اخترت <span className="text-accent-400 font-bold">{pickedCount}</span> من {INFLUENCER_PANELS.reduce((s, p) => s + p.subcategories.length, 0)} حقل
        </p>
      </div>

      {/* Yilow-original presets row — quick-start kick */}
      <div className="max-w-5xl mx-auto px-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">انطلق بسرعة</span>
          <div className="flex-1 h-px bg-white/[0.05]" />
        </div>
        <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar">
          {INFLUENCER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setConfig((c) => applyInfluencerPreset(c, preset));
                toast.success(`اتحمّل: ${preset.nameAr}`);
              }}
              className="shrink-0 w-44 text-right rounded-2xl border border-white/10 bg-white/[0.02] hover:border-accent-400/40 hover:bg-white/[0.05] transition overflow-hidden"
              title={preset.tagline}
            >
              <div className="aspect-[4/5] bg-black/40 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preset.thumbnail}
                  alt={preset.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Graceful fallback if the preset asset hasn't been
                    // uploaded yet — show a colored placeholder.
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="p-2.5">
                <div className="text-xs font-bold text-white">{preset.nameAr}</div>
                <div className="text-[10px] text-gray-500 truncate">{preset.tagline}</div>
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setConfig(INFLUENCER_DEFAULTS)}
            className="shrink-0 w-44 text-right rounded-2xl border border-dashed border-white/10 hover:border-white/30 bg-transparent flex flex-col items-center justify-center p-4 text-xs text-gray-400 hover:text-white"
            title="ابدأ من البداية"
          >
            <RefreshCw className="w-4 h-4 mb-1.5" />
            ابدأ من جديد
          </button>
        </div>
      </div>

      {/* Panel tabs */}
      <div className="max-w-5xl mx-auto px-4 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {INFLUENCER_PANELS.map((panel) => {
            const isActive = activePanel === panel.id;
            const Icon = panel.icon;
            return (
              <button
                key={panel.id}
                onClick={() => setActivePanel(panel.id)}
                type="button"
                className={cn(
                  "h-11 px-4 rounded-2xl border text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap",
                  isActive
                    ? "bg-accent-400 text-black border-accent-400 shadow-[0_0_24px_rgba(254,228,64,0.35)]"
                    : "bg-white/[0.03] text-gray-300 border-white/10 hover:bg-white/[0.06]",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{panel.name}</span>
                <span className={cn("text-[10px] opacity-70", isActive ? "text-black/70" : "text-gray-500")}>({panel.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active panel content */}
      <div className="max-w-5xl mx-auto px-4 mb-8">
        <PanelContent
          subcategories={INFLUENCER_PANELS.find((p) => p.id === activePanel)?.subcategories ?? []}
          config={config}
          onPickSingle={onPickSingle}
          onToggleMulti={onToggleMulti}
        />
      </div>

      {/* Prompt preview (collapsible) */}
      <details className="max-w-5xl mx-auto px-4 mb-6 group">
        <summary className="cursor-pointer text-[11px] text-gray-500 hover:text-white font-bold list-none flex items-center gap-1.5">
          <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
          معاينة الـprompt المولّد ({previewPrompt.length} حرف)
        </summary>
        <div className="mt-2 p-3 rounded-xl border border-white/10 bg-black/40 text-[11px] text-gray-400 leading-relaxed font-mono whitespace-pre-wrap text-left" dir="ltr">
          {previewPrompt}
        </div>
      </details>

      {/* History gallery */}
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
              <div className="relative aspect-[3/4] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-4">
          <p className="text-gray-500 text-xs">شخصيتك الأولى تنتظرك — اضغط <span className="text-accent-400 font-bold">إنشاء</span></p>
        </div>
      )}

      {/* Bottom shoot bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-5 pointer-events-none" dir="rtl">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <div className="bento-card rounded-3xl border border-white/10 p-3 backdrop-blur-2xl bg-black/60 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] flex items-center gap-2 flex-wrap">
            {/* Aspect */}
            <SimpleSelect
              label="النسبة"
              value={aspectRatio}
              options={INFLUENCER_ASPECTS.map((a) => ({ value: a.id, label: a.label }))}
              onChange={setAspectRatio}
            />
            {/* Quality */}
            <SimpleSelect
              label="الجودة"
              value={resolution}
              options={INFLUENCER_RESOLUTIONS.map((r) => ({ value: r.id, label: r.label }))}
              onChange={setResolution}
            />
            {/* Reset */}
            <button
              onClick={onResetDefaults}
              type="button"
              className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/[0.03] text-[11px] font-bold text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
              title="استعادة الإعدادات الافتراضية"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">افتراضي</span>
            </button>
            <div className="flex-1" />
            {/* Generate */}
            <button
              onClick={onGenerate}
              disabled={generating}
              type="button"
              className={cn(
                "h-10 px-5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all",
                generating
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
                  <span className="text-[10px] opacity-75 px-1.5 py-0.5 rounded bg-black/20">{INFLUENCER_COST}</span>
                </>
              )}
            </button>
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

// ── Panel content — renders all subcategories of one panel ────────
function PanelContent({
  subcategories, config, onPickSingle, onToggleMulti,
}: {
  subcategories: InfluencerSubcategory[];
  config:        InfluencerConfig;
  onPickSingle:  (subId: string, optId: string) => void;
  onToggleMulti: (subId: string, optId: string) => void;
}) {
  return (
    <div className="space-y-6">
      {subcategories.map((sub) => (
        <SubcategorySection
          key={sub.id}
          sub={sub}
          value={config[sub.id]}
          onPickSingle={(optId) => onPickSingle(sub.id, optId)}
          onToggleMulti={(optId) => onToggleMulti(sub.id, optId)}
        />
      ))}
    </div>
  );
}

function SubcategorySection({
  sub, value, onPickSingle, onToggleMulti,
}: {
  sub:           InfluencerSubcategory;
  value:         string | string[] | undefined;
  onPickSingle:  (optId: string) => void;
  onToggleMulti: (optId: string) => void;
}) {
  const isPicked = (optId: string) => {
    if (sub.selection === "multi") {
      return Array.isArray(value) && value.includes(optId);
    }
    return value === optId;
  };

  // Categories with visual hints (thumbnail / swatch on at least one
  // option) OR explicitly opted-in via display:"card" render as a
  // card grid. Plain text-only categories (gender, age, rendering
  // style — matching Higgsfield's UI) keep the compact-chip layout.
  const useCards = sub.display === "card" || sub.options.some(
    (o) => o.thumbnail || o.swatch,
  );

  return (
    <section>
      <header className="flex items-baseline justify-between mb-2.5">
        <div>
          <h4 className="text-white font-black text-sm leading-tight">{sub.name}</h4>
          <p className="text-[10px] text-gray-500 mt-0.5">{sub.englishName}{sub.hint ? ` — ${sub.hint}` : ""}</p>
        </div>
        <span className="text-[10px] text-gray-500 font-bold">
          {sub.selection === "multi" ? "متعدد" : "واحد"}
        </span>
      </header>

      {useCards ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {sub.options.map((o) => {
            const picked = isPicked(o.id);
            return (
              <button
                key={o.id}
                onClick={() => sub.selection === "multi" ? onToggleMulti(o.id) : onPickSingle(o.id)}
                type="button"
                className={cn(
                  "relative rounded-xl overflow-hidden border transition-all group",
                  picked
                    ? "border-accent-400 shadow-[0_0_18px_rgba(254,228,64,0.35)]"
                    : "border-white/10 hover:border-white/30",
                )}
              >
                {/* Visual area: thumbnail > swatch > label-only fallback */}
                <div className={cn(
                  "aspect-square flex items-center justify-center",
                  o.thumbnail ? "bg-black/40" :
                  o.swatch    ? "" :
                  "bg-gradient-to-br from-white/[0.03] to-white/[0.06]",
                )}
                style={o.swatch ? { backgroundColor: o.swatch } : undefined}
                >
                  {o.thumbnail && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={o.thumbnail}
                      alt={o.label}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                  {!o.thumbnail && !o.swatch && (
                    <span className="text-base font-bold text-gray-300 px-2 text-center leading-tight select-none">
                      {o.label}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div className={cn(
                  "px-2 py-1.5 text-[10px] font-bold leading-tight text-right",
                  picked
                    ? "bg-accent-400 text-black"
                    : "bg-black/40 text-gray-200 group-hover:bg-white/[0.04]",
                )}>
                  {o.label}
                </div>

                {/* Selected checkmark */}
                {picked && (
                  <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-accent-400 text-black flex items-center justify-center text-xs font-black shadow">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {sub.options.map((o) => {
            const picked = isPicked(o.id);
            return (
              <button
                key={o.id}
                onClick={() => sub.selection === "multi" ? onToggleMulti(o.id) : onPickSingle(o.id)}
                type="button"
                className={cn(
                  "h-8 px-3 rounded-lg text-[11px] font-bold transition-all border",
                  picked
                    ? "bg-accent-400 text-black border-accent-400 shadow-[0_0_12px_rgba(254,228,64,0.35)]"
                    : "bg-white/[0.03] text-gray-300 border-white/10 hover:bg-white/[0.06] hover:border-white/20",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Tiny inline select — same look as other studio chips ──────────
function SimpleSelect({
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
            className="absolute bottom-full mb-2 right-0 z-[90] min-w-[180px] bg-bg-primary border border-white/10 rounded-xl shadow-2xl p-1"
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
