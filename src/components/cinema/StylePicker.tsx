"use client";

// ════════════════════════════════════════════════════════════════
// Cinema Style Picker — 3 axes (palette / lighting / moveset)
// ════════════════════════════════════════════════════════════════
// Mirrors Higgsfield's "Style Settings" modal, which exposes three
// independent dimensions you mix-and-match. We expose them as three
// horizontal carousels stacked vertically; each card is a still or a
// looping video clip, and the active pick gets a yellow accent ring.

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COLOR_PALETTES, LIGHTING_STYLES, MOVESETS,
  type StylePreset,
} from "@/lib/data/cinema";

export interface StyleValue {
  paletteId:  string;
  lightingId: string;
  movesetId:  string;
}

interface Props {
  open:     boolean;
  value:    StyleValue;
  onChange: (next: StyleValue) => void;
  onClose:  () => void;
}

export function StylePicker({ open, value, onChange, onClose }: Props) {
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
            className="w-full sm:max-w-5xl bg-[#0a0a0f] border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-[0_-12px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
            style={{ maxHeight: "88vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-6 rounded-full bg-accent-400" />
                <h3 className="text-white font-bold text-base">إعدادات الأسلوب</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onChange({ paletteId: "auto", lightingId: "auto", movesetId: "auto" })}
                  className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 h-9 rounded-xl border border-white/10 hover:bg-white/5"
                  type="button"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  مسح الكل
                </button>
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

            {/* 3 carousels */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <Row
                title="لوحة الألوان"
                subtitle="Color Palette"
                presets={COLOR_PALETTES}
                value={value.paletteId}
                onChange={(id) => onChange({ ...value, paletteId: id })}
                kind="image"
              />
              <Row
                title="الإضاءة"
                subtitle="Lighting"
                presets={LIGHTING_STYLES}
                value={value.lightingId}
                onChange={(id) => onChange({ ...value, lightingId: id })}
                kind="image"
              />
              <Row
                title="حركة الكاميرا"
                subtitle="Camera Moveset"
                presets={MOVESETS}
                value={value.movesetId}
                onChange={(id) => onChange({ ...value, movesetId: id })}
                kind="video"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Single carousel row ───────────────────────────────────────────────
function Row({
  title, subtitle, presets, value, onChange, kind,
}: {
  title:    string;
  subtitle: string;
  presets:  StylePreset[];
  value:    string;
  onChange: (id: string) => void;
  kind:     "image" | "video";
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h4 className="text-white font-bold text-sm">{title}</h4>
        <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">{subtitle}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-white/10">
        {presets.map((p) => (
          <Card
            key={p.id}
            preset={p}
            selected={value === p.id}
            onSelect={() => onChange(p.id)}
            kind={kind}
          />
        ))}
      </div>
    </section>
  );
}

function Card({
  preset, selected, onSelect, kind,
}: {
  preset:   StylePreset;
  selected: boolean;
  onSelect: () => void;
  kind:     "image" | "video";
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isAuto   = preset.id === "auto" || !preset.thumbnail;

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => kind === "video" && videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => {
        if (kind === "video") {
          const v = videoRef.current;
          if (v) { v.pause(); v.currentTime = 0; }
        }
      }}
      type="button"
      className={cn(
        "shrink-0 w-32 aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all relative group",
        selected
          ? "border-accent-400 shadow-[0_0_20px_rgba(254,228,64,0.35)]"
          : "border-white/10 hover:border-white/30 hover:shadow-lg"
      )}
    >
      {isAuto ? (
        <div className="w-full h-full bg-gradient-to-br from-white/[0.03] to-white/[0.08] flex items-center justify-center">
          <div className="text-center">
            <Wand2 className="w-6 h-6 text-white/40 mx-auto mb-1" />
            <span className="text-[10px] text-white/50 font-bold">تلقائي</span>
          </div>
        </div>
      ) : kind === "video" ? (
        <video
          ref={videoRef}
          src={preset.thumbnail}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preset.thumbnail}
          alt={preset.englishName}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-accent-400 text-black flex items-center justify-center shadow-lg">
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 p-2 text-right">
        <div className="text-white text-xs font-bold leading-tight">{preset.name}</div>
        <div className="text-[9px] text-white/55 font-medium leading-tight mt-0.5">{preset.englishName}</div>
      </div>
    </button>
  );
}
