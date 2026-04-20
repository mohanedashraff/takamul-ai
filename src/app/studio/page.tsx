import { redirect } from "next/navigation";

export default function StudioRootPage() {
  // Redirect automatically to the first category (Image tools)
  redirect("/studio/image");
}
