"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, Zap, Crown, Building2, ChevronDown, Loader2, Package } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const FAQS = [
  { q: "ما الفرق بين الباقات؟", a: "كل باقة بتديك عدد كريديت شهرياً معين بيتجدد تلقائياً. الكريديت بيستخدم في كل أداة (توليد صورة، فيديو، إلخ) — الـ Pro و Enterprise بياخدوا أولوية أعلى وبيوصلوا للنماذج المتقدمة زي Sora 2 و Veo 3.1 و Kling Pro." },
  { q: "هل يمكنني الترقية أو الإلغاء في أي وقت؟", a: "أيوة. تقدر تلغي الاشتراك من /settings → الفوترة في أي وقت — هيشتغل لحد نهاية الفترة المدفوعة، ومش هيتجدد. والترقية فورية مع احتساب الفرق." },
  { q: "لو خلصت الكريديت قبل آخر الشهر؟", a: "تقدر تشتري حزمة كريديت إضافية (One-time) في أي وقت، مفيش تجديد ولا التزام — وعمرها مش بينتهي." },
  { q: "هل الصور والفيديوهات اللي بتولدها بحقوقي؟", a: "بالكامل. كل اللي بتولده ملك تجاري ليك 100% — تقدر تستخدمه في أي حاجة (إعلانات، يوتيوب، عملاء، إلخ)." },
  { q: "بتدعم وسائل دفع تانية غير الكارت؟", a: "حالياً Stripe بيقبل Visa, Mastercard, Apple Pay و Google Pay. بنشتغل على إضافة محافظ دفع محلية قريباً." },
];

interface PlanData {
  plan:        "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  name:        string;
  englishName: string;
  monthlyUsd:  number;
  credits:     number;
  features:    string[];
  popular:     boolean;
  buyable:     boolean;
}

interface PackData {
  id:      string;
  name:    string;
  credits: number;
  usd:     number;
  bonus:   number;
  buyable: boolean;
}

