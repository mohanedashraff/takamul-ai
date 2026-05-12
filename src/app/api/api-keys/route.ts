// ════════════════════════════════════════════════════════════════
// /api/api-keys — list + issue workspace API keys
// ════════════════════════════════════════════════════════════════
// Powers the /settings/api-keys management page:
//   GET   → list the user's keys (prefix only, never plaintext)
//   POST  → issue a new key (plaintext returned once)
//
// Auth: session cookie. API-key-based calls aren't allowed here —
// that would create a circular trust path.

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { issueApiKey, listApiKeys } from "@/lib/api-keys";

export const runtime = "nodejs";

const PostSchema = z.object({
  name:   z.string().min(1).max(80),
  scopes: z.array(z.enum(["read", "write"])).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);
  const keys = await listApiKeys(session.user.id);
  return jsonOk({ keys });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const issued = await issueApiKey({
    userId: session.user.id,
    name:   parsed.data.name,
    scopes: parsed.data.scopes,
  });

  return jsonOk({
    id:        issued.id,
    plaintext: issued.plaintext,  // SHOW ONCE — never returned again
    prefix:    issued.prefix,
    name:      parsed.data.name,
  });
}
