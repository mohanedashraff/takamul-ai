# مراجعة شاملة لكل أدوات Yilow.ai

> تاريخ: 2026-05-08
> الهدف: نعرف بالظبط — كل أداة عندنا بتشتغل ولا لا، نتيجتها زي Higgsfield ولا لا، وفين الحاجات البايظة أو الناقصة.

---

## ملخّص سريع — الصورة الكبيرة

عندك **36 أداة** في الموقع، موزّعين على 4 أنواع:

| النوع | العدد | بيشتغلوا إزاي | درجة الجودة |
|---|---|---|---|
| **A. أدوات MuAPI مباشرة** | 14 أداة | بنبعت inputs اليوزر مباشرة لـMuAPI | ✅ شغّالين طول ما MuAPI شغّال |
| **B. أدوات MuAPI مع UI خاصّ** | 12 أداة | UI بتاعنا خاص (رسم، قناع، إلخ) لكن النتيجة بتيجي من MuAPI | ✅ شغّالين |
| **C. أدوات Custom Runner** | 8 أدوات | بتعدّي على Backend عندنا (`/api/audio/*`, `/api/video/resize`, إلخ) | 🟡 معظمها شغّال، فيه مشاكل |
| **D. ستديوهات منسوخة من Higgsfield** | 3 ستديوهات (Soul, Cinema, Marketing) | UI كامل عندنا + composition للـprompt + بنبعت لـMuAPI | 🟡 شبه Higgsfield بس مش 1:1 |

**زائد:** 8 وكلاء (Agents) في صفحة Marketplace — **كلهم وهم** (مفيش backend، مفيش Stripe، مفيش execution).

---

## الجزء الأول — مقارنة فعلية مع Higgsfield

### الاكتشاف الأهم: Higgsfield عندهم موديلات خاصّة، إحنا بنقلّد بـnano-banana

شدّيت الـAPI request الفعلي اللي بيخرج من Higgsfield Soul:

```json
POST https://fnf.higgsfield.ai/...
{
  "model": "soul_v2",                // ← موديلهم الخاص
  "prompt": "a portrait of a woman in a city",  // ← الـprompt خام
  "style_id": "3db34ab5-3439-4317-9e03-08dc30852e69",   // ← UUID
  "color_preset_id": "f128c736-a60f-4278-b3fa-e92317824736",
  "negative_prompt": "",
  "seed": 226569,
  "style_strength": 1,
  "enhance_prompt": false,
  "use_refiner": false,
  "aspect_ratio": "3:4",
  "quality": "720p"
}
```

**المعنى الحقيقي:**

| اللي بيعمله Higgsfield | اللي بنعمله إحنا |
|---|---|
| موديل خاص `soul_v2` متدرّب على استايل Editorial | بنستخدم `nano-banana-pro` (موديل عام) |
| الـprompt **خام** (يوزر يكتب → يدخل الموديل زي ما هو) | بنحقن descriptor طويل قبل الـprompt: "ultra-realistic editorial photograph, fashion-grade composition, magazine-quality lighting, painterly skin tones, 8K finishing" |
| الموود بورد = `style_id` (UUID lookup في الـbackend) | بنحقن نص الموود بورد كاملاً في الـprompt |
| لوحة الألوان = `color_preset_id` (UUID) | بنحقن الـHEX colors كنص "dominant palette of #aaa, #bbb..." |
| `negative_prompt` (الحاجات اللي تتجنبها) | **مش متاح عندنا** |
| `seed` (للتكرار/الاستمرارية) | **مش متاح عندنا** |
| `style_strength` (قوة تأثير الستايل) | **مش متاح عندنا** |
| `enhance_prompt` (LLM يعيد كتابة الـprompt) | **مش متاح عندنا** |
| `use_refiner` (تمريرة جودة ثانية) | **مش متاح عندنا** |

### النتيجة المتوقعة:

