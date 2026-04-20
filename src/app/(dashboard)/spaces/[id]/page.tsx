import { redirect } from "next/navigation";

// Redirect old /spaces/[id] to the new canvas page
export default function SpacesIdRedirect() {
  redirect("/spaces/canvas");
}
