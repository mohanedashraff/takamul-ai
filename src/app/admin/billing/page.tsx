"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, DollarSign, TrendingUp, CreditCard, Crown, Bot,
  CheckCircle, XCircle, Pause, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface BillingData {
  mrr: { total: number; fromPlans: number; fromAgents: number };
  subscriptionsByStatus: Array<{ status: string; count: number }>;
  planDistribution: Array<{ plan: string; count: number; monthlyRevenue: number }>;
  recentSubscriptions: Array<{
    id: string;
    agentId: string;
    agentName: string;
    monthlyPriceUsd: string | number;
    status: string;
    startedAt: string;
    user: { id: string; name: string | null; email: string; image: string | null };
  }>;
  topAgents: Array<{ agentId: string; agentName: string; count: number }>;
}

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/billing", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
      </div>
    );
  }

  if (!data) return <div className="p-8 text-gray-400">فشل تحميل البيانات</div>;

  const { mrr, subscriptionsByStatus, planDistribution, recentSubscriptions, topAgents } = data;

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">الاشتراكات والإيرادات</h1>
        <p className="text-gray-400">نظرة شاملة على الدخل الشهري والاشتراكات النشطة</p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5" />
          الأرقام تقديرية (Stripe لم يُربط بعد)
        </div>
      </div>

      {/* MRR cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MrrCard
          label="الإيراد الشهري الإجمالي (MRR)"
          value={mrr.total}
          icon={DollarSign}
          accent="accent"
          big
        />
        <MrrCard
          label="من الخطط (FREE/BASIC/PRO/ENT)"
          value={mrr.fromPlans}
          icon={Crown}
          accent="primary"
        />
        <MrrCard
          label="من اشتراكات الوكلاء"
          value={mrr.fromAgents}
          icon={Bot}
          accent="pink"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan distribution with revenue */}
        <Card className="border-border-glass lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent-400" />
              إيراد الخطط
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {planDistribution.map((p) => (
              <div key={p.plan} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-bold text-white">{planLabel(p.plan)}</span>
                    <span className="text-gray-400 tabular-nums">
                      {p.count} × ${p.count > 0 ? (p.monthlyRevenue / p.count).toFixed(0) : 0} = ${p.monthlyRevenue.toLocaleString("en")}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        p.plan === "FREE" && "bg-gray-500",
                        p.plan === "BASIC" && "bg-blue-500",
                        p.plan === "PRO" && "bg-accent-400",
                        p.plan === "ENTERPRISE" && "bg-purple-500"
                      )}
                      style={{ width: `${Math.min(100, (p.monthlyRevenue / Math.max(1, mrr.fromPlans)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Subscriptions by status */}
        <Card className="border-border-glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-400" />
              حالة الاشتراكات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscriptionsByStatus.length === 0 ? (
              <p className="text-sm text-gray-500">لا يوجد اشتراكات بعد</p>
            ) : (
              subscriptionsByStatus.map((s) => <StatusRow key={s.status} status={s.status} count={s.count} />)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top agents */}
      {topAgents.length > 0 && (
        <Card className="border-border-glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-neon-pink" />
              أكثر الوكلاء اشتراكاً
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topAgents.map((a, i) => (
              <div key={a.agentId} className="flex items-center gap-3">
                <span className="text-xs font-black text-gray-600 w-5 text-center">{i + 1}</span>
                <span className="text-sm font-bold text-white flex-1 truncate">{a.agentName}</span>
                <span className="text-xs text-accent-400 font-black tabular-nums">
                  {a.count} اشتراك نشط
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent subscriptions */}
      <Card className="border-border-glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">آخر الاشتراكات</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {recentSubscriptions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">لا توجد اشتراكات بعد</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-right">المستخدم</th>
                  <th className="px-4 py-3 text-right">الوكيل</th>
                  <th className="px-4 py-3 text-right">السعر</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">البداية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentSubscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${s.user.id}`}
                        className="font-bold text-white hover:text-accent-400 transition-colors"
                      >
                        {s.user.name ?? s.user.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-white">{s.agentName}</td>
                    <td className="px-4 py-3 tabular-nums text-accent-400 font-black">
                      ${Number(s.monthlyPriceUsd).toFixed(0)}/شهر
                    </td>
                    <td className="px-4 py-3"><SubStatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(s.startedAt).toLocaleDateString("ar")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Bits ─────────────────────────────────────────────────────────
function MrrCard({
  label, value, icon: Icon, accent, big,
}: {
  label: string; value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: "accent" | "primary" | "pink"; big?: boolean;
}) {
  const ring: Record<string, string> = {
    accent:  "bg-accent-400/10 text-accent-400 border-accent-400/20",
    primary: "bg-primary-500/10 text-primary-400 border-primary-500/20",
    pink:    "bg-neon-pink/10 text-neon-pink border-neon-pink/20",
  };
  return (
    <Card className={cn("border-border-glass", big && "lg:ring-1 lg:ring-accent-400/20")}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
          <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center", ring[accent])}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className={cn("font-black text-white tabular-nums", big ? "text-4xl md:text-5xl" : "text-3xl")}>
          ${value.toLocaleString("en")}
        </div>
        <div className="text-xs text-gray-500 mt-1">شهرياً</div>
      </CardContent>
    </Card>
  );
}

function StatusRow({ status, count }: { status: string; count: number }) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ComponentType<{className?:string}> }> = {
    ACTIVE:    { label: "نشط",    cls: "text-green-400",  icon: CheckCircle },
    PAUSED:    { label: "معلّق",   cls: "text-yellow-400", icon: Pause },
    CANCELLED: { label: "ملغي",   cls: "text-red-400",    icon: XCircle },
    PAST_DUE:  { label: "متأخر",  cls: "text-orange-400", icon: AlertTriangle },
  };
  const c = cfg[status] ?? cfg.ACTIVE;
  const Icon = c.icon;
  return (
    <div className="flex items-center justify-between">
      <div className={cn("flex items-center gap-2 text-sm", c.cls)}>
        <Icon className="w-4 h-4" />
        {c.label}
      </div>
      <span className="text-sm font-black text-white tabular-nums">{count.toLocaleString("en")}</span>
    </div>
  );
}

function SubStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    ACTIVE:    "bg-green-500/10 text-green-400 border-green-500/20",
    PAUSED:    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
    PAST_DUE:  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };
  return (
    <span className={cn("px-2 py-1 rounded-md text-[10px] font-black border", cfg[status] ?? cfg.ACTIVE)}>
      {status}
    </span>
  );
}

function planLabel(p: string): string {
  return ({ FREE: "مجاني", BASIC: "أساسي", PRO: "PRO", ENTERPRISE: "ENTERPRISE" } as Record<string, string>)[p] ?? p;
}
