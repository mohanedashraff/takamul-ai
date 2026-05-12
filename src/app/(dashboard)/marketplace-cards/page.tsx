import type { Metadata } from "next";
import { MarketplaceCardsStudio } from "@/components/marketplace-cards/MarketplaceCardsStudio";

export const metadata: Metadata = {
  title:       "Marketplace Cards Studio — Yilow.ai",
  description: "13 أصل لقائمة منتجك في Amazon — main + secondary + A+ Content، كل أصل بـClaude system prompt خاص بقواعد المتجر",
};

export default function MarketplaceCardsPage() {
  return <MarketplaceCardsStudio />;
}
