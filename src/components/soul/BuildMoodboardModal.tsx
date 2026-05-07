"use client";

// ════════════════════════════════════════════════════════════════
// "Build your moodboard" upload modal
// ════════════════════════════════════════════════════════════════
// Mirrors Higgsfield's flow:
//   • Header: "Build your moodboard — Upload at least 5 photos to continue"
//   • Two big upload buttons side by side: "Upload from device" / "Upload from assets"
//   • A grid showing the uploaded photos as you add them, each with an X
//   • Hints: ✅ 20+ photos, one cohesive style, no faces. ❌ Faces, mixed styles, blurry.
//   • Footer: name input + "Save moodboard" CTA (disabled until ≥5 photos + name set)
//
// We hard-gate at 5 photos and cap at 30 (the upper bound Higgsfield
// recommends). Each picked file goes through `uploadFile` (MuAPI
// storage) so we end up with stable URLs the backend can persist.

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Sparkles, Loader2, Check, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/muapi";
import type { SoulMoodboardRow } from "./types";

const MIN_PHOTOS = 5;
const MAX_PHOTOS = 30;

interface Props {
  open:     boolean;
  onClose:  () => void;
  onSaved:  (m: SoulMoodboardRow) => void;
}

interface UploadingFile {
  id:        string;          // local random key
  file?:     File;            // original file (only present until upload finishes)
  url?:      string;           // muapi URL once uploaded
  preview:   string;            // local object URL OR final URL
  progress:  number;            // 0–100
  error?:    string;
}

export function BuildMoodboardModal({ open, onClose, onSaved }: Props) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [name,  setName]  = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Revoke object URLs when the modal closes so we don't leak.
  const handleClose = () => {
    files.forEach((f) => { if (f.preview && f.file) URL.revokeObjectURL(f.preview); });
    setFiles([]);
    setName("");
    onClose();
  };

  // Drop new files into the queue + start uploading them in parallel.
  const enqueue = async (picked: File[]) => {
    const room = MAX_PHOTOS - files.length;
    if (room <= 0) {
      toast.error(`الحد الأقصى ${MAX_PHOTOS} صور`);
      return;
    }
    const slice = picked.slice(0, room);
    const newOnes: UploadingFile[] = slice.map((file) => ({
      id:       crypto.randomUUID(),
      file,
      preview:  URL.createObjectURL(file),
      progress: 0,
    }));
    setFiles((arr) => [...arr, ...newOnes]);

    // Upload in parallel — each result patches its own row.
    await Promise.all(newOnes.map(async (entry) => {
      try {
        const { url } = await uploadFile(entry.file!, (p) => {
          setFiles((arr) => arr.map((f) => f.id === entry.id ? { ...f, progress: p } : f));
        });
        setFiles((arr) => arr.map((f) => f.id === entry.id ? {
          ...f, url, progress: 100, file: undefined,
        } : f));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "فشل الرفع";
        setFiles((arr) => arr.map((f) => f.id === entry.id ? { ...f, error: msg } : f));
      }
    }));
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length) enqueue(picked);
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((arr) => {
      const f = arr.find((x) => x.id === id);
      if (f?.file && f.preview) URL.revokeObjectURL(f.preview);
      return arr.filter((x) => x.id !== id);
    });
  };

  const allUploaded = files.length > 0 && files.every((f) => f.url && !f.error);
  const ready = files.length >= MIN_PHOTOS && allUploaded && name.trim().length > 0 && !saving;

  const save = async () => {
    if (!ready) return;
    setSaving(true);
    try {
      const r = await fetch("/api/tools/soul/moodboards", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:      name.trim(),
          imageUrls: files.map((f) => f.url!).filter(Boolean),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "فشل الحفظ");
      toast.success("تم حفظ الموود بورد ✨");
      onSaved(data.moodboard);
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSaving(false);
    }
  };

  const stillUploading = files.some((f) => !f.url && !f.error);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "#0a0a0f", maxHeight: "92vh" }}
            className="w-full sm:max-w-3xl border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-[0_-12px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 flex items-start justify-between gap-3 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-white">ابنِ موود بورد بنفسك</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  ارفع على الأقل {MIN_PHOTOS} صور للمتابعة.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 shrink-0 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
                type="button"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4 text-gray-300" />
              </button>
            </div>

            {/* Upload area */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UploadButton
                  icon={<Upload className="w-5 h-5" />}
                  title="ارفع من جهازك"
                  onClick={() => fileInputRef.current?.click()}
                />
                {/* Future: hook this up to /assets browser. For v1 it
                    routes through the same device picker as a sensible
                    placeholder. */}
                <UploadButton
                  icon={<Sparkles className="w-5 h-5" />}
                  title="ارفع من ملفاتك"
                  onClick={() => fileInputRef.current?.click()}
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onPick}
                className="hidden"
              />

              {/* Hint row */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  ٢٠+ صورة، ستايل موحّد، بدون وجوه.
                </span>
                <span className="inline-flex items-center gap-1.5 text-red-400">
                  <X className="w-3.5 h-3.5" />
                  الوجوه أو الستايلات المختلطة أو الصور المشوّشة.
                </span>
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 group bg-black/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    {f.url ? (
                      <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-emerald-500/90 text-black flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </div>
                    ) : f.error ? (
                      <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center" title={f.error}>
                        <AlertCircle className="w-5 h-5 text-red-200" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-accent-400" />
                        <span className="absolute bottom-1.5 text-[10px] text-white/70 tabular-nums font-mono">
                          {f.progress}%
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(f.id)}
                      type="button"
                      aria-label="إزالة"
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 border border-white/15 text-white/80 hover:bg-red-500/80 transition-colors flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {/* Empty placeholders so the grid keeps a consistent
                    visual rhythm even when only a few are uploaded. */}
                {files.length < MIN_PHOTOS && Array.from({ length: MIN_PHOTOS - files.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.015]"
                  />
                ))}
              </div>

              {/* Counter */}
              <div className="flex items-center justify-between text-xs">
                <span className={cn(
                  "tabular-nums font-bold",
                  files.length >= MIN_PHOTOS ? "text-accent-400" : "text-gray-500",
                )}>
                  {files.length} / {MAX_PHOTOS}
                </span>
                {files.length < MIN_PHOTOS && (
                  <span className="text-gray-500">{MIN_PHOTOS - files.length} متبقية للحد الأدنى</span>
                )}
              </div>
            </div>

            {/* Footer — name + save */}
            <div className="border-t border-white/[0.06] p-4 sm:p-5 flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم الموود بورد (مثال: حنين Y2K)"
                maxLength={100}
                className="flex-1 h-11 px-4 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-400/40"
              />
              <button
                onClick={save}
                disabled={!ready}
                type="button"
                className={cn(
                  "h-11 px-5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all",
                  ready
                    ? "bg-accent-400 text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_22px_rgba(254,228,64,0.35)]"
                    : "bg-white/5 text-gray-600 cursor-not-allowed",
                )}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {stillUploading ? "جاري الرفع…" : "حفظ الموود بورد"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function UploadButton({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="h-32 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-accent-400/40 hover:bg-accent-400/5 transition-colors flex flex-col items-center justify-center gap-2 group"
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-accent-400/15 group-hover:text-accent-400 text-gray-400 flex items-center justify-center transition-colors">
        {icon}
      </div>
      <span className="text-sm font-bold text-white">{title}</span>
    </button>
  );
}
