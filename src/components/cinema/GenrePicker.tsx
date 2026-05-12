"use client";

// ════════════════════════════════════════════════════════════════
// Cinema Genre Picker — bottom-sheet modal with video thumbnails
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's Cinema Studio genre wheel: each option is a
// short looping video clip that plays on hover. We render as a
// responsive grid (rather than the 3D wheel) so the picker stays usable
// on mobile too. Selected genre gets a yellow accent ring.

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GENRES, type GenrePreset } from "@/lib/data/cinema";

interface Props {
  open:       boolean;
  value:      string;
  onChange:   (id: string) => void;
  onClose:    () => void;
}

export function GenrePicker({ open, value, onChange, onClose }: Props) {
  // Esc → close (matches the pattern other studio overlays use).
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
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-4xl bg-[#0a0a0f] border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-[0_-12px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
            style={{ maxHeight: "88vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-6 rounded-full bg-accent-400" />
                <h3 className="text-white font-bold text-base">اختر النوع السينمائي</h3>
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

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {GENRES.map((g) => (
                  <GenreCard
                    key={g.id}
                    genre={g}
                    selected={value === g.id}
                    onSelect={() => { onChange(g.id); onClose(); }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Single genre card ─────────────────────────────────────────────────
function GenreCard({
  genre, selected, onSelect,
}: {
  genre:    GenrePreset;
  selected: boolean;
  onSelect: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => { const v = videoRef.current; if (v) { v.pause(); v.currentTime = 0; } }}
      type="button"
      className={cn(
        "relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all group",
        selected
          ? "border-accent-400 shadow-[0_0_20px_rgba(254,228,64,0.35)]"
          : "border-white/10 hover:border-white/30 hover:shadow-lg"
      )}
    >
      <video
        ref={videoRef}
        src={genre.preview}
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      {selected && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-accent-400 text-black flex items-center justify-center shadow-lg">
          <Check className="w-4 h-4" strokeWidth={3} />
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 p-3 text-right">
        <div className="text-white text-sm font-black mb-0.5">{genre.name}</div>
        <div className="text-[10px] text-white/60 font-medium">{genre.englishName}</div>
      </div>
    </button>
  );
}
