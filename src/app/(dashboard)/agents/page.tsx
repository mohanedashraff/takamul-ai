"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Search, Bot, Star, Sparkles, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface AgentRow {
  id?:           string;
  agent_id:      string;          // slug used for chat
  name:          string;
  description?:  string;
  thumbnail?:    string;
  category?:     string | null;
  system_prompt?:string;
}

type Tab = "all" | "featured" | "templates";

export default function AgentsPage() {
  const [featured, setFeatured] = useState<AgentRow[]>([]);
  const [templates, setTemplates] = useState<AgentRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<Tab>("all");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/external-agents/featured/agents",  { cache: "no-store" }).then((r) => r.json()).catch(() => []),
      fetch("/api/external-agents/templates/agents", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
    ])
      .then(([f, t]) => {
        if (Array.isArray(f)) setFeatured(f);
        if (Array.isArray(t)) setTemplates(t);
      })
      .catch(() => toast.error("فشل تحميل الوكلاء"))
      .finally(() => setLoading(false));
  }, []);

  // Merge for "all" tab; de-dupe by agent_id.
  const all = useMemo(() => {
    const map = new Map<string, AgentRow>();
    [...featured, ...templates].forEach((a) => { if (a.agent_id) map.set(a.agent_id, a); });
    return Array.from(map.values());
  }, [featured, templates]);

  const list = tab === "featured" ? featured : tab === "templates" ? templates : all;
  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      (a.description ?? "").toLowerCase().includes(q) ||
      a.agent_id.toLowerCase().includes(q)
    );
  }, [list, search]);

  return (
    <div className="site-container py-10 pb-24 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/8 text-violet-300 text-xs font-bold mb-3">
          <Bot className="w-3.5 h-3.5" />
          {all.length || "—"} وكيل ذكي
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          متجر <span className="text-accent-400">الوكلاء الذكيين</span>
        </h1>
        <p className="text-gray-400 mt-3 max-w-2xl leading-relaxed">
          وكلاء جاهزون لمهامك المتخصصة — كاتب محتوى انستجرام، مصمم ثامبنيلز، صانع بودكاست، وأكتر. كل وكيل خبير في مجاله.
        </p>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
          <TabBtn active={tab === "all"}       onClick={() => setTab("all")}       icon={Sparkles}>الكل ({all.length})</TabBtn>
          <TabBtn active={tab === "featured"}  onClick={() => setTab("featured")}  icon={Star}>مميزة ({featured.length})</TabBtn>
          <TabBtn active={tab === "templates"} onClick={() => setTab("templates")} icon={Bot}>القوالب ({templates.length})</TabBtn>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن وكيل…"
            className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pr-10 pl-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-400 transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-500">لا توجد نتائج</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a, i) => (
            <motion.div
              key={a.agent_id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.02, 0.4), ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={`/agents/${encodeURIComponent(a.agent_id)}`}
                className="block group bento-card rounded-2xl overflow-hidden border border-white/10 hover:border-violet-500/40 transition-colors h-full"
              >
                <div className="relative aspect-square bg-gradient-to-br from-violet-500/15 to-accent-400/10 overflow-hidden">
                  {a.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.thumbnail} alt={a.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Bot className="w-16 h-16 text-violet-400/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  {featured.some((f) => f.agent_id === a.agent_id) && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-accent-400 text-black flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> مميز
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{a.name}</h3>
                  {a.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 mb-2">{a.description}</p>
                  )}
                  <p className="text-[11px] font-bold text-violet-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    <MessageCircle className="w-3 h-3" />
                    ابدأ المحادثة →
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active, onClick, icon: Icon, children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
        active ? "bg-accent-400 text-black" : "text-gray-400 hover:text-white hover:bg-white/5",
      )}
      type="button"
    >
      <Icon className="w-3.5 h-3.5" />
      {children}
    </button>
  );
}
