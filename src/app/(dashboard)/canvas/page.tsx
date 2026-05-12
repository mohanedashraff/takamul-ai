import type { Metadata } from "next";
import { CanvasWorkspace } from "@/components/canvas/CanvasWorkspace";

export const metadata: Metadata = {
  title:       "كانفس — Yilow.ai",
  description: "اربط أدوات Yilow في pipeline بصري — output من أداة يبقى input لأداة تانية.",
};

export default function CanvasPage() {
  return <CanvasWorkspace />;
}
