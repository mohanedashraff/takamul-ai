# Yilow ↔ Higgsfield — خطة الـ1000% Parity (المرجع النهائي)

> **تاريخ:** 2026-05-09
> **المصدر:** قراءة كاملة لـ `H:\Projects\Higgsfeild Docs\docs\higgsfield-research\` (1845 ملف، ~34MB) + `src/lib/data/tools.ts`.
> **الحالة:** 🔴 **لا تنفذ كود حتى يقول المستخدم "go".** هذا doc تخطيط فقط.
> **يحل محل:** `HIGGSFIELD_FULL_COMPARISON.md` و `HF_PHASE1_INVENTORY.md` (المعلومات هناك أقدم/ناقصة).

---

## 0) الخلاصة في 60 ثانية

Higgsfield ليست منتج واحد. هي **5 طبقات** متراكبة:

1. **52 backend job_set_type** (15 منهم لم يكن في الـCLI أبداً — اكتشفناهم من real job history).
2. **92 app** كلها wrappers رفيعة فوق نفس الموديلات (`nano_banana_2`, `flux_kontext`, `qwen_camera_control`...) لكن مع **prompt templates مخفية على الباك إند** + **preset_family slugs**.
3. **16 studio** (Cinema, Soul, Marketing, AI Influencer, Audio, Edit, Character, Assist, MCP, Canvas, Collab, Originals, Explore, Marketplace, Product Photoshoot, Image/Video Router) — كل واحد له UI مختلف.
4. **طبقة Claude Opus 4.7** اللي تكتب الـenhanced prompts: AI Director (Cinema), Marketing enhancer, Product Photoshoot enhancer (10 modes), Marketplace Cards enhancer (13 asset types), Soul/DoP enhancer, Storyboard extractor, Assist chatbot.
5. **كاتالوجات بيانات ضخمة:** 359 motions, 106 Soul styles, 6 color presets, 82 voices, 40 avatars, 9 hooks, 14 settings, 4 cameras × 6 lenses × 6 focal × 4 apertures × 6 genres = آلاف التركيبات.

**Yilow الحالي:** 37 أداة، 3 ستديوهات (Cinema/Soul/Marketing بشكل bespoke)، Edit Canvas مفقود، AI Director غير موجود، الكاتالوجات أصغر بكتير، ولا واحد من الـ92 app الـviral موجود.

**معدل الـparity الحالي:** ~25-30% من سطح Higgsfield الإجمالي.
**الفجوة:** ~70% من الميزات و90% من content depth (catalogs, presets, prompt templates).

---

## 1) الجرد الكامل لكل ما عند Higgsfield

### 1.1 الستديوهات (16)

| # | Studio | URL | الموديل/jst الأساسي | التعقيد | عندنا؟ |
|---|---|---|---|---|---|
| 1 | **Cinema Studio 3.5** | `/cinema-studio` | `cinematic_studio_video_3_5` + `cinematic_studio_image` + `cinematic_studio_image_grid` + `cinematic_studio_image_3d` + `cinematic_studio_soul_cast` + `cinematic_studio_soul_location` | عالي — 7 jst فرعية + AI Director (Claude Opus 4.7) + 4 cameras + 6 lenses + 6 focal + 4 apertures + 6 genres + color/lighting/moveset pickers | 🟡 bespoke `/cinema` لكن منقوص جداً |
| 2 | **Soul Studio** | `/ai/image?model=soul-v2` | `text2image_soul_v2` (+ 4 variants: soul_cinematic, soul_location, soul_cast) | عالي — 106 styles + 6 color presets + 21 curated + Soul ID custom training | 🟡 bespoke `/soul` لكن style catalog أصغر |
| 3 | **Marketing Studio** | `/marketing-studio/product` و `/app` | `marketing_studio_video` + `marketing_studio_image` | عالي — 9 modes + 9 hooks + 14 settings + 40 avatars + per-user products + LLM enhancer (Claude) | 🟡 bespoke `/marketing` بدون hooks/settings/avatars catalogs |
| 4 | **AI Influencer Studio** | `/ai-influencer-studio` | `ai_influencer` | عالي — 22 subcategories × 143 options (character builder) | ❌ **مفقود تماماً** |
| 5 | **Audio Studio** | `/audio` | `text2speech_v2` + `dubbing_lipsync` + `voice_change_merge` | متوسط — 82 voices + ElevenLabs/OpenAI providers | 🟡 عندنا TTS بس مفقود dubbing/voice_change_merge وlive voices catalog مش متربط بـSoul/Cast |
| 6 | **Edit Canvas** | `/edit` | `flux_kontext` + `nano_banana_2` + `image_background_remover` + `relight` + `skin-enhancer` + `outfit-swap` + `face-swap` | متوسط — canvas مع mask/paint/expand/restyle | 🟡 لدينا أدوات منفصلة (edit-image, bg-remover, relighting...) بس مش في canvas موحد |
| 7 | **Character Training (Soul ID)** | `/character` | `POST /v1/custom-references` (5-20 photo training) | عالي — LoRA training pipeline | ❌ **مفقود تماماً** — عندنا Soul "ID" يخزن 5 صور كـreferences فقط، مفيش training |
| 8 | **Product Photoshoot** | `higgsfield product-photoshoot` (CLI/Skill) | `gpt_image_2` + LLM enhancer | عالي — 10 modes (product_shot, lifestyle, closeup, moodboard, hero_banner, social_carousel, ad_creative_pack, virtual_model_tryout, conceptual_product, restyle) + variation logic | ❌ **مفقود تماماً** — عندنا `product-mockup` بس بدون 10 modes ولا brand voice ولا multi-variant coordination |
| 9 | **Marketplace Cards** | `higgsfield marketplace-cards` (CLI/Skill) | `nano_banana_2` + LLM enhancer | عالي — 4 scopes (main/product-images/aplus/full-set) × 13 asset types + Amazon compliance | ❌ **مفقود تماماً** |
| 10 | **Image Router** | `/image` | All 23 image models | منخفض — picker عام | 🟡 عندنا `text-to-image` بس بـ10 موديلات فقط |
| 11 | **Video Router** | `/video` | All video models + DoP + Speak | متوسط — picker بـ provider grouping (9 providers) + DoP motions | 🟡 عندنا `text-to-video` بـ10 فقط، مفقود grouping وmotions |
| 12 | **Assist Chatbot** | `/assist` | Claude Opus 4.7 + tool calling | عالي — function-calling LLM يـdispatch لكل أدوات Higgsfield | ❌ **مفقود تماماً** |
| 13 | **MCP & CLI** | `/mcp` | npm `@higgsfield/cli` + MCP server + Node SDK + Python SDK | عالي — 4 official agent skills | ❌ **مفقود تماماً** |
| 14 | **Canvas** (NEW) | `/canvas` | unknown — whiteboard pipeline | متوسط — flowchart-style chaining | ❌ **مفقود تماماً** |
| 15 | **Collab** | `/collab` | `fnf.../realtime/workspace` (websockets/SSE) | عالي — realtime team collaboration | ❌ **مفقود تماماً** (عندنا spaces بس مش realtime) |
| 16 | **Originals + Explore** | `/originals`, `/explore` | community feed + curated templates | متوسط | ❌ **مفقود تماماً** |
| (+) | **Assets Library** | `/asset/all` | per-user gallery (folders, projects, favorites) | متوسط | 🟡 عندنا spaces بشكل أبسط |

**Tally:** 6 ستديوهات مفقودة تماماً (#4, #7, #8, #9, #12, #13, #14, #15, #16), 6 موجودة بشكل ناقص (1, 2, 3, 5, 6, 10, 11), وستديو واحد مكافئ تقريباً (Assets Library = Spaces).

### 1.2 Backend job_set_types (52 verified)

#### 18 image base models
`nano_banana_2`, `nano_banana_flash`, `nano_banana`, `flux_2`, `flux_kontext`, `gpt_image_2`, `text2image_soul_v2`, `seedream_v4_5`, `seedream_v5_lite`, `grok_image`, `openai_hazel`, `image_auto`, `z_image`, `kling_omni_image`, `cinematic_studio_2_5`, `soul_cinematic`, `soul_location`, `marketing_studio_image`

#### 16 video base models
`seedance_2_0`, `seedance1_5`, `kling3_0`, `kling2_6`, `cinematic_studio_3_0`, `cinematic_studio_video_v2`, `cinematic_studio_video`, `veo3_1`, `veo3_1_lite`, `veo3`, `wan2_7`, `wan2_6`, `minimax_hailuo`, `grok_video`, `soul_cast`, `marketing_studio_video`

#### 4 specialty
`brain_activity` (Virality Predictor), `llm_text` (Claude Opus 4.7), `text2speech_v2` (ElevenLabs), `topaz_image_generative` (Topaz Redefine)

#### 17 NEW app-specific (لم تكن في public CLI — اكتشفناها من real jobs)
`qwen_camera_control` (Angles 2.0), `cinematic_studio_image_grid` (9-shot Contact Sheet), `nano_banana_2_shots`, `nano_banana_2_ai_stylist`, `nano_banana_2_upscale`, `next_shots` (What's Next?), `ai_influencer`, `cinematic_studio_image`, `cinematic_studio_image_3d`, `cinematic_studio_image_3d_recomposition`, `cinematic_studio_video_3_5`, `cinematic_studio_soul_cast`, `cinematic_studio_soul_location`, `dubbing_lipsync`, `voice_change_merge`, `image_background_remover`, plus extras visible only in localStorage caches.

### 1.3 الـ92 Apps (Apps Library)

كل app له:
- **CMS schema** على `cms.higgsfield.ai/applications/<slug>` (public)
- **`preset_family` slug** يربطه بـbackend template
- **Hidden prompt template** على الخلفية (لا يُفك إلا بعمل generation حقيقي)
- **Cost** ثابت per generation

**التصنيف الكامل (8 فئات حسب الكتالوج):**

#### Professional & Studio (~10 apps)
`relight`, `skin-enhancer`, `expand-image`, `image-background-remover`, `video-background-remover`, `breakdown` (visual search), `color-grading`, `ai-headshot-generator`, `ai-stylist`, `recast`

#### Camera & Composition (~8 apps)
`angles` (Angles 2.0 — qwen_camera_control), `shots` (9-shot grid), `whats-next` (8 narrative continuations), `multi-angle`, `3d-rotation`, `bullet-time-scene`, `bullet-time-splash`, `bullet-time-white`

#### Face & Identity (~5 apps)
`character-swap`, `outfit-swap`, `face-swap`, `video-face-swap`, `recast`

#### Video Editing (~6 apps)
`transitions`, `video-background-remover`, `video-face-swap`, `clipcut` (outfit reels), `urban-cuts` (beat-synced), `melting-doodle`

#### Ads & Products (~10 apps)
`packshot`, `billboard`, `click-to-ad`, `signboard`, `kick-ad`, `truck-ad`, `volcano-ad`, `fridge-ad`, `graffiti-ad`, `vending-machine`, `commercial-faces`, `macroshot-product`, `macroshot-scene`, `giant-product`

#### Games & Characters (~10 apps)
`gtai` (GTA-style), `mascot`, `idol`, `mugshot`, `pixel-game`, `game-dump`, `latex`, `victory-card`, `rapgod`, `paint-app`

#### Viral Effects (~30+ apps)
`plushies`, `cloud-surf`, `skibidi`, `mukbang`, `nano-strike`, `nano-theft`, `cosplay-ahegao`, `roller-coaster`, `sand-worm`, `storm-creature`, `magic-button`, `chameleon`, `ghoulgao`, `surrounded-by-animals`, `this-is-fine`, `melting-doodle`, `glitter-sticker`, `brick-cube`, `60s-cafe`, `j-magazine`, `j-poster`, `japanese-show`, `renaissance`, `giallo-horror`, `comic-book`, `social-media-icon`, `meme-generator`, `sketch-to-real`, `style-snap`, `behind-the-scenes`, `simlife`, `banana-eating`, `burning-sunset`, `yes-kiss`, `zooms`, `sticker-matchcut`, `poster`, `j-poster`

#### ASMR (4 apps)
`asmr-classic`, `asmr-add-on`, `asmr-host`, `asmr-promo`

#### 3D (3 apps)
`3d-figure`, `3d-render`, `3d-rotation`

#### Utilities (~5)
`color-grading`, `breakdown`, `similarity-score`, `expand-image`, `meme-generator`

> **المجموع الفعلي:** 92 (تطابق العدد على الـCMS).

### 1.4 الكاتالوجات (Catalogs)

| Catalog | Endpoint | Items | استخدام |
|---|---|---|---|
| **AI Effects / Motions** | `cms.higgsfield.ai/motions?size=500` | **359** motions across 6 preset families (higgsfield 234, minimax 64, seedance 25, wan2_2_video 18, veo 16, kling 2) | DoP image-to-video, AI Effects picker |
| **Soul Styles** | `cms.higgsfield.ai/soul-styles?size=500` | **106** mood boards | Soul Studio style picker |
| **Soul V2 Curated Presets** | TanStack cache: `presetStyleCategories soul-v2` | **21** in 3 themes (Mood 6, Styles 10, Camera 5) | Soul Studio prominent picker |
| **Soul Color Presets** | TanStack cache: `color-presets` | **6** (Film, Lime Jam, Candy pink, Nostalgic blue, Soft palette, Black gloss) | Soul color overlay |
| **Cinema Cameras** | live React fiber | **4** (Auto, Raw 16mm, Fine Film, Clean Digital) — UUIDs verified | Cinema Studio |
| **Cinema Lenses** | live React fiber | **6** (Auto, Clinical Sharp, Extreme Macro, Anamorphic, Warm Halation, Vintage Haze) | Cinema Studio |
| **Cinema Focal Lengths** | live React fiber | **6** (14, 24, 35, 50, 85, 100mm) | Cinema Studio slider |
| **Cinema Apertures** | live React fiber | **4** (Auto, f/11, f/1.4, f/4) | Cinema Studio |
| **Cinema Genres** | live React fiber | **6** (Action, Horror, Comedy, Noir, Drama, Epic) | Cinema Studio AI Director |
| **Cinema Color Palettes** | unverified (auth-only) | unknown count — Style Settings popup | Cinema Studio |
| **Cinema Lighting Schemes** | unverified | unknown — Style Settings popup | Cinema Studio |
| **Cinema Camera Movesets** | unverified | unknown — Style Settings popup | Cinema Studio |
| **Voices (TTS)** | `fnf.higgsfield.ai/voices?size=500` | **82** (42 male, 40 female, 12 categories) — ElevenLabs IDs | Audio Studio + Speak + Marketing audio |
| **Marketing Hooks** | `fnf.../marketing-studio/setup/hooks?size=500` | **9** (with verbatim prompts captured) | Marketing Studio |
| **Marketing Settings** | `fnf.../marketing-studio/setup/settings?size=500` | **14** (8 realistic + 6 unrealistic, with prompts) | Marketing Studio |
| **Marketing Avatars** | `fnf.../marketing-studio/avatars?size=500` | **40** preset (22 female, 16 male) + custom user avatars | Marketing Studio |
| **Marketing Modes** | `cli/MODELS.md` | **9** (ugc, ugc_how_to, ugc_unboxing, product_showcase, product_review, tv_spot, wild_card, ugc_virtual_try_on, virtual_try_on) | Marketing Studio mode dropdown |
| **AI Influencer Categories** | TanStack cache | **143 options** in 22 subcategories across 4 panels (Core 7×61, Face 7×34, Body 5×31, Style 3×17) | AI Influencer character builder |
| **Pricing Plans** | `fnf.../subscriptions/plans` | **37 plan entries** (Free, Starter $15, Pro $29, Plus, Ultimate, Team, Ultra, Creator, Enterprise) | Pricing page |
| **Notices** | `cms.../notices` | system messages + per-jst warnings | UI status bar |

### 1.5 الـHelpers (Hidden LLM Layer)

كلهم بيستخدموا **Anthropic Claude Opus 4.7** عبر `job_set_type: "llm_text"`:

| Helper | يخدم | system_prompt مخفي | Inputs |
|---|---|---|---|
| **AI Director** | Cinema Studio | كاتب prompt enhancer للـcamera+lens+genre+lighting+palette+moveset | user prompt + selected dimensions |
| **Soul Prompt Enhancer** | Soul Studio | يحوّل prompts قصيرة لـlong-form sensory | toggle `enhance_prompt:true` |
| **Marketing Studio Enhancer** | Marketing | يكتب `enhanced_prompt` field — mode-specific templates لـ9 modes | mode + hook + setting + avatar + product |
| **Product Photoshoot Enhancer** | Product Photoshoot CLI | 10 mode-specific templates (product_shot, lifestyle, closeup, ...) + multi-variant coordination | mode + image + intent prompt |
| **Marketplace Cards Enhancer** | Marketplace Cards CLI | 13 asset templates + Amazon/Shopify compliance rules | scope/asset + product image + brand context |
| **Storyboard Extractor** | image-to-prompts | multimodal — يقرأ storyboard images ويستخرج shots | image + user query |
| **Color Grading AI** | color-grading app | grading-specific | image |
| **Assist Chatbot** | `/assist` page | tool-calling LLM يـdispatch للـ92 app + 16 studio | chat messages + attachments |
| **Virality Predictor** | brain_activity | محلل attention / hook strength | video input |

> **النقطة المفتاحية:** كل اللي بيخلي Higgsfield يبدو "ذكي" هو طبقة Claude Opus 4.7. إذا أضفنا API key Anthropic ووصلنا بنفس الـsystem_prompt structure، نقدر نطابق 90% من الـintelligence.

### 1.6 الـAPIs والـAuth

#### Hosts
- `cms.higgsfield.ai` — public catalogs (motions, soul-styles, applications, notices)
- `fnf.higgsfield.ai` — auth-required user data (jobs, voices, marketing setup, subscriptions)
- `platform.higgsfield.ai` — backend API (generations, custom-references)
- `clerk.higgsfield.ai` — auth (Clerk JWT)
- `cdn.higgsfield.ai` — assets

#### Auth patterns
- **v1:** `hf-api-key: KEY_ID` + `hf-secret: KEY_SECRET` headers
- **v2:** `Authorization: Key KEY_ID:KEY_SECRET`
- **Browser:** Clerk session JWT in `Authorization: Bearer ...`

#### Job lifecycle (verified from SDK)
```
not_ready → queued → in_progress → {completed, failed, nsfw, ip_detected, canceled}
```
- **NSFW / IP / failed / canceled** → credits **auto-refunded**.
- **Webhook signing** عبر `X-Webhook-Secret-Key` header.

#### Frontend stack
Next.js 14+, Valtio + TanStack Query, Redaxios, Clerk, Framer Motion, Radix UI, Tailwind, Vercel-edge، DataDome anti-bot.

### 1.7 التسعير (verified — 37 plan entries)

- Free: 10 daily credits (no purchase)
- Starter $15 → 200 credits ($0.075/credit)
- Pro $29 → 600 ($0.0483)
- Plus $49 → 1000 ($0.049)
- **Ultimate $49-$147 → 1200-3600 ($0.041/credit — الأرخص)**
- Team $89-$267 → 1500-4500
- Ultra $129-$375 → 3000-9000
- Creator $250-$500 → 6000-12000
- Enterprise — custom

#### Per-second pricing (verified from `credits-config`)
- **Seedance 2.0:** 480p=3, 720p=4.5, 1080p=9 credits/sec (50% خصم على originals)
- **Cinema Studio 3.5:** 480p=3.5, 720p=5, 1080p=10 credits/sec
- **Marketing Studio Video:** 480p=3.5, 720p=5, 1080p=10 credits/sec
- **Kling 3.0 pro+audio:** 2.5 credits/sec
- **HappyHorse:** 720p=4, 1080p=8

#### App cost distribution (للـ92 app)
- 39 apps بـ50 credits (Soul/Cinema-derived)
- 19 apps بـ16 credits
- 17 apps بـ15 credits
- 8 apps بـ19 credits (premium)
- 7 apps بـ23 credits (ASMR + GTAI)
- 3 apps بـ26 credits (sand-worm, magic-button, storm-creature)

---

## 2) Yilow Now — جرد كامل (37 أداة + 3 ستديوهات + 6 audio + إضافات)

### 2.1 IMAGE TOOLS (19)

| Yilow Tool | Purpose | Models | Higgsfield equivalent | Match level |
|---|---|---|---|---|
| `cinema-studio` | Cinema studio bespoke | nano-banana-pro + kling | Cinema Studio 3.5 | 🟡 محدود — مفقود AI Director, camera/lens/focal/aperture pickers, color/lighting/moveset, Image Grid |
| `soul` | Soul studio bespoke | nano-banana-pro + descriptor | Soul Studio | 🟡 موديل مختلف (nano-banana بدلاً من soul_v2), styles أقل (33 vs 106), مفقود Soul ID training |
| `soul-cinema` | Soul cinematic descriptor | nano-banana-pro | Soul Cinematic | 🟡 approximation |
| `text-to-image` | Generic t2i | 10 models | Image Router | 🟡 موديلات أقل (10 vs 23), مفقود Reve, Multi, WAN 2.2, Z Image, Sora 2 |
| `enhance-image` | Upscale | ai-image-upscaler, topaz, seedvr2 | Topaz / Skin Enhancer | 🟢 Same — Topaz موجود |
| `edit-image` | Inpaint + edit | nano-banana-edit, flux-kontext, qwen, gpt4o, seedream-edit | Edit Canvas (route to flux/nano) | 🟢 Same family — لكن مش canvas موحد |
| `bg-remover` | Background removal | ai-background-remover | image-background-remover | 🟢 Same family |
| `product-mockup` | Product in scene | ai-product-shot | (no exact match — closest: Product Photoshoot CLI) | 🟡 missing 10 modes, multi-variant coordination, brand voice |
| `sketch-to-image` | Sketch → image | flux-kontext, nano-banana, qwen | sketch-to-real (image variant) | 🟢 Same family |
| `restore-image` | B&W → color | ai-color-photo | (no direct match) | 🟡 unique to us |
| `skin-retouch` | Skin enhance | ai-skin-enhancer | skin-enhancer | 🟢 Same family |
| `image-outpaint` | Expand | ai-image-extension, ideogram-v3-reframe | expand-image | 🟢 Same family |
| `change-angle` | Camera control | qwen-image-edit-plus-lora | Angles 2.0 (qwen_camera_control) | ✅ **EXACT MATCH** — نفس الـmodel |
| `multi-scene` | 9 cinematic shots | nano-banana-edit ×9 fan-out | Shots (`nano_banana_2_shots`) + cinematic_studio_image_grid | 🟢 Same family — لكن Higgsfield عندهم prompt template أقوى (full Contact Sheet template extracted) |
| `relighting` | Lighting control | flux-kontext + prompt-baked | relight | 🟡 Higgsfield عندهم moder خاص (preset_family `relight`) |
| `change-clothes` | Outfit swap | ai-dress-change | outfit-swap | 🟢 Same family |
| `fashion-designer` | Fashion design | nano-banana, flux-dev, midjourney | (no direct — closest ai-stylist) | 🟡 ai-stylist عند Higgsfield عنده outfit/pose/background pickers — عندنا prompt-only |
| `face-swap` | Image face swap | ai-image-face-swap | face-swap | 🟢 Same family |
| `whats-next` | 8 narrative continuations | nano-banana-edit ×8 fan-out | whats-next (`next_shots`) | 🟢 Same family — لكن Higgsfield عندهم 9 cells (3×3) بـtemplate خاص |

### 2.2 VIDEO TOOLS (12)

| Yilow Tool | Purpose | Models | Higgsfield equivalent | Match level |
|---|---|---|---|---|
| `marketing-studio` | Marketing bespoke | seedance-2-vip-omni-reference | Marketing Studio | 🟢 على الأرجح نفس الـSeedance — لكن مفقود hooks/settings/avatars catalogs + LLM enhancer |
| `text-to-video` | Generic t2v | 10 models | Video Router | 🟢 Same family — لكن مفقود grouping (9 providers) و DoP motions |
| `sketch-to-video` | Sketch → video | kling, veo, wan i2v | sketch-to-real (video variant) | 🟢 Same family |
| `motion-transfer` | Motion control | kling-motion-control, runway act-two | (DoP image-to-video + 359 motions) | 🟡 Higgsfield عندهم 359 motion preset جاهز — عندنا prompt-only |
| `video-editor` | Video edit | runway-aleph, wan edit, luma modify | Edit Canvas (video) | 🟢 Same family |
| `lip-sync` | Talking head | 7 lipsync models | Speak (`/v1/speak/higgsfield`) | 🟢 Same family |
| `video-resize` | FFmpeg resize | custom /api/video/resize | (no direct — Higgsfield wraps everything in jobs) | ✅ unique to us, faster |
| `video-vfx` | Video effects | ai-video-effects (15 in UI) | 92 viral apps + 359 motions | 🔴 Higgsfield عندهم 30+ viral apps منفصلة + 359 motions — عندنا 15 effect جوه tool واحد |
| `video-transitions` | Transitions | kling i2v with first/last frame | transitions | 🟢 Same family |
| `video-bg-remover` | Watermark removal (mislabeled) | video-watermark-remover | video-background-remover | 🔴 **خطأ تسمية** — عندنا watermark removal، Higgsfield عندهم real bg remover |
| `product-video` | Product i2v | kling, veo, wan i2v | (no direct — Marketing Studio handles ads) | 🟢 Same family |
| `billboard-video` | Animate logo | kling, veo, wan i2v (mislabeled — does NOT compose to billboard) | billboard | 🔴 **سلوك مختلف** — Higgsfield app يضع الـlogo فعلاً على billboard في timelapse city scene |

### 2.3 AUDIO TOOLS (6)

| Yilow Tool | Purpose | Models | Higgsfield equivalent | Match level |
|---|---|---|---|---|
| `text-to-speech` | TTS | ElevenLabs (custom /api/audio/tts) + dynamic voices | text2speech_v2 (ElevenLabs) | 🟢 **Same provider** — لكن عندهم 82 voices catalog منظم في 12 categories مع waveforms وpreviews — عندنا live API بدون categorization |
| `audio-separate` | Stems | custom /api/audio/separate (Demucs?) | (mish موجود) | ✅ unique to us |
| `audio-enhance` | Denoise | custom /api/audio/enhance (Resemble?) | (mish موجود) | ✅ unique to us |
| `music-create` | Suno | Suno V5 via /api/audio/music-create | (mish موجود) | ✅ unique to us |
| `music-remix` | Suno remix | Suno via /api/audio/music-remix | (mish موجود) | ✅ unique to us |
| `transcribe` | Whisper | OpenAI Whisper via /api/audio/transcribe | (mish موجود) | ✅ unique to us |

### 2.4 ميزات Yilow الفريدة (we have, they don't)

- ✅ Music creation/remix (Suno V5) — Higgsfield ما عندهمش
- ✅ Audio separate / enhance — Higgsfield مفقود
- ✅ Transcribe (Whisper) — Higgsfield مفقود
- ✅ Restore image (B&W → color) — Higgsfield مفقود
- ✅ Video resize (FFmpeg) — Higgsfield ما عندهمش tool بسيط لده
- ✅ Arabic-first RTL UI — Higgsfield English-only
- ✅ Open model picker per tool — Higgsfield بيقفل اليوزر على موديل واحد per studio

---

## 3) الفجوات — Categorized Gap Analysis

### 3.1 🔴 CRITICAL — مفقود تماماً (must-have for 1000% parity)

#### 3.1.1 Soul ID Training (Character Consistency)
- **What:** training pipeline يأخذ 5-20 صورة ويعمل LoRA-style fine-tuning للـcharacter identity
- **Higgsfield:** `POST /v1/custom-references` + variants (`--soul-2`, `--soul-cinematic`)
- **Cost:** Paid plan only (Basic+)
- **Impact:** أكبر USP لـHiggsfield — character consistency عبر كل الستديوهات

#### 3.1.2 AI Director (Cinema Studio LLM Enhancer)
- **What:** Claude Opus 4.7 يأخذ user prompt + camera/lens/genre/lighting/palette ويولد cinema-grade prompt
- **Higgsfield:** `job_set_type: "llm_text"` مع `model: "anthropic/claude-opus-4.7"`
- **Impact:** Cinema Studio بدونه = موديل عام بـconfusing pickers

#### 3.1.3 AI Influencer Studio (143 options)
- **What:** Character builder مع 22 subcategories
- **Higgsfield:** `/ai-influencer-studio` page + `ai_influencer` jst
- **Cost:** 200 credits per character
- **Impact:** Studio كامل مفقود + market segment ضخم (UGC influencers)

#### 3.1.4 Product Photoshoot — 10 Modes
- **What:** product_shot, lifestyle_scene, closeup_product_with_person, moodboard_pin, hero_banner, social_carousel, ad_creative_pack, virtual_model_tryout, conceptual_product, restyle
- **Higgsfield:** `gpt_image_2` + per-mode LLM enhancer templates
- **Impact:** عندنا `product-mockup` بـmode واحد وبدون brand voice/multi-variant

#### 3.1.5 Marketplace Cards — 13 Asset Types
- **What:** main_image, infographic, multi_angle, detail_shot, lifestyle, whats_in_box, aplus_hero_banner, aplus_pain_points, aplus_features, aplus_ingredients, aplus_efficacy, aplus_how_to_use, aplus_endorsement
- **Higgsfield:** `nano_banana_2` + Amazon-compliance LLM templates
- **Impact:** عندنا zero coverage لـecommerce listings

#### 3.1.6 Cinema Studio Image Grid (Contact Sheet)
- **What:** 9-shot أو 16-shot grid مع full template (Extreme Long Shot → Long Shot → ... → High Angle)
- **Higgsfield:** `cinematic_studio_image_grid` + extracted verbatim prompt template (في `99_REAL_JOB_PARAMS.md`)
- **Impact:** نقدر ننفذها 1:1 — عندنا كل الـtemplate verbatim

#### 3.1.7 Marketing Studio Catalogs (Hooks 9 + Settings 14 + Avatars 40)
- **What:** الـbuilding blocks اللي تخلي اليوزر يبني إعلان من قطع جاهزة
- **Higgsfield:** كل الـIDs والـprompts موثقة عندنا verbatim
- **Impact:** عندنا Marketing Studio بدون hooks/settings/avatars = empty studio

#### 3.1.8 359 AI Effects / Motions Catalog
- **What:** motion presets للـDoP image-to-video (Train Rush, Bullet Time, 360 Orbit, Crash Zoom, إلخ)
- **Higgsfield:** `cms.higgsfield.ai/motions?size=500` (public — كل الـUUIDs عندنا)
- **Impact:** عندنا `motion-transfer` بـ4 موديلات بدون preset library

#### 3.1.9 106 Soul Styles + 6 Color Presets + 21 Curated
- **What:** Style picker الكامل
- **Higgsfield:** `cms.higgsfield.ai/soul-styles?size=500` (public)
- **Impact:** عندنا 33 style فقط — Higgsfield 106 + 21 curated + 6 colors

#### 3.1.10 Cinema Studio Camera/Lens/Focal/Aperture/Genre Pickers
- **What:** 4 cameras × 6 lenses × 6 focal × 4 apertures × 6 genres = ~3500 unique combos
- **Higgsfield:** كل الـUUIDs عندنا verbatim
- **Impact:** Cinema Studio محدود حالياً — هذه هي الـcore controls

#### 3.1.11 Speak Endpoint (Lipsync Video)
- **What:** image + audio (WAV) → talking-head video (5/10/15s, mid/high quality)
- **Higgsfield:** `POST /v1/speak/higgsfield`
- **Impact:** عندنا lip-sync بـ7 models بس بشكل أبسط

#### 3.1.12 Dubbing + Lipsync (Translate Video)
- **What:** يأخذ video + target_language (ISO 639-3) → dubbed video مع lipsync
- **Higgsfield:** `dubbing_lipsync` jst, 1200 credits
- **Impact:** localization tool ضخم — مهم لـArabic content

#### 3.1.13 Voice Change Merge (Modify Voice in Video)
- **What:** يغير صوت في فيديو موجود ويـmerge audio track
- **Higgsfield:** `voice_change_merge`, 100 credits
- **Impact:** post-production tool

#### 3.1.14 Topaz Redefine (Real Integration)
- **What:** Topaz Redefine model مع creativity/denoise/sharpen/texture/face_enhancement controls
- **Higgsfield:** `topaz_image_generative` + structured params
- **Impact:** عندنا `enhance-image` بـTopaz بس بـbasic flag — مفقود الـadvanced controls

#### 3.1.15 Storyboard Extractor (image → multi-shot prompts)
- **What:** يقرأ storyboard صورة ويستخرج كل shot كـprompt منفصل
- **Higgsfield:** `llm_text` مع image_urls multimodal
- **Impact:** workflow tool للـcinema/marketing

#### 3.1.16 Multi-Shot Mode for Videos
- **What:** فيديو واحد بـmultiple prompts متتابعة (مثل storyboard)
- **Higgsfield:** `multi_shots: true`, `multi_shot_mode: "custom"`, `multi_prompt: [...]`
- **Impact:** core feature لـCinema Studio

#### 3.1.17 Reference Elements / `<<<uuid>>>` Inline Character Refs
- **What:** syntax `<<<uuid>>>` في الـprompt يتيح للـuser الإشارة لـSoul ID داخل النص
- **Higgsfield:** verified في cinematic_studio_image jobs
- **Impact:** workflow critical لـcharacter-consistent multi-shot

#### 3.1.18 Brain Activity / Virality Predictor
- **What:** يحلل video لـattention/hook/sustain ويرجع 3D brain map
- **Higgsfield:** `brain_activity` jst
- **Impact:** unique tool للـadvertisers/creators

#### 3.1.19 Soul Cast (Structured Character Builder for Video)
- **What:** archetype + body_type + era + gender + genre + ATTRACTIVENESS → character video
- **Higgsfield:** `cinematic_studio_soul_cast`
- **Impact:** structured alternative لـSoul ID training

#### 3.1.20 Soul Location (Location-Only Generation)
- **What:** full_name + style_id → location image (no prompt needed)
- **Higgsfield:** `cinematic_studio_soul_location`, 12 credits
- **Impact:** simpler workflow للـworld-building

### 3.2 🟡 IMPORTANT — موجود لكن ناقص (need expansion for 1000%)

#### 3.2.1 Image Router — مفقود 5 models
عندنا 10، Higgsfield عندهم 23 image model. **Missing:**
- Reve (NEW)
- Multi Reference (NEW)
- WAN 2.2 image
- Z Image
- Kling O1 Image
- GPT Image (legacy)
- Seedream 4.0 (legacy)

#### 3.2.2 Video Router — مفقود grouping + 3 models
عندنا 10، Higgsfield عندهم 16+ video model. **Missing:**
- OpenAI Sora 2 (NEW)
- HappyHorse (NEW)
- Kling 3.0 Motion Control (NEW variant)
- Provider grouping (Minimax / Kling / Sora / Veo / Higgsfield / Wan / Seedance / Grok / HappyHorse)

#### 3.2.3 Audio Studio — مفقود voices catalog UX
- ✅ عندنا ElevenLabs integration
- ❌ مفقود: 82 voices catalog مع categories (vlog, stream, beauty, professions, car talk, forum, podcast, coaching, selling, reporter, emotions)
- ❌ مفقود: voice previews + waveforms في الـpicker
- ❌ مفقود: voice cloning (custom voices)

#### 3.2.4 Edit Canvas — fragmented across multiple tools
- عندنا `edit-image`, `bg-remover`, `relighting`, `image-outpaint` كأدوات منفصلة
- Higgsfield: كلهم في canvas موحد بـtool switcher داخل نفس الـview
- **Solution:** نبني `/edit` page بـcanvas + toolbar (paint/eraser/expand/mask/crop) ونـreuse الـunderlying APIs

#### 3.2.5 Marketing Studio — مفقود الـcatalogs
- عندنا studio بـUI bespoke
- ❌ مفقود: 9 Hooks (الـprompts عندنا verbatim)
- ❌ مفقود: 14 Settings (الـprompts عندنا verbatim)
- ❌ مفقود: 40 Avatars
- ❌ مفقود: User products library (URL fetch + manual)
- ❌ مفقود: Web products (App Store URLs)
- ❌ مفقود: Ad Reference videos (reusable inspiration)
- ❌ مفقود: 9 modes mode-specific behavior (UGC vs TV Spot vs Wild Card)
- ❌ مفقود: Click-to-Ad URL shortcut (`feature: "click_to_ad"`)
- ❌ مفقود: enhanced_prompt field من LLM enhancer

### 3.3 🟢 NICE-TO-HAVE — أدوات viral مفقودة (66 من 92 apps)

كل واحدة منهم thin wrapper فوق `nano_banana_2` أو `flux_kontext` مع preset_family slug + hidden prompt template. Yilow حالياً عندها ~10 منهم.

**The 66 missing apps grouped by impact:**

#### High-impact (viral on TikTok)
plushies, cloud-surf, skibidi, mukbang, urban-cuts, nano-strike, nano-theft, ghoulgao, mascot, idol, kick-ad, melting-doodle, billboard (real one), packshot (real one), 3d-render, 3d-figure, comic-book, gtai, sand-worm, magic-button, storm-creature

#### Medium-impact (creative tools)
bullet-time-scene, bullet-time-splash, bullet-time-white, behind-the-scenes, cosplay-ahegao, brick-cube, simlife, surrounded-by-animals, this-is-fine, breakdown, color-grading, ai-headshot-generator, meme-generator, character-swap (separate from face-swap), ai-stylist (with full pickers), recast, similarity-score

#### Low-impact (niche)
asmr-classic, asmr-add-on, asmr-host, asmr-promo, banana-eating, burning-sunset, chameleon, click-to-ad (separate from marketing), commercial-faces, fridge-ad, giallo-horror, giant-product, glitter-sticker, graffiti-ad, j-magazine, j-poster, japanese-show, latex, macroshot-product, macroshot-scene, melting-doodle, mugshot, outfit-shot, paint-app, pixel-game, poster, rapgod, renaissance, roller-coaster, signboard, social-media-icon, sticker-matchcut, style-snap, truck-ad, vending-machine, victory-card, video-face-swap, volcano-ad, yes-kiss, zooms, 60s-cafe, game-dump, j-poster

### 3.4 🟢 INFRASTRUCTURE — مفقود لكن مش UI

| Feature | Higgsfield | Yilow | Priority |
|---|---|---|---|
| **Job lifecycle states** | queued/in_progress/completed/failed/nsfw/canceled/ip_detected | عندنا completed/failed | متوسط |
| **Auto-refund on NSFW/IP** | ✅ enforced | ❌ مش ضروري لو ما عندناش credit system كامل | متوسط |
| **Webhook signing** | `X-Webhook-Secret-Key` | ❌ | منخفض |
| **Aspect ratio coercion** | invalid → closest valid + adjustments map | ❌ | منخفض |
| **Multi-resolution upscale** | per-model resolution caps | جزئي | منخفض |
| **DataDome anti-bot** | enforced | ❌ | منخفض |
| **Folders / Projects organization** | folder_id في كل job | ❌ | متوسط |
| **MCP server** | exposes platform as MCP tools | ❌ | منخفض (للـdevs) |
| **CLI** | `@higgsfield/cli` | ❌ | منخفض |
| **Node SDK** | `@higgsfield/client` | ❌ | منخفض |
| **Python SDK** | `higgsfield-client` | ❌ | منخفض |
| **Realtime collaboration** | websockets + workspace meta | ❌ | متوسط |
| **Per-second pricing UI** | dynamic cost calc with audio toggle | جزئي | عالي |
| **Free tier daily reset** | 10 credits/day | ❌ | متوسط |
| **Workspace switching** | personal vs team workspace | ❌ | منخفض |

---

## 4) خطة التنفيذ — Phased Roadmap (للوصول لـ1000% parity)

> **القاعدة:** كل phase = 2-4 أسابيع شغل. الـcode حسب priority — مش حسب ترتيب الـphases.

### 🔥 PHASE 1 — Foundation (Week 1-2) — CRITICAL infrastructure

**الهدف:** نضع البنية اللي تخلي باقي الـphases تنفذ نفسها.

1. **Anthropic Claude Opus 4.7 integration** — `@anthropic-ai/sdk` + API key
   - يخدم: AI Director, Marketing enhancer, Product Photoshoot enhancer, Marketplace Cards enhancer, Soul enhancer, Storyboard extractor, Assist chatbot
   - Endpoint: `/api/llm/enhance` (generic) + `/api/llm/director` (Cinema-specific)

2. **Topaz Labs API integration** — wrapper حول Topaz Redefine
   - يخدم: enhance-image (بـadvanced mode)
   - Endpoint: `/api/image/topaz-redefine`

3. **ElevenLabs full catalog integration** — fetch + cache 82 voices
   - يخدم: text-to-speech (بـ12 categories), Speak (lipsync)
   - Endpoint: `/api/audio/voices` (موجود — needs categories enrichment)

4. **Job lifecycle expansion** — add nsfw/ip_detected states
   - Update Prisma schema → Generation table
   - UI: status badge + auto-refund logic placeholder

5. **Folders / Projects** — في spaces، add folder_id field
   - Schema: `Folder { id, userId, parentId?, name }` + `Generation.folderId?`

### 🔥 PHASE 2 — Cinema Studio Full Parity (Week 3-4)

**الهدف:** Cinema Studio يعمل 1:1 مع Higgsfield Cinema 3.5.

1. **Camera/Lens/Focal/Aperture/Genre Pickers** — 4 + 6 + 6 + 4 + 6 = 26 options
   - Source: copy verbatim من `05_CATALOGS/cinema-*.md`
   - Save to: `src/lib/data/cinemaPickers.ts`
   - UI: dropdown/slider/picker components في `/cinema` page

2. **AI Director Toggle + LLM call** — يستخدم `/api/llm/director`
   - Input: user prompt + selected dimensions
   - Output: enhanced prompt
   - UI: toggle ON by default, "Manual Style" toggle to bypass

3. **Image Grid (Contact Sheet)** — 9-shot or 16-shot
   - Input: scene image + grid_size
   - Use the verbatim 9-shot template من `99_REAL_JOB_PARAMS.md`
   - Backend: nano-banana-pro-edit بـoutput dimensions 3072×5504 (3x3) أو 4096×5504 (4x4)

4. **Multi-Shot Mode** — `multi_shots: true` workflow
   - UI: add "Multi-shot" toggle, when ON show array of N prompts
   - Backend: fan out N parallel calls + stitch (or use video model with multi_prompt array if supported)

5. **`<<<uuid>>>` Inline Character Refs**
   - Parser: detect `<<<uuid>>>` في prompt, replace with character image URL
   - Soul ID lookup: get user's saved Soul IDs, populate dropdown for `@` mention
   - reference_elements array في payload

6. **Cinema Versions Switcher** — 3.5 / 3.0 / 2.5
   - Option to fall back to older models for users who prefer them

### 🔥 PHASE 3 — Soul Studio Full Parity (Week 5-6)

**الهدف:** Soul Studio يعمل بـ106 styles + Soul ID training + 6 color presets.

1. **Import 106 Soul Styles**
   - Source: `05_CATALOGS/soul-styles.md` (verbatim list)
   - Save to: `src/lib/data/soulStyles.ts`
   - Categorize by board_id (3 themes: Mood, Styles, Camera) — 21 curated highlighted

2. **Import 6 Color Presets**
   - Source: `05_CATALOGS/soul-color-presets.md` verbatim
   - UI: separate picker من styles

3. **Soul ID Training Pipeline**
   - Endpoint: `POST /api/soul-id/train` (5-20 photos, name, variant)
   - Backend: integrate with a fine-tuning service (Replicate Cog DreamBooth, fal.ai LoRA training, أو Higgsfield API direct)
   - Photo guide UI: من `04_STUDIOS/character-training.md` (multiple angles/lighting/expressions)
   - Status polling: queued → in_progress → completed/failed
   - Min 5 photos, 8-12 sweet spot

4. **Soul ID Picker in Soul Studio**
   - Dropdown: user's trained Soul IDs
   - `custom_reference_id` + `custom_reference_strength` slider (0-1)

5. **Soul Variants Selection**
   - Toggle: soul-2 (image) vs soul-cinematic (video)
   - Soul Cast: structured character builder (archetype, body_type, era, gender, genre, attractiveness)
   - Soul Location: full_name + style_id only

6. **Internal width_and_height enum** — 13 sizes
   - Map UI's aspect_ratio + quality → one of LANDSCAPE 5/PORTRAIT 5/SQUARE 1/MIXED 2

### 🔥 PHASE 4 — Marketing Studio Full Parity (Week 7-8)

**الهدف:** Marketing Studio يعمل بكل الـbuilding blocks.

1. **Import 9 Hooks (verbatim)**
   - Source: `05_CATALOGS/marketing-hooks.md` (full prompts captured)
   - Save: `src/lib/data/marketingHooks.ts`
   - Hook types: stunt vs subtle
   - Mode whitelist: only valid for ugc, ugc_how_to, ugc_unboxing, product_review, ugc_virtual_try_on

2. **Import 14 Settings (verbatim)**
   - Source: `05_CATALOGS/marketing-settings.md`
   - Realistic (8) vs Unrealistic (6)
   - Mechanically prepended to prompt

3. **Import 40 Preset Avatars**
   - Source: `05_CATALOGS/marketing-avatars.md` (with thumbnails)
   - Female 22 + Male 16 + Neutral 2
   - UI: avatar grid picker

4. **Custom Avatars Upload**
   - Per-user library: upload photos → create custom avatar
   - Reuse Soul ID infrastructure if avatar wraps a Soul ID

5. **Products Library**
   - URL fetch flow: paste shop URL → backend scrapes title/description/images
   - Manual create: title + description + images upload
   - Webproducts: App Store URLs → screenshots fetch
   - Per-user storage in Prisma

6. **Ad Reference Videos**
   - Upload existing video OR use previous job
   - Reusable across runs

7. **9 Modes Mode-Specific Behavior**
   - ugc, ugc_how_to, ugc_unboxing, product_showcase, product_review, tv_spot, wild_card, ugc_virtual_try_on, virtual_try_on
   - Mode-specific UI (avatar required for tv_spot/product_showcase, hook only for UGC family, etc.)

8. **Click-to-Ad URL Shortcut**
   - One-input flow: paste URL → generate ad
   - `feature: "click_to_ad"` + `product: { url }`

9. **enhanced_prompt Field**
   - Show user the LLM-rewritten prompt (transparency)
   - Endpoint: `/api/marketing/enhance` (calls Claude Opus 4.7)
   - Pass mode + hook + setting + avatar + product context

### 🔥 PHASE 5 — Audio Studio + Lipsync Family (Week 9-10)

**الهدف:** All audio capabilities.

1. **82 Voices Catalog UI**
   - Sidebar filters: gender, age, category (vlog, stream, beauty, ...)
   - Voice preview with waveform
   - Source: ElevenLabs API + manual category mapping من `05_CATALOGS/voices.md`

2. **Speak Endpoint (Lipsync Video)**
   - Input: image + audio (WAV) أو text + voice
   - Quality: mid/high. Duration: 5/10/15s
   - Endpoint: `/api/lipsync/speak` (تـwrap موديل existing)
   - **NOTE:** WAV-only audio (validate)

3. **Dubbing + Lipsync (Video Translation)**
   - Input: video + target_language (ISO 639-3)
   - Endpoint: `/api/lipsync/dubbing` (1200 credits cost)
   - Critical for Arabic content

4. **Voice Change Merge**
   - Input: video + new voice profile
   - Endpoint: `/api/lipsync/voice-change` (100 credits)

5. **Voice Cloning**
   - Upload 30s+ voice sample → clone
   - ElevenLabs voice cloning API
   - Soul ID-style training for voices

### 🔥 PHASE 6 — AI Influencer Studio (Week 11-12)

**الهدف:** Studio جديد كامل من 0.

1. **Build Builder UI** — 4 panels (Core/Face/Body/Style)
   - 22 subcategories
   - 143 options total
   - Source schema verbatim من `04_STUDIOS/ai-influencer.md`

2. **Composed Prompt Logic**
   - Template من نفس الـdoc:
     > "A {age} {character_type} {gender} of {ethnicity_origin_base} origin with {skin_color} {face_skin_material} skin and {face_surface_pattern} pattern, {eye_color} {eyes_type} eyes, {mouth}, {ears} ears, {hair} hair, {body_type} build, {left_arm} left arm and {right_arm} right arm, {accessories}, rendered in {rendering_style} style"
   - Backend: nano-banana-pro (high quality character gen)

3. **Saved Influencers Library**
   - Per-user: save, name, reuse
   - Shows like Skyler/Onyx in Higgsfield UI

### 🔥 PHASE 7 — Edit Canvas (Week 13)

**الهدف:** Unified canvas at `/edit`.

1. **Canvas UI** — fabric.js or konva.js
   - Tools: Paint, Eraser, Expand, Mask, Crop, Rotate, Resize
   - Toolbar layout مماثل لـHiggsfield

2. **Tool routing** — كل tool يـcall الـAPI المناسب
   - Paint/Inpaint → flux-kontext or nano-banana-edit
   - Eraser → segment + inpaint
   - Expand → ai-image-extension
   - Background remove → ai-background-remover
   - Style transfer → flux-kontext
   - Object swap → outfit-swap / character-swap
   - Face swap → ai-image-face-swap
   - Crop / Rotate → client-side

3. **Reuse existing tools** — لا duplication، just unified UI

### 🔥 PHASE 8 — Apps Library (Week 14-16)

**الهدف:** ~30 viral apps (high-impact subset of the 66 missing).

#### Strategy:
كل app = preset_family + hidden prompt template. لما إحنا مش عندنا access للـtemplate، نحط:
1. **Documented apps** (الـ20 اللي عندنا verified payloads): use exact backend params
2. **Inferred apps** (الـ40 اللي عندنا preset_family slug فقط): write our own prompt template من الـapp description

**Top 30 لتنفيذ Phase 8:**

##### Image apps (15)
breakdown, color-grading, ai-headshot-generator, meme-generator, character-swap, ai-stylist (with full pickers: outfit_presets + pose_preset + background_preset), comic-book, gtai (GTA-style), idol, mascot, mugshot, j-magazine, j-poster, victory-card, paint-app

##### Video apps (15)
plushies, cloud-surf, skibidi, mukbang, urban-cuts, nano-strike, nano-theft, ghoulgao, melting-doodle, sand-worm, magic-button, storm-creature, comic-book (video variant), 3d-render, 3d-figure

#### Build-pattern:
كل app:
- Tool entry في `tools.ts`
- إذا عندنا real backend params → use as-is
- إذا preset_family فقط → wrap nano-banana-pro-edit بـwritten prompt template
- Image upload + optional text prompt
- Layout: centered

### 🔥 PHASE 9 — Product Photoshoot (Week 17)

**الهدف:** 10-mode product photography studio.

1. **10 Mode Templates** — نكتب نظائر للـHiggsfield templates
   - Use Claude Opus 4.7 enhancer مع per-mode system_prompt
   - Modes: product_shot, lifestyle_scene, closeup_product_with_person, moodboard_pin, hero_banner, social_carousel, ad_creative_pack, virtual_model_tryout, conceptual_product, restyle

2. **Multi-Variant Coordination** — `--count N` بـvarying preset/lighting/angle/palette
   - Backend logic: send N parallel calls with system_prompt asking for variation
   - For social_carousel/ad_creative_pack: lock visual system across slides

3. **Aspect Ratio Defaults Per Mode** — moodboard_pin → 2:3, hero_banner → 21:9, etc.

4. **Backend:** gpt_image_2 إذا متاح، أو nano-banana-pro كـfallback

### 🔥 PHASE 10 — Marketplace Cards (Week 18)

**الهدف:** ecommerce listings studio.

1. **4 Scopes** — main, product-images, aplus, full-set
2. **13 Asset Types** — main_image, infographic, multi_angle, detail_shot, lifestyle, whats_in_box, aplus_hero_banner, aplus_pain_points, aplus_features, aplus_ingredients, aplus_efficacy, aplus_how_to_use, aplus_endorsement
3. **Per-Asset LLM Templates** — كل asset له system_prompt مختلف
4. **Visual Coordination** — same color palette/typography across assets
5. **Reuse Main Image Job** — `--main-job <id>` flag
6. **Backend:** nano_banana_2

### 🔥 PHASE 11 — Catalogs & Smart Helpers (Week 19-20)

**الهدف:** Reach feature parity on data depth.

1. **Import 359 AI Effects/Motions**
   - Source: `05_CATALOGS/motions.md` (full list with UUIDs and categories)
   - Save: `src/lib/data/motions.ts`
   - UI: integrate into motion-transfer + new "AI Effects" picker

2. **Storyboard Extractor**
   - Tool: upload image → extract shots as separate prompts
   - Endpoint: `/api/llm/storyboard-extract` (Claude Opus 4.7 multimodal)

3. **Virality Predictor (Brain Activity)**
   - Tool: upload video → get attention/hook/sustain analysis
   - Backend: integrate via brain_activity API or build similar
   - Output: text report + 3D brain map (.glb visualization)

4. **Color Grading AI** — separate tool (currently inside Soul)
   - Dedicated app: image → graded image
   - Use flux-kontext + grading-specific prompts

### 🔥 PHASE 12 — Assist Chatbot (Week 21-22)

**الهدف:** Conversational interface to all tools.

1. **Tool Schema for LLM** — define function-calling for all Yilow tools
2. **System Prompt** — orient Claude to Yilow's catalog
3. **Multimodal** — image/video uploads in chat
4. **SSE streaming** — real-time responses
5. **Endpoint:** `/api/assist` (streaming)

### 🔥 PHASE 13 — Routers (Week 23)

**الهدف:** Generic image/video routers.

1. **Image Router** at `/image` — picker لـ23 image models
   - Add missing: Reve, Multi, WAN 2.2, Z Image, Sora 2, GPT Image legacy, Seedream 4 legacy
2. **Video Router** at `/video` — picker لـ16+ video models بـprovider grouping
   - Add missing: Sora 2, HappyHorse, Kling 3.0 Motion Control
   - Group by provider: Minimax, Kling, Sora, Veo, Higgsfield, Wan, Seedance, Grok, HappyHorse

### 🔥 PHASE 14 — Library, Folders, Workspace (Week 24)

**الهدف:** Asset management at parity.

1. **Asset Library** at `/asset/all`
   - Sections: All / Favorites / Image / Video / Audio
   - Date grouping: Today, Yesterday, This Week
2. **Folders** — nested organization
3. **Projects** — buckets for related work
4. **Workspace switcher** — personal vs team

### 🔥 PHASE 15 — MCP / CLI / SDKs (Week 25+, optional)

For developer ecosystem (lower priority unless we want devs).

1. MCP server exposing Yilow tools
2. Node SDK
3. Python SDK
4. CLI

### 🔥 PHASE 16 — Remaining Apps (Week 26+)

The other 36 of the 66 missing apps (low-impact niche). Build on demand.

---

## 5) قائمة الـ"Adds" — كل أداة/إدخال نضيفها (سؤال المستخدم)

> **للتوضيح:** المستخدم سأل عن "أدوات أو apps أو inputs مش موجودة عندنا". الكل هنا.

### 5.1 الأدوات الجديدة (Tools to add)

#### Tier 1 — Studios (must-have)
1. **AI Influencer Studio** (`/ai-influencer-studio`) — character builder بـ143 options
2. **Product Photoshoot Studio** (`/product-photoshoot`) — 10 modes
3. **Marketplace Cards Studio** (`/marketplace-cards`) — 13 asset types
4. **Edit Canvas** (`/edit`) — unified canvas
5. **Image Router** (`/image`) — 23 image models
6. **Video Router** (`/video`) — 16+ video models
7. **Audio Studio enhancements** (`/audio`) — 82 voices catalog UI
8. **Assist Chatbot** (`/assist`) — Claude-powered assistant

#### Tier 2 — Apps (high-impact viral, top 30)
##### Image apps (15 to add)
9. `breakdown` — visual search / object identification
10. `color-grading` — dedicated color grading tool
11. `ai-headshot-generator` — selfie → professional headshot
12. `meme-generator` — viral memes
13. `character-swap` — separate from face-swap (full character replacement)
14. `ai-stylist` (full version) — outfit + pose + background pickers
15. `comic-book` — image to comic style
16. `gtai` — GTA-loading-screen style
17. `idol` — K-pop idol style
18. `mascot` — character mascot generator
19. `mugshot` — mugshot style
20. `j-magazine` — Japanese magazine cover
21. `j-poster` — Japanese poster style
22. `victory-card` — game victory card style
23. `paint-app` — painted artwork style

##### Video apps (15 to add)
24. `plushies` — plushie-style video
25. `cloud-surf` — cloud surfing effect
26. `skibidi` — skibidi toilet meme
27. `mukbang` — eating show video
28. `urban-cuts` — beat-synced outfit transitions
29. `nano-strike` — strike effect
30. `nano-theft` — theft scene
31. `ghoulgao` — ghoul transformation
32. `melting-doodle` — melting drawing effect
33. `sand-worm` — sand worm encounter
34. `magic-button` — magic button push effect
35. `storm-creature` — storm creature
36. `3d-render` — image → 3D render
37. `3d-figure` — image → 3D figurine
38. `transitions` (more styles) — 12 transition styles مش 12

#### Tier 3 — Specialty
39. `soul-cast` — structured character builder for video (archetype + body_type + era + ATTRACTIVENESS)
40. `soul-location` — location-only generation
41. `dubbing-lipsync` — translate video + lipsync
42. `voice-change-merge` — modify voice in video
43. `speak-lipsync` — image + audio → talking head video
44. `topaz-redefine` — advanced upscale with creativity/denoise/sharpen/texture/face_enhancement
45. `storyboard-extractor` — image → multi-shot prompts
46. `virality-predictor` — video → attention analysis
47. `cinema-image-grid` — 9-shot Contact Sheet
48. `cinema-3d-image` — image → 3D rotatable
49. `next-shots` (proper 9-cell) — current `whats-next` but with 9 cells (3×3) instead of 8
50. `multi-shot-video` — video بـmultiple prompts متتابعة

#### Tier 4 — Lower-impact (nice-to-have)
51-110: الـ60 app الباقية (asmr-classic, banana-eating, brick-cube, ...)

### 5.2 الإدخالات الجديدة (Inputs to add)

#### Cinema Studio (10 new inputs)
- Camera picker (4 options)
- Lens picker (6 options)
- Focal length slider (6 mm positions)
- Aperture picker (4 options)
- Genre dropdown (6 options)
- Color palette carousel
- Lighting carousel
- Camera moveset carousel
- AI Director toggle
- Manual Style toggle
- Variants counter (max 4)
- @ Mention button (for character refs)
- Aspect ratio dropdown (11 options — currently we have ~10)

#### Soul Studio (5 new inputs)
- 106-style picker (currently 33)
- 6 color presets picker
- Soul ID picker (custom_reference_id)
- Soul ID strength slider
- Soul variant toggle (soul-2 vs soul-cinematic)
- Width_and_height internal mapping (13 sizes)

#### Marketing Studio (8 new inputs)
- Hook picker (9 hooks)
- Setting picker (14 settings)
- Avatar picker (40 + custom)
- Product picker (per-user library)
- Web product picker (App Store URLs)
- Ad reference picker
- Mode dropdown (9 modes — currently maybe 4-5)
- enhanced_prompt display field
- URL Click-to-Ad input

#### Audio Studio (3 new inputs)
- Voice category sidebar (12 categories)
- Voice preview with waveform
- Voice cloning upload (30s+ sample)

#### General (cross-tool)
- Folder picker (organize generations)
- Project picker
- Inline `<<<uuid>>>` character refs in prompts
- Multi-shot prompt array
- speedramp dropdown
- multi_shot_mode dropdown

### 5.3 الكاتالوجات الجديدة (Catalogs to import)

1. **soul-styles.ts** — 106 styles (verbatim من Higgsfield public CMS)
2. **soul-color-presets.ts** — 6 presets (verbatim)
3. **soul-curated-presets.ts** — 21 in 3 themes
4. **cinema-cameras.ts** — 4 with UUIDs
5. **cinema-lenses.ts** — 6 with UUIDs
6. **cinema-focal-lengths.ts** — 6 mm positions
7. **cinema-apertures.ts** — 4 with UUIDs
8. **cinema-genres.ts** — 6 (Action, Horror, Comedy, Noir, Drama, Epic)
9. **motions.ts** — 359 motions (verbatim public CMS)
10. **marketing-hooks.ts** — 9 hooks بـverbatim prompts
11. **marketing-settings.ts** — 14 settings بـverbatim prompts
12. **marketing-avatars.ts** — 40 preset
13. **marketing-modes.ts** — 9 modes
14. **voices-categories.ts** — 12 voice categories
15. **ai-influencer-options.ts** — 22 subcategories × 143 options
16. **product-photoshoot-modes.ts** — 10 modes
17. **marketplace-asset-types.ts** — 13 asset types
18. **product-photoshoot-templates.ts** — system prompts لكل mode
19. **marketplace-cards-templates.ts** — system prompts لكل asset
20. **transitions-styles.ts** — توسيع من 12 (current) لـ20+

### 5.4 الـAPIs / Endpoints الجديدة

```
POST /api/llm/enhance              — generic Claude enhancer
POST /api/llm/director             — Cinema AI Director
POST /api/llm/marketing-enhance    — Marketing enhanced_prompt
POST /api/llm/product-photoshoot   — 10-mode product enhancer
POST /api/llm/marketplace-cards    — 13-asset enhancer
POST /api/llm/storyboard-extract   — multimodal storyboard parser
POST /api/llm/assist (streaming)   — chatbot

