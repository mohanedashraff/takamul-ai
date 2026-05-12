"use client";

// ════════════════════════════════════════════════════════════════
// AI Director sidebar — "describe what you want" picks every setting
// ════════════════════════════════════════════════════════════════
// Right-side slide-in panel with a chat input. The user types a scene
// description; we POST to /api/cinema-director and apply the picks the
// model returns (camera, lens, focal, aperture, genre, palette, lighting,
// moveset, aspect, resolution + an enhanced prompt).
//
// Apart from the initial conversation seed, this is intentionally a
// one-shot interaction — the user submits a prompt, sees the picks
// rendered as chips, and confirms with "تطبيق". Multi-turn refinement
// can come later.

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Sparkles, Send, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  CAMERAS, LENSES, FOCAL_LENGTHS, APERTURES,
  GENRES, COLOR_PALETTES, LIGHTING_STYLES, MOVESETS,
  CINEMA_ASPECTS, CINEMA_RESOLUTIONS,
} from "@/lib/data/cinema";

export interface DirectorPicks {
  prompt?:     string;
  cameraId?:   string;
  lensId?:     string;
  focal?:      number;
  apertureId?: string;
  genreId?:    string;
  paletteId?:  string;
  lightingId?: string;
  movesetId?:  string;
  aspect?:     string;
  resolution?: string;
  /** One-line rationale the model gives — surfaced under the picks. */
  rationale?:  string;
}

interface Props {
  open:    boolean;
  onApply: (picks: DirectorPicks) => void;
  onClose: () => void;
}

const SUGGESTIONS = [
  "بطل أكشن يجري في وسط مدينة في ٢٠٧٥",
  "طفلة تطفئ الشمعة في يوم ميلادها",
  "مشهد رومانسي على شاطئ غروب",
  "كاميرا تعدّي شارع نيون بالليل",
];

export function AiDirectorSidebar({ open, onApply, onClose }: Props) {
  const [text,    setText]    = useState("");
  const [busy,    setBusy]    = useState(false);
  const [picks,   setPicks]   = useState<DirectorPicks | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Esc → close, focus → input on open
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    setTimeout(() => inputRef.current?.focus(), 200);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setPicks(null);
    try {
      const res = await fetch("/api/cinema-director", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ description: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل المخرج الذكي");
      setPicks(data.picks as DirectorPicks);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    if (!picks) return;
    onApply(picks);
    toast.success("تم تطبيق اختيارات المخرج 🎬");
    onClose();
    // Reset after closing so next open is fresh.
    setTimeout(() => { setText(""); setPicks(null); }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-[110] w-full sm:w-[420px] bg-[#0a0a0f] border-l border-white/10 shadow-[-12px_0_60px_rgba(0,0,0,0.6)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-violet-300" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm leading-tight">المخرج الذكي</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">يختار الإعدادات بدلاً منك</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
                type="button"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4 text-gray-300" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Intro / suggestions */}
              {!picks && !busy && (
                <>
                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
                    <p className="text-sm text-violet-200 leading-relaxed">
                      اوصف المشهد اللي عاوز تصوّره — وأنا أختارلك الكاميرا والعدسة والإضاءة والمود المناسب أوتوماتيكياً.
                    </p>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2">جرّب</div>
                    <div className="flex flex-col gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setText(s)}
                          type="button"
                          className="text-right text-xs text-gray-300 px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Loading */}
              {busy && (
                <div className="py-12 flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-300" />
                  <p className="text-sm text-gray-400 text-center">المخرج بيختار الإعدادات…</p>
                </div>
              )}

              {/* Picks summary */}
              {picks && !busy && (
                <div className="space-y-4">
                  {picks.rationale && (
                    <div className="rounded-2xl border border-accent-400/20 bg-accent-400/5 p-4">
                      <div className="flex items-center gap-1.5 mb-2 text-accent-400 text-[10px] font-bold uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" /> رؤية المخرج
                      </div>
                      <p className="text-sm text-white leading-relaxed">{picks.rationale}</p>
                    </div>
                  )}

                  {picks.prompt && (
                    <PickRow label="البرومبت" value={picks.prompt} />
                  )}
                  <PickRow label="النوع"      value={GENRES.find((g) => g.id === picks.genreId)?.name} />
                  <PickRow label="الكاميرا"   value={CAMERAS.find((c) => c.id === picks.cameraId)?.name} />
                  <PickRow label="العدسة"     value={LENSES.find((l) => l.id === picks.lensId)?.name} />
                  <PickRow
                    label="الطول البؤري"
                    value={picks.focal != null ? `${picks.focal}mm` : undefined}
                  />
                  <PickRow label="الفتحة"     value={picks.apertureId} />
                  <PickRow label="لوحة الألوان" value={COLOR_PALETTES.find((p) => p.id === picks.paletteId)?.name} />
                  <PickRow label="الإضاءة"    value={LIGHTING_STYLES.find((l) => l.id === picks.lightingId)?.name} />
                  <PickRow label="حركة الكاميرا" value={MOVESETS.find((m) => m.id === picks.movesetId)?.name} />
                  <PickRow
                    label="نسبة الأبعاد"
                    value={CINEMA_ASPECTS.find((a) => a.id === picks.aspect)?.label}
                  />
                  <PickRow
                    label="الجودة"
                    value={CINEMA_RESOLUTIONS.find((r) => r.id === picks.resolution)?.label}
                  />
                </div>
              )}
            </div>

            {/* Footer — input + apply button */}
            <div className="border-t border-white/[0.06] p-4 flex-shrink-0 space-y-3">
              {!picks ? (
                <>
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                    }}
                    placeholder="مثال: لقطة سينمائية لراقصة باليه على مسرح فارغ، إضاءة دراماتيكية..."
                    rows={3}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-violet-500/40"
                    dir="auto"
                  />
                  <button
                    onClick={submit}
                    disabled={!text.trim() || busy}
                    type="button"
                    className={cn(
                      "w-full h-11 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                      !text.trim() || busy
                        ? "bg-white/5 text-gray-600 cursor-not-allowed"
                        : "bg-violet-500 text-white hover:bg-violet-600 active:scale-95 shadow-lg shadow-violet-500/30",
                    )}
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    اختار لي الإعدادات
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setPicks(null); }}
                    type="button"
                    className="h-11 px-4 rounded-2xl border border-white/10 hover:bg-white/5 text-xs font-bold text-gray-300 transition-colors"
                  >
                    إعادة
                  </button>
                  <button
                    onClick={apply}
                    type="button"
                    className="flex-1 h-11 rounded-2xl bg-accent-400 text-black font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 shadow-[0_0_24px_rgba(254,228,64,0.35)] transition-transform"
                  >
                    <Check className="w-4 h-4" />
                    تطبيق
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Single pick row in the summary ────────────────────────────────────
function PickRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/[0.04]">
      <div className="w-24 text-[11px] text-gray-500 font-mono pt-0.5 shrink-0">{label}</div>
      <div className="text-sm text-white leading-relaxed flex-1">{value}</div>
    </div>
  );
}
