"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [status,  setStatus]  = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const r = await fetch("/api/auth/password-reset/request", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "فشل الإرسال");
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "خطأ");
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="bento-card rounded-3xl border border-white/10 p-10 max-w-md w-full">
        {status !== "sent" ? (
          <>
            <div className="text-center mb-7">
              <div className="w-14 h-14 rounded-2xl bg-accent-400/10 border border-accent-400/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-accent-400" />
              </div>
              <h1 className="text-2xl font-black text-white mb-2">نسيت كلمة المرور؟</h1>
              <p className="text-sm text-gray-400">
                أدخل بريدك وهنبعتلك رابط لإعادة تعيين كلمة المرور.
              </p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full h-12 px-4 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent-400 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              {status === "error" && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full h-12 rounded-xl bg-accent-400 text-black font-black hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {status === "loading"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال…</>
                  : "إرسال رابط الإعادة"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                الرجوع لتسجيل الدخول
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">تحقق من بريدك</h1>
            <p className="text-gray-400 leading-relaxed mb-6">
              لو الحساب موجود، هتلاقي رابط إعادة تعيين كلمة المرور في الإيميل
              {" "}<span dir="ltr" className="text-white font-bold">{email}</span>.
              الرابط صالح لمدة ساعة.
            </p>
            <Link href="/login" className="text-sm font-bold text-accent-400 hover:text-white transition-colors">
              ← الرجوع لتسجيل الدخول
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
