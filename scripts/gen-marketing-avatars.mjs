#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// scripts/gen-marketing-avatars.mjs
// ════════════════════════════════════════════════════════════════
// Generates the 30 missing Marketing-avatar thumbnails via MuAPI
// nano-banana. Each portrait is identity-neutral but ethnicity-
// hinted from the name's etymology so the picker shows a diverse
// avatar grid.
//
// Run from the server (which has MU_API_KEY):
//   ssh root@178.104.98.180 "cd /var/www/arabshoot && node scripts/gen-marketing-avatars.mjs"
//
// Writes the resulting { id: url } map to scripts/marketing-avatars.out.json
// for the next step (apply the map back into marketing.ts).

import { writeFileSync } from "node:fs";

const MU_API_KEY = process.env.MU_API_KEY;
if (!MU_API_KEY) {
  console.error("MU_API_KEY is required");
  process.exit(1);
}

// ── Avatars to generate ─────────────────────────────────────────
// Ethnicity hint inferred from name etymology. Keep this concise —
// the model fills the rest from "professional content creator" cues.

const AVATARS = [
  // Female
  { id: "mei",       name: "Mei",       gender: "female", hint: "East Asian, mid-20s" },
  { id: "yuna",      name: "Yuna",      gender: "female", hint: "Korean, late teens" },
  { id: "adriana",   name: "Adriana",   gender: "female", hint: "Italian-Spanish, mid-30s" },
  { id: "clara",     name: "Clara",     gender: "female", hint: "Northern European, early 30s" },
  { id: "maria",     name: "Maria",     gender: "female", hint: "Latina, late 20s" },
  { id: "sofia",     name: "Sofia",     gender: "female", hint: "Mediterranean, mid-30s" },
  { id: "valentina", name: "Valentina", gender: "female", hint: "Argentinian, mid-20s" },
  { id: "jia",       name: "Jia",       gender: "female", hint: "Chinese, early 20s" },
  { id: "lily",      name: "Lily",      gender: "female", hint: "Eurasian, mid-20s" },
  { id: "nia",       name: "Nia",       gender: "female", hint: "African American, late 20s" },
  { id: "hana",      name: "Hana",      gender: "female", hint: "Japanese, early 30s" },
  { id: "yuki",      name: "Yuki",      gender: "female", hint: "Japanese, mid-20s" },
  { id: "zara",      name: "Zara",      gender: "female", hint: "Middle Eastern, late 20s" },
  { id: "naomi",     name: "Naomi",     gender: "female", hint: "mixed Japanese-Caribbean, mid-20s" },
  { id: "megan",     name: "Megan",     gender: "female", hint: "Irish, late 20s" },
  { id: "miso",      name: "Miso",      gender: "female", hint: "Korean, early 20s" },
  { id: "scarlett",  name: "Scarlett",  gender: "female", hint: "Northern European, mid-30s" },

  // Male
  { id: "jayden",    name: "Jayden",    gender: "male",   hint: "African American, mid-20s" },
  { id: "stefan",    name: "Stefan",    gender: "male",   hint: "German, mid-30s" },
  { id: "tae",       name: "Tae",       gender: "male",   hint: "Korean, mid-20s" },
  { id: "felix",     name: "Felix",     gender: "male",   hint: "Northern European, late 20s" },
  { id: "malik",     name: "Malik",     gender: "male",   hint: "African / Arab, early 30s" },
  { id: "liam",      name: "Liam",      gender: "male",   hint: "Irish, mid-20s" },
  { id: "joon",      name: "Joon",      gender: "male",   hint: "Korean, late 20s" },
  { id: "erik",      name: "Erik",      gender: "male",   hint: "Scandinavian, mid-30s" },
  { id: "ryu",       name: "Ryu",       gender: "male",   hint: "Japanese, mid-20s" },
  { id: "marco",     name: "Marco",     gender: "male",   hint: "Italian, mid-30s" },
  { id: "ren",       name: "Ren",       gender: "male",   hint: "Japanese, early 30s" },
  { id: "lucas",     name: "Lucas",     gender: "male",   hint: "Brazilian, late 20s" },
  { id: "omar",      name: "Omar",      gender: "male",   hint: "Egyptian, mid-30s" },
];

function buildPrompt(a) {
  return [
    `Editorial portrait of ${a.name}, a ${a.hint} ${a.gender} content creator.`,
    "Confident relaxed expression, soft warm smile, looking at the camera.",
    "Three-quarter framing, head-and-shoulders crop.",
    "Clean neutral mid-grey seamless studio backdrop.",
    "Soft three-point softbox lighting, gentle catchlight in the eyes.",
    "Photographic 85 mm portrait lens look, sharp focus on the face,",
    "naturalistic skin texture, true-to-life colour science.",
    "No watermarks, no text overlays.",
  ].join(" ");
}

// ── MuAPI helpers ───────────────────────────────────────────────

const MUAPI = "https://api.muapi.ai/api/v1";

async function submit(prompt) {
  const r = await fetch(`${MUAPI}/nano-banana`, {
    method:  "POST",
    headers: { "x-api-key": MU_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      aspect_ratio: "3:4",
      resolution:   "2k",
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`submit ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j.request_id || j.requestId;
}

async function poll(requestId, timeoutMs = 3 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2_000));
    const r = await fetch(`${MUAPI}/predictions/${requestId}/result`, {
      headers: { "x-api-key": MU_API_KEY },
    });
    const j = await r.json().catch(() => ({}));
    const status = String(j.status || "").toLowerCase();
    if (status === "completed" || status === "succeeded" || status === "success") {
      return j.url || (Array.isArray(j.urls) && j.urls[0]) ||
             (Array.isArray(j.outputs) && j.outputs[0]) || null;
    }
    if (status === "failed" || status === "error") {
      throw new Error(`prediction failed: ${j.error ?? j.detail ?? "unknown"}`);
    }
  }
  throw new Error("poll timeout");
}

// ── Run ─────────────────────────────────────────────────────────

(async () => {
  const results = {};
  const failures = [];

  // Run with concurrency — 4 in flight at a time so we don't hammer.
  const CONCURRENCY = 4;
  let i = 0;
  async function worker(workerId) {
    while (i < AVATARS.length) {
      const a = AVATARS[i++];
      const startedAt = Date.now();
      try {
        const prompt = buildPrompt(a);
        const requestId = await submit(prompt);
        if (!requestId) throw new Error("no request_id");
        const url = await poll(requestId);
        if (!url) throw new Error("no url in result");
        results[a.id] = url;
        console.log(`[w${workerId}] ✓ ${a.id} (${a.name}) — ${Math.round((Date.now()-startedAt)/1000)}s`);
      } catch (err) {
        failures.push({ id: a.id, error: err.message });
        console.error(`[w${workerId}] ✗ ${a.id} — ${err.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, k) => worker(k + 1)));

  console.log(`\nGenerated ${Object.keys(results).length}/${AVATARS.length} avatars.`);
  if (failures.length > 0) {
    console.log("Failures:", JSON.stringify(failures, null, 2));
  }

  writeFileSync(
    new URL("./marketing-avatars.out.json", import.meta.url),
    JSON.stringify({ results, failures, generatedAt: new Date().toISOString() }, null, 2),
  );
  console.log("Wrote scripts/marketing-avatars.out.json");
})().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
