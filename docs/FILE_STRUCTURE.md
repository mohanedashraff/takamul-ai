# 📦 هيكل الملفات والمجلدات - منصة تكامل

> دليل كامل لكل ملف ومجلد في المشروع

---

## 🌳 الهيكل الكامل

```
takamul-ai/
│
├── 📁 docs/                          # التوثيق الشامل
│   ├── README.md                      # الفهرس الرئيسي
│   ├── SETUP.md                       # تجهيز البيئة
│   ├── ARCHITECTURE.md                # الهيكل المعماري
│   ├── DESIGN_SYSTEM.md               # نظام التصميم
│   ├── TOOLS_INVENTORY.md             # جرد الأدوات
│   ├── PHASES.md                      # مراحل التنفيذ
│   ├── API_INTEGRATION.md             # دليل APIs
│   ├── DATABASE.md                    # تصميم قاعدة البيانات
│   ├── CREDITS_SYSTEM.md              # نظام الكريديت
│   ├── FILE_STRUCTURE.md              # ← أنت هنا
│   ├── TESTING.md                     # خطة الاختبار
│   └── CHECKLIST.md                   # قائمة المراجعة
│
├── 📁 src/                            # الكود المصدري
│   ├── 📁 app/                        # Next.js App Router
│   │   ├── layout.tsx                 # Layout الرئيسي (RTL, fonts, metadata)
│   │   ├── page.tsx                   # Landing Page
│   │   ├── globals.css                # Global CSS + CSS Variables
│   │   │
│   │   ├── 📁 (auth)/                # Route Group: المصادقة
│   │   │   ├── login/page.tsx         # صفحة تسجيل الدخول
│   │   │   ├── register/page.tsx      # صفحة إنشاء حساب
│   │   │   └── layout.tsx             # Layout المصادقة
│   │   │
│   │   ├── 📁 (dashboard)/           # Route Group: لوحة التحكم
│   │   │   ├── layout.tsx             # Layout الداشبورد (sidebar + header)
│   │   │   ├── dashboard/page.tsx     # الصفحة الرئيسية
│   │   │   │
│   │   │   ├── 📁 chat/              # أدوات الدردشة
│   │   │   │   ├── page.tsx           # واجهة الشات الرئيسية
│   │   │   │   └── [id]/page.tsx      # محادثة محددة
│   │   │   │
│   │   │   ├── 📁 tools/             # جميع الأدوات
│   │   │   │   ├── page.tsx           # صفحة كل الأدوات
│   │   │   │   │
│   │   │   │   ├── 📁 content/        # أدوات المحتوى
│   │   │   │   │   ├── page.tsx       # قائمة أدوات المحتوى
│   │   │   │   │   ├── article-writer/page.tsx
│   │   │   │   │   ├── blog-writer/page.tsx
│   │   │   │   │   ├── ad-copy/page.tsx
│   │   │   │   │   ├── social-media/page.tsx
│   │   │   │   │   ├── email-writer/page.tsx
│   │   │   │   │   ├── product-description/page.tsx
│   │   │   │   │   ├── paraphraser/page.tsx
│   │   │   │   │   ├── summarizer/page.tsx
│   │   │   │   │   ├── seo-tools/page.tsx
│   │   │   │   │   └── idea-generator/page.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 image/          # أدوات الصور
│   │   │   │   │   ├── page.tsx       # قائمة أدوات الصور
│   │   │   │   │   ├── generator/page.tsx
│   │   │   │   │   ├── enhancer/page.tsx
│   │   │   │   │   ├── upscaler/page.tsx
│   │   │   │   │   ├── background-remover/page.tsx
│   │   │   │   │   ├── qr-code/page.tsx
│   │   │   │   │   └── logo-designer/page.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 video/          # أدوات الفيديو
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── text-to-video/page.tsx
│   │   │   │   │   ├── image-to-video/page.tsx
│   │   │   │   │   └── lip-sync/page.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 audio/          # أدوات الصوت
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── text-to-speech/page.tsx
│   │   │   │   │   ├── noise-remover/page.tsx
│   │   │   │   │   └── music-generator/page.tsx
│   │   │   │   │
│   │   │   │   └── 📁 business/       # أدوات الأعمال
│   │   │   │       ├── page.tsx
│   │   │   │       ├── persona/page.tsx
│   │   │   │       ├── competitor-analysis/page.tsx
│   │   │   │       └── market-research/page.tsx
│   │   │   │
│   │   │   ├── 📁 history/           # سجل الاستخدام
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 settings/          # الإعدادات
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── 📁 billing/           # الفواتير والاشتراك
│   │   │       └── page.tsx
│   │   │
│   │   └── 📁 api/                   # API Routes
│   │       ├── 📁 auth/              # Auth endpoints
│   │       │   └── [...nextauth]/route.ts
│   │       ├── 📁 chat/              # Chat API
│   │       │   └── route.ts
│   │       ├── 📁 tools/             # Tools API
│   │       │   ├── 📁 content/route.ts
│   │       │   ├── 📁 image/route.ts
│   │       │   ├── 📁 video/route.ts
│   │       │   ├── 📁 audio/route.ts
│   │       │   └── 📁 business/route.ts
│   │       ├── 📁 credits/           # Credits API
│   │       │   └── route.ts
│   │       ├── 📁 user/              # User API
│   │       │   └── route.ts
│   │       └── 📁 webhook/           # Payment webhooks
│   │           └── stripe/route.ts
│   │
│   ├── 📁 components/                # المكونات المشتركة
│   │   ├── 📁 ui/                    # مكونات UI الأساسية
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Progress.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── Slider.tsx
│   │   │
│   │   ├── 📁 layout/               # مكونات Layout
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── Breadcrumbs.tsx
│   │   │
│   │   ├── 📁 landing/              # مكونات Landing Page
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── ToolsShowcase.tsx
│   │   │   ├── Pricing.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── FAQ.tsx
│   │   │   └── CTA.tsx
│   │   │
│   │   ├── 📁 chat/                  # مكونات الشات
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatSidebar.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── StreamingText.tsx
│   │   │
│   │   ├── 📁 tools/                 # مكونات الأدوات
│   │   │   ├── ToolCard.tsx
│   │   │   ├── ToolForm.tsx
│   │   │   ├── ToolResult.tsx
│   │   │   ├── ToolHistory.tsx
│   │   │   ├── CreditCost.tsx
│   │   │   └── GenerationStatus.tsx
│   │   │
│   │   └── 📁 shared/                # مكونات مشتركة
│   │       ├── Logo.tsx
│   │       ├── ThemeToggle.tsx
│   │       ├── LanguageSwitch.tsx
│   │       ├── CreditBalance.tsx
│   │       ├── UpgradePrompt.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── 📁 lib/                       # Utilities والمكتبات
│   │   ├── prisma.ts                  # Prisma client
│   │   ├── auth.ts                    # NextAuth config
│   │   ├── stripe.ts                  # Stripe config
│   │   ├── s3.ts                      # AWS S3 config
│   │   ├── redis.ts                   # Redis config
│   │   ├── utils.ts                   # Helper functions
│   │   ├── constants.ts               # ثوابت المشروع
│   │   ├── validations.ts             # Zod schemas
│   │   └── 📁 ai/                    # AI service wrappers
│   │       ├── openai.ts              # OpenAI client
│   │       ├── stability.ts           # Stability AI client
│   │       ├── replicate.ts           # Replicate client
│   │       ├── elevenlabs.ts          # ElevenLabs client
│   │       └── types.ts              # AI types
│   │
│   ├── 📁 hooks/                     # React Hooks
│   │   ├── useCredits.ts
│   │   ├── useChat.ts
│   │   ├── useTools.ts
│   │   ├── useUser.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── 📁 stores/                    # State Management (Zustand)
│   │   ├── chatStore.ts
│   │   ├── userStore.ts
│   │   ├── toolsStore.ts
│   │   └── uiStore.ts
│   │
│   ├── 📁 types/                     # TypeScript Types
│   │   ├── user.ts
│   │   ├── chat.ts
│   │   ├── tools.ts
│   │   ├── credits.ts
│   │   └── api.ts
│   │
│   └── 📁 i18n/                      # الترجمة
│       ├── ar.json                    # العربية
│       └── en.json                    # الإنجليزية
│
├── 📁 prisma/                         # Database
│   ├── schema.prisma                  # Database schema
│   ├── seed.ts                        # Seed data
│   └── 📁 migrations/                # Migration files
│
├── 📁 public/                         # Static files
│   ├── 📁 images/                    # صور الموقع
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   └── 📁 tools/                # أيقونات الأدوات
│   ├── 📁 fonts/                     # خطوط عربية
│   └── favicon.ico
│
├── .env.local                         # Environment variables (لا يُرفع على Git)
├── .env.example                       # مثال Environment variables
├── next.config.js                     # Next.js config
├── tailwind.config.ts                 # Tailwind config
├── tsconfig.json                      # TypeScript config
├── package.json                       # Dependencies
├── prisma/schema.prisma               # Database schema
└── README.md                          # Project README
```