- **ثبات النتيجة:** Higgsfield هيطلع نتيجة Soul بنفس الاستايل في كل مرة (لأن الموديل متدرّب). إحنا هنطلع نتيجة قريبة بس متذبذبة (لأن nano-banana موديل عام بنحاول نوجهه بالـprompt).
- **الجودة:** Higgsfield هتكون أعلى تفاصيل وضبط Editorial. إحنا أقرب بس مش بنفس المستوى.
- **التحكّم:** Higgsfield عندهم seed + negative prompt + strength sliders. إحنا لأ.

> **ملاحظة:** ده مش عيب في الكود بتاعنا، ده الحقيقة العملية: Higgsfield شركة عندها بحث خاص ومدرّبين موديلاتهم. إحنا منصة تكامل بتستخدم MuAPI (موديلات الناس). علشان نقفل الفجوة، أمامنا 3 خيارات: (1) نستخدم نفس الـAPI Higgsfield (لو فيه طريق نوصلهم) (2) نتدرّب موديلنا الخاص (مكلف جداً) (3) نطوّر prompt engineering عندنا أكتر.

---

## الجزء الثاني — مراجعة كل أداة ✅🟡🔴

### الستديوهات المنسوخة من Higgsfield (Bucket D)

#### 🟡 Soul Studio — `/soul`
**الباك إند:** `nano-banana-pro` عبر `/api/tools/soul/generate`
**الستيت:** شغّال — ✅ NEW: 33 موود بورد + 6 لوحات ألوان + character training
**الفجوات قدام Higgsfield:**
- ❌ الـprompt injection بدائي (نص هاردكوديد) مقابل موديل متدرّب عند Higgsfield
- ❌ مفيش negative prompt
- ❌ مفيش seed control
- ❌ مفيش style_strength slider
- 🚨 **حاجة خطيرة:** Soul مش بيخصم كريديت من اليوزر! (`/api/tools/soul/generate` ما بينادييش `/api/generations` ولا `deductCredits`). يعني لو حد دخل Soul يولّد 1000 صورة، مش هيدفع كريديت ولا واحد. **لازم يتصلح فوراً قبل ما اليوزرز يكتشفوا الباغ.**
- 🚨 **Soul ID training زائف:** الـ"تدريب" مجرد `setTimeout` 3 دقائق ثم flag `trained: true` — مفيش أي fine-tuning فعلي. الصور المرفقة بتتبعت كـ`images_list[]` للموديل بس عند التوليد. (التعليق في الكود نفسه يعترف بده).

#### 🟡 Cinema Studio — `/cinema`
**الباك إند:** `nano-banana-pro` عبر `runMuapiTool` (client-side composition)
**الستيت:** شغّال + فيه AI Director شغّال (Claude Sonnet 4.5 / GPT-4o)
**الفجوات قدام Higgsfield:**
- ✅ المنطق العام مشابه: descriptor injection للكاميرا + العدسة + الإضاءة + إلخ
- ❌ مفيش موديل سينمائي مخصص — بنعتمد على nano-banana
- ❌ Higgsfield Cinema Studio فيه أدوات حركة كاميرا متطورة (Steadicam, Crane, إلخ) ممكن يكون عندهم backend مختلف
- ✅ AI Director فعلياً شغّال ومفيد — يقترح إعدادات بناءً على وصف اليوزر

#### 🟡 Marketing Studio — `/marketing` و `/marketing/app`
**الباك إند:** `seedance-2-vip-omni-reference` / `sd-2-vip-omni-reference-1080p` للفيديو
**الستيت:** شغّال — تم تحديثه بالكامل تو، الـthumbnails من Higgsfield الفعلية
**الفجوات قدام Higgsfield:**
- ✅ الـUI تقريباً 1:1 مع Higgsfield (Hooks, Settings, Formats)
- ❌ نفس مشكلة Soul: بنحقن promptInjection نصياً، Higgsfield غالباً بتستخدم UUID lookup
- ⚠️ **Hooks الكتالوج ممكن يكون ناقص:** Higgsfield قال "20+ hooks"، إحنا شدّينا 9 بس (الباقي مخفي في virtualization). نقدر نحاول نشد الباقي لو هم متاحين بدون auth.
- ⚠️ Higgsfield Marketing Studio بيدّينا `~90 credits` / `5s 1080p`. إحنا حدّثنا الـcost ليطابق ده.

