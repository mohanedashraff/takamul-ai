import type { Metadata } from "next";
import { Suspense } from "react";
import { SpacesCanvas } from "@/components/spaces/canvas/SpacesCanvas";

export const metadata: Metadata = {
  title: "Spaces Studio | Yilow.ai",
  description: "استوديو تصميم مسارات الذكاء الاصطناعي — اسحب، أسقط، اربط وشغّل العقد لبناء مسارات عمل بصرية.",
};

// `SpacesCanvas` reads `?space=<id>` via `useSearchParams()` so it can
// open a workflow template into the canvas. In Next 16, any component
// that calls `useSearchParams()` must be inside a Suspense boundary or
// the page can't prerender. We supply a minimal fallback so SSR works.
export default function SpacesCanvasPage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
            <div className="w-6 h-6 border-2 border-neon-pink rounded-full border-t-transparent animate-spin" />
          </div>
        }
      >
        <SpacesCanvas />
      </Suspense>
    </div>
  );
}
