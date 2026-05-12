import type { Metadata } from "next";
import { AiInfluencerStudio } from "@/components/ai-influencer/AiInfluencerStudio";

export const metadata: Metadata = {
  title:       "AI Influencer Studio — Yilow.ai",
  description: "ابني شخصيتك الافتراضية الكاملة بـ143 اختيار عبر 22 فئة — Yilow AI Influencer Studio",
};

export default function AiInfluencerPage() {
  return <AiInfluencerStudio />;
}
