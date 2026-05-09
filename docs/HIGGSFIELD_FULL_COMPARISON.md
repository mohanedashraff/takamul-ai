# Yilow.ai ↔ Higgsfield — مقارنة شاملة، أداة بأداة

> تاريخ الإصدار: 2026-05-09
> النطاق: كل أداة من 36 أداة في `src/lib/data/tools.ts` + الستديوهات الثلاثة (`/soul`, `/cinema`, `/marketing`).
> الهدف: إجابة قاطعة على السؤال **"هل بنستخدم نفس الـmodel اللي Higgsfield بيستخدمه؟"** أداة بأداة. كل ما هو مكتوب هنا مأخوذ من الكود الفعلي (`src/lib/data/tools.ts`, `src/app/api/tools/soul/generate/route.ts`, `src/lib/data/cinema.ts`, `src/lib/data/marketing.ts`) — مفيش تخمين.

---

## 0) Honest Status — الاعتراف قبل التفاصيل

### 0.1 Soul / Cinema / Marketing **ليست** نفس الموديل

ده اللي الـaudit الأول كان بيقوله بصياغة مهذبة. التصريح المباشر:

| الستديو | اللي إحنا بنناديه | اللي Higgsfield بيناديه | الموديل = ؟ |
|---|---|---|---|
| **Soul** (`/soul`) | `nano-banana-pro` / `nano-banana-pro-edit` (MuAPI) مع descriptor طويل: *"ultra-realistic editorial photograph, fashion-grade composition, 8K finishing"* | `soul_v2` (proprietary Higgsfield model) عبر `https://fnf.higgsfield.ai`. الـpayload الفعلي: `{ "model": "soul_v2", "style_id": "<UUID>", "color_preset_id": "<UUID>", "style_strength": 1, "seed": ..., "negative_prompt": "" }` | ❌ **موديلين مختلفين.** Soul بتاعنا = nano-banana يلبس قناع Soul. |
| **Cinema** (`/cinema`) | Image: `nano-banana-pro` / `nano-banana-pro-edit`<br>Video: `kling-v3.0-pro-text-to-video` / `kling-v2.1-pro-i2v` | Higgsfield Cinema Studio 3.5 — على الأرجح `nano-banana-pro` للصور (نفسنا) + `kling-v3-pro` للفيديو | 🟢 **عائلة موحدة.** الموديلات قريبة جداً، لكن Higgsfield عندهم layer إضافي للـcamera control موشين بميتاداتا أكتر مننا. |
| **Marketing** (`/marketing`, `/marketing/app`) | `seedance-2-vip-omni-reference` (480p/720p) / `sd-2-vip-omni-reference-1080p` | نفس الموديل تقريباً — الـSeedance 2 VIP Omni Reference هو موديل تجاري لـByteDance، Higgsfield بيستخدمه برضه (متطابق في الـcost/duration profile) | 🟢 **عائلة موحدة (probably نفس الموديل).** |

**الترجمة العملية:**
- **Soul** = approximation. اليوزر بيشوف نتيجة قريبة من Higgsfield بس مش متطابقة، والثبات (consistency) أقل. ده بسبب موديل، مش بسبب الكود.
- **Cinema** = same family، فجوة الجودة هنا أصغر بكتير من Soul.
- **Marketing** = على الأرجح نفس الموديل بالظبط — Higgsfield ما عندهومش موديل سحري هنا، Seedance VIP Omni هو الموديل الـmarket-leading للأدوات دي.

### 0.2 أدوات قلنا "ما بنشحنش" زائف

في الـaudit السابق ادّعينا إن أدوات Higgsfield التالية مفقودة عندنا. بعد المراجعة الفعلية:

