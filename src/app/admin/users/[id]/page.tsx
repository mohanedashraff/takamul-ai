"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Loader2, ArrowRight, Ban, CheckCircle, XCircle, Clock,
  Zap, Image as ImageIcon, Video, Music, Shield, Crown,
  ArrowUp, ArrowDown, Sparkles, Calendar, Mail, Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isBanned: boolean;
  bannedReason: string | null;
  bannedAt: string | null;
  creditsBalance: number;
  creditsLimit: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    generations: number;
    chatConversations: number;
    spaces: number;
    agentSubscriptions: number;
    creditTransactions: number;
  };
  creditTransactions: Array<{
    id: string; type: string; amount: number; balanceAfter: number;
    reason: string | null; createdAt: string;
  }>;
  generations: Array<{
    id: string; toolId: string; toolName: string; status: string;
    creditsUsed: number; createdAt: string;
  }>;
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(`/api/admin/users/${id}`, { cache: "no-store" });
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setUser(data.user);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function quickAction(body: Record<string, unknown>, message: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "حصل خطأ");
    toast.success(message);
    load();
  }

  async function deleteUser() {
    if (!confirm("حذف نهائي؟ لا يمكن التراجع.")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      return toast.error(data.error ?? "فشل الحذف");
    }
    toast.success("تم الحذف");
    router.push("/admin/users");
  }

  if (loading) return (
    <div className="p-20 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
    </div>
  );

  if (!user) return (
    <div className="p-20 text-center space-y-4">
      <p className="text-gray-400">المستخدم غير موجود</p>
      <Link href="/admin/users">
        <Button variant="ghost">← الرجوع للقائمة</Button>
      </Link>
    </div>
  );

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Back */}
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
        <ArrowRight className="w-4 h-4" />
        رجوع للمستخدمين
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
        <Avatar user={user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl md:text-3xl font-black text-white">{user.name ?? user.email}</h1>
            <RoleBadge role={user.role} />
            <PlanBadge plan={user.plan} />
            {user.isBanned && <BannedBadge reason={user.bannedReason} />}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1" dir="ltr"><Mail className="w-3 h-3" /> {user.email}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              عضو منذ {new Date(user.createdAt).toLocaleDateString("ar")}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="glass"
            onClick={() => quickAction({ creditsDelta: 1000 }, "منح 1000 كريديت")}
          >
            <Zap className="w-4 h-4 ml-1" /> +1000
          </Button>
          {user.isBanned ? (
            <Button
              variant="glass"
              onClick={() => quickAction({ isBanned: false }, "تم رفع الحظر")}
            >
              <CheckCircle className="w-4 h-4 ml-1 text-green-400" /> رفع الحظر
            </Button>
          ) : (
            <Button
              variant="glass"
              onClick={() => {
                const reason = prompt("سبب الحظر؟") ?? "";
                quickAction({ isBanned: true, bannedReason: reason || null }, "تم الحظر");
              }}
            >
              <Ban className="w-4 h-4 ml-1 text-red-400" /> حظر
            </Button>
          )}
          <Button variant="ghost" className="text-red-400 hover:text-red-300" onClick={deleteUser}>
            حذف
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <StatCard icon={Zap}       label="الرصيد الحالي"  value={user.creditsBalance} accent="accent" />
        <StatCard icon={Sparkles}  label="عمليات"         value={user._count.generations} accent="accent" />
        <StatCard icon={Activity}  label="محادثات"        value={user._count.chatConversations} accent="primary" />
        <StatCard icon={ImageIcon} label="Spaces"         value={user._count.spaces} accent="pink" />
        <StatCard icon={Shield}    label="اشتراكات وكلاء" value={user._count.agentSubscriptions} accent="primary" />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent generations */}
        <Card className="border-border-glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">آخر العمليات</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {user.generations.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-500 text-center">لم يستخدم أي أداة بعد</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {user.generations.map((g) => {
                  const StatusIcon =
                    g.status === "COMPLETED" ? CheckCircle :
                    g.status === "FAILED"    ? XCircle    : Clock;
                  const statusColor =
                    g.status === "COMPLETED" ? "text-green-400" :
                    g.status === "FAILED"    ? "text-red-400"   : "text-yellow-400";
                  return (
                    <li key={g.id} className="px-6 py-3 flex items-center gap-3">
                      <StatusIcon className={cn("w-4 h-4", statusColor)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{g.toolName}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(g.createdAt).toLocaleString("ar")}
                        </div>
                      </div>
                      <span className="text-xs font-black text-accent-400 tabular-nums">
                        {g.creditsUsed} كريديت
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Credit ledger */}
        <Card className="border-border-glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">سجل الكريديت</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {user.creditTransactions.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-500 text-center">لا يوجد سجل</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {user.creditTransactions.map((tx) => {
                  const positive = tx.amount > 0;
                  const ArrowIcon = positive ? ArrowUp : ArrowDown;
                  return (
                    <li key={tx.id} className="px-6 py-3 flex items-center gap-3">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center border",
                        positive
                          ? "bg-green-500/10 border-green-500/20 text-green-400"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                      )}>
                        <ArrowIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white">
                          {typeLabel(tx.type)} {positive ? "+" : ""}{tx.amount.toLocaleString("en")}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {tx.reason ?? "—"} · رصيد جديد: {tx.balanceAfter.toLocaleString("en")}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0 hidden sm:block">
                        {new Date(tx.createdAt).toLocaleDateString("ar")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Bits ─────────────────────────────────────────────────────────
function Avatar({ user }: { user: { name: string | null; email: string; image: string | null } }) {
  const initials = (user.name ?? user.email).split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  if (user.image) {
    return <img src={user.image} alt="" className="w-20 h-20 rounded-2xl object-cover border border-white/10" />;
  }
  return (
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-500 to-accent-400 text-black font-black flex items-center justify-center text-2xl">
      {initials}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number;
  accent: "accent" | "primary" | "pink";
}) {
  const clr: Record<string, string> = {
    accent:  "text-accent-400",
    primary: "text-primary-400",
    pink:    "text-neon-pink",
  };
  return (
    <Card className="border-border-glass">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn("w-4 h-4", clr[accent])} />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-2xl font-black text-white tabular-nums">{value.toLocaleString("en")}</div>
      </CardContent>
    </Card>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, { label: string; cls: string; icon?: React.ComponentType<{className?:string}> }> = {
    USER:        { label: "مستخدم",     cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
    ADMIN:       { label: "أدمن",       cls: "bg-red-500/10 text-red-400 border-red-500/20", icon: Shield },
    SUPER_ADMIN: { label: "سوبر أدمن",  cls: "bg-red-500/15 text-red-300 border-red-500/30", icon: Crown },
  };
  const c = cfg[role] ?? cfg.USER;
  const Icon = c.icon;
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black border inline-flex items-center gap-1", c.cls)}>
      {Icon && <Icon className="w-2.5 h-2.5" />}
      {c.label}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const cfg: Record<string, string> = {
    FREE: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    BASIC: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    PRO: "bg-accent-400/15 text-accent-400 border-accent-400/30",
    ENTERPRISE: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  const label: Record<string, string> = {
    FREE: "مجاني", BASIC: "أساسي", PRO: "PRO", ENTERPRISE: "ENTERPRISE",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black border", cfg[plan] ?? cfg.FREE)}>
      {label[plan] ?? plan}
    </span>
  );
}

function BannedBadge({ reason }: { reason: string | null }) {
  return (
    <span
      className="px-2 py-0.5 rounded-md text-[10px] font-black border bg-red-500/15 text-red-400 border-red-500/30 inline-flex items-center gap-1"
      title={reason ?? undefined}
    >
      <Ban className="w-2.5 h-2.5" />
      محظور
    </span>
  );
}

function typeLabel(t: string): string {
  return ({
    DEDUCTION: "خصم", PURCHASE: "شراء", SUBSCRIPTION: "اشتراك",
    BONUS: "مكافأة", REFUND: "استرجاع", ADJUSTMENT: "تعديل",
  } as Record<string, string>)[t] ?? t;
}
