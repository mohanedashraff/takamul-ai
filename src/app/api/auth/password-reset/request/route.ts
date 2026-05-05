// ════════════════════════════════════════════════════════════════
// POST /api/auth/password-reset/request
// ════════════════════════════════════════════════════════════════
// Anonymous endpoint — accepts an email, generates a 1-hour reset
// token, and emails the link. Always returns success regardless of
// whether the email exists, to prevent enumeration.

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";
import { sendPasswordResetEmail, generateToken } from "@/lib/email";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Schema = z.object({ email: z.string().email() });

const PURPOSE   = "password-reset";
const TTL_HOURS = 1;

export async function POST(req: Request) {
  const rl = rateLimit({ key: clientKey(req, "pwreset"), limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "محاولات كثيرة — حاول لاحقاً" }),
      { status: 429, headers: { "Content-Type": "application/json", ...rl.headers } },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid email");

  const email = parsed.data.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, name: true, passwordHash: true },
  });

  // OAuth-only users have no password to reset; we silently no-op so the
  // page still says "if your account exists, check your inbox".
  if (user && user.passwordHash) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: `${PURPOSE}:${email}` },
    });

    const { token, tokenHash } = generateToken();
    const expires = new Date(Date.now() + TTL_HOURS * 3600 * 1000);
    await prisma.verificationToken.create({
      data: { identifier: `${PURPOSE}:${email}`, token: tokenHash, expires },
    });

    const origin = req.headers.get("origin") || process.env.AUTH_URL || "http://localhost:3000";
    const link = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    try {
      await sendPasswordResetEmail({ to: email, name: user.name, link });
    } catch (err) {
      console.error("[password-reset/request]", err);
    }
  }

  return jsonOk({ ok: true });
}
