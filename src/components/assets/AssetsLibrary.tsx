"use client";

/* ════════════════════════════════════════════════════════════════
   AssetsLibrary — user's personal asset gallery
   ════════════════════════════════════════════════════════════════
   Filterable by: All / Favorites / Image / Video / Audio + folder
   tabs at the top. Each asset card supports preview, download,
   delete (soft), and "add to folder". Powered by GET /api/generations
   with query params. */

import { useEffect, useMemo, useState } from "react";
import { Heart, Download, Folder, Trash2, Loader2, Search, FolderPlus, X } from "lucide-react";

type FilterBucket = "all" | "favorites" | "image" | "video" | "audio";

interface Asset {
  id:        string;
  toolId:    string;
  prompt:    string;
  url:       string;
  mediaType: "image" | "video" | "audio";
  liked:     boolean;
  folderId?: string;
  createdAt: string;
}

interface FolderRow {
  id:        string;
  name:      string;
  color:     string | null;
  parentId:  string | null;
  count:     number;
  children:  number;
  createdAt: string;
}

export function AssetsLibrary() {
  const [bucket, setBucket]       = useState<FilterBucket>("all");
  const [search, setSearch]       = useState("");
  const [assets, setAssets]       = useState<Asset[] | null>(null);
  const [folders, setFolders]     = useState<FolderRow[]>([]);
  const [activeFolder, setActive] = useState<string | "none" | null>(null); // null=all, "none"=uncategorised
  const [newFolderName, setNFN]   = useState("");
  const [creating, setCreating]   = useState(false);

  useEffect(() => {
    fetch(`/api/generations?bucket=${bucket}&limit=200`)
      .then((r) => r.json())
      .then((d) => setAssets((d.assets || d.generations || []) as Asset[]))
      .catch(() => setAssets([]));
  }, [bucket]);

  useEffect(() => {
    fetch("/api/folders")
      .then((r) => r.json())
      .then((d) => setFolders(d.folders ?? []))
      .catch(() => setFolders([]));
  }, []);

  async function createFolder() {
    if (!newFolderName.trim() || creating) return;
    setCreating(true);
    try {
      const r = await fetch("/api/folders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: newFolderName.trim() }),
      });
      const d = await r.json();
      if (r.ok && d.folder) {
        setFolders((p) => [{
          id:        d.folder.id,
          name:      d.folder.name,
          color:     d.folder.color ?? null,
          parentId:  d.folder.parentId ?? null,
          count:     0,
          children:  0,
          createdAt: d.folder.createdAt,
        }, ...p]);
        setNFN("");
      }
    } finally { setCreating(false); }
  }

  async function moveAssetToFolder(a: Asset, folderId: string | null) {
    // Optimistic.
    setAssets((prev) => (prev ?? []).map((x) =>
      x.id === a.id ? { ...x, folderId: folderId ?? undefined } : x,
    ));
    await fetch(`/api/generations/${a.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ folderId }),
    }).catch(() => {});
  }

  const filtered = useMemo(() => {
    if (!assets) return null;
    let list = assets;
    // Folder filter.
    if (activeFolder === "none") list = list.filter((a) => !a.folderId);
    else if (activeFolder)       list = list.filter((a) => a.folderId === activeFolder);
    // Search filter.
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((a) =>
        a.prompt.toLowerCase().includes(q) || a.toolId.toLowerCase().includes(q),
      );
    }
    return list;
  }, [assets, search, activeFolder]);

  async function toggleLike(a: Asset) {
    if (!assets) return;
    // Optimistic flip.
    setAssets((prev) => (prev ?? []).map((x) => x.id === a.id ? { ...x, liked: !x.liked } : x));
    fetch(`/api/generations/${a.id}/like`, {
      method: a.liked ? "DELETE" : "POST",
    }).catch(() => {
      // Revert on failure.
      setAssets((prev) => (prev ?? []).map((x) => x.id === a.id ? { ...x, liked: a.liked } : x));
    });
  }

  async function removeAsset(a: Asset) {
    if (!confirm("تأكد من حذف العمل ده؟")) return;
    setAssets((prev) => (prev ?? []).filter((x) => x.id !== a.id));
    await fetch(`/api/generations/${a.id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">مكتبتي</h1>
        <p className="text-gray-400 text-sm mt-2">
          كل اللي عملته بـYilow — ابحث، نظّم في مجلدات، وحمّل المفضّلات.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-5 mb-5">
        {/* Folder sidebar */}
        <aside className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1 h-fit">
          <button
            onClick={() => setActive(null)}
            className={`w-full text-right px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeFolder === null ? "bg-white/[0.08] text-white" : "text-gray-400 hover:bg-white/[0.04]"
            }`}
          >
            كل الأعمال {assets ? `(${assets.length})` : ""}
          </button>
          <button
            onClick={() => setActive("none")}
            className={`w-full text-right px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeFolder === "none" ? "bg-white/[0.08] text-white" : "text-gray-400 hover:bg-white/[0.04]"
            }`}
          >
            بدون مجلد {assets ? `(${assets.filter((a) => !a.folderId).length})` : ""}
          </button>

          {folders.length > 0 && (
            <div className="border-t border-white/[0.06] my-2 pt-2 space-y-1">
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActive(f.id)}
                  className={`w-full text-right px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                    activeFolder === f.id ? "bg-white/[0.08] text-white" : "text-gray-400 hover:bg-white/[0.04]"
                  }`}
                >
                  <Folder
                    className="w-3 h-3 shrink-0"
                    style={f.color ? { color: f.color } : undefined}
                  />
                  <span className="flex-1 truncate text-right">{f.name}</span>
                  <span className="text-[10px] text-gray-600">{f.count}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-white/[0.06] my-2 pt-2 space-y-2">
            <input
              value={newFolderName}
              onChange={(e) => setNFN(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFolder()}
              placeholder="اسم مجلد جديد"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-white/20"
            />
            <button
              onClick={createFolder}
              disabled={!newFolderName.trim() || creating}
              className="w-full text-xs bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-50 rounded-lg px-2 py-1.5 flex items-center justify-center gap-1.5"
            >
              <FolderPlus className="w-3 h-3" /> إنشاء
            </button>
          </div>
        </aside>

        {/* Filters + search */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all",       "الكل"],
                ["favorites", "المفضّلات"],
                ["image",     "صور"],
                ["video",     "فيديو"],
                ["audio",     "صوت"],
              ] as Array<[FilterBucket, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setBucket(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  bucket === id
                    ? "bg-white text-black"
                    : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]"
                }`}
              >
                {label}
              </button>
            ))}
            <div className="relative ml-auto">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث في الـprompts…"
                className="bg-white/[0.03] border border-white/10 rounded-xl pr-10 pl-3 py-2 text-xs focus:outline-none focus:border-white/20"
              />
            </div>
          </div>

          {activeFolder && activeFolder !== "none" && folders.find((f) => f.id === activeFolder) && (
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>عرض مجلد:</span>
              <span className="text-white">{folders.find((f) => f.id === activeFolder)?.name}</span>
              <button
                onClick={() => setActive(null)}
                className="text-gray-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {!filtered && (
        <div className="flex items-center justify-center py-24 text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> جاري التحميل…
        </div>
      )}

      {filtered && filtered.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center text-sm text-gray-400">
          مفيش حاجة في المكتبة لسة — ابدأ من <a href="/dashboard" className="text-blue-400 hover:underline">الـDashboard</a>.
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((a) => (
            <article key={a.id}
              className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14] transition">
              <div className="aspect-square bg-black/40 overflow-hidden">
                {a.mediaType === "video" ? (
                  <video src={a.url} className="w-full h-full object-cover" muted loop playsInline
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => e.currentTarget.pause()} />
                ) : a.mediaType === "audio" ? (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🎵</div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                )}
              </div>

              <div className="absolute top-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleLike(a)}
                  className={`w-8 h-8 rounded-full backdrop-blur flex items-center justify-center transition-colors ${
                    a.liked ? "bg-rose-500 text-white" : "bg-black/60 text-white hover:bg-black/80"
                  }`}
                  aria-label="مفضّلة"
                >
                  <Heart className="w-4 h-4" fill={a.liked ? "currentColor" : "none"} />
                </button>
                <div className="flex items-center gap-1">
                  {folders.length > 0 && (
                    <select
                      value={a.folderId ?? ""}
                      onChange={(e) => moveAssetToFolder(a, e.target.value || null)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur text-xs text-white border-none px-2 cursor-pointer focus:outline-none"
                      title="نقل لمجلد"
                    >
                      <option value="">📁 بدون</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>📁 {f.name}</option>
                      ))}
                    </select>
                  )}
                  <a href={a.url} download
                     className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur flex items-center justify-center text-white"
                     aria-label="تحميل">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => removeAsset(a)}
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-red-500/80 backdrop-blur flex items-center justify-center text-white"
                    aria-label="حذف">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-2.5">
                <div className="text-[11px] text-gray-300 line-clamp-2 leading-snug">
                  {a.prompt || "—"}
                </div>
                <div className="text-[10px] text-gray-600 mt-1 flex items-center gap-1.5">
                  <Folder className="w-2.5 h-2.5" />
                  <span>{a.toolId}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
