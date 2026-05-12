import type { Metadata } from "next";
import { ExploreFeed } from "@/components/explore/ExploreFeed";

export const metadata: Metadata = {
  title:       "اكتشف — Yilow.ai",
  description: "Feed مفتوح لكل الأعمال العامة من مستخدمي Yilow — اعمل like, save, remix.",
};

export default function ExplorePage() {
  return <ExploreFeed />;
}
