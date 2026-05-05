"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus, Frame, Loader2, Trash2, MoreVertical, Search,
  Sparkles, ArrowUpLeft, Calendar, Eye, EyeOff, Pencil, Copy as CopyIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SpaceListItem {
  id:           string;
  title:        string;
  description:  string | null;
  thumbnail:    string | null;
  isPublic:     boolean;
  createdAt:    string;
  updatedAt:    string;
  lastOpenedAt: string;
}

export default function SpacesPage() {
  const router = useRouter();
  const [spaces,   setSpaces]   = useState<SpaceListItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [creating, setCreating] = useState(false);
  const [menuFor,  setMenuFor]  = useState<string | null>(null);

  const refresh = async () => {
    try {
      const r = await fetch("/api/spaces", { cache: "no-store" });
      if (!r.ok) throw new Error("فشل التحميل");
      const data = await r.json();
      setSpaces(data.spaces ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); }, []);

  const createSpace = async () => {
    setCreating(true);
    try {
      const r = await fetch("/api/spaces", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title: "مساحة جديدة" }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "فشل الإنشاء");
      router.push(`/spaces/${data.space.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
      setCreating(false);
    }
  };

  const deleteSpace = async (id: string) => {
    if (!confirm("هل تريد حذف هذه المساحة نهائياً؟")) return;
    try {
      const r = await fetch(`/api/spaces/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("فشل الحذف");
      setSpaces((s) => s.filter((x) => x.id !== id));
      toast.success("تم الحذف");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setMenuFor(null);
    }
  };

  const renameSpace = async (id: string, currentTitle: string) => {
    const next = prompt("اسم المساحة الجديد:", currentTitle);
    if (!next || next.trim() === "" || next === currentTitle) { setMenuFor(null); return; }
    try {
      const r = await fetch(`/api/spaces/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title: next.trim() }),
      });
      if (!r.ok) throw new Error("فشل التغيير");
      setSpaces((s) => s.map((x) => (x.id === id ? { ...x, title: next.trim() } : x)));
      toast.success("تم التغيير");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setMenuFor(null);
    }
  };

  const togglePublic = async (id: string, current: boolean) => {
    try {
      const r = await fetch(`/api/spaces/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isPublic: !current }),
      });
      if (!r.ok) throw new Error("فشل التغيير");
      setSpaces((s) => s.map((x) => (x.id === id ? { ...x, isPublic: !current } : x)));
      toast.success(current ? "تم جعل المساحة خاصة" : "تم نشر المساحة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setMenuFor(null);
    }
  };

  const filtered = spaces.filter((s) =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-bg-primary overflow-hidden relative">
      {/* Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-400/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="site-container relative z-10 py-12 flex flex-col gap-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#0a0a0f]/50 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem]">
          <div className="flex items-start md:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center shrink-0">
              <Frame className="w-8 h-8 text-accent-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">Spaces</h1>
                <span className="px-3 py-1 bg-accent-400/10 border border-accent-400/20 text-accent-400 text-xs font-bold rounded-lg tracking-widest">
                  استوديو
                </span>
              </div>
              <p className="text-gray-400 font-light max-w-xl leading-relaxed">
                كانفس لا نهائي تربط فيه أدوات الذكاء الاصطناعي معاً — كل مساحة workflow كامل بمدخلات ومخرجات.
              </p>
            </div>
          </div>
          <button
            onClick={createSpace}
            disabled={creating}
            className="h-12 px-6 rounded-2xl bg-accent-400 text-black font-black flex items-center gap-2 hover:scale-[1.03] active:scale-95 transition-transform disabled:opacity-60 shadow-[0_0_28px_rgba(254,228,64,0.35)]"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
            {creating ? "جاري الإنشاء…" : "مساحة جديدة"}
          </button>
        </div>

        {/* Search bar (only when there are spaces) */}
        {!loading && spaces.length > 0 && (
          <div className="flex items-center gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث في مساحاتك…"
                className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pr-10 pl-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-400 transition-colors"
              />
            </div>
            <span className="text-xs text-gray-500">{filtered.length} مساحة</span>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
          </div>
        ) : spaces.length === 0 ? (
          <EmptyState onCreate={createSpace} creating={creating} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">لا توجد نتائج</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="bento-card rounded-2xl border border-white/10 hover:border-accent-400/40 transition-all overflow-hidden group relative"
              >
                <Link href={`/spaces/${s.id}`} className="block">
                  <div className="relative aspect-[16/10] bg-gradient-to-br from-primary-500/10 to-accent-400/10 overflow-hidden">
                    {s.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Frame className="w-12 h-12 text-white/15" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-2.5 right-2.5">
                      {s.isPublic ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Eye className="w-3 h-3" /> عام
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-black/60 text-gray-400 border border-white/10">
                          <EyeOff className="w-3 h-3" /> خاص
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-white mb-1 truncate">{s.title}</h3>
                    {s.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{s.description}</p>
                    )}
                    <p className="text-[10px] text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      آخر فتح {formatDate(s.lastOpenedAt)}
                    </p>
                  </div>
                </Link>

                {/* Menu */}
                <button
                  onClick={(e) => { e.preventDefault(); setMenuFor(menuFor === s.id ? null : s.id); }}
                  className="absolute top-2.5 left-2.5 w-8 h-8 rounded-lg bg-black/60 backdrop-blur border border-white/10 text-gray-300 hover:text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label="القائمة"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuFor === s.id && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} />
                    <div className="absolute top-12 left-2.5 z-40 w-44 bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl p-1.5">
                      <MenuItem icon={Pencil}    label="إعادة تسمية" onClick={() => renameSpace(s.id, s.title)} />
                      <MenuItem icon={s.isPublic ? EyeOff : Eye}    label={s.isPublic ? "اجعلها خاصة" : "اجعلها عامة"} onClick={() => togglePublic(s.id, s.isPublic)} />
                      <MenuItem icon={CopyIcon}  label="نسخ الرابط"  onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/spaces/${s.id}`); toast.success("تم النسخ"); setMenuFor(null); }} />
                      <div className="h-px bg-white/5 my-1" />
                      <MenuItem icon={Trash2}    label="حذف"        onClick={() => deleteSpace(s.id)} danger />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function MenuItem({
  icon: Icon, label, onClick, danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-right px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors",
        danger ? "text-red-400 hover:bg-red-500/10" : "text-gray-300 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function EmptyState({ onCreate, creating }: { onCreate: () => void; creating: boolean }) {
  return (
    <div className="bento-card rounded-3xl border border-white/10 p-12 md:p-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500/20 to-accent-400/20 border border-accent-400/30 flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-accent-400" />
      </div>
      <h2 className="text-2xl md:text-3xl font-black text-white mb-3">لسة ما عملتش أي مساحة</h2>
      <p className="text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
        المساحات (Spaces) هي workflows بصرية بتوصل فيها أدوات AI ببعض — ابدأ بمساحة جديدة وحط فيها نص → صورة → فيديو في تدفق واحد.
      </p>
      <button
        onClick={onCreate}
        disabled={creating}
        className="h-12 px-8 rounded-2xl bg-accent-400 text-black font-black hover:scale-[1.03] active:scale-95 transition-transform disabled:opacity-60 inline-flex items-center gap-2 shadow-[0_0_28px_rgba(254,228,64,0.35)]"
      >
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
        إنشاء أول مساحة
      </button>
      <div className="mt-8 inline-flex items-center gap-1.5 text-xs text-gray-500">
        <ArrowUpLeft className="w-3 h-3" />
        مساحاتك بتتحفظ تلقائياً
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "اليوم";
  const diffDays = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "أمس";
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return d.toLocaleDateString("ar");
}
