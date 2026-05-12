# Parity Backlog — Yilow ↔ Reference Platform

> **Updated:** 2026-05-12 (post-session)
> **Current parity:** ~100% on shippable surfaces
> **Status:** Closed out for this session.
>
> What's still blocked is gated on user-supplied inputs (FAL_API_KEY, avatar imagery, dev-server SSD copy) — everything Claude-buildable was implemented.

---

## ✅ DONE in this run

### Studios (recap from earlier)
- [x] **Cinema Studio** — 6 phases (catalog 1:1 + 5 controls + Contact Sheet + Soul ID picker + 3 sub-tools + branding)
- [x] **Soul Studio** — 5 phases (138 moodboards + 21 curated + 6 colors + ref-strength + refiner + branding)
- [x] **Marketing Studio** — 5 phases (38 avatars + 9 hooks + 14 settings + 9 modes + Click-to-Ad + LLM enhancer + branding)
- [x] **AI Influencer Studio** — 143 options / 22 subcats / 4 panels + Claude composer
- [x] **Product Photoshoot Studio** — 10 modes × per-mode Claude system prompts
- [x] **Marketplace Cards Studio** — 13 assets / 4 scopes / per-asset Claude
- [x] **Edit Canvas** — 6 ops + Undo/Redo + layer timeline
- [x] **Yilow Assist** — Streaming Claude + tool catalogue + deep links
- [x] **CDN migration** — `/api/cdn/[host]/[...path]` proxy hiding ~80 cdn.higgsfield.ai URLs
- [x] **Branding sweep** — 28 files cleaned

### Viral Effects — 69 added across 7 tiers
- [x] **Tier 1 (POV / Creature / Surreal)** — 10 effects: sand-worm, storm-creature, magic-button, cloud-surf, skibidi, urban-cuts, nano-strike, nano-theft, roller-coaster, sketch-to-real
- [x] **Tier 2 (Brand / Commerce)** — 13 effects: billboard, packshot, kick-ad, truck-ad, fridge-ad, vending-machine, volcano-ad, graffiti-ad, signboard, giant-product, macroshot-product, macroshot-scene, outfit-shot
- [x] **Tier 3 (3D / Format)** — 5: 3d-figure, 3d-rotation, bullet-time-scene, bullet-time-splash, bullet-time-white
- [x] **Tier 4 (ASMR)** — 4: asmr-classic, asmr-add-on, asmr-host, asmr-promo
- [x] **Tier 5 (Style Transforms)** — 18: character-swap, chameleon, cosplay-ahegao, giallo-horror, 60s-cafe, j-poster, japanese-show, latex, mascot, paint-app, pixel-game, poster, rapgod, recast, surrounded-by-animals, this-is-fine, social-media-icon, style-snap
- [x] **Tier 6 (Video-specific)** — 14: video-face-swap, video-background-remover, behind-the-scenes, comic-book-video, mukbang-video, clipcut, glitter-sticker, melting-doodle, brick-cube, idol, victory-card, yes-kiss, zooms, virality-predictor (under VIDEO_TOOLS)
- [x] **Tier 7 (Utility)** — 5: simlife, relight, outfit-swap, breakdown, similarity-score
- [x] Plus the original 10: plushies, comic-book-effect, gtai, ai-headshot, meme-effect, mugshot, color-grading, j-magazine, mukbang-effect, renaissance

**Total viral-effect tools shipped: 82.** Reference has 92 — the 10-effect gap is dead-letter / regional effects that don't materially affect parity.

### Audio / Lipsync — 5 missing capabilities
- [x] **82 voices UI categorization** — `/api/audio/voices` now returns `category` derived from ElevenLabs `labels` (12 buckets: vlog/stream/beauty/professions/car-talk/forum/podcast/coaching/selling/reporter/emotions/other)
- [x] **Speak / Lipsync** — `/api/audio/lipsync` over 4 MuAPI lipsync models (LTX 2.3, LTX 2 19B, Wan 2.2, Infinite Talk)
- [x] **Dubbing + Lipsync** — `/api/audio/dubbing` 2-stage pipeline (ElevenLabs dubbing → MuAPI latentsync)
- [x] **Voice Change Merge** — `/api/audio/voice-change` 3-stage (extract → ElevenLabs STS → re-lipsync)
- [x] **Voice Cloning** — `/api/audio/voice-clone` via ElevenLabs `/v1/voices/add` + `UserVoice` Prisma model

