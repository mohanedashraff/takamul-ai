"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, Plus, Minus, Search, LayoutGrid, Check } from "lucide-react";
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
  const searchRef = useRef<HTMLInputElement>(null);

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
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-[#111214] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              style={{ height: "78vh", boxShadow: `0 0 80px rgba(${colorRgb}, 0.08), 0 25px 50px rgba(0,0,0,0.6)` }}
            >
              {/* ── Header ── */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
                <h3 className="text-white font-semibold text-base flex-1">أسلوب الصورة</h3>
                {/* Search */}
                <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 w-52">
                  <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="ابحث في الأساليب..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent text-sm text-white placeholder:text-gray-600 outline-none flex-1 min-w-0"
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
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Body: sidebar + grid ── */}
              <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* Sidebar */}
                <div className="w-48 flex-shrink-0 border-l border-white/[0.06] overflow-y-auto py-3 px-2">
                  {STYLE_CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.key;
                    const count = cat.key === "all"
                      ? allOptions.length
                      : allOptions.filter(o => (o.categories ?? []).includes(cat.key)).length;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => { setActiveCategory(cat.key); setSearch(""); }}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 mb-0.5",
                          isActive ? "font-medium" : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
                        )}
                        style={isActive
                          ? { backgroundColor: `rgba(${colorRgb}, 0.15)`, color: `rgb(${colorRgb})` }
                          : {}}
                      >
                        <span className="truncate text-right">{cat.label}</span>
                        <span
                          className="text-[11px] tabular-nums flex-shrink-0 font-medium px-1.5 py-0.5 rounded-md"
                          style={isActive
                            ? { backgroundColor: `rgba(${colorRgb}, 0.2)`, color: `rgb(${colorRgb})` }
                            : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)" }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  {filtered.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-600">
                      <LayoutGrid className="w-10 h-10 opacity-20" />
                      <p className="text-sm">{search ? `لا نتائج لـ "${search}"` : "لا توجد أساليب في هذه الفئة"}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {filtered.map((opt) => {
                        const isActive = value === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className="group relative rounded-xl overflow-hidden focus:outline-none transition-transform duration-150 hover:scale-[1.03]"
                            style={{
                              aspectRatio: "3/4",
                              boxShadow: isActive
                                ? `0 0 0 2.5px rgb(${colorRgb}), 0 0 16px rgba(${colorRgb}, 0.3)`
                                : "0 0 0 1px rgba(255,255,255,0.07)",
                            }}
                          >
                            {opt.image ? (
                              <img
                                src={opt.image}
                                alt={opt.label}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                <LayoutGrid className="w-6 h-6 text-gray-600" />
                              </div>
                            )}

                            {/* Always-visible label at bottom */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent pt-6 pb-2 px-2">
                              <span className="text-white text-[11px] font-medium leading-tight block truncate">
                                {opt.label}
                              </span>
                            </div>

                            {/* Active checkmark */}
                            {isActive && (
                              <div
                                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: `rgb(${colorRgb})` }}
                              >
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between flex-shrink-0 bg-white/[0.02]">
                <span className="text-xs text-gray-600 tabular-nums">
                  {filtered.length}
                  {search || activeCategory !== "all" ? ` من ${allOptions.length}` : ""} أسلوب
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
