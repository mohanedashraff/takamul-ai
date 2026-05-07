// ════════════════════════════════════════════════════════════════
// /api/tools/soul/characters — list + create Soul ID characters
// ════════════════════════════════════════════════════════════════
//
//   GET  → list all the user's Soul IDs (filterable by ?variant=)
//   POST → create one. Body: { name, imageUrls[], variant? }
//          Hard minimum is 20 photos (matches Higgsfield's training
//          requirement). We don't actually fine-tune a model — we
//          flag it as "trained" after a short delay and pass the
//          best subset of references at generation time.

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

const CreateSchema = z.object({
  name:      z.string().min(1).max(100),
  variant:   z.enum(["soul", "soul-2.0", "soul-cinema"]).default("soul-2.0"),
  imageUrls: z.array(z.string().url()).min(20, "نحتاج ٢٠ صورة على الأقل لتدريب الشخصية").max(40),
  hintText:  z.string().max(280).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const url = new URL(req.url);
  const variant = url.searchParams.get("variant"); // "soul-2.0" / "soul-cinema" / "soul" / null=all

  const characters = await prisma.soulCharacter.findMany({
    where: {
      userId: session.user.id,
      ...(variant ? { variant } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, variant: true, hintText: true,
      imageUrls: true, thumbnail: true, trained: true,
      createdAt: true, updatedAt: true,
    },
  });

  return jsonOk({ characters });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { name, variant, imageUrls, hintText } = parsed.data;

  const character = await prisma.soulCharacter.create({
    data: {
      userId:    session.user.id,
      name,
      variant,
      imageUrls,
      thumbnail: imageUrls[0],
      hintText:  hintText ?? `consistent appearance of "${name}", matching every reference photo (face, hair, build, vibe)`,
      trained:   false,
    },
  });

  // Schedule the "training complete" flip ~3 minutes later. We use
  // setTimeout (best-effort, lost on cold restart) since this is a
  // UX flourish — the references work as soon as the row exists.
  setTimeout(async () => {
    try {
      await prisma.soulCharacter.update({
        where: { id: character.id },
        data:  { trained: true },
      });
    } catch { /* ignore — row may have been deleted */ }
  }, 3 * 60 * 1000);

  return jsonOk({ character });
}
