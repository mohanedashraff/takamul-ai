# Higgsfield Deep-Dive Research Brief

> **Pass this entire document, verbatim, to a fresh AI agent (Claude Sonnet
> 4.5+, GPT-4o, or any agent with browser + filesystem + bash access).**
> The agent's only job is to produce exhaustive documentation of the
> Higgsfield AI platform — every tool, every model, every prompt template,
> every picker catalog, every helper — by mining FREE sources only.

---

## 1. Who you are working for

You are doing research for **Yilow.ai** (yilow.ai), an Arabic-first AI
generation platform that ships ~36 tools mirroring Higgsfield's surface.
The current user is the founder. They've built ~80% functional parity
with Higgsfield but discovered that several of their tools "kind of
work but don't produce results matching what the tool name promises"
(e.g. their `change-angle` tool sends azimuth/elevation as a prompt to
flux-kontext which has no 3D rotation knob, so the result is a
near-copy of the input).

**Their goal:** completely replicate Higgsfield's behavior. To do that
they need exhaustive technical documentation of EVERY Higgsfield tool —
which model is invoked, what prompt template is injected, what helper
catalogs exist, how filters/safety/post-processing work.

**Critical constraint:** **NO PAID GENERATIONS.** The user has zero
budget for Higgsfield credits. You must extract everything via FREE
techniques only. Triggering a generation that costs credits is a
hard fail. If a piece of data can only be obtained by paying, mark it
as "unobtainable without paid trigger" and move on.

---

## 2. What you already have access to

### 2.1 Already-cloned Higgsfield public repos

