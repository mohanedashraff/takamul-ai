# Yilow Chat → Agent Mode (Planning Doc)

> **حالة:** مجمَّد. اتعمل التصميم والمعمارية، لسه ما اتبدأش التنفيذ.
> الـ trigger للبدء: لما المستخدم يقول "ابدأ تنفيذ خطة الـ agent chat".

---

## 1. الطلب (نص المستخدم الحرفي)

> عاوزين نخلي واجهة المحادثة او الشات بتاع yilow ai مش مجرد شات عادي لا ده شات
> عارف كل حاجة عن اليوزر والكريديت بتاعه وكمان عارف اخر العمليات الواداوت
> اللي استخدمها بالكامل
>
> وليكون عارف كل الادوات اللي موجودة في المنصة و ال inputs بتاعها لاننا
> عاوزينه ينفذ اي حاجة اليوزر يطلبها منه — يعني مثلا لو قاله عاوز فيديو
> بترانسيشن فا يشوف ايه ال tools الافضل اللي يستخدمها ويفهمها كويس ويطلب
> ال inputs تابعتها من اليوزر، او يقدر يعمل ووركفلو جديد ويديله رابط
> القالب، او يقدر يعمل اي حاجة في المنصة بالكامل لليوزر وينفذها ليه
> باستخدام كل الادوات والموديلات الموجودة ويتحكم في حسابه كامل.

---

## 2. الفلسفة بإيجاز

الشات يبقى **agent**، مش مجرد LLM متجاوب. الفرق:

| Chat عادي | Agent |
|---|---|
| يرد بنص | يرد بنص + ينفّذ |
| ما يعرفش اليوزر | يعرف الاسم، الـ plan، الرصيد، النشاط |
| اقتراحات عامة | اقتراحات مبنية على كتالوج الأدوات الفعلي |
| اليوزر يفتح الأداة بنفسه | الـ agent يفتحها / يشغّلها / يربط القوالب ببعض |

---

## 3. المعمارية على ٦ مراحل

### المرحلة ١ — طبقة "أدوات الوكيل" (server-side)

ملف جديد: `src/lib/agent/tools.ts` — يصدّر مجموعة AI SDK v6 `tool()` definitions.
كل tool له schema (Zod) وdescription (LLM يقرأها) وexecute (ينفّذ).

| Tool | الوظيفة | المصدر الموجود فعلاً |
|---|---|---|
| `get_user_context` | اسم اليوزر، plan، رصيد، آخر ٥ توليدات | `/api/user/me`, `/api/credits/balance`, `/api/generations` |
| `search_tools` | بحث semantic في الـ ٧٠+ أداة بـ keyword/intent | `ALL_TOOLS_FLAT` من `src/lib/data/tools.ts` |
| `get_tool_details` | يرجع inputs schema لأداة معينة | نفس الكتالوج |
| `run_tool` | ينفّذ الأداة فعلياً (server-side، يخصم credits) | `executeTool` من `src/lib/execute-tool.ts` (يحتاج refactor server-side) |
| `search_templates` | بحث في الـ ٤٨ workflow template | `/api/workflow/get-template-workflows` |
| `get_template_details` | inputs schema للقالب | `/api/workflow/{id}/api-inputs` |
| `run_template` | يشغّل قالب workflow | `/api/workflow/{id}/api-execute` + polling |
| `open_template_in_canvas` | يولّد لينك `/spaces/canvas?space=<id>` | `/api/spaces/from-template/[id]` (موجود) |
| `list_agents` | يدور على الـ ٤٢ MuAPI agent | `/api/external-agents/{featured,templates}/agents` |
| `link_to_agent` | يرجع لينك `/agents/<slug>` | الموجود |
| `upload_attachment` | يحوّل blob في الشات لـ MuAPI URL | `uploadFile` في `src/lib/muapi.ts` |

**ملاحظة معمارية مهمة:** `executeTool` حالياً client-side (بيستخدم `useUserStore` و`fetch /api/generations`). لازم نعمل نسخة server-side تستخدم Prisma مباشرة بدل HTTP. هنخرّجها في `src/lib/agent/run-tool-server.ts` أو نوسّع `executeTool` يقبل سياق sessionId.

### المرحلة ٢ — System prompt غني

في `/api/chat/route.ts`، قبل `streamText` نبني system prompt يحتوي:

```
أنت Yilow Agent — مساعد منصة Yilow AI.

اليوزر:
  • {name} ({email})
  • Plan: {plan}، الرصيد: {credits} كريديت
  • تجدد في: {planRenewsAt}
  • آخر نشاط: استخدم {lastTool} منذ {timeAgo}

المهام اللي تقدر تعملها:
  - تبحث في {N} أداة وتقترح الأنسب
  - تنفّذ أي أداة (بعد تأكيد لو تكلفة > 5 كريديت)
  - تفتح قوالب workflow في الكانفس
  - تربط اليوزر بأي وكيل من {M} وكيل متخصص

قواعد:
  - اسأل قبل تنفيذ أي حاجة بتكلّف credits.
  - رد بالعربي ما لم يطلب اليوزر إنجليزي.
  - لو الأداة محتاجة upload، اطلبها بوضوح.
  - لما النتيجة جاهزة، رنْدِرها inline (الـ UI بيلتقطها من tool-result part).
```

### المرحلة ٣ — UI: رندر tool-call/tool-result inline

`src/app/chat/page.tsx` بيستخدم `@ai-sdk/react`'s `useChat`. الرسالة الآن `parts: [{type: 'text'}, ...]`. مع tools هتزيد:
- `{type: 'tool-call', toolName, args}` → كارت "🔧 جاري تشغيل {toolName}"
- `{type: 'tool-result', toolName, result}` → كارت بنتيجة

