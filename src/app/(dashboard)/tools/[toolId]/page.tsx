"use client";

import React, { use, useCallback, useEffect, useRef, useState } from "react";
import { MediaRenderer } from "@/components/tools/MediaRenderer";
import { notFound } from "next/navigation";
import { STUDIO_CATEGORIES, ToolCategory, Tool } from "@/lib/data/tools";
import {
  renderToolInput,
  isFormValid,
  initValues,
  type InputValues,
  type InputSetters,
} from "@/components/tools/ToolInputRenderer";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Sparkles, Zap, Download, RotateCcw,
  Loader2, Upload, ImageIcon, X, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { executeTool, isExecutable } from "@/lib/execute-tool";
import { uploadFile, type MuapiResult } from "@/lib/muapi";
import toast from "react-hot-toast";
import { InpaintWorkspace }          from "@/components/tools/InpaintWorkspace";
import { SketchWorkspace }           from "@/components/tools/SketchWorkspace";
import { OutpaintWorkspace }         from "@/components/tools/OutpaintWorkspace";
import { AngleWorkspace }            from "@/components/tools/AngleWorkspace";
import { RelightWorkspace }          from "@/components/tools/RelightWorkspace";
import { MultiSceneWorkspace }       from "@/components/tools/MultiSceneWorkspace";
import { ChangeClothesWorkspace }    from "@/components/tools/ChangeClothesWorkspace";
import { FashionDesignerWorkspace }  from "@/components/tools/FashionDesignerWorkspace";
import { FaceSwapWorkspace }         from "@/components/tools/FaceSwapWorkspace";
import { WhatsNextWorkspace }        from "@/components/tools/WhatsNextWorkspace";
import { SketchToVideoWorkspace }    from "@/components/tools/SketchToVideoWorkspace";
import { VideoTransitionsWorkspace } from "@/components/tools/VideoTransitionsWorkspace";

function findToolById(toolId: string): { tool: Tool; categoryKey: ToolCategory } | null {
  for (const catKey of Object.keys(STUDIO_CATEGORIES) as ToolCategory[]) {
    const found = STUDIO_CATEGORIES[catKey].tools.find((t) => t.id === toolId);
    if (found) return { tool: found, categoryKey: catKey };
  }
  return null;
}

export default function ToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = use(params);
  const result = findToolById(toolId);
  if (!result) notFound();
  const { tool, categoryKey } = result;
  const config = STUDIO_CATEGORIES[categoryKey];

  if (tool.comingSoon) {
    return <ComingSoonInterface tool={tool} config={config} categoryKey={categoryKey} />;
  }

  // Custom-layout workspaces (each has its own canvas / drawing UI)
  switch (tool.layout) {
    case "inpaint":           return <InpaintWorkspace          tool={tool} config={config} />;
    case "sketch":            return <SketchWorkspace           tool={tool} config={config} />;
    case "outpaint":          return <OutpaintWorkspace         tool={tool} config={config} />;
    case "angle":             return <AngleWorkspace            tool={tool} config={config} />;
    case "relight":           return <RelightWorkspace          tool={tool} config={config} />;
    case "multi-scene":       return <MultiSceneWorkspace       tool={tool} config={config} />;
    case "change-clothes":    return <ChangeClothesWorkspace    tool={tool} config={config} />;
    case "fashion-designer":  return <FashionDesignerWorkspace  tool={tool} config={config} />;
    case "face-swap":         return <FaceSwapWorkspace         tool={tool} config={config} />;
    case "whats-next":        return <WhatsNextWorkspace        tool={tool} config={config} />;
    case "sketch-to-video":   return <SketchToVideoWorkspace    tool={tool} config={config} />;
    case "video-transitions": return <VideoTransitionsWorkspace tool={tool} config={config} />;
    case "centered":          return <CenteredToolInterface tool={tool} config={config} categoryKey={categoryKey} />;
    default:                  return <ToolInterface         tool={tool} config={config} categoryKey={categoryKey} />;
  }
}

// ─── Coming Soon Interface ────────────────────────────────────────────────────

