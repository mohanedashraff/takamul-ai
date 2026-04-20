"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Sparkles, Zap, Upload, X, Check,
  Download, RefreshCw, Search, ChevronLeft,
} from "lucide-react";
import type { Tool } from "@/lib/data/tools";
import type { STUDIO_CATEGORIES, ToolCategory } from "@/lib/data/tools";

type Phase = "idle" | "processing" | "result";

interface Props {
  tool: Tool;
  config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}

// ── All transition presets (Higgsfield Kling Motion, Arabic labels) ───────────

interface Transition {
  id:    string;
  label: string; // Arabic
  en:    string; // English original (for tooltip / search fallback)
  video: string;
}

const TRANSITIONS: Transition[] = [
  { id: "raven",          label: "انتقال الغراب",    en: "Raven Transition",       video: "https://cdn.higgsfield.ai/kling_motion/ec0c8890-fe56-4d36-a6b8-5a886f4ddc59.mp4" },
  { id: "morph",          label: "تحوّل",             en: "Morph",                   video: "https://cdn.higgsfield.ai/kling_motion/0211305d-a72d-49c0-8ef5-a6f9f1e26ae6.mp4" },
  { id: "air-bending",    label: "تحكم بالهواء",      en: "Air Bending",             video: "https://cdn.higgsfield.ai/kling_motion/1975de3f-ccc9-489b-afdc-0985cac6ece2.mp4" },
  { id: "shadow-smoke",   label: "دخان الظل",         en: "Shadow Smoke",            video: "https://cdn.higgsfield.ai/kling_motion/e5eb378c-6bc4-45a2-a221-c8a139ceb6dd.mp4" },
  { id: "water-bending",  label: "تحكم بالماء",       en: "Water Bending",           video: "https://cdn.higgsfield.ai/kling_motion/4fe58127-2cc9-4023-b32a-087d47c2ed13.mp4" },
  { id: "firelava",       label: "حمم النار",         en: "Firelava",                video: "https://cdn.higgsfield.ai/kling_motion/ce9bd1d9-5a77-48a6-8c25-92ffca2c8e46.mp4" },
  { id: "flying-cam",     label: "كاميرا طائرة",      en: "Flying Cam Transition",   video: "https://cdn.higgsfield.ai/kling_motion/71990a66-268d-4aaf-b5cd-0ee566c07c29.mp4" },
  { id: "melt",           label: "ذوبان",             en: "Melt Transition",         video: "https://cdn.higgsfield.ai/kling_motion/4b8ff2f8-5ba8-40f8-87eb-af655d467b8b.mp4" },
  { id: "splash",         label: "رشّة ماء",          en: "Splash Transition",       video: "https://cdn.higgsfield.ai/kling_motion/812614b7-2d4d-4ec4-b99e-816fe44ce826.mp4" },
  { id: "flame",          label: "لهب",               en: "Flame Transition",        video: "https://cdn.higgsfield.ai/kling_motion/8dd17be3-1ba7-4ce0-bede-be5a0159fcfc.mp4" },
  { id: "smoke",          label: "دخان",              en: "Smoke Transition",        video: "https://cdn.higgsfield.ai/kling_motion/bc070c05-9d3a-45b2-9858-30350ceacc30.mp4" },
  { id: "logo-transform", label: "تحوّل الشعار",      en: "Logo Transform",          video: "https://cdn.higgsfield.ai/kling_motion/af9b47a1-6db9-4a68-bdc4-467a49fca07e.mp4" },
  { id: "hand",           label: "يد عابرة",          en: "Hand Transition",         video: "https://cdn.higgsfield.ai/kling_motion/5ce96e11-d02c-4096-843a-972487971c3c.mp4" },
  { id: "column-wipe",    label: "مسح عمودي",         en: "Column Wipe",             video: "https://cdn.higgsfield.ai/kling_motion/df839982-50b1-4808-bc47-14b747899f1b.mp4" },
  { id: "hole",           label: "ثقب",               en: "Hole Transition",         video: "https://cdn.higgsfield.ai/kling_motion/22875b3c-6301-44ea-b1e0-47ad6a4db5b8.mp4" },
  { id: "display",        label: "عرض شاشة",          en: "Display Transition",      video: "https://cdn.higgsfield.ai/kling_motion/bf105e54-a39b-42dd-9034-303a8fae6b82.mp4" },
  { id: "jump",           label: "قفزة",              en: "Jump Transition",         video: "https://cdn.higgsfield.ai/kling_motion/24f2abc3-ccf9-4a73-9e0a-ebf9d37975d7.mp4" },
  { id: "seamless",       label: "انسيابي",           en: "Seamless Transition",     video: "https://cdn.higgsfield.ai/kling_motion/a76327c9-ae08-4031-a9bf-aab64d7f57ad.mp4" },
  { id: "trucksition",    label: "شاحنة عابرة",       en: "Trucksition",             video: "https://cdn.higgsfield.ai/kling_motion/c30347ed-7ead-4fad-9e4c-f28fab27ccbf.mp4" },
  { id: "gorilla",        label: "نقلة الغوريلا",     en: "Gorilla Transfer",        video: "https://cdn.higgsfield.ai/kling_motion/ed8abe4c-dd35-4462-9b74-44366d203543.mp4" },
  { id: "intermission",   label: "استراحة",           en: "Intermission",            video: "https://cdn.higgsfield.ai/kling_motion/4e3fd227-360e-4269-b4f7-99cac57de016.mp4" },
  { id: "stranger",       label: "غريب",              en: "Stranger Transition",     video: "https://cdn.higgsfield.ai/kling_motion/45aada3d-d7a7-4722-923a-0e1f8cbe8bf3.mp4" },
  { id: "earth-wave",     label: "موجة أرضية",        en: "Earth Wave",              video: "https://cdn.higgsfield.ai/kling_motion/53a52716-1f82-4c0f-9a72-91b31361024a.mp4" },
];

