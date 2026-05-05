// POST /api/auth/register
// Create a new user (email + password), fire off a verification email,
// then let the client sign them in.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateToken, sendVerificationEmail } from "@/lib/email";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const RegisterSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(100),
  email: z.string().email("بريد إلكتروني غير صحيح").transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8, "كلمة المرور لا تقل عن 8 أحرف").max(128),
});

export async function POST(req: Request) {
  // Throttle to prevent signup spam / enumeration.
  const rl = rateLimit({ key: clientKey(req, "register"), limit: 8, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "محاولات كثيرة — حاول بعد ساعة" },
      { status: 429, headers: rl.headers },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "بيانات غير صحيحة";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "هذا البريد الإلكتروني مسجل بالفعل" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      creditsBalance: 100,
      creditsLimit: 100,
      creditTransactions: {
        create: {
          type: "BONUS",
          amount: 100,
          balanceAfter: 100,
          reason: "signup_bonus",
        },
      },
    },
    select: { id: true, email: true, name: true },
  });

  // Fire-and-forget: email verification. We don't block registration if
  // email infra is unavailable — the user can resend from /verify-email.
  try {
    const { token, tokenHash } = generateToken();
    const expires = new Date(Date.now() + 24 * 3600 * 1000);
    await prisma.verificationToken.create({
      data: {
        identifier: `email-verification:${email}`,
        token:      tokenHash,
        expires,
      },
    });
    const origin = req.headers.get("origin") || process.env.AUTH_URL || "http://localhost:3000";
    const link = `${origin}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    await sendVerificationEmail({ to: email, name, link });
  } catch (err) {
    console.error("[register] verification email failed", err);
  }

  return NextResponse.json({ ok: true, user });
}
