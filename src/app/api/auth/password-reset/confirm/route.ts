// ════════════════════════════════════════════════════════════════
// POST /api/auth/password-reset/confirm
// ════════════════════════════════════════════════════════════════
// Validates the reset token, hashes the new password, and stores it.
// Single-use: the token row is deleted as part of the same transaction.

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";
import { hashToken, sendPasswordChangedEmail } from "@/lib/email";

export const runtime = "nodejs";

const Schema = z.object({
  token:    z.string().min(20),
  email:    z.string().email(),
  password: z.string().min(8, "كلمة المرور لا تقل عن 8 أحرف").max(128),
});

const PURPOSE = "password-reset";

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

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

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data:  { passwordHash },
      select: { name: true },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token: tokenHash } },
    }),
    // Invalidate every outstanding password-reset token for this user so
    // a stolen older link can't be reused.
    prisma.verificationToken.deleteMany({
      where: { identifier },
    }),
  ]);

  // Security email (best-effort — never block the password change on
  // email failure). Captures the requesting IP so the user can verify.
  const appUrl = process.env.AUTH_URL || req.headers.get("origin") || "https://yilow.ai";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? null;
  sendPasswordChangedEmail({
    to:    email,
    name:  updated.name,
    appUrl,
    when:  new Date(),
    ip,
  }).catch((err) => console.error("[password-reset/confirm] notification email failed", err));

  return jsonOk({ ok: true });
}