const PLAN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FREE:       Zap,
  BASIC:      Zap,
  PRO:        Crown,
  ENTERPRISE: Building2,
};

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [plans,    setPlans]    = useState<PlanData[]>([]);
  const [packs,    setPacks]    = useState<PackData[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [busyId,   setBusyId]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stripe/checkout")
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.plans ?? []);
        setPacks(d.creditPacks ?? []);
      })
      .catch(() => toast.error("فشل تحميل الباقات"))
      .finally(() => setLoading(false));
  }, []);

  const buyPlan = async (planId: PlanData["plan"]) => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/pricing")}`);
      return;
    }
    if (planId === "FREE") return;
    setBusyId(planId);
    try {
      const r = await fetch("/api/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ kind: "plan", planId }),
      });
      const data = await r.json();
      if (!r.ok || !data.url) throw new Error(data.error || "فشل بدء الدفع");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ في الدفع");
      setBusyId(null);
    }
  };

  const buyPack = async (packId: string) => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/pricing")}`);
      return;
    }
    setBusyId(packId);
    try {
      const r = await fetch("/api/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ kind: "creditPack", packId }),
      });
      const data = await r.json();
      if (!r.ok || !data.url) throw new Error(data.error || "فشل بدء الدفع");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ في الدفع");
      setBusyId(null);
    }
  };

  const userPlan = session?.user?.plan ?? "FREE";

  return (
    <div className="min-h-screen bg-bg-primary pt-32 pb-0 relative overflow-hidden">
      <Navbar />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-accent-400/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 text-center mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-accent-400/30 text-accent-400 text-sm font-bold tracking-wide mb-6 shadow-[0_0_20px_rgba(254,228,64,0.15)]"
        >
          <Sparkles className="w-4 h-4" />
          الاستثمار الأمثل لمشروعك
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
          اختر القوة التي{" "}
          <span className="bg-gradient-to-l from-primary-400 to-accent-400 bg-clip-text text-transparent">
            تدفع إبداعك للأمام
          </span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          باقات شفافة بدون عقود — كريديت يتجدد شهرياً، وحزم إضافية في أي وقت.
        </p>
      </div>

      {/* Plans */}
      <div className="site-container relative z-10 mb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan, i) => {
              const Icon    = PLAN_ICONS[plan.plan] ?? Zap;
              const isCurrent = userPlan === plan.plan;
              const isFree    = plan.plan === "FREE";
              const isPopular = plan.popular;
              return (
                <motion.div
                  key={plan.plan}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={cn(
                    "w-full relative p-[1.5px] rounded-3xl",
                    isPopular
                      ? "bg-gradient-to-t from-primary-600 via-primary-400 to-accent-400 shadow-[0_0_60px_rgba(254,228,64,0.25)]"
                      : "bg-white/5",
                  )}
                >
                  {isPopular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white px-4 py-1 rounded-full text-xs font-black tracking-widest border border-white/20 z-10">
                      الأكثر طلباً
                    </div>
                  )}
                  <div className="w-full h-full bg-[#0a0a0f]/95 backdrop-blur-3xl rounded-[calc(1.5rem-1px)] p-7 flex flex-col">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-5",
                      isPopular
                        ? "bg-gradient-to-tr from-primary-400 to-accent-400 shadow-[0_0_20px_rgba(254,228,64,0.5)]"
                        : "bg-white/5 border border-white/10",
                    )}>
                      <Icon className={cn("w-6 h-6", isPopular ? "text-black" : "text-gray-300")} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-gray-500 text-xs mb-5 pb-5 border-b border-white/10">{plan.englishName}</p>

                    <div className="mb-6">
                      {isFree ? (
                        <span className="text-4xl font-black text-white">مجاني</span>
                      ) : (
                        <>
                          <span className="text-4xl font-black text-white">${plan.monthlyUsd}</span>
                          <span className="text-gray-500"> / شهرياً</span>
                        </>
                      )}
                      <p className="text-xs text-accent-400 mt-1 font-bold">
                        <Zap className="w-3 h-3 inline mr-1" />
                        {plan.credits.toLocaleString("en")} كريديت شهرياً
                      </p>
                    </div>

                    <ul className="space-y-3 mb-7 flex-1">
                      {plan.features.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                          <CheckCircle2 className={cn("w-4 h-4 shrink-0 mt-0.5", isPopular ? "text-accent-400" : "text-gray-500")} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <Button disabled className="w-full h-11 bg-white/5 text-gray-500 cursor-not-allowed">
                        باقتك الحالية
                      </Button>
                    ) : isFree ? (
                      <Button
                        onClick={() => router.push(session?.user ? "/dashboard" : "/register")}
                        variant="ghost"
                        className="w-full h-11 bg-white/5 font-bold text-white hover:bg-white/10"
                      >
                        ابدأ مجاناً
                      </Button>
                    ) : !plan.buyable ? (
                      <Button disabled variant="ghost" className="w-full h-11 bg-white/5 text-gray-500">
                        قريباً
                      </Button>
                    ) : (
                      <Button
                        onClick={() => buyPlan(plan.plan)}
                        disabled={busyId === plan.plan}
                        className={cn(
                          "w-full h-11 font-black",
                          isPopular
                            ? "bg-white text-black hover:bg-gray-200"
                            : "bg-accent-400/15 text-accent-400 border border-accent-400/30 hover:bg-accent-400/25",
                        )}
                      >
                        {busyId === plan.plan
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري التحويل…</>
                          : <>اشترك الآن</>}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Credit packs */}
      {!loading && packs.length > 0 && (
        <div className="site-container relative z-10 mb-32">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">حزم كريديت إضافية</h2>
            <p className="text-gray-400">شراء لمرة واحدة — مفيش تجديد، عمر الكريديت لا ينتهي.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packs.map((p) => (
              <div key={p.id} className="bento-card rounded-2xl p-6 border border-white/10 hover:border-accent-400/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-accent-400/10 border border-accent-400/20 flex items-center justify-center mb-4">
                  <Package className="w-5 h-5 text-accent-400" />
                </div>
                <h4 className="text-lg font-bold text-white">{p.name}</h4>
                <p className="text-3xl font-black text-accent-400 mt-2">{p.credits.toLocaleString("en")}</p>
                <p className="text-xs text-gray-500 mb-2">كريديت {p.bonus > 0 && <span className="text-emerald-400">+ {p.bonus} مكافأة</span>}</p>
                <p className="text-2xl font-black text-white mb-4">${p.usd}</p>
                <Button
                  onClick={() => buyPack(p.id)}
                  disabled={!p.buyable || busyId === p.id}
                  variant="ghost"
                  className="w-full bg-white/5 hover:bg-white/10"
                >
                  {!p.buyable
                    ? "قريباً"
                    : busyId === p.id
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري التحويل…</>
                      : "شراء"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQs */}
      <div className="max-w-3xl mx-auto px-6 relative z-10 mb-32">
        <h2 className="text-3xl md:text-4xl font-black text-center text-white mb-10">الأسئلة المتكررة</h2>
        <div className="flex flex-col gap-4">
          {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="glass-card rounded-2xl border border-white/10 overflow-hidden cursor-pointer"
      onClick={() => setOpen((v) => !v)}
    >
      <div className="p-5 flex items-center justify-between text-white hover:bg-white/5 transition-colors">
        <span className="font-bold text-lg">{q}</span>
        <ChevronDown className={cn("w-5 h-5 text-gray-500 transition-transform duration-300", open && "rotate-180 text-white")} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-gray-400 leading-relaxed border-t border-white/5 pt-4">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