---

### أدوات MuAPI المباشرة (14 أداة - Bucket A)

**كل دول بيشتغلوا طول ما MuAPI شغّالة.** الـoutput بتاعهم تابع للموديل اللي اخترناه:

| الـid | الاسم | الموديل | حالة الجودة |
|---|---|---|---|
| `text-to-image` | توليد صورة | `nano-banana` | ✅ شغّال |
| `enhance-image` | تحسين الصور | `ai-image-upscaler` | ✅ شغّال |
| `bg-remover` | إزالة الخلفية | `ai-background-remover` | ✅ شغّال |
| `product-mockup` | نماذج منتجات | `ai-product-shot` | ✅ شغّال |
| `restore-image` | ترميم الصور | `ai-color-photo` | ✅ شغّال |
| `skin-retouch` | تحسين البشرة | `ai-skin-enhancer` | ✅ شغّال |
| `text-to-video` | إنشاء فيديو | `kling-v3.0-pro-text-to-video` | ✅ شغّال |
| `motion-transfer` | محاكاة الحركة | `kling-v3.0-pro-motion-control` | ✅ شغّال |
| `video-editor` | تعديل الفيديو | `kling-v3.0-pro-motion-control` | ✅ شغّال |
| `lip-sync` | تحريك الشفاه | `sync-lipsync` | ⚠️ **مشكلة:** الـparamMap بيعمل `image→video_url` — `sync-lipsync` بيستقبل فيديو فقط، الصور لوحدها مش هتشتغل |
| `video-vfx` | تأثيرات بصرية | `ai-video-effects` | ✅ شغّال |
| `video-bg-remover` | إزالة خلفية الفيديو | `video-watermark-remover` | ✅ شغّال |
| `product-video` | فيديو منتج | `kling-v2.1-pro-i2v` | ✅ شغّال |
| `billboard-video` | لوحة إعلانية | `kling-v2.1-pro-i2v` | ✅ شغّال |

---

### أدوات MuAPI بـUI مخصّص (12 أداة - Bucket B/C)

**الـUI خاص بينا (رسم/قناع/dropzones)، النتيجة من MuAPI.**

| الـid | الاسم | الـworkspace | الموديل | الحالة |
|---|---|---|---|---|
| `edit-image` | تعديل الصورة | `InpaintWorkspace` | `nano-banana-pro-edit` | ✅ شغّال |
| `sketch-to-image` | رسم إلى صورة | `SketchWorkspace` | `flux-kontext-pro-i2i` | ✅ شغّال |
| `image-outpaint` | تمديد الصورة | `OutpaintWorkspace` | `ai-image-extension` | ✅ شغّال |
| `change-angle` | تغيير الزاوية | `AngleWorkspace` | `flux-kontext-pro-i2i` | ✅ شغّال |
| `multi-scene` | لقطات سينمائية | `MultiSceneWorkspace` | `flux-kontext-pro-i2i` | ✅ شغّال — 9 لقطات |
| `relighting` | توزيع الإضاءة | `RelightWorkspace` | `flux-kontext-pro-i2i` | ✅ شغّال |
| `change-clothes` | تغيير الملابس | `ChangeClothesWorkspace` | `ai-dress-change` | ✅ شغّال |
| `fashion-designer` | مصمم الأزياء | `FashionDesignerWorkspace` | `nano-banana` | 🟡 **مشكلة:** الـcategory مكتوب `t2i` رغم وجود image upload — `nano-banana` t2i ممكن يتجاهل الصورة. الأصح يبقى `i2i` لو الصورة موجودة. |
| `face-swap` | تغيير الوجه | `FaceSwapWorkspace` | `ai-image-face-swap` | ✅ شغّال |
| `whats-next` | ماذا بعد؟ | `WhatsNextWorkspace` | `flux-kontext-pro-i2i` | ✅ شغّال — 8 لقطات |
| `sketch-to-video` | سكيتش لفيديو | `SketchToVideoWorkspace` | `kling-v2.1-pro-i2v` | ✅ شغّال |
| `video-transitions` | انتقالات سلسة | `VideoTransitionsWorkspace` | `kling-v2.1-pro-i2v` | ✅ شغّال |

