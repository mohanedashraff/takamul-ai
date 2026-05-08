"use client";

// ════════════════════════════════════════════════════════════════
// EnhancePromptButton — sparkle button that auto-expands a prompt
// ════════════════════════════════════════════════════════════════
// Sits next to a textarea. On click it POSTs the current text to
// /api/ai/enhance-prompt with the right variant, then replaces the
// textarea content with the expansion.
//
// Usage:
//   <EnhancePromptButton
//     prompt={prompt}
//     variant="soul"
//     onResult={setPrompt}
//   />

import React, { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export type EnhanceVariant = "soul" | "cinema" | "marketing" | "generic";

interface Props {
  prompt:   string;
  variant:  EnhanceVariant;
  onResult: (enhanced: string) => void;
  /** Render compact (icon-only). Defaults to false (icon + label). */
  compact?: boolean;
  /** Disabled when the parent is busy generating. */
  disabled?: boolean;
  className?: string;
}

export function EnhancePromptButton({
  prompt, variant, onResult, compact = false, disabled, className,
}: Props) {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast.error("اكتب وصف قصير الأول");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ai/enhance-prompt", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt: trimmed, variant }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل التحسين");
      if (typeof data.enhanced !== "string" || !data.enhanced.trim()) {
        throw new Error("لم نحصل على ناتج من النموذج");
      }
      onResult(data.enhanced.trim());
      toast.success("تم تحسين الوصف ✨");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل التحسين");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={busy || disabled}
      type="button"
      title="تحسين الوصف بالذكاء الاصطناعي"
      className={cn(
        "h-10 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5 disabled:opacity-50",
        compact ? "px-2.5" : "px-3",
        className,
      )}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
      {!compact && (busy ? "جاري التحسين…" : "تحسين الوصف")}
    </button>
  );
}
