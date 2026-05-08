"use client";

// ════════════════════════════════════════════════════════════════
// RefineButton — per-result upscale + detail-recovery button
// ════════════════════════════════════════════════════════════════
// Drops onto a gallery card. POSTs the source URL to /api/ai/refine,
// shows a busy spinner while the upscaler runs, then reports back to
// the parent so the gallery can swap the URL on the card.
//
// Cost: 3 credits. The button disables itself once a card has been
// refined to stop double-billing on the same source.

import React, { useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface RefineResult {
  url:         string;
  originalUrl: string;
}

interface Props {
  /** Current image URL on the card. */
  url:         string;
  /** Generation row id — when supplied the server links the refined
   *  URL back onto the row so history reflects it. */
  generationId?: string;
  /** Already refined? Disables the button + shows the success state. */
  refined?:    boolean;
  /** Callback fires once the upscaler returns a new URL. */
  onResult:    (result: RefineResult) => void;
  /** className passthrough so cards can size the button to match
   *  their other corner-overlay buttons (download, fullscreen, etc.). */
  className?:  string;
}

export function RefineButton({
  url, generationId, refined, onResult, className,
}: Props) {
  const [busy, setBusy] = useState(false);

  if (refined) {
    return (
      <span
        className={cn(
          "h-8 px-2 rounded-lg bg-emerald-500/90 backdrop-blur border border-emerald-400 flex items-center justify-center gap-1 text-[10px] font-black text-black",
          className,
        )}
        title="مُحسّنة"
      >
        <Check className="w-3 h-3" />
        مُحسّنة
      </span>
    );
  }

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ai/refine", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url, generationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل التحسين");
      if (typeof data.url !== "string") throw new Error("ناتج غير صالح");
      onResult({ url: data.url, originalUrl: data.originalUrl ?? url });
      toast.success("تم تحسين الجودة ✨");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل التحسين");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={busy}
      type="button"
      title="تحسين الجودة (Upscale × 2 + استرجاع التفاصيل) — 3 كريديت"
      className={cn(
        "w-8 h-8 rounded-lg bg-black/60 backdrop-blur border border-white/15 hover:border-accent-400/60 hover:bg-accent-400/10 flex items-center justify-center transition-colors disabled:opacity-50",
        className,
      )}
    >
      {busy
        ? <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-400" />
        : <Sparkles className="w-3.5 h-3.5 text-white" />}
    </button>
  );
}
