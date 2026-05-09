# Phase 1 — Higgsfield Complete Inventory (Definitive)

> Source: مأخوذ مباشرة من الـrepos الرسمية المفتوحة لـHiggsfield على GitHub.
> ↳ `higgsfield-ai/cli` → `MODELS.md` (18 image + 16 video model)
> ↳ `higgsfield-ai/cli` → `README.md` (commands + skills)
> ↳ `higgsfield-ai/skills` → 4 SKILL.md (generate / soul-id / marketing / product-photoshoot)
> ↳ `higgsfield-ai/higgsfield-js` → SDK (auth + endpoint patterns)
>
> **مفيش تخمين هنا.** ده اللي Higgsfield نفسهم publish-وه.

---

## 0) الصورة الكلية

Higgsfield = **3 طبقات**:

```
┌───────────────────────────────────────────────────────────┐
│  Layer 3 (UI):  Apps Library + Studios + Marketing/Cinema │
│  ↓ تستخدم                                                  │
│  Layer 2 (Skills): generate / soul-id / marketing-studio  │
│              / product-photoshoot                          │
│  ↓ تستخدم                                                  │
│  Layer 1 (Models): 18 image + 16 video model               │
└───────────────────────────────────────────────────────────┘
```

- **Layer 1** = الموديلات الفعلية اللي بتنفذ التوليد (Soul V2, Veo 3.1, Kling 3.0, إلخ)
- **Layer 2** = الـskills اللي بتنادي على Layer 1 من Claude/Codex/CLI
- **Layer 3** = صفحات الـUI اللي اليوزر يشوفها — Apps Library فيها 50+ تأثير one-click، الستديوهات (Soul/Cinema/Marketing) لها workflows أعمق

---

## 1) Layer 1 — كل الموديلات (34 موديل)

### 1.1 Image Models (18)

