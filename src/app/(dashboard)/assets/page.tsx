import type { Metadata } from "next";
import { AssetsLibrary } from "@/components/assets/AssetsLibrary";

export const metadata: Metadata = {
  title:       "مكتبة الأعمال — Yilow.ai",
  description: "كل أعمالك في مكان واحد — صور، فيديو، صوت، مفضّلات، مجلدات.",
};

export default function AssetsPage() {
  return <AssetsLibrary />;
}