---

## 📏 قواعد تسمية الملفات

| النوع | القاعدة | مثال |
|-------|---------|------|
| **صفحات** | `page.tsx` داخل مجلد بالاسم | `tools/content/page.tsx` |
| **مكونات** | PascalCase | `ChatInput.tsx` |
| **Hooks** | camelCase يبدأ بـ use | `useCredits.ts` |
| **Types** | camelCase | `chat.ts` |
| **API Routes** | `route.ts` داخل مجلد | `api/chat/route.ts` |
| **Utilities** | camelCase | `utils.ts` |
| **Stores** | camelCase يختتم بـ Store | `chatStore.ts` |

---

## 🔑 Environment Variables

```env
# .env.example - انسخ ده لـ .env.local واملأ القيم

# ── Database ──
DATABASE_URL="postgresql://user:password@localhost:5432/takamul"

# ── NextAuth ──
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# ── AI APIs ──
OPENAI_API_KEY="sk-..."
STABILITY_API_KEY="sk-..."
REPLICATE_API_TOKEN="r8_..."
ELEVENLABS_API_KEY="..."

# ── Storage ──
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="me-south-1"
AWS_BUCKET_NAME="takamul-ai"

# ── Stripe ──
STRIPE_SECRET_KEY="sk_..."
STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ── Redis ──
REDIS_URL="redis://localhost:6379"
```
