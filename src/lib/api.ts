// ════════════════════════════════════════════════════════════════
// Shared API helpers for route handlers
// ════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyApiKey } from "@/lib/api-keys";

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

/** Returns the userId behind either a session cookie OR an API-key
 *  `Authorization: Bearer …` header — whichever is present. Used by
 *  routes that have both web and SDK / MCP / CLI consumers (e.g.
 *  /api/generations*, /api/me). The shape mirrors `requireAuth` so
 *  callers can use the same `if (response) return response` pattern. */
export async function requireAuthOrApiKey(req: Request) {
  // 1. Try API key first — cheaper than touching the session store.
  const auth = req.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
  if (match) {
    const userId = await verifyApiKey(match[1]!).catch(() => null);
    if (userId) {
      return { userId, response: null, source: "api-key" as const };
    }
  }
  // 2. Fall back to the session cookie.
  const session = await getAuthSession();
  if (session?.user?.id) {
    return { userId: session.user.id, response: null, source: "session" as const };
  }
  return {
    userId:   null,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    source:   null,
  } as const;
}

// Local re-export to dodge the static-analysis loop when both
// requireAuth and requireAuthOrApiKey live in the same module.
async function getAuthSession() {
  return auth();
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
