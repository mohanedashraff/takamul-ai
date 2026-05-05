"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2, Search, Sparkles, ShoppingBag, Home as HomeIcon,
  Shirt, Share2, Star, Wand2,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { tTemplate } from "@/lib/data/muapi-translations";

interface TemplateRow {
  id:           string;
  name:         string;       // already translated to Arabic
  description?: string;       // Arabic one-liner if available
  thumbnail:    string;
  category:     string;
  created_at:   string;
  updated_at:   string;
}

const CATEGORY_META: Record<string, { ar: string; icon: React.ComponentType<{ className?: string }> }> = {
  "Featured":     { ar: "مميزة",      icon: Star },
  "E-Commerce":   { ar: "تجارة",       icon: ShoppingBag },
  "Fashion":      { ar: "أزياء",       icon: Shirt },
  "Home Decor":   { ar: "ديكور",       icon: HomeIcon },
  "Social Media": { ar: "سوشيال",      icon: Share2 },
};

export default function TemplatesPage() {
  const [items,    setItems]    = useState<TemplateRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState<string>("");

  useEffect(() => {
    fetch("/api/workflow/get-template-workflows", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          // Apply Arabic name + description, keeping the original
          // English name as a fallback when no translation exists.
          setItems(d.map((t: TemplateRow) => {
            const ar = tTemplate(t.id, { name: t.name });
            return { ...t, name: ar.name, description: ar.description };
          }));
        }
        else if (d.error) toast.error(d.error);
      })
      .catch(() => toast.error("فشل تحميل القوالب"))
      .finally(() => setLoading(false));
  }, []);

  // Build the unique category list, with "Featured" first.
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    const arr = Array.from(set);
    arr.sort((a, b) => (a === "Featured" ? -1 : b === "Featured" ? 1 : a.localeCompare(b)));
    return arr;
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (category) list = list.filter((i) => i.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    return list;
  }, [items, category, search]);

  return (
    <div className="site-container py-10 pb-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-400/30 bg-accent-400/8 text-accent-400 text-xs font-bold mb-3">
            <Wand2 className="w-3.5 h-3.5" />
            {items.length || "—"} قالب جاهز
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            قوالب جاهزة <span className="text-accent-400">للتشغيل بضغطة زر</span>
          </h1>
          <p className="text-gray-400 mt-3 max-w-2xl leading-relaxed">
            مجموعة من الـ workflows الجاهزة — كل قالب يدمج عدة موديلات معاً (تجربة الملابس افتراضياً، إعلانات منتجات، تصوير عقاري…). ارفع المدخلات واضغط تشغيل.
          </p>
        </div>
      </div>

      {/* Search + categories */}
      <div className="flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن قالب…"
            className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pr-10 pl-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-400 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <CategoryChip active={!category} onClick={() => setCategory("")} icon={Sparkles}>
            الكل ({items.length})
          </CategoryChip>
          {categories.map((c) => {
            const meta = CATEGORY_META[c] ?? { ar: c, icon: Sparkles };
            const count = items.filter((i) => i.category === c).length;
            return (
              <CategoryChip
                key={c}
                active={category === c}
                onClick={() => setCategory(c)}
                icon={meta.icon}
              >
                {meta.ar} ({count})
              </CategoryChip>
            );
          })}
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
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.02, 0.4), ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={`/templates/${t.id}`}
                className="block group bento-card rounded-2xl overflow-hidden border border-white/10 hover:border-accent-400/40 transition-colors"
              >
                <div className="relative aspect-[4/3] bg-black overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.thumbnail}
                    alt={t.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-black/60 backdrop-blur border border-white/15 text-white">
                      {CATEGORY_META[t.category]?.ar ?? t.category}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-white line-clamp-2 mb-1">{t.name}</h3>
                  {t.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 mb-2 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                  <p className="text-[11px] text-accent-400 font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    <Sparkles className="w-3 h-3" />
                    تشغيل القالب ←
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

function CategoryChip({
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
        "flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-bold transition-all border",
        active
          ? "bg-accent-400 text-black border-accent-400 shadow-[0_0_18px_rgba(254,228,64,0.35)]"
          : "bg-white/[0.03] text-gray-300 border-white/10 hover:border-white/20 hover:bg-white/[0.06]",
      )}
      type="button"
    >
      <Icon className="w-3.5 h-3.5" />
      {children}
    </button>
  );
}
