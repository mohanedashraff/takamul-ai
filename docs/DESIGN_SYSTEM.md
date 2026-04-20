# 🎨 نظام التصميم - منصة تكامل

> كل قرار تصميمي في مكان واحد. ارجع هنا قبل ما تصمم أي حاجة.

---

## 🎨 الألوان

### الوضع الداكن (الافتراضي)
```css
:root {
  /* ── Primary ── */
  --primary-50: #eef2ff;
  --primary-100: #e0e7ff;
  --primary-200: #c7d2fe;
  --primary-300: #a5b4fc;
  --primary-400: #818cf8;
  --primary-500: #6366f1;   /* ← الأساسي */
  --primary-600: #4f46e5;
  --primary-700: #4338ca;
  --primary-800: #3730a3;
  --primary-900: #312e81;

  /* ── Accent (Cyan) ── */
  --accent-400: #22d3ee;
  --accent-500: #06b6d4;
  --accent-600: #0891b2;

  /* ── Background ── */
  --bg-primary: #0a0a1a;     /* خلفية الموقع */
  --bg-secondary: #111827;   /* خلفية الكروت */
  --bg-tertiary: #1f2937;    /* خلفية العناصر */
  --bg-surface: #1e1e3a;     /* سطح مرتفع */

  /* ── Text ── */
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
  --text-accent: #818cf8;

  /* ── Border ── */
  --border-primary: #374151;
  --border-secondary: #1f2937;
  --border-accent: rgba(99, 102, 241, 0.3);

  /* ── Status ── */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```

### Gradients المستخدمة
```css
/* البطل والعناوين */
--gradient-hero: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);

/* الكروت hover */
--gradient-card: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);

/* الأزرار */
--gradient-button: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);

/* خلفية decorative */
--gradient-glow: radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.15), transparent 40%);
```

---

## 🔤 الخطوط

### العربي
- **العنوان**: `Tajawal` (Bold 700, ExtraBold 800)
- **الجسم**: `Tajawal` (Regular 400, Medium 500)
- **الأرقام**: `IBM Plex Sans Arabic` (Tabular)

### الإنجليزي
- **العنوان**: `Inter` (Bold 700)
- **الجسم**: `Inter` (Regular 400, Medium 500)
- **الكود**: `JetBrains Mono`

### مقاسات الخط
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
--text-6xl: 3.75rem;   /* 60px */
```

---

## 📐 المسافات

نظام 4px:
```
4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px
```

---

## 🃏 الكروت

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.card:hover {
  border-color: var(--border-accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
}
```

---

## 🔘 الأزرار

| النوع | الاستخدام | الخلفية | اللون |
|-------|----------|---------|-------|
| **Primary** | CTA الرئيسي | gradient-button | أبيض |
| **Secondary** | إجراء ثانوي | شفاف + border | primary |
| **Ghost** | إجراء خفيف | شفاف | text-secondary |
| **Danger** | حذف/خطر | error | أبيض |

### الأحجام
| الحجم | الطول | الحشو | الخط |
|-------|-------|-------|------|
| **sm** | 32px | 12px 16px | 14px |
| **md** | 40px | 12px 24px | 16px |
| **lg** | 48px | 16px 32px | 16px |
| **xl** | 56px | 16px 40px | 18px |

---

## 📱 Breakpoints

```css
sm: 640px    /* موبايل كبير */
md: 768px    /* تابلت */
lg: 1024px   /* لابتوب */
xl: 1280px   /* ديسكتوب */
2xl: 1536px  /* شاشة كبيرة */
```

---

## 🎭 الأنيميشنات

```css
/* دخول العناصر */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Stagger delay */
.stagger-1 { animation-delay: 0ms; }
.stagger-2 { animation-delay: 100ms; }
.stagger-3 { animation-delay: 200ms; }

/* Hover scale */
.hover-scale { transition: transform 0.2s ease; }
.hover-scale:hover { transform: scale(1.02); }

/* Glow effect */
.glow {
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
}
```

### Framer Motion Presets
```tsx
// دخول من الأسفل
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

// دخول متتابع
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};
```

---

## 🧩 أيقونات الأدوات

نستخدم **Lucide React** لكل الأيقونات:

| الفئة | الأيقونة | الكود |
|-------|---------|-------|
| 💬 دردشة | MessageSquare | `<MessageSquare />` |
| ✍️ محتوى | PenTool | `<PenTool />` |
| 🎨 صور | Image | `<ImageIcon />` |
| 🎬 فيديو | Video | `<Video />` |
| 🎵 صوت | Music | `<Music />` |
| 🏢 أعمال | Briefcase | `<Briefcase />` |

---

## 📋 أمثلة تطبيقية

### كارت أداة
```tsx
<div className="group relative bg-gray-900 border border-gray-800 rounded-2xl p-6 
  hover:border-indigo-500/30 transition-all duration-300 cursor-pointer
  hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1">
  
  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
    <PenTool className="w-6 h-6 text-indigo-400" />
  </div>
  
  <h3 className="text-lg font-bold text-white mb-2">كاتب المقالات</h3>
  <p className="text-gray-400 text-sm">كتابة مقالات SEO احترافية</p>
  
  <div className="mt-4 flex items-center gap-2">
    <Badge variant="accent">5 credits</Badge>
  </div>
</div>
```

### فورم أداة
```tsx
<div className="max-w-2xl mx-auto">
  <h1 className="text-3xl font-bold text-white mb-2">كاتب المقالات</h1>
  <p className="text-gray-400 mb-8">اكتب مقالات SEO احترافية بالذكاء الاصطناعي</p>
  
  <Card>
    <form>
      <Input label="عنوان المقال" placeholder="اكتب الموضوع..." />
      <Textarea label="الكلمات المفتاحية" placeholder="كلمة 1، كلمة 2..." />
      <Select label="طول المقال" options={[500, 1000, 2000, 3000]} />
      <Select label="النبرة" options={["رسمي", "غير رسمي", "أكاديمي"]} />
      <Button type="submit" className="w-full">
        توليد المقال <Sparkles className="w-4 h-4" />
      </Button>
    </form>
  </Card>
</div>
```
