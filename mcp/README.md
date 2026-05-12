# Yilow MCP Server

Exposes every Yilow.ai tool — Cinema Studio, Soul, Marketing, Marketplace Cards, Edit Canvas, all viral effects, Lipsync, Voice Clone, and more — as **Model Context Protocol** tools, so any MCP-aware host (Claude Desktop, Cursor, Continue, Windsurf) can call them like local functions.

## Quick install

```bash
npm install -g @yilow/mcp-server
```

Then add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "yilow": {
      "command": "yilow-mcp",
      "env": {
        "YILOW_API_KEY": "yk_your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop — you should see "yilow" listed under the MCP tools panel, with every Yilow generator as a callable tool (e.g. `yilow_cinema-studio`, `yilow_soul-studio`, `yilow_marketing-studio`, `yilow_renaissance`, `yilow_lipsync-speak`, …).

## Get an API key

Go to `https://yilow.ai/settings/api-keys` and click **Create new key**. Paste it into `YILOW_API_KEY`.

## Environment variables

| Variable | Default | Notes |
|---|---|---|
| `YILOW_API_KEY` | _(required)_ | Your workspace API key |
| `YILOW_API_BASE` | `https://yilow.ai` | Override for self-hosted / staging |

## How it works

On startup the server fetches your tool catalog from `GET /api/mcp/catalog` and translates each tool's input schema into a JSON-Schema-compatible MCP tool description. When the host invokes a tool, the server POSTs to `/api/generations` with `source: "mcp"` and polls until the result is ready.

Credits are deducted from your Yilow balance per tool call — same pricing as the web app.

## Self-host

If you self-host Yilow, point the server at your domain:

```bash
YILOW_API_BASE="https://yilow.your-company.com" YILOW_API_KEY=yk_... yilow-mcp
```

## Manual smoke test

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | YILOW_API_KEY=yk_test node server.mjs
```

Should print the server handshake reply.