POST /api/soul-id/train            — Soul ID training (5-20 photos)
GET  /api/soul-id/list             — user's Soul IDs
GET  /api/soul-id/:id              — Soul ID status

POST /api/marketing/products/fetch — URL → product (scrape)
POST /api/marketing/products/create— manual product
POST /api/marketing/webproducts/fetch — App Store URL
POST /api/marketing/avatars/create — custom avatar (Soul ID-backed)
POST /api/marketing/ad-reference/create — upload reference video

POST /api/lipsync/speak            — image + audio → talking head
POST /api/lipsync/dubbing          — video + lang → dubbed
POST /api/lipsync/voice-change     — video + voice → merged

POST /api/image/topaz-redefine     — Topaz advanced upscale
POST /api/image/cinema-image-grid  — 9-shot Contact Sheet
POST /api/image/3d-convert         — image → 3D

POST /api/video/virality-predict   — brain_activity analysis
POST /api/video/multi-shot         — multi-prompt video

POST /api/ai-influencer/generate   — character builder generation
POST /api/product-photoshoot/generate — 10-mode product
POST /api/marketplace-cards/generate — 13-asset listings

POST /api/folders/create
GET  /api/folders/list
POST /api/projects/create
GET  /api/projects/list
```

### 5.5 الـDB Schema (Prisma) Additions

```prisma
model SoulId {
  id          String   @id @default(cuid())
  userId      String
  name        String
  variant     String   // "soul-2" | "soul-cinematic"
  status      String   // "queued" | "in_progress" | "completed" | "failed"
  inputImages Json     // array of CDN URLs
  modelUrl    String?  // trained model output URL
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}

