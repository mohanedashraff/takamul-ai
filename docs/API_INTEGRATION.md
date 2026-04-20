# 🔌 دليل ربط APIs الذكاء الاصطناعي - منصة تكامل

> كيف تربط كل API وتكتب الـ wrapper بتاعه

---

## 📋 ملخص الـ APIs

| API | الاستخدام | التكلفة التقريبية | الأولوية |
|-----|----------|------------------|---------|
| **OpenAI** | شات، محتوى، أعمال | $0.005/1K tokens | 🔴 أساسي |
| **Stability AI** | توليد صور | $0.002-0.008/صورة | 🔴 أساسي |
| **Replicate** | صور متقدمة، فيديو، صوت | متغير حسب الموديل | 🟡 مهم |
| **ElevenLabs** | Text-to-Speech | $0.18/1K chars | 🟡 مهم |
| **Remove.bg** | إزالة خلفية | $0.05/صورة | 🟢 اختياري |

---

## 1️⃣ OpenAI API

### الإعداد
```typescript
// src/lib/ai/openai.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
```

### دالة الشات مع Streaming
```typescript
// src/lib/ai/openai.ts

export async function chatCompletion(
  messages: { role: string; content: string }[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }
) {
  const response = await openai.chat.completions.create({
    model: options?.model || 'gpt-4o',
    messages: messages as any,
    temperature: options?.temperature || 0.7,
    max_tokens: options?.maxTokens || 4000,
    stream: options?.stream ?? true,
  });
  
  return response;
}
```

### دالة أداة محتوى
```typescript
export async function generateContent(
  prompt: string,
  systemPrompt: string,
  options?: { temperature?: number; maxTokens?: number }
) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: options?.temperature || 0.7,
    max_tokens: options?.maxTokens || 4000,
  });
  
  return response.choices[0].message.content;
}
```

### API Route مثال (كاتب المقالات)
```typescript
// src/app/api/tools/content/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/ai/openai';
import { getServerSession } from 'next-auth';
import { deductCredits } from '@/lib/credits';
import { z } from 'zod';

const schema = z.object({
  toolId: z.string(),
  topic: z.string().min(3),
  keywords: z.string().optional(),
  length: z.number().default(1000),
  tone: z.string().default('professional'),
  language: z.string().default('ar'),
});

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'غير مسموح' }, { status: 401 });
  }
  
  // 2. Validate input
  const body = await req.json();
  const validated = schema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: validated.error.errors }, { status: 400 });
  }
  
  // 3. Credit check
  const { toolId, topic, keywords, length, tone, language } = validated.data;
  const creditCost = TOOL_CREDITS[toolId] || 5;
  
  const hasCredits = await checkCredits(session.user.id, creditCost);
  if (!hasCredits) {
    return NextResponse.json({ error: 'رصيد غير كافي' }, { status: 402 });
  }
  
  // 4. Build prompt
  const systemPrompt = getSystemPrompt(toolId, language);
  const userPrompt = buildUserPrompt(toolId, { topic, keywords, length, tone });
  
  // 5. Call AI
  try {
    const result = await generateContent(userPrompt, systemPrompt, {
      maxTokens: length * 2,
    });
    
    // 6. Deduct credits
    await deductCredits(session.user.id, creditCost, toolId);
    
    // 7. Save usage
    await saveToolUsage(session.user.id, toolId, body, result);
    
    // 8. Return result
    return NextResponse.json({ result, creditsUsed: creditCost });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في المعالجة' }, { status: 500 });
  }
}
```

---

## 2️⃣ Stability AI (توليد الصور)