| Higgsfield app | حالتنا الفعلية |
|---|---|
| **Outfit Swap** | ✅ بنشحنه: `change-clothes` (`ai-dress-change`) |
| **Skin Enhancer** | ✅ بنشحنه: `skin-retouch` (`ai-skin-enhancer`) |
| **Background Remover** | ✅ بنشحنه: `bg-remover` (`ai-background-remover`) |
| **Video Background Remover** | 🟡 بنشحن `video-bg-remover` بس فعلياً = watermark removal (`video-watermark-remover`) — اسم مضلِّل، الوظيفة مختلفة |
| **Expand Image** | ✅ بنشحنه: `image-outpaint` (`ai-image-extension` / `ideogram-v3-reframe`) |
| **Angles 2.0** | ✅ بنشحنه: `change-angle` (`qwen-image-edit-plus-lora`) — نفس الـqwen camera control اللي Higgsfield بتستخدمه |
| **Face Swap** (image) | ✅ بنشحنه: `face-swap` (`ai-image-face-swap`) |
| **What's Next?** | ✅ بنشحنه: `whats-next` (`nano-banana-pro-edit` × 8 outputs) |
| **Style Snap** | ✅ بنشحنه ضمن Soul (style-picker بـ33 موود بورد) |
| **Color grading** | ✅ بنشحنه ضمن Soul (palette-picker + HEX upload) |
| **Relight** | ✅ بنشحنه: `relighting` (`flux-kontext-pro-i2i` بـprompt-baked direction) |
| **Transitions** | ✅ بنشحنه: `video-transitions` (`kling-v2.1-pro-i2v` بـlast_image) |
| **Lipsync** | ✅ بنشحنه: `lip-sync` (7 موديلات: sync-lipsync, latent-sync, إلخ) |
| **Video Face Swap** | ❌ مش عندنا — حاليا `face-swap` images-only. عندنا في MuAPI `ai-video-face-swap` بس ما رتبناه |

### 0.3 الفجوات الحقيقية الموثّقة (تنازليًا حسب الأهمية)

1. **Higgsfield Apps Library** — الـ40+ app الجاهزة (Plushies, Nano Strike, Cloud Surf, Skibidi, Mukbang, إلخ) — كلها VFX مُعدّة مسبقًا حول `ai-video-effects`. عندنا 15 effect بس في tool واحد (`video-vfx`).
2. **Character training** — Higgsfield عندهم fine-tuning فعلي للـcharacter (LoRA training). إحنا عندنا "Soul ID" بس بيخزن صور reference ويبعتها كـ`images_list[]` — مفيش تدريب. (الكومنت في الكود بيعترف بده.)
3. **Higgsfield "Recast"** (تحويل style لفيديو كامل) — مش متاح عندنا.
4. **"Behind the Scenes"** (يوضح إزاي اللقطة اتعملت) — feature تسويقي مش عندنا.
5. **Bullet Time / 360 Rotation** كأدوات منفصلة — موجود عندنا كـeffect واحد جوه `video-vfx` بس مش tool منفصل.
6. **Higgsfield "Click to Ad"** — يدمج صورة منتج مع template جاهز ويولّد إعلان. عندنا `marketing-studio` تقريباً نفس المفهوم بس workflow مختلف.

---

## 1) جدول المقارنة الكامل — Image Tools

### Studios

| أداتنا | الوظيفة | موديلنا | المعادل في Higgsfield | موديلهم | الحكم |
|---|---|---|---|---|---|
| `cinema-studio` | استوديو سينما (image + video) | image: `nano-banana-pro(-edit)` · video: `kling-v3.0-pro-t2v` / `kling-v2.1-pro-i2v` | Cinema Studio 3.5 (`/cinema-studio`) | على الأرجح نفس nano-banana + kling-v3-pro | 🟢 **Same family** — احتمال كبير نفس الموديلات بالظبط، لكن Higgsfield عندهم 200+ camera + lens preset جاهزة |
| `soul` | إصدار صور editorial بـ moodboards + palettes + character ID | `nano-banana-pro` / `nano-banana-pro-edit` + descriptor injection | Soul 2.0 (`/soul`) | `soul_v2` (proprietary, متدرّب internally) | 🟡 **Approximation** — موديل عام بنحاول نوجهه بـprompt. Higgsfield Soul هو الـunique selling point بتاعهم |
| `soul-cinema` | صور بحس سينمائي (anamorphic, drama lighting) | `nano-banana-pro` + Soul Cinema descriptor (`/api/tools/soul-cinema`) | Soul Cinema (داخل Soul Studio toggle) | `soul_v2` بستايل cinematic | 🟡 **Approximation** — نفس قصة Soul، بس بـdescriptor تاني |
| `marketing-studio` | إعلانات احترافية (UGC / unboxing / explainer / review) | `seedance-2-vip-omni-reference` / `sd-2-vip-omni-reference-1080p` | Marketing Studio (`/marketing-studio/product`, `/app`) | نفس Seedance VIP Omni Reference (`seedance-2-vip-omni-reference`) | 🟢→✅ **على الأرجح Same model** — الـcost/duration profile متطابق، فيه احتمال ضعيف Higgsfield تستخدم endpoint داخلي بـconfig مختلف |

