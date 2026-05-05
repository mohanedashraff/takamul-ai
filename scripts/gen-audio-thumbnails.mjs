#!/usr/bin/env node
/**
 * Generate the 3 audio-tool thumbnails using OpenRouter's image
 * generation models. Saves PNGs to public/tool-thumbnails/.
 *
 * Run with:
 *   node scripts/gen-audio-thumbnails.mjs
 *
 * Reads OPENROUTER_API_KEY from env (or accepts an inline default for
 * one-off runs — replace before sharing).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const OUT_DIR    = path.resolve(__dirname, "..", "public", "tool-thumbnails");

const API_KEY = process.env.OPENROUTER_API_KEY ?? "";
if (!API_KEY) { console.error("Missing OPENROUTER_API_KEY env var"); process.exit(1); }

// Brand identity:
// - Accent: #fee440 (yellow)
// - Background: deep black/navy (#0a0a0f)
// - Style: cinematic, cosmic, neon-edge, premium tech aesthetic
// Each prompt encodes the brand language so the 3 thumbnails feel
// like a coherent set, not isolated stock images.
const BRAND_BLOCK = `
Premium tech aesthetic. Deep navy-black background (#0a0a0f) with
subtle radial glow. Vibrant electric yellow accents (#fee440) used
sparingly as the focal element. Soft golden bloom and cinematic
volumetric lighting. Glass / chrome / liquid-metal surfaces. Sharp
focus, high contrast, ultra-detailed. Square 1:1 framing, centered
composition. No text, no logos, no watermarks, no people.
`.trim();

const THUMBNAILS = [
  {
    id:     "text-to-speech",
    prompt: `Cinematic close-up of a sleek floating microphone made of polished chrome
and obsidian glass, glowing yellow soundwave ribbons spiralling out of it like
liquid light, suspended in dark space. The waves form an Arabic script-like
flowing line. ${BRAND_BLOCK}`,
  },
  {
    id:     "audio-separate",
    prompt: `Two distinct audio waveforms cleanly splitting apart in mid-air —
one luminous golden ribbon (vocals) curling up, one deep blue-violet ribbon
(music) curling down — separated by a thin glowing yellow line. Crystalline
particles between them. Floating in dark cosmic space. ${BRAND_BLOCK}`,
  },
  {
    id:     "audio-enhance",
    prompt: `A noisy, jagged grey audio waveform on the left transforming into a
crisp, glowing electric-yellow waveform on the right, with sparkling golden
particles and a soft halo of energy around the enhanced side. Dramatic before/
after composition. ${BRAND_BLOCK}`,
  },
];

async function generate(prompt, outFile) {
  const body = {
    model:     "openai/gpt-5.4-image-2",
    messages:  [{ role: "user", content: prompt }],
    modalities:["image", "text"],
  };
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method:  "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`OpenRouter ${r.status}: ${text.slice(0, 300)}`);
  }
  const data = await r.json();
  const url  = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error(`No image returned. Raw: ${JSON.stringify(data).slice(0, 300)}`);
  if (!url.startsWith("data:image/")) {
    // Some routes return a remote URL; fetch and save.
    const ir = await fetch(url);
    const buf = Buffer.from(await ir.arrayBuffer());
    fs.writeFileSync(outFile, buf);
  } else {
    const b64 = url.split(",")[1] ?? "";
    fs.writeFileSync(outFile, Buffer.from(b64, "base64"));
  }
  console.log(`✓ ${path.basename(outFile)} — ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB`);
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const t of THUMBNAILS) {
    const out = path.join(OUT_DIR, `${t.id}.png`);
    console.log(`→ Generating ${t.id}…`);
    try {
      await generate(t.prompt, out);
    } catch (err) {
      console.error(`✗ ${t.id} failed:`, err.message);
      process.exitCode = 1;
    }
  }
})();
