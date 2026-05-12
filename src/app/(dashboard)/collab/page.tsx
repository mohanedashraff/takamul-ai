import type { Metadata } from "next";
import { CollabHub } from "@/components/collab/CollabHub";

export const metadata: Metadata = {
  title:       "Collab — Yilow.ai",
  description: "مساحات عمل مشتركة، فِرَق، ومشاريع تعاونية على Yilow.",
};

export default function CollabPage() {
  return <CollabHub />;
}
