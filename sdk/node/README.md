# @yilow/client

Yilow.ai Node SDK + CLI. Run every Yilow tool — Cinema Studio, Soul, Marketing, Lipsync, Voice Clone, all viral effects — from your scripts or terminal.

## Install

```bash
npm install @yilow/client
# or globally for the CLI:
npm install -g @yilow/client
```

## Auth

Generate a key at `https://yilow.ai/settings/api-keys` and export it:

```bash
export YILOW_API_KEY=yk_...
```

## SDK usage

```ts
import { Yilow } from "@yilow/client";

const yilow = new Yilow({ apiKey: process.env.YILOW_API_KEY! });

// 1. List tools
const tools = await yilow.tools();

// 2. Run a tool (submit + wait)
const result = await yilow.run("cinema-studio", {
  prompt:       "An epic desert chase at golden hour",
  aspect_ratio: "16:9",
  resolution:   "2k",
});
console.log(result.outputs.url);

// 3. Or submit + poll yourself
const job = await yilow.generate("renaissance", { image: "https://…" });
const final = await yilow.waitForResult(job.generationId, {
  onTick: (state) => console.log("state:", state.status),
});
```

## CLI usage

```bash
# List tools
yilow tools

# Run a tool with inline inputs
yilow run cinema-studio \
  --input prompt="desert chase at golden hour" \
  --input aspect_ratio="16:9"

# Or pass a JSON object
yilow run marketplace-cards --json '{"selectedAssetIds":["main-hero"],"intent":"…","productUrl":"https://…"}'

# Check a job
yilow status gen_abc123

# See your credit balance
yilow me
```

## Errors

All non-2xx responses surface as `YilowError` with `.status` and `.body`:

```ts
import { YilowError } from "@yilow/client";

try { await yilow.run("…", {}); }
catch (err) {
  if (err instanceof YilowError && err.status === 402) {
    console.error("Out of credits — top up at https://yilow.ai/billing");
  }
}
```