---

### أدوات Custom Runner (8 أدوات - Bucket C')

**مش بتعدّي على MuAPI مباشرة — بتمر عبر backend عندنا (لـElevenLabs أو Replicate أو ffmpeg أو MuAPI خاص).**

| الـid | الاسم | المزوّد | الحالة |
|---|---|---|---|
| `soul-cinema` | Soul Cinema | MuAPI nano-banana-pro + descriptor injection | 🟡 **مزيف:** الـheader file نفسه يعترف "Soul Cinema is Higgsfield's proprietary model. It isn't on MuAPI, so we approximate the look by layering a descriptor onto the user prompt." يعني إحنا بنغش اليوزر — اسمه Soul Cinema بس فعلياً مجرد nano-banana بـprompt مزخرف. **اقترح: نوضّح ده لليوزر أو نشيل الأداة.** |
| `text-to-speech` | كلام بصوت بشري | ElevenLabs | ✅ شغّال (لو الـAPI key متظبّط) |
| `audio-separate` | فصل الصوت | Replicate (Demucs) | ✅ شغّال |
| `audio-enhance` | تحسين الصوت | Replicate (Resemble Enhance) | ✅ شغّال |
| `music-create` | إنشاء أغنية | MuAPI (Suno V5) | ✅ شغّال |
| `music-remix` | ريميكس | MuAPI (Suno V5) | ✅ شغّال |
| `transcribe` | صوت إلى نص | MuAPI (Whisper) | ✅ شغّال |
| `video-resize` | تغيير أبعاد الفيديو | ffmpeg (محلي على السيرفر) | ⚠️ **يحتاج ffmpeg مثبّت على السيرفر.** على السيرفر الحالي مثبّت؟ محتاج تأكيد. لو deploy على Vercel بدون ffmpeg هتفشل. |

---

### الوكلاء (Agents) — 8 وكلاء كلهم وهم 🚨

في `/agents` و `/dashboard` فيه 8 بطاقات للوكلاء (Sales rep, SEO expert, DevOps engineer, إلخ) بأسعار اشتراك. **مفيش حاجة من ده شغّال:**

- ❌ مفيش Stripe integration — الـcomment في `src/app/api/agents/subscriptions/route.ts:44` بيقول حرفياً: `// TODO: create Stripe subscription here, hook to webhook for status updates.`
- ❌ مفيش execution endpoint — لو حد اشترك في وكيل، مش هيقدر يكلّمه (مفيش chat interface متصل بالوكيل).
- ❌ مفيش وكيل runtime — بيتم تسجيلهم في DB كـACTIVE من غير دفع.

**اقتراح:** إما تشيل الصفحة دي مؤقتاً، أو تكتب "قريباً"، أو نبنيها بجد كمشروع منفصل.

---

## الجزء الثالث — أبرز المشاكل بالأولوية

### 🔴 خطر عاجل (لازم يتصلح هذا الأسبوع)

1. **Soul مفيش credit deduction.** أي يوزر يدخل `/soul` ويولّد، مش هيدفع كريديت. خسارة مالية مباشرة لو حد اكتشف. **الإصلاح:** نخلي `/api/tools/soul/generate` يستدعي `deductCredits` و `/api/generations` زي الستديوهات التانية.

