// ════════════════════════════════════════════════════════════════
// /api/cron/daily-credit-refresh — top-up 10 credits for FREE users
// ════════════════════════════════════════════════════════════════
// Add 10 daily credits to every FREE-plan user (capped at 100 so
// they don't accumulate indefinitely). Designed to be hit by Vercel
// Cron or any external scheduler at 00:00 UTC.
//
// Auth: `Authorization: Bearer ${CRON_SECRET}` — fail closed.
//
// vercel.json:
//   { "crons": [{ "path": "/api/cron/daily-credit-refresh", "schedule": "0 0 * * *" }] }

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DAILY_AMOUNT = 10;
const DAILY_CAP    = 100;

export async function POST(req: Request) {
  const auth   = req.headers.get("authorization") || "";
  const expect = process.env.CRON_SECRET;
  if (!expect || auth !== `Bearer ${expect}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // updateMany with a conditional in raw SQL keeps the operation
  // atomic — we cap at DAILY_CAP without race-conditioning the user's
  // active session.
  const r = await prisma.$executeRaw`
    UPDATE "User"
    SET "creditsBalance" = LEAST("creditsBalance" + ${DAILY_AMOUNT}, ${DAILY_CAP})
    WHERE "plan" = 'FREE' AND "creditsBalance" < ${DAILY_CAP}
  `;
  return NextResponse.json({ updated: Number(r), addedPerUser: DAILY_AMOUNT });
}

// GET handler too so the cron platform can use either verb.
export const GET = POST;
