// ════════════════════════════════════════════════════════════════
// API key helpers — issue / verify / revoke workspace tokens
// ════════════════════════════════════════════════════════════════
// We hash keys with SHA-256 before persistence so a database leak
// doesn't expose live credentials. The plaintext is shown to the
// user exactly once at creation time.
//
// Key format: `yk_<22 random base64url chars>` — 130 bits of entropy,
// plenty for a personal-access-token shape.

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/** Generate a fresh token. Returns the plaintext (show once!) and
 *  the persistence-ready hash + prefix. */
export function generateApiKey(): { plaintext: string; hash: string; prefix: string } {
  // 22 base64url chars ≈ 132 bits.
  const raw = randomBytes(17).toString("base64url");
  const plaintext = `yk_${raw}`;
  const hash      = sha256(plaintext);
  const prefix    = plaintext.slice(0, 8); // "yk_AbCd"
  return { plaintext, hash, prefix };
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Resolve a plaintext token → userId, or null if invalid / revoked.
 *  Bumps `lastUsedAt` opportunistically. */
export async function verifyApiKey(plaintext: string): Promise<string | null> {
  if (!plaintext || !plaintext.startsWith("yk_")) return null;
  const hash = sha256(plaintext);
  const row = await prisma.apiKey.findUnique({
    where:  { keyHash: hash },
    select: { id: true, userId: true, revokedAt: true },
  });
  if (!row || row.revokedAt) return null;
  // Best-effort lastUsedAt bump — don't block on it.
  prisma.apiKey
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});
  return row.userId;
}

/** Issue a key for the supplied user. Returns the plaintext exactly
 *  once — the API surface must echo it back to the user and never
 *  persist it again. */
export async function issueApiKey(opts: {
  userId: string;
  name:   string;
  scopes?: string[];
}): Promise<{ id: string; plaintext: string; prefix: string }> {
  const { plaintext, hash, prefix } = generateApiKey();
  const row = await prisma.apiKey.create({
    data: {
      userId:    opts.userId,
      name:      opts.name,
      keyHash:   hash,
      keyPrefix: prefix,
      scopes:    opts.scopes ?? ["read", "write"],
    },
    select: { id: true },
  });
  return { id: row.id, plaintext, prefix };
}

/** Soft-revoke (sets revokedAt so we can audit history). */
export async function revokeApiKey(opts: { userId: string; keyId: string }): Promise<boolean> {
  const r = await prisma.apiKey
    .updateMany({
      where: { id: opts.keyId, userId: opts.userId, revokedAt: null },
      data:  { revokedAt: new Date() },
    });
  return r.count > 0;
}

/** List the user's keys for the management UI. Plaintext is never
 *  returned here — only the prefix + metadata. */
export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true, name: true, keyPrefix: true, scopes: true,
      lastUsedAt: true, revokedAt: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
