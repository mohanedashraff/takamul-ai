"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MediaRendererProps {
  media: string | string[];
  alt: string;
  className?: string;
  imageClassName?: string;
}

export function MediaRenderer({ media, alt, className, imageClassName = "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" }: MediaRendererProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const isArray = Array.isArray(media);
  const items = isArray ? media : [media];

  useEffect(() => {
    if (isArray && items.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [isArray, items.length]);

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {items.map((src, idx) => {
        const isActive = idx === currentIndex;
        // Strip query strings so .mp3?token=… still classifies correctly.
        const cleanSrc = src.split("?")[0]?.toLowerCase() ?? "";
        const isVideo = /\.(mp4|webm|mov)$/.test(cleanSrc);
        const isAudio = /\.(mp3|wav|m4a|ogg|flac|aac)$/.test(cleanSrc);

        return (
          <div
            key={src}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              isActive ? "opacity-100 z-10" : "opacity-0 z-0",
              !isArray && "opacity-100 z-10"
            )}
          >
            {isVideo ? (
              <video
                src={src}
                autoPlay
                muted
                loop
                playsInline
                className={imageClassName}
              />
            ) : isAudio ? (
              // Audio renders as a centered card with a player + waveform
              // accent. The big 16:9 box stays visually consistent with
              // image/video previews by layering the player on top of a
              // soft gradient.
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-violet-500/10 via-black to-emerald-500/10 px-6">
                <div className="text-5xl mb-3 opacity-70 select-none">🎵</div>
                <audio
                  src={src}
                  controls
                  className="w-full max-w-md"
                  style={{ filter: "invert(0.9) hue-rotate(180deg)" }}
                />
              </div>
            ) : (
              <img
                src={src}
                alt={alt}
                className={imageClassName}
                loading="lazy"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
