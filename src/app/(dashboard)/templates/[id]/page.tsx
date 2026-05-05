"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2, ArrowRight, Sparkles, Upload, Download, RotateCcw,
  ImageIcon, AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { uploadFile } from "@/lib/muapi";
import { cn } from "@/lib/utils";

interface InputDef {
  name:        string;
  label?:      string;
  description?:string;
  type:        string;          // "string" | "int" | "float" | "image" | "video" | …
  default?:    unknown;
  enum?:       unknown[];
  required?:   boolean;
  minValue?:   number;
  maxValue?:   number;
  step?:       number;
  examples?:   unknown[];
  // Some upstream schemas wrap inputs in node-specific keys; we flatten
  // before rendering so this is just a sample of what we expect.
  [k: string]: unknown;
}

interface WorkflowDef {
  workflow_id: string;
  name:        string;
  data?:       { nodes?: unknown[] };
}

type Phase = "idle" | "running" | "result" | "error";

export default function TemplateRunPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [def,        setDef]        = useState<WorkflowDef | null>(null);
  const [inputs,     setInputs]     = useState<InputDef[]>([]);
  const [values,     setValues]     = useState<Record<string, unknown>>({});
  const [files,      setFiles]      = useState<Record<string, File | null>>({});
  const [previews,   setPreviews]   = useState<Record<string, string>>({});
  const [loading,    setLoading]    = useState(true);
  const [phase,      setPhase]      = useState<Phase>("idle");
  const [progress,   setProgress]   = useState("");
  const [errorMsg,   setErrorMsg]   = useState("");
  const [outputs,    setOutputs]    = useState<unknown>(null);

  // Load both the input schema and the full def in parallel.
  useEffect(() => {
    Promise.all([
      fetch(`/api/workflow/${id}/api-inputs`,         { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      fetch(`/api/workflow/get-workflow-def/${id}`,   { cache: "no-store" }).then((r) => r.json()).catch(() => null),
    ])
      .then(([schema, defData]) => {
        if (defData?.error) toast.error(defData.error);
        else setDef(defData);

        const list = normalizeInputs(schema, defData);
        setInputs(list);

        // Seed defaults
        const seed: Record<string, unknown> = {};
        for (const inp of list) {
          if (inp.default !== undefined) seed[inp.name] = inp.default;
          else if (inp.examples?.[0] !== undefined) seed[inp.name] = inp.examples[0];
        }
        setValues(seed);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const onFile = (name: string, f: File | null) => {
    setFiles((prev) => ({ ...prev, [name]: f }));
    setPreviews((prev) => {
      if (prev[name]) URL.revokeObjectURL(prev[name]);
      return { ...prev, [name]: f ? URL.createObjectURL(f) : "" };
    });
  };

  const setVal = (name: string, v: unknown) => {
    setValues((prev) => ({ ...prev, [name]: v }));
  };

  const valid = inputs.every((inp) => {
    if (!inp.required) return true;
    if (isFileInput(inp.type)) return !!files[inp.name];
    const v = values[inp.name];
    return v !== undefined && v !== null && v !== "";
  });

  const handleRun = async () => {
    if (!valid || phase === "running") return;
    setPhase("running");
    setOutputs(null);
    setErrorMsg("");
    try {
      // 1. Upload any local files first to get URLs
      const finalValues: Record<string, unknown> = { ...values };
      for (const [name, file] of Object.entries(files)) {
        if (!file) continue;
        setProgress(`جاري رفع ${file.name}…`);
        const { url } = await uploadFile(file);
        finalValues[name] = url;
      }

      // 2. Submit the workflow
      setProgress("جاري بدء التشغيل…");
      const submit = await fetch(`/api/workflow/${id}/api-execute`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ inputs: finalValues }),
      });
      const data = await submit.json().catch(() => ({}));
      if (!submit.ok) throw new Error(data.error || data.detail || "فشل التشغيل");

      const runId: string | undefined = data.run_id || data.id;
      if (!runId) throw new Error("لم يتم استلام معرف التشغيل");

      // 3. Poll for the result
      setProgress("جاري تنفيذ القالب…");
      const out = await pollWorkflow(runId);
      setOutputs(out);
      setPhase("result");
      toast.success("تم تنفيذ القالب ✨");
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطأ";
      setErrorMsg(message);
      setPhase("error");
    } finally {
      setProgress("");
    }
  };

  const handleReset = () => {
    setPhase("idle");
    setOutputs(null);
    setErrorMsg("");
  };

  // Pick rendered URLs from arbitrary output shapes.
  const resultUrls = useMemo(() => collectUrls(outputs), [outputs]);

  return (
    <div className="site-container py-8 pb-24 space-y-6">
      <Link
        href="/templates"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        رجوع لكل القوالب
      </Link>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="bento-card rounded-3xl border border-white/10 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-400/30 bg-accent-400/8 text-accent-400 text-xs font-bold mb-3">
              <Sparkles className="w-3 h-3" />
              قالب MuAPI
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{def?.name ?? "قالب"}</h1>
            {def?.data?.nodes && (
              <p className="text-xs text-gray-500 mt-2">
                يحتوي على {(def.data.nodes as unknown[]).length} خطوة
              </p>
            )}
          </div>

          {/* Form + Output side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="bento-card rounded-3xl border border-white/10 p-6 space-y-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-accent-400" />
                المدخلات
              </h2>

              {inputs.length === 0 ? (
                <p className="text-xs text-gray-500">القالب لا يحتاج مدخلات إضافية.</p>
              ) : (
                inputs.map((inp) => (
                  <InputField
                    key={inp.name}
                    inp={inp}
                    value={values[inp.name]}
                    onChange={(v) => setVal(inp.name, v)}
                    file={files[inp.name] ?? null}
                    preview={previews[inp.name] ?? ""}
                    onFile={(f) => onFile(inp.name, f)}
                  />
                ))
              )}

              <button
                onClick={handleRun}
                disabled={!valid || phase === "running"}
                className={cn(
                  "w-full h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all",
                  valid && phase !== "running"
                    ? "bg-accent-400 text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_22px_rgba(254,228,64,0.35)]"
                    : "bg-white/5 text-gray-600 cursor-not-allowed",
                )}
                type="button"
              >
                {phase === "running" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {progress || "جاري التشغيل…"}</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> ابدأ التشغيل</>
                )}
              </button>
            </div>

            {/* Output */}
            <div className="bento-card rounded-3xl border border-white/10 p-6">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-5">
                <div className="w-1.5 h-5 rounded-full bg-accent-400" />
                النتيجة
              </h2>
              {phase === "running" && (
                <div className="py-12 flex flex-col items-center gap-3 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
                  <p className="text-xs text-gray-400">{progress || "جاري المعالجة…"}</p>
                  <p className="text-[10px] text-gray-600">القوالب الكبيرة قد تستغرق دقائق</p>
                </div>
              )}
              {phase === "error" && (
                <div className="py-8 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                  <p className="text-sm text-red-400 font-bold">{errorMsg}</p>
                  <button onClick={handleReset} className="text-xs font-bold text-accent-400 hover:text-white">
                    إعادة المحاولة
                  </button>
                </div>
              )}
              {phase === "result" && resultUrls.length > 0 && (
                <div className="space-y-3">
                  {resultUrls.map((url, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
                      {/\.(mp4|mov|webm)(\?|$)/i.test(url) ? (
                        <video src={url} controls className="w-full" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt={`output ${i + 1}`} className="w-full" />
                      )}
                      <div className="p-3 flex justify-end">
                        <a
                          href={url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-400 hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> تنزيل
                        </a>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleReset}
                    className="w-full h-10 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors text-sm font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> تشغيل جديد
                  </button>
                </div>
              )}
              {phase === "idle" && (
                <div className="py-12 text-center text-xs text-gray-600">
                  املأ المدخلات على اليمين واضغط <span className="text-accent-400 font-bold">ابدأ التشغيل</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────

/** Poll the muapi workflow run until it completes. */
async function pollWorkflow(runId: string): Promise<unknown> {
  const deadline = Date.now() + 30 * 60 * 1000; // 30 min cap
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    const r = await fetch(`/api/workflow/run/${runId}/api-outputs`, { cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    const status = String(data.status ?? "").toLowerCase();
    if (status === "completed" || status === "succeeded" || status === "success") return data.outputs ?? data;
    if (status === "failed" || status === "error") {
      throw new Error(data.error || data.detail || "فشل تنفيذ القالب");
    }
  }
  throw new Error("انتهت المهلة (30 دقيقة)");
}

/** Workflow input schemas come back in slightly different shapes — flatten them. */
function normalizeInputs(schema: unknown, def: unknown): InputDef[] {
  if (Array.isArray(schema)) return schema as InputDef[];
  if (schema && typeof schema === "object") {
    const obj = schema as Record<string, unknown>;
    if (Array.isArray(obj.inputs)) return obj.inputs as InputDef[];
    // Some endpoints return { inputs: { name1: {...}, name2: {...} } }
    if (obj.inputs && typeof obj.inputs === "object") {
      return Object.entries(obj.inputs).map(([k, v]) => ({ name: k, ...(v as object) } as InputDef));
    }
    if (obj.params && Array.isArray(obj.params)) return obj.params as InputDef[];
  }
  // As a fallback, walk the workflow definition's nodes and harvest
  // each node's `input_params`. Useful when api-inputs is empty.
  const nodes = (def as { data?: { nodes?: Array<{ id: string; input_params?: Record<string, unknown> }> } })
    ?.data?.nodes ?? [];
  const out: InputDef[] = [];
  for (const n of nodes) {
    const ip = n.input_params ?? {};
    for (const [k, v] of Object.entries(ip)) {
      out.push({ name: `${n.id}.${k}`, label: k, type: typeof v === "number" ? "int" : "string", default: v as never });
    }
  }
  return out;
}

function isFileInput(type: string | undefined): boolean {
  if (!type) return false;
  const t = type.toLowerCase();
  return t === "file" || t === "image" || t === "video" || t === "audio" || t.includes("upload");
}

function collectUrls(out: unknown): string[] {
  const urls: string[] = [];
  const walk = (x: unknown) => {
    if (typeof x === "string" && /^https?:\/\//.test(x)) urls.push(x);
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") Object.values(x).forEach(walk);
  };
  walk(out);
  return Array.from(new Set(urls));
}

// ── input field renderer ─────────────────────────────────────────────

function InputField({
  inp, value, onChange, file, preview, onFile,
}: {
  inp:      InputDef;
  value:    unknown;
  onChange: (v: unknown) => void;
  file:     File | null;
  preview:  string;
  onFile:   (f: File | null) => void;
}) {
  const label = inp.label || inp.name;
  const type  = (inp.type || "string").toLowerCase();
  const isFile = isFileInput(type);

  if (isFile) {
    const accept =
      type === "image" ? "image/*"
        : type === "video" ? "video/*"
        : type === "audio" ? "audio/*"
        : "image/*,video/*,audio/*";
    return (
      <div>
        <label className="block text-xs font-bold text-gray-400 mb-1.5">
          {label} {inp.required && <span className="text-red-400">*</span>}
        </label>
        {preview ? (
          <div className="relative rounded-xl overflow-hidden border border-white/10 group">
            {/\.(mp4|mov|webm)$/i.test(file?.name ?? "") || type === "video" ? (
              <video src={preview} muted controls className="w-full max-h-48 object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="w-full max-h-48 object-cover" />
            )}
            <button
              onClick={() => onFile(null)}
              className="absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] font-bold bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
            >
              إزالة
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed border-white/10 hover:border-accent-400/40 transition-colors cursor-pointer text-xs text-gray-400">
            <Upload className="w-4 h-4" />
            ارفع ملف
            <input
              type="file"
              accept={accept}
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
            />
          </label>
        )}
        {inp.description && <p className="text-[10px] text-gray-600 mt-1">{inp.description}</p>}
      </div>
    );
  }

  if (Array.isArray(inp.enum) && inp.enum.length > 0) {
    return (
      <div>
        <label className="block text-xs font-bold text-gray-400 mb-1.5">{label}</label>
        <div className="flex flex-wrap gap-1.5">
          {inp.enum.map((opt) => (
            <button
              key={String(opt)}
              onClick={() => onChange(opt)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all",
                value === opt
                  ? "bg-accent-400/20 border-accent-400/50 text-accent-400"
                  : "bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20",
              )}
              type="button"
            >
              {String(opt)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === "int" || type === "float" || type === "number") {
    return (
      <div>
        <label className="block text-xs font-bold text-gray-400 mb-1.5">{label}</label>
        <input
          type="number"
          value={value === undefined ? "" : Number(value)}
          min={inp.minValue}
          max={inp.maxValue}
          step={inp.step ?? (type === "float" ? 0.1 : 1)}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          className="w-full h-11 px-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-400"
        />
        {inp.description && <p className="text-[10px] text-gray-600 mt-1">{inp.description}</p>}
      </div>
    );
  }

  if (type === "boolean" || type === "bool") {
    return (
      <label className="flex items-center justify-between py-2 cursor-pointer">
        <span className="text-xs font-bold text-gray-400">{label}</span>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 accent-accent-400"
        />
      </label>
    );
  }

  // Text / fallback
  const longText = typeof inp.default === "string" && inp.default.length > 80;
  return (
    <div>
      <label className="block text-xs font-bold text-gray-400 mb-1.5">
        {label} {inp.required && <span className="text-red-400">*</span>}
      </label>
      {longText ? (
        <textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 resize-none focus:outline-none focus:border-accent-400"
          dir="auto"
          placeholder={(inp.examples?.[0] as string) ?? ""}
        />
      ) : (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 px-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-400"
          dir="auto"
          placeholder={(inp.examples?.[0] as string) ?? ""}
        />
      )}
      {inp.description && <p className="text-[10px] text-gray-600 mt-1">{inp.description}</p>}
    </div>
  );
}

void ImageIcon;
