# 💰 نظام الكريديت والاشتراكات - منصة تكامل

> كل تفاصيل نظام الكريديت والتسعير والدفع

---

## 🎯 كيف يعمل نظام الكريديت

```
المستخدم يشترك في خطة → يحصل على كريديت شهري
↓
يستخدم أداة → يُخصم كريديت من رصيده
↓
ينفد الرصيد → يشتري كريديت إضافي أو يترقي
```

---

## 💳 خطط الأسعار

| الخطة | السعر/شهر | الكريديت/شهر | الأدوات المتاحة |
|-------|-----------|-------------|----------------|
| **مجاني** | $0 | 50 | شات + محتوى (محدود) |
| **Starter** | $9.99 | 700 | شات + محتوى + صور |
| **Pro** | $29.99 | 3000 | كل شيء ما عدا الفيديو المتقدم |
| **Enterprise** | $69.99 | 10000 | كل شيء + API access + أولوية |

### مميزات كل خطة
```typescript
export const PLAN_FEATURES = {
  FREE: {
    credits: 50,
    tools: ['chat', 'content-basic'],
    maxFileSize: 5, // MB
    historyDays: 7,
    priority: 'low',
  },
  STARTER: {
    credits: 700,
    tools: ['chat', 'content', 'image-basic'],
    maxFileSize: 20,
    historyDays: 30,
    priority: 'normal',
  },
  PRO: {
    credits: 3000,
    tools: ['chat', 'content', 'image', 'audio', 'business'],
    maxFileSize: 50,
    historyDays: 90,
    priority: 'high',
  },
  ENTERPRISE: {
    credits: 10000,
    tools: ['all'],
    maxFileSize: 200,
    historyDays: 365,
    priority: 'highest',
    apiAccess: true,
  },
};
```

---

## 🔢 تكلفة كل أداة بالكريديت

### 💬 الدردشة (1-5 credits)
| الأداة | الكريديت |
|--------|---------|
| رسالة شات عادية | 1 |
| رسالة شات طويلة | 2 |
| مساعد الكود | 2 |
| تحليل PDF | 5 |

### ✍️ المحتوى (1-20 credits)
| الأداة | الكريديت |
|--------|---------|
| مقال 500 كلمة | 5 |
| مقال 1000 كلمة | 10 |
| مقال 2000 كلمة | 15 |
| مقال 3000 كلمة | 20 |
| منشور سوشيال ميديا | 1 |
| إعلان Google/Meta | 2 |
| إعادة صياغة | 1 |
| تلخيص | 1 |
| إيميل | 1 |
| وصف منتج | 2 |
| أدوات SEO | 2 |
| سيرة ذاتية | 5 |
| خطة عمل | 10 |

### 🎨 الصور (2-10 credits)
| الأداة | الكريديت |
|--------|---------|
| توليد صورة | 5 |
| تحسين صورة | 3 |
| تكبير صورة | 3 |
| إزالة خلفية | 2 |
| QR Code فني | 3 |
| صورة بروفايل | 5 |
| تصميم شعار | 10 |

### 🎬 الفيديو (10-25 credits)
| الأداة | الكريديت |
|--------|---------|
| Text-to-Video | 20 |
| Image-to-Video | 15 |
| Lip Sync | 15 |
| UGC Creator | 25 |
| إزالة خلفية فيديو | 10 |

### 🎵 الصوت (3-5 credits)
| الأداة | الكريديت |
|--------|---------|
| Text-to-Speech | 3 |
| إزالة ضوضاء | 3 |
| فصل أصوات | 5 |
| مولد موسيقى | 5 |

### 🏢 الأعمال (3-5 credits)
| الأداة | الكريديت |
|--------|---------|
| Customer Persona | 3 |
| Competitor Analysis | 5 |
| Market Research | 5 |
| Marketing Strategy | 5 |

---

## 🔧 التنفيذ التقني

### دالة التحقق من الرصيد
```typescript
// src/lib/credits.ts

import prisma from './prisma';

export async function checkCredits(userId: string, required: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return (user?.credits || 0) >= required;
}

export async function deductCredits(
  userId: string,
  amount: number,
  toolId: string
): Promise<number> {
  // Transaction: خصم الكريديت + تسجيل المعاملة
  const result = await prisma.$transaction(async (tx) => {
    // 1. خصم الكريديت
    const user = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    });
    
    // 2. تسجيل المعاملة
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'TOOL_USAGE',
        description: `استخدام ${toolId}`,
        toolUsageId: toolId,
        balanceAfter: user.credits,
      },
    });
    
    return user.credits;
  });
  
  return result;
}

export async function addCredits(
  userId: string,
  amount: number,
  type: string,
  description: string
): Promise<number> {
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    });
    
    await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        type: type as any,
        description,
        balanceAfter: user.credits,
      },
    });
    
    return user.credits;
  });
  
  return result;
}
```

### Hook في الفرونت
```typescript
// src/hooks/useCredits.ts

import { create } from 'zustand';

interface CreditStore {
  credits: number;
  setCredits: (credits: number) => void;
  canAfford: (cost: number) => boolean;
}

export const useCreditStore = create<CreditStore>((set, get) => ({
  credits: 0,
  setCredits: (credits) => set({ credits }),
  canAfford: (cost) => get().credits >= cost,
}));
```
