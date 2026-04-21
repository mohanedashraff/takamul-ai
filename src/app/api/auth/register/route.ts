// POST /api/auth/register
// Create a new user (email + password) then sign them in client-side.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(100),
  email: z.string().email("بريد إلكتروني غير صحيح").transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8, "كلمة المرور لا تقل عن 8 أحرف").max(128),
});

export async function POST(req: Request) {
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

  return NextResponse.json({ ok: true, user });
}
