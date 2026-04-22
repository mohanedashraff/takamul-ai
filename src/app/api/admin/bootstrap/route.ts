// ════════════════════════════════════════════════════════════════
// POST /api/admin/bootstrap — one-time SUPER_ADMIN promotion
// ════════════════════════════════════════════════════════════════
// If NO admin/super_admin exists yet in the database, this endpoint
// lets the currently logged-in user promote themselves to SUPER_ADMIN.
// After the first admin is created, this endpoint returns 409.
//
// This is how the very first admin account gets seeded without
// requiring direct database access. Use it ONCE right after deploy,
// then it's permanently locked.

import { prisma } from "@/lib/prisma";
import { requireAuth, jsonOk, jsonError } from "@/lib/api";

export async function POST() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const existingAdmin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });

  if (existingAdmin) {
    return jsonError("Admin already exists — bootstrap is locked", 409);
  }

  const promoted = await prisma.user.update({
    where: { id: session.user.id },
    data:  { role: "SUPER_ADMIN" },
    select: { id: true, email: true, role: true },
  });

  return jsonOk({
    ok: true,
    user: promoted,
    message: "تم ترقيتك إلى SUPER_ADMIN. سجّل خروج ثم دخول مجدداً لتفعيل الصلاحيات.",
  });
}