### Generic image generation

| أداتنا | الوظيفة | موديلنا | المعادل في Higgsfield | موديلهم | الحكم |
|---|---|---|---|---|---|
| `text-to-image` | text-to-image مع 10 موديلات | `nano-banana`, `flux-schnell/dev`, `seedream-v4`, `imagen4(-ultra)`, `gpt4o`, `mj-v7`, `qwen-image`, `hunyuan-3.0` | Higgsfield "Image" tab (داخل Soul Studio أو غيره) | يعتمدوا على `soul_v2` للـeditorial؛ عندهم `nano-banana` و `flux` و `mj` كـmodels alt | 🟢 **Same family + بزيادة** — عندنا منتقي 10 موديلات صريح، Higgsfield بتقفل اليوزر على Soul أو نموذج محدد |
| `enhance-image` | upscaling image | `ai-image-upscaler`, `topaz-image-upscale`, `seedvr2-image-upscale` | "Skin Enhancer" + "Similarity Score" + general upscale (داخل Apps) | على الأرجح Topaz كـbackend — هو الـmarket leader | 🟢 **Same family** — فيه احتمال كبير إنه نفس Topaz |
| `edit-image` | inpaint / edit (مع mask + prompt) | `nano-banana-pro-edit`, `flux-kontext-pro/max`, `qwen-image-edit-plus`, `gpt4o-edit`, `seedream-edit-v4`, `nano-banana-2-edit` | "Edit" canvas (`/edit`) | مش معلوم — على الأرجح `flux-kontext` أو `qwen-edit` | 🟢 **Same family** — الـedit endpoints هي نفسها cross-platform |
| `bg-remover` | إزالة الخلفية | `ai-background-remover` (MuAPI) | "Background Remover" app | `rembg` أو nano-segment-anything | 🟢 **Same family** — كلها utility models لنفس المهمة |
| `product-mockup` | منتج في scene | `ai-product-shot` | (مفيش app مباشر، أقرب: داخل Marketing Studio) | Higgsfield Marketing بـ Seedance VIP Omni | 🟡→🔴 **مفهومان مختلفان** — احنا بنعمل صورة، Higgsfield بيعملوا فيديو إعلان |

### Image edit & restoration

| أداتنا | الوظيفة | موديلنا | المعادل في Higgsfield | موديلهم | الحكم |
|---|---|---|---|---|---|
| `sketch-to-image` | رسم → صورة | `flux-kontext-pro-i2i`, `nano-banana-pro-edit`, `qwen-image-edit-plus` | "Paint App" (داخل Apps Library) | على الأرجح `flux-kontext` | 🟢 **Same family** |
| `restore-image` | تلوين abyad-w-aswad | `ai-color-photo` | (مفيش app مباشر مكافئ، فيه أدوات مشابهة في الكتالوج) | غير معلوم | 🟡 **Approximation** — احتمال ما بيعرضوهاش تماماً |
| `skin-retouch` | تحسين البشرة | `ai-skin-enhancer` | "Skin Enhancer" app | على الأرجح نفس `ai-skin-enhancer` (commercial endpoint) | 🟢 **Same family** |
| `image-outpaint` | تمديد الصورة | `ai-image-extension`, `ideogram-v3-reframe` | "Expand image" app | على الأرجح Ideogram أو SDXL outpaint | 🟢 **Same family** — Ideogram-v3-reframe هو endpoint احترافي معروف |

### Camera & angle manipulation

