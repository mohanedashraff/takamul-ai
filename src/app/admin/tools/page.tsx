"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2, Search, Image as ImageIcon, Video, Music, Zap, TrendingUp, Wrench,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface ToolRow {
  id: string;
  title: string;
  desc: string;
  category: "image" | "video" | "audio";
  categoryName: string;
  credits: number;
  isNew: boolean;
  image: string;
  usage: {
    total: number;
    creditsUsed: number;
    last7Days: number;
  };
}

export default function AdminToolsPage() {
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"total" | "recent" | "credits">("total");

  useEffect(() => {
    fetch("/api/admin/tools", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTools(d.tools ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = tools;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    }
    if (categoryFilter) list = list.filter((t) => t.category === categoryFilter);

    list = [...list].sort((a, b) => {
      if (sortBy === "total")   return b.usage.total - a.usage.total;
      if (sortBy === "recent")  return b.usage.last7Days - a.usage.last7Days;
      if (sortBy === "credits") return b.usage.creditsUsed - a.usage.creditsUsed;
      return 0;
    });
    return list;
  }, [tools, query, categoryFilter, sortBy]);

  const totals = useMemo(() => ({
    count:    filtered.length,
    runs:     filtered.reduce((s, t) => s + t.usage.total, 0),
    credits:  filtered.reduce((s, t) => s + t.usage.creditsUsed, 0),
    last7:    filtered.reduce((s, t) => s + t.usage.last7Days, 0),
  }), [filtered]);

  if (loading) {
    return (
      <div className="p-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">إدارة الأدوات</h1>
          <p className="text-gray-400">الكتالوج الكامل مع إحصائيات الاستخدام</p>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MiniStat icon={Wrench}     label="أدوات" value={totals.count} accent="accent" />
        <MiniStat icon={TrendingUp} label="استخدامات إجمالية" value={totals.runs} accent="primary" />
        <MiniStat icon={Zap}        label="كريديت مستهلك" value={totals.credits} accent="pink" />
        <MiniStat icon={TrendingUp} label="آخر 7 أيام" value={totals.last7} accent="accent" />
      </div>

      {/* Search + filters */}
      <Card className="border-border-glass">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن أداة..."
              className="w-full h-10 bg-black/40 border border-white/10 rounded-lg pr-10 pl-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent-400"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-white text-sm focus:outline-none focus:border-accent-400"
          >
            <option value="">كل التصنيفات</option>
            <option value="image">الصور</option>
            <option value="video">الفيديو</option>
            <option value="audio">الصوت</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-white text-sm focus:outline-none focus:border-accent-400"
          >
            <option value="total">الأكثر استخداماً</option>
            <option value="recent">آخر 7 أيام</option>
            <option value="credits">الأكثر استهلاكاً للكريديت</option>
          </select>
        </CardContent>
      </Card>

      {/* Tools table */}
      <Card className="border-border-glass">
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-20 text-center text-gray-500">لا توجد أدوات مطابقة</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-right">الأداة</th>
                  <th className="px-4 py-3 text-right">التصنيف</th>
                  <th className="px-4 py-3 text-right">السعر</th>
                  <th className="px-4 py-3 text-right">إجمالي</th>
                  <th className="px-4 py-3 text-right">آخر 7 أيام</th>
                  <th className="px-4 py-3 text-right">كريديت مستهلك</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((t) => {
                  const Icon = t.category === "video" ? Video : t.category === "audio" ? Music : ImageIcon;
                  return (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center shrink-0",
                            t.category === "image" && "bg-accent-400/10 text-accent-400",
                            t.category === "video" && "bg-primary-500/10 text-primary-400",
                            t.category === "audio" && "bg-neon-pink/10 text-neon-pink"
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white truncate">{t.title}</span>
                              {t.isNew && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-neon-pink/10 text-neon-pink border border-neon-pink/20">
                                  جديد
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-[320px]">{t.desc}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{t.categoryName}</td>
                      <td className="px-4 py-3 tabular-nums">
                        <span className="inline-flex items-center gap-1 text-accent-400 font-black">
                          <Zap className="w-3 h-3" /> {t.credits}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-black text-white">
                        {t.usage.total.toLocaleString("en")}
                      </td>
                      <td className={cn(
                        "px-4 py-3 tabular-nums font-bold",
                        t.usage.last7Days > 0 ? "text-green-400" : "text-gray-600"
                      )}>
                        {t.usage.last7Days.toLocaleString("en")}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-400">
                        {t.usage.creditsUsed.toLocaleString("en")}
                      </td>
                      <td className="px-4 py-3 text-left">
                        <Link
                          href={`/tool/${t.id}`}
                          target="_blank"
                          className="text-xs font-bold text-accent-400 hover:text-white transition-colors"
                        >
                          فتح ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-gray-500 text-center">
        ملحوظة: إضافة/حذف الأدوات بيتم حالياً من ملف <code className="px-1.5 py-0.5 bg-white/5 rounded text-accent-400">src/lib/data/tools.ts</code>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon, label, value, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number;
  accent: "accent" | "primary" | "pink";
}) {
  const clr: Record<string, string> = {
    accent:  "text-accent-400 bg-accent-400/10 border-accent-400/20",
    primary: "text-primary-400 bg-primary-500/10 border-primary-500/20",
    pink:    "text-neon-pink bg-neon-pink/10 border-neon-pink/20",
  };
  return (
    <Card className="border-border-glass">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center shrink-0", clr[accent])}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate">{label}</div>
          <div className="text-lg font-black text-white tabular-nums">{value.toLocaleString("en")}</div>
        </div>
      </CardContent>
    </Card>
  );
}
