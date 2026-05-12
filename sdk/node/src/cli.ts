#!/usr/bin/env node
/**
 * @yilow/cli — Yilow.ai command-line interface
 * --------------------------------------------------------------
 *
 *   yilow tools                    # list available tools
 *   yilow run cinema-studio --prompt "epic …"
 *   yilow status <generation-id>   # check generation status
 *   yilow me                       # account info + credit balance
 *
 * Auth: set YILOW_API_KEY in your environment (or pass --api-key).
 */

import { Command } from "commander";
import { Yilow } from "./index.js";

const program = new Command();
program
  .name("yilow")
  .description("Yilow.ai CLI — run any Yilow tool from your terminal.")
  .version("0.1.0")
  .option("--api-key <key>", "API key (defaults to YILOW_API_KEY)")
  .option("--base-url <url>", "Override API base (defaults to https://yilow.ai)");

function client(opts: { apiKey?: string; baseUrl?: string }): Yilow {
  const apiKey = opts.apiKey || process.env.YILOW_API_KEY;
  if (!apiKey) {
    console.error("Missing API key. Set YILOW_API_KEY or pass --api-key.");
    process.exit(1);
  }
  return new Yilow({ apiKey, baseUrl: opts.baseUrl });
}

program
  .command("tools")
  .description("List every tool available to your workspace.")
  .action(async () => {
    const c = client(program.opts());
    const tools = await c.tools();
    const max = Math.max(...tools.map((t) => t.id.length));
    for (const t of tools) {
      console.log(`${t.id.padEnd(max + 2)} ${t.credits.toString().padStart(3)}c  ${t.title}`);
    }
    console.log(`\n${tools.length} tools.`);
  });

program
  .command("run <toolId>")
  .description("Submit a tool job and stream until completion.")
  .option("--input <key=value...>", "Pass inputs as repeated key=value pairs")
  .option("--json <json>", "Pass full input object as a JSON string")
  .action(async (toolId: string, opts: { input?: string[]; json?: string }) => {
    const c = client(program.opts());
    const inputs: Record<string, unknown> = {};
    if (opts.json) {
      try { Object.assign(inputs, JSON.parse(opts.json)); }
      catch { console.error("--json must be valid JSON"); process.exit(1); }
    }
    for (const pair of opts.input ?? []) {
      const eq = pair.indexOf("=");
      if (eq < 0) continue;
      inputs[pair.slice(0, eq)] = pair.slice(eq + 1);
    }

    process.stderr.write(`▶ submitting ${toolId} …\n`);
    const result = await c.run(toolId, inputs);
    if (result.status === "FAILED") {
      console.error("✗ generation failed:", result.outputs);
      process.exit(2);
    }
    console.log(JSON.stringify(result.outputs ?? {}, null, 2));
  });

program
  .command("status <generationId>")
  .description("Check the status of a previously submitted generation.")
  .action(async (id: string) => {
    const c = client(program.opts());
    const s = await c.generation(id);
    console.log(JSON.stringify(s, null, 2));
  });

program
  .command("me")
  .description("Show account info and credit balance.")
  .action(async () => {
    const c = client(program.opts());
    const me = await c.me();
    console.log(JSON.stringify(me, null, 2));
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
