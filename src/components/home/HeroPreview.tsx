"use client";

// ════════════════════════════════════════════════════════════════
// HeroPreview — 3-column showcase right under the hero
// ════════════════════════════════════════════════════════════════
// Layout (LTR equivalent of the LUMINA reference):
//   [ Image Generation card ] [ Big Video Player ] [ Video Generation card ]
//                              [ horizontal thumbnail slider ]
//
// • The thumbnail slider drives which video plays in the centre.
// • Both side-cards are interactive teasers that link the visitor to
//   the corresponding real tool.

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ImageIcon, Video, Sparkles, Play, Pause, ChevronLeft, ChevronRight,
  Volume2, VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

// We re-use the existing Seedance video clips so this section stays
// in sync with the rest of the home page.
const PREVIEW_VIDEOS = [
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094513_629920b7-4009-46de-b3b6-b80cc2185275_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094445_b0de712b-ae62-4fb9-9b07-2757b2d0338b_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094417_ba8bf934-a387-4bf5-8a24-f34be2a65d46_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094615_1849e0bf-3c53-4790-80d7-d83d03968910_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094601_f698d8f7-c96a-42c6-ad0c-8e830417201e_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094612_2b122af8-b47a-4518-9d91-9675dd8e3f41_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094557_c0e3952b-1ecf-4621-9b06-eb86a7fe29e8_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094505_e898193e-ec14-4ecc-92ed-be976174fc88_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094412_fbc2c33e-b861-4744-8aa3-13047b3b83c3_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094509_a0443ee0-fd26-4f6a-9938-ee153fde5822_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094654_27691a7e-7a4c-4511-95e2-cd3ae1a11273_min.mp4",
  "https://cdn.higgsfield.ai/user_3AvFCf0aoS6DTSHhwoX3QgsDzIR/hf_20260409_094622_41c4ed95-c7c2-49a8-933e-1cec2ea4e6d9_min.mp4",
];

const SAMPLE_PROMPT_IMG = "مدينة مستقبلية في السحاب، إضاءة سينمائية، تفاصيل فائقة، فن مفهومي";
const SAMPLE_PROMPT_VID = "تحليق سينمائي فوق مدينة مستقبلية وقت الغروب — بأسلوب واقعي";

const ASPECTS = ["16:9", "1:1", "4:5", "9:16"] as const;
const STYLES = [
  { id: "cinematic", label: "سينمائي",   tone: "from-orange-500/40 to-red-600/40" },
  { id: "photoreal", label: "واقعي",     tone: "from-emerald-500/40 to-cyan-600/40" },
  { id: "concept",   label: "فن مفهومي", tone: "from-violet-500/40 to-purple-700/40" },
  { id: "render3d",  label: "ثلاثي الأبعاد", tone: "from-blue-500/40 to-indigo-700/40" },
] as const;

const DURATIONS = ["4s", "6s", "8s", "10s"] as const;
const MOTIONS   = ["خفيف", "متوسط", "قوي"] as const;
const RESOLUTIONS = ["720p", "1080p", "4K"] as const;