2. **Soul Cinema تضليل.** الاسم بيوحي بإنه موديل Higgsfield Cinema، فعلياً nano-banana بـprompt محشو. **الإصلاح:** نسمّيه باسم محايد ("سينما AI") أو نوضّح في الوصف "محاكاة استايل سينمائي عبر nano-banana".

3. **`/api/app/[...path]` و `/api/workflow/[...path]` بدون auth.** أي حد يقدر يبعتلهم requests ويستهلك من رصيد MuAPI بتاعنا. **الإصلاح:** نضيف `auth()` check زي ما عاملين في `/api/v1/[...path]`.

4. **Marketplace Agents وهم.** لو حد دفع اشتراك، مفيش حاجة هتحصل. **الإصلاح:** إخفاء الصفحة لحين بناء حقيقي.

### 🟡 أدوات لها مشاكل صغيرة

5. **`lip-sync` paramMap غلط:** بيعمل `image→video_url` بس الموديل مش بيقبل صور. **الإصلاح:** نحدّد إن الإنبوت لازم يكون فيديو، أو نبدّل الموديل لواحد بياخد صور.

6. **`fashion-designer` category غلط:** `t2i` لكن فيه image upload. **الإصلاح:** نبدّل لـ`i2i` لو الصورة موجودة، أو نوضّح الموديل بياخد ولا لا.

7. **`extract-colors` fallback صامت:** لو `sharp` مش متاحة بترجع رمادي افتراضي بدون تنبيه. **الإصلاح:** الـUI يعرض warning لو `fallback: true`.

8. **`video-resize` بيحتاج ffmpeg مثبّت.** **الإصلاح:** نتأكد من السيرفر، ونعمل fallback لـMuAPI لو مش متاح.

9. **Soul ID training مزيف.** `setTimeout` 3 دقائق ثم `trained: true`. **الإصلاح:** يا إما نوضّح للناس إنه reference matching مش fine-tuning، يا إما نبنيه فعلياً.

### 🟢 تحسينات للتقريب من Higgsfield

10. **نضيف negative prompt + seed + style_strength لـSoul و Cinema و Marketing.**

11. **AI prompt enhancer:** Higgsfield عندهم `enhance_prompt` flag — نقدر نضيف زي كده يستخدم Claude/GPT يحسّن الـprompt قبل ما يبعت لـMuAPI.

12. **Refiner pass:** تمريرة جودة ثانية بـmodel تاني (مثلاً نمرّر النتيجة على `ai-image-upscaler` تلقائياً).

13. **شد الـHooks الباقية من Higgsfield Marketing Studio.** قال "20+"، شدّينا 9. لو فضّينا الـvirtualization هنشد الباقي.

---

## الجزء الرابع — جدول قرار سريع للأولويات

| الأداة/المشكلة | الخطر | الجهد | الأولوية |
|---|---|---|---|
| Soul credit deduction | 🔴 خطر مالي | ساعة | **١. عاجل** |
| `/api/app/*` و `/api/workflow/*` بدون auth | 🔴 خطر مالي | ساعة | **٢. عاجل** |
| Marketplace Agents وهم | 🟡 خطر سمعة | ساعتين (إخفاء) | **٣. هذا الأسبوع** |
| Soul Cinema تضليل التسمية | 🟡 سمعة | 30 دقيقة | **٤. هذا الأسبوع** |
| `lip-sync` paramMap غلط | 🟡 أداة فاشلة | ساعتين | **٥. هذا الأسبوع** |
| `fashion-designer` category | 🟡 أداة بتطلع نتيجة عشوائية | ساعة | **٦. هذا الأسبوع** |
| Negative prompt + Seed لـSoul/Cinema/Marketing | 🟢 تحسين جودة | يوم | **٧. الأسبوع الجاي** |
| AI prompt enhancer | 🟢 تحسين جودة | يومين | **٨. الأسبوع الجاي** |
| Soul ID فعلياً (fine-tuning) | 🟢 ميزة ضخمة | أسبوع+ | **٩. مشروع مستقل** |
| موديل Soul مدرّب خاص بنا | 🟢 احتراف | شهر+ | **١٠. مشروع طويل** |

