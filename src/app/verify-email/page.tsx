"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, MailCheck } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <Suspense fallback={null}>
        <VerifyEmailInner />
      </Suspense>
    </div>
  );
}

type Phase = "idle" | "verifying" | "success" | "error";

function VerifyEmailInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [phase,   setPhase]   = useState<Phase>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // No token → "check your inbox" view.
    if (!token || !email) return;

    setPhase("verifying");
    fetch("/api/auth/verify-email/confirm", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token, email }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "فشل التأكيد");
        setPhase("success");
        setMessage("تم تأكيد بريدك بنجاح ✨");
        setTimeout(() => router.push("/dashboard"), 2200);
      })
      .catch((err) => {
        setPhase("error");
        setMessage(err instanceof Error ? err.message : "حدث خطأ");
      });
  }, [token, email, router]);

  // Resend
  const [resending, setResending] = useState(false);
  const [resentOk,  setResentOk]  = useState(false);
  const resend = async () => {
    if (!email) return;
    setResending(true);
    setResentOk(false);
    try {
      await fetch("/api/auth/verify-email/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      setResentOk(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bento-card rounded-3xl border border-white/10 p-10 max-w-md w-full text-center">
      {phase === "idle" && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-accent-400/10 border border-accent-400/30 flex items-center justify-center mx-auto mb-5">
            <MailCheck className="w-8 h-8 text-accent-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">تحقق من بريدك</h1>
          <p className="text-gray-400 mb-6 leading-relaxed">
            بعتنالك رابط تأكيد على{" "}
            <span className="text-white font-bold" dir="ltr">{email ?? "بريدك"}</span>.
            افتح الرسالة واضغط على الرابط لتفعيل حسابك.
          </p>
          <button
            onClick={resend}
            disabled={resending || !email}
            className="text-sm font-bold text-accent-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {resending ? "جاري الإرسال…" : resentOk ? "تم إرسال الرابط مجدداً ✓" : "إعادة إرسال الرابط"}
          </button>
        </>
      )}

      {phase === "verifying" && (
        <>
          <Loader2 className="w-12 h-12 text-accent-400 animate-spin mx-auto mb-5" />
          <h1 className="text-xl font-bold text-white">جاري تأكيد البريد…</h1>
        </>
      )}

      {phase === "success" && (
        <>
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">{message}</h1>
          <p className="text-gray-500 text-sm">جاري تحويلك إلى لوحة التحكم…</p>
        </>
      )}

      {phase === "error" && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-9 h-9 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">{message || "تعذّر التأكيد"}</h1>
          <p className="text-gray-500 text-sm mb-6">
            ربما الرابط منتهي الصلاحية أو تم استخدامه. اطلب رابطاً جديداً.
          </p>
          {email && (
            <button
              onClick={resend}
              disabled={resending}
              className="px-6 py-2.5 rounded-xl bg-accent-400 text-black font-bold text-sm hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-60"
            >
              {resending ? "جاري الإرسال…" : "إرسال رابط جديد"}
            </button>
          )}
          <p className="mt-6">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white">العودة لتسجيل الدخول</Link>
          </p>
        </>
      )}
    </div>
  );
}
