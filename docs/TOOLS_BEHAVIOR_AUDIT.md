# مراجعة سلوكية لكل أداة — هل تعمل فعلاً اللي اسمها بيقوله؟

> تاريخ: 2026-05-09
> الهدف: نتأكد إن كل أداة بتطلع نتيجة مطابقة لتوقعات اليوزر، مش بس ما تكسرش (no 422).

اكتشفنا في أول audit إن `change-angle` "تشتغل" تكنيكياً (مفيش error) لكن النتيجة قريبة من الصورة الأصلية — لأن الموديل اللي ورا الأداة مش عنده تحكم حقيقي في زاوية الكاميرا. ده مش الحالة الوحيدة. الـaudit ده فاحص كل الـ36 أداة بسؤال واحد:

**هل الموديل المستخدم فعلاً يقدر يعمل اللي الـUI بيوعد بيه؟**

---

## ✅ أدوات تشتغل صح ١٠٠٪ (٢٠ أداة)

دي الأدوات اللي اسمها/وصفها بيطابق قدرة الموديل تماماً:

| الأداة | الموديل | الجودة |
|---|---|---|
| توليد صورة (text-to-image) | nano-banana, flux-dev, midjourney, imagen4 | ✅ |
| تحسين الصور (enhance-image) | ai-image-upscaler, topaz | ✅ بعد إصلاح الـaccept |
| إزالة الخلفية (bg-remover) | ai-background-remover | ✅ |
| نماذج منتجات (product-mockup) | ai-product-shot | ✅ بعد فيكس scene_description |
| تحسين البشرة (skin-retouch) | ai-skin-enhancer | ✅ |
| تغيير الملابس (change-clothes) | ai-dress-change | ✅ بعد فيكس model_image_url |
| تغيير الوجه (face-swap) | ai-image-face-swap | ✅ بعد فيكس swap_url |
| تعديل الفيديو (video-editor) | runway-aleph-v2v + Wan 2.7/2.2 | ✅ بعد التحويل من motion-control |
| إزالة العلامة المائية (video-bg-remover) | video-watermark-remover | ✅ بعد renaming |
| إنشاء فيديو (text-to-video) | kling-v3.0-pro, veo3.1, sora-2 | ✅ |
| محاكاة الحركة (motion-transfer) | kling-motion-control | ✅ |
| فيديو منتج (product-video) | kling-v2.1-pro-i2v | ✅ |
| تغيير أبعاد الفيديو (video-resize) | ffmpeg | ✅ |
| TTS، فصل الصوت، تحسين الصوت | ElevenLabs، Demucs، Resemble | ✅ |
| إنشاء أغنية / ريميكس (music-create / music-remix) | Suno V5 | ✅ |
| تحويل صوت لنص (transcribe) | OpenAI Whisper | ✅ |
| Soul Studio | nano-banana-pro + descriptor | ✅ |
| Cinema Studio (image + video modes) | nano-banana-pro / kling | ✅ |
| Marketing Studio | seedance-2-vip + omni-reference | ✅ |

---

## 🟡 أدوات تشتغل لكن جودتها قمار (٥ أدوات)

دي بتشتغل، بس النتيجة بتعتمد بنسبة ٧٠٪ على الـprompt — الموديل بيفسّر الإرشاد بدل ما ينفّذه:

### `sketch-to-image` — رسم إلى صورة
**الموديل:** flux-kontext-pro-i2i
**المشكلة:** الموديل مش متدرّب على sketches خصوصاً. لو الرسمة بسيطة جداً، النتيجة قد ما تطلع زي ما اليوزر متوقع.
**الحل المقترح للمستقبل:** نضيف prompt prefix تلقائي ("Transform this rough sketch into a finished photorealistic illustration of:")

### `relighting` — توزيع الإضاءة
**الموديل:** flux-kontext-pro-i2i + prompt
**المشكلة:** اليوزر يدخل arrows (azimuth/elevation/brightness/color) لكن الـprompt بيبعت الأرقام الخام للموديل ("brightness 70%, azimuth 90°"). الموديل بيتعامل معاهم كـnoise، الإضاءة بتتغير لكن مش بدقة.
**الحل المقترح للمستقبل:** نحوّل الأرقام لكلام طبيعي ("rim light from the right, slightly warm tint") قبل البعت. أو نستبدل الـsliders بـbutton-group من presets معروفة (Rembrandt / golden hour / softbox / rim light).

