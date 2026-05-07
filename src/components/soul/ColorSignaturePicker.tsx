"use client";

// ════════════════════════════════════════════════════════════════
// Soul HEX — Color Signature Picker overlay
// ════════════════════════════════════════════════════════════════
// Mirrors Higgsfield's "CONTROL YOUR COLORS WITH SOUL HEX" modal:
//
//   Hero:   "CONTROL YOUR COLORS WITH SOUL HEX"
//           [Upload & Create ✨]                ← extracts palette from any photo
//   Grid:   6 curated palettes (reference image + color strip + label)
//
// Selecting a curated card calls onChange({ paletteId, hexes: null }) ;
// uploading a custom image calls /api/tools/soul/extract-colors and then
// onChange({ paletteId: "", hexes: [...] }).

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Upload, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { COLOR_PALETTES } from "@/lib/data/soul";
import { uploadFile } from "@/lib/muapi";

export interface ColorPick {
  paletteId: string;
  /** When set, overrides paletteId — these are the HEX values extracted from the user's upload. */
  hexes:     string[] | null;
  /** Convenience preview URL for the chip (the user's own upload OR the curated reference). */
  reference: string | null;
}

interface Props {
  open:     boolean;
  value:    ColorPick;
  onChange: (next: ColorPick) => void;
  onClose:  () => void;
}

export function ColorSignaturePicker({ open, value, onChange, onClose }: Props) {
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  const onUpload = async (file: File) => {
    setExtracting(true);
    try {
      // 1. Upload to muapi storage so the server can fetch the bytes.
      const { url } = await uploadFile(file);
      // 2. Ask our extract-colors endpoint for a 6-color palette.
      const r = await fetch("/api/tools/soul/extract-colors", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ image_url: url }),
      });
      const data = await r.json();
      if (!r.ok || !Array.isArray(data.hexes) || data.hexes.length === 0) {
        throw new Error(data.error || "تعذّر استخراج الألوان");
      }
      onChange({ paletteId: "", hexes: data.hexes, reference: url });
      toast.success("تم استخراج لوحة الألوان ✨");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setExtracting(false);
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
            className="w-full sm:max-w-4xl border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-[0_-12px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
          >
            {/* Hero */}
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 flex items-start justify-between gap-3 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight">
                  تحكّم في ألوان صورتك<br />
                  <span className="text-white/70">مع Soul HEX</span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mt-2 max-w-md">
                  ارفع صورة مرجعية وSoul HEX يستخرج لوحتها اللونية ويطبّقها على الستايل بتاعك.
                </p>
                <button
                  onClick={() => fileRef.current?.click()}
                  type="button"
                  disabled={extracting}
                  className={cn(
                    "mt-3 inline-flex items-center gap-1.5 h-10 px-4 rounded-full font-bold text-sm transition-transform",
                    extracting
                      ? "bg-white/10 text-gray-500 cursor-wait"
                      : "bg-accent-400 text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(254,228,64,0.3)]",
                  )}
                >
                  {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {extracting ? "جاري الاستخراج…" : "ارفع واستخرج"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }}
                />
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

            {/* Curated palettes */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {COLOR_PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange({ paletteId: p.id, hexes: null, reference: p.reference });
                      onClose();
                    }}
                    className={cn(
                      "rounded-2xl overflow-hidden border-2 transition-all group text-right",
                      value.paletteId === p.id
                        ? "border-accent-400 shadow-[0_0_18px_rgba(254,228,64,0.3)]"
                        : "border-white/10 hover:border-white/30",
                    )}
                  >
                    {/* Reference image */}
                    <div className="aspect-square relative bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.reference} alt={p.englishName} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                      {value.paletteId === p.id && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-accent-400 text-black flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    {/* Color strip */}
                    <div className="flex h-3">
                      {p.hexes.map((h, i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: h }} />
                      ))}
                    </div>
                    {/* Label */}
                    <div className="px-2 py-2 text-center bg-white/[0.02]">
                      <div className="text-[11px] font-bold text-white truncate">{p.name}</div>
                      <div className="text-[10px] text-white/50 truncate">{p.englishName}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Show user's custom palette swatch when active */}
              {value.hexes && value.hexes.length > 0 && (
                <div className="mt-5 rounded-2xl border-2 border-accent-400/50 bg-accent-400/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-bold text-white">لوحتك المخصصة</div>
                    <button
                      onClick={() => onChange({ paletteId: COLOR_PALETTES[0]!.id, hexes: null, reference: COLOR_PALETTES[0]!.reference })}
                      type="button"
                      className="text-[11px] text-accent-400 hover:text-white transition-colors"
                    >
                      إزالة
                    </button>
                  </div>
                  <div className="flex h-8 rounded-lg overflow-hidden">
                    {value.hexes.map((h, i) => (
                      <div key={i} title={h} className="flex-1 relative" style={{ backgroundColor: h }}>
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono opacity-0 hover:opacity-100 bg-black/40 text-white">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
