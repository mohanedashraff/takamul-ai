// ════════════════════════════════════════════════════════════════
// MuAPI agents proxy — forwards every method to api.muapi.ai/agents/*
// ════════════════════════════════════════════════════════════════
// Kept on a different prefix from `/api/agents/*` (which we use for
// our own subscription-based agent marketplace) to avoid a routing
// conflict.

import { NextResponse } from "next/server";
import { auth } from "@/auth";

const MU_API_KEY = process.env.MU_API_KEY;
const BASE_URL   = "https://api.muapi.ai/agents";

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (!MU_API_KEY) {
    return NextResponse.json(
      { error: "MU_API_KEY is not configured on the server" },
      { status: 503 },
    );
  }

  // Public listing endpoints (templates / featured) don't strictly need
  // the user to be logged in. Mutations (chat) do — we still gate
  // everything behind auth here for simplicity; tweak later if we want
  // a public agents catalog.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { path } = await ctx.params;
    const url       = new URL(req.url);
    const targetUrl = `${BASE_URL}/${path.join("/")}${url.search}`;

    const isBodyMethod = req.method !== "GET" && req.method !== "HEAD";
    const headers: Record<string, string> = { "x-api-key": MU_API_KEY };
    let body: BodyInit | undefined;
    if (isBodyMethod) {
      body = await req.text();
      headers["Content-Type"] = req.headers.get("content-type") ?? "application/json";
    }

    const upstream = await fetch(targetUrl, { method: req.method, headers, body });
    const text     = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        { error: text || "Upstream error", status: upstream.status },
        { status: upstream.status },
      );
    }
    try { return NextResponse.json(JSON.parse(text)); }
    catch { return new NextResponse(text, { status: 200, headers: { "Content-Type": "text/plain" } }); }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal proxy error";
    console.error("[muapi/agents proxy]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET    = handle;
export const POST   = handle;
export const PUT    = handle;
export const PATCH  = handle;
export const DELETE = handle;
