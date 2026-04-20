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
        const isVideo = src.endsWith(".mp4") || src.endsWith(".webm");
        
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
