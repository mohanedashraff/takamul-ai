"use client";

// ════════════════════════════════════════════════════════════════
// SidebarToolWorkspace — generic sidebar layout for any Tool
// ════════════════════════════════════════════════════════════════
// Replaces the older 2-column "Inputs / Result" layout used by both
// `default` and `centered` tools. Sidebar (in RTL: visually on the
// RIGHT) houses every form input, the canvas (in RTL: visually on
// the LEFT) is one big result/preview area.
//
// All the heavy lifting still lives in `renderToolInput` + `executeTool`
// + `pickResultMedia` / `pickDownloadUrl` — so this is a pure layout
// swap, not a behaviour change.

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Download, RotateCcw, ArrowRight, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  type Tool, type ToolCategory, type CategoryConfig, STUDIO_CATEGORIES,
} from "@/lib/data/tools";
import { uploadFile } from "@/lib/muapi";
import { executeTool, isExecutable } from "@/lib/execute-tool";
import {
  renderToolInput, isFormValid, initValues,
  type InputValues, type InputSetters,
} from "./ToolInputRenderer";
import { MediaRenderer } from "./MediaRenderer";
import type { MuapiResult } from "@/lib/muapi";

interface Props {
  tool:        Tool;
  config:      CategoryConfig;
  categoryKey: ToolCategory;
}