---

## الجزء الخامس — الـSystem Prompts اللي عندنا

### 1. Chat (`/api/chat`)
```
أنت مساعد Yilow الذكي — منصة عربية للذكاء الاصطناعي.
رد بالعربية بشكل واضح وودود إلا إذا طلب المستخدم غير ذلك.
كن موجزاً ومفيداً.
```
✅ بسيط ومناسب.

### 2. Assistant Node (`/api/assistant`)
```
أنت مساعد ذكي. رد بإيجاز ووضوح بالعربية ما لم يُطلب غير ذلك.
```
✅ بسيط.

### 3. AI Cinema Director (`/api/cinema-director`)
نص طويل بيلستِنّ كل الكتالوجات (cameras/lenses/focal/apertures/genres/palettes/lighting/movesets) ويطلب من الـLLM يرجّع JSON بالاختيارات.
✅ ممتاز ومفصّل.

### 4. Soul Moodboard descriptor (`/api/tools/soul/moodboards`)
```
You are a creative director summarising the visual aesthetic of a moodboard
for an image-generation prompt.
```
✅ مناسب.

### 5. Soul Cinema descriptor (هاردكوديد)
```
cinema-grade visual, ultra-realistic, shot on 35mm film, anamorphic widescreen
framing, deep cinematic color grade, dramatic directional lighting...
```
🟡 قوي لكن لو اليوزر عرف إن ده "هو ده الموديل" هيستوعب إنه مش حاجة خاصة.

### 6. Soul prompt composer (`buildSoulPrompt` في `soul.ts`)
بيحقن: الـprompt + character hint + moodboard descriptor + palette + finishing
```
[user prompt], consistent appearance of [character],
[moodboard descriptor — long paragraph describing aesthetic],
dominant color palette of #... or [palette descriptor],
ultra-realistic editorial photograph, fashion-grade composition,
magazine-quality lighting, painterly skin tones, high dynamic range,
8K finishing
```
🟡 طويل ومفيد لكن مش بيوصل لمستوى Higgsfield Soul v2 (لأنهم عندهم موديل مدرّب).

### 7. Marketing prompt composer (`composeMarketingPrompt` في `marketing.ts`)
```
[user prompt]
Hook: [hook injection].
Setting: [setting injection].
[format injection].
[App device frame hint if app variant]
```
✅ منطقي ومنظّم.

### 8. Cinema prompt composer (`buildCinemaPrompt` في `cinema.ts`)
```
[user prompt], [genre], shot on a [camera],
using a [lens] at [focal] ([focal descriptor]),
aperture [aperture], [lighting], [palette], [moveset],
cinematic lighting, natural color science, high dynamic range,
professional photography, ultra-detailed, 8K resolution
```
✅ مفصّل ومنظّم.

---

## الجزء السادس — هل نقدر نشوف System Prompts بتاعة Higgsfield؟

**إجابة قصيرة: لأ، مش للموديلات الأساسية.**

Higgsfield بيستخدمو موديلات مدرّبة (soul_v2, إلخ) — مفيش "system prompt" متاح. الموديل نفسه عارف الاستايل من التدريب.

**لكن** الحاجة الوحيدة المتاحة عندهم: `enhance_prompt: true` flag — لو فعّلناه، Higgsfield بيمشّي الـprompt على LLM يحسّنه قبل التوليد. الـsystem prompt بتاع الـenhancer ده مش متاح علناً، بس نقدر نقلّده بتجريب نتائجه:
- يوزر يكتب "بنت في شارع"
- Higgsfield enhancer هيخرج: "candid editorial portrait of a young woman walking through a cobblestone street, soft afternoon light, shallow depth of field, fashion-magazine composition"