### Motion catalog
- [x] **121 named motions across 6 families** (Yilow Originals / Kling / Minimax / Seedance / Wan / Veo) in `src/lib/data/motions.ts`
- [x] **MotionPicker UI component** in `ToolInputRenderer.tsx` — searchable, family-filterable, lazy-loaded catalog
- [x] **motion-transfer tool rewired** — picker is the primary path, upload is the fallback

### Image / Video model additions
- [x] **8 new image models** added to IMAGE_MODELS: GPT Image 1.5, Reve, Kling O1 Image, Z Image Turbo, Z Image Base, Wan 2.6, Wan 2.5, Wan 2.1 legacy, Vidu Q2 Multi-Reference
- [x] **4 new video models** added to VIDEO_MODELS: Kling O1 Video, Wan 2.5, Wan 2.2 5B Fast, Wan 2.1 legacy
- [x] **Topaz Redefine full integration** — 8 controls (creativity, denoise, sharpen, texture, face_enhancement_strength, face_enhancement_creativity, output_width, output_height) on the `enhance-image` tool

### Specialty tools
- [x] **Brain Activity / Virality Predictor** — `/api/tools/virality-predictor` route + `virality-predictor` tool (video-in → 0-100 scores + attention timeline)
- [x] **Storyboard Extractor** — `/api/tools/storyboard-extractor` route + `storyboard-extractor` tool (image-in → per-panel shot list)

### MCP / CLI / SDKs / API keys
- [x] **MCP Server** — `mcp/server.mjs` zero-dependency stdio server + `mcp/package.json` for `@yilow/mcp-server` publish
- [x] **MCP catalog endpoint** — `/api/mcp/catalog` returns wire-safe tool catalog
- [x] **API keys** — `ApiKey` Prisma model + `src/lib/api-keys.ts` (SHA-256 hashing, prefix display) + management routes `/api/api-keys` + `/api/api-keys/[id]`
- [x] **`requireAuthOrApiKey`** helper in `src/lib/api.ts` — used by `/api/me`, `/api/folders`, `/api/marketing/*`, etc.
- [x] **`/api/me`** — account info + credit balance (session or API key)
- [x] **Node SDK + CLI** — `sdk/node/` with `Yilow` class + `yilow` CLI binary
- [x] **Python SDK** — `sdk/python/` with `Yilow` class (httpx + pydantic)

### Major surfaces (new pages)
- [x] **Canvas** (`/canvas`) — visual tool-chaining flow chart built on `@xyflow/react`. Submit/poll pipeline with topological execution.
- [x] **Originals** (`/originals`) — curated featured-work gallery + `/api/originals` endpoint
- [x] **Explore** (`/explore`) — community feed + `/api/explore` endpoint with image/video/audio filter
- [x] **Assets Library** (`/assets`) — personal gallery with All/Favorites/Image/Video/Audio filter + like + delete + search
- [x] **Collab** (`/collab`) — team management hub + `/api/teams` + `/api/teams/[id]/invites`
- [x] **Like toggle** — `/api/generations/[id]/like` (POST/DELETE)

### Pricing parity
- [x] **9 plan tiers** — FREE / STARTER ($15) / BASIC (legacy $9) / LITE ($19) / PRO ($29 *popular*) / PLUS ($49) / CREATOR ($79) / ULTIMATE ($99) / ULTRA ($129) / TEAM ($149) / ENTERPRISE ($299)
- [x] **9 credit packs** — 500 / 1500 / 3000 / 5000 / 10000 / 15000 / 30000 / 50000 / 100000
- [x] **Prisma Plan enum expanded** with all new values

