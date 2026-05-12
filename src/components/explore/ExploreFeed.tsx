"use client";

/* ════════════════════════════════════════════════════════════════
   ExploreFeed — open community feed
   ════════════════════════════════════════════════════════════════
   Reverse-chronological list of public generations. Supports filter
   tabs (الصور / الفيديو / الصوت) and a per-card Remix CTA. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, ArrowUpRight, Loader2 } from "lucide-react";

interface ExploreItem {
  id:        string;
  toolId:    string;
  toolName:  string;
  prompt:    string;
  url:       string;
  mediaType: "image" | "video" | "audio";
  createdAt: string;
  likes?:    number;
  author?:   { name: string; image?: string };
}

type Filter = "all" | "image" | "video" | "audio";

export function ExploreFeed() {
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems]   = useState<ExploreItem[] | null>(null);

  useEffect(() => {
    fetch(`/api/explore?filter=${filter}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">اكتشف</h1>
        <p className="text-gray-400 text-sm mt-2">
          آخر الأعمال من مجتمع Yilow — اضغط Remix على أي عمل عشان تبدأ من نفس النقطة.
        </p>
      </header>

      <div className="flex items-center gap-2 mb-5">
        {(["all", "image", "video", "audio"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-white text-black"
                : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]"
            }`}
          >
            {f === "all" ? "الكل" : f === "image" ? "صور" : f === "video" ? "فيديو" : "صوت"}
          </button>
        ))}
      </div>

      {!items && (
        <div className="flex items-center justify-center py-24 text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> جاري التحميل…
        </div>
      )}

      {items && items.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center text-sm text-gray-400">
          لسة مفيش أعمال عامة — ابدأ أنت!
        </div>
      )}

      {items && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((it) => (
            <article key={it.id}
              className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14] transition">
              <div className="aspect-square bg-black/40 overflow-hidden">
                {it.mediaType === "video" ? (
                  <video src={it.url} className="w-full h-full object-cover" loop muted playsInline
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => e.currentTarget.pause()} />
                ) : it.mediaType === "audio" ? (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    🎵
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3 text-gray-300">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {it.likes ?? 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 0</span>
                  </div>
                  <Link
                    href={`/tools/${it.toolId}?prompt=${encodeURIComponent(it.prompt)}`}
                    className="text-blue-300 hover:underline whitespace-nowrap"
                  >
                    Remix <ArrowUpRight className="w-3 h-3 inline" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
