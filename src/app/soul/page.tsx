import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { SoulStudio } from "@/components/soul/SoulStudio";

export const metadata: Metadata = {
  title:       "Soul 2.0 — Yilow.ai",
  description: "صور Editorial فاشن جودة هوليوود — مع Mood Boards و Soul HEX و Soul ID character consistency.",
};

export default function SoulPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <SoulStudio />
      </main>
    </>
  );
}
