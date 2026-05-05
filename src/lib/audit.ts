// ════════════════════════════════════════════════════════════════
// Audit log — append-only structured trail
// ════════════════════════════════════════════════════════════════
// Use this from any server route that performs a sensitive action
// (banning users, granting admin, refunding, deleting data, …).
//
//   await audit({
//     actorId:    session.user.id,
//     action:     "BAN_USER",
//     targetId:   targetUser.id,
//     targetKind: "user",
//     metadata:   { reason },
//     req,
//   });

import { prisma } from "@/lib/prisma";

export interface AuditArgs {
  actorId?:   string | null;   // null = system / cron
  action:     string;
  targetId?:  string | null;
  targetKind?: string | null;
  metadata?:  Record<string, unknown>;
  /** When provided, ip + user-agent are pulled from the headers. */
  req?:       Request;
}

export async function audit(args: AuditArgs): Promise<void> {
  let ip: string | null = null;
  let userAgent: string | null = null;
  if (args.req) {
    const xff = args.req.headers.get("x-forwarded-for");
    ip = (xff?.split(",")[0] ?? "").trim()
      || args.req.headers.get("x-real-ip")
      || null;
    userAgent = args.req.headers.get("user-agent");
  }

  try {
    await prisma.auditLog.create({
      data: {
        actorId:    args.actorId ?? null,
        action:     args.action,
        targetId:   args.targetId ?? null,
        targetKind: args.targetKind ?? null,
        ip,
        userAgent,
        metadata:   (args.metadata ?? null) as never,
      },
    });
  } catch (err) {
    // Auditing should never break the calling request — log + swallow.
    console.error("[audit]", args.action, err);
  }
}
