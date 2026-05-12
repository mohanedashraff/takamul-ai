// ════════════════════════════════════════════════════════════════
// GET /api/me — account info + credit balance
// ════════════════════════════════════════════════════════════════
// Used by the SDK / CLI / MCP to answer "who am I + what's my
// balance". Accepts either a session cookie or an API key Bearer
// token so all three consumers can hit it.

import { prisma } from "@/lib/prisma";
import { jsonOk, requireAuthOrApiKey } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { userId, response } = await requireAuthOrApiKey(req);
  if (response) return response;

  const user = await prisma.user.findUnique({
    where:  { id: userId! },
    select: {
      id:             true,
      email:          true,
      name:           true,
      plan:           true,
      creditsBalance: true,
      creditsLimit:   true,
      planRenewsAt:   true,
      createdAt:      true,
    },
  });

  if (!user) {
    return jsonOk({ error: "User not found" }, 404);
  }

  return jsonOk({
    id:             user.id,
    email:          user.email,
    name:           user.name,
    plan:           user.plan,
    creditsBalance: user.creditsBalance,
    creditsLimit:   user.creditsLimit,
    planRenewsAt:   user.planRenewsAt,
    createdAt:      user.createdAt,
  });
}
