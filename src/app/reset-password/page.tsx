"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <Suspense fallback={null}>
        <ResetPasswordInner />
      </Suspense>
    </div>
  );
}

function ResetPasswordInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [show,     setShow]     = useState(false);
  const [status,   setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Missing token → invalid landing page.
  if (!token || !email) {
    return (
      <div className="bento-card rounded-3xl border border-white/10 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-9 h-9 text-red-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">رابط غير صالح</h1>
        <p className="text-gray-400 mb-6">الرابط مفقود أو تالف.</p>
        <Link href="/forgot-password" className="px-6 py-2.5 rounded-xl bg-accent-400 text-black font-bold inline-block">
          طلب رابط جديد
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setErrorMsg("كلمة المرور لا تقل عن 8 أحرف"); return; }
    if (password !== confirm) { setErrorMsg("كلمتا المرور غير متطابقتين"); return; }
    setStatus("loading");
    setErrorMsg("");
    try {
      const r = await fetch("/api/auth/password-reset/confirm", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, email, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "فشلت العملية");
      setStatus("success");
      setTimeout(() => router.push("/login"), 2200);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "خطأ");
    }
  };

  if (status === "success") {
    return (
      <div className="bento-card rounded-3xl border border-white/10 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-9 h-9 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">تم تعيين كلمة المرور ✨</h1>
        <p className="text-gray-500 text-sm">جاري تحويلك لتسجيل الدخول…</p>
      </div>
    );
  }

  return (
    <div className="bento-card rounded-3xl border border-white/10 p-10 max-w-md w-full">
      <div className="text-center mb-7">
        <div className="w-14 h-14 rounded-2xl bg-accent-400/10 border border-accent-400/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-accent-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-1">كلمة مرور جديدة</h1>
        <p className="text-sm text-gray-500" dir="ltr">{email}</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1.5">كلمة المرور الجديدة</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              dir="ltr"
              className="w-full h-12 px-4 pl-12 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent-400 transition-colors"
              placeholder="8 أحرف على الأقل"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              aria-label={show ? "إخفاء" : "إظهار"}
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1.5">تأكيد كلمة المرور</label>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            dir="ltr"
            className="w-full h-12 px-4 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent-400 transition-colors"
            placeholder="كرر كلمة المرور"
          />
        </div>

        {errorMsg && (
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
            ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ…</>
            : "حفظ كلمة المرور"}
        </button>
      </form>
    </div>
  );
}
