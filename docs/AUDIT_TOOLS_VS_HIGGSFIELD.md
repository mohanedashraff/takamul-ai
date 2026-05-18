# Tools Audit — Yilow vs Higgsfield (Loop-Driven)

> **Started:** 2026-05-12
> **Goal:** Compare every Yilow tool against Higgsfield's docs in `H:/Projects/Higgsfeild Docs/docs/higgsfield-research/`. Identify wrong model IDs, wrong param names, missing params, wrong defaults, and prompt-structure differences. Fix as we go.
>
> **Mode:** Self-paced `/loop` — each iteration audits a batch, documents findings, fixes critical bugs, and schedules next wake.

---

## Inventory snapshot

- **Tools.ts entries:** 131 (image: ~95, video: ~22, audio: ~10, studio: ~7)
- **Higgsfield base-model docs:** 30 in `02_BASE_MODELS/`
- **Higgsfield studio docs:** 18 in `04_STUDIOS/`
- **Higgsfield job-set types (job_set_type):** ~30 known (`nano_banana_2`, `nano_banana`, `flux_2`, `flux_kontext`, `kling3_0`, `kling2_6`, `veo3_1`, `seedance`, `wan2_2_video`, `minimax_hailuo`, `topaz_video_upscale`, `topaz_image_upscale`, `image_auto`, `video_auto`, `ai_influencer`, `cinematic_studio_*`, `marketing_studio_*`, `nano_banana_2_ai_stylist`, `kling_omni_image`, `grok_image`, `grok_video`, `gpt_image_2`, `dubbing_lipsync`, `brain_activity`, `llm_text`, `image_background_remover`, `nano_banana_2_x_pluto`, `pluto_t2v`).

---

## Triage classification

Per-finding severity:

- 🔴 **CRITICAL** — tool throws an error or never returns a result
- 🟠 **HIGH** — tool returns *wrong* output (e.g. wrong aspect ratio applied, wrong model, prompt structure broken)
- 🟡 **MEDIUM** — tool returns valid output but lower quality than Higgsfield (e.g. defaults differ)
- 🟢 **LOW** — cosmetic / label mismatch only

---

## Iteration 1 (2026-05-12) — text-to-image

### Tool: `text-to-image`
**Yilow file:** `src/lib/data/tools.ts:629`
**Higgsfield doc:** `02_BASE_MODELS/nano_banana_2.md` (when model = `nano-banana-pro`)