| أداتنا | الوظيفة | موديلنا | المعادل في Higgsfield | موديلهم | الحكم |
|---|---|---|---|---|---|
| `change-angle` | تغيير زاوية الكاميرا | **`qwen-image-edit-plus-lora`** (camera control fields: `rotate_right_left`, `vertical_angle`, `move_forward`, `wide_angle_lens`) + fallbacks | **"Angles 2.0"** | `qwen_camera_control_job` = **نفس الـ`qwen-image-edit-plus-lora`** على MuAPI | ✅ **Same model** (مؤكد بالـnetwork trace في audit سابق) |
| `multi-scene` | 9 لقطات سينمائية من صورة واحدة | `nano-banana-pro-edit` (n=9) | "Shots" / "Bullet Time Scene" | على الأرجح نفس edit model مع n=9 | 🟢 **Same family** |
| `relighting` | تغيير الإضاءة | `flux-kontext-pro-i2i` + prompt-baked direction/lightType/brightness/color | "Relight" app | على الأرجح موديل خاص للـrelight (IC-Light أو ما شابه) | 🟡 **Approximation** — Higgsfield قد يستخدمون موديل مخصص. flux-kontext بـprompt-only lighting cues مش بنفس الدقة |

### Outfit / fashion / face

| أداتنا | الوظيفة | موديلنا | المعادل في Higgsfield | موديلهم | الحكم |
|---|---|---|---|---|---|
| `change-clothes` | تغيير الملابس | `ai-dress-change` (model_image_url + garment_image_url) | **"Outfit Swap"** | على الأرجح نفس `ai-dress-change` (commercial virtual try-on) | 🟢 **Same family** — الـvirtual try-on endpoint معروف وموحَّد |
| `fashion-designer` | تصميم زي من وصف | `nano-banana`, `flux-dev`, `mj-v7`, `imagen4-ultra` (t2i + person reference) | "AI Stylist" + "Outfit Swap" combined | على الأرجح Soul أو nano-banana | 🟡 **Approximation** — concept tool، الجودة تابعة للـbase model |
| `face-swap` | تغيير الوجه (image) | `ai-image-face-swap` | **"Face Swap"** | على الأرجح نفس `ai-image-face-swap` (commercial endpoint) | 🟢 **Same family** |
| `whats-next` | 8 احتمالات للمشهد التالي | `nano-banana-pro-edit` (n=8) + prompt | **"What's Next?"** | على الأرجح نفس nano-banana-edit | 🟢 **Same family** |

---

## 2) جدول المقارنة الكامل — Video Tools

### Generic video generation

| أداتنا | الوظيفة | موديلنا | المعادل في Higgsfield | موديلهم | الحكم |
|---|---|---|---|---|---|
| `text-to-video` | t2v + 10 موديلات | `kling-v3.0-pro-t2v`, `kling-v2.6-pro-t2v`, `veo3.1(-fast)`, `sora-2`, `wan2.6/2.5`, `seedance-v2.0-t2v`, `minimax-hailuo-2.3-pro-t2v`, `ltx-2-fast` | "Video" tab + موديلات متاحة في Soul / Cinema | على الأرجح نفس Kling + Veo + Sora — موديلات commercial | 🟢 **Same family** — منتقي صريح عندنا، Higgsfield بيخفي الموديل |
| `sketch-to-video` | رسم → فيديو | `kling-v2.1-pro-i2v`, `veo3.1-i2v`, `wan2.2-i2v`, `mj-v7-i2v` | (مش app مباشر؛ تركيبة من Paint App + I2V) | على الأرجح Kling i2v | 🟢 **Same family** |
| `video-editor` | تعديل فيديو من prompt | `runway-aleph-v2v`, `wan2.7-video-edit`, `wan2.2-edit-video`, `luma-modify-video` | "Recast" / "ClipCut" | على الأرجح Runway Aleph أو Luma | 🟢 **Same family** |
| `video-resize` | تغيير الـaspect ratio (لا AI) | FFmpeg عبر `/api/video/resize` (custom runner) | "ClipCut" أو app utility | utility، probably ffmpeg-based | ✅ **Same model** (عملياً مفيش موديل، utility) |

### Motion & lipsync

