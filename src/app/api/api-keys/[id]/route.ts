// ════════════════════════════════════════════════════════════════
// DELETE /api/api-keys/[id] — revoke a key
// ════════════════════════════════════════════════════════════════
// Soft-revoke (sets revokedAt) so we keep an audit trail.

import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { revokeApiKey } from "@/lib/api-keys";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const { id } = await ctx.params;
  const ok = await revokeApiKey({ userId: session.user.id, keyId: id });
  if (!ok) return jsonError("لم يتم العثور على المفتاح", 404);
  return jsonOk({ revoked: true });
}
