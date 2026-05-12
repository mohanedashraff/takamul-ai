"use client";

// ════════════════════════════════════════════════════════════════
// Soul ID — Character Picker overlay
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's "MAKE YOUR OWN CHARACTER" modal:
//
//   Hero:  "MAKE YOUR OWN CHARACTER"  + [Create character ✨]
//   Tabs:  [All] [Soul] [Soul 2.0] [Soul Cinema]
//   Empty: "No characters yet. Create your first one!"
//   Grid:  saved characters with avatar + name + trained badge
//
// Picking a card sets the active character on the parent. "Create
// character" opens an inline upload modal that requires ≥20 photos
// (same minimum as the reference).

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Check, Trash2, Plus, AlertCircle, User } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/muapi";
import type { SoulCharacterRow } from "./types";

const MIN_PHOTOS = 20;
const MAX_PHOTOS = 40;

type Variant = "all" | "soul" | "soul-cinema";

interface Props {
  open:     boolean;
  value:    string | null;
  onChange: (id: string | null) => void;
  onClose:  () => void;
}

export function SoulIDPicker({ open, value, onChange, onClose }: Props) {
  const [tab,   setTab]   = useState<Variant>("all");
  const [chars, setChars] = useState<SoulCharacterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/tools/soul/characters", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.characters)) setChars(d.characters); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  const filtered = tab === "all" ? chars : chars.filter((c) => c.variant === tab);

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("هل تريد حذف هذه الشخصية نهائياً؟")) return;
    try {
      const r = await fetch(`/api/tools/soul/characters/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      setChars((arr) => arr.filter((c) => c.id !== id));
      if (value === id) onChange(null);
    } catch {
      toast.error("فشل الحذف");
    }
  };

  const onCreated = (newOne: SoulCharacterRow) => {
    setChars((arr) => [newOne, ...arr]);
    setCreateOpen(false);
    onChange(newOne.id);
    onClose();
  };

  return (
    <>
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
                  <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                    اصنع شخصيتك الخاصة
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mt-1 max-w-md">
                    ارفع صور للشخصية من زوايا مختلفة لتدريبها، وبعدها استخدمها بشكل ثابت في كل توليد.
                  </p>
                  <button
                    onClick={() => setCreateOpen(true)}
                    type="button"
                    className="mt-3 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-accent-400 text-black font-bold text-sm hover:scale-[1.02] active:scale-95 transition-transform shadow-[0_0_20px_rgba(254,228,64,0.3)]"
                  >
                    أنشئ شخصية
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

              {/* Variant tabs */}
              <div className="px-5 sm:px-6 pb-3 flex-shrink-0">
                <div className="flex bg-white/[0.04] border border-white/10 rounded-xl p-1 gap-1 w-fit">
                  {(["all", "soul", "soul-cinema"] as Variant[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setTab(v)}
                      type="button"
                      className={cn(
                        "h-7 px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                        tab === v ? "bg-white/10 text-white" : "text-gray-400 hover:text-white",
                      )}
                    >
                      {v === "all" ? "الكل" :
                       v === "soul-cinema" ? "Soul Cinema" : "Soul"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6">
                {loading ? (
                  <div className="py-16 text-center text-sm text-gray-500">جاري التحميل…</div>
                ) : filtered.length === 0 ? (
                  <div className="py-16 flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-accent-400/10 border border-accent-400/30 flex items-center justify-center">
                      <User className="w-8 h-8 text-accent-400" />
                    </div>
                    <p className="text-sm text-white font-bold">لسه ما عملتش شخصيات. أنشئ أول شخصية!</p>
                    <p className="text-xs text-gray-500 max-w-xs">
                      اضغط <span className="text-accent-400 font-bold">أنشئ شخصية</span> فوق لرفع ٢٠+ صورة من زوايا مختلفة.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filtered.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { onChange(c.id); onClose(); }}
                        className={cn(
                          "relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all group text-right",
                          value === c.id
                            ? "border-accent-400 shadow-[0_0_18px_rgba(254,228,64,0.3)]"
                            : "border-white/10 hover:border-white/30",
                        )}
                      >
                        {c.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.thumbnail} alt={c.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-accent-400/10 flex items-center justify-center">
                            <User className="w-10 h-10 text-white/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 inset-x-0 p-2.5 text-right">
                          <div className="text-white text-xs font-black truncate">{c.name}</div>
                          <div className="text-[10px] text-white/55 truncate">
                            {c.imageUrls.length} صورة · {c.variant}
                          </div>
                        </div>
                        {!c.trained && (
                          <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-400/90 text-black flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            جاري التدريب
                          </div>
                        )}
                        {c.trained && (
                          <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-500/90 text-black flex items-center justify-center shadow">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </div>
                        )}
                        <button
                          onClick={(e) => remove(c.id, e)}
                          type="button"
                          aria-label="حذف"
                          className="absolute top-1.5 left-1.5 w-7 h-7 rounded-lg bg-black/70 border border-white/15 text-red-400 hover:bg-red-500/30 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateCharacterModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={onCreated}
      />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Inline "Create character" modal — same upload pattern as the
// moodboard builder, but with a 20-photo minimum + variant picker.
// ────────────────────────────────────────────────────────────────────

interface UploadingFile {
  id:        string;
  file?:     File;
  url?:      string;
  preview:   string;
  progress:  number;
  error?:    string;
}

function CreateCharacterModal({
  open, onClose, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (c: SoulCharacterRow) => void;
}) {
  const [files,   setFiles]   = useState<UploadingFile[]>([]);
  const [name,    setName]    = useState("");
  const [variant, setVariant] = useState<"soul" | "soul-cinema">("soul");
  const [saving,  setSaving]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    files.forEach((f) => { if (f.preview && f.file) URL.revokeObjectURL(f.preview); });
    setFiles([]);
    setName("");
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const enqueue = async (picked: File[]) => {
    const room = MAX_PHOTOS - files.length;
    if (room <= 0) return;
    const slice = picked.slice(0, room);
    const newOnes: UploadingFile[] = slice.map((file) => ({
      id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), progress: 0,
    }));
    setFiles((arr) => [...arr, ...newOnes]);
    await Promise.all(newOnes.map(async (entry) => {
      try {
        const { url } = await uploadFile(entry.file!, (p) => {
          setFiles((arr) => arr.map((f) => f.id === entry.id ? { ...f, progress: p } : f));
        });
        setFiles((arr) => arr.map((f) => f.id === entry.id ? { ...f, url, progress: 100, file: undefined } : f));
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
  const stillUploading = files.some((f) => !f.url && !f.error);

  const save = async () => {
    if (!ready) return;
    setSaving(true);
    try {
      const r = await fetch("/api/tools/soul/characters", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:      name.trim(),
          variant,
          imageUrls: files.map((f) => f.url!).filter(Boolean),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "فشل الحفظ");
      toast.success("تم إنشاء الشخصية ✨");
      onCreated(data.character);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6"
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
                <h3 className="text-lg sm:text-xl font-black text-white">أنشئ شخصية</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  ارفع على الأقل {MIN_PHOTOS} صورة (وجه + جسم بزوايا متعددة).
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

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-5 space-y-4">
              {/* Upload zone */}
              <button
                onClick={() => fileRef.current?.click()}
                type="button"
                className="w-full h-28 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-accent-400/40 hover:bg-accent-400/5 transition-colors flex flex-col items-center justify-center gap-2"
              >
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-sm font-bold text-white">إضافة صور</span>
              </button>
              <input
                ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick}
              />

              {/* Photo grid */}
              {files.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2">
                  {files.map((f) => (
                    <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      {f.url ? (
                        <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-emerald-500/90 text-black flex items-center justify-center">
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </div>
                      ) : f.error ? (
                        <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-red-200" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-accent-400" />
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(f.id)}
                        type="button"
                        aria-label="إزالة"
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 border border-white/15 text-white/80 hover:bg-red-500/80 transition-colors flex items-center justify-center"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Counter */}
              <div className="flex items-center justify-between text-xs">
                <span className={cn("tabular-nums font-bold", files.length >= MIN_PHOTOS ? "text-accent-400" : "text-gray-500")}>
                  {files.length} / {MIN_PHOTOS}+ مطلوبة
                </span>
                {files.length < MIN_PHOTOS && (
                  <span className="text-gray-500">{MIN_PHOTOS - files.length} متبقية</span>
                )}
              </div>

              {/* Variant + name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">اسم الشخصية</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: Sarah المُصممة"
                    maxLength={100}
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-400/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">الموديل</label>
                  <select
                    value={variant}
                    onChange={(e) => setVariant(e.target.value as typeof variant)}
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:border-accent-400/40"
                  >
                    <option value="soul">Soul</option>
                    <option value="soul-cinema">Soul Cinema</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.06] p-4 sm:p-5 flex justify-end gap-2 flex-shrink-0">
              <button
                onClick={handleClose}
                type="button"
                className="h-11 px-4 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-bold transition-colors"
              >
                إلغاء
              </button>
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
                {stillUploading ? "جاري الرفع…" : "ابدأ التدريب"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