| `job_set_type` | اسم الـmarketing | اللي بتعمله | Inputs |
|---|---|---|---|
| `nano_banana_2` | **Nano Banana Pro** | image gen عام (Google's flagship) | prompt + image (refs) + aspect_ratio (11 خيار) + resolution (1k/2k/4k) |
| `nano_banana_flash` | Nano Banana 2 | نسخة أسرع | نفس الحاجة - 5:4 |
| `nano_banana` | Nano Banana | الأساسية | نفس |
| `flux_2` | **FLUX.2** | flux generation (3 modes: pro/flex/max) | + model variant + 1k/2k |
| `flux_kontext` | Flux Kontext | edit + reference | prompt + image[] + aspect_ratio |
| `gpt_image_2` | **GPT Image 2** | OpenAI's image model | + quality (low/med/high) + batch_size + 4k support |
| `text2image_soul_v2` | **Higgsfield Soul V2** | الموديل الـproprietary للـeditorial. ياخد `--soul-id <UUID>` للـface consistency | prompt + soul-id + image (refs) |
| `seedream_v4_5` | Seedream 4.5 | ByteDance image | + quality (basic/high) |
| `seedream_v5_lite` | Seedream V5 Lite | نسخة أخف من Seedream 5 | + quality |
| `grok_image` | Grok Image | xAI's image model | + mode (std/pro) |
| `openai_hazel` | OpenAI Hazel | OpenAI experimental | + quality |
| `image_auto` | Image Auto | model selector تلقائي حسب الـprompt | prompt only |
| `z_image` | Z Image | Tencent's Z model | prompt only |
| `kling_omni_image` | Kling O1 Image | Kling's image model | + 9 aspect ratios + 1k/2k |
| `cinematic_studio_2_5` | Cinematic Studio 2.5 | الـ image variant من Cinema Studio | + 1k/2k/4k |
| `soul_cinematic` | Soul Cinematic | Soul + cinema descriptor | prompt + image |
| `soul_location` | **Soul Location** | يعدّل الـlocation/scene بالـprompt | prompt only (لا يحتاج صورة!) |
| `marketing_studio_image` | Marketing Studio Image | الـimage variant من Marketing | prompt + image + aspect_ratio (11 خيار) + 1k/2k/4k |

### 1.2 Video Models (16)

| `job_set_type` | اسم الـmarketing | اللي بتعمله | Inputs |
|---|---|---|---|
| `veo3_1` | **Google Veo 3.1** | flagship Google video | prompt + image (single) + duration 4/6/8 + quality basic/high/ultra + variant fast/preview |
| `veo3_1_lite` | Veo 3.1 Lite | نسخة أخف | + start/end image + audio |
| `veo3` | Google Veo 3 | الجيل السابق | image (required!) + variant fast/preview |
| `kling3_0` | **Kling v3.0** | الـflagship video | + start/end + audio + sound on/off + mode pro/std |
| `kling2_6` | Kling 2.6 Video | الجيل السابق | + image (single) + sound boolean |
| `seedance_2_0` | **Seedance 2.0** | ByteDance flagship video | + duration int + genre enum + mode std/fast + 480p/720p/1080p |
| `seedance1_5` | Seedance 1.5 Pro | السابقة | + 4/8/12s |
| `wan2_7` | Wan 2.7 | Alibaba | + 720p/1080p |
| `wan2_6` | Wan 2.6 Video | السابقة | + 5/10/15s + 720p/1080p |
| `minimax_hailuo` | Minimax Hailuo | MiniMax | + model variant (4 خيارات) + 512/768/1080 |
| `grok_video` | Grok Video | xAI | + duration int |
| `cinematic_studio_3_0` | **Cinematic Studio 3.0** | استوديو السينما الكامل | + start/end/image/video/audio inputs |
| `cinematic_studio_video` | Cinematic Studio Video | + sound + slow_motion booleans | |
| `cinematic_studio_video_v2` | Cinematic Studio Video V2 | + genre enum (auto/action/horror/comedy/western/suspense/intimate/spectacle) + mode pro/std | |
| `soul_cast` | Soul Cast | Soul-based casting | + budget integer |
| `marketing_studio_video` | **Marketing Studio Video** | الـbig one للإعلانات | + ad_reference_id + avatars[] + hook_id + setting_id + product_ids[] + mode (9 enums: ugc/ugc_how_to/ugc_unboxing/product_showcase/product_review/tv_spot/wild_card/ugc_virtual_try_on/virtual_try_on) + 480p/720p/1080p + generate_audio |

### 1.3 ملاحظات مهمة على الـModels:

1. **`text2image_soul_v2`** هو **الموديل الـproprietary الفعلي** بتاع Higgsfield. ده اللي بيدّيهم الميزة. الباقي كله موديلات تجارية متاحة لأي حد عبر MuAPI/OpenRouter/إلخ.

2. **`marketing_studio_video`** فيه **حقول structured فعلية** (hook_id, setting_id, ad_reference_id, avatars[]) — ده بيوضح إن النصوص اللي شفناها في الـUI (Hooks، Settings، Avatars) كلها UUIDs منفصلة بتُختار من picker، مش بتنحقن في الـprompt.

3. **`text2image_soul_v2`** بيقبل `--soul-id <UUID>` — ده الـcustom-references من `/v1/custom-references` (Soul Training).

4. **`veo3` يتطلّب image كـrequired** (image-to-video فقط). `veo3_1` و `veo3_1_lite` كل الـinputs اختيارية = text-to-video مع option للصورة.

5. **`soul_location` ما عندوش `--image` خالص** = غريب، بيشتغل من prompt بس ويولّد location/scene.

---

## 2) Layer 2 — الـ4 Skills الرسمية

من `skills` repo، فيه 4 sub-skills published:

### 2.1 `higgsfield-generate`
**الوظيفة:** أداة generic لكل أنواع التوليد (image / video / image-to-video / edit / Marketing Studio).
**Default models:**
- Images general: **GPT Image 2**
- Video: **Seedance 2.0**
- Reference work + character: **Nano Banana 2/Pro**
- Ads: **Marketing Studio**

**كمان بتشمل:** Soul V2 + Cinematic + Cast + Location + Kling 3.0 (للحالات المتخصصة).

**ميزة خاصة:** Virality Predictor — يحلل أي فيديو مكتمل ويقدّر probabilité الفيرالية.

### 2.2 `higgsfield-soul-id`
**الوظيفة:** تدريب Soul Character (face-faithful identity model). One-time training بـ5-20 صورة، ينتج `reference_id` (UUID) reusable في كل الموديلات اللي بتقبل `--soul-id`.

**Endpoint:** `POST /v1/custom-references` بـ`{name, input_images: [{type:"image_url", image_url}]}`.
**Polling:** يستمر دقايق. `higgsfield soul-id wait <id>`.

**Variants:**
- `--soul-2` للصور (default)
- `--soul-cinematic` للفيديو السينمائي

**يتطلّب:** خطة Basic+ (مدفوعة).

### 2.3 `higgsfield-marketing-studio`
**الوظيفة:** branded ads بـavatars + products + hooks + settings.

**Inputs:**
- `--prompt` (required)
- `--mode` (required, 9 enums محددة)
- `--avatars` (array of UUIDs from /avatars catalog)
- `--products` / `--web_product_ids` (array — product references مدخلة من URL)
- `--hook_id` (UUID من Hooks library)
- `--setting_id` (UUID من Settings library)
- `--ad_reference_id` (UUID لإعلان موجود يقلّده)
- `--generate_audio` (boolean)

### 2.4 `higgsfield-product-photoshoot`
**الوظيفة:** Brand image generation بـmode-specific enhancement. صور احترافية للمنتجات على خلفيات/مشاهد متنوعة.

**ملاحظة:** ما لقيتش تفاصيل deep في الـSKILL.md، بس واضح إنه specialized صور منتجات (مش فيديوهات).

---

## 3) Layer 3 — Apps Library (50+ One-click apps)

دي الـapps الجاهزة في `https://higgsfield.ai/apps`. كلهم بيتنفذوا فوق الـmodels في Layer 1 بـpresets محددة (model + prompt template + params).

### 3.1 Professional category

| App | الوظيفة | Underlying model (تخمين مبني على الـUX) |
|---|---|---|
| **Similarity Score** | يقارن صورتين | غير معروف — utility |
| **Expand image** | outpainting / reframing | flux أو nano-banana edit |
| **Angles 2.0** | تغيير زاوية الكاميرا | `qwen_camera_control_job` (شدّيناه live من network) |
| **Shots** | 9 shots متمّيزة من صورة واحدة | image-edit بـ9 prompts متتابعة |
| **Transitions** | انتقالات فيديو بين 2 إطار | `kling-v2.1-pro-i2v` بـlast_image |

### 3.2 Enhance & Style

| App | الوظيفة |
|---|---|
| **Skin Enhancer** | تحسين بشرة (specialized) |
| **AI Stylist** | AI fitting room (تجريب outfits متعددة) |
| **Relight** | تعديل اتجاه/لون/سطوع الإضاءة |
| **Color Grading** | color correction احترافي |
| **Style Snap** | style transfer من صورة لأخرى |
| **Outfit Swap** | تبديل ملابس واحد |

### 3.3 Face & Identity

| App | الوظيفة |
|---|---|
| **Face Swap** | تبديل وجه (image) |
| **Headshot Generator** | صور سيرة ذاتية احترافية |
| **Character Swap 2.0** | تبديل شخصية في الفيديو |
| **Recast** | character swap للفيديو (industry-leading) |
| **Video Face Swap** | تبديل وجه في فيديو |

### 3.4 Video Editing

| App | الوظيفة |
|---|---|
| **ClipCut** | Selfie → outfit-changing video |
| **Urban Cuts** | beat-synced outfit cuts |
| **Video Background Remover** | إزالة خلفية فيديو حقيقية |
| **Breakdown** | تقسيم صورة لمكوّناتها |
| **Behind the Scenes** | لقطات BTS من صورة |
| **Zooms** | زوم سينمائي |

### 3.5 Ads & Products

| App | الوظيفة |
|---|---|
| **Click to Ad** | product link → UGC ad video |
| **Billboard Ad** | صورة → ad على بيلبورد ضخم |
| **Bullet Time Scene** | spin around منتج |
| **Truck Ad** | logo على شاحنة متحركة |
| **Bullet Time White** | bullet time على خلفية بيضا |
| **Signboard** | mural/wall projection |
| **Japanese Show** | retro Japanese commercial |

### 3.6 Games & Characters

| App | الوظيفة |
|---|---|
| **Game Dump** | تحويلك لـ12 character من ألعاب |
| **Nano Strike** | AI tactical shooter clip |
| **Nano Theft** | open-world game scene |
| **Simlife** | Sims-style stylization |
| **Plushies** | تحويل صورتك لدمية |

### 3.7 Extras (viral apps)

| App | الوظيفة |
|---|---|
| **AI Meme Generator** | memes |
| **Background Remover** | utility |
| **Micro-Beasts** | محاط بحيوانات لطيفة |
| **Paint App** | retro paint style |
| **On Fire** ("This Is Fine") | أنت في حريق هادئ (meme) |
| **Skibidi** | Skibidi Toilet meme |
| **Mukbang** | viral mukbang clip |
| **Cloud Surf** | dream cloud surfing |
| **Idol** | K-pop idol |

### 3.8 ملاحظة على Apps:
**كل أداة في Apps Library = preset على top of Layer 1 model.** يعني مفيش "Plushies model" منفصل — هو على الأرجح `nano_banana_flash` أو `flux_kontext` بـsystem prompt + reference image hardcoded.

---

## 4) Layer 3 (cont.) — Studios + Special Surfaces

غير الـapps، فيه surfaces رئيسية في الـUI:

| Surface | الـURL | اللي بيعمله |
|---|---|---|
| **Soul Studio** | `/soul`, `/ai/image?model=soul-v2` | الواجهة الفاخرة لـ`text2image_soul_v2` — moodboards (33) + color palettes (6) + Soul ID picker |
| **Cinema Studio** | `/cinema-studio` | Image + Video toggle، 200+ camera/lens presets، AI Director |
| **Marketing Studio** | `/marketing-studio/product`, `/marketing-studio/app` | Avatars + Products + Hooks + Settings |
| **Edit** | `/edit` | Canvas editor (inpaint + edit) |
| **Character** | `/character` | Soul ID training UI |
| **Canvas** | `/canvas` | Multi-clip composition |
| **Collab** | `/collab` | Team workspace |
| **MCP & CLI** | `/mcp`, `/cli`, `/skills` | Developer integrations |
| **Originals** | `/originals` | Higgsfield's curated content |
| **Assist** | `/assist` | AI assistant chatbot |
| **Audio** | `/audio` | (مش متاح بدون Pro?) — لم نفحصه بعد |

---

## 5) Higgsfield API Endpoint Pattern

من الـSDK:

**Auth:**
- v1: headers `hf-api-key: <KEY>` + `hf-secret: <SECRET>`
- v2: `Authorization: Key <KEY_ID>:<KEY_SECRET>`

**Endpoints:**
- v2 generic: `POST /<provider>/<model>/<variant>/<task>` (e.g. `flux-pro/kontext/max/text-to-image`)
- v1 specialized: `POST /v1/image2video/dop` (DOP = Director of Photography = camera control)
- Soul training: `POST /v1/custom-references`
- List Soul IDs: `GET /v1/custom-references/list`
- Polling: `GET /requests/<request_id>/status`

**Job lifecycle:** `queued` → `in_progress` → `completed` / `failed` / `nsfw` / `canceled`

**Result shape:** `{ jobs: [{ id, status, results: { raw: { url }, min: { url } } }] }`
- `raw` = full quality
- `min` = thumbnail

---

## 6) إجمالي الموارد المتاحة

- **34 موديل أساسي** (18 image + 16 video)
- **4 skills** عبر CLI/MCP
- **50+ app** preset في Apps Library
- **4 studios** كبار (Soul, Cinema, Marketing, Edit)
- **2 utility surfaces** (Character training, Canvas)

---

## 7) ✅ موافق على الـPhase 1؟

ده الـbaseline. الـPhase 2 الجاي:

**Per-tool deep-dive:** هاخد كل أداة عندنا بالترتيب وأقارنها بالـHiggsfield equivalent — موديلهم بالظبط، الـprompt structure، الـparams، الـhelpers، نقطة لنقطة. 36 أداة × 5-10 دقايق تحليل = 4-6 ساعات شغل موزّع على عدة rounds.

**لو موافق، قول لي:**
1. أبدأ بأي قسم؟ (Image / Video / Audio / Studios)
2. ولا أبدأ بأكتر أدواتنا "مكسورة" أولاً؟
3. التكلفة: لو احتجت أعمل توليد فعلي على Higgsfield (بعض الـpayloads ما بتظهرش بدون trigger)، فيه مشكلة؟ (لكن دلوقتي مع GitHub repos، 90% من الـdata موجودة بدون trigger)