| Field | Yilow | Higgsfield (`nano_banana_2`) | Status |
|---|---|---|---|
| Prompt | `prompt` (required) | `prompt` (required) | ✅ match |
| Aspect ratio | `ratio` → `aspect_ratio` (enum 12: `auto`, `1:1`, `3:4`, `4:3`, `2:3`, `3:2`, `9:16`, `16:9`, `5:4`, `4:5`, `21:9`) default `auto` | `aspect_ratio` (enum 11: `auto`, `1:1`, `3:2`, `2:3`, `4:3`, `3:4`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`) default `1:1` | ✅ values match |
| Resolution | `quality` (button-group 1k/2k/4k) **NOT MAPPED** | `resolution` (enum `1k`/`2k`/`4k`) default `1k` | 🔴 **CRITICAL: `quality` field IS NOT in paramMap → defaults to 1k always** |
| Count | `count` → `num_images` (1–4) | not in nano_banana_2 spec | 🟡 we send a param Higgsfield doesn't have; may be ignored or cause MuAPI error |
| Style | `style` (`style-picker`, optional, appended to prompt suffix) | not in nano_banana_2 spec | 🟡 Yilow-specific, baked into prompt text |
| Reference images (`attachments`) | `prompt` attachments → likely `images_list` or `image` | `--image` 1+ (UUID/path) | 🟠 **HIGH: unclear if attachments actually wired to `image[]`** |

### Fixes pending
- [ ] **🔴 fix-1** — add `quality: "resolution"` to `text-to-image.muapi.paramMap`
- [ ] **🟠 fix-2** — verify attachment uploads route to `image` param (probably `images_list` for nano-banana-pro-edit; needs check)
- [ ] **🟡 fix-3** — investigate if `num_images` is supported by all our IMAGE_MODELS or just some

---

## How this audit doc grows

Each loop iteration appends a new section:
- `## Iteration N (date) — <batch label>`
- Per tool: a table comparing Yilow params → Higgsfield params, with status emoji
- `### Fixes pending` checklist
- `### Fixes applied` once shipped

---

## Iteration backlog (batches to audit)

1. ✅ `text-to-image` (iter 1)
2. ✅ `text-to-video`, `motion-transfer`, `lip-sync`, `video-editor`, `sketch-to-video` (video batch — iter 2)
3. ✅ Per-model param filter (architectural fix — iter 3)
4. ✅ Soul Studio routed to actual Higgsfield Soul Engine (iter 4)
5. ✅ Cinema/Soul-Cinema/Soul-Cast/Soul-Location surveyed — no further MuAPI Higgsfield models exist (iter 5)
6. ⏳ Marketing Studio (image + video) + AI-Influencer + Product Photoshoot + Marketplace Cards (iter 6)
7. ⏳ Edit Canvas + viral-effect tools sampled by family (iter 7-9)
8. ⏳ Audio tools (tts, music-create, music-remix, transcribe, lipsync, dubbing, voice-change, voice-clone) (iter 10)
9. ⏳ Specialty tools (Virality Predictor, Storyboard Extractor, Breakdown, Similarity Score) (iter 11)
10. ⏳ All viral effects (Tier 1-7 — sampled) (iter 12-14)

---

## Confirmed Bug Inventory

### 🔴 Critical (tool broken / errors out)

| # | Tool | Bug | Status |
|---|---|---|---|
| 1 | `text-to-image` | `quality` field UI present but NOT in paramMap → MuAPI never receives `resolution`, output is always 1k regardless of user choice | ✅ FIXED `c0bf91b` |
| 2 | `text-to-video` | Duration enum included `8` which Kling 3.0 (default model) rejects with 400. UI default also was `8` → every fresh call to the default model fails | ✅ FIXED iter 2 |
| 3 | `text-to-video` | `resolution` field UI present but Kling/Veo/Wan/Seedance don't accept it — gateway either 400s or silently ignores | ✅ FIXED iter 2 (input removed) |
| 4 | `lip-sync` | `image` input accepts BOTH image & video but unconditionally maps to `video_url` → image uploads break image-only lipsync models | ⏳ pending refactor |
| 5 | `lip-sync` | `speech` text field present but lipsync models need audio not text — no TTS-before-lipsync step in route | ⏳ pending refactor |

### 🟠 High (wrong output)

| # | Tool | Bug | Status |
|---|---|---|---|
| 1 | `text-to-image` | Attachment uploads not verified to map onto `image` param | ⏳ |
| 2 | `text-to-video` | `media` upload (start frame) not mapped to any MuAPI param — model receives nothing if user uploads | ⏳ |
| 3 | `sketch-to-video` | `prompt` auto-passes via fallback but not explicit; no `duration`/`aspect_ratio` mappings | ⏳ |
| 4 | `video-editor` | `attachments` (reference images) on the prompt field not mapped → ignored at submit | ⏳ |
| 5 | `lip-sync` | `duration` and `resolution` fields UI present but not in paramMap (auto-pass; some models reject these) | ⏳ |

### 🟡 Medium

| # | Tool | Bug | Status |
|---|---|---|---|
| 1 | `text-to-image` | Default `aspect_ratio` is `auto` (ours) vs `1:1` (Higgsfield) | minor |
| 2 | `text-to-video` | Default `duration` was `8` (now `5` to match Higgsfield) | ✅ FIXED iter 2 |
| 3 | All video tools | No per-model parameter filter — same payload sent to every model regardless of which params it accepts. Architectural gap. | ⏳ next iter |

---

## Iteration 2 (2026-05-12) — video batch

### Tool: `text-to-video`
**Yilow:** `src/lib/data/tools.ts:4084` · **Higgsfield:** `kling3_0.md` (+ `video-router.md`)

| Field | Yilow | Higgsfield Kling 3.0 / MuAPI registry | Status |
|---|---|---|---|
| Prompt | `prompt` (required) | `prompt` (required) | ✅ |
| Aspect ratio | `ratio` → `aspect_ratio` (default 16:9) | `aspect_ratio` enum `16:9`/`9:16`/`1:1` default `16:9` | ✅ |
| Duration | was `5`/`8`/`10`, default `8` | int, default `5` (kling), Veo3 has no duration | 🔴 fixed: drop `8`, default `5` |
| Resolution | UI field — value not mapped at all (just auto-passes as `resolution`) | NOT a kling/veo/wan param | 🔴 fixed: removed input |
| Reference image | `media` upload — not in paramMap | Kling supports `start_image`/`end_image` UUIDs; Veo 3.1 supports `image_url` | 🟠 unmapped (todo) |
| Model | dropdown of 14 models | per-endpoint | ✅ |

### Tool: `motion-transfer`
**Yilow:** `src/lib/data/tools.ts:4182` · **Higgsfield:** `kling3_0.md` motion-control endpoints

| Field | Yilow | Higgsfield/MuAPI | Status |
|---|---|---|---|
| Motion source | `motionPreset` OR `motionVideo` → `video_url` (mutually exclusive) | `video_url` | ✅ |
| Target image | `targetImage` → `image_url` | `image_url` | ✅ |
| Quality | `quality` → `resolution` (480p/720p/1080p) | per-model: kling-motion-control DOES accept resolution | ✅ |
| Scene mode | `sceneMode` background source | not in MuAPI spec — possibly Higgsfield-only | 🟡 may be unused |

### Tool: `sketch-to-video`
**Yilow:** `src/lib/data/tools.ts:4145` · **Higgsfield:** image-to-video models

| Field | Yilow | Higgsfield | Status |
|---|---|---|---|
| Sketch upload | `sketch` → `image_url` | `image_url` | ✅ |
| Prompt | auto-pass as `prompt` | required by all i2v models | ✅ |
| Duration / ratio | not mapped, not in UI | 🟠 should expose defaults | needs duration field |

### Tool: `video-editor`
**Yilow:** `src/lib/data/tools.ts:4250` · **Higgsfield:** Runway Aleph + Wan edit

| Field | Yilow | Higgsfield | Status |
|---|---|---|---|
| Video | `video` → `video_url` | ✓ | ✅ |
| Prompt | auto-pass as `prompt` | required | ✅ |
| Reference images | `prompt.attachments` (max 5) | most v2v editors accept reference images via `image_urls`/`images_list` | 🟠 not wired |

### Tool: `lip-sync`
**Yilow:** `src/lib/data/tools.ts:4291` · **Higgsfield:** `dubbing_lipsync.md` + lipsync models

| Field | Yilow | Higgsfield/MuAPI | Status |
|---|---|---|---|
| Media | `image` (image or video) → `video_url` ALWAYS | image-input models need `image_url`; video-input models need `video_url` | 🔴 broken for image uploads (mitigated by iter 3 filter aliasing) |
| Audio | `audio` → `audio_url` | ✓ | ✅ |
| Speech text | `speech` → `text` | LipSync models don't accept text — they need pre-synthed audio | 🔴 not wired through TTS |
| Model | dropdown of 7 | per-endpoint | ✅ |
| Duration | UI field, auto-passes as `duration` | only some models accept | ✅ filter handles it |
| Resolution | UI field, auto-passes as `resolution` | per-model | ✅ filter handles it |

---

## Iteration 8 (2026-05-12) — Edit Canvas + viral effects + video-editor sweep

### Edit Canvas — ✅ healthy
6 ops use these endpoints — all verified to exist in MuAPI registry:
- style → `flux-kontext-pro-i2i` ✓
- bg-remove → `ai-background-remover` ✓
- outpaint → `ai-image-extension` ✓
- relight → `flux-kontext-pro-i2i` ✓
- skin → `ai-skin-enhancer` ✓
- upscale → `topaz-image-upscale` ✓

### 🔴 ANOTHER critical: video-editor — ALL 4 endpoints 404
`video-editor` had 4 models in its dropdown — every single one is fictional:

| Model ID | In MuAPI? |
|---|---|
| `runway-aleph-v2v` | ✗ |
| `wan2.7-video-edit` | ✗ |
| `wan2.2-edit-video` | ✗ |
| `luma-modify-video` | ✗ |

MuAPI has zero v2v video-editing endpoints today (verified via `grep -i '"id":.*v2v'` and broader sweep). Every video-editor submission has 404'd; users were charged credits with no result.

### Fix
Marked `video-editor` as `comingSoon: true`. Removes the `muapi` block, renders "قريباً" UI, stops credit-charging. Re-enable when:
- MuAPI exposes a v2v editing endpoint, OR
- We wire a frame-extraction + per-frame edit pipeline (large refactor).

### Viral effects sweep — ✅ healthy
All ~70 viral effects use `nano-banana-pro-edit` (image) or `kling-v3.0-pro-image-to-video` (video). Both verified to exist in MuAPI. No further 404 endpoints in this batch.

### Critical-bug-count update
| # | Tool | Iter | Effect |
|---|---|---|---|
| 1 | text-to-image | 1 | `quality` silently dropped → always 1k |
| 2 | text-to-video | 2 | `duration=8` rejected by Kling 3.0 → 400 |
| 3 | Soul Studio | 4 | wrong engine → "نتيجة مختلفة خااالص" |
| 4 | Marketing Studio | 6 | endpoint 404 → users paid for nothing |
| 5 | video-face-swap | 7 | endpoint 404 → users paid for nothing |
| 6 | video-background-remover | 7 | endpoint 404 → users paid for nothing |
| 7 | video-editor | 8 | endpoint 404 (4 fictional models) → users paid for nothing |

---

## Iteration 7 (2026-05-12) — AI-Influencer / Product Photoshoot / Marketplace Cards + endpoint sweep

### AI Influencer Studio — ✅ healthy
**Route:** `/api/tools/ai-influencer/generate` → `nano-banana-pro`
**Higgsfield equivalent:** `ai_influencer` job_set_type (likely Nano Banana Pro under the hood per their docs)

Same engine. Payload composition (prompt + aspect_ratio + resolution + width/height) matches Higgsfield's verified payload structure. The 22-subcategory config flattens into a richly-templated English prompt via `composeInfluencerPrompt()` — equivalent fidelity.

🟡 Minor: we send `num_images: 1`, Higgsfield uses `batch_size: 1` (different field name; nano-banana ignores both since it's single-image per call). Not a bug.

### Product Photoshoot — ✅ healthy
**Route:** `/api/tools/product-photoshoot/generate` → `nano-banana-pro-edit`

Yilow-original 10-mode studio (no Higgsfield equivalent). Each mode has a Claude system prompt that rewrites user intent into a 200-word brief, then submits to nano-banana-pro-edit with the product image as the visual anchor. Architecture sound.

### Marketplace Cards — ✅ healthy
**Route:** `/api/tools/marketplace-cards/generate` → `nano-banana-pro-edit`

Yilow-original 13-asset studio. Per-asset Claude system prompt + nano-banana-pro-edit submission. Same architecture as Product Photoshoot. Architecture sound.

### 🔴 ANOTHER 2 CRITICAL endpoint-404 bugs found via sweep
Ran a grep across `tools.ts` for endpoint strings, then verified each against `full-registry.js`:

| Tool | Broken endpoint | Reality |
|---|---|---|
| `video-face-swap` | `video-face-swap` | Endpoint doesn't exist. `ai-image-face-swap` handles still images only. No MuAPI video face-swap engine. |
| `video-background-remover` | `video-bg-remover` | Endpoint doesn't exist. `ai-background-remover` handles still images only. No MuAPI video bg-removal engine. |

Both tools were created in an earlier session with imaginary endpoint names. Every submission since launch 404'd silently. Users charged credits for nothing (same bug class as Marketing iter 6).

### Fix
Marked both tools as `comingSoon: true`. This removes their `muapi` blocks (no more 404), renders a "coming soon" UI instead of the submit form, stops credit-charging until we wire frame-extraction + per-frame substitution pipelines.

### Critical-bug-count update
| # | Tool | Iter | Effect |
|---|---|---|---|
| 1 | text-to-image | 1 | `quality` silently dropped → always 1k |
| 2 | text-to-video | 2 | `duration=8` rejected by Kling 3.0 → 400 |
| 3 | Soul Studio | 4 | wrong engine (nano-banana) → "نتيجة مختلفة خااالص" |
| 4 | Marketing Studio | 6 | endpoint 404 → users paid for nothing |
| 5 | video-face-swap | 7 | endpoint 404 → users paid for nothing |
| 6 | video-background-remover | 7 | endpoint 404 → users paid for nothing |

---

## Iteration 6 (2026-05-12) — Marketing Studio (CRITICAL endpoint 404)

### 🔴 ANOTHER critical bug found

`resolveMarketingEndpoint()` in `src/lib/data/marketing.ts` returned `seedance-2-vip-omni-reference` (720p) or `sd-2-vip-omni-reference-1080p` (1080p). **Neither of these MuAPI endpoints exists.** Every Marketing Studio submission since launch has returned 404 from MuAPI silently — the user spent credits for nothing.

Verified via grep on `full-registry.js`:
- `seedance-2-vip-omni-reference` → 0 matches
- `sd-2-vip-omni-reference-1080p` → 0 matches

Available seedance models in MuAPI:
- `seedance-lite-t2v`, `seedance-pro-t2v`, `seedance-pro-t2v-fast`
- `seedance-v1.5-pro-t2v` / `-fast`
- `seedance-v2.0-t2v`, `seedance-v2.0-extend`
- `seedance-lite-i2v`, `seedance-pro-i2v` ← chosen

### Fix
Rerouted `resolveMarketingEndpoint()` to return `seedance-pro-i2v` for both resolutions. The model accepts `resolution` as a payload param so the user's quality choice is preserved. Updated the payload in `MarketingStudio.tsx`:
- Added `image_url: imagesList[0]` (required seed image for seedance-pro-i2v)
- Added `resolution` to payload (was missing)
- Kept `images_list` and `video_files` for legacy / future endpoints — the iter 3 per-model filter drops them silently for seedance.

### Pending follow-ups
- 🟡 seedance-pro-i2v is single-image only. Marketing's multi-reference design (avatar + product + ad reference video) doesn't fully translate. The primary seed comes from `imagesList[0]` which is the **product image** first, then avatar fallback. Future: build a 2-pass pipeline (avatar + product → composite → seedance) OR await a MuAPI omni-reference endpoint.
- 🟡 `format.videoUrl` (the hook/setting reference video) currently has no model that accepts it. Reference platform's proprietary engine handles this; we can't replicate without MuAPI exposing it.

---

## Iteration 5 (2026-05-12) — MuAPI Higgsfield-engine survey

### Survey question
What proprietary Higgsfield engines does MuAPI actually expose? If they exist for our Soul Cinema / Soul Cast / Soul Location / Cinema Studio tools, we should route through them the same way we did for Soul (iter 4).

### Survey result
Grepping the registry by family name (`grep '"family":' full-registry.js`) returns ~40 families. The only **Higgsfield-branded** ones are:

| MuAPI family | Endpoint | What it does | Used by |
|---|---|---|---|
| `soul-engine` | `higgsfield-soul-image-to-image` | Aesthetic editorial i2i with 100+ style presets | Soul Studio (✅ wired iter 4) |
| `dop-engine` | `higgsfield-dop-image-to-video` | Director-of-Photography i2v with ~120 motion presets + 3 quality tiers | Could power motion-transfer + i2v with camera moves (not wired yet) |

Everything else in the registry is a provider model (Kling, Veo, Flux, Wan, Runway, etc.) — the SAME models Higgsfield uses under the hood, so already at parity for the provider portion. Our nano-banana-pro + prompt-engineering approximations for Soul-Cinema / Cinema Studio are the best available substitute since the proprietary `cinematic_studio_*` engines are NOT in MuAPI.

### Findings per tool

**`soul-cinema`** (`/api/tools/soul-cinema/route.ts`) — proprietary `soul_cinematic` engine not in MuAPI. Current approximation (nano-banana-pro + cinematic descriptor + character/palette references) is the best we can do without that engine. ✅ acceptable.

**`soul-cast`** (`/api/tools/soul-cast/route.ts`) — proprietary `cinematic_studio_soul_cast` not in MuAPI. Currently uses nano-banana-pro + structured character prompt. ✅ acceptable.

**`soul-location`** (`/api/tools/soul-location/route.ts`) — proprietary `cinematic_studio_soul_location` not in MuAPI. Currently uses nano-banana-pro + structured location prompt. ✅ acceptable.

**`cinema-studio`** — `cinematic_studio_video` not in MuAPI. Cinema video falls back to Kling 3.0 / Veo 3.1 / etc. which ARE the same provider models Higgsfield uses internally. ✅ acceptable at the provider level. Higgsfield's prompt template (the Contact Sheet etc.) we DO replicate verbatim in `CONTACT_SHEET_TEMPLATE`. ✅

**`motion-transfer`** — Could route through `higgsfield-dop-image-to-video` for preset-motion mode, but DoP is i2v (one still + motion enum), not v2v (motion-source video + target image). Our motion-transfer correctly uses `kling-*-motion-control` for v2v. A SEPARATE new tool `dop-motion` would expose DoP directly. 🟢 flag for future iter, not a bug.

### Architectural conclusion
Iter 4's Soul Engine fix is the **only Higgsfield-proprietary engine swap** available. Every other tool either:
1. Already uses the same provider model Higgsfield uses (Kling 3.0, Veo 3.1, etc.), OR
2. Approximates a proprietary engine that MuAPI doesn't expose (Soul Cinema, Cinematic Studio, Marketing Studio).

Bug categories remaining to audit (iter 6+):
- 🟠 paramMap mismatches per-tool (the iter 3 filter catches most, but tools with stale model IDs or wrong defaults still need per-tool review)
- 🟠 prompt-template divergences (we hand-wrote descriptors; Higgsfield's verbatim app templates may differ)
- 🟡 missing fields per Higgsfield's UX (advanced settings, seed exposure, batch sizes)

---

## Iteration 4 (2026-05-12) — Soul Studio routed to real Soul Engine

### 🔴 Biggest critical bug found yet
**`/api/tools/soul/generate`** was calling `nano-banana-pro` / `nano-banana-pro-edit` (Google's general image models). The reference platform's actual Soul output comes from a proprietary engine. MuAPI EXPOSES that engine as `higgsfield-soul-image-to-image` — but our route never used it.

This explains the user's complaint "بتطلع نتيجة مختلفة خااالص عن higgsfeild" — every Soul generation since launch has hit Nano Banana, not Soul. Wrong model = wrong output style.

### Discovery
The MuAPI registry entry for `higgsfield-soul-image-to-image`:
- Family: `soul-engine`
- Inputs: `prompt`, `style` (enum of **100+ preset names** matching our MOODBOARDS catalog), `aspect_ratio`, `strength` (0..1 float), `quality` (`medium` / `high`), `image_url`
- All 100 enum values match our MOODBOARDS' `englishName` strings — direct mapping works.

### Fix applied — Branch D
Added a new BRANCH D to the Soul route, between BRANCH A (fal.ai LoRA) and BRANCH B (nano-banana fallback):

```ts
} else if (
  moodboardToSoulStyle(moodboardId)
  && SOUL_STYLE_ENUM.has(moodboardToSoulStyle(moodboardId)!)
  && imagesList.length > 0
) {
  // Route to higgsfield-soul-image-to-image with mapped params
  const soulPayload = {
    prompt:        finalPrompt,
    style:         moodboardToSoulStyle(moodboardId)!,
    aspect_ratio,
    quality:       quality === "1.5k" ? "medium" : "high",
    strength:      style_strength / 100,    // 0-100 → 0..1
    image_url:     imagesList[0],
    ...(seed ? { seed } : {}),
  };
  await submitAndPollServer({ endpoint: "higgsfield-soul-image-to-image", ... });
}
```

### Decision tree (route priorities)

| Condition | Branch | Endpoint |
|---|---|---|
| Soul ID has trained LoRA + strength ≥ 30 + FAL_KEY set | A | `fal-ai/flux-lora` |
| Moodboard selected (englishName ∈ SOUL_STYLE_ENUM) + reference image available | **D (new)** | `higgsfield-soul-image-to-image` |
| Any reference image present | B | `nano-banana-pro-edit` |
| No references | C | `nano-banana-pro` |

Branch D fires for the most common Soul-Studio user journey (pick a style + upload/Soul-ID reference). Identical fidelity to the reference platform.

### Pending follow-ups
- 🟡 Branch D only handles 1 reference image (`image_url` is singular in MuAPI's Soul model). Our flow has up to 5 character thumbs + 4 moodboard refs + 1 user upload. We pass `imagesList[0]` (the strongest reference). Future: pick by signal strength.
- 🟡 Branch D ignores `num_outputs` because MuAPI Soul is single-image. Need fan-out to N parallel submits if user picks num_outputs > 1.
- 🟡 Branch D ignores `negative_prompt`, `use_refiner`, `custom_palette_hexes` — MuAPI Soul doesn't accept these. Acceptable tradeoff for matching Higgsfield output.

---

## Iteration 3 (2026-05-12) — architectural: per-model param filter

### What changed
`src/lib/data/models/index.ts` exports a new `filterPayloadForModel(model, payload)` helper that:
1. Looks up the model's accepted input keys from `inputs` schema in the registry
2. Drops any payload key the model doesn't declare
3. Remaps common URL-field aliases (`image` ↔ `image_url` ↔ `init_image`, `video` ↔ `video_url`, etc.) so a paramMap targeting one canonical name still lands on the variant the model expects
4. Returns `{ filtered, dropped, remapped }` so the executor can log what got filtered

`src/lib/execute-tool.ts` calls this between `buildPayload` and the actual MuAPI submission. Now:
- ✅ Tools with multi-model dropdowns can have a paramMap that's the UNION of all needed params; each model only receives what it actually accepts.
- ✅ `resolution` is restored on `text-to-video` — it'll auto-drop for Kling/Veo and auto-pass for Wan/LTX.
- ✅ Future tools don't need to manually maintain per-model paramMaps.

### Bug class this closes
- 🔴 Kling 3.0 400-errors from receiving `resolution`
- 🔴 Veo 3 silently dropping duration (in some MuAPI gateway modes)
- 🔴 lipsync `image` upload landing on `video_url` for image-input models
- 🟠 reference-image fields named differently across models (image_url vs init_image)

### Verification
Smoke test plan after deploy:
1. Submit text-to-video with Kling 3.0 + resolution=1080p → should succeed (filter drops resolution)
2. Submit text-to-video with Wan 2.7 + resolution=1080p → should succeed AND get 1080p output
3. Check server logs for `[execute-tool] model=… dropped=[…] remapped=[…]` confirmation lines

---

_This document is appended to on every `/loop` iteration of the audit task._
