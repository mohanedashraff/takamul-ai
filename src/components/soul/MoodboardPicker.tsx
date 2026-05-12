"use client";

// ════════════════════════════════════════════════════════════════
// Soul 2.0 — Moodboard Picker overlay
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's "CREATE YOUR MOODBOARD" modal:
//
//   [Build your moodboard ✨]                     ← opens BuildMoodboardModal
//   [ Curated ] [ My Moodboards ]      [ Search ] ← tabs + search
//   ┌──────────────────── grid ────────────────────┐
//   │  thumb  thumb  thumb  thumb  thumb  thumb    │
//   │    label     label     label    …           │
//   └──────────────────────────────────────────────┘
//
// Selecting a card calls onChange(id) and dismisses the modal.

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Sparkles, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { MOODBOARDS, CURATED_PICKS, type CuratedTheme } from "@/lib/data/soul";
import type { SoulMoodboardRow } from "./types";

interface Props {
  open:     boolean;
  value:    string;
  onChange: (id: string) => void;
  onClose:  () => void;
  onBuildOwn: () => void;
}

// Three top-level tabs:
//   • curated — 21 highlighted styles grouped into 3 themes (Mood,
//     Styles, Camera). This is the default landing tab.
//   • all     — the full library of 106 styles in one searchable grid.
//   • mine    — user-built moodboards from BuildMoodboardModal.
type Tab = "curated" | "all" | "mine";

// Arabic labels for the 3 curated themes — match the reference's
// section headings inside the prominent picker.
const CURATED_THEMES: { id: CuratedTheme; label: string; sub: string }[] = [
  { id: "mood",   label: "المزاج",  sub: "نغمة عاطفية وسينمائية" },
  { id: "styles", label: "الستايلز", sub: "مدارس بصرية مميزة"     },
  { id: "camera", label: "الكاميرا", sub: "إحساس الكاميرا والفيلم" },
];

