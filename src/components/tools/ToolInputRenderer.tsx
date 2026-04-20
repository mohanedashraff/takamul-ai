"use client";

import React, { useCallback, useState } from "react";
import { Upload, X, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
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
