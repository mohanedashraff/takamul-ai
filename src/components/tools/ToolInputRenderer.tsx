"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, Plus, Minus, Search, LayoutGrid, Check, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { STYLE_CATEGORIES } from "@/lib/data/tools";
import type { ToolInput } from "@/lib/data/tools";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InputValues {
  values: Record<string, any>;
  files: Record<string, File | null>;
  previews: Record<string, string>;
}

export interface InputSetters {
  setValue: (id: string, val: any) => void;
  setFile: (id: string, file: File | null) => void;
  setPreview: (id: string, url: string) => void;
}

// ── Upload Zone ───────────────────────────────────────────────────────────────

function UploadZone({
  input,
  file,
  preview,
  onFile,
  colorRgb,
}: {
  input: ToolInput;
  file: File | null;
  preview: string;
  onFile: (f: File | null) => void;
  colorRgb: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  const isVideo = file?.type.startsWith("video");

  return (
    <div className="space-y-2">
      {input.label && (
        <label className="text-sm text-gray-400 font-medium block">
          {input.label}
          {input.required && <span className="text-red-400 mr-1">*</span>}
        </label>
      )}

      <div
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer group overflow-hidden",
          isDragging ? "border-current bg-white/5" : "border-white/10 hover:border-white/20",
          preview ? "border-solid border-white/10" : ""
        )}
        style={isDragging ? { borderColor: `rgba(${colorRgb}, 0.6)` } : {}}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={input.accept}
          className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
          onChange={handleChange}
        />

        {preview ? (
          <div className="relative">
            {isVideo ? (
              <video
                src={preview}
                className="w-full max-h-52 object-cover rounded-xl"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={preview}
                alt="preview"
                className="w-full max-h-52 object-cover rounded-xl"
              />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
              }}
              className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/70 border border-white/20 flex items-center justify-center hover:bg-red-500/80 transition-colors z-20"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl">
              <p className="text-xs text-gray-300 truncate">{file?.name}</p>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors"
              style={{ backgroundColor: `rgba(${colorRgb}, 0.08)` }}
            >
              <Upload
                className="w-6 h-6 transition-colors"
                style={{ color: `rgba(${colorRgb}, 0.5)` }}
              />
            </div>
            <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
              اسحب هنا أو{" "}
              <span className="font-bold" style={{ color: `rgb(${colorRgb})` }}>
                اختر ملف
              </span>
            </p>
            {input.hint && (
              <p className="text-xs text-gray-700 mt-1.5">{input.hint}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Button Group ──────────────────────────────────────────────────────────────

function ButtonGroup({
  input,
  value,
  onChange,
  colorRgb,
}: {
  input: ToolInput;
  value: string;
  onChange: (v: string) => void;
  colorRgb: string;
}) {
  return (
    <div className="space-y-2.5">
      {input.label && (
        <label className="text-sm text-gray-400 font-medium block">
          {input.label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {input.options?.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border",
                isActive
                  ? "text-white border-transparent"
                  : "text-gray-400 border-white/10 hover:border-white/20 hover:text-white bg-white/5"
              )}
              style={
                isActive
                  ? {
                      backgroundColor: `rgba(${colorRgb}, 0.2)`,
                      borderColor: `rgba(${colorRgb}, 0.5)`,
                      boxShadow: `0 0 12px rgba(${colorRgb}, 0.2)`,
                    }
                  : {}
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Multi Upload ─────────────────────────────────────────────────────────────

function MultiUploadInput({
  input,
  files,
  onChange,
  colorRgb,
}: {
  input: ToolInput;
  files: File[];
  onChange: (files: File[]) => void;
  colorRgb: string;
}) {
  const maxFiles = input.maxFiles ?? 5;
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate/revoke object URLs whenever files change
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    const merged = [...files, ...picked].slice(0, maxFiles);
    onChange(merged);
    // reset input so same file can be re-picked
    e.target.value = "";
  };

  const handleRemove = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => !input.accept || f.type.match(input.accept.replace("*", ".*"))
    );
    const merged = [...files, ...dropped].slice(0, maxFiles);
    onChange(merged);
  };

  const canAdd = files.length < maxFiles;

  return (
    <div className="space-y-2.5">
      {input.label && (
        <label className="text-sm text-gray-400 font-medium block">
          {input.label}
          {input.hint && (
            <span className="text-gray-600 font-normal mr-2 text-xs">{input.hint}</span>
          )}
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        {/* Filled slots */}
        {previews.map((url, idx) => (
          <div
            key={idx}
            className="relative w-[72px] h-[72px] rounded-xl overflow-hidden border border-white/10 flex-shrink-0 group"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <div className="w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-white" />
              </div>
            </button>
            {/* index badge */}
            <div className="absolute bottom-1 right-1 text-[9px] font-bold text-white/50 leading-none">
              {idx + 1}
            </div>
          </div>
        ))}

        {/* Add slot */}
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="w-[72px] h-[72px] rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 transition-all hover:border-white/25 flex-shrink-0"
            style={{ backgroundColor: `rgba(${colorRgb}, 0.04)` }}
          >
            <Plus className="w-5 h-5" style={{ color: `rgba(${colorRgb}, 0.5)` }} />
            <span className="text-[10px] font-medium" style={{ color: `rgba(${colorRgb}, 0.4)` }}>
              {files.length}/{maxFiles}
            </span>
          </button>
        )}

        {/* Empty remaining slots (visual only) */}
        {Array.from({ length: Math.max(0, Math.min(maxFiles - files.length - 1, maxFiles - 1)) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-[72px] h-[72px] rounded-xl border border-dashed border-white/[0.06] flex-shrink-0"
          />
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={input.accept}
        multiple
        className="hidden"
        onChange={handleAdd}
      />
    </div>
  );
}

// ── Ratio Picker ─────────────────────────────────────────────────────────────

function RatioPickerInput({
  input,
  value,
  onChange,
  colorRgb,
}: {
  input: ToolInput;
  value: string;
  onChange: (v: string) => void;
  colorRgb: string;
}) {
  const BOX = 24; // outer container size in px

  const getRect = (aspect?: [number, number]) => {
    if (!aspect) return null;
    const [w, h] = aspect;
    if (w >= h) return { w: BOX, h: Math.max(4, Math.round(BOX * h / w)) };
    return { w: Math.max(4, Math.round(BOX * w / h)), h: BOX };
  };

  return (
    <div className="space-y-2.5">
      {input.label && (
        <label className="text-sm text-gray-400 font-medium block">{input.label}</label>
      )}
      <div className="flex flex-wrap gap-2">
        {input.options?.map((opt) => {
          const isActive = value === opt.value;
          const rect = getRect(opt.aspect);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all duration-200 min-w-[52px]",
                isActive
                  ? "border-transparent"
                  : "border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06]"
              )}
              style={isActive ? {
                backgroundColor: `rgba(${colorRgb}, 0.15)`,
                borderColor: `rgba(${colorRgb}, 0.45)`,
              } : {}}
            >
              {/* Visual rectangle */}
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: BOX, height: BOX }}
              >
                {rect ? (
                  <div
                    className="rounded-[2px] border-[1.5px] transition-colors"
                    style={{
                      width: rect.w,
                      height: rect.h,
                      borderColor: isActive ? `rgb(${colorRgb})` : "rgba(255,255,255,0.35)",
                    }}
                  />
                ) : (
                  /* auto — dashed square */
                  <div
                    className="rounded-[3px] transition-colors"
                    style={{
                      width: BOX - 2,
                      height: BOX - 2,
                      border: `1.5px dashed ${isActive ? `rgb(${colorRgb})` : "rgba(255,255,255,0.35)"}`,
                    }}
                  />
                )}
              </div>
              {/* Label */}
              <span
                className="text-[11px] font-semibold tabular-nums leading-none transition-colors"
                style={{ color: isActive ? `rgb(${colorRgb})` : "rgba(255,255,255,0.5)" }}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Slider ────────────────────────────────────────────────────────────────────

function SliderInput({
  input,
  value,
  onChange,
  colorRgb,
}: {
  input: ToolInput;
  value: number;
  onChange: (v: number) => void;
  colorRgb: string;
}) {
  const min = input.min ?? 0;
  const max = input.max ?? 100;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-400 font-medium">
          {input.label}
        </label>
        <span
          className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-lg"
          style={{ color: `rgb(${colorRgb})`, backgroundColor: `rgba(${colorRgb}, 0.1)` }}
        >
          {value}
          {input.unit ?? ""}
        </span>
      </div>

      <div className="relative h-1.5 rounded-full bg-white/10">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: `rgb(${colorRgb})` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={input.step ?? 1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-bg-primary shadow-lg transition-all pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)`, backgroundColor: `rgb(${colorRgb})` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-600">
        <span>{min}{input.unit ?? ""}</span>
        <span>{max}{input.unit ?? ""}</span>
      </div>
    </div>
  );
}

// ── Color Picker ──────────────────────────────────────────────────────────────

function ColorInput({
  input,
  value,
  onChange,
}: {
  input: ToolInput;
  value: string;
  onChange: (v: string) => void;
}) {
  const color = value || input.defaultValue || "#ffffff";

  return (
    <div className="space-y-2.5">
      {input.label && (
        <label className="text-sm text-gray-400 font-medium block">
          {input.label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/10 cursor-pointer flex-shrink-0 shadow-lg">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div
            className="w-full h-full rounded-xl"
            style={{ backgroundColor: color }}
          />
        </div>
        <div>
          <p className="text-sm font-mono text-white font-bold">{color.toUpperCase()}</p>
          <p className="text-xs text-gray-500">اضغط لتغيير اللون</p>
        </div>
      </div>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function ToggleInput({
  input,
  value,
  onChange,
  colorRgb,
}: {
  input: ToolInput;
  value: boolean;
  onChange: (v: boolean) => void;
  colorRgb: string;
}) {
  const isOn = value ?? input.defaultValue ?? false;

  return (
    <div className="flex items-center justify-between py-1">
      {input.label && (
        <label className="text-sm text-gray-400 font-medium cursor-pointer" onClick={() => onChange(!isOn)}>
          {input.label}
        </label>
      )}
      <button
        type="button"
        onClick={() => onChange(!isOn)}
        className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 border border-white/10"
        style={isOn ? { backgroundColor: `rgba(${colorRgb}, 0.3)`, borderColor: `rgba(${colorRgb}, 0.5)` } : { backgroundColor: "rgba(255,255,255,0.05)" }}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-md"
          style={{
            [isOn ? "right" : "left"]: "2px",
            backgroundColor: isOn ? `rgb(${colorRgb})` : "rgba(255,255,255,0.3)",
          }}
        />
      </button>
    </div>
  );
}

// ── Counter ───────────────────────────────────────────────────────────────────

function CounterInput({
  input,
  value,
  onChange,
  colorRgb,
}: {
  input: ToolInput;
  value: number;
  onChange: (v: number) => void;
  colorRgb: string;
}) {
  const count = value ?? input.defaultValue ?? 1;
  const min = input.min ?? 1;
  const max = input.max ?? 10;

  return (
    <div className="space-y-2.5">
      {input.label && (
        <label className="text-sm text-gray-400 font-medium block">
          {input.label}
        </label>
      )}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, count - 1))}
          disabled={count <= min}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="w-4 h-4 text-white" />
        </button>
        <span
          className="w-10 text-center font-black text-2xl"
          style={{ color: `rgb(${colorRgb})` }}
        >
          {count}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, count + 1))}
          disabled={count >= max}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
        <span className="text-sm text-gray-500">من {max}</span>
      </div>
    </div>
  );
}

// ── Prompt / Textarea ─────────────────────────────────────────────────────────

function PromptInput({
  input,
  value,
  onChange,
  colorRgb,
}: {
  input: ToolInput;
  value: string;
  onChange: (v: string) => void;
  colorRgb: string;
}) {
  return (
    <div className="space-y-2.5">
      {input.label && (
        <label className="text-sm text-gray-400 font-medium block">
          {input.label}
          {input.required && <span className="text-red-400 mr-1">*</span>}
        </label>
      )}
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={input.placeholder}
        rows={4}
        className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-600 resize-none focus:outline-none transition-all text-sm leading-relaxed"
        style={value ? { boxShadow: `0 0 0 1px rgba(${colorRgb}, 0.4)`, borderColor: `rgba(${colorRgb}, 0.3)` } : {}}
        dir="rtl"
      />
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────

function SelectInput({
  input,
  value,
  onChange,
  colorRgb,
}: {
  input: ToolInput;
  value: string;
  onChange: (v: string) => void;
  colorRgb: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = input.options?.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  return (
    <div className="space-y-2.5" ref={ref}>
      {input.label && (
        <label className="text-sm text-gray-400 font-medium block">{input.label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-sm transition-all duration-200",
            open
              ? "border-white/20 bg-white/[0.07]"
              : "border-white/10 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.06]"
          )}
          style={open ? { borderColor: `rgba(${colorRgb}, 0.4)`, boxShadow: `0 0 0 1px rgba(${colorRgb}, 0.15)` } : {}}
        >
          <span className="text-white font-medium truncate">{selected?.label ?? "اختر..."}</span>
          <ChevronDown
            className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full mt-1.5 left-0 right-0 bg-[#1a1b1e] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl"
            >
              {input.options?.map((opt) => {
                const isActive = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={cn(
                      "w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center justify-between",
                      isActive ? "text-white font-medium" : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                    )}
                    style={isActive ? { backgroundColor: `rgba(${colorRgb}, 0.12)`, color: `rgb(${colorRgb})` } : {}}
                  >
                    <span>{opt.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Style Picker ──────────────────────────────────────────────────────────────

function StylePickerInput({
  input,
  value,
  onChange,
  colorRgb,
}: {
  input: ToolInput;
  value: string;
  onChange: (v: string) => void;
  colorRgb: string;
}) {
  const [open, setOpen]           = useState(false);
  const [search, setSearch]       = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const searchRef  = useRef<HTMLInputElement>(null);
  const pillsRef   = useRef<HTMLDivElement>(null);

  const checkScroll = useCallback(() => {
    const el = pillsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = pillsRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll, open]);

  const scrollPills = (dir: "left" | "right") => {
    pillsRef.current?.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  };

  const allOptions = input.options ?? [];
  const selected   = allOptions.find((o) => o.value === value);

  // Filter by category then search
  const filtered = allOptions.filter((o) => {
    const matchesCat =
      activeCategory === "all" ||
      (o.categories ?? []).includes(activeCategory);
    const matchesSearch =
      !search || o.label.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Focus search when modal opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 80);
    else { setSearch(""); setActiveCategory("all"); }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]);

  return (
    <div className="space-y-2.5">
      {input.label && (
        <label className="text-sm text-gray-400 font-medium block">{input.label}</label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 text-left group",
          selected
            ? "border-white/20 bg-white/5 hover:border-white/30"
            : "border-white/10 bg-white/[0.03] hover:border-white/20"
        )}
      >
        {selected?.image ? (
          <img
            src={selected.image}
            alt={selected.label}
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-white/10"
            style={{ aspectRatio: "3/4" }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10"
            style={{ backgroundColor: `rgba(${colorRgb}, 0.08)` }}
          >
            <LayoutGrid className="w-4 h-4" style={{ color: `rgba(${colorRgb}, 0.5)` }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {selected ? selected.label : "اختر أسلوب الصورة"}
          </p>
          {input.hint && !selected && (
            <p className="text-xs text-gray-600 mt-0.5 truncate">{input.hint}</p>
          )}
        </div>
        <div
          className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
          style={{ color: `rgb(${colorRgb})`, backgroundColor: `rgba(${colorRgb}, 0.1)` }}
        >
          {allOptions.length} أسلوب
        </div>
      </button>

      {/* Clear button when style selected */}
      {selected && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" /> إزالة الأسلوب
        </button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:w-[92vw] sm:max-w-3xl bg-[#111315] border border-white/10 sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
              style={{
                height: "88vh",
                boxShadow: `0 -4px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)`,
              }}
            >
              {/* ── Header ── */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0">
                <h3 className="text-white font-bold text-base flex-1 text-right">أسلوب الصورة</h3>
                <div className="flex items-center gap-2 bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2 flex-1 max-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="ابحث..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent text-sm text-white placeholder:text-gray-600 outline-none flex-1 min-w-0 text-right"
                    dir="rtl"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="text-gray-500 hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Category pills (horizontal scroll + arrows) ── */}
              <div className="relative flex-shrink-0 px-4 pb-3">
                {/* Left fade + arrow */}
                {canScrollLeft && (
                  <div className="absolute right-4 top-0 bottom-3 w-10 flex items-center justify-end z-10 pointer-events-none"
                    style={{ background: "linear-gradient(to left, transparent, #111315 80%)" }}>
                    <button
                      type="button"
                      className="pointer-events-auto w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                      onClick={() => scrollPills("left")}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {/* Right fade + arrow */}
                {canScrollRight && (
                  <div className="absolute left-4 top-0 bottom-3 w-10 flex items-center justify-start z-10 pointer-events-none"
                    style={{ background: "linear-gradient(to right, transparent, #111315 80%)" }}>
                    <button
                      type="button"
                      className="pointer-events-auto w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                      onClick={() => scrollPills("right")}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div
                  ref={pillsRef}
                  className="flex gap-2 overflow-x-auto scrollbar-none"
                  dir="rtl"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {STYLE_CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.key;
                    const count = cat.key === "all"
                      ? allOptions.length
                      : allOptions.filter(o => (o.categories ?? []).includes(cat.key)).length;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => { setActiveCategory(cat.key); setSearch(""); setTimeout(checkScroll, 50); }}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border"
                        style={isActive ? {
                          backgroundColor: `rgba(${colorRgb}, 0.18)`,
                          borderColor: `rgba(${colorRgb}, 0.5)`,
                          color: `rgb(${colorRgb})`,
                        } : {
                          backgroundColor: "rgba(255,255,255,0.04)",
                          borderColor: "rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.45)",
                        }}
                      >
                        <span>{cat.label}</span>
                        <span
                          className="text-[10px] tabular-nums px-1.5 py-0.5 rounded-full font-semibold"
                          style={isActive
                            ? { backgroundColor: `rgba(${colorRgb}, 0.25)`, color: `rgb(${colorRgb})` }
                            : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Grid ── */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
                {filtered.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center gap-3 text-gray-700">
                    <LayoutGrid className="w-10 h-10 opacity-30" />
                    <p className="text-sm">{search ? `لا نتائج لـ "${search}"` : "لا توجد أساليب"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {filtered.map((opt) => {
                      const isActive = value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { onChange(opt.value); setOpen(false); }}
                          className="group relative rounded-2xl overflow-hidden focus:outline-none"
                          style={{
                            aspectRatio: "3/4",
                            boxShadow: isActive
                              ? `0 0 0 3px rgb(${colorRgb})`
                              : "0 0 0 1px rgba(255,255,255,0.07)",
                          }}
                        >
                          {opt.image ? (
                            <img
                              src={opt.image}
                              alt={opt.label}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                              <LayoutGrid className="w-7 h-7 text-gray-600" />
                            </div>
                          )}
                          {/* Label */}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-8 pb-2.5 px-2.5">
                            <span className="text-white text-xs font-semibold leading-tight block text-left" dir="ltr">
                              {opt.label}
                            </span>
                          </div>
                          {/* Active ring + check */}
                          {isActive && (
                            <>
                              <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: `inset 0 0 0 3px rgb(${colorRgb})` }} />
                              <div
                                className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: `rgb(${colorRgb})` }}
                              >
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                              </div>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="px-4 py-3 border-t border-white/[0.05] flex items-center justify-between flex-shrink-0">
                <span className="text-xs text-gray-600 tabular-nums">
                  {filtered.length}{search || activeCategory !== "all" ? ` / ${allOptions.length}` : ""} أسلوب
                </span>
                {value && (
                  <button
                    onClick={() => { onChange(""); setOpen(false); }}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> مسح الاختيار
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Master Renderer ───────────────────────────────────────────────────────────

export function renderToolInput(
  input: ToolInput,
  state: InputValues,
  setters: InputSetters,
  colorRgb: string
): React.ReactNode {
  const { values, files, previews } = state;
  const { setValue, setFile, setPreview } = setters;

  const handleFile = (id: string) => (f: File | null) => {
    if (f) {
      const url = URL.createObjectURL(f);
      setFile(id, f);
      setPreview(id, url);
    } else {
      if (previews[id]) URL.revokeObjectURL(previews[id]);
      setFile(id, null);
      setPreview(id, "");
    }
  };

  switch (input.type) {
    case "upload":
      return (
        <UploadZone
          key={input.id}
          input={input}
          file={files[input.id] ?? null}
          preview={previews[input.id] ?? ""}
          onFile={handleFile(input.id)}
          colorRgb={colorRgb}
        />
      );

    case "prompt":
      return (
        <PromptInput
          key={input.id}
          input={input}
          value={values[input.id] ?? ""}
          onChange={(v) => setValue(input.id, v)}
          colorRgb={colorRgb}
        />
      );

    case "multi-upload":
      return (
        <MultiUploadInput
          key={input.id}
          input={input}
          files={(values[input.id] as File[]) ?? []}
          onChange={(f) => setValue(input.id, f)}
          colorRgb={colorRgb}
        />
      );

    case "button-group":
      return (
        <ButtonGroup
          key={input.id}
          input={input}
          value={values[input.id] ?? input.defaultValue ?? ""}
          onChange={(v) => setValue(input.id, v)}
          colorRgb={colorRgb}
        />
      );

    case "ratio-picker":
      return (
        <RatioPickerInput
          key={input.id}
          input={input}
          value={values[input.id] ?? input.defaultValue ?? ""}
          onChange={(v) => setValue(input.id, v)}
          colorRgb={colorRgb}
        />
      );

    case "slider":
      return (
        <SliderInput
          key={input.id}
          input={input}
          value={values[input.id] ?? input.defaultValue ?? 0}
          onChange={(v) => setValue(input.id, v)}
          colorRgb={colorRgb}
        />
      );

    case "color":
      return (
        <ColorInput
          key={input.id}
          input={input}
          value={values[input.id] ?? input.defaultValue ?? "#ffffff"}
          onChange={(v) => setValue(input.id, v)}
        />
      );

    case "toggle":
      return (
        <ToggleInput
          key={input.id}
          input={input}
          value={values[input.id] ?? input.defaultValue ?? false}
          onChange={(v) => setValue(input.id, v)}
          colorRgb={colorRgb}
        />
      );

    case "counter":
      return (
        <CounterInput
          key={input.id}
          input={input}
          value={values[input.id] ?? input.defaultValue ?? 1}
          onChange={(v) => setValue(input.id, v)}
          colorRgb={colorRgb}
        />
      );

    case "select":
      return (
        <SelectInput
          key={input.id}
          input={input}
          value={values[input.id] ?? input.defaultValue ?? ""}
          onChange={(v) => setValue(input.id, v)}
          colorRgb={colorRgb}
        />
      );

    case "style-picker":
      return (
        <StylePickerInput
          key={input.id}
          input={input}
          value={values[input.id] ?? input.defaultValue ?? ""}
          onChange={(v) => setValue(input.id, v)}
          colorRgb={colorRgb}
        />
      );

    default:
      return null;
  }
}

// ── isFormValid helper ────────────────────────────────────────────────────────

export function isFormValid(
  inputs: ToolInput[],
  values: Record<string, any>,
  files: Record<string, File | null>
): boolean {
  return inputs
    .filter((i) => i.required)
    .every((i) =>
      i.type === "upload" ? !!files[i.id] : !!(values[i.id] ?? "")
    );
}

// ── Default values initializer ────────────────────────────────────────────────

export function initValues(inputs: ToolInput[]): Record<string, any> {
  const defaults: Record<string, any> = {};
  inputs.forEach((i) => {
    if (i.type !== "upload" && i.defaultValue !== undefined) {
      defaults[i.id] = i.defaultValue;
    }
  });
  return defaults;
}