function ComingSoonInterface({
  tool,
  config,
  categoryKey,
}: {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
  categoryKey: ToolCategory;
}) {
  const colorRgb = config.shadowColor;
  return (
    <div className="pb-20">
      <Breadcrumb categoryKey={categoryKey} config={config} tool={tool} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl mx-auto text-center pt-12"
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center border border-white/10 mx-auto mb-6"
          style={{ backgroundColor: `rgba(${colorRgb}, 0.1)` }}
        >
          <tool.icon className={cn("w-9 h-9", config.colorClass)} />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-3 leading-snug">{tool.title}</h1>
        <p className="text-gray-400 mb-6">{tool.desc}</p>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold"
          style={{
            color: `rgb(${colorRgb})`,
            borderColor: `rgba(${colorRgb}, 0.3)`,
            backgroundColor: `rgba(${colorRgb}, 0.08)`,
          }}
        >
          <Sparkles className="w-4 h-4" />
          قريباً
        </div>
        <p className="text-gray-500 text-sm mt-6 max-w-md mx-auto leading-relaxed">
          هذه الأداة في طور التطوير وسنطلقها قريباً. تابعنا للحصول على آخر التحديثات.
        </p>
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 mt-8 text-sm font-bold text-gray-400 hover:text-white transition-colors"
        >
          ← استعرض الأدوات المتاحة
        </Link>
      </motion.div>
    </div>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({
  categoryKey,
  config,
  tool,
}: {
  categoryKey: ToolCategory;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
  tool: Tool;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
      <Link href="/tools" className="hover:text-white transition-colors">الأدوات</Link>
      <ArrowRight className="w-3 h-3 rotate-180" />
      <Link
        href={`/studio/${categoryKey}`}
        className={cn("hover:text-white transition-colors", config.colorClass)}
      >
        {config.name}
      </Link>
      <ArrowRight className="w-3 h-3 rotate-180" />
      <span className="text-white font-medium">{tool.title}</span>
    </div>
  );
}

// ─── Centered (single-upload) Interface ───────────────────────────────────────

type Phase = "idle" | "ready" | "processing" | "result";

function CenteredToolInterface({
  tool,
  config,
  categoryKey,
}: {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
  categoryKey: ToolCategory;
}) {
  const uploadInput = tool.inputs[0]; // first (and usually only) upload field
  const accept = uploadInput?.accept ?? "image/*";

  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<MuapiResult | null>(null);
  const [progress, setProgress] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string>("");

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); };
  }, []);

  const pickFile = (f: File) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(f);
    previewRef.current = url;
    setFile(f);
    setPreview(url);
    setPhase("ready");
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
    e.target.value = "";
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const handleGenerate = async () => {
    if (phase !== "ready" || !file) return;

    if (!isExecutable(tool)) {
      toast.error("هذه الأداة لم تُربط بعد بالـ AI backend");
      return;
    }

    setPhase("processing");
    setProgress("جاري رفع الملف...");
    setResult(null);

    try {
      // 1. Upload the file to muapi storage
      const { url } = await uploadFile(file);

      // 2. Build values: the upload field gets the URL, plus default model
      const values: Record<string, unknown> = {
        [uploadInput?.id ?? "image"]: url,
      };
      // Pre-select the first model so executeTool knows where to send
      if (tool.muapi?.models[0]?.id) values.model = tool.muapi.models[0]!.id;

      setProgress("جاري التوليد بالذكاء الاصطناعي…");
      const { result: r } = await executeTool(tool, values, {
        onStatus: (s) => setProgress(statusToArabic(s)),
      });

      setResult(r);
      setPhase("result");
      toast.success("تم بنجاح ✨");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      setPhase("ready");
    } finally {
      setProgress("");
    }
  };

  const handleReset = () => {
    if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = ""; }
    setFile(null);
    setPreview("");
    setPhase("idle");
    setResult(null);
  };

  const colorRgb = config.shadowColor;

  return (
    <div className="pb-20">
      <Breadcrumb categoryKey={categoryKey} config={config} tool={tool} />

      {/* Tool Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-10"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 mx-auto mb-4"
          style={{ backgroundColor: `rgba(${colorRgb}, 0.1)` }}
        >
          <tool.icon className={cn("w-8 h-8", config.colorClass)} />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">{tool.title}</h1>
        <p className="text-gray-400 mb-4">{tool.desc}</p>
        <div className="flex items-center justify-center gap-3">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold border"
            style={{
              color: `rgb(${colorRgb})`,
              borderColor: `rgba(${colorRgb}, 0.3)`,
              backgroundColor: `rgba(${colorRgb}, 0.08)`,
            }}
          >
            {config.name}
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Zap className="w-3.5 h-3.5" /> {tool.credits} كريديت
          </span>
        </div>
      </motion.div>

      {/* Main Card — centered, max-w-2xl */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl mx-auto"
      >
        <AnimatePresence mode="wait">

          {/* ── Phase: idle — drop zone ── */}
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
            >
              <input
                ref={fileRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={onInputChange}
              />
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={cn(
                  "bento-card rounded-[2rem] border-2 border-dashed cursor-pointer transition-all duration-300 select-none",
                  "flex flex-col items-center justify-center gap-5 py-20 px-10 text-center",
                  isDragging
                    ? "scale-[1.01]"
                    : "hover:scale-[1.005]"
                )}
                style={{
                  borderColor: isDragging
                    ? `rgba(${colorRgb}, 0.7)`
                    : `rgba(${colorRgb}, 0.25)`,
                  boxShadow: isDragging
                    ? `0 0 40px rgba(${colorRgb}, 0.15), inset 0 0 40px rgba(${colorRgb}, 0.04)`
                    : `0 0 0px transparent`,
                  backgroundColor: isDragging
                    ? `rgba(${colorRgb}, 0.04)`
                    : undefined,
                }}
              >
                {/* Icon ring */}
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center border-2"
                    style={{
                      borderColor: `rgba(${colorRgb}, 0.3)`,
                      backgroundColor: `rgba(${colorRgb}, 0.07)`,
                    }}
                  >
                    <Upload
                      className="w-10 h-10 transition-transform duration-300"
                      style={{ color: `rgb(${colorRgb})` }}
                    />
                  </div>
                  {/* Pulse ring on drag */}
                  {isDragging && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-20"
                      style={{ backgroundColor: `rgb(${colorRgb})` }}
                    />
                  )}
                </div>

                <div>
                  <p className="text-white font-bold text-xl mb-1">
                    {isDragging ? "أفلت الملف هنا" : "اسحب ملفك هنا"}
                  </p>
                  <p className="text-gray-500 text-sm">
                    أو{" "}
                    <span style={{ color: `rgb(${colorRgb})` }} className="font-semibold">
                      انقر للاختيار
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600 bg-white/4 rounded-full px-4 py-2 border border-white/8">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{uploadInput?.hint ?? "PNG، JPG، MP4"}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Phase: ready — preview + generate ── */}
          {phase === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-5"
            >
              {/* Preview card */}
              <div
                className="bento-card rounded-[2rem] overflow-hidden relative"
                style={{
                  "--hover-border": `rgb(${colorRgb})`,
                  "--hover-shadow": `rgba(${colorRgb}, 0.12)`,
                } as React.CSSProperties}
              >
                {/* Image */}
                <div className="w-full max-h-[60vh] flex items-center justify-center bg-black/40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="معاينة"
                    className="max-w-full max-h-[60vh] object-contain"
                  />
                </div>

                {/* File name bar */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/8">
                  <div className="flex items-center gap-2 text-sm text-gray-400 truncate">
                    <ImageIcon className="w-4 h-4 shrink-0" style={{ color: `rgb(${colorRgb})` }} />
                    <span className="truncate">{file?.name}</span>
                    <span className="text-gray-600 shrink-0">
                      ({file ? (file.size / 1024 / 1024).toFixed(1) : 0} MB)
                    </span>
                  </div>
                  <button
                    onClick={handleReset}
                    className="shrink-0 w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                className="w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:brightness-110 text-white"
                style={{
                  backgroundColor: `rgba(${colorRgb}, 0.2)`,
                  border: `1px solid rgba(${colorRgb}, 0.4)`,
                  boxShadow: `0 0 30px rgba(${colorRgb}, 0.2)`,
                }}
              >
                <Sparkles className="w-5 h-5" />
                ابدأ التحسين
              </button>
            </motion.div>
          )}

          {/* ── Phase: processing ── */}
          {phase === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              className="bento-card rounded-[2rem] overflow-hidden"
            >
              {/* Blurred preview behind */}
              <div className="relative w-full max-h-[60vh] flex items-center justify-center bg-black/40 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="معاينة"
                  className="max-w-full max-h-[60vh] object-contain blur-sm opacity-40 scale-105"
                />
                {/* Spinner overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                  <div className="relative w-20 h-20">
                    <div
                      className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                      style={{
                        borderTopColor: `rgb(${colorRgb})`,
                        borderRightColor: `rgba(${colorRgb}, 0.3)`,
                      }}
                    />
                    <div
                      className="absolute inset-2 rounded-full border-2 border-transparent animate-spin"
                      style={{
                        borderBottomColor: `rgb(${colorRgb})`,
                        animationDirection: "reverse",
                        animationDuration: "1.8s",
                        opacity: 0.5,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <tool.icon className={cn("w-7 h-7 animate-pulse", config.colorClass)} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg mb-1">{progress || "جاري التحسين..."}</p>
                    <p className="text-gray-400 text-sm">المعالجة قد تأخذ من ثوانٍ إلى دقائق</p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="p-5">
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: `rgb(${colorRgb})` }}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Phase: result ── */}
          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-5"
            >
              {/* Before / After comparison */}
              <div
                className="bento-card rounded-[2rem] overflow-hidden"
                style={{
                  "--hover-border": `rgb(${colorRgb})`,
                  "--hover-shadow": `rgba(${colorRgb}, 0.12)`,
                } as React.CSSProperties}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <span
                    className="text-sm font-bold px-3 py-1 rounded-full"
                    style={{
                      color: `rgb(${colorRgb})`,
                      backgroundColor: `rgba(${colorRgb}, 0.1)`,
                    }}
                  >
                    ✨ تم التحسين
                  </span>
                  <span className="text-xs text-gray-500">انقر واسحب للمقارنة</span>
                </div>

                {/* Side-by-side grid */}
                <div className="grid grid-cols-2 gap-px bg-white/8">
                  <div className="relative bg-black/40 overflow-hidden">
                    <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 text-gray-400 border border-white/10">
                      قبل
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="قبل"
                      className="w-full object-cover max-h-[50vh]"
                    />
                  </div>
                  <div className="relative bg-black/40 overflow-hidden">
                    <div
                      className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded border"
                      style={{
                        color: `rgb(${colorRgb})`,
                        backgroundColor: `rgba(${colorRgb}, 0.15)`,
                        borderColor: `rgba(${colorRgb}, 0.3)`,
                      }}
                    >
                      بعد
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={(pickResultMedia(result, preview) as string) || preview}
                      alt="بعد"
                      className="w-full object-cover max-h-[50vh]"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <a
                  href={pickDownloadUrl(result) || "#"}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-13 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-lg"
                  style={{ height: "52px" }}
                >
                  <Download className="w-4 h-4" /> تحميل النتيجة
                </a>
                <button
                  onClick={handleReset}
                  className="h-13 px-5 rounded-2xl border border-white/10 text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-white/5 hover:text-white transition-colors"
                  style={{ height: "52px" }}
                >
                  <RefreshCw className="w-4 h-4" /> صورة جديدة
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Default (sidebar) Interface ──────────────────────────────────────────────

function ToolInterface({
  tool,
  config,
  categoryKey,
}: {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
  categoryKey: ToolCategory;
}) {
  const [values, setValues] = useState(() => initValues(tool.inputs));
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [result, setResult] = useState<MuapiResult | null>(null);
  const [progress, setProgress] = useState<string>("");

  const state: InputValues = { values, files, previews };
  const setters: InputSetters = {
    setValue: (id, val) => setValues((prev) => ({ ...prev, [id]: val })),
    setFile: (id, file) => setFiles((prev) => ({ ...prev, [id]: file })),
    setPreview: (id, url) => setPreviews((prev) => ({ ...prev, [id]: url })),
  };

  const valid = isFormValid(tool.inputs, values, files);

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
      // 1. Upload any File inputs first → muapi expects URLs in the payload
      const merged: Record<string, unknown> = { ...values };
      for (const [id, file] of Object.entries(files)) {
        if (!file) continue;
        setProgress(`جاري رفع ${file.name}…`);
        const { url } = await uploadFile(file);
        merged[id] = url;
      }

      // 2. Submit to muapi + poll
      setProgress("جاري التوليد بالذكاء الاصطناعي…");
      const { result: r } = await executeTool(tool, merged, {
        onStatus: (s) => setProgress(statusToArabic(s)),
      });

      setResult(r);
      setHasResult(true);
      toast.success("تم التوليد بنجاح ✨");
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      toast.error(message);
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

  const colorRgb = config.shadowColor;

  return (
    <div className="pb-20">
      <Breadcrumb categoryKey={categoryKey} config={config} tool={tool} />

      {/* Tool Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10"
            style={{ backgroundColor: `rgba(${colorRgb}, 0.1)` }}
          >
            <tool.icon className={cn("w-7 h-7", config.colorClass)} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">{tool.title}</h1>
            <p className="text-gray-400 mt-0.5">{tool.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold border"
            style={{
              color: `rgb(${colorRgb})`,
              borderColor: `rgba(${colorRgb}, 0.3)`,
              backgroundColor: `rgba(${colorRgb}, 0.08)`,
            }}
          >
            {config.name}
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Zap className="w-3.5 h-3.5" /> {tool.credits} كريديت
          </span>
        </div>
      </motion.div>

      {/* Workspace: 2-column */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Input Panel */}
        <div
          className="bento-card rounded-[2rem] p-7 flex flex-col gap-5"
          style={{ "--hover-border": `rgb(${colorRgb})`, "--hover-shadow": `rgba(${colorRgb}, 0.12)` } as React.CSSProperties}
        >
          <h2 className="text-base font-bold text-white flex items-center gap-2.5">
            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: `rgb(${colorRgb})` }} />
            الإدخالات
          </h2>

          <div className="flex-1 flex flex-col gap-5">
            {tool.inputs.map((input) =>
              renderToolInput(input, state, setters, colorRgb)
            )}
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !valid}
            className={cn(
              "mt-2 w-full h-13 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300",
              isProcessing ? "bg-white/5 text-gray-500 cursor-wait" : "",
              !isProcessing && valid ? "text-white hover:scale-[1.02] hover:brightness-110" : "",
              !isProcessing && !valid ? "bg-white/5 text-gray-600 cursor-not-allowed" : ""
            )}
            style={
              !isProcessing && valid
                ? {
                    backgroundColor: `rgba(${colorRgb}, 0.2)`,
                    border: `1px solid rgba(${colorRgb}, 0.4)`,
                    boxShadow: `0 0 25px rgba(${colorRgb}, 0.2)`,
                    height: "52px",
                  }
                : { height: "52px" }
            }
          >
            {isProcessing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> جاري المعالجة...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> ابدأ التوليد</>
            )}
          </button>
        </div>

        {/* Output Panel */}
        <div
          className="bento-card rounded-[2rem] p-7 flex flex-col"
          style={{ "--hover-border": `rgb(${colorRgb})`, "--hover-shadow": `rgba(${colorRgb}, 0.12)` } as React.CSSProperties}
        >
          <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2.5">
            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: `rgb(${colorRgb})` }} />
            النتيجة
          </h2>

          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    <div
                      className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                      style={{ borderTopColor: `rgb(${colorRgb})`, borderRightColor: `rgba(${colorRgb}, 0.3)` }}
                    />
                    <div
                      className="absolute inset-2 rounded-full border-2 border-transparent animate-spin"
                      style={{ borderBottomColor: `rgb(${colorRgb})`, animationDirection: "reverse", animationDuration: "1.8s", opacity: 0.5 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <tool.icon className={cn("w-7 h-7 animate-pulse", config.colorClass)} />
                    </div>
                  </div>
                  <p className="text-white font-bold mb-1">المحرك يعمل...</p>
                  <p className="text-gray-500 text-sm">{progress || "يتم معالجة طلبك بالذكاء الاصطناعي"}</p>
                </motion.div>
              ) : hasResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
                  className="w-full"
                >
                  <div
                    className="w-full rounded-2xl overflow-hidden mb-5 border border-white/10"
                    style={{ boxShadow: `0 0 40px rgba(${colorRgb}, 0.12)` }}
                  >
                    <div className="w-full aspect-video bg-black relative">
                      <MediaRenderer media={pickResultMedia(result, tool.image)} alt="النتيجة" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={pickDownloadUrl(result) || "#"}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-11 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-lg"
                    >
                      <Download className="w-4 h-4" /> تحميل
                    </a>
                    <button
                      onClick={handleReset}
                      className="h-11 px-4 rounded-xl border border-white/10 text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> إعادة
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8 select-none"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5"
                    style={{ backgroundColor: `rgba(${colorRgb}, 0.05)` }}
                  >
                    <tool.icon className={cn("w-7 h-7 opacity-25", config.colorClass)} />
                  </div>
                  <p className="text-gray-600 text-sm max-w-[220px] mx-auto leading-relaxed">
                    أكمل الإدخالات واضغط &quot;ابدأ التوليد&quot; لرؤية النتيجة هنا
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────

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
  // Common shapes: { url } | { urls: [] } | { outputs: [{ url }] } | { output: '...' }
  const direct = (r.url as string) || (typeof r.output === "string" ? r.output : undefined);
  if (direct) return direct;
  if (Array.isArray(r.urls) && r.urls.length) return r.urls.length === 1 ? r.urls[0]! : r.urls;
  const outputs = r.outputs as unknown;
  if (Array.isArray(outputs)) {
    const urls = outputs
      .map((o) => (typeof o === "string" ? o : (o as { url?: string })?.url))
      .filter((u): u is string => typeof u === "string");
    if (urls.length === 1) return urls[0]!;
    if (urls.length > 1) return urls;
  }
  return fallback;
}

function pickDownloadUrl(r: MuapiResult | null): string | null {
  if (!r) return null;
  const m = pickResultMedia(r, "");
  if (Array.isArray(m)) return m[0] ?? null;
  return m || null;
}