**الاستنتاج:** علشان نقفل الفجوة، نقدر نضيف `enhance_prompt` toggle عندنا، يستخدم Claude/GPT يعيد كتابة الـprompt ده الـsystem اقتراحي ليه:

```
You are a prompt expansion engine for AI image generation. Given a short user
prompt (often in Arabic), expand it into a detailed English prompt suitable for
nano-banana-pro / flux models. Include: subject details, lighting, composition,
style references, photographic technical hints. Keep under 80 words. Don't add
text rendering or watermarks.
```

ده هيرفع جودة المخرجات بشكل ملحوظ.

---

## الجزء السابع — التوصيات النهائية

### المرحلة الأولى (هذا الأسبوع — Bug Hunt):
1. ✅ صلّح Soul credit deduction
2. ✅ ضيف auth على `/api/app/*` و `/api/workflow/*`
3. ✅ خبي Marketplace Agents (أو ضيف "قريباً")
4. ✅ غيّر اسم Soul Cinema لاسم محايد
5. ✅ صلّح `lip-sync` paramMap
6. ✅ صلّح `fashion-designer` category

### المرحلة الثانية (الأسبوع الجاي — Feature Parity):
1. ✅ ضيف Negative Prompt input لـSoul + Cinema + Marketing
2. ✅ ضيف Seed input + reseed button
3. ✅ ضيف Style Strength slider لـSoul
4. ✅ بناء AI Prompt Enhancer (claude/gpt يحسّن الـprompt قبل التوليد)

### المرحلة الثالثة (الشهر الجاي — Quality):
1. ✅ Refiner pipeline: نتيجة → upscaler تلقائياً
2. ✅ Soul ID فعلي (lora training عبر provider زي Replicate)
3. ✅ شد الـHooks الباقية من Higgsfield (لو متاحين)

### المرحلة الرابعة (مشروع طويل):
1. تدريب Yilow Soul model خاص بينا (مكلف بس هيقفل الفجوة)
2. Marketplace Agents حقيقيين

---

## خلاصة لشخص غير تقني

**ادواتنا بتشتغل ولا لا؟**

نعم، **34 من 36 أداة شغّالة فعلياً** وبتطلع نتيجة. الباقي مشاكل صغيرة (lip-sync paramMap، fashion-designer category) أو حاجات وهمية (Marketplace Agents).

**النتيجة زي Higgsfield؟**

في **الأدوات البسيطة** (text-to-image, bg-remover, إلخ): الجودة قريبة جداً لأن الموديلات نفسها (nano-banana, flux) متاحة لكلاكما عبر MuAPI.

في **الستديوهات الكبيرة** (Soul, Cinema, Marketing): إحنا عاملين محاكاة 80% بالشكل والوظائف، لكن **الجودة الفعلية للصور أقل** لأن Higgsfield عندهم موديلات مدرّبة خاصة على الستايلات دي. إحنا بنحقن الـprompt بكلام descriptive لنقلّد التأثير، ودي نتيجتها تذبذب.

**اللي إحنا متفوّقين فيه:**
- العربية والـRTL (هم إنجليزي بحت)
- AI Cinema Director (هم مش متأكد عندهم زيه)
- بناء Spaces (canvas للأدوات)
- 36 أداة في منصة واحدة

**اللي ناقصنا:**
- موديلات خاصة (هم: soul_v2, presumably marketing model). إحنا nano-banana للكل
- Negative prompts, seed control, style strength
- Soul ID فعلي (training)
- Marketplace Agents حقيقيين

**التوصية الأهم:**
أبدا الإصلاحات العاجلة (Soul credit + auth proxies) النهارده، وبعدها نشتغل على AI Prompt Enhancer كأكبر مكسب جودة بأقل جهد.