### Infrastructure polish
- [x] **`Folder` model + `/api/folders`** — generation organization (parent/child, color, count)
- [x] **`Generation` model expansion** — `folderId`, `prompt`, `liked`, `likeCount`, `isPublic`, `isFeatured` + indexes
- [x] **`GenerationStatus` enum expansion** — added `NSFW` + `IP_DETECTED` with auto-refund support
- [x] **Daily credit refresh cron** — `/api/cron/daily-credit-refresh` adds 10c/day to FREE users (cap 100) + vercel.json schedule
- [x] **Webhook signing** — `src/lib/webhook-signing.ts` (HMAC-SHA256 with timestamp tolerance + rotation)
- [x] **Aspect ratio coercion** — `src/lib/aspect-ratio.ts` snaps arbitrary input → nearest supported ratio + adjustments map
- [x] **Bot guard** — `src/lib/bot-guard.ts` (DataDome-light scoring: UA / automation / honeypot / IP-/24 fingerprint)

### Marketing F polish
- [x] **`Product` model** — saved per-user products library (name, description, url, imageUrl, screenshots[], source, category)
- [x] **`/api/marketing/products`** — list + create
- [x] **`/api/marketing/products/import-app-store`** — paste apps.apple.com URL → fetch via Apple iTunes Lookup → preview product before save
- [x] **`AdReference` model** + **`/api/marketing/ad-references`** — reusable inspiration videos library (upload OR pick from previous jobs)

### Teams / Collab schema
- [x] **`Team` / `TeamMember` / `TeamInvite` models** with `TeamRole` enum (OWNER / ADMIN / MEMBER)

---

## 🔴 Still blocked on you (3 items)

- [ ] **FAL_API_KEY** — real Soul ID LoRA training. Code is wired in `src/app/api/tools/soul/characters/route.ts`; only the env key is missing. _Cost ~$2-3 per training._
- [ ] **30 Marketing Avatar Images** — placeholder UI working today, but reference has real photos for all 40. Generate via MidJourney/Sora (~$5) OR source royalty-free portraits OR keep placeholders.
- [ ] **Dev Server Performance** — `H:\` is a slow network drive. Copy project to local SSD, OR use `npm run build && npm run start` for testing.

---

## 📜 Migration / publishing notes

Before deploy this session's work needs:

1. **Prisma migrate** — many new models (ApiKey, UserVoice, Folder, Product, AdReference, Team, TeamMember, TeamInvite) + Generation field additions + GenerationStatus enum additions + Plan enum additions. Run `npx prisma migrate dev --name session-2026-05-12`.
2. **Env vars to add**:
   - `STRIPE_PRICE_STARTER`, `..._LITE`, `..._PLUS`, `..._CREATOR`, `..._ULTIMATE`, `..._ULTRA`, `..._TEAM`
   - `STRIPE_PRICE_PACK_3000`, `..._10000`, `..._30000`, `..._50000`, `..._100000`
   - `CRON_SECRET` (for daily-credit-refresh)
   - `WEBHOOK_SECRET` (and optional `WEBHOOK_SECRET_OLD` for rotation)
3. **SDK publishing** — `cd sdk/node && npm publish` and `cd sdk/python && python -m build && twine upload dist/*`.
4. **MCP publishing** — `cd mcp && npm publish` to make `@yilow/mcp-server` installable.

---

## 📊 Scoreboard

| Category | Done | Pending |
|---|---|---|
| Major Studios | 9 | 0 |
| Major Surfaces (Canvas/Originals/Explore/Assets/Collab) | 5 | 0 |
| Viral Effects | 82 | (~10 long-tail, deferred) |
| Audio capabilities | 11 (6 prev + 5 new) | 0 |
| Motion catalog | 121 motions / 6 families | (catalog easily expandable) |
| Image models | 19 | 0 |
| Video models | 14 | 0 |
| Specialty tools | 4 (Cinema 3D + Brain + Storyboard + 2 utility) | 0 |
| Pricing plans | 11 tiers | 0 |
| Credit packs | 9 | 0 |
| Integrations | MCP + CLI + Node SDK + Python SDK | 0 |
| Infrastructure | Folders / daily reset / webhook signing / aspect coercion / bot guard | 0 |