These are sitting on disk at `H:\Projects\takamul ai\.tmp-hf-research\`:

```
.tmp-hf-research/
├── cli/                       — Higgsfield CLI source + MODELS.md catalog
│   ├── MODELS.md              — definitive list of 18 image + 16 video models
│   ├── README.md              — CLI commands reference
│   └── install.sh
├── skills/                    — Higgsfield AI agent skills
│   ├── higgsfield-generate/SKILL.md
│   ├── higgsfield-soul-id/SKILL.md
│   ├── higgsfield-product-photoshoot/SKILL.md
│   └── higgsfield-marketplace-cards/SKILL.md
├── higgsfield-js/             — Official Node SDK (TypeScript)
│   └── src/
│       ├── client.ts          — auth + endpoint patterns
│       ├── v2/                — newer SDK v2 with subscribe()
│       ├── models/JobSet.ts   — job lifecycle
│       └── models/SoulId.ts   — Soul training flow
└── higgsfield-client/         — Official Python SDK
```

**Read all of these end-to-end first.** Many answers are already there.

### 2.2 Yilow's own codebase (for context only)

`H:\Projects\takamul ai\src\lib\data\tools.ts` contains Yilow's 36 tool
definitions. `docs/HIGGSFIELD_FULL_COMPARISON.md` contains the previous
audit. Read these so you know what gaps to fill.

### 2.3 A confirmed live Higgsfield account (browser session)

The user has an active free-tier Higgsfield account in their browser.
You can navigate to `https://higgsfield.ai/*` pages and they'll be
authenticated. **Browsing is free. Triggering generations costs credits.**
You are allowed to:
- Open any page
- Inspect DOM, JavaScript, network calls (passive observation only)
- Open picker dropdowns and dialogs (these load free GET endpoints)
- Click "Try now" / "Generate" buttons **ONLY IF** the click does
  not trigger a paid action (it almost always does, so don't)

You are NOT allowed to:
- Click Generate / Submit / Pay buttons
- Anything that says "X credits"
- Sign up for trials with the user's payment method

---

## 3. What we already know (don't re-discover this)

### 3.1 The 34 base models (from `cli/MODELS.md`)

**18 image models:**
`cinematic_studio_2_5`, `flux_2`, `flux_kontext`, `gpt_image_2`,
`grok_image`, `image_auto`, `kling_omni_image`, `marketing_studio_image`,
`nano_banana`, `nano_banana_2` (= Nano Banana Pro), `nano_banana_flash`
(= Nano Banana 2), `openai_hazel`, `seedream_v4_5`, `seedream_v5_lite`,
`soul_cinematic`, `soul_location`, `text2image_soul_v2`, `z_image`

**16 video models:**
`cinematic_studio_3_0`, `cinematic_studio_video`,
`cinematic_studio_video_v2`, `grok_video`, `kling2_6`, `kling3_0`,
`marketing_studio_video`, `minimax_hailuo`, `seedance1_5`,
`seedance_2_0`, `soul_cast`, `veo3`, `veo3_1`, `veo3_1_lite`, `wan2_6`,
`wan2_7`

**Per-model flags + valid ranges/enums** are documented in `MODELS.md`.

### 3.2 API patterns

- **Auth (v2):** header `Authorization: Key <KEY_ID>:<KEY_SECRET>`
- **Auth (v1):** headers `hf-api-key` + `hf-secret`
- **Generate endpoint pattern:** `POST /<provider>/<model>/<variant>/<task>`
  examples: `flux-pro/kontext/max/text-to-image`, `/v1/image2video/dop`
- **Polling:** `GET /requests/<request_id>/status`
- **Soul training:** `POST /v1/custom-references` with
  `{ name, input_images: [{type:"image_url", image_url}] }`

### 3.3 Already-captured payloads

- **Soul V2** (live network capture during user session):
  ```json
  {
    "model": "soul_v2",
    "prompt": "<user text>",
    "style_id": "<UUID>",
    "color_preset_id": "<UUID>",
    "negative_prompt": "",
    "seed": <int>,
    "style_strength": 1,
    "use_refiner": false,
    "aspect_ratio": "3:4",
    "quality": "720p"
  }
  ```
- **Angles 2.0** routes to `qwen_camera_control_job` with payload:
  ```json
  {
    "input_image": { "url": "...", "type": "qwen_camera_control_job" },
    "rotate_degree": <int>,
    "vertical_angle": <-1..+1>,
    "move_forward_level": <number>
  }
  ```
- **Marketing Studio Hooks** so far captured (9 of "20+"):
  Product Hit, Spicy, Interview, Random Object Mic, Product Crash,
  Blizzard, Camera Bump, Product Dodge, Epic Fail
- **Marketing Studio Settings** captured (14): Bedroom, Airplane Wing,
  Nature, Roofing, Gym, Volcano Rim, Bathroom, Tiny Reviewer, Kitchen,
  Car Roof, In Car, Street, Office, Train Surf

---

## 4. What you must produce (deliverables)

### 4.1 File structure

Create the following under `docs/higgsfield-research/`:

```
docs/higgsfield-research/
├── 00_INVENTORY.md                — master list, every tool/app/studio
├── 01_API_ARCHITECTURE.md         — auth, endpoints, polling, lifecycle
├── 02_BASE_MODELS/                — one MD per base model (34 files)
│   ├── nano_banana_2.md
│   ├── text2image_soul_v2.md
│   ├── marketing_studio_video.md
│   └── ...
├── 03_APPS_LIBRARY/               — one MD per /apps/* (50+ files)
│   ├── angles.md
│   ├── shots.md
│   ├── transitions.md
│   ├── relight.md
│   ├── billboard.md
│   ├── plushies.md
│   ├── cakeify.md
│   └── ...
├── 04_STUDIOS/                    — one MD per major studio
│   ├── soul.md
│   ├── cinema.md
│   ├── marketing-studio.md
│   ├── edit-canvas.md
│   ├── character-training.md
│   └── assist.md
├── 05_CATALOGS/                   — every picker / preset list
│   ├── soul-styles.md             — all moodboard UUIDs + names + thumbnails
│   ├── soul-color-presets.md
│   ├── marketing-hooks.md         — full list (target 20+)
│   ├── marketing-settings.md      — full list (target 20+)
│   ├── marketing-avatars.md
│   ├── marketing-products.md
│   ├── cinema-cameras.md
│   ├── cinema-lenses.md
│   ├── cinema-genres.md
│   ├── cinema-color-palettes.md
│   ├── cinema-lighting-styles.md
│   ├── cinema-movesets.md
│   └── ai-effects.md              — full ai-video-effects name enum
├── 06_HELPERS/                    — AI assistants on the platform
│   ├── ai-director.md             — Cinema Studio's AI director
│   ├── prompt-enhancer.md         — if exists
│   ├── assist-chatbot.md          — /assist
│   └── color-grading-ai.md
├── 07_FILTERS_AND_PROCESSING.md   — safety, NSFW, watermarking, upscaling
├── 08_PRICING.md                  — credit cost per tool/model/quality
└── 99_GAPS.md                     — anything you couldn't extract + why
```

### 4.2 Per-tool documentation template

Every file in `02_BASE_MODELS/`, `03_APPS_LIBRARY/`, and `04_STUDIOS/`
must follow this exact structure:

```markdown
# <Tool Name>

**Higgsfield slug / ID:** `<job_set_type or app id>`
**Higgsfield URL:** `https://higgsfield.ai/<path>`
**Category:** image / video / audio / studio / app
**Output type:** still image / video clip / animated gif / audio file

## Underlying model

What backend model this tool ultimately routes to.
- Model name: `<model_id>`
- Model family: <e.g., Qwen Image Edit Plus + LoRA "Camera Control">
- Why this model is chosen: <reasoning>

## UI inputs (what the user provides)

| Input | Type | Required | Default | Notes |
|---|---|---|---|---|
| Image | upload | yes | — | accept: image/* |
| Prompt | textarea | yes | — | placeholder: "..." |
| Style | dropdown | no | "default" | enum: ["...", "..."] |
| ... | ... | ... | ... | ... |

## Hidden inputs (system-side, baked at submit time)

These are NOT shown to the user but are sent to the API.

| Field | Value | Source |
|---|---|---|
| `prompt_template` | "<full template, with {USER_PROMPT} placeholder>" | hardcoded in app |
| `negative_prompt` | "blurry, watermark, text..." | hardcoded |
| `model_version` | "fast" | default |
| `safety_tolerance` | 2 | platform default |
| ... | ... | ... |

## Final API payload (verified via network capture)

```json
{
  "model": "...",
  "prompt": "<the FULL string sent, including any prefix/suffix injection>",
  "style_id": "<UUID>",
  ...
}
```

If you don't have this from a network capture, write
`UNVERIFIED — inferred from <source>` and explain.

## Pickers / dependent catalogs

If this tool has a picker (e.g., a moodboard picker, an effect picker),
list them here with cross-reference to the catalog file.
- Style picker → see [`05_CATALOGS/soul-styles.md`](../05_CATALOGS/soul-styles.md)
- Settings picker → see [`05_CATALOGS/marketing-settings.md`](../05_CATALOGS/marketing-settings.md)

## Helper integrations

Does this tool use any AI helpers? (Director, Enhancer, etc.)
- AI Director: NO / YES — see [`06_HELPERS/ai-director.md`](../06_HELPERS/ai-director.md)

## Filters & post-processing

- Safety: `use_green: true` / NSFW filter applied
- Auto-upscaling: NO
- Watermarking on free tier: YES / NO
- Resolution caps on free tier: 720p

## Cost

- Free tier: locked / X credits / unavailable
- Paid: X credits per generation, scales with duration/resolution

## Yilow equivalent

- Our tool ID: `change-angle`
- Match level: ✅ same model / 🟢 same family / 🟡 approximation / 🔴 different / ❌ not shipped
- Notes: <gaps to close>

## Sources

How you obtained this data:
- [ ] cli/MODELS.md
- [ ] higgsfield-js SDK source
- [ ] __NEXT_DATA__ on /apps/<slug>
- [ ] Compiled JS chunks (link to file + grep snippet)
- [ ] DOM scrape of picker dropdown
- [ ] Network capture (free GET endpoint)
- [ ] Cookbook / docs / video
```

---

## 5. Free extraction techniques (use ALL of them)

### 5.1 Read every cloned repo file (30 min)

Already on disk. Don't skip files. Especially:
- `cli/MODELS.md` (you have this)
- `skills/*/SKILL.md` (4 files)
- `skills/*/references/*` (sometimes contains prompt templates!)
- `higgsfield-js/src/v2/types.ts` and `schema-loader.ts`
- `higgsfield-js/src/models/JobSet.ts`
- `higgsfield-client/` (Python SDK — sometimes has more inline docs)

### 5.2 Mine `__NEXT_DATA__` on every page (1 hour)

Higgsfield's frontend is Next.js. Every page renders a
`<script id="__NEXT_DATA__" type="application/json">{...}</script>` tag
with the entire SSR payload — feature flags, picker contents, prompt
templates, pricing, the whole React tree's initial state.

For each URL below, navigate, then:
```js
JSON.parse(document.getElementById('__NEXT_DATA__').textContent)
```

Pages to scan:
- `/apps` — full app catalog with category metadata
- `/apps/<slug>` for each of the 50+ apps:
  angles, shots, transitions, relight, similarity-score, expand-image,
  skin-enhancer, ai-stylist, outfit-swap, style-snap, face-swap,
  ai-headshot-generator, character-swap, recast, video-face-swap,
  clipcut, urban-cuts, video-background-remover, breakdown,
  japanese-show, link-to-video-ad, billboard, bullet-time-scene,
  truck-ad, bullet-time-white, game-dump, nano-strike, nano-theft,
  simlife, plushies, meme-generator, image-background-remover,
  surrounded-by-animals, signboard, paint-app, this-is-fine, skibidi,
  mukbang, cloud-surf, idol
- `/ai/image?model=soul-v2` — Soul Studio
- `/cinema-studio` — Cinema
- `/marketing-studio/product` and `/marketing-studio/app`
- `/edit` — Edit canvas
- `/character` — Character training
- `/assist` — AI assistant
- `/audio` — audio tools
- `/video` — video tools
- `/image` — image tools

Extract from each:
- `props.pageProps.*` — initial picker contents, default values
- `query` and `route`
- Any embedded prompt templates (search for `prompt_template`,
  `system_prompt`, `enhance_prompt`)

### 5.3 Mine compiled JS chunks (CRITICAL — 2 hours)

Higgsfield's app code is in `_next/static/chunks/*.js`. These contain
ALL prompt templates, all UUIDs, all enums, all hardcoded strings.

```bash
# 1. From any Higgsfield page, find the chunk URLs
curl -s https://higgsfield.ai/apps | grep -oE '/_next/static/chunks/[^"]+\.js' | sort -u > chunks.txt

# 2. Download each (~20-50 chunks usually)
mkdir -p hf-chunks
for url in $(cat chunks.txt); do
  fn=$(echo "$url" | sed 's|/|_|g')
  curl -s "https://higgsfield.ai$url" -o "hf-chunks/$fn"
done

# 3. Beautify with prettier or js-beautify
for f in hf-chunks/*.js; do
  npx prettier "$f" > "$f.pretty.js" 2>/dev/null
done

# 4. Grep for prompt templates and tool definitions
grep -rE '"(prompt|system|enhance|template|directive)"\s*:\s*"[^"]{20,}"' hf-chunks/ > prompts-found.txt
grep -rE 'job_set_type|model_id|app_id' hf-chunks/ > model-refs.txt
grep -rE '\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b' hf-chunks/ | head -1000 > uuids.txt
```

What you're looking for:
- **Prompt templates** like `"Transform this person into a {STYLE} style with {DETAILS}"`
- **System prompts** for AI Director, Enhancer
- **App-to-model mappings** like `apps.plushies.model = "nano_banana_flash"`
- **Default param objects** like `apps.cakeify.defaults = { name: "Cakeify", ... }`
- **UUID → name mappings** for hooks, settings, avatars, etc.

### 5.4 Source maps (5 min — try first)

```bash
# Check if source maps are exposed
for f in hf-chunks/*.js; do
  url=$(grep -oE '//# sourceMappingURL=.*' "$f")
  if [ -n "$url" ]; then echo "$f → $url"; fi
done
```

If yes — download and you get the original TypeScript with comments.
This is rare but instant if available.

### 5.5 Picker / catalog GET endpoints (1 hour)

When you open a picker (Hooks, Settings, Soul Styles), the frontend
fires a free GET to load the catalog. Open browser DevTools Network
panel, navigate to the tool, click the picker, capture the GET URL.

Already-known patterns to try:
- `GET /v1/marketing/hooks?page=1&page_size=100`
- `GET /v1/marketing/settings`
- `GET /v1/marketing/avatars`
- `GET /v1/marketing/products?workspace_id=<id>`
- `GET /v1/soul/styles`
- `GET /v1/soul/color-presets`
- `GET /v1/cinema/cameras`
- `GET /v1/cinema/lenses`
- `GET /v1/cinema/genres`
- `GET /v1/cinema/movesets`
- `GET /v1/dop/motions` (for camera-control motions)
- `GET /v1/effects` (the AI video effects enum)

These are FREE because they don't trigger generations.

### 5.6 GraphQL introspection (5 min — try)

```bash
curl -X POST https://api.higgsfield.ai/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name fields { name type { name } } } } }"}'
```

If they have GraphQL and introspection isn't disabled in production,
this returns the entire schema.

### 5.7 CLI free commands (15 min)

If the user authenticates the CLI on their machine:
```bash
higgsfield model list                  # list all 34 models
higgsfield model get <type>            # full schema for one model
higgsfield model list --json           # JSON output, parseable
```

These are free GET endpoints, no credit cost.

### 5.8 DOM scraping pickers (1-2 hours)

For every picker that doesn't load via a clean GET (some are
client-rendered from a static asset), open it and use DOM:

```js
// Generic picker scraper — adjust selector per picker
Array.from(document.querySelectorAll('[role="dialog"] [data-id]')).map(el => ({
  id: el.dataset.id,
  name: el.querySelector('[class*="title"], h3, h4')?.textContent?.trim(),
  thumbnail: el.querySelector('video, img')?.src,
  description: el.querySelector('[class*="desc"], p')?.textContent?.trim(),
}))
```

Scroll the picker fully (some are virtualized) before scraping, e.g.:
```js
const m = document.querySelector('[role="dialog"] [class*="overflow"]');
m.scrollTop = m.scrollHeight; // repeat until no more rows load
```

Pickers to fully scrape:
- Marketing Studio Hooks (target 20+, currently 9)
- Marketing Studio Settings (target 20+, currently 14)
- Marketing Studio Avatars
- Marketing Studio Products
- Marketing Studio Formats
- Soul moodboards (target 100+, currently 33)
- Soul color presets
- Cinema cameras (target 200+ presets per their marketing copy)
- Cinema lenses
- Cinema genres
- Cinema lighting styles
- Cinema movesets
- AI Effects (`ai-video-effects.name` enum — already have list from
  Yilow's full-registry.js, but verify against Higgsfield UI)
- DOP camera motions (for Angles 2.0 / camera control)

### 5.9 npm package source (15 min)

```bash
npm view @higgsfield/cli files
npm pack @higgsfield/cli
tar xf higgsfield-cli-*.tgz
# Inspect the tarball — sometimes contains uncompiled JS with
# prompt strings inline
```

### 5.10 Free trial credits (FALLBACK ONLY — last resort)

If a critical piece of data is unobtainable any other way (e.g., the
exact prompt that gets injected when a user clicks the Cakeify app):

1. Check the user's account credit balance on Higgsfield.
2. If they have free credits, ask them BEFORE spending any:
   "I've exhausted free methods for tool X. Can I use Y free credits
   you have to capture its payload?"
3. Even then, capture as MANY tools as possible per single click —
   often the SAME endpoint serves multiple apps so one capture covers
   several.

NEVER use this without explicit user confirmation per-tool.

### 5.11 Community sources (30 min)

Search-engine queries to run:
- `site:youtube.com "higgsfield" "network panel"`
- `site:reddit.com/r/StableDiffusion "higgsfield" "model"`
- `site:github.com "higgsfield" "prompt"`
- `"higgsfield" "system prompt"`
- `site:medium.com higgsfield review`
- Higgsfield's own help docs (search `higgsfield.ai/help` or `/docs`)

Sometimes a tutorial blogger captured a payload and wrote about it.

---

## 6. Quality bar

You are NOT done until:

1. **Every entry in `00_INVENTORY.md` has a corresponding file** under
   `02_BASE_MODELS/`, `03_APPS_LIBRARY/`, or `04_STUDIOS/`.
2. **Each file** follows the template in section 4.2 with no missing
   sections. If a section is "unobtainable," explain WHY and what
   technique was tried.
3. **Catalog files** have COMPLETE picker contents, not partial.
   "Marketing Hooks" must list all 20+, not just 9.
4. **`99_GAPS.md`** explicitly lists every piece of data you couldn't
   obtain, with the failed extraction attempts logged.

Your output must be exhaustive. A casual reader skimming any file
should be able to fully understand what that tool does + how it works
internally + how to replicate it on another platform.

If a Higgsfield tool's prompt template is a 2KB string with 50
inline parameters, COPY THE FULL STRING into the doc. Don't summarize.

---

## 7. Process / order of operations

Suggested execution order:

1. **Phase A (1 hour)** — Read all cloned repos. Update inventory
   from `cli/MODELS.md`, skills, SDK source.
2. **Phase B (30 min)** — Try GraphQL introspection + CLI `model list`.
   If either works, you've saved hours.
3. **Phase C (2 hours)** — Mine `__NEXT_DATA__` on every page in
   section 5.2. This is your highest-yield technique.
4. **Phase D (3 hours)** — Download + grep compiled JS chunks. This
   is the goldmine for app-specific prompt templates.
5. **Phase E (2 hours)** — Picker DOM scrape for every catalog in
   section 5.8.
6. **Phase F (30 min)** — Capture picker GET endpoints from Network
   panel for any catalog still incomplete.
7. **Phase G (1 hour)** — Write up. Per-tool MD files. Catalogs.
   Helpers. Filters. Pricing. Gaps.
8. **Phase H (15 min)** — Final review pass. Cross-link inventory ↔
   per-tool files ↔ catalogs. Fill gaps doc.

Total budget: ~10 hours. If you hit dead-ends earlier, document and
move on — don't burn time on a stuck technique.

---

## 8. Hard rules / safety

- **No paid generations.** Period. If a button has "X credits" next
  to it, don't click it.
- **No payment / subscription / signup actions** on the user's
  Higgsfield account.
- **No state-changing API calls.** Only GET. POST only when
  explicitly listed as a free GraphQL introspection or model-schema
  query.
- **Don't create / update / delete** anything in the user's
  Higgsfield workspace (no creating Soul IDs, no uploading test
  images via their UI's upload widget if the upload itself charges,
  no commenting, no liking, no following).
- **Respect rate limits.** If you start getting 429s, slow down
  (wait 60s+, fewer parallel requests).
- **Credentials / secrets:** never log, commit, or expose API keys.
  If you see them in the user's `.env` files, treat as private.
- **Working files** go in `H:/Projects/takamul ai/.tmp-hf-research/`
  (gitignored). Final docs go in `docs/higgsfield-research/` and
  ARE committed.

---

## 9. Final deliverable summary

When done, write a single summary message to the user covering:

1. **Tools fully documented** (count + completeness % per tool).
2. **Catalogs extracted** (e.g., "Hooks: 23/23, Settings: 18/20,
   Soul styles: 87/100").
3. **Helpers documented** (which AI helpers were found + their system
   prompts if extractable).
4. **Gaps** — concise list of what's missing and why.
5. **Critical findings** — anything surprising that affects Yilow's
   roadmap (e.g., "Higgsfield's Plushies app is just nano-banana-flash
   with prompt prefix `Transform into a soft plushie toy with...`").
6. **Recommended next steps** for the Yilow team based on what was
   discovered.

The user will use your output to upgrade Yilow's tool implementations
to match Higgsfield's behavior 1:1. Be exhaustive. Be precise.
Cite sources for every claim.

---

## 10. Tone

Write everything in a mix of Arabic (overall narrative + headings
where natural) and English (technical terms, code, exact prompt
strings, API field names). Match the existing audit doc style at
`docs/HIGGSFIELD_FULL_COMPARISON.md` — that's the house style.

Use markdown extensively: tables, code blocks (with language tags),
headings, bullets, blockquotes. No emojis except where the source
material uses them (e.g., 🔥 PRO badges in Higgsfield's UI).

---

**End of brief. Begin with Phase A.**