export function MoodboardPicker({ open, value, onChange, onClose, onBuildOwn }: Props) {
  const [tab,    setTab]    = useState<Tab>("curated");
  const [search, setSearch] = useState("");
  const [mine,   setMine]   = useState<SoulMoodboardRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user moodboards lazily — only when the user opens the modal
  // for the first time, then again whenever they switch to the tab.
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/tools/soul/moodboards", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.moodboards)) setMine(d.moodboards); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Esc closes the modal — matches every other Soul overlay.
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  // Lookup helper — find a moodboard preset by id (used by curated theme
  // sections to render only the highlighted picks).
  const lookupById = (id: string) => MOODBOARDS.find((m) => m.id === id);

  const filtered = useMemo(() => {
    if (tab === "all") {
      const q = search.trim().toLowerCase();
      return MOODBOARDS.filter((m) =>
        !q || m.name.includes(q) || m.englishName.toLowerCase().includes(q)
      );
    }
    if (tab === "mine") {
      const q = search.trim().toLowerCase();
      return mine.filter((m) => !q || m.name.toLowerCase().includes(q));
    }
    return [];   // curated tab renders custom 3-section layout below
  }, [tab, search, mine]);

  const deleteMine = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("هل تريد حذف هذا الموود بورد نهائياً؟")) return;
    try {
      const r = await fetch(`/api/tools/soul/moodboards/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      setMine((arr) => arr.filter((m) => m.id !== id));
      if (value === id) onChange(MOODBOARDS[0]!.id); // fall back to "General"
    } catch {
      toast.error("فشل الحذف");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.78)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "#0a0a0f", maxHeight: "92vh" }}
            className="w-full sm:max-w-5xl border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-[0_-12px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
          >
            {/* Header / hero */}
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 flex items-start justify-between gap-3 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  اصنع موود بورد بصري
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mt-1 max-w-md">
                  حوّل مراجعك إلى موود بورد مركّز يحدد الستايل والنغمة والاتجاه الإبداعي.
                </p>
                <button
                  onClick={onBuildOwn}
                  type="button"
                  className="mt-3 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-accent-400 text-black font-bold text-sm hover:scale-[1.02] active:scale-95 transition-transform shadow-[0_0_20px_rgba(254,228,64,0.3)]"
                >
                  ابنِ موود بورد بنفسك
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 shrink-0 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
                type="button"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4 text-gray-300" />
              </button>
            </div>

            {/* Tabs + search */}
            <div className="flex items-center gap-3 px-5 sm:px-6 pb-3 flex-shrink-0">
              <div className="flex bg-white/[0.04] border border-white/10 rounded-xl p-1 gap-1">
                <TabBtn active={tab === "curated"} onClick={() => setTab("curated")}>مختارة</TabBtn>
                <TabBtn active={tab === "all"}     onClick={() => setTab("all")}>
                  كل الستايلز <span className="opacity-60">({MOODBOARDS.length})</span>
                </TabBtn>
                <TabBtn active={tab === "mine"}    onClick={() => setTab("mine")}>
                  موود بوردزي {mine.length > 0 && <span className="opacity-60">({mine.length})</span>}
                </TabBtn>
              </div>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث في الستايلز…"
                  className="w-full h-9 pr-9 pl-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-400/40"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6">
              {tab === "mine" && loading ? (
                <div className="py-16 text-center text-sm text-gray-500">جاري التحميل…</div>
              ) : tab === "curated" ? (
                // ── Curated tab — 3 themed sections of 21 highlights ──
                <CuratedSections
                  value={value}
                  onPick={(id) => { onChange(id); onClose(); }}
                  onBrowseAll={() => setTab("all")}
                  lookup={lookupById}
                />
              ) : filtered.length === 0 ? (
                tab === "all" ? (
                  <div className="py-16 text-center text-sm text-gray-500">لا نتائج</div>
                ) : (
                  <div className="py-16 flex flex-col items-center gap-3 text-center">
                    <Sparkles className="w-8 h-8 text-accent-400" />
                    <p className="text-sm text-white font-bold">لسه ما عملتش موود بورد خاص بيك</p>
                    <p className="text-xs text-gray-500 max-w-xs">
                      اضغط <span className="text-accent-400 font-bold">ابنِ موود بورد بنفسك</span> فوق لرفع ٥+ صور وعمل موود بورد مخصص.
                    </p>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {filtered.map((m) => {
                    const id    = m.id;
                    const name  = "englishName" in m ? m.englishName : m.name;
                    const arabic= "name" in m ? m.name : "";
                    const thumb = "thumbnail" in m && m.thumbnail
                      ? m.thumbnail
                      : ("thumbnail" in m ? "" : "");
                    const isMine = tab === "mine";

                    return (
                      <button
                        key={id}
                        onClick={() => { onChange(id); onClose(); }}
                        type="button"
                        className={cn(
                          "relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all group text-left",
                          value === id
                            ? "border-accent-400 shadow-[0_0_18px_rgba(254,228,64,0.3)]"
                            : "border-white/10 hover:border-white/30"
                        )}
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt={name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 inset-x-0 p-2 text-right">
                          <div className="text-white text-xs font-black leading-tight truncate">
                            {arabic || name}
                          </div>
                          <div className="text-[10px] text-white/55 font-medium truncate">{name}</div>
                        </div>
                        {isMine && (
                          <button
                            onClick={(e) => deleteMine(id, e)}
                            type="button"
                            aria-label="حذف"
                            className="absolute top-1.5 left-1.5 w-7 h-7 rounded-lg bg-black/70 border border-white/15 text-red-400 hover:bg-red-500/30 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "h-7 px-3 rounded-lg text-xs font-bold transition-colors",
        active ? "bg-white/10 text-white" : "text-gray-400 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

// ── Curated sections — 3 themed groups of highlighted styles ──────────
// Mirrors the reference platform's prominent picker which highlights 21
// hand-picked styles across Mood / Styles / Camera. Each section shows
// only the curated picks for that theme; a "Browse all 106" link at
// the bottom switches the picker over to the full grid.
function CuratedSections({
  value, onPick, onBrowseAll, lookup,
}: {
  value:        string;
  onPick:       (id: string) => void;
  onBrowseAll:  () => void;
  lookup:       (id: string) => { id: string; name: string; englishName: string; thumbnail: string } | undefined;
}) {
  return (
    <div className="space-y-7">
      {CURATED_THEMES.map((theme) => {
        const picks = (CURATED_PICKS[theme.id] ?? [])
          .map(lookup)
          .filter((m): m is NonNullable<ReturnType<typeof lookup>> => !!m);
        if (picks.length === 0) return null;
        return (
          <section key={theme.id}>
            <header className="flex items-baseline justify-between mb-3">
              <div>
                <h4 className="text-white font-black text-base leading-tight">{theme.label}</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">{theme.sub}</p>
              </div>
              <span className="text-[10px] text-gray-500 font-bold">{picks.length} مختار</span>
            </header>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {picks.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onPick(m.id)}
                  type="button"
                  className={cn(
                    "relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all group text-left",
                    value === m.id
                      ? "border-accent-400 shadow-[0_0_18px_rgba(254,228,64,0.3)]"
                      : "border-white/10 hover:border-white/30"
                  )}
                >
                  {m.thumbnail ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.thumbnail} alt={m.englishName} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-2 text-right">
                    <div className="text-white text-xs font-black leading-tight truncate">{m.name}</div>
                    <div className="text-[10px] text-white/55 font-medium truncate">{m.englishName}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );
      })}

      {/* Browse-all CTA */}
      <div className="pt-2 border-t border-white/[0.04]">
        <button
          onClick={onBrowseAll}
          type="button"
          className="w-full h-12 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-accent-400/30 transition-colors text-sm font-bold text-white flex items-center justify-center gap-2"
        >
          تصفّح كل الـ{MOODBOARDS.length} ستايل
          <span className="text-accent-400">←</span>
        </button>
      </div>
    </div>
  );
}
