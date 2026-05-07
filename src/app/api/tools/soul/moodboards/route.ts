// ════════════════════════════════════════════════════════════════
// /api/tools/soul/moodboards — list + create user moodboards
// ════════════════════════════════════════════════════════════════
//
//   GET  → list all moodboards belonging to the current user
//   POST → create one. Body: { name, imageUrls[], description? }
//          Hard minimum is 5 images (matches Higgsfield's UX).
//          Optionally we ask a Vision LLM to describe the
//          aesthetic — that descriptor gets stamped onto every
//          generation that uses this moodboard.

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

const CreateSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrls:   z.array(z.string().url()).min(5, "Upload at least 5 photos to continue.").max(80),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const moodboards = await prisma.soulMoodboard.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, description: true,
      imageUrls: true, descriptor: true, thumbnail: true,
      createdAt: true, updatedAt: true,
    },
  });

  return jsonOk({ moodboards });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { name, description, imageUrls } = parsed.data;

  // ── Best-effort: ask the AI Gateway to summarise the aesthetic of the
  // uploaded images. If that fails (no key, or the model errors), we
  // fall back to a generic descriptor — the moodboard still works,
  // just without the bespoke style language.
  let descriptor =
    "user-curated moodboard, cohesive aesthetic, refined editorial mood, painterly natural light, fashion-grade composition";

  try {
    if (process.env.AI_GATEWAY_API_KEY && imageUrls.length > 0) {
      const { generateText } = await import("ai");
      const { gateway }      = await import("@ai-sdk/gateway");
      const { text } = await generateText({
        model: gateway("anthropic/claude-sonnet-4-5"),
        system: "You are a creative director summarising the visual aesthetic of a moodboard for an image-generation prompt.",
        prompt: [
          "Look at these moodboard reference images and write ONE sentence (under 50 words) that captures their shared aesthetic so an image model can recreate it.",
          "Cover: lighting, color grade, mood, era/cultural context, photographic style, and any standout textures.",
          "DO NOT mention specific subjects or people. Style only.",
          "",
          "Reference image URLs:",
          ...imageUrls.slice(0, 8).map((u) => `- ${u}`),
        ].join("\n"),
        // Vision-capable models on the gateway can fetch + look at the URLs.
        // Even text-only models can produce a useful style line from the
        // URL filenames + general mood inference, hence the fallback above.
      });
      if (text && text.trim().length > 10) descriptor = text.trim().replace(/^["“]|["”]$/g, "");
    }
  } catch (err) {
    console.error("[soul/moodboards] descriptor generation failed:", err);
  }

  const moodboard = await prisma.soulMoodboard.create({
    data: {
      userId:      session.user.id,
      name,
      description,
      imageUrls,
      descriptor,
      thumbnail:   imageUrls[0],
    },
  });

  return jsonOk({ moodboard });
}
