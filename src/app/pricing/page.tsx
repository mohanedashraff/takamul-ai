"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, Zap, Crown, Building2, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/Button";

const FAQS = [
  { q: "ما الذي يميز باقة المحترفين (Pro) عن الأساسية؟", a: "باقة المحترفين تفتح لك كافة القيود لتوليد الصور والفيديو والمقالات بالإضافة إلى سرعة معالجة استثنائية ونماذج الذكاء الاصطناعي الأحدث، لتلبية سرعة أعمالك." },
  { q: "هل يمكنني الترقية أو الإلغاء في أي وقت؟", a: "نعم، يمكنك الإلغاء في أي وقت من لوحة التحكم لتوقف التجديد التلقائي للشهور القادمة دون أي غرامات، كما يمكنك ترقية باقتك ودفع الفارق فقط." },
  { q: "هل الصور الناتجة فيها حقوق ملكية لي؟", a: "بالتأكيد. جميع المواد والصور التي تولدها عبر المنصة تصبح ملكية تجارية كاملة لك بنسبة 100% ولا نشاركها مع طرف ثالث." },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-bg-primary pt-32 pb-0 relative overflow-hidden">
      <Navbar />
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-accent-400/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Hero Section */}
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
          اختر القوة التي <span className="bg-gradient-to-l from-primary-400 to-accent-400 bg-clip-text text-transparent">تدفع إبداعك للأمام</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          لا حدود لما يمكنك صنعه، بأسعار تناسب المبتدئين والمحترفين لنمو لا نهائي.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 text-white">
          <span className={`text-lg font-bold transition-colors ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>شهري</span>
          <button 
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-16 h-8 rounded-full bg-white/10 relative p-1 border border-white/20 transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-accent-400/50"
          >
            <motion.div 
              layout
              className="w-6 h-6 bg-accent-400 rounded-full shadow-[0_0_10px_rgba(254,228,64,0.5)]"
              animate={{ x: isAnnual ? -32 : 0 }} // -32px for RTL shift
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold transition-colors ${isAnnual ? 'text-white' : 'text-gray-500'}`}>سنوي</span>
            <span className="px-2 py-0.5 rounded bg-neon-pink/20 text-neon-pink text-xs font-black border border-neon-pink/30 shadow-[0_0_10px_rgba(254,228,64,0.2)]">وفّر 20%</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="site-container relative z-10 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Basic Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full glass-card p-8 rounded-3xl border border-white/5 bg-black/40 hover:bg-black/80 hover:border-white/20 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">الأساسي</h3>
            <p className="text-gray-400 text-sm mb-6 pb-6 border-b border-white/10">للمبتدئين لاستكشاف عالم الذكاء الاصطناعي</p>
            <div className="mb-8">
              <span className="text-4xl font-black text-white">${isAnnual ? 12 : 15}</span>
              <span className="text-gray-500">/ شهرياً</span>
            </div>
            <ul className="space-y-4 mb-8">
              {["توليد 50 صورة شهرياً", "10 دقائق من إنتاج الفيديو", "الوصول لنماذج الكتابة الأساسية", "دعم فني عبر البريد"].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-gray-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="ghost" className="w-full bg-white/5 font-bold text-white hover:bg-white/10 h-12">اشترك الآن</Button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full relative p-[2px] rounded-[2rem] bg-gradient-to-t from-primary-600 via-primary-400 to-accent-400 shadow-[0_0_60px_rgba(254,228,64,0.25)] md:-mt-8 md:mb-8 hover:shadow-[0_0_80px_rgba(254,228,64,0.35)] transition-all duration-500 group"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white px-4 py-1 rounded-full text-xs font-black tracking-widest border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)] z-10">الأكثر طلباً</div>
            <div className="w-full h-full bg-[#0a0a0f]/95 backdrop-blur-3xl rounded-[calc(2rem-2px)] p-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-400 to-accent-400 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(254,228,64,0.5)]">
                <Crown className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">المحترف</h3>
              <p className="text-gray-400 text-sm mb-6 pb-6 border-b border-white/10">لصناع المحتوى والمستقلين، كل شيء بلا حدود تقريباً</p>
              <div className="mb-8">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">${isAnnual ? 39 : 49}</span>
                <span className="text-gray-500">/ شهرياً</span>
              </div>
              <ul className="space-y-4 mb-8">
                {["توليد لا محدود للصور العالية الدقة", "100 دقيقة لتوليد وتحرير الفيديو الثقيل", "الوصول لديف-مود المبرمج المساعد", "استنساخ الأصوات العربية المتقدم", "أولوية وسرعة المعالجة (Priority Queue)"].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-white text-sm font-bold">
                    <CheckCircle2 className="w-5 h-5 text-accent-400 shrink-0 shadow-[0_0_10px_rgba(254,228,64,0.4)] rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full h-12 bg-white text-black hover:bg-gray-200 font-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">ابدأ مسيرتك الاحترافية</Button>
            </div>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full glass-card p-8 rounded-3xl border border-white/5 bg-black/40 hover:bg-black/80 hover:border-white/20 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Building2 className="w-6 h-6 text-neon-pink" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">المؤسسات</h3>
            <p className="text-gray-400 text-sm mb-6 pb-6 border-b border-white/10">للشركات والفرق التي تبحث عن أقصى استفادة</p>
            <div className="mb-8">
              <span className="text-4xl font-black text-white">${isAnnual ? 159 : 199}</span>
              <span className="text-gray-500">/ شهرياً</span>
            </div>
            <ul className="space-y-4 mb-8">
              {["5 أعضاء للفريق بمساحة عمل مشتركة", "دعم الـ API للربط مع أنظمتكم", "وكلاء مخصصين بمعلومات علامتكم التجارية", "مدير حساب شخصي (دعم VIP 24/7)"].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-gray-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="ghost" className="w-full bg-white/5 font-bold text-white hover:bg-white/10 h-12">تواصل معنا</Button>
          </motion.div>

        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-6 relative z-10 mb-32">
        <h2 className="text-3xl md:text-4xl font-black text-center text-white mb-10">الأسئلة المتكررة</h2>
        <div className="flex flex-col gap-4">
          {FAQS.map((faq, idx) => {
            return (
              <FaqItem key={idx} q={faq.q} a={faq.a} />
            )
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}

const FaqItem = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div 
      className="glass-card rounded-2xl border border-white/10 overflow-hidden cursor-pointer"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="p-5 flex items-center justify-between text-white hover:bg-white/5 transition-colors">
        <span className="font-bold text-lg">{q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-white" : ""}`} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 text-gray-400 text-sm leading-relaxed border-t border-white/5 mt-2">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
