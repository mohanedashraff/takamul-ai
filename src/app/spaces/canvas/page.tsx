import type { Metadata } from "next";
import { SpacesCanvas } from "@/components/spaces/canvas/SpacesCanvas";

export const metadata: Metadata = {
  title: "Spaces Studio | Yilow.ai",
  description: "استوديو تصميم مسارات الذكاء الاصطناعي — اسحب، أسقط، اربط وشغّل العقد لبناء مسارات عمل بصرية.",
};

export default function SpacesCanvasPage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <SpacesCanvas />
    </div>
  );
}
