"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, TrendingUp, Activity, Zap, Ban, Image as ImageIcon,
  Video, Music, Loader2, ArrowUpRight, Crown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface AdminStats {
  stats: {
    totalUsers: number;
    newUsersThisMonth: number;
    userGrowthPct: number;
    activeUsersLast7d: number;
    bannedUsers: number;
    totalGenerations: number;
    monthlyGenerations: number;
    totalSpaces: number;
    totalConversations: number;
    creditsInCirculation: number;
    totalCreditsDeducted: number;
  };
  planDistribution: Array<{ plan: string; count: number }>;
  topTools: Array<{ toolId: string; toolName: string; count: number }>;
  recentSignups: Array<{
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    plan: string;
    role: string;
    creditsBalance: number;
    createdAt: string;
  }>;
}

export default function AdminOverview() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
      </div>
    );
  }

  if (!data) return <div className="p-8 text-gray-400">فشل تحميل البيانات</div>;

  const { stats, planDistribution, topTools, recentSignups } = data;

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">نظرة عامة</h1>
        <p className="text-gray-400">إحصائيات المنصة كاملة</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard
          label="إجمالي المستخدمين"
          value={stats.totalUsers}
          icon={Users}
          accent="accent"
          footer={
            <span className={cn(
              "text-xs font-bold flex items-center gap-1",
              stats.userGrowthPct >= 0 ? "text-green-400" : "text-red-400"
            )}>
              <ArrowUpRight className={cn("w-3 h-3", stats.userGrowthPct < 0 && "rotate-90")} />
              {stats.userGrowthPct >= 0 ? "+" : ""}{stats.userGrowthPct}% هذا الشهر
            </span>
          }
        />
        <KpiCard
          label="مستخدمون نشطون (7 أيام)"
          value={stats.activeUsersLast7d}
          icon={Activity}
          accent="primary"
        />
        <KpiCard
          label="إجمالي العمليات"
          value={stats.totalGenerations}
          icon={TrendingUp}
          accent="pink"
          footer={<span className="text-xs text-gray-500">{stats.monthlyGenerations.toLocaleString("en")} هذا الشهر</span>}
        />
        <KpiCard
          label="كريديت في المنصة"
          value={stats.creditsInCirculation}
          icon={Zap}
          accent="accent"
          footer={<span className="text-xs text-gray-500">{stats.totalCreditsDeducted.toLocaleString("en")} مستهلك إجمالاً</span>}
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan distribution */}
        <Card className="border-border-glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-accent-400" />
              توزيع الخطط
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {planDistribution.length === 0 ? (
              <p className="text-sm text-gray-500">لا توجد بيانات</p>
            ) : (
              planDistribution.map((p) => {
                const pct = stats.totalUsers > 0 ? (p.count / stats.totalUsers) * 100 : 0;
                return (
                  <div key={p.plan} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-white">{planLabel(p.plan)}</span>
                      <span className="text-gray-400 tabular-nums">{p.count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          p.plan === "FREE" && "bg-gray-500",
                          p.plan === "BASIC" && "bg-blue-500",
                          p.plan === "PRO" && "bg-accent-400",
                          p.plan === "ENTERPRISE" && "bg-purple-500"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Top tools */}
        <Card className="border-border-glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-400" />
              أكثر الأدوات استخداماً
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {topTools.length === 0 ? (
              <p className="text-sm text-gray-500">لا توجد بيانات</p>
            ) : (
              topTools.slice(0, 8).map((t, i) => (
                <div key={t.toolId} className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-600 w-5 text-center">{i + 1}</span>
                  <span className="text-sm font-bold text-white flex-1 truncate">{t.toolName}</span>
                  <span className="text-xs text-accent-400 font-black tabular-nums">{t.count.toLocaleString("en")}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Platform totals */}
        <Card className="border-border-glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">إحصائيات أخرى</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatRow icon={ImageIcon} label="Spaces" value={stats.totalSpaces} />
            <StatRow icon={Video} label="محادثات" value={stats.totalConversations} />
            <StatRow icon={Ban} label="مستخدمون محظورون" value={stats.bannedUsers} danger={stats.bannedUsers > 0} />
            <StatRow icon={Users} label="مستخدمون جدد (هذا الشهر)" value={stats.newUsersThisMonth} />
          </CardContent>
        </Card>
      </div>

      {/* Recent signups */}
      <Card className="border-border-glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-white">آخر التسجيلات</CardTitle>
          <Link href="/admin/users" className="text-xs font-bold text-gray-400 hover:text-accent-400">
            عرض الكل →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-white/5">
            {recentSignups.map((u) => (
              <li key={u.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02]">
                <MiniAvatar user={u} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{u.name ?? u.email}</div>
                  <div className="text-xs text-gray-500 truncate" dir="ltr">{u.email}</div>
                </div>
                <span className="text-xs text-gray-500 hidden md:block">
                  {new Date(u.createdAt).toLocaleDateString("ar")}
                </span>
                <Link
                  href={`/admin/users/${u.id}`}
                  className="text-xs font-bold text-accent-400 hover:text-white transition-colors"
                >
                  عرض
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Bits ─────────────────────────────────────────────────────────
function KpiCard({
  label, value, icon: Icon, accent, footer,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: "accent" | "primary" | "pink";
  footer?: React.ReactNode;
}) {
  const ring: Record<string, string> = {
    accent:  "bg-accent-400/10 text-accent-400",
    primary: "bg-primary-500/10 text-primary-400",
    pink:    "bg-neon-pink/10 text-neon-pink",
  };
  return (
    <Card className="border-border-glass">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", ring[accent])}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-white tabular-nums">{value.toLocaleString("en")}</div>
        {footer && <div className="mt-2">{footer}</div>}
      </CardContent>
    </Card>
  );
}

function StatRow({
  icon: Icon, label, value, danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Icon className={cn("w-4 h-4", danger && value > 0 ? "text-red-400" : "")} />
        {label}
      </div>
      <span className={cn("text-sm font-black tabular-nums", danger && value > 0 ? "text-red-400" : "text-white")}>
        {value.toLocaleString("en")}
      </span>
    </div>
  );
}

function MiniAvatar({ user }: { user: { name: string | null; email: string; image: string | null } }) {
  const initials = (user.name ?? user.email).split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  if (user.image) {
    return <img src={user.image} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-500 to-accent-400 text-black font-black flex items-center justify-center text-xs">
      {initials}
    </div>
  );
}

function planLabel(p: string): string {
  return ({ FREE: "مجاني", BASIC: "أساسي", PRO: "PRO", ENTERPRISE: "ENTERPRISE" } as Record<string, string>)[p] ?? p;
}