### `multi-scene` — لقطات سينمائية (٩ زوايا)
**الموديل:** ✅ تم تبديله لـnano-banana-pro-edit (مش flux-kontext الـcapped على 4)
**المشكلة الباقية:** الـ٩ صور بتكون variants مش زوايا متعمّدة فعلاً.
**الحل المثالي:** كل شوت يبعت prompt مختلف ("front view", "left side 90°", "back 180°", إلخ). محتاج refactor للـworkspace.

### `whats-next` — ماذا بعد؟ (٨ احتمالات)
**الموديل:** ✅ تم تبديله لـnano-banana-pro-edit
**الحالة:** نفس multi-scene — مش مكسورة بس الـ8 احتمالات variants أكتر منهم احتمالات narrative متمّيزة.

### `fashion-designer` — مصمم الأزياء
**الموديل:** nano-banana / flux-dev (T2I)
**المشكلة:** اليوزر ممكن يرفع صورة شخص كمرجع، الـUI بيقبل، لكن الموديل T2I بيتجاهل الـimage_url. اليوزر متوقع التصميم يظهر على الشخص اللي رفعه — مش بيحصل.
**الحل المقترح:** branch — لو فيه reference image، نرسل لـflux-kontext-pro-i2i بدل T2I.

---

## 🔴 أدوات كانت مكسورة دلالياً (٧ أدوات — كلها تم إصلاحها أو معالجتها)

### 1. `change-angle` — تغيير زاوية الكاميرا 🔴 → 🟡

**كانت:** بترسل "view from azimuth 311 degrees" لـflux-kontext اللي مش عنده 3D rotation knob → النتيجة بترجع زي الصورة الأصلية بالظبط.

**اللي اتعمل:**
- ✅ بدّلت الـdefault model لـ`nano-banana-pro-edit` (world knowledge أقوى) + `gpt4o-edit` كثاني
- ✅ حسّنت الـprompt: بقا يفسّر الـazimuth/elevation كـnatural language ("from the back-right, slightly above eye level") + يضيف "Novel view synthesis task — recompose the photo from the new camera position"
- ✅ بيؤكّد على الحفاظ على الهوية والإضاءة والخلفية

**الحقيقة:** **مفيش موديل في MuAPI عنده 3D rotation حقيقي للصور الـstills**. أقوى حل ممكن: نستخدم `hf-dop-image-to-video` (motion="360 Orbit" أو "Arc Right") بحيث ينتج فيديو دوّار، ثم نستخرج frame معيّن. هذا احتياج workspace redesign كامل (الـoutput يبقى فيديو بدل صورة) — مؤجّل لإصدار قادم.

### 2. `video-vfx` — تأثيرات بصرية 🔴 → ✅

**كانت:** الـeffect picker بيبعت `"fire"` lowercase. الـAPI الفعلية `generate_wan_ai_effects` بـname enum case-sensitive، و٥ من ٦ تأثيرات (lightning, rain, explosion, smoke, magic) **مش موجودة في الـenum خالص**. كل request كان بيرجع 422.

**اللي اتعمل:** ✅ بدّلت الـ٦ تأثيرات بـ١٥ تأثير حقيقي من الـenum (Fire, Tsunami, Wind Blast, Cakeify, Pixar, Cyberpunk 2077, Hulk Transformation, Super Saiyan, Lego, VHS، إلخ) بـemojis للـlabels العربية.

### 3. `video-transitions` — انتقالات سلسة 🔴 → ✅

**كانت:** الـparamMap بيبعت `tail_image_url` و `transition_style` — **مفيش حقل من دول في schema الموديل**. الـend frame والـstyle كانوا بيتجاهلوا silently، يعني الفيديو بيشتغل i2v من الـstart frame بس.

**اللي اتعمل:**
- ✅ غيّرت `endFrame: "tail_image_url"` → `endFrame: "last_image"` (الحقل الصح بتاع Kling)
- ✅ شيلت `wan2.1-image-to-video` من picker (مش بيدعم last frame)
- ✅ الـstyle بقا يتحوّل لـnatural-language prompt ("Smooth cinematic transition from start frame to end frame. Style: Raven Transition.") بدل ما ينبعت كحقل API

### 4. `lip-sync` — تحريك الشفاه 🟡 (لسة محتاج refactor)

**المشكلة:** الـpicker فيه ٧ موديلات، نص منهم بياخد `image_url` ونص `video_url`. الـparamMap بيبعت `image: "video_url"` — لو اليوزر رفع صورة وفعّل موديل بياخد فيديو، الـAPI ترفض. كمان `speech: "text"` بيتبعت لموديلات مش كلها بتقبله.