const DURATIONS = ["3", "5", "8"];

// ── Upload slot hook ──────────────────────────────────────────────────────────

function useUploadSlot() {
  const [file,    setFile]    = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const urlRef = useRef("");

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const pick = useCallback((f: File) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(f);
    urlRef.current = url;
    setFile(f);
    setPreview(url);
    setIsVideo(f.type.startsWith("video"));
  }, []);

  const clear = useCallback(() => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = ""; }
    setFile(null);
    setPreview("");
    setIsVideo(false);
  }, []);

  return { file, preview, isVideo, pick, clear };
}

// ── Frame slot component ──────────────────────────────────────────────────────

function FrameSlot({
  label, badge, rgb, onFile, file, preview, isVideo, onClear,
}: {
  label: string; badge: string; rgb: string;
  onFile: (f: File) => void;
  file: File | null; preview: string; isVideo: boolean;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div className="flex-1 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-300">{label}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ color:`rgb(${rgb})`, backgroundColor:`rgba(${rgb},0.1)` }}>
          {badge}
        </span>
      </div>

      <input ref={ref} type="file" accept="image/*,video/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-white/15 group aspect-[3/4]"
          style={{ boxShadow: `0 0 24px rgba(${rgb},0.1)` }}>
          {isVideo ? (
            <video src={preview} className="w-full h-full object-cover" muted loop autoPlay playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20
            opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
            <button onClick={() => ref.current?.click()}
              className="text-xs px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
              تغيير
            </button>
            <button onClick={onClear}
              className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/70 transition-colors">
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          className="relative aspect-[3/4] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 select-none hover:scale-[1.005]"
          style={{
            borderColor:      drag ? `rgba(${rgb},0.7)` : `rgba(${rgb},0.25)`,
            backgroundColor:  drag ? `rgba(${rgb},0.05)` : "rgba(255,255,255,0.02)",
            boxShadow:        drag ? `0 0 30px rgba(${rgb},0.1)` : undefined,
          }}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center border-2"
            style={{ borderColor:`rgba(${rgb},0.3)`, backgroundColor:`rgba(${rgb},0.07)` }}>
            <Upload className="w-6 h-6" style={{ color:`rgb(${rgb})` }} />
          </div>
          <div className="text-center px-3">
            <p className="text-white font-bold mb-0.5 text-sm">{drag ? "أفلت هنا" : "ارفع ملف"}</p>
            <p className="text-gray-600 text-[11px]">صورة أو فيديو</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Transition picker button (sits between the two frames) ────────────────────

function TransitionPickerButton({
  selected, rgb, onClick,
}: {
  selected: Transition; rgb: string; onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center w-[120px] sm:w-[140px] shrink-0 self-center">
      <button
        type="button"
        onClick={onClick}
        className="group relative w-full aspect-[3/4] rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02]"
        style={{
          borderColor: `rgba(${rgb},0.45)`,
          boxShadow:   `0 0 28px rgba(${rgb},0.18)`,
        }}
      >
        <video
          key={selected.id}
          src={selected.video}
          muted loop autoPlay playsInline preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />

        {/* Top label */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-white border border-white/20">
            الانتقال
          </span>
          <div className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor:`rgb(${rgb})` }}>
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Bottom name + change hint */}
        <div className="absolute bottom-0 inset-x-0 p-2.5 flex flex-col items-center text-center gap-0.5">
          <span className="text-white font-bold text-sm leading-tight line-clamp-2">
            {selected.label}
          </span>
          <span className="text-[10px] font-semibold mt-0.5 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 group-hover:bg-white/25 transition-colors">
            انقر للتغيير
          </span>
        </div>
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function VideoTransitionsWorkspace({ tool, config }: Props) {
  const router = useRouter();
  const rgb    = config.shadowColor;

  const [phase,      setPhase]      = useState<Phase>("idle");
  const [resultUrl,  setResultUrl]  = useState("");
  const [styleId,    setStyleId]    = useState<string>("raven");
  const [duration,   setDuration]   = useState<string>("5");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search,     setSearch]     = useState("");

  const start = useUploadSlot();
  const end   = useUploadSlot();

  const selected = TRANSITIONS.find(t => t.id === styleId) ?? TRANSITIONS[0];
  const canGenerate = !!start.file && !!end.file;

  const reset = () => {
    start.clear();
    end.clear();
    setStyleId("raven");
    setDuration("5");
    setPhase("idle");
    setResultUrl("");
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    setPhase("processing");
    setTimeout(() => {
      setResultUrl(selected.video);
      setPhase("result");
    }, 4500);
  };

  // Close modal on Escape
  useEffect(() => {
    if (!pickerOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setPickerOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [pickerOpen]);

  // Reset search when modal closes
  useEffect(() => { if (!pickerOpen) setSearch(""); }, [pickerOpen]);

  const filtered = TRANSITIONS.filter(t =>
    !search ||
    t.label.includes(search) ||
    t.en.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Navbar />
      <div className="flex flex-1 flex-col overflow-hidden pt-16 md:pt-20">

        {/* Top bar */}
        <div className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10"
              style={{ backgroundColor:`rgba(${rgb},0.12)` }}>
              <tool.icon className={cn("w-4 h-4", config.colorClass)} />
            </div>
            <span className="text-white font-bold text-sm">{tool.title}</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ color:`rgb(${rgb})`, backgroundColor:`rgba(${rgb},0.1)` }}>
            <Zap className="w-3 h-3" /> {tool.credits} كريديت
          </span>
        </div>

        {/* Main scroll area */}
        <div className="flex-1 overflow-y-auto flex items-start justify-center p-6">
          <div className="w-full max-w-3xl">
            <AnimatePresence mode="wait">

              {/* ── idle / configure ── */}
              {phase === "idle" && (
                <motion.div key="idle"
                  initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.97 }}
                  transition={{ duration:0.3 }}
                  className="flex flex-col gap-6"
                >
                  {/* Header */}
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 mx-auto mb-3"
                      style={{ backgroundColor:`rgba(${rgb},0.1)` }}>
                      <tool.icon className={cn("w-7 h-7", config.colorClass)} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-1">{tool.title}</h1>
                    <p className="text-gray-500 text-sm">{tool.desc}</p>
                  </div>

                  {/* ── Start frame + TRANSITION PICKER BUTTON + end frame ── */}
                  <div className="flex items-stretch gap-3 sm:gap-4">
                    <FrameSlot
                      label="الإطار الأول" badge="START" rgb={rgb}
                      onFile={start.pick}  file={start.file}  preview={start.preview}
                      isVideo={start.isVideo} onClear={start.clear}
                    />
                    <TransitionPickerButton
                      selected={selected} rgb={rgb}
                      onClick={() => setPickerOpen(true)}
                    />
                    <FrameSlot
                      label="الإطار الأخير" badge="END" rgb={rgb}
                      onFile={end.pick}    file={end.file}   preview={end.preview}
                      isVideo={end.isVideo} onClear={end.clear}
                    />
                  </div>

                  {/* ── Duration ── */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-300">مدة الانتقال</p>
                      <span className="text-xs text-gray-600">بالثواني</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {DURATIONS.map(d => (
                        <button key={d} onClick={() => setDuration(d)}
                          className={cn("h-11 rounded-xl text-sm font-bold transition-all",
                            duration === d ? "text-white" : "bg-white/5 text-gray-500 hover:text-gray-300 border border-white/10")}
                          style={duration === d ? {
                            backgroundColor:`rgba(${rgb},0.2)`,
                            border: `1px solid rgba(${rgb},0.45)`,
                            boxShadow:`0 0 18px rgba(${rgb},0.18)`,
                          } : {}}
                        >{d} ث</button>
                      ))}
                    </div>
                  </div>

                  {/* ── Generate ── */}
                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className={cn(
                      "w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300",
                      canGenerate
                        ? "text-white hover:scale-[1.02] hover:brightness-110 cursor-pointer"
                        : "bg-white/5 text-gray-600 cursor-not-allowed"
                    )}
                    style={canGenerate ? {
                      backgroundColor:`rgba(${rgb},0.2)`,
                      border: `1px solid rgba(${rgb},0.45)`,
                      boxShadow:`0 0 28px rgba(${rgb},0.2)`,
                    } : {}}
                  >
                    <Sparkles className="w-5 h-5" />
                    {canGenerate
                      ? `توليد انتقال ${selected.label} — ${duration} ث`
                      : "ارفع الإطارين للبدء"}
                  </button>
                </motion.div>
              )}

              {/* ── processing ── */}
              {phase === "processing" && (
                <motion.div key="processing"
                  initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                  transition={{ duration:0.3 }}
                  className="flex flex-col gap-4"
                >
                  <div className="rounded-3xl overflow-hidden border border-white/10"
                    style={{ boxShadow:`0 0 50px rgba(${rgb},0.12)` }}>
                    <div className="grid grid-cols-3 gap-px bg-white/5" style={{ height: 260 }}>
                      <div className="relative bg-black/50 overflow-hidden">
                        {start.isVideo
                          ? <video src={start.preview} className="w-full h-full object-cover blur-sm opacity-60" muted loop autoPlay playsInline />
                          /* eslint-disable-next-line @next/next/no-img-element */
                          : <img src={start.preview} alt="" className="w-full h-full object-cover blur-sm opacity-60" />}
                        <div className="absolute inset-0 flex items-end justify-center pb-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-gray-300 border border-white/10">START</span>
                        </div>
                      </div>
                      <div className="relative bg-black overflow-hidden">
                        <video src={selected.video} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                              style={{ borderTopColor:`rgb(${rgb})`, borderRightColor:`rgba(${rgb},0.3)` }} />
                            <div className="absolute inset-2 rounded-full border-2 border-transparent animate-spin"
                              style={{ borderBottomColor:`rgb(${rgb})`, animationDirection:"reverse", animationDuration:"1.8s", opacity:0.5 }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Sparkles className={cn("w-6 h-6 animate-pulse", config.colorClass)} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="relative bg-black/50 overflow-hidden">
                        {end.isVideo
                          ? <video src={end.preview} className="w-full h-full object-cover blur-sm opacity-60" muted loop autoPlay playsInline />
                          /* eslint-disable-next-line @next/next/no-img-element */
                          : <img src={end.preview} alt="" className="w-full h-full object-cover blur-sm opacity-60" />}
                        <div className="absolute inset-0 flex items-end justify-center pb-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-gray-300 border border-white/10">END</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-4 border-t border-white/8 bg-black/30 text-center">
                      <p className="text-white font-bold mb-1 text-sm">جاري توليد الانتقال...</p>
                      <p className="text-gray-500 text-xs">{selected.label} · {duration} ثوانٍ</p>
                      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden mt-3">
                        <motion.div className="h-full rounded-full"
                          style={{ backgroundColor:`rgb(${rgb})` }}
                          initial={{ width:"0%" }} animate={{ width:"100%" }}
                          transition={{ duration:4.5, ease:"linear" }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── result ── */}
              {phase === "result" && resultUrl && (
                <motion.div key="result"
                  initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold px-3 py-1.5 rounded-full"
                      style={{ color:`rgb(${rgb})`, backgroundColor:`rgba(${rgb},0.1)` }}>
                      ✨ الانتقال جاهز
                    </span>
                    <span className="text-xs text-gray-600 border border-white/8 px-2 py-0.5 rounded-full">
                      {selected.label} · {duration} ث
                    </span>
                  </div>

                  <div className="rounded-3xl overflow-hidden border border-white/10"
                    style={{ boxShadow:`0 0 50px rgba(${rgb},0.15)` }}>
                    <video
                      src={resultUrl}
                      className="w-full bg-black"
                      controls autoPlay loop playsInline
                      style={{ maxHeight:"65vh" }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <a href={resultUrl} download="transition.mp4"
                      className="flex-1 h-12 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                      <Download className="w-4 h-4" /> تحميل الفيديو
                    </a>
                    <button onClick={reset}
                      className="h-12 px-5 rounded-2xl border border-white/10 text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-white/5 hover:text-white transition-colors">
                      <RefreshCw className="w-4 h-4" /> تجربة جديدة
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* ── TRANSITION PICKER MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setPickerOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0,  opacity: 1, scale: 1 }}
              exit={{   y: 40, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:w-[92vw] sm:max-w-4xl bg-[#111315] border border-white/10 sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
              style={{
                height: "88vh",
                boxShadow: `0 -4px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)`,
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-white/5 flex-shrink-0">
                <div className="flex-1">
                  <h3 className="text-white font-black text-lg">اختر نوع الانتقال</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {TRANSITIONS.length} تأثير جاهز — مرّر عليهم لمعاينة الحركة
                  </p>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2 w-48">
                  <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="ابحث..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                    className="bg-transparent text-sm text-white placeholder:text-gray-600 outline-none flex-1 min-w-0"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="text-gray-500 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setPickerOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
                {filtered.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center gap-3 text-gray-700">
                    <Search className="w-10 h-10 opacity-30" />
                    <p className="text-sm">لا نتائج لـ &quot;{search}&quot;</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filtered.map(t => {
                      const active = styleId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => { setStyleId(t.id); setPickerOpen(false); }}
                          className="flex flex-col items-start text-start group focus:outline-none"
                        >
                          <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-black/40 cursor-pointer">
                            <video
                              src={t.video}
                              muted loop autoPlay playsInline
                              preload="auto"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Ring */}
                            <div className="absolute inset-0 rounded-xl pointer-events-none transition-all"
                              style={{
                                boxShadow: active
                                  ? `inset 0 0 0 3px rgb(${rgb})`
                                  : "inset 0 0 0 1px rgba(255,255,255,0.06)",
                              }}
                            />
                            {/* Check */}
                            {active && (
                              <div className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                                style={{ backgroundColor:`rgb(${rgb})` }}>
                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                              </div>
                            )}
                            {/* Dark gradient for label legibility */}
                            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                          </div>
                          <div className="mt-2 w-full">
                            <p className={cn(
                              "text-sm font-bold truncate transition-colors",
                              active ? "text-white" : "text-gray-300 group-hover:text-white"
                            )}>
                              {t.label}
                            </p>
                            <p className="text-[10px] text-gray-600 truncate mt-0.5" dir="ltr">{t.en}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between flex-shrink-0">
                <span className="text-xs text-gray-600 tabular-nums">
                  {filtered.length}{search ? ` / ${TRANSITIONS.length}` : ""} انتقال
                </span>
                <button
                  onClick={() => setPickerOpen(false)}
                  className="flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                  style={{
                    backgroundColor: `rgba(${rgb},0.18)`,
                    border: `1px solid rgba(${rgb},0.4)`,
                    color: `rgb(${rgb})`,
                  }}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  تأكيد الاختيار
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
