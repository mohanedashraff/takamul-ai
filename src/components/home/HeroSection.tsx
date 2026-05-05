"use client";

// ════════════════════════════════════════════════════════════════
// New Hero Section — split-screen astronaut composition
// ════════════════════════════════════════════════════════════════
// Cinematic background video (yellow-tinted astronaut on the right
// side of the canvas), Arabic-RTL headline, two CTAs, trust badges.
// The background asset lives at /public/hero-bg.mp4 with a poster
// fallback at /public/hero-bg-poster.png.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Sparkles, Users, Shield, Zap, Star } from "lucide-react";

export function HeroSection() {
  // Type out the Arabic+English title with a subtle reveal so it
  // doesn't feel like a flat poster on first paint.
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
  }, []);

  return (
    <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden bg-bg-primary pt-20 md:pt-24 pb-16 mt-6 md:mt-10">
      {/* ── Background video ─────────────────────────────────────────── */}
      {/*
        Cover the full section so the video isn't squashed/cropped.
        `object-position: 50% 30%` shifts the visible "window" upward
        on the source — meaning the astronaut + mountain land lower in
        the frame visually, without ever clipping the top of her helmet.
      */}
      <div className="absolute inset-0 z-0">
        <video
          src="/hero-bg.mp4"
          poster="/hero-bg-poster.png"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{
            objectPosition: "50% 30%",
            // hue-rotate slides the warm orange tint toward our brand yellow.
            // saturate(0.9) takes a tiny bit of intensity off so the colour
            // feels more cinematic/muted instead of fluorescent.
            filter: "hue-rotate(10deg) saturate(0.9)",
          }}
        />
        {/* Soft side vignette + narrow bottom fade — keeps the title legible
            without hiding the cinematic background. */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-black/35" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
      </div>

      {/* ── Foreground content ───────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center">
        {/* "NEW" pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-6"
        >
          <Link
            href="/pricing"
            className="group flex items-center gap-2 pr-1 pl-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:border-accent-400/40 transition-colors"
          >
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-accent-400 text-black">
              جديد
            </span>
            <span className="text-[11px] font-bold text-gray-300 tracking-wide">
              Yilow 2.0 — أسرع · أذكى · أكثر واقعية
            </span>
            <ArrowLeft className="w-3 h-3 text-gray-400 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        {/* Title — generous line spacing + extra padding under the
            gradient line so Arabic descenders ("ي") don't get clipped
            by `bg-clip-text`. */}
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-black tracking-tight mb-5 space-y-3 md:space-y-4"
        >
          <span className="block text-white text-5xl md:text-6xl lg:text-7xl leading-[1.3]">
            صور سينمائية
          </span>
          <span className="block text-accent-400 drop-shadow-[0_0_30px_rgba(254,228,64,0.35)] text-5xl md:text-6xl lg:text-7xl leading-[1.3] pb-2">
            وفيديو احترافي
          </span>
          <span className="block text-white/80 text-2xl md:text-4xl lg:text-5xl font-bold leading-[1.4]">
            بقوة الذكاء الاصطناعي
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-base md:text-lg text-gray-300/90 max-w-2xl mx-auto leading-relaxed mb-10 mt-8"
        >
          منصة الذكاء الاصطناعي الشاملة للمبدعين والمحترفين — استكشف إمكانيات لا محدودة وحوّل أفكارك لواقع.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14"
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-3 px-7 rounded-2xl bg-accent-400 text-black font-black text-base hover:scale-[1.03] active:scale-95 transition-transform shadow-[0_0_36px_rgba(254,228,64,0.45)]"
            style={{ height: "50px" }}
          >
            <Sparkles className="w-4 h-4" />
            ابدأ مجاناً
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/tools"
            className="group inline-flex items-center gap-3 px-7 rounded-2xl bg-black/50 backdrop-blur-md text-white font-bold text-base border border-white/15 hover:bg-black/70 hover:border-white/30 transition-colors"
            style={{ height: "50px" }}
          >
            <Play className="w-4 h-4 fill-white" />
            استكشف المعرض
          </Link>
        </motion.div>

        {/* Trust badges row */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs md:text-sm"
        >
          <TrustBadge icon={Users}  label="+100 ألف مبدع يثقون بنا" />
          <Sep />
          <TrustBadge icon={Shield} label="حماية بمستوى المؤسسات" />
          <Sep />
          <TrustBadge icon={Zap}    label="+10 مليون توليد ناجح" />
          <Sep />
          <TrustBadge icon={Star}   label="تقييم 4.9 / 5" />
        </motion.div>
      </div>
    </section>
  );
}

function TrustBadge({
  icon: Icon, label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
      <Icon className="w-4 h-4 text-accent-400/70" />
      <span className="font-bold whitespace-nowrap">{label}</span>
    </div>
  );
}

function Sep() {
  return <span className="hidden md:inline w-1 h-1 rounded-full bg-white/15" aria-hidden />;
}
