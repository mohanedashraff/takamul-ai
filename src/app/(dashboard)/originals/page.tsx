import type { Metadata } from "next";
import { OriginalsGallery } from "@/components/originals/OriginalsGallery";

export const metadata: Metadata = {
  title:       "Originals — Yilow.ai",
  description: "أعمال مختارة لأمهر مبدعي Yilow — استلهم من النسخ النهائية + الـprompts.",
};

export default function OriginalsPage() {
  return <OriginalsGallery />;
}