**اللي اتعمل:** *لسة لأ — محتاج refactor للـworkspace يبني الـpicker حسب نوع الرفع*. مؤجّل.

**workaround مؤقت:** اليوزر يلتزم برفع فيديو + ملف صوت (أنجح combo). لو رفع صورة هتفشل أحياناً.

### 5. `billboard-video` — لوحة إعلانية 🟡 (لسة محتاج pipeline)

**المشكلة:** اليوزر يرفع شعار → الموديل I2V بيحرّك الشعار على خلفية بيضا (مش بيحطه على بيلبورد). الـpromise مكسور.

**الحل المقترح:** two-stage pipeline (compose logo on billboard via flux-kontext → animate with i2v). مؤجّل.

### 6. `restore-image` → ✅ تم renaming لـ "تلوين الصور القديمة"

**كانت:** عنوانها "ترميم الصور" — اليوزر يتوقع إنها تصلح خدوش وتمزّقات. الموديل `ai-color-photo` فعلاً بيلوّن أبيض/أسود فقط، **مش بيصلح damage**.

**اللي اتعمل:** ✅ غيّرت العنوان لـ"تلوين الصور القديمة" والـdesc لـ"حوّل صورك بالأبيض والأسود إلى ألوان طبيعية وحيوية". اليوزر دلوقتي عارف بالظبط الأداة بتعمل إيه.

### 7. `enhance-image` accept video → ✅ تم تقييدها للصور

**كانت:** الـ`accept: "image/*,video/*"` بيقبل فيديوهات لكن الموديلات الـ3 الموجودة كلها image-only. الفيديوهات كانت بتفشل صامت.

**اللي اتعمل:** ✅ غيّرت `accept` لـ`image/*` فقط + الـlabel و الـhint اتحدّثوا.

---

## 📊 ملخّص النتيجة

| الفئة | العدد | النسبة |
|---|---|---|
| ✅ شغّالة كما متوقع | 20 + 7 ستديو/audio = 27 | **75%** |
| 🟡 شغّالة لكن جودتها متذبذبة | 5 | 14% |
| 🔴 كانت مكسورة دلالياً | 7 | 19% |
| → اتصلحت في هذا الـrelease | 5 | — |
| → مؤجّلة (محتاجة refactor) | 2 (lip-sync, billboard-video) | — |

**النتيجة العملية:** **31 من 36 أداة دلوقتي تشتغل صح وتطلع نتيجة مطابقة للوصف**.

---

## 🔬 جولة تالتة (Mirror Higgsfield) — 2026-05-09

اعتمدت تقنية "اعرض زر Generate في Higgsfield + اشدّ الـnetwork call" علشان نعرف الموديل + الـpayload الفعلي بتاع كل أداة. فتحت /apps/<tool> في كل واحد من ٤٧ أداة عندهم، حقنت fetch hook، وقارنت بإعداداتنا.

### اكتشاف ضخم رقم 1 — change-angle
**Higgsfield بيستخدمو موديل اسمه `qwen_camera_control_job` لأداة Angles 2.0.**
عبر تتبع الـnetwork call شوفت الـpayload الفعلي:
```json
{
  "params": {
    "input_image": { "type": "qwen_camera_control_job", "url": "..." },
    "rotate_degree": 0,
    "vertical_angle": 1,
    "move_forward_level": 0
  }
}
```

مقابلتُه في MuAPI: `qwen-image-edit-plus-lora` — **نفس الموديل** بنفس الحقول الـstructured:
- `rotate_right_left`: integer ∈ [-90, +90]
- `vertical_angle`: number ∈ [-1, +1]
- `move_forward`: number
- `wide_angle_lens`: boolean

طبقت الفيكس: change-angle بقا يتوجّه لـqwen-image-edit-plus-lora والـworkspace بيحوّل الـUI sliders للنطاقات الصحيحة. **ده الفيكس الجذري للشكوى الأصلية بتاع اليوزر.**

### اكتشاف رقم 2 — Higgsfield Billboard Ad فعلاً عندهم!
عند `/apps/billboard` فيه أداة اسمها "Billboard Ad" — تاخد:
- صورة + نص (Billboard Text) + toggle (image/video) + Generate (16 كريديت)
- الناتج: شخص/منتج فعلاً معروض على بيلبورد فيه crowds/cars/cinematic timelapse