### الإعداد
```typescript
// src/lib/ai/stability.ts

const STABILITY_API_URL = 'https://api.stability.ai/v2beta';
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

export async function generateImage(
  prompt: string,
  options?: {
    negativePrompt?: string;
    width?: number;
    height?: number;
    style?: string;
  }
) {
  const response = await fetch(`${STABILITY_API_URL}/stable-image/generate/sd3`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STABILITY_API_KEY}`,
      'Accept': 'application/json',
    },
    body: (() => {
      const formData = new FormData();
      formData.append('prompt', prompt);
      if (options?.negativePrompt) formData.append('negative_prompt', options.negativePrompt);
      formData.append('output_format', 'png');
      formData.append('width', String(options?.width || 1024));
      formData.append('height', String(options?.height || 1024));
      return formData;
    })(),
  });
  
  if (!response.ok) throw new Error(`Stability AI error: ${response.status}`);
  
  const data = await response.json();
  return data.image; // base64 encoded
}
```

---

## 3️⃣ Replicate (نماذج متنوعة)

### الإعداد
```typescript
// src/lib/ai/replicate.ts

import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// تحسين الصور
export async function enhanceImage(imageUrl: string, scale: number = 2) {
  const output = await replicate.run(
    "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
    { input: { image: imageUrl, scale } }
  );
  return output;
}

// إزالة الخلفية
export async function removeBackground(imageUrl: string) {
  const output = await replicate.run(
    "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
    { input: { image: imageUrl } }
  );
  return output;
}

// توليد فيديو
export async function textToVideo(prompt: string, numFrames: number = 25) {
  const output = await replicate.run(
    "wan-video/wan-2.1:...",
    { input: { prompt, num_frames: numFrames } }
  );
  return output;
}

// موسيقى
export async function generateMusic(prompt: string, duration: number = 10) {
  const output = await replicate.run(
    "meta/musicgen:...",
    { input: { prompt, duration } }
  );
  return output;
}
```

---

## 4️⃣ ElevenLabs (Text-to-Speech)

### الإعداد
```typescript
// src/lib/ai/elevenlabs.ts

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// الأصوات المتاحة
export const VOICES = {
  // عربي
  'ar-male-1': { id: '...', name: 'أحمد', language: 'ar' },
  'ar-female-1': { id: '...', name: 'فاطمة', language: 'ar' },
  // إنجليزي
  'en-male-1': { id: '...', name: 'Adam', language: 'en' },
  'en-female-1': { id: '...', name: 'Rachel', language: 'en' },
};

export async function textToSpeech(
  text: string,
  voiceId: string,
  options?: { stability?: number; speed?: number }
) {
  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: options?.stability || 0.5,
          similarity_boost: 0.75,
          speed: options?.speed || 1.0,
        },
      }),
    }
  );
  
  if (!response.ok) throw new Error('ElevenLabs API error');
  
  return response.arrayBuffer(); // MP3 audio
}
```

---

## 🔄 نمط Error Handling الموحد

```typescript
// src/lib/ai/types.ts

export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  creditsUsed: number;
  processingMs: number;
}

// src/lib/ai/wrapper.ts

export async function withAIErrorHandling<T>(
  fn: () => Promise<T>,
  toolId: string
): Promise<AIResponse<T>> {
  const startTime = Date.now();
  
  try {
    const data = await fn();
    return {
      success: true,
      data,
      creditsUsed: TOOL_CREDITS[toolId],
      processingMs: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error(`[${toolId}] AI Error:`, error);
    
    // Rate limit
    if (error.status === 429) {
      return {
        success: false,
        error: 'الخدمة مشغولة، جرب بعد دقيقة',
        creditsUsed: 0,
        processingMs: Date.now() - startTime,
      };
    }
    
    // Content filter
    if (error.status === 400 && error.message?.includes('content')) {
      return {
        success: false,
        error: 'المحتوى غير مناسب، عدّل الطلب',
        creditsUsed: 0,
        processingMs: Date.now() - startTime,
      };
    }
    
    return {
      success: false,
      error: 'حدث خطأ في المعالجة، جرب مرة أخرى',
      creditsUsed: 0,
      processingMs: Date.now() - startTime,
    };
  }
}
```

---

## ⚠️ قواعد مهمة

1. **لا تكشف API keys في الفرونت** - كل المكالمات من الـ server
2. **Retry logic** - أعد المحاولة 3 مرات مع exponential backoff
3. **Rate limiting** - حدد عدد الطلبات لكل مستخدم
4. **ترجمة البرومبت** - ترجم للإنجليزي عند استخدام Stability AI
5. **تخزين النتائج** - خزّن كل نتيجة في S3 + DB
