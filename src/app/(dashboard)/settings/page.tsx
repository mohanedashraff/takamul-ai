"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  User as UserIcon, Mail, Lock, Camera, Loader2, Check,
  CreditCard, Shield, Zap, Calendar, Crown, Gift, Copy as CopyIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useUserStore } from "@/stores/useUserStore";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Tab = "profile" | "security" | "billing" | "referrals";

export default function SettingsPage() {
  const { update } = useSession();
  const { user, fetchUser } = useUserStore();
  const [tab, setTab] = useState<Tab>("profile");

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (!user) {
    return (
      <div className="site-container py-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
      </div>
    );
  }

  return (
    <div className="site-container py-8 pb-20 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2">الإعدادات</h1>
        <p className="text-gray-400">إدارة حسابك وإعداداتك</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.02] border border-white/5 rounded-2xl w-fit overflow-x-auto no-scrollbar">
        <TabButton active={tab === "profile"}   onClick={() => setTab("profile")}   icon={UserIcon}   label="الملف الشخصي" />
        <TabButton active={tab === "security"}  onClick={() => setTab("security")}  icon={Lock}       label="الأمان" />
        <TabButton active={tab === "billing"}   onClick={() => setTab("billing")}   icon={CreditCard} label="الاشتراك" />
        <TabButton active={tab === "referrals"} onClick={() => setTab("referrals")} icon={Gift}       label="الإحالات" />
      </div>

      {tab === "profile"   && <ProfileTab onSaved={() => { fetchUser(); update(); }} />}
      {tab === "security"  && <SecurityTab />}
      {tab === "billing"   && <BillingTab />}
      {tab === "referrals" && <ReferralsTab />}
    </div>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────
function ProfileTab({ onSaved }: { onSaved: () => void }) {
  const user = useUserStore((s) => s.user)!;
  const [name, setName]   = useState(user.name ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: image || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "حدث خطأ");
      } else {
        toast.success("تم حفظ التعديلات");
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  const changed = name !== (user.name ?? "") || image !== (user.image ?? "");

  return (
    <Card className="border-border-glass">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white">الملف الشخصي</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-tr from-primary-500 to-accent-400 flex items-center justify-center text-2xl font-black text-black">
            {user.image ? (
              <img src={user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              (user.name ?? user.email).slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white mb-1">صورة البروفايل</div>
            <p className="text-xs text-gray-500">ضع رابط صورة من أي موقع</p>
          </div>
        </div>

        {/* Image URL */}
        <FormField
          label="رابط الصورة (اختياري)"
          icon={Camera}
          value={image}
          onChange={setImage}
          placeholder="https://..."
          dir="ltr"
        />

        {/* Name */}
        <FormField
          label="الاسم"
          icon={UserIcon}
          value={name}
          onChange={setName}
          placeholder="اسمك الكامل"
        />

        {/* Email (readonly) */}
        <FormField
          label="البريد الإلكتروني"
          icon={Mail}
          value={user.email}
          onChange={() => {}}
          readonly
          dir="ltr"
        />

        <div className="pt-2 flex justify-end">
          <Button
            variant="cosmic"
            onClick={save}
            disabled={!changed || saving}
            className="px-8"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Check className="w-4 h-4 ml-2" /> حفظ التعديلات</>)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving]   = useState(false);

  async function save() {
    if (next.length < 8) return toast.error("كلمة المرور الجديدة لازم 8 أحرف على الأقل");
    if (next !== confirm) return toast.error("كلمات المرور مش متطابقة");

    setSaving(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? "حدث خطأ");
      else {
        toast.success("تم تغيير كلمة المرور");
        setCurrent(""); setNext(""); setConfirm("");
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border-glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">الأمان</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
            <Shield className="w-5 h-5 text-accent-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-white mb-1">تغيير كلمة المرور</div>
              <p className="text-xs text-gray-500">اختر كلمة مرور قوية لم تستخدمها قبل كده.</p>
            </div>
          </div>

          <FormField label="كلمة المرور الحالية" icon={Lock} value={current} onChange={setCurrent} type="password" dir="ltr" />
          <FormField label="كلمة المرور الجديدة" icon={Lock} value={next} onChange={setNext} type="password" dir="ltr" />
          <FormField label="تأكيد كلمة المرور الجديدة" icon={Lock} value={confirm} onChange={setConfirm} type="password" dir="ltr" />

          <div className="pt-2 flex justify-end">
            <Button variant="cosmic" onClick={save} disabled={saving || !current || !next || !confirm} className="px-8">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "تغيير كلمة المرور"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DangerZone />
    </div>
  );
}

// ── GDPR / Danger Zone ────────────────────────────────────────────────
function DangerZone() {
  const user = useUserStore((s) => s.user)!;
  const [downloading,   setDownloading]   = useState(false);
  const [showDelete,    setShowDelete]    = useState(false);
  const [confirmEmail,  setConfirmEmail]  = useState("");
  const [confirmPwd,    setConfirmPwd]    = useState("");
  const [deleting,      setDeleting]      = useState(false);

  const exportData = async () => {
    setDownloading(true);
    try {
      const r = await fetch("/api/user/export");
      if (!r.ok) throw new Error("فشل التصدير");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `yilow-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل بياناتك");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setDownloading(false);
    }
  };

  const deleteAccount = async () => {
    if (confirmEmail.toLowerCase().trim() !== user.email.toLowerCase()) {
      toast.error("الرجاء كتابة بريدك بالضبط");
      return;
    }
    setDeleting(true);
    try {
      const r = await fetch("/api/user/delete", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ confirmEmail, password: confirmPwd || undefined }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "فشل الحذف");
      toast.success("تم حذف حسابك");
      // Sign out and bounce home.
      await fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
      window.location.href = "/";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
      setDeleting(false);
    }
  };

  return (
    <Card className="border-red-500/20 bg-red-500/[0.02]">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-red-300">منطقة الخطر</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div>
            <div className="text-sm font-bold text-white">تنزيل بياناتي</div>
            <p className="text-xs text-gray-500 mt-0.5">احصل على نسخة JSON من كل بياناتك (GDPR).</p>
          </div>
          <Button onClick={exportData} disabled={downloading} variant="glass" className="px-5 shrink-0">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تنزيل JSON"}
          </Button>
        </div>

        {/* Delete */}
        <div className="p-4 rounded-xl bg-red-500/[0.04] border border-red-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-red-200">حذف الحساب نهائياً</div>
              <p className="text-xs text-red-300/60 mt-0.5">كل بياناتك (محادثات، توليدات، مساحات) هتتحذف. لا يمكن التراجع.</p>
            </div>
            {!showDelete && (
              <Button onClick={() => setShowDelete(true)} className="bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 px-5 shrink-0">
                حذف الحساب
              </Button>
            )}
          </div>

          {showDelete && (
            <div className="mt-5 space-y-3 pt-5 border-t border-red-500/15">
              <p className="text-xs text-red-200">للتأكيد، اكتب بريدك ({user.email}) وكلمة المرور:</p>
              <input
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={user.email}
                dir="ltr"
                className="w-full h-10 px-3 bg-black/40 border border-red-500/30 rounded-lg text-sm text-white placeholder-red-300/40 focus:outline-none focus:border-red-500"
              />
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="كلمة المرور (لو حسابك بكلمة مرور)"
                className="w-full h-10 px-3 bg-black/40 border border-red-500/30 rounded-lg text-sm text-white placeholder-red-300/40 focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={deleteAccount}
                  disabled={deleting}
                  className="bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 flex-1"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد الحذف النهائي"}
                </Button>
                <Button
                  onClick={() => { setShowDelete(false); setConfirmEmail(""); setConfirmPwd(""); }}
                  variant="glass"
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BillingTab() {
  const user = useUserStore((s) => s.user)!;
  const [opening, setOpening] = useState(false);

  const openPortal = async () => {
    setOpening(true);
    try {
      const r = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await r.json();
      if (!r.ok || !data.url) throw new Error(data.error || "فشل فتح بوابة الفوترة");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
      setOpening(false);
    }
  };

  const isPaying = user.plan !== "FREE";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="border-border-glass lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">الخطة الحالية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-400/10 border border-accent-400/20 flex items-center justify-center">
              {user.plan === "PRO" || user.plan === "ENTERPRISE" ? (
                <Crown className="w-6 h-6 text-accent-400" />
              ) : (
                <Zap className="w-6 h-6 text-accent-400" />
              )}
            </div>
            <div>
              <div className="text-2xl font-black text-white">{planLabel(user.plan)}</div>
              <p className="text-sm text-gray-500">
                {user.plan === "FREE" ? "استمتع بالأدوات الأساسية" : "كامل الوصول للمنصة"}
              </p>
            </div>
          </div>

          {user.planRenewsAt && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              يتجدد في {new Date(user.planRenewsAt).toLocaleDateString("ar")}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link href="/pricing">
              <Button variant="cosmic" className="px-8">
                {isPaying ? "تغيير الخطة" : "ترقية الخطة"}
              </Button>
            </Link>
            {isPaying && (
              <Button onClick={openPortal} disabled={opening} variant="glass" className="px-6">
                {opening ? "جاري الفتح…" : "إدارة الفوترة (Stripe)"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border-glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">رصيد الكريديت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black text-accent-400 tabular-nums">
              {user.creditsBalance.toLocaleString("en")}
            </div>
            <p className="text-xs text-gray-500 mt-1">من أصل {user.creditsLimit.toLocaleString("en")}</p>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-400 to-primary-400"
              style={{ width: `${Math.min(100, (user.creditsBalance / Math.max(1, user.creditsLimit)) * 100)}%` }}
            />
          </div>
          <Link href="/pricing">
            <Button variant="glass" className="w-full">شحن رصيد</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Bits ─────────────────────────────────────────────────────────
function TabButton({
  active, onClick, icon: Icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all",
        active
          ? "bg-accent-400/15 text-accent-400 shadow-[inset_0_0_0_1px_rgba(254,228,64,0.3)]"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function FormField({
  label, icon: Icon, value, onChange, placeholder, type = "text", dir, readonly,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  dir?: "ltr" | "rtl";
  readonly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-400 mr-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <Icon className="w-4 h-4 text-gray-500 group-focus-within:text-accent-400 transition-colors" />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readonly}
          dir={dir}
          className={cn(
            "w-full h-12 bg-black/40 border border-white/10 rounded-xl pr-11 pl-4 text-white placeholder-gray-600",
            "focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30 transition-all",
            readonly && "opacity-60 cursor-not-allowed",
            dir === "ltr" && "text-left"
          )}
        />
      </div>
    </div>
  );
}

function planLabel(plan: string): string {
  return (
    { FREE: "مجاني", BASIC: "أساسي", PRO: "PRO", ENTERPRISE: "ENTERPRISE" } as Record<string, string>
  )[plan] ?? plan;
}

// ── Referrals tab ────────────────────────────────────────────────────
interface ReferralsData {
  code:   string;
  stats: {
    totalReferrals:     number;
    totalEarnedCredits: number;
    bonuses:            { refereeCredits: number; referrerCredits: number };
  };
  recent: Array<{
    id:        string;
    createdAt: string;
    credits:   number;
    referee:   { name: string; joinedAt: string };
  }>;
}

function ReferralsTab() {
  const [data,    setData]    = useState<ReferralsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referrals", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => toast.error("فشل التحميل"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-accent-400" /></div>;
  if (!data)   return <div className="py-16 text-center text-gray-500">تعذّر تحميل الإحالات</div>;

  const link = typeof window !== "undefined"
    ? `${window.location.origin}/register?ref=${data.code}`
    : `/register?ref=${data.code}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Code + share card */}
      <Card className="border-border-glass lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">رابط الإحالة الخاص بك</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-gray-400 leading-relaxed">
            شارك الرابط مع أصدقائك. لما يسجلوا باستخدامه، هتحصل على{" "}
            <span className="text-accent-400 font-bold">{data.stats.bonuses.referrerCredits} كريديت</span>،
            وهيحصلوا هما على{" "}
            <span className="text-accent-400 font-bold">{data.stats.bonuses.refereeCredits} كريديت</span>{" "}
            مكافأة.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={link}
              dir="ltr"
              className="flex-1 h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-sm text-white"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              variant="cosmic"
              className="px-5"
              onClick={() => { void navigator.clipboard.writeText(link); toast.success("تم نسخ الرابط"); }}
            >
              <CopyIcon className="w-4 h-4 ml-1" /> نسخ
            </Button>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-400/8 border border-accent-400/20 text-xs text-accent-300 font-bold tracking-wider w-fit">
            <Gift className="w-3.5 h-3.5" />
            رمزك: <span className="text-accent-400 font-mono">{data.code}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats card */}
      <Card className="border-border-glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">إحصائياتك</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">
              {data.stats.totalReferrals.toLocaleString("en")}
            </div>
            <p className="text-xs text-gray-500 mt-1">أصدقاء انضموا</p>
          </div>
          <div className="h-px bg-white/5" />
          <div>
            <div className="text-2xl sm:text-3xl font-black text-accent-400 tabular-nums flex items-center gap-1.5">
              <Zap className="w-5 h-5" />
              {data.stats.totalEarnedCredits.toLocaleString("en")}
            </div>
            <p className="text-xs text-gray-500 mt-1">كريديت ربحته</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent referrals */}
      {data.recent.length > 0 && (
        <Card className="border-border-glass lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">آخر الإحالات</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-white/5">
              {data.recent.map((r) => (
                <li key={r.id} className="px-6 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 font-black">
                    {r.referee.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{r.referee.name}</div>
                    <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString("ar")}</div>
                  </div>
                  <span className="text-sm font-black text-accent-400 tabular-nums shrink-0">
                    +{r.credits} كريديت
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
