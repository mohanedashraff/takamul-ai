// ════════════════════════════════════════════════════════════════
// Shared API helpers for route handlers
// ════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** Returns either the session or a 401 JSON response. */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  return { session, response: null } as const;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T extends object>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
