// GET /api/user/me — current user profile + credits
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonOk } from "@/lib/api";

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
      creditsBalance: true,
      creditsLimit: true,
      planRenewsAt: true,
      createdAt: true,
    },
  });

  if (!user) return jsonOk({ error: "User not found" }, 404);
  return jsonOk({ user });
}
