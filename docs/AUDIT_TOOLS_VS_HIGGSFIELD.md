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
3. ⏳ Soul Studio + soul-cinema + soul-cast + soul-location (soul batch — iter 3)
4. ⏳ Cinema Studio + cinema-cast + cinema-location + cinema-3d (cinema batch — iter 4)
5. ⏳ Marketing Studio (image + video) (iter 5)
6. ⏳ AI Influencer Studio (iter 6)
7. ⏳ Product Photoshoot Studio + Marketplace Cards Studio (iter 7)
8. ⏳ Edit Canvas + viral-effect tools sampled by family (iter 8-10)
9. ⏳ Audio tools (tts, music-create, music-remix, transcribe, lipsync, dubbing, voice-change, voice-clone) (iter 11)
10. ⏳ Specialty tools (Virality Predictor, Storyboard Extractor, Breakdown, Similarity Score) (iter 12)
11. ⏳ All viral effects (Tier 1-7 — sampled) (iter 13-15)

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
| Media | `image` (image or video) → `video_url` ALWAYS | image-input models need `image_url`; video-input models need `video_url` | 🔴 broken for image uploads |
| Audio | `audio` → `audio_url` | ✓ | ✅ |
| Speech text | `speech` → `text` | LipSync models don't accept text — they need pre-synthed audio | 🔴 not wired through TTS |
| Model | dropdown of 7 | per-endpoint | ✅ |
| Duration | UI field, auto-passes as `duration` | only some models accept | 🟡 |
| Resolution | UI field, auto-passes as `resolution` | per-model | 🟡 |

---

_This document is appended to on every `/loop` iteration of the audit task._
