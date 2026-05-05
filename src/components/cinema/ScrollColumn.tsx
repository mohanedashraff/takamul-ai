"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ScrollColumnItem {
  id:         string | number;
  name?:      string;
  label?:     string;
  englishName?: string;
  descriptor?: string;
  thumbnail?: string;
}

export interface ScrollColumnProps {
  title:      string;
  items:      ScrollColumnItem[];
  selectedId: string | number;
  onChange:   (id: string | number) => void;
}

const ITEM_HEIGHT  = 96;          // px — must match the button height below
const COLUMN_WIDTH = 168;         // px — wide enough for Arabic display names
const COLUMN_HEIGHT = ITEM_HEIGHT * 3;   // shows 3 rows at a time

/**
 * Vertical snap-scroll picker. Click an item or scroll the column —
 * the centered row becomes the active selection.
 */
export function ScrollColumn({ title, items, selectedId, onChange }: ScrollColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  // When the active id changes externally, scroll it into the centered slot.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = items.findIndex((i) => i.id === selectedId);
    if (idx < 0) return;
    isProgrammaticScroll.current = true;
    el.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" });
    const t = setTimeout(() => { isProgrammaticScroll.current = false; }, 350);
    return () => clearTimeout(t);
  }, [selectedId, items]);

  // While the user drags / wheels, update the selection to match the centered row.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let frame = 0;
    const handle = () => {
      if (isProgrammaticScroll.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const idx = Math.round(el.scrollTop / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(items.length - 1, idx));
        const target = items[clamped];
        if (target && target.id !== selectedId) onChange(target.id);
      });
    };
    el.addEventListener("scroll", handle, { passive: true });
    return () => {
      el.removeEventListener("scroll", handle);
      cancelAnimationFrame(frame);
    };
  }, [items, selectedId, onChange]);

  return (
    <div className="flex flex-col items-center gap-3 select-none shrink-0">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</span>

      {/* Outer frame — provides the visual box and clips overflow */}
      <div
        className="relative rounded-2xl border border-white/5 bg-black/40 overflow-hidden"
        style={{ width: COLUMN_WIDTH, height: COLUMN_HEIGHT }}
      >
        {/* Top fade */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Centered selection indicator */}
        <div
          className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 z-[5] rounded-xl border border-accent-400/30 bg-accent-400/[0.06]"
          style={{ height: ITEM_HEIGHT - 8 }}
          aria-hidden
        />

        {/* Scroll container */}
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
        >
          {/* Top spacer so the first item can land in the center slot */}
          <div style={{ height: ITEM_HEIGHT }} aria-hidden />

          {items.map((item) => {
            const active = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className={cn(
                  "snap-center relative w-full flex flex-col items-center justify-center gap-1.5 px-2",
                  "transition-all duration-300 outline-none focus-visible:bg-white/5",
                  active ? "opacity-100" : "opacity-35 hover:opacity-70",
                )}
                style={{ height: ITEM_HEIGHT }}
                type="button"
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt=""
                    className={cn(
                      "rounded-lg object-cover transition-all duration-300 border",
                      active
                        ? "w-14 h-14 border-accent-400/60"
                        : "w-12 h-12 border-white/10",
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "rounded-lg flex items-center justify-center font-black border transition-all duration-300",
                      active
                        ? "w-14 h-14 border-accent-400/60 bg-accent-400/15 text-accent-400 text-base"
                        : "w-12 h-12 border-white/10 text-white/60 text-sm",
                    )}
                  >
                    {item.label ?? item.name?.slice(0, 2)}
                  </div>
                )}
                <span
                  className={cn(
                    "text-[11px] leading-tight text-center font-bold w-full px-1 truncate",
                    active ? "text-accent-400" : "text-gray-500",
                  )}
                >
                  {item.name ?? item.label}
                </span>
              </button>
            );
          })}

          {/* Bottom spacer so the last item can also land centered */}
          <div style={{ height: ITEM_HEIGHT }} aria-hidden />
        </div>
      </div>
    </div>
  );
}
