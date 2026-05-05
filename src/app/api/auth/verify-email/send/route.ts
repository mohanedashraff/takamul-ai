// ════════════════════════════════════════════════════════════════
// POST /api/auth/verify-email/send
// ════════════════════════════════════════════════════════════════
// Generates a fresh verification token, stores its hash in the
// VerificationToken table, and emails the user a link they can click.
//
// Two ways to call:
//   - Authenticated (no body): re-sends to the logged-in user.
//   - Anonymous   (body { email }): used right after registration to
//     resend without requiring a session.
//
// Tokens are SHA-256 hashed before storage so a DB leak doesn't
// allow attackers to verify accounts.

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { sendVerificationEmail, generateToken } from "@/lib/email";

export const runtime = "nodejs";

const Schema = z.object({ email: z.string().email().optional() });

const TTL_HOURS = 24;
const PURPOSE   = "email-verification";

export async function POST(req: Request) {
  let body: unknown = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body");

  // Resolve the target email — session first, then body.
  const session = await auth();
  let email = session?.user?.email ?? parsed.data.email;
  if (!email) return jsonError("Email is required", 400);
  email = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, name: true, emailVerified: true },
  });
  // Always pretend success to avoid leaking whether an account exists,
  // EXCEPT when the user is currently logged-in — they get clear feedback.
  if (!user) {
    return session?.user ? jsonError("User not found", 404) : jsonOk({ ok: true });
  }
  if (user.emailVerified) {
    return jsonOk({ ok: true, alreadyVerified: true });
  }

  // Wipe any previous tokens for this purpose.
  await prisma.verificationToken.deleteMany({
    where: { identifier: `${PURPOSE}:${email}` },
  });

  const { token, tokenHash } = generateToken();
  const expires = new Date(Date.now() + TTL_HOURS * 3600 * 1000);
  await prisma.verificationToken.create({
    data: { identifier: `${PURPOSE}:${email}`, token: tokenHash, expires },
  });

  const origin = req.headers.get("origin") || process.env.AUTH_URL || "http://localhost:3000";
  const link = `${origin}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  try {
    await sendVerificationEmail({ to: email, name: user.name, link });
  } catch (err) {
    console.error("[verify-email/send]", err);
    // Token already created — fall through. Worst case the user retries.
  }

  return jsonOk({ ok: true });
}