export function HeroPreview() {
  return (
    <section className="relative -mt-10 md:-mt-16 z-20 px-4 sm:px-6 lg:px-10 pb-16">
      <div className="w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 items-stretch">
          {/* Image generation card (right column in RTL) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-3 md:order-1"
          >
            <ImageGenCard />
          </motion.div>

          {/* Center video player */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-6 md:order-2"
          >
            <CenterVideoShowcase />
          </motion.div>

          {/* Video generation card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-3 md:order-3"
          >
            <VideoGenCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Centre video showcase + thumbnail slider ─────────────────────────

function CenterVideoShowcase() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Pause / play imperatively so the icon stays in sync.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [playing, active]);

  const goNext = () => setActive((i) => (i + 1) % PREVIEW_VIDEOS.length);
  const goPrev = () => setActive((i) => (i - 1 + PREVIEW_VIDEOS.length) % PREVIEW_VIDEOS.length);

  // Keep the active thumbnail centred in the slider.
  useEffect(() => {
    const slider = sliderRef.current;
    const target = slider?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    target?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <div className="bento-card rounded-3xl border border-white/10 overflow-hidden bg-black/40 backdrop-blur-xl">
      {/* Player */}
      <div className="relative aspect-video bg-black group">
        <video
          ref={videoRef}
          key={PREVIEW_VIDEOS[active]}
          src={PREVIEW_VIDEOS[active]}
          autoPlay
          loop
          muted={muted}
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="w-full h-full object-cover"
        />

        {/* Center play / pause button */}
        <button
          onClick={() => setPlaying((p) => !p)}
          className="absolute inset-0 flex items-center justify-center group-hover:bg-black/30 transition-colors"
          aria-label={playing ? "إيقاف" : "تشغيل"}
          type="button"
        >
          <span className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {playing ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white fill-white" />}
          </span>
        </button>

        {/* Mute toggle */}
        <button
          onClick={() => setMuted((m) => !m)}
          className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white opacity-70 hover:opacity-100 transition-opacity"
          aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}
          type="button"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Counter */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-black/60 backdrop-blur-md border border-white/15 text-white">
          {active + 1} / {PREVIEW_VIDEOS.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex items-center gap-2 p-2.5 border-t border-white/5 bg-black/30">
        <button
          onClick={goPrev}
          className="shrink-0 w-9 h-9 rounded-xl border border-white/10 hover:bg-white/5 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          aria-label="السابق"
          type="button"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div
          ref={sliderRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          {PREVIEW_VIDEOS.map((src, idx) => (
            <button
              key={src}
              data-idx={idx}
              onClick={() => setActive(idx)}
              className={cn(
                "snap-center shrink-0 relative aspect-video w-24 sm:w-28 md:w-32 rounded-xl overflow-hidden border-2 transition-all",
                idx === active
                  ? "border-accent-400 shadow-[0_0_18px_rgba(254,228,64,0.45)]"
                  : "border-white/10 opacity-65 hover:opacity-100",
              )}
              type="button"
            >
              <video
                src={src}
                muted
                playsInline
                preload="metadata"
                onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0.01; }}
                className="w-full h-full object-cover"
              />
              {idx === active && (
                <div className="absolute inset-0 bg-accent-400/10 pointer-events-none" />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={goNext}
          className="shrink-0 w-9 h-9 rounded-xl border border-white/10 hover:bg-white/5 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          aria-label="التالي"
          type="button"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Image-generation teaser card ─────────────────────────────────────

function ImageGenCard() {
  const [aspect, setAspect] = useState<typeof ASPECTS[number]>("16:9");
  const [style,  setStyle]  = useState<typeof STYLES[number]["id"]>("cinematic");
  const [prompt] = useState(SAMPLE_PROMPT_IMG);

  return (
    <div className="bento-card rounded-3xl border border-white/10 bg-black/55 backdrop-blur-2xl p-4 md:p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-accent-400/15 border border-accent-400/30 flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-accent-400" />
        </div>
        <h3 className="text-sm font-black text-white">توليد صورة</h3>
      </div>

      {/* Prompt area (decorative read-only) */}
      <div className="relative mb-4">
        <textarea
          value={prompt}
          readOnly
          rows={3}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-500 leading-relaxed resize-none focus:outline-none cursor-default"
        />
        <span className="absolute bottom-2 left-2.5 text-[10px] font-mono text-gray-600">
          {prompt.length}/300
        </span>
      </div>

      {/* Aspect ratio */}
      <div className="mb-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">نسبة الصورة</p>
        <div className="grid grid-cols-4 gap-1">
          {ASPECTS.map((r) => (
            <button
              key={r}
              onClick={() => setAspect(r)}
              className={cn(
                "py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                aspect === r
                  ? "bg-accent-400/20 border-accent-400/50 text-accent-400"
                  : "bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20",
              )}
              type="button"
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Style picker */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">الأسلوب</p>
        <div className="grid grid-cols-4 gap-1.5">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2 transition-all group",
                style === s.id ? "border-accent-400" : "border-white/10",
              )}
              type="button"
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br", s.tone)} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className={cn(
                "absolute bottom-1 inset-x-1 text-center text-[9px] font-bold leading-tight",
                style === s.id ? "text-accent-400" : "text-white/85",
              )}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA — pushes you to the real tool */}
      <Link
        href="/tools/text-to-image"
        className="mt-auto flex items-center justify-center gap-2 h-11 rounded-xl bg-accent-400 text-black font-black text-sm hover:scale-[1.02] active:scale-95 transition-transform shadow-[0_0_22px_rgba(254,228,64,0.35)]"
      >
        <Sparkles className="w-4 h-4" />
        ابدأ التوليد
      </Link>
    </div>
  );
}

// ── Video-generation teaser card ─────────────────────────────────────

function VideoGenCard() {
  const [duration,   setDuration]   = useState<typeof DURATIONS[number]>("6s");
  const [motionLvl,  setMotionLvl]  = useState<typeof MOTIONS[number]>("متوسط");
  const [resolution, setResolution] = useState<typeof RESOLUTIONS[number]>("1080p");
  const [prompt] = useState(SAMPLE_PROMPT_VID);

  return (
    <div className="bento-card rounded-3xl border border-white/10 bg-black/55 backdrop-blur-2xl p-4 md:p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-accent-400/15 border border-accent-400/30 flex items-center justify-center">
          <Video className="w-4 h-4 text-accent-400" />
        </div>
        <h3 className="text-sm font-black text-white">توليد فيديو</h3>
      </div>

      {/* Prompt */}
      <div className="relative mb-4">
        <textarea
          value={prompt}
          readOnly
          rows={3}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 leading-relaxed resize-none focus:outline-none cursor-default"
        />
        <span className="absolute bottom-2 left-2.5 text-[10px] font-mono text-gray-600">
          {prompt.length}/300
        </span>
      </div>

      <Group label="المدة">
        {DURATIONS.map((d) => (
          <Chip key={d} active={duration === d} onClick={() => setDuration(d)}>{d}</Chip>
        ))}
      </Group>

      <Group label="مستوى الحركة">
        {MOTIONS.map((m) => (
          <Chip key={m} active={motionLvl === m} onClick={() => setMotionLvl(m)}>{m}</Chip>
        ))}
      </Group>

      <Group label="الجودة">
        {RESOLUTIONS.map((r) => (
          <Chip key={r} active={resolution === r} onClick={() => setResolution(r)}>{r}</Chip>
        ))}
      </Group>

      <Link
        href="/tools/text-to-video"
        className="mt-auto flex items-center justify-center gap-2 h-11 rounded-xl bg-accent-400 text-black font-black text-sm hover:scale-[1.02] active:scale-95 transition-transform shadow-[0_0_22px_rgba(254,228,64,0.35)]"
      >
        <Sparkles className="w-4 h-4" />
        ابدأ التوليد
      </Link>
    </div>
  );
}

// ── Tiny shared bits for VideoGenCard ────────────────────────────────

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
        active
          ? "bg-accent-400/20 border-accent-400/50 text-accent-400"
          : "bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20",
      )}
      type="button"
    >
      {children}
    </button>
  );
}
