"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Sparkles, ArrowUpRight, Zap, Image as ImageIcon, Video, Music,
  Activity, TrendingUp, Clock, Loader2, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ALL_TOOLS_FLAT } from "@/lib/data/tools";

interface DashboardData {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    plan: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
    creditsBalance: number;
    creditsLimit: number;
    planRenewsAt: string | null;
    createdAt: string;
  };
  stats: {
    monthlyGenerations: number;
    totalGenerations: number;
    growthPct: number;
    creditsUsedThisMonth: number;
  };
  recent: Array<{
    id: string;
    toolId: string;
    toolName: string;
    category: string;
    status: string;
    outputs: unknown;
    createdAt: string;
  }>;
  topTools: Array<{ toolId: string; toolName: string; count: number }>;
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="site-container py-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="site-container py-20 text-center text-gray-400">
        فشل تحميل البيانات. حدّث الصفحة.
      </div>
    );
  }

  const { user, stats, recent, topTools } = data;
  const usagePct = user.creditsLimit
    ? Math.min(100, Math.round((stats.creditsUsedThisMonth / user.creditsLimit) * 100))
    : 0;
  const firstName = user.name?.split(" ")[0] ?? "مستخدم";

  return (
    <div className="site-container py-8 space-y-10 pb-20">
      {/* Alien glow bg */}
      <div className="fixed top-0 right-0 w-full h-[500px] bg-gradient-to-b from-primary-600/10 to-transparent pointer-events-none -z-10" />

      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-10 sm:p-16 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/90 to-transparent" />
        <div className="absolute inset-0 grid-pattern opacity-30" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center mb-6">
              <PlanPill plan={user.plan} />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight leading-tight">
              أهلاً بعودتك، <span className="text-gradient-neon">{firstName}</span>
            </h1>
            <p className="text-gray-300 text-lg font-light max-w-lg">
              {stats.totalGenerations === 0
                ? "ابدأ إبداعك الأول وحوّل أفكارك لواقع خلال ثوانٍ."
                : `عملت ${stats.totalGenerations.toLocaleString("en")} عملية حتى الآن. جاهز للمزيد؟`}
            </p>
          </div>
          <Link href="/tools">
            <Button variant="cosmic" size="lg" className="rounded-2xl h-14 px-8 shrink-0">
              فتح استوديو الإبداع <Sparkles className="w-5 h-5 mr-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credits */}
        <Card className="border-border-glass group relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-400/20 blur-3xl rounded-full transition-all group-hover:bg-accent-400/40" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-400 flex items-center justify-between uppercase tracking-wider">
              رصيد الكريديت
              <Zap className="w-5 h-5 text-accent-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-5xl font-black text-white tabular-nums">
                {user.creditsBalance.toLocaleString("en")}
              </div>
              <div className="text-sm text-gray-500 mb-2 font-medium">
                / {user.creditsLimit.toLocaleString("en")}
              </div>
            </div>
            <div className="mt-6 h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-accent-400 via-primary-400 to-neon-pink rounded-full shadow-[0_0_10px_rgba(254,228,64,0.8)] transition-all duration-700"
                style={{ width: `${100 - usagePct}%` }}
              />
            </div>
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-accent-400 transition-colors"
            >
              شحن رصيد <ArrowLeft className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="border-border-glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-400 flex items-center justify-between uppercase tracking-wider">
              نشاط هذا الشهر
              <Activity className="w-5 h-5 text-primary-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-5xl font-black text-white tabular-nums">
                {stats.monthlyGenerations.toLocaleString("en")}
              </div>
              <div className="text-sm text-gray-500 mb-2 font-medium">عملية</div>
            </div>
            <p
              className={cn(
                "text-sm flex items-center mt-6 font-medium",
                stats.growthPct >= 0 ? "text-green-400" : "text-red-400"
              )}
            >
              {stats.growthPct >= 0 ? (
                <ArrowUpRight className="w-4 h-4 ml-1" />
              ) : (
                <ArrowUpRight className="w-4 h-4 ml-1 rotate-90" />
              )}
              {stats.growthPct >= 0 ? "+" : ""}
              {stats.growthPct}% مقارنة بالشهر الماضي
            </p>
          </CardContent>
        </Card>

        {/* Archive */}
        <Card className="border-border-glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-400 flex items-center justify-between uppercase tracking-wider">
              الأرشيف الإجمالي
              <TrendingUp className="w-5 h-5 text-neon-pink" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-white tabular-nums">
              {stats.totalGenerations.toLocaleString("en")}
            </div>
            <p className="text-sm text-gray-400 mt-6 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-pink shadow-[0_0_8px_rgba(254,228,64,0.8)] animate-pulse" />
              مزامنة نشطة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      {recent.length > 0 && (
        <div className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="w-2 h-8 rounded-full bg-accent-400" />
              آخر إبداعاتك
            </h2>
            <Link href="/dashboard/history">
              <Button variant="link" className="text-gray-400 hover:text-white">
                عرض الكل
              </Button>
            </Link>
          </div>
          <Card className="border-border-glass">
            <CardContent className="p-0">
              <ul className="divide-y divide-white/5">
                {recent.slice(0, 6).map((gen) => {
                  const Icon = categoryIcon(gen.category);
                  return (
                    <li key={gen.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border border-white/10",
                          gen.category === "image" && "bg-accent-400/10 text-accent-400",
                          gen.category === "video" && "bg-primary-500/10 text-primary-400",
                          gen.category === "audio" && "bg-neon-pink/10 text-neon-pink"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{gen.toolName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatRelative(gen.createdAt)}
                          <StatusPill status={gen.status} />
                        </div>
                      </div>
                      <Link
                        href={`/tool/${gen.toolId}`}
                        className="text-xs font-bold text-gray-400 hover:text-accent-400 transition-colors"
                      >
                        إعادة الاستخدام
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top / suggested tools */}
      <div className="pt-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-2 h-8 rounded-full bg-primary-400" />
            {topTools.length > 0 ? "أدواتك الأكثر استخداماً" : "اقتراحات للبداية"}
          </h2>
          <Link href="/tools">
            <Button variant="link" className="text-gray-400 hover:text-white">
              عرض الكل
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(topTools.length > 0 ? topTools.slice(0, 4) : getSuggested(4)).map((t, i) => {
            const tool = ALL_TOOLS_FLAT.find((x) => x.id === t.toolId);
            if (!tool) return null;
            const Icon = tool.icon;
            return (
              <Link key={i} href={`/tool/${tool.id}`}>
                <Card className="group cursor-pointer border-white/5 hover:border-primary-400/50 hover:-translate-y-2 transition-all duration-500 h-full">
                  <CardContent className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-white/10 bg-accent-400/10 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(254,228,64,0.4)] transition-all duration-500">
                      <Icon className="w-8 h-8 text-accent-400" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">
                      {"count" in t && t.count > 0
                        ? `${t.count} استخدام`
                        : tool.categoryName}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
function PlanPill({ plan }: { plan: string }) {
  const labels: Record<string, string> = {
    FREE: "الخطة الحالية: مجاني",
    BASIC: "الخطة الحالية: أساسي",
    PRO: "الخطة الحالية: PRO",
    ENTERPRISE: "الخطة الحالية: ENTERPRISE",
  };
  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-white backdrop-blur-md">
      {labels[plan] ?? `الخطة الحالية: ${plan}`}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    COMPLETED:  { label: "مكتمل",    cls: "bg-green-500/10 text-green-400 border-green-500/20" },
    PROCESSING: { label: "جارٍ",      cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    PENDING:    { label: "في الانتظار", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    FAILED:     { label: "فشل",      cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const c = cfg[status] ?? cfg.PENDING;
  return (
    <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-bold border", c.cls)}>
      {c.label}
    </span>
  );
}

function categoryIcon(category: string) {
  if (category === "image") return ImageIcon;
  if (category === "video") return Video;
  if (category === "audio") return Music;
  return Sparkles;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return new Date(iso).toLocaleDateString("ar");
}

function getSuggested(n: number) {
  return ALL_TOOLS_FLAT.slice(0, n).map((t) => ({
    toolId: t.id,
    toolName: t.title,
    count: 0,
  }));
}