نضيف renderer لكل tool result بحسب نوعها:
- `run_tool` → كارت بصورة/فيديو/صوت + زرار "تنزيل" / "إعادة"
- `open_template_in_canvas` → كارت بzر "افتح في الكانفس"
- `link_to_agent` → كارت بzر "ابدأ المحادثة مع الوكيل"
- `search_tools` → كاروسيل أدوات صغير

ملف جديد: `src/components/chat/ToolPartRenderer.tsx`.

### المرحلة ٤ — رفع ملفات داخل الشات

الـ input bar بيقبل drag-drop. الملف:
1. يترفع لـ MuAPI storage عبر `/api/app/upload_file` (موجود).
2. الـ URL النهائي يتحط في الـ message attachments (AI SDK بيدعم multimodal).
3. لما الـ agent يستدعي `run_tool` بالـ URL ده.

محتاج تعديل في `useChat`'s `messages` لتدعم `parts: [{type: 'file', url, mediaType}]`.

### المرحلة ٥ — empty-state suggestions

نشيل الـ ٤ اقتراحات الحالية (Python script, لخص مستند, …) ونحط:
- "اعمل لي سيلفي مع جوني ديب" → `search_tools(intent='celebrity selfie')` → run
- "نقّي الصوت ده" → upload + run audio-enhance
- "حضّرلي إعلان منتجي" → search tools by 'product ad'
- "افتح قالب Virtual Try On"
- "كم رصيدي المتبقي؟"

### المرحلة ٦ — Deploy + smoke

1. Build على local.
2. Push.
3. SSH للسيرفر، pull، build، pm2 restart.
4. اختبار سيناريوهات:
   - "كم رصيدي؟" → `get_user_context` → نص.
   - "ولّد لي صورة قطة" → `search_tools` → `get_tool_details` → اسأل عن البرومبت → `run_tool` → كارت صورة.
   - "افتح قالب Virtual Try On" → `search_templates` → `open_template_in_canvas` → كارت لينك.
   - "اعمل ووركفلو جديد لإعلان منتج" → نفس الفلو.

---

## 4. اعتبارات أمان وUX

### أمان
- **Server enforcement فقط**: الـ LLM ممنوع يعمل tool execution مباشرة. كل `run_tool` لازم يمر بـ session check + credit check + Prisma transaction.
- **تأكيد قبل الكلفة**: أي action > 5 كريديت، الـ agent يسأل اليوزر "أكمل؟ هتكلفك X كريديت" (LLM مرجوع له على ده في الـ system prompt).
- **Rate limit**: نستخدم الـ rate limiter الموجود في `src/lib/rate-limit.ts` (لو موجود) أو نضيفه على tool calls.
- **Error envelopes**: كل tool يرجع `{ok, data} | {error}` ما يرميش exceptions تخرّج الـ stream.

### UX
- **Streaming حي**: الـ tool call يظهر "جاري…" قبل النتيجة.
- **Cancel**: زرار إلغاء على أي tool call شغال.
- **History**: المحادثات بتتحفظ. لما اليوزر يفتح محادثة قديمة، الـ tool results بتترندر زي ما كانت.
- **Mobile**: الـ tool result cards لازم تشتغل على شاشة 360px.

---

## 5. تأثيرات على الـ schema

محتاجين نوسّع `ChatMessage`:
- `metadata` JSON بالفعل موجود → نخزّن فيه `toolCalls` و`toolResults`.
- `parts` حالياً بتترسل من العميل بس → ممكن نخزنها كمان عشان History تكون كاملة.

اقتراح: قبل ما نبدأ، نعمل migration:
```prisma
model ChatMessage {
  ...
  parts   Json?   // يخزن كل الـ message parts: text + tool-calls + tool-results
}
```

البديل: نستخدم `metadata` بدون migration. أنظف لكن metadata بقا غامض.

---

## 6. تكلفة تقديرية للتنفيذ

| المرحلة | حجم | اختبار |
|---|---|---|
| ١ | ~٤٠٠ سطر (8 tools, refactor execute-tool للسيرفر) | unit tests على tool execution |
| ٢ | ~٧٠ سطر | يدوي |
| ٣ | ~٣٠٠ سطر (renderer + الكروت) | E2E |
| ٤ | ~١٢٠ سطر (upload bar + multimodal handling) | E2E |
| ٥ | ~٣٠ سطر | يدوي |
| ٦ | deploy + smoke | يدوي |

إجمالي: ~٩٢٠ سطر، يتعمل في ٢-٣ جلسات تركيز.

---

## 7. Trigger للبدء

لما المستخدم يقول واحدة من:
- "ابدأ خطة الـ agent chat"
- "نفّذ المرحلة ١ من AGENT_CHAT_PLAN"
- "خلّينا نعمل الشات الذكي"

افتح الملف ده، اعمل TodoWrite بالـ ٦ مراحل، ابدأ المرحلة ١.

---

## 8. مراجع داخل المشروع

- `src/app/api/chat/route.ts` — الـ chat endpoint الحالي (streamText, no tools).
- `src/app/chat/page.tsx` — الـ UI (`useChat`, `DefaultChatTransport`).
- `src/lib/data/tools.ts` — كتالوج الـ ٧٠+ أداة (الـ source of truth).
- `src/lib/execute-tool.ts` — منفّذ الأدوات client-side (يحتاج server twin).
- `src/lib/run-tool.ts` — primitives لـ start/finalize generation.
- `src/lib/agent/` — مجلد جديد للملفات الجديدة.
- `src/app/api/spaces/from-template/[id]/route.ts` — موجود، الـ agent بيستخدمه.
- `src/lib/data/muapi-translations.ts` — الترجمات للقوالب والوكلاء.
