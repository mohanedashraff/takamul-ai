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

/** Requires ADMIN or SUPER_ADMIN role. Returns 401 if unauth, 403 if non-admin. */
export async function requireAdmin() {
  const { session, response } = await requireAuth();
  if (response) return { session: null, response } as const;

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  return { session, response: null } as const;
}

/** Requires SUPER_ADMIN role specifically. For role-mutation endpoints. */
export async function requireSuperAdmin() {
  const { session, response } = await requireAuth();
  if (response) return { session: null, response } as const;

  if (session.user.role !== "SUPER_ADMIN") {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden — SUPER_ADMIN only" }, { status: 403 }),
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