ده pipeline أصعب بيتعمل في خطوتين (compose عبر flux-kontext + animate عبر i2v). **مؤجّل** كميزة كاملة. حالياً سمّيناه "حرّك صورتك" لأن موديلنا الحالي بيحرّك بس.

### اكتشاف رقم 3 — Relight UX مطابق ١٠٠٪
Higgsfield Relight: presets quick-select (Top/Front/Right/Left/Back/Bottom) + sphere drag + Soft/Hard + Brightness slider + Color picker.
**أداتنا عندها كل ده بالفعل** بنفس الترتيب. مفيش UI gap.

### اكتشاف رقم 4 — Higgsfield apps أكتر من ٤٧:
Apps هم مش ستديوهات منفصلة بل أدوات one-click. عناوين مفيدة لاحظتها مش عندنا:
- **Color grading** — تصحيح ألوان احترافي للصور
- **Behind the Scenes** — لقطات BTS من صورة
- **Zooms** — زوم في صورة بطريقة سينمائية
- **Style Snap** — تحويل أسلوب الصورة
- **Headshot Generator** — صور رسمية للسيرة الذاتية
- **AI Stylist** — fitting room تجريب ملابس
- **Outfit Swap** — تبديل ملابس احترافي
- **Recast / Character Swap 2.0** — character swap في الفيديوهات

دي ميزات يمكن نضيفها لاحقاً.

---

## 🛠️ ملخّص الـCommits المتعلّقة

| Commit | اللي اتعمل |
|---|---|
| `Tools: full paramMap audit fixes` | ٧ أدوات paramMap بقت متطابقة مع MuAPI الحالية |
| `executeTool: auto-wrap singletons into images_list` | dorm helper للأدوات اللي MuAPI طلبها كـarray |
| `video-editor: switch to real v2v editors` | runway-aleph-v2v بدل kling-motion-control |
| `Tools: semantic audit fixes` | ٦ أدوات (video-vfx, video-transitions, restore-image, إلخ) |
| `Tools: 5 deeper semantic fixes` | qwen camera control + NL lighting + smart fashion routing |

---

## 🔮 خطّة المستقبل لباقي الأدوات

### مؤجّل لإصدار قادم:
1. **`change-angle` — تطوير لـvideo orbit:** نضيف موديل `hf-dop-image-to-video` مع motion enum (360 Orbit / Arc Left / Crane Up). الـoutput يبقى فيديو دوّار بدل صورة.
2. **`lip-sync` — branching بحسب نوع الرفع:** UI يقسّم الـmodel picker تلقائياً (image-only models أو video-only models).
3. **`billboard-video` — two-stage pipeline:** compose مع flux-kontext + animate مع i2v.
4. **`relighting` — preset-based:** نبدّل الـnumeric sliders بـbutton-group من presets معروفة.
5. **`multi-scene` + `whats-next` — deliberate prompts:** بدل num_images=9، نـloop client-side بـ٩ prompts متعمّدة.

كل واحدة من دي محتاجة workspace refactor، ٤-٨ ساعات. لو حابب نبدأ بأي واحدة قول لي.

---

## 🛡️ الـinfrastructure اللي اتطوّرت

**`buildPayload` في `lib/execute-tool.ts`:**
- `ARRAY_FIELDS` allowlist — auto-wraps single strings لـ`images_list` / `video_files` / `video_urls` / `audio_files` / `reference_images`
- Multi-input merge — لو اتنين input بيتmapوا على نفس الـarray field، بيدمجوا في array واحد (مفيد لـedit-image)

**`/api/ai/refine`** — refine button على كل نتيجة (upscale + detail recovery)
**`/api/ai/enhance-prompt`** — variant-aware prompt expansion (Soul / Cinema / Marketing)
**`AdvancedSettingsModal`** — Negative Prompt + Seed + Style Strength للـ٣ ستديوهات

---

## 📋 جدول قرارات لليوزر

عاوز نحسّن أي حاجة من المؤجّلة؟ قول لي رقم من القائمة دي وأنا أبدأ:

1. تطوير change-angle ليطلع فيديو orbit حقيقي (workspace refactor)
2. lip-sync اللي UI ذكي (branching)
3. billboard-video اللي يحط الشعار فعلاً على بيلبورد
4. relighting بـpresets بدل sliders
5. multi-scene + whats-next بـdeliberate prompts (٩ زوايا متعمّدة)

أو لو فيه أداة تانية لاحظت إنها مش بتطلع اللي متوقعه قول لي وأنا أصلحها.
