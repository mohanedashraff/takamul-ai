import type { Metadata } from "next";
import { AssistChat } from "@/components/assist/AssistChat";

export const metadata: Metadata = {
  title:       "Yilow Assist — Yilow.ai",
  description: "مساعد ذكي بـClaude — اكتب هدفك الإبداعي ويرشّحلك الأداة المناسبة + يديك link مباشر",
};

export default function AssistPage() {
  return <AssistChat />;
}
