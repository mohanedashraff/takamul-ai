"use client";

// ════════════════════════════════════════════════════════════════
// New Hero Section — split-screen astronaut composition
// ════════════════════════════════════════════════════════════════
// Cinematic background video (yellow-tinted astronaut on the right
// side of the canvas), Arabic-RTL headline, two CTAs, trust badges.
// The background asset lives at /public/hero-bg.mp4 with a poster
// fallback at /public/hero-bg-poster.png.

import React, { useEffect, useRef, useState } from "react";
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

  // ── Ping-pong loop (event-driven, never stops) ────────────────────
  // Previous versions tried to flip direction by polling currentTime
  // each rAF tick and pulling tricks like `playbackRate = 0`. Across
  // browsers that's unreliable: the `ended` event fires before the
  // poll catches the boundary, the element flips to `paused = true`,
  // and `playbackRate` no longer resumes it — so the video stops dead
  // after one play-through.
  //
  // The fix is purely event-driven for direction flips:
  //   • Forward → native `play()` at 1.25x. We listen for `ended` to
  //     know the loop hit the right edge.
  //   • Reverse → driven by rAF, scrubbing currentTime backwards.
  //     When it hits zero we call `play()` again. Native looping is
  //     off; we own the lifecycle.
  //   • A `pause` listener also re-kicks playback in case the browser
  //     suspends the video for any reason (tab focus, codec stalls).
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const FWD_RATE  = 1.25;            // native playbackRate going forward
    const REV_SPEED = 1.25;            // seconds of media / second of wall clock
    const EPSILON   = 0.03;

    let dir: 1 | -1 = 1;
    let raf  = 0;
    let last = performance.now();
    let stopped = false;

    v.loop = false;
    v.muted = true;
    v.playbackRate = FWD_RATE;

    const startForward = () => {
      if (stopped) return;
      dir = 1;
      v.playbackRate = FWD_RATE;
      // play() returns a Promise; ignore rejections (e.g. autoplay
      // blocked before any user gesture). The next pause/timeupdate
      // event will retry on its own.
      v.play().catch(() => {});
    };

    // Forward kickoff. Some browsers need metadata before play() works.
    if (v.readyState >= 1) startForward();
    else v.addEventListener("loadedmetadata", startForward, { once: true });

    // Native end → flip to reverse.
    const onEnded = () => {
      if (stopped) return;
      dir = -1;
      // Clamp to just inside the duration so the next currentTime
      // assignment in the rAF loop doesn't get rejected by the browser.
      const dur = isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
      if (dur > 0) v.currentTime = Math.max(0, dur - EPSILON);
      // Pause native playback so it doesn't fight our scrubbing.
      v.pause();
      last = performance.now();
    };

    // If the browser pauses for any other reason while we expect to be
    // playing forward, gently nudge it back.
    const onPause = () => {
      if (stopped || dir !== 1) return;
      // Re-attempt next frame to avoid a pause/play storm.
      requestAnimationFrame(startForward);
    };

    v.addEventListener("ended", onEnded);
    v.addEventListener("pause", onPause);

    const tick = (now: number) => {
      const dt = Math.max(0, (now - last) / 1000);
      last = now;
      if (dir === -1) {
        // Reverse → scrub backwards manually.
        const next = v.currentTime - dt * REV_SPEED;
        if (next <= EPSILON) {
          v.currentTime = EPSILON;
          startForward();
        } else {
          v.currentTime = next;
        }
      }
      // Forward direction needs no per-frame work — native playback
      // moves currentTime, and `ended` will hand control back to us.
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  return (
    <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden bg-bg-primary pt-20 md:pt-24 pb-16 mt-6 md:mt-10">
      {/* ── Background video ─────────────────────────────────────────── */}
      {/*
        The wrapper covers the section, but the <video> itself has
        48px of space above it so the video starts a bit lower without
        affecting the foreground title/CTAs (which live in z-10).
      */}
      <div className="absolute inset-0 z-0" style={{ paddingTop: 48 }}>
        <video
          ref={videoRef}
          src="/hero-bg.mp4"
          poster="/hero-bg-poster.png"
          autoPlay
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
