"use client";

/* ════════════════════════════════════════════════════════════════
   OriginalsGallery — curated featured work
   ════════════════════════════════════════════════════════════════
   Pulls highlighted generations from `/api/originals` and renders a
   masonry-style grid. Each card shows the output + the tool used
   + a Remix button that pre-fills the source tool with the same
   prompt. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, ArrowUpRight } from "lucide-react";

interface OriginalItem {
  id:       string;
  title:    string;
  toolId:   string;
  toolName: string;
  url:      string;          // image or video URL
  mediaType: "image" | "video";
  prompt?:  string;
  author?:  { name: string; handle?: string };
  remixOf?: string;
  createdAt: string;
}

export function OriginalsGallery() {
  const [items, setItems]   = useState<OriginalItem[] | null>(null);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/originals")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch((e) => setError(e.message || "تعذّر تحميل الأعمال"));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-2">
          <Sparkles className="w-4 h-4" /> Originals
        </div>
        <h1 className="text-3xl font-bold">أعمال مختارة من المبدعين</h1>
        <p className="text-gray-400 text-sm mt-2 max-w-2xl">
          تشكيلة منتقاة من أحسن النواتج اللي اتعملت بـYilow. هتلاقي الـprompt + الأداة، وممكن
          تـRemix أي حاجة بضغطة واحدة.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!items && !error && (
        <div className="flex items-center justify-center py-24 text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> جاري التحميل…
        </div>
      )}

      {items && items.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <div className="text-gray-400 text-sm">لسة مفيش أعمال مختارة — ابدأ تنشئ وممكن عملك يبقى هنا.</div>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {items.map((it) => (
            <article
              key={it.id}
              className="break-inside-avoid rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition"
            >
              <div className="bg-black/30">
                {it.mediaType === "video" ? (
                  <video src={it.url} className="w-full h-auto" loop muted playsInline
                          autoPlay onMouseLeave={(e) => e.currentTarget.pause()}
                          onMouseEnter={(e) => e.currentTarget.play()} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.url} alt={it.title} loading="lazy" className="w-full h-auto" />
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium leading-tight truncate">{it.title}</h3>
                  <Link
                    href={`/tools/${it.toolId}?prompt=${encodeURIComponent(it.prompt ?? "")}`}
                    className="text-xs text-blue-400 hover:underline whitespace-nowrap"
                  >
                    Remix <ArrowUpRight className="w-3 h-3 inline" />
                  </Link>
                </div>
                {it.prompt && (
                  <p className="text-[11px] text-gray-500 line-clamp-2">{it.prompt}</p>
                )}
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>{it.toolName}</span>
                  {it.author?.name && <span>@{it.author.handle ?? it.author.name}</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
