"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Sparkles, Zap, AlertCircle, CreditCard, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id:        string;
  kind:      string;
  title:     string;
  body:      string | null;
  href:      string | null;
  readAt:    string | null;
  createdAt: string;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GENERATION_DONE:    Sparkles,
  GENERATION_FAILED:  AlertCircle,
  CREDITS_LOW:        Zap,
  CREDITS_REFILLED:   Zap,
  PAYMENT_SUCCEEDED:  CreditCard,
  PAYMENT_FAILED:     AlertCircle,
  REFERRAL_BONUS:     Gift,
  PLAN_RENEWED:       CreditCard,
  PLAN_CANCELLED:     AlertCircle,
  ANNOUNCEMENT:       Bell,
};

const COLORS: Record<string, string> = {
  GENERATION_DONE:    "text-accent-400",
  GENERATION_FAILED:  "text-red-400",
  CREDITS_LOW:        "text-yellow-400",
  CREDITS_REFILLED:   "text-emerald-400",
  PAYMENT_SUCCEEDED:  "text-emerald-400",
  PAYMENT_FAILED:     "text-red-400",
  REFERRAL_BONUS:     "text-violet-400",
  PLAN_RENEWED:       "text-emerald-400",
  PLAN_CANCELLED:     "text-red-400",
  ANNOUNCEMENT:       "text-blue-400",
};

export function NotificationsBell() {
  const [open,    setOpen]    = useState(false);
  const [items,   setItems]   = useState<NotificationItem[]>([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll every 60s for new unread count.
  const fetchAll = async () => {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setItems(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {}
  };

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, []);

  // Click-outside close
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Mark unread items as read whenever the dropdown opens (Slack-style).
  useEffect(() => {
    if (!open || unread === 0) return;
    fetch("/api/notifications", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({}),
    }).then(() => {
      setUnread(0);
      setItems((it) => it.map((x) => (x.readAt ? x : { ...x, readAt: new Date().toISOString() })));
    }).catch(() => {});
  }, [open, unread]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) { setLoading(true); fetchAll().finally(() => setLoading(false)); } }}
        className="relative w-10 h-10 rounded-xl border border-white/10 hover:bg-white/[0.04] flex items-center justify-center text-gray-300 hover:text-white transition-colors"
        aria-label="الإشعارات"
        type="button"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-400 text-black text-[10px] font-black flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-12 left-0 z-50 w-[360px] max-w-[90vw] bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h4 className="text-sm font-bold text-white">الإشعارات</h4>
            {items.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500">
                <CheckCheck className="w-3 h-3" />
                مقروءة تلقائياً
              </span>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500">جاري التحميل…</div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-xs text-gray-500">ماعندكش إشعارات لسة</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {items.map((n) => {
                  const Icon = ICONS[n.kind] ?? Bell;
                  const color = COLORS[n.kind] ?? "text-gray-400";
                  const Body = (
                    <>
                      <div className={cn("w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center shrink-0", color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{n.title}</p>
                        {n.body && <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>}
                        <p className="text-[10px] text-gray-600 mt-1">{formatTime(n.createdAt)}</p>
                      </div>
                      {!n.readAt && (
                        <span className="w-2 h-2 rounded-full bg-accent-400 shrink-0 mt-2" aria-label="غير مقروء" />
                      )}
                    </>
                  );
                  return (
                    <li key={n.id}>
                      {n.href ? (
                        <Link
                          href={n.href}
                          onClick={() => setOpen(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                        >
                          {Body}
                        </Link>
                      ) : (
                        <div className="flex items-start gap-3 px-4 py-3">{Body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (diffMin < 1)    return "الآن";
  if (diffMin < 60)   return `منذ ${diffMin} دقيقة`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)     return `منذ ${diffH} ساعة`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1)    return "أمس";
  if (diffD < 7)      return `منذ ${diffD} أيام`;
  return d.toLocaleDateString("ar");
}