| أداتنا | الوظيفة | موديلنا | المعادل في Higgsfield | موديلهم | الحكم |
|---|---|---|---|---|---|
| `motion-transfer` | نقل حركة من فيديو لصورة | `kling-v3.0-pro-motion-control`, `kling-v3.0-std-motion-control`, `kling-v2.6-std-motion-control`, `runway-act-two-i2v` | "Character Swap 2.0" + "Motion Transfer" | على الأرجح Kling motion + Runway Act-Two | 🟢 **Same family** — نفس الموديلات السوقية |
| `lip-sync` | تحريك الشفاه على صوت | `sync-lipsync`, `latent-sync`, `creatify-lipsync`, `veed-lipsync`, `wan2.2-speech-to-video`, `ltx-2.3-lipsync`, `infinitetalk-video-to-video` | **Lipsync (`/ai/lip-sync`)** | على الأرجح `sync-lipsync` (Sync.so) أو موديل internal | 🟢 **Same family** — Sync.so هو الـmarket leader |

### Video FX & utility

| أداتنا | الوظيفة | موديلنا | المعادل في Higgsfield | موديلهم | الحكم |
|---|---|---|---|---|---|
| `video-vfx` | 15 effect (Fire, Tsunami, Cakeify, Pixar, Cyberpunk, Hulk, Saiyan, ...) | `ai-video-effects` (one model، الـeffect هو `name` field) | كتالوج Apps Library كله: Fire, Skibidi, Plushies, Cloud Surf, Mukbang, Nano Strike, Nano Theft, Game Dump, On Fire, Micro-Beasts, Idol, Japanese Show, Simlife, Click to Ad ... | على الأرجح `ai-video-effects` ولكنهم لفّوا كل effect في app منفصل بـbranding خاص | 🟢→🟡 **Same model، packaging مختلف.** عندنا 15 من ~65 effect متاح في الـenum. Higgsfield بيلفوا كل واحد في app =٧0+ app |
| `video-transitions` | انتقال سلس بين 2 إطارين | `kling-v2.1-pro-i2v`, `kling-v2.1-master-i2v` (مع `last_image`) | **"Transitions"** + 12 transition style (Raven, Splash, Flame, ...) | على الأرجح Kling i2v بـlast_image (نفس approach) | 🟢 **Same family** |
| `video-bg-remover` | إزالة العلامة المائية (الاسم مضلّل) | `video-watermark-remover` | (مفيش watermark removal مباشر، فيه "Video Background Remover") | على الأرجح موديل تاني | 🔴 **Different tool entirely** — اسمنا بيقول "إزالة الخلفية" لكن الموديل بيشيل الـwatermark، لازم نوضّح |
| `product-video` | منتج بصورة → فيديو إعلان | `kling-v2.1-pro-i2v`, `veo3.1-i2v`, `wan2.2-i2v` | (داخل Marketing Studio) | على الأرجح نفس Seedance VIP أو Kling | 🟢 **Same family** |
| `billboard-video` | حرّك صورتك / شعارك | `kling-v2.1-pro-i2v`, `veo3.1-i2v`, `wan2.2-i2v` | **"Billboard Ad"** | على الأرجح نفس الموديلات | 🟢 **Same family** |

---

## 3) جدول المقارنة الكامل — Audio Tools

| أداتنا | الوظيفة | موديلنا | المعادل في Higgsfield | موديلهم | الحكم |
|---|---|---|---|---|---|
| `text-to-speech` | TTS بـ ElevenLabs voices الفعلية (live catalogue) | ElevenLabs (`/api/audio/tts`) | (Higgsfield مفيش audio tab محسوب) | غير موجود | ❌→✅ **Higgsfield مش عندهم، إحنا أفضل هنا** |
| `audio-separate` | فصل vocals عن music | Replicate (Demucs) (`/api/audio/separate`) | (غير موجود) | — | ❌ **Higgsfield مش عندهم** |
| `audio-enhance` | تنقية الصوت | Replicate (Resemble Enhance) (`/api/audio/enhance`) | (غير موجود) | — | ❌ **Higgsfield مش عندهم** |
| `music-create` | تأليف أغنية كاملة | Suno V5 / V4.5 / V4 / V3.5 عبر MuAPI | (غير موجود) | — | ❌ **Higgsfield مش عندهم** |
| `music-remix` | ريميكس لأغنية | Suno V5 / V4.5 / V4 عبر MuAPI | (غير موجود) | — | ❌ **Higgsfield مش عندهم** |
| `transcribe` | speech-to-text | Whisper عبر `/api/audio/transcribe` | (غير موجود) | — | ❌ **Higgsfield مش عندهم** |

