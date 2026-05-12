#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// Yilow MCP Server (stdio transport, zero dependencies)
// ════════════════════════════════════════════════════════════════
//
// Exposes Yilow's tool catalog to any MCP host (Claude Desktop,
// Cursor, Continue, etc.) over the stdio transport. Reads tool
// metadata from the catalog endpoint and proxies execution back
// through the user's Yilow workspace.
//
// Usage:
//   YILOW_API_KEY=yk_... node mcp/server.mjs
//   (or wired into ~/.config/claude/claude_desktop_config.json)
//
// We speak JSON-RPC 2.0 over stdio per the MCP spec. The full SDK
// is not required — the wire format is straightforward.

import { stdin, stdout, exit, env } from "node:process";
import { createInterface } from "node:readline";

// ── Configuration ────────────────────────────────────────────────
const API_KEY = env.YILOW_API_KEY;
const API_BASE = env.YILOW_API_BASE || "https://yilow.ai";

if (!API_KEY) {
  // Don't log to stdout — MCP hosts parse stdout as JSON-RPC.
  console.error("[yilow-mcp] YILOW_API_KEY is required. Get yours at https://yilow.ai/settings/api-keys");
  exit(1);
}

// ── Tool catalog (lazy-loaded from API) ─────────────────────────
let TOOL_CATALOG = null;

async function loadCatalog() {
  if (TOOL_CATALOG) return TOOL_CATALOG;
  const r = await fetch(`${API_BASE}/api/mcp/catalog`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!r.ok) {
    throw new Error(`Failed to load tool catalog (${r.status})`);
  }
  const data = await r.json();
  TOOL_CATALOG = data.tools || [];
  return TOOL_CATALOG;
}

// Translate a Yilow ToolInput into an MCP JSON-schema property.
function inputToJsonSchema(input) {
  const base = { description: input.label || input.id };
  switch (input.type) {
    case "upload":
    case "multi-upload":
      return { type: "string", format: "uri", ...base,
               description: `${base.description} (URL to image/video/audio)` };
    case "prompt":
      return { type: "string", ...base };
    case "button-group":
    case "select":
      return {
        type: "string",
        ...base,
        enum: (input.options || []).map((o) => o.value),
        ...(input.defaultValue ? { default: input.defaultValue } : {}),
      };
    case "ratio-picker":
      return {
        type: "string",
        ...base,
        enum: (input.options || []).map((o) => o.value),
        default: input.defaultValue || "16:9",
      };
    case "slider":
    case "counter":
      return {
        type: "number",
        ...base,
        ...(input.min !== undefined ? { minimum: input.min } : {}),
        ...(input.max !== undefined ? { maximum: input.max } : {}),
        ...(input.defaultValue !== undefined ? { default: input.defaultValue } : {}),
      };
    case "toggle":
      return { type: "boolean", ...base, default: input.defaultValue ?? false };
    case "color":
      return { type: "string", ...base, pattern: "^#[0-9a-fA-F]{6}$" };
    default:
      return { type: "string", ...base };
  }
}

function toolToMcpSchema(tool) {
  const properties = {};
  const required = [];
  for (const input of tool.inputs || []) {
    properties[input.id] = inputToJsonSchema(input);
    if (input.required) required.push(input.id);
  }
  return {
    name: `yilow_${tool.id.replace(/[^a-zA-Z0-9_]/g, "_")}`,
    description: tool.desc || tool.title,
    inputSchema: {
      type: "object",
      properties,
      required,
    },
  };
}

// ── JSON-RPC handlers ───────────────────────────────────────────

async function handleInitialize(_params) {
  return {
    protocolVersion: "2024-11-05",
    capabilities: { tools: {} },
    serverInfo: {
      name:    "yilow-mcp",
      version: "0.1.0",
    },
  };
}

async function handleToolsList() {
  const catalog = await loadCatalog();
  return { tools: catalog.map(toolToMcpSchema) };
}

async function handleToolsCall(params) {
  const { name, arguments: args } = params;
  if (!name?.startsWith("yilow_")) {
    throw { code: -32602, message: `Unknown tool: ${name}` };
  }
  const toolId = name.replace(/^yilow_/, "").replace(/_/g, "-");
  const catalog = await loadCatalog();
  const tool = catalog.find((t) => t.id === toolId);
  if (!tool) {
    throw { code: -32602, message: `Unknown Yilow tool: ${toolId}` };
  }

  // Dispatch to the workspace generation endpoint.
  const r = await fetch(`${API_BASE}/api/generations`, {
    method:  "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ toolId, inputs: args || {}, source: "mcp" }),
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    throw { code: -32603, message: `Yilow API ${r.status}: ${errText.slice(0, 300)}` };
  }
  const data = await r.json();

  // Poll until the generation finishes (max ~5 min).
  const generationId = data.generation?.id;
  if (!generationId) return formatToolResult({ ok: false, error: "No generation id" });

  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((res) => setTimeout(res, 3_000));
    const pr = await fetch(`${API_BASE}/api/generations/${generationId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!pr.ok) continue;
    const gen = await pr.json().catch(() => ({}));
    const status = gen?.generation?.status;
    if (status === "COMPLETED") {
      return formatToolResult({
        ok: true,
        url: gen.generation.outputs?.url,
        outputs: gen.generation.outputs,
      });
    }
    if (status === "FAILED") {
      return formatToolResult({
        ok: false,
        error: gen.generation.error || "Generation failed",
      });
    }
  }
  return formatToolResult({ ok: false, error: "Generation timed out (5 min)" });
}

function formatToolResult(payload) {
  return {
    content: [
      { type: "text", text: JSON.stringify(payload, null, 2) },
    ],
    isError: !payload.ok,
  };
}

// ── JSON-RPC loop ────────────────────────────────────────────────

const rl = createInterface({ input: stdin, terminal: false });

function send(msg) {
  stdout.write(JSON.stringify(msg) + "\n");
}

rl.on("line", async (line) => {
  if (!line.trim()) return;
  let req;
  try { req = JSON.parse(line); } catch {
    return send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
  }
  const { id, method, params } = req;
  try {
    let result;
    switch (method) {
      case "initialize":      result = await handleInitialize(params); break;
      case "initialized":     return; // notification — no response
      case "tools/list":      result = await handleToolsList(); break;
      case "tools/call":      result = await handleToolsCall(params); break;
      case "ping":            result = {}; break;
      default:
        return send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
    send({ jsonrpc: "2.0", id, result });
  } catch (err) {
    const error = err && typeof err === "object" && "code" in err
      ? err
      : { code: -32603, message: err instanceof Error ? err.message : String(err) };
    send({ jsonrpc: "2.0", id, error });
  }
});

rl.on("close", () => exit(0));
