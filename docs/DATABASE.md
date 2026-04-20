# 🗄️ تصميم قاعدة البيانات - منصة تكامل

> Schema كامل لكل الجداول والعلاقات

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ═══════════════════════════════════════
// المستخدمون
// ═══════════════════════════════════════

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String    // hashed
  avatar        String?
  role          Role      @default(USER)
  credits       Int       @default(50)  // الرصيد الحالي
  plan          Plan      @default(FREE)
  language      String    @default("ar")
  
  // Relations
  conversations Conversation[]
  toolUsages    ToolUsage[]
  transactions  CreditTransaction[]
  subscription  Subscription?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Role {
  USER
  ADMIN
}

enum Plan {
  FREE
  STARTER
  PRO
  ENTERPRISE
}

// ═══════════════════════════════════════
// المحادثات والرسائل
// ═══════════════════════════════════════

model Conversation {
  id        String    @id @default(cuid())
  title     String    @default("محادثة جديدة")
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages  Message[]
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id             String       @id @default(cuid())
  role           MessageRole
  content        String       @db.Text
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  // Metadata
  tokens         Int?         // عدد التوكنز المستخدمة
  model          String?      // الموديل المستخدم
  
  createdAt      DateTime     @default(now())
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

// ═══════════════════════════════════════
// استخدام الأدوات
// ═══════════════════════════════════════

model ToolUsage {
  id           String       @id @default(cuid())
  userId       String
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  toolId       String       // مثل: "article-writer", "image-generator"
  toolCategory ToolCategory
  
  // المدخلات والمخرجات
  input        Json         // المدخلات كـ JSON
  output       String?      @db.Text  // النتيجة النصية
  outputUrl    String?      // رابط الملف (صور/فيديو/صوت)
  
  // الحالة
  status       ToolStatus   @default(PROCESSING)
  creditsUsed  Int
  errorMessage String?
  
  // Metadata
  processingMs Int?         // وقت المعالجة بالمللي ثانية
  model        String?      // الموديل المستخدم
  
  createdAt    DateTime     @default(now())
}

enum ToolCategory {
  CHAT
  CONTENT
  IMAGE
  VIDEO
  AUDIO
  BUSINESS
}

enum ToolStatus {
  PROCESSING
  COMPLETED
  FAILED
}

// ═══════════════════════════════════════
// نظام الكريديت
// ═══════════════════════════════════════

model CreditTransaction {
  id          String          @id @default(cuid())
  userId      String
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  amount      Int             // + للإضافة، - للخصم
  type        TransactionType
  description String
  
  // إذا كان خصم من أداة
  toolUsageId String?
  
  // إذا كان شراء
  stripeId    String?
  
  balanceAfter Int            // الرصيد بعد العملية
  
  createdAt   DateTime        @default(now())
}

enum TransactionType {
  PURCHASE       // شراء كريديت
  TOOL_USAGE     // استخدام أداة
  SUBSCRIPTION   // اشتراك شهري
  BONUS          // مكافأة
  REFUND         // استرجاع
  DAILY_FREE     // كريديت يومي مجاني
}

// ═══════════════════════════════════════
// الاشتراكات
// ═══════════════════════════════════════

model Subscription {
  id               String   @id @default(cuid())
  userId           String   @unique
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  plan             Plan
  stripeCustomerId String?
  stripeSubId      String?
  
  status           SubStatus @default(ACTIVE)
  
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

enum SubStatus {
  ACTIVE
  CANCELLED
  PAST_DUE
  EXPIRED
}
```

---

## 📊 تكلفة الكريديت لكل أداة

```typescript
// src/lib/constants.ts

export const TOOL_CREDITS: Record<string, number> = {
  // Chat
  "chat": 1,
  "chat-long": 2,
  "code-assistant": 2,
  "pdf-analyzer": 5,
  
  // Content
  "article-writer-500": 5,
  "article-writer-1000": 10,
  "article-writer-2000": 15,
  "article-writer-3000": 20,
  "blog-writer": 5,
  "google-ad-copy": 2,
  "meta-ad-copy": 2,
  "linkedin-post": 1,
  "twitter-post": 1,
  "instagram-caption": 1,
  "product-description": 2,
  "real-estate-description": 2,
  "email-writer": 1,
  "cover-letter": 3,
  "resume-builder": 5,
  "paraphraser": 1,
  "summarizer": 1,
  "idea-generator": 1,
  "business-plan": 10,
  "seo-tools": 2,
  
  // Image
  "image-generator": 5,
  "image-enhancer": 3,
  "image-upscaler": 3,
  "background-remover": 2,
  "qr-code": 3,
  "headshot-generator": 5,
  "logo-designer": 10,
  
  // Video
  "text-to-video": 20,
  "image-to-video": 15,
  "lip-sync": 15,
  "ugc-creator": 25,
  "video-bg-remover": 10,
  
  // Audio
  "text-to-speech": 3,
  "noise-remover": 3,
  "vocal-remover": 5,
  "music-generator": 5,
  
  // Business
  "customer-persona": 3,
  "competitor-analysis": 5,
  "market-research": 5,
  "marketing-strategy": 5,
};
```

---

## 🔗 العلاقات

```
User
├── Conversation[] (محادثات الشات)
│   └── Message[] (الرسائل)
├── ToolUsage[] (استخدامات الأدوات)
├── CreditTransaction[] (معاملات الكريديت)
└── Subscription? (الاشتراك)
```