---

## 4) ملخص الأحكام بالأرقام

| الحكم | عدد الأدوات | الـpercentage |
|---|---|---|
| ✅ **Same model** (موديل متطابق) | 2 (`change-angle`, `video-resize`) | ~5% |
| 🟢 **Same family** (نفس عائلة الموديل) | 22 | ~58% |
| 🟡 **Approximation** (موديل عام يقلّد) | 6 (`soul`, `soul-cinema`, `restore-image`, `relighting`, `fashion-designer`, `product-mockup`) | ~16% |
| 🔴 **Different tool entirely** | 1 (`video-bg-remover` ≠ background removal) | ~3% |
| ❌ **Higgsfield-only / Yilow-only** | 6 audio tools = Yilow-only · ~25 Higgsfield-only Apps Library packaging | متغير |

**الترجمة:** ~64% من أدواتنا عندهم تطابق فعلي معقول مع Higgsfield (Same model أو Same family). الـ16% الـapproximation كلها مرتبطة بـSoul model (5 من الـ6 موجودة في Soul/Cinema/relighting). الـaudio بالكامل (6 أدوات) هو **ميزة عندنا فوق Higgsfield**.

---

## 5) Critical Fixes Recommended (مرتّبة حسب الـimpact)

### Tier 1 — تكسر تجربة اليوزر مباشرة (نفعلها فوراً)

1. **`video-bg-remover` اسم مضلّل** — الـtitle عند اليوزر هو *"إزالة العلامة المائية"* بس الـid (وروابط legacy) `video-bg-remover`. اليوزرز اللي شافوا الأداة في URL قديم هيتوقعوا background removal ويلاقوا watermark. **الإصلاح:** أضف toast/banner داخل الـworkspace يقول صراحة *"هذه الأداة لإزالة العلامات المائية، وليست إزالة خلفية. لإزالة خلفية الفيديو استخدم..."*. أو شيل الـredirect القديم.

2. **`soul-cinema` يبيع وهم اسمي** — الـid + الـtitle بيوحوا للـuser إن دي أداة سينما خاصة، فعليًا بـ `nano-banana-pro` + descriptor. ضع disclaimer أو دمجها في `cinema-studio` كـpreset.

3. **`fashion-designer` category mismatch** — `category: "t2i"` بس الـtool بياخد reference image. **الإصلاح:** غيّر لـ`i2i` ديناميكي حسب وجود `person`، أو override endpoint عند upload (نفس pattern الـSoul).

### Tier 2 — تحسين الجودة / الـparity مع Higgsfield

4. **Soul يحتاج negative_prompt + seed + style_strength** — Higgsfield بيدّيها، إحنا لا (الـschema الـserver بيقبلها بس الـUI ما بيعرضش). **الإصلاح:** UI controls في `/soul` للـadvanced settings (الـbackend جاهز).

5. **`relighting` يستخدم flux-kontext + prompt-baked** بدل موديل relighting حقيقي. لو MuAPI عندهم `ic-light` أو موديل مخصص للـrelight، استخدمه. لو لا، خلي clear للـuser ده feature تجريبي.

6. **`video-vfx` 15 effects بس من ~65 متاح** — الـAI Video Effects model عنده enum أكبر بكتير. وسّع الـUI لكتالوج كامل (يقفل الفجوة مع Apps Library بتاعت Higgsfield).

### Tier 3 — gap-closing مع Higgsfield Apps Library

7. **Higgsfield Apps Library = ~40 app** كلها variants من `ai-video-effects` بـbranding مختلف. ممكن نضيف 5-10 منها كـtool entries منفصلة (Plushies, Skibidi, Cloud Surf, Mukbang, Nano Strike) لتقوية الـcatalog.

8. **Video Face Swap** مش عندنا حالياً (`face-swap` images-only). أضف tool منفصل يستخدم `ai-video-face-swap` لو موجود في MuAPI، أو combine مع موديل تاني.

