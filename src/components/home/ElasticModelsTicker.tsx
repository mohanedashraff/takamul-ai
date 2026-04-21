"use client";

// ============================================================
// ElasticModelsTicker — Crossed film-strip marquee (scissors/X)
// - Two thick, tilted strips crossing each other (+/- tilt)
// - Strips move in opposite directions
// - Checkered black/white borders move WITH the strip content
// - Vintage yellow fade on the side edges (like aged film)
// ============================================================

import React from "react";
import { motion } from "framer-motion";

interface ModelLogo {
  svg: React.ReactNode;
  name: string;
}

interface ElasticModelsTickerProps {
  logos: ModelLogo[];
}

export function ElasticModelsTicker({ logos }: ElasticModelsTickerProps) {
  return (
    <div className="w-full relative select-none py-3 md:py-5" dir="ltr">
      {/* Strip 1 — tilted down-right, scrolling left */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
        <FilmStrip
          logos={logos}
          direction="left"
          tiltDeg={-7}
          duration={70}
        />
      </div>

      {/* Strip 2 — tilted the other way, scrolling right (forms scissors X) */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
        <FilmStrip
          logos={logos}
          direction="right"
          tiltDeg={7}
          duration={85}
          opacity={0.85}
        />
      </div>


    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FilmStrip — a single tilted, scrolling strip.
// Checkered borders + logo body all animate together in sync.
// ─────────────────────────────────────────────────────────────
interface FilmStripProps {
  logos: ModelLogo[];
  direction: "left" | "right";
  tiltDeg: number;
  duration: number;
  opacity?: number;
}

function FilmStrip({ logos, direction, tiltDeg, duration, opacity = 1 }: FilmStripProps) {
  // For direction:
  //   left  → contents translate  0% → -50%
  //   right → contents translate -50% →  0%
  const animate =
    direction === "left"
      ? { x: ["0%", "-50%"] }
      : { x: ["-50%", "0%"] };

  // Checker pattern tile size — must match duplication rhythm
  const checkerTileW = 14; // px (7px white + 7px black)

  return (
    <div
      className="w-[130%]"
      style={{
        marginLeft: "-15%",
        transform: `rotate(${tiltDeg}deg)`,
        opacity,
      }}
    >
      <div className="relative overflow-hidden bg-black/60 border-y border-[#fee440]/20 shadow-[0_0_40px_rgba(254,228,64,0.08)]">
        {/* TOP checkered strip — scrolls WITH content */}
        <AnimatedChecker direction={direction} tileW={checkerTileW} duration={duration} />

        {/* LOGO BODY — same animation timing as checker so they move in sync */}
        <div className="relative py-0.5">
          <motion.div
            className="flex w-max items-center opacity-80 hover:opacity-100 transition-opacity duration-500"
            animate={animate}
            transition={{ duration, repeat: Infinity, ease: "linear" }}
          >
            {[...Array(2)].map((_, groupIdx) => (
              <div
                key={groupIdx}
                className="flex gap-5 md:gap-7 items-center pr-5 md:pr-7"
              >
                {[...logos, ...logos].map((model, idx) => (
                  <div
                    key={`${groupIdx}-${idx}`}
                    className="flex items-center gap-1.5 drop-shadow-[0_0_6px_rgba(254,228,64,0.25)]"
                  >
                    <span className="inline-flex items-center justify-center scale-[0.4]">
                      {model.svg}
                    </span>
                    <span
                      className="text-[10px] md:text-xs font-black tracking-tighter uppercase"
                      style={{
                        color: "#fee440",
                        textShadow: "0 0 6px rgba(254,228,64,0.4)",
                        fontFamily: "var(--font-alexandria), sans-serif",
                      }}
                    >
                      {model.name}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </div>

        {/* BOTTOM checkered strip — scrolls WITH content */}
        <AnimatedChecker direction={direction} tileW={checkerTileW} duration={duration} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AnimatedChecker — black/white squares that translate with the strip
// Uses background-image + animated background-position so the
// pattern itself appears to scroll, synced with the logo body.
// ─────────────────────────────────────────────────────────────
function AnimatedChecker({
  direction,
  tileW,
  duration,
}: {
  direction: "left" | "right";
  tileW: number;
  duration: number;
}) {
  // Animate background-position to move the checker pattern.
  // Direction "left" means pattern shifts left (same as x:0→-50%)
  const from = "0px 0px";
  const toPx = tileW * 2; // shift by two tiles for smooth repeat loop
  const to =
    direction === "left" ? `-${toPx}px 0px` : `${toPx}px 0px`;

  return (
    <motion.div
      className="w-full h-1.5 md:h-2"
      style={{
        backgroundImage:
          `repeating-linear-gradient(90deg, #ddd8c0 0 ${tileW / 2}px, #0a0a0a ${tileW / 2}px ${tileW}px)`,
        backgroundSize: `${tileW}px 100%`,
        backgroundRepeat: "repeat-x",
      }}
      animate={{ backgroundPosition: [from, to] }}
      transition={{
        duration: duration / 20, // checker cycles faster than logos for visual rhythm
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}
