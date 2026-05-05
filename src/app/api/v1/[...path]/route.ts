// ════════════════════════════════════════════════════════════════
// MuAPI v1 proxy — predictions / generations / uploads
// ════════════════════════════════════════════════════════════════
// Forwards every method (GET/POST/PUT/PATCH/DELETE) to
//   https://api.muapi.ai/api/v1/<path>?<query>
// injecting the server-side MU_API_KEY so it never leaks to the client.
//
// Used for:
//   POST /api/v1/<endpoint>                     → submit a generation, returns { request_id }
//   GET  /api/v1/predictions/<id>/result        → poll for result
//   POST /api/v1/upload_file                    → upload binary asset
//   GET  /api/v1/account/balance                → muapi-side balance (debug only)

import { NextResponse } from "next/server";
import { auth } from "@/auth";

const MU_API_KEY = process.env.MU_API_KEY;
const BASE_URL   = "https://api.muapi.ai/api/v1";

async function handleProxy(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  if (!MU_API_KEY) {
    return NextResponse.json(
      { error: "MU_API_KEY is not configured on the server" },
      { status: 503 },
    );
  }

  // Require an authenticated user — these are credit-spending endpoints.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { path } = await ctx.params;
    const url       = new URL(req.url);
    const targetUrl = `${BASE_URL}/${path.join("/")}${url.search}`;

    const isBodyMethod = req.method !== "GET" && req.method !== "HEAD";
    const incomingType = req.headers.get("content-type") ?? "";

    const headers: Record<string, string> = { "x-api-key": MU_API_KEY };

    let body: BodyInit | undefined;
    if (isBodyMethod) {
      // Pass-through binary uploads as-is (multipart, octet-stream, etc.)
      if (incomingType.startsWith("multipart/") || incomingType.startsWith("application/octet-stream")) {
        body = await req.arrayBuffer();
        headers["Content-Type"] = incomingType;
      } else {
        body = await req.text();
        headers["Content-Type"] = incomingType || "application/json";
      }
    }

    const upstream = await fetch(targetUrl, { method: req.method, headers, body });

    // Stream binary back to client
    const upstreamType = upstream.headers.get("content-type") ?? "";
    if (!upstreamType.includes("application/json") && !upstreamType.includes("text/")) {
      const buf = await upstream.arrayBuffer();
      return new NextResponse(buf, {
        status:  upstream.status,
        headers: { "Content-Type": upstreamType || "application/octet-stream" },
      });
    }

    const text = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        { error: text || "Upstream error", status: upstream.status },
        { status: upstream.status },
      );
    }

    // Most muapi responses are JSON
    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return new NextResponse(text, {
        status:  200,
        headers: { "Content-Type": upstreamType || "text/plain" },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal proxy error";
    console.error("[muapi/v1 proxy]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET    = handleProxy;
export const POST   = handleProxy;
export const PUT    = handleProxy;
export const PATCH  = handleProxy;
export const DELETE = handleProxy;
