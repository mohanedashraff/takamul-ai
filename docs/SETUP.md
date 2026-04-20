# 🔧 دليل التجهيز - منصة تكامل

> خطوات تجهيز بيئة العمل من الصفر

---

## 📋 المتطلبات

### برامج مطلوبة
- **Node.js** v18+ (يفضل v20 LTS)
- **npm** أو **pnpm** (يفضل pnpm)
- **Git**
- **VS Code** (اختياري لكن مفضل)
- **PostgreSQL** (أو استخدام Supabase cloud)

### حسابات مطلوبة
- **OpenAI** - للدردشة وأدوات المحتوى
- **Stability AI** - لتوليد الصور (أو Replicate)
- **ElevenLabs** - للـ Text-to-Speech
- **Stripe** - للدفع والاشتراكات
- **AWS** أو **Cloudflare R2** - لتخزين الملفات

---

## 🚀 خطوات التجهيز

### الخطوة 1: إنشاء مشروع Next.js

```bash
cd "c:\Users\Mega Store\takamul ai"
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

### الخطوة 2: تثبيت Dependencies الأساسية

```bash
# UI & Animation
npm install framer-motion lucide-react clsx tailwind-merge

# Database
npm install prisma @prisma/client
npm install -D prisma

# Auth
npm install next-auth @auth/prisma-adapter

# State Management
npm install zustand

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# AI APIs
npm install openai replicate
npm install @anthropic-ai/sdk

# Payments
npm install stripe @stripe/stripe-js

# Storage
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Utilities
npm install date-fns nanoid react-markdown remark-gfm
npm install react-hot-toast
npm install next-intl

# Dev Dependencies
npm install -D @types/node @types/react prettier
```

### الخطوة 3: إعداد Prisma

```bash
npx prisma init
```

ثم انسخ الـ schema من `docs/DATABASE.md` إلى `prisma/schema.prisma`

### الخطوة 4: إعداد Environment Variables

```bash
# انسخ ملف المثال
copy .env.example .env.local

# افتح .env.local واملأ القيم
```

### الخطوة 5: إعداد قاعدة البيانات

```bash
npx prisma db push
npx prisma generate
```

### الخطوة 6: تشغيل المشروع

```bash
npm run dev
```

المشروع هيفتح على: `http://localhost:3000`

---

## ✅ التحقق من التجهيز

بعد تنفيذ كل الخطوات، تأكد من:

- [ ] `npm run dev` بيشتغل بدون أخطاء
- [ ] الصفحة بتفتح على `localhost:3000`
- [ ] Prisma Studio بيفتح: `npx prisma studio`
- [ ] ملف `.env.local` موجود ومعبأ
- [ ] الخطوط العربية بتتحمل صح

---

## 🔑 ملاحظات مهمة

> ⚠️ **لا ترفع `.env.local` على Git أبداً!**

> ✅ ملف `.env.example` موجود كمرجع للمتغيرات المطلوبة

> 💡 لو مش عندك PostgreSQL محلي، استخدم Supabase (مجاني):
> 1. اذهب لـ https://supabase.com
> 2. أنشئ مشروع جديد
> 3. انسخ Connection String وحطه في `DATABASE_URL`
