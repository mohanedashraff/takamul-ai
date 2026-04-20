# 🏗️ الهيكل المعماري - منصة تكامل

> كيف تعمل المنصة من الداخل

---

## 📐 الهيكل العام

```
┌─────────────────────────────────────────────────────┐
│                    المستخدم (Browser)                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Landing  │  │   Auth   │  │    Dashboard     │  │
│  │  Page    │  │  Pages   │  │  + All Tools     │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                                                     │
├───────────────── Next.js App Router ────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │              API Routes                      │   │
│  │  /api/auth  /api/chat  /api/tools  /api/user │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
├─────────────────── Services Layer ──────────────────┤
│                                                     │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ │
│  │ Credit  │ │   AI     │ │ File   │ │   Auth   │ │
│  │ Service │ │ Service  │ │Storage │ │ Service  │ │
│  └─────────┘ └──────────┘ └────────┘ └──────────┘ │
│                                                     │
├──────────────────── Data Layer ─────────────────────┤
│                                                     │
│  ┌──────────┐  ┌───────┐  ┌───────────────────┐   │
│  │PostgreSQL│  │ Redis │  │    AWS S3 /        │   │
│  │ (Prisma) │  │ Cache │  │  Cloudflare R2     │   │
│  └──────────┘  └───────┘  └───────────────────┘   │
│                                                     │
├──────────────── External AI APIs ───────────────────┤
│                                                     │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │OpenAI  │ │Stability │ │Replicate │ │Eleven   │ │
│  │GPT-4o  │ │   AI     │ │  Models  │ │  Labs   │ │
│  └────────┘ └──────────┘ └──────────┘ └─────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 مسار الطلب (Request Flow)

### مسار أداة محتوى (مثل كاتب المقالات):
```
1. المستخدم يملأ الفورم ويضغط "توليد"
   ↓
2. الـ Frontend يرسل POST request لـ /api/tools/content
   ↓
3. الـ API route:
   a. يتحقق من تسجيل الدخول (auth middleware)
   b. يتحقق من رصيد الكريديت (credit check)
   c. يتحقق من صحة المدخلات (zod validation)
   ↓
4. يبني الـ prompt من القالب + مدخلات المستخدم
   ↓
5. يرسل الطلب لـ OpenAI API (مع streaming)
   ↓
6. يخصم الكريديت من رصيد المستخدم
   ↓
7. يحفظ النتيجة في قاعدة البيانات (تاريخ الاستخدام)
   ↓
8. يرسل الاستجابة (streamed) للـ Frontend
   ↓
9. الـ Frontend يعرض النتيجة في الوقت الحقيقي
```

### مسار أداة صور (مثل مولد الصور):
```
1. المستخدم يكتب الوصف ويختار الإعدادات
   ↓
2. POST /api/tools/image/generate
   ↓
3. Auth + Credit + Validation checks
   ↓
4. ترجمة الوصف العربي للإنجليزي (إذا لزم)
   ↓
5. إرسال الطلب لـ Stability AI
   ↓
6. استلام الصورة (base64 أو URL)
   ↓
7. رفع الصورة لـ S3
   ↓
8. خصم الكريديت + حفظ في DB
   ↓
9. إرسال رابط الصورة للـ Frontend
```

---

## 📦 الطبقات (Layers)

### 1. Presentation Layer (Frontend)
- **المسؤولية**: عرض الواجهة والتفاعل مع المستخدم
- **التقنية**: React + Next.js App Router
- **الموقع**: `src/app/` + `src/components/`
- **القواعد**:
  - لا يتصل بقاعدة البيانات مباشرة
  - يستخدم API routes فقط
  - يستخدم Zustand للـ state
  - يستخدم React Query للـ data fetching

### 2. API Layer
- **المسؤولية**: معالجة الطلبات والتحقق والتوجيه
- **التقنية**: Next.js API Routes
- **الموقع**: `src/app/api/`
- **القواعد**:
  - كل route يتحقق من Auth
  - كل route يتحقق من Credits
  - كل route يسجل الاستخدام
  - Zod validation لكل المدخلات

### 3. Service Layer
- **المسؤولية**: منطق الأعمال وربط الـ APIs
- **التقنية**: TypeScript classes/functions
- **الموقع**: `src/lib/`
- **القواعد**:
  - كل AI API له wrapper خاص
  - Error handling موحد
  - Retry logic للـ API calls
  - Caching حيث أمكن

### 4. Data Layer
- **المسؤولية**: تخزين واسترجاع البيانات
- **التقنية**: Prisma + PostgreSQL
- **الموقع**: `prisma/` + `src/lib/prisma.ts`
- **القواعد**:
  - Schema واضح ومنظم
  - Relations محددة
  - Indexes للـ performance

---

## 🔐 الأمان

### المصادقة (Authentication)
- NextAuth.js مع Credentials Provider
- JWT tokens مع httpOnly cookies
- Session management

### التصريح (Authorization)
- Credits check قبل كل عملية AI
- Rate limiting لمنع الإساءة
- API key protection (server-side فقط)

### حماية البيانات
- Environment variables للأسرار
- CORS configuration
- Input sanitization
- SQL injection prevention (Prisma handles this)

---

## 🔧 Middleware Flow

```typescript
// src/middleware.ts

// 1. Auth check
if (!session) redirect("/login")

// 2. Credit check (in API routes)
if (user.credits < requiredCredits) {
  return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })
}

// 3. Rate limiting
if (rateLimitExceeded) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 })
}

// 4. Input validation
const validated = schema.safeParse(body)
if (!validated.success) {
  return NextResponse.json({ error: validated.error }, { status: 400 })
}
```

---

## 📁 أين تجد كل حاجة

| أحتاج... | اذهب إلى... |
|----------|-------------|
| إضافة صفحة جديدة | `src/app/(dashboard)/tools/{category}/{tool}/page.tsx` |
| إضافة API route | `src/app/api/tools/{category}/route.ts` |
| إضافة مكون UI | `src/components/ui/{Component}.tsx` |
| إضافة مكون Tool | `src/components/tools/{Component}.tsx` |
| إضافة AI wrapper | `src/lib/ai/{service}.ts` |
| تغيير الألوان | `docs/DESIGN_SYSTEM.md` + `tailwind.config.ts` |
| تغيير الـ Schema | `prisma/schema.prisma` |
| إضافة ترجمة | `src/i18n/ar.json` + `src/i18n/en.json` |
