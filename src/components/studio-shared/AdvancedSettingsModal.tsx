"use client";

// ════════════════════════════════════════════════════════════════
// AdvancedSettingsModal — shared "advanced" overlay for studios
// ════════════════════════════════════════════════════════════════
// Holds the parameters Higgsfield exposes under their Settings cog:
//   • Negative prompt (avoid these things)
//   • Seed (lock for reproducible runs)
//   • Style strength (Soul-only — how heavily to weight the moodboard)
//
// Each studio decides which subset to show via the `fields` prop.

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Dice3, Lock, Unlock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdvancedSettings {
  /** Things the model should AVOID. Empty string = no negative prompt. */
  negativePrompt: string;
  /** When set, generation is reproducible. null = random each run. */
  seed: number | null;
  /** 0..100 — how aggressively to inject style descriptors. Soul only. */
  styleStrength: number;
}

export const ADVANCED_DEFAULTS: AdvancedSettings = {
  negativePrompt: "",
  seed:           null,
  styleStrength:  100,
};

export type AdvancedField = "negativePrompt" | "seed" | "styleStrength";

interface Props {
  open:     boolean;
  value:    AdvancedSettings;
  onChange: (next: AdvancedSettings) => void;
  onClose:  () => void;
  /** Which knobs to render. Cinema/Marketing skip styleStrength. */
  fields:   AdvancedField[];
  /** Sensible default negative-prompt suggestion the user can accept. */
  suggestedNegativePrompt?: string;
}

export function AdvancedSettingsModal({
  open, value, onChange, onClose, fields, suggestedNegativePrompt,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!open || !mounted) return null;

  // Local mirror so typing is responsive — flush on every change.
  const update = <K extends AdvancedField>(key: K, v: AdvancedSettings[K]) => {
    onChange({ ...value, [key]: v });
  };

  const randomSeed = () => {
    update("seed", Math.floor(Math.random() * 1_000_000_000));
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] w-[560px] max-w-[94vw] max-h-[90vh] bg-bg-primary border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-y-auto"
        dir="rtl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h3 className="text-base font-black text-white">إعدادات متقدمة</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">تحكّم دقيق في الناتج — اختياري</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center"
            aria-label="إغلاق"
            type="button"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* ── Negative prompt ─────────────────────────────────────── */}
          {fields.includes("negativePrompt") && (
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">حاجات تتجنّبها (Negative Prompt)</span>
                {suggestedNegativePrompt && !value.negativePrompt && (
                  <button
                    type="button"
                    onClick={() => update("negativePrompt", suggestedNegativePrompt)}
                    className="text-[10px] font-bold text-accent-400 hover:underline"
                  >
                    استخدم اقتراح افتراضي
                  </button>
                )}
              </label>
              <textarea
                value={value.negativePrompt}
                onChange={(e) => update("negativePrompt", e.target.value)}
                placeholder="مثال: blurry, low quality, watermark, deformed hands"
                rows={3}
                dir="ltr"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-400/40 resize-none text-left"
              />
              <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                اكتب الحاجات اللي مش عاوزها في الناتج. الإنجليزي بيشتغل أحسن لأن الموديلات متدرّبة عليه.
              </p>
            </div>
          )}

          {/* ── Seed ────────────────────────────────────────────────── */}
          {fields.includes("seed") && (
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">البذرة (Seed)</span>
                <span className="text-[10px] text-gray-500">
                  {value.seed === null ? "عشوائي كل مرة" : "مثبّت — نفس البذرة = نفس النتيجة"}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => update("seed", value.seed === null ? Math.floor(Math.random() * 1_000_000_000) : null)}
                  className={cn(
                    "h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0",
                    value.seed === null
                      ? "border-white/10 bg-white/[0.02] text-gray-300 hover:bg-white/5"
                      : "border-accent-400/40 bg-accent-400/10 text-accent-400 hover:bg-accent-400/20",
                  )}
                  title={value.seed === null ? "ثبّت" : "حرّر"}
                >
                  {value.seed === null ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {value.seed === null ? "حرّر" : "مثبّت"}
                </button>
                <input
                  type="number"
                  value={value.seed ?? ""}
                  onChange={(e) => {
                    const n = e.target.value === "" ? null : Number(e.target.value);
                    update("seed", n);
                  }}
                  placeholder="عشوائي"
                  disabled={value.seed === null}
                  dir="ltr"
                  className="flex-1 h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-400/40 text-left disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={randomSeed}
                  className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
                  title="إعادة تعيين البذرة عشوائياً"
                >
                  <Dice3 className="w-3.5 h-3.5" />
                  عشوائي
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                لو ثبّت البذرة، نفس الـprompt + الإعدادات هتطلع نفس النتيجة دايماً — مفيد للتعديل التدريجي.
              </p>
            </div>
          )}

          {/* ── Style strength (Soul only) ──────────────────────────── */}
          {fields.includes("styleStrength") && (
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">قوة الاستايل (Style Strength)</span>
                <span className="text-xs font-mono text-accent-400">{value.styleStrength}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={value.styleStrength}
                onChange={(e) => update("styleStrength", Number(e.target.value))}
                className="w-full accent-accent-400"
              />
              <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                <span>حر (Prompt الخام)</span>
                <span>متوسّط</span>
                <span>قوي (إديتوريال كامل)</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                كلما زادت، كلما حقنّا تعليمات استايل Soul أكتر في الـprompt. لو نزّلت لـ 0% بنبعت وصفك كما هو.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-white/5 bg-white/[0.02]">
          <button
            type="button"
            onClick={() => onChange(ADVANCED_DEFAULTS)}
            className="text-xs font-bold text-gray-500 hover:text-white px-3 py-2 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            استعادة الافتراضيات
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl bg-accent-400 text-black font-black text-sm hover:scale-[1.02] active:scale-95 transition-transform"
          >
            تم
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}

// ── Tiny chip that opens the modal ──────────────────────────────────────

export function AdvancedSettingsChip({
  value, onClick,
}: {
  value: AdvancedSettings;
  onClick: () => void;
}) {
  // Show a dot indicator when any setting deviates from defaults so the
  // user knows their advanced config is active.
  const dirty =
    value.negativePrompt.trim() !== "" ||
    value.seed !== null ||
    value.styleStrength !== ADVANCED_DEFAULTS.styleStrength;

  return (
    <button
      onClick={onClick}
      type="button"
      title="إعدادات متقدمة"
      className={cn(
        "relative h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors",
        dirty
          ? "border-accent-400/40 bg-accent-400/5 text-accent-400 hover:bg-accent-400/10"
          : "border-white/10 hover:bg-white/[0.03] text-gray-300 hover:text-white",
      )}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className="hidden sm:inline">إعدادات</span>
      {dirty && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-400" />}
    </button>
  );
}