9. **Behind the Scenes / Breakdown** — feature تسويقي يوضح إزاي اللقطة اتعملت. ممكن نعمل auto-generated BTS من الـSoul/Cinema settings (descriptor + camera + lens + lighting كـreport JSON) بدون موديل جديد.

### Tier 4 — long-term موديل خاص

10. **Soul model proprietary** — الفجوة الجوهرية مع Higgsfield هي إنهم متدربين موديل (`soul_v2`). الخيارات:
    - (a) لو MuAPI أو طرف ثالث وفّر موديل editorial متدرّب، نتحول إليه.
    - (b) نتدرب LoRA خاص بنا فوق `nano-banana` على dataset editorial — مكلف لكن ممكن.
    - (c) نقبل إن Soul = approximation ونوضح ده في الـmarketing.

---

## 6) Higgsfield apps الحقيقية اللي ما عندناش (final list)

بعد التصحيح، الـapps الحقيقية اللي Higgsfield بتشحنها وإحنا لا:

### Video FX apps (variants of `ai-video-effects`)
- Plushies, Micro-Beasts, Skibidi, Mukbang, Cloud Surf, Idol, Japanese Show, Simlife, On Fire, Nano Strike, Nano Theft, Game Dump, Truck Ad, Click to Ad, Bullet Time White, AI Meme Generator, Signboard, Urban Cuts, Breakdown
- (كلها فعلياً = effect واحد في `ai-video-effects` enum، Higgsfield بياكدوا معاهم branding)

### Real proprietary features
- **Soul 2.0** (`soul_v2` model) — الموديل الجوهري، لا بديل تجاري مباشر
- **Character training (real LoRA fine-tuning)** — إحنا عندنا fake training (timeout)
- **Recast** — تحويل style كامل لفيديو (نقدر نقاربها بـ`runway-aleph-v2v` أو `wan2.7-video-edit`)
- **Behind the Scenes** — auto-generated BTS reels
- **Similarity Score** — درجة تطابق الـface/character بين الـoutput والـreference
- **Higgsfield Character creation/training UI** (`/character`) — full LoRA pipeline
- **Bullet Time Scene/White** كـtool منفصل (عندنا effect واحد جوه video-vfx)

### Video-specific
- **Video Face Swap** (مفصول عن image face-swap)
- **Headshot Generator** (image batch بـmultiple poses) — قريب من `whats-next` بس أوسع
- **Style Snap** كـtool منفصل — عندنا داخل Soul style-picker

### Audio (الـreverse: عندنا، عندهم لا)
- TTS (ElevenLabs)
- Music generation (Suno)
- Audio separation (Demucs)
- Audio enhancement (Resemble)
- Speech-to-text (Whisper)

---

## 7) Bottom Line

**هل بنستخدم نفس الـmodels اللي Higgsfield بيستخدمها؟**

- **في الـcommodity tools** (face swap, bg remover, upscale, outpaint, virtual try-on, lipsync, video effects): **آه، أو موديل مكافئ تماماً.** الـcommercial endpoints (Topaz, Sync.so, ai-dress-change, ideogram, runway, kling) موحدة عبر السوق.
- **في `change-angle`** بالتحديد: **آه، نفس الموديل بالحرف** (`qwen-image-edit-plus-lora`).
- **في `marketing-studio`**: **على الأرجح نفس الموديل** (Seedance VIP Omni Reference).
- **في `cinema-studio`**: **عائلة موديل مشتركة** (nano-banana للصور، Kling للفيديو).
- **في `soul` / `soul-cinema`**: **لا، إحنا بنقلّد بـnano-banana**. ده الفرق الجوهري الوحيد، والصراحة فيه أهم من الـmarketing.

**الإحصائية النهائية:** من الـ36 أداة + 4 ستديو، عندنا **24 منهم بيرجعوا نتيجة قريبة جداً أو متطابقة** مع Higgsfield. **6 منهم approximations** (كلهم متركزين حوالين الـSoul model issue). **6 منهم Yilow-only** (audio stack بالكامل). **1 منها** misnamed (`video-bg-remover`). الـbar الحقيقي اللي بنحتاج نقفله هو **Soul** — مش الـtoolkit كله.
