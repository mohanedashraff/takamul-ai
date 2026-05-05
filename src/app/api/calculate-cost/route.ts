// ════════════════════════════════════════════════════════════════
// Dynamic cost calculation
// ════════════════════════════════════════════════════════════════
// Forwards { task_name, payload } to
//   POST https://api.muapi.ai/app/calculate_dynamic_cost
// and translates the upstream USD/credit cost into our internal
// platform-credits price (1 USD ≈ N credits — controlled here).
//
// Called from the tool UI to show live pricing before submitting.

import { NextResponse } from "next/server";
import { auth } from "@/auth";

const MU_API_KEY = process.env.MU_API_KEY;

// Markup multiplier — internal credits per 1 muapi credit unit.
// Adjust as billing strategy evolves. Keep this server-side only.
const CREDIT_MULTIPLIER = Number(process.env.YILOW_CREDIT_MULTIPLIER ?? 100);

export async function POST(req: Request) {
  if (!MU_API_KEY) {
    return NextResponse.json(
      { error: "MU_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { task_name?: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.task_name) {
    return NextResponse.json({ error: "task_name is required" }, { status: 400 });
  }

  try {
    const upstream = await fetch("https://api.muapi.ai/app/calculate_dynamic_cost", {
      method:  "POST",
      headers: {
        "x-api-key":    MU_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task_name: body.task_name,
        payload:   body.payload ?? {},
      }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        { error: text || "Upstream error", status: upstream.status },
        { status: upstream.status },
      );
    }

    let data: { cost?: number };
    try { data = JSON.parse(text); } catch { data = {}; }

    const upstreamCost = typeof data.cost === "number" ? data.cost : 0;
    const credits      = Math.max(1, Math.ceil(upstreamCost * CREDIT_MULTIPLIER));

    return NextResponse.json({
      cost:         upstreamCost,
      credits,
      taskName:     body.task_name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cost calculation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
