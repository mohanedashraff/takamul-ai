import type { Metadata } from "next";
import { EditCanvas } from "@/components/edit-canvas/EditCanvas";

export const metadata: Metadata = {
  title:       "Edit Canvas — Yilow.ai",
  description: "صورة واحدة، كل أدوات التحرير — تعديل بأسلوب، إزالة خلفية، تمديد، إعادة إضاءة، تنعيم بشرة، Upscale. كل خطوة layer منفصل مع Undo/Redo.",
};

export default function EditPage() {
  return <EditCanvas />;
}