model Avatar {
  id          String   @id @default(cuid())
  userId      String
  name        String
  type        String   // "preset" | "custom"
  imageUrl    String
  soulIdRef   String?  // optional Soul ID backing
  user        User     @relation(fields: [userId], references: [id])
}

model Product {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String?
  imageUrls   Json     // array
  source      String   // "url" | "manual" | "webproduct"
  url         String?
  status      String
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}

model AdReference {
  id          String   @id @default(cuid())
  userId      String
  videoUrl    String
  summary     String?
  createdAt   DateTime @default(now())
}

model Folder {
  id          String   @id @default(cuid())
  userId      String
  parentId    String?
  name        String
  createdAt   DateTime @default(now())
}

model Project {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  createdAt   DateTime @default(now())
}

model Generation {
  // existing fields ...
  folderId    String?
  projectId   String?
  status      String   // expand to: queued, in_progress, completed, failed, nsfw, ip_detected, canceled
  refundedAt  DateTime? // when credits returned
}
```

---

## 6) Honest Reality Checks

### 6.1 ما لن نطابقه 1:1 (مستحيل بدون paid extraction)

- **Hidden system_prompt strings** للـHelpers — هتفضل different (ولكن بـiteration على samples الموجودة هنقترب جداً)
- **Hidden prompt templates للـapps** — ~70 app templates مش معاهم real payload — هنحتاج نكتب مكافئاتنا
- **AI Director's vocabulary tables** — كيف Cinema يـmap UUIDs لـcinematic descriptors
- **Backend marketplace compliance rules** (Amazon-specific)

### 6.2 ما يمكن أن يطابق 1:1

- **All public catalogs** (motions 359, soul-styles 106, voices 82, ...): copy verbatim
- **All 9 hooks + 14 settings prompts**: extracted verbatim — copy as-is
- **Cinema Image Grid template**: extracted verbatim
- **Backend job_set_type params** (52 jst): real payloads documented
- **Camera/Lens/Focal/Aperture UUIDs**: extracted verbatim
- **AI Influencer's 143 options**: schema captured
- **Pricing structure**: 37 plans documented

### 6.3 الـMVP الأقل لـ"feels like Higgsfield"

لو ما عندناش وقت لكل الـ16 phase:

**MVP (Week 1-8):**
1. ✅ Phase 1 (Foundation: Claude + Topaz + ElevenLabs)
2. ✅ Phase 2 (Cinema Studio full parity)
3. ✅ Phase 3 (Soul Studio full parity)
4. ✅ Phase 4 (Marketing Studio full parity)

ده هيخلينا 70-80% parity perceived on the marquee features.

**MVP + Apps (Week 9-16):**
5. ✅ Phase 5 (Audio + Lipsync)
6. ✅ Phase 8 (Top 30 viral apps)

هنبقى عند 90% parity.

**Full parity (Week 17-26):**
7-16. باقي الـphases

---

## 7) ما المطلوب من المستخدم قبل البدء

1. **Anthropic API key** (للـClaude Opus 4.7) — كل الـHelpers تعتمد عليه
2. **Topaz Labs API access** (إذا متاح — أو نـskip Phase 1.2)
3. **Higher-tier Replicate / fal.ai account** (للـSoul ID training — DreamBooth/LoRA)
4. **Existing MuAPI account** (موجود)
5. **ElevenLabs API key** (موجود — needs voice cloning addon)
6. **Storage budget for Soul ID training data** (S3 / R2)
7. **DB migration approval** — Prisma schema يحتاج تعديل
8. **Decision على الـorder of phases** — هل نبدأ بـCinema (highest visible impact) أم AI Influencer (new market) أم Apps Library (volume)?

---

## 8) ملخص — ماذا اكتشفنا، ما يجب فعله

### اكتشافنا:
- Higgsfield = 5 طبقات (52 jst + 92 app + 16 studio + Claude layer + كاتالوجات ضخمة)
- ~98% من سطح Higgsfield وُثّق عندنا (1845 ملف، 34MB)
- Yilow الحالي ≈ 25-30% parity
- الفجوات الـcritical: Soul ID training, AI Director, AI Influencer, Product Photoshoot, Marketplace Cards, الـ66 viral app

### يجب فعله (priority-ordered):
1. **Phase 1** — infrastructure (Claude + Topaz + ElevenLabs full)
2. **Phase 2-4** — full parity على الـ3 ستديوهات الموجودة (Cinema, Soul, Marketing)
3. **Phase 5** — Audio family (Speak, Dubbing, Voice Change)
4. **Phase 6** — AI Influencer (new studio)
5. **Phase 7** — Edit Canvas (unify existing tools)
6. **Phase 8** — Top 30 viral apps
7. **Phase 9-10** — Product Photoshoot + Marketplace Cards (new studios)
8. **Phase 11-16** — كاتالوجات + Helpers + Routers + Library + MCP + Remaining apps

### الانتظار: 🔴 لا تنفذ كود حتى يقول المستخدم "go".

---

## المراجع (داخل `H:\Projects\Higgsfeild Docs\docs\higgsfield-research\`)

- **Master:** `00_INVENTORY.md`, `01_API_ARCHITECTURE.md`, `99_REAL_JOB_PARAMS.md`, `99_GAPS.md`
- **Studios:** `04_STUDIOS/*.md` (16 ستديوهات)
- **Base models:** `02_BASE_MODELS/*.md` (52 jst)
- **Apps:** `03_APPS_LIBRARY/*.md` (92 apps)
- **Catalogs:** `05_CATALOGS/*.md` (22 ملف)
- **Helpers:** `06_HELPERS/*.md` (8 ملف)
- **Filters & Pricing:** `07_FILTERS_AND_PROCESSING.md`, `08_PRICING.md`

---

**انتهى — في انتظار "go" من المستخدم لبدء التنفيذ.**
