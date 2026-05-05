// ════════════════════════════════════════════════════════════════
// POST /api/auth/verify-email/confirm
// ════════════════════════════════════════════════════════════════
// Confirms a verification token issued by /verify-email/send.
// Marks User.emailVerified = now(), nukes the token row, and returns
// ok. The /verify-email page calls this from the client.

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";
import { hashToken } from "@/lib/email";

export const runtime = "nodejs";

const Schema = z.object({
  token: z.string().min(20),
  email: z.string().email(),
});

const PURPOSE = "email-verification";

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body");

  const email     = parsed.data.email.toLowerCase().trim();
  const tokenHash = hashToken(parsed.data.token);
  const identifier = `${PURPOSE}:${email}`;

  const row = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token: tokenHash } },
  });
  if (!row) return jsonError("الرابط غير صالح أو تم استخدامه", 400);
  if (row.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token: tokenHash } },
    }).catch(() => {});
    return jsonError("انتهت صلاحية الرابط — اطلب رابطاً جديداً", 410);
  }

  // Apply the verification + delete the token in a single transaction.
  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data:  { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token: tokenHash } },
    }),
  ]);

  return jsonOk({ ok: true });
}
