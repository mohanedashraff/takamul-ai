"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  User as UserIcon, Mail, Lock, Camera, Loader2, Check,
  CreditCard, Shield, Zap, Calendar, Crown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useUserStore } from "@/stores/useUserStore";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Tab = "profile" | "security" | "billing";

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
        <h1 className="text-4xl font-black text-white mb-2">الإعدادات</h1>
        <p className="text-gray-400">إدارة حسابك وإعداداتك</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.02] border border-white/5 rounded-2xl w-fit">
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={UserIcon} label="الملف الشخصي" />
        <TabButton active={tab === "security"} onClick={() => setTab("security")} icon={Lock} label="الأمان" />
        <TabButton active={tab === "billing"} onClick={() => setTab("billing")} icon={CreditCard} label="الاشتراك" />
      </div>

      {tab === "profile"  && <ProfileTab onSaved={() => { fetchUser(); update(); }} />}
      {tab === "security" && <SecurityTab />}
      {tab === "billing"  && <BillingTab />}
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
  );
}

function BillingTab() {
  const user = useUserStore((s) => s.user)!;

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

          <Link href="/pricing">
            <Button variant="cosmic" className="w-full md:w-auto px-8">
              {user.plan === "FREE" || user.plan === "BASIC" ? "ترقية الخطة" : "إدارة الاشتراك"}
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="border-border-glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">رصيد الكريديت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-4xl font-black text-accent-400 tabular-nums">
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