export function SidebarToolWorkspace({ tool, config, categoryKey }: Props) {
  // ── Form state — same shape as the old CenteredToolInterface ──
  const [values, setValues] = useState(() => initValues(tool.inputs));
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [result, setResult] = useState<MuapiResult | null>(null);
  const [progress, setProgress] = useState<string>("");

  const state: InputValues = { values, files, previews };
  const setters: InputSetters = {
    setValue:   (id, val)  => setValues  ((p) => ({ ...p, [id]: val  })),
    setFile:    (id, file) => setFiles   ((p) => ({ ...p, [id]: file })),
    setPreview: (id, url)  => setPreviews((p) => ({ ...p, [id]: url  })),
  };

  const valid    = isFormValid(tool.inputs, values, files);
  const colorRgb = config.shadowColor;

  // ── Generate ─────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!valid || isProcessing) return;
    if (!isExecutable(tool)) {
      toast.error("هذه الأداة لم تُربط بعد بالـ AI backend");
      return;
    }

    setIsProcessing(true);
    setHasResult(false);
    setResult(null);
    setProgress("جاري التحضير…");

    try {
      // Upload any File inputs so muapi gets URLs.
      const merged: Record<string, unknown> = { ...values };
      for (const [id, file] of Object.entries(files)) {
        if (!file) continue;
        setProgress(`جاري رفع ${file.name}…`);
        const { url } = await uploadFile(file);
        merged[id] = url;
      }

      setProgress("جاري التوليد بالذكاء الاصطناعي…");
      const { result: r } = await executeTool(tool, merged, {
        onStatus: (s) => setProgress(statusToArabic(s)),
      });

      setResult(r);
      setHasResult(true);
      toast.success("تم التوليد بنجاح ✨");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  };

  const handleReset = () => {
    setValues(initValues(tool.inputs));
    setFiles({});
    Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    setPreviews({});
    setHasResult(false);
    setResult(null);
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    // Stack on mobile, side-by-side on md+. The aside lives FIRST in
    // DOM order so in RTL it visually anchors to the right edge.
    <div className="flex flex-col md:flex-row flex-1 md:min-h-[calc(100vh-80px)]">
      {/* ── Sidebar (form) ─────────────────────────────────────── */}
      <aside className="w-full md:w-[380px] md:shrink-0 border-t md:border-t-0 md:border-l border-white/5 bg-black/30 backdrop-blur-2xl flex flex-col">
        {/* Tiny breadcrumb back-link */}
        <div className="px-5 pt-5 pb-3 flex items-center gap-2 text-xs text-gray-500 shrink-0">
          <Link href="/tools" className="hover:text-white transition-colors">الأدوات</Link>
          <ArrowRight className="w-3 h-3 rotate-180" />
          <Link
            href={`/studio/${categoryKey}`}
            className={cn("hover:text-white transition-colors", config.colorClass)}
          >
            {config.name}
          </Link>
        </div>

        {/* Tool header — icon + title + desc + credits */}
        <div className="px-5 pb-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border border-white/10"
              style={{ backgroundColor: `rgba(${colorRgb}, 0.1)` }}
            >
              <tool.icon className={cn("w-6 h-6", config.colorClass)} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-black text-white leading-tight">{tool.title}</h1>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{tool.desc}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-black border"
              style={{
                color:           `rgb(${colorRgb})`,
                borderColor:     `rgba(${colorRgb}, 0.3)`,
                backgroundColor: `rgba(${colorRgb}, 0.08)`,
              }}
            >
              {config.name}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-500 font-bold">
              <Zap className="w-3 h-3" /> {tool.credits} كريديت
            </span>
          </div>
        </div>

        {/* Inputs — every Tool.inputs entry renders via the existing
            renderToolInput. Scrollable when the form is taller than
            the viewport. */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {tool.inputs.map((input) => renderToolInput(input, state, setters, colorRgb))}
        </div>

        {/* Generate CTA — pinned to the bottom of the sidebar. */}
        <div className="p-4 border-t border-white/[0.06] shrink-0 sticky bottom-0 bg-black/40 backdrop-blur-xl">
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !valid}
            type="button"
            className={cn(
              "w-full h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all",
              isProcessing && "bg-white/5 text-gray-500 cursor-wait",
              !isProcessing && valid    && "text-black hover:scale-[1.02] active:scale-95",
              !isProcessing && !valid   && "bg-white/5 text-gray-600 cursor-not-allowed",
            )}
            style={
              !isProcessing && valid
                ? {
                    backgroundColor: `rgb(${colorRgb})`,
                    boxShadow:       `0 0 24px rgba(${colorRgb}, 0.35)`,
                  }
                : undefined
            }
          >
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {progress || "جاري المعالجة..."}</>
            ) : (
              <><Sparkles className="w-4 h-4" /> ابدأ التوليد</>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main canvas — empty / loading / result ─────────────── */}
      <main className="flex-1 min-h-[60vh] md:min-h-0 flex items-center justify-center p-5 md:p-10 bg-black/10">
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center max-w-sm"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div
                  className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                  style={{ borderTopColor: `rgb(${colorRgb})`, borderRightColor: `rgba(${colorRgb}, 0.3)` }}
                />
                <div
                  className="absolute inset-2 rounded-full border-2 border-transparent animate-spin"
                  style={{
                    borderBottomColor: `rgb(${colorRgb})`,
                    animationDirection: "reverse",
                    animationDuration:  "1.8s",
                    opacity:            0.5,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <tool.icon className={cn("w-9 h-9 animate-pulse", config.colorClass)} />
                </div>
              </div>
              <p className="text-white font-bold text-lg mb-1">المحرك يعمل…</p>
              <p className="text-gray-500 text-sm">{progress || "يتم معالجة طلبك بالذكاء الاصطناعي"}</p>
            </motion.div>
          ) : hasResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
              className="w-full max-w-3xl"
            >
              <div
                className="w-full rounded-2xl overflow-hidden mb-5 border border-white/10 bg-black"
                style={{ boxShadow: `0 0 40px rgba(${colorRgb}, 0.18)` }}
              >
                <div className="w-full aspect-video relative">
                  <MediaRenderer media={pickResultMedia(result, tool.image)} alt="النتيجة" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href={pickDownloadUrl(result) || "#"}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-12 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <Download className="w-4 h-4" /> تحميل النتيجة
                </a>
                <button
                  onClick={handleReset}
                  type="button"
                  className="h-12 px-5 rounded-2xl border border-white/10 text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> إعادة
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center select-none max-w-sm"
            >
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-white/5"
                style={{ backgroundColor: `rgba(${colorRgb}, 0.05)` }}
              >
                <tool.icon className={cn("w-11 h-11 opacity-30", config.colorClass)} />
              </div>
              <p className="text-white text-base sm:text-lg font-bold mb-1">جاهز نبدأ؟</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                املأ الإعدادات على اليمين واضغط <span className="text-white font-bold">ابدأ التوليد</span> هتلاقي النتيجة هنا.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Helpers (kept inline so the workspace stays self-contained) ──

function statusToArabic(s: string): string {
  switch (s) {
    case "queued":     return "في قائمة الانتظار…";
    case "pending":    return "في قائمة الانتظار…";
    case "processing": return "جاري التوليد…";
    case "running":    return "جاري التوليد…";
    case "completed":  return "تم التوليد";
    default:           return "جاري المعالجة…";
  }
}

function pickResultMedia(r: MuapiResult | null, fallback: string | string[]): string | string[] {
  if (!r) return fallback;
  // Many shapes — try the most-common first.
  if (typeof r.url === "string" && r.url) return r.url;
  if (Array.isArray(r.urls) && r.urls.length) return r.urls;
  if (Array.isArray(r.outputs) && r.outputs.length) {
    const first = r.outputs[0];
    if (typeof first === "string") return r.outputs as string[];
    if (typeof first === "object" && first && "url" in first) return r.outputs.map((o) => (o as { url: string }).url);
  }
  if (typeof r.output === "string" && r.output) return r.output;
  if (r.output && typeof r.output === "object" && "url" in r.output) return String((r.output as { url: unknown }).url ?? "") || fallback;
  return fallback;
}

function pickDownloadUrl(r: MuapiResult | null): string | null {
  if (!r) return null;
  const m = pickResultMedia(r, "");
  if (typeof m === "string") return m || null;
  return m[0] ?? null;
}

// Suppress the unused-import warning when STUDIO_CATEGORIES is only
// referenced via the `config` prop type elsewhere.
void STUDIO_CATEGORIES;
