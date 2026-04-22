// GET   /api/user/me — current user profile + credits
// PATCH /api/user/me — update name / image / password
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonOk, jsonError } from "@/lib/api";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      plan: true,
      role: true,
      creditsBalance: true,
      creditsLimit: true,
      planRenewsAt: true,
      createdAt: true,
    },
  });

  if (!user) return jsonError("User not found", 404);
  return jsonOk({ user });
}

const PatchSchema = z.object({
  name:        z.string().min(1).max(100).optional(),
  image:       z.string().url().nullable().optional(),
  newPassword: z.string().min(8).max(128).optional(),
  currentPassword: z.string().optional(),
});

export async function PATCH(req: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { name, image, newPassword, currentPassword } = parsed.data;

  // Password change requires currentPassword verification
  let passwordHash: string | undefined;
  if (newPassword) {
    if (!currentPassword) return jsonError("كلمة المرور الحالية مطلوبة", 400);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) {
      return jsonError("لا يمكن تغيير كلمة المرور لحساب OAuth", 400);
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return jsonError("كلمة المرور الحالية غير صحيحة", 400);
    passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(image !== undefined && { image }),
      ...(passwordHash !== undefined && { passwordHash }),
    },
    select: {
      id: true, email: true, name: true, image: true,
      plan: true, role: true, creditsBalance: true, creditsLimit: true,
    },
  });

  return jsonOk({ user: updated });
}
