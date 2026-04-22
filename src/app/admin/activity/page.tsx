"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, Sparkles, Zap, UserPlus, Image as ImageIcon,
  Video, Music, CheckCircle, XCircle, Clock, ArrowUp, ArrowDown, Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface ActivityEvent {
  id: string;
  kind: "generation" | "credit" | "signup";
  at: string;
  data: Record<string, unknown>;
}

type Filter = "all" | "generations" | "credits" | "signups";

export default function AdminActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/activity?type=${filter}&limit=100`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">النشاط</h1>
        <p className="text-gray-400">تدفق مباشر لكل العمليات على المنصة</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <FilterTab active={filter === "all"}         onClick={() => setFilter("all")}         label="الكل"         icon={Activity} />
        <FilterTab active={filter === "generations"} onClick={() => setFilter("generations")} label="العمليات"     icon={Sparkles} />
        <FilterTab active={filter === "credits"}     onClick={() => setFilter("credits")}     label="الكريديت"     icon={Zap} />
        <FilterTab active={filter === "signups"}     onClick={() => setFilter("signups")}     label="التسجيلات"    icon={UserPlus} />
      </div>

      <Card className="border-border-glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-400" />
            آخر {events.length} حدث
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
            </div>
          ) : events.length === 0 ? (
            <div className="p-20 text-center text-gray-500">لا يوجد نشاط</div>
          ) : (
            <ul className="divide-y divide-white/5">
              {events.map((ev) => (
                <EventRow key={ev.id} event={ev} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EventRow({ event }: { event: ActivityEvent }) {
  if (event.kind === "generation") return <GenerationRow data={event.data as never} at={event.at} />;
  if (event.kind === "credit")     return <CreditRow data={event.data as never} at={event.at} />;
  if (event.kind === "signup")     return <SignupRow data={event.data as never} at={event.at} />;
  return null;
}

function GenerationRow({ data, at }: { data: {
  id: string; toolName: string; category: string; status: string; creditsUsed: number;
  errorMessage: string | null;
  user: { id: string; name: string | null; email: string; image: string | null };
}; at: string; }) {
  const Icon = data.category === "video" ? Video : data.category === "audio" ? Music : ImageIcon;
  const StatusIcon = data.status === "COMPLETED" ? CheckCircle : data.status === "FAILED" ? XCircle : Clock;
  const statusColor =
    data.status === "COMPLETED" ? "text-green-400" :
    data.status === "FAILED"    ? "text-red-400" :
                                   "text-yellow-400";

  return (
    <li className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02]">
      <div className="w-10 h-10 rounded-xl bg-accent-400/10 border border-accent-400/20 flex items-center justify-center text-accent-400 shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-white">{data.toolName}</span>
          <StatusIcon className={cn("w-3.5 h-3.5", statusColor)} />
          <span className="text-xs text-gray-500">• {data.creditsUsed} كريديت</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
          <Link href={`/admin/users/${data.user.id}`} className="hover:text-accent-400 transition-colors">
            {data.user.name ?? data.user.email}
          </Link>
          {data.errorMessage && <span className="text-red-400 truncate">· {data.errorMessage}</span>}
        </div>
      </div>
      <span className="text-xs text-gray-600 shrink-0 hidden md:block">{formatRelative(at)}</span>
    </li>
  );
}

function CreditRow({ data, at }: { data: {
  id: string; type: string; amount: number; balanceAfter: number; reason: string | null;
  user: { id: string; name: string | null; email: string };
}; at: string; }) {
  const positive = data.amount > 0;
  const ArrowIcon = positive ? ArrowUp : ArrowDown;
  const color = positive ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-red-400 bg-red-500/10 border-red-500/20";
  const typeLabel: Record<string, string> = {
    DEDUCTION: "خصم", PURCHASE: "شراء", SUBSCRIPTION: "اشتراك",
    BONUS: "مكافأة", REFUND: "استرجاع", ADJUSTMENT: "تعديل",
  };

  return (
    <li className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02]">
      <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0", color)}>
        <ArrowIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-white">
            {typeLabel[data.type] ?? data.type} · {positive ? "+" : ""}{data.amount.toLocaleString("en")}
          </span>
          <span className="text-xs text-gray-500">رصيد جديد: {data.balanceAfter.toLocaleString("en")}</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          <Link href={`/admin/users/${data.user.id}`} className="hover:text-accent-400 transition-colors">
            {data.user.name ?? data.user.email}
          </Link>
          {data.reason && <span className="text-gray-600"> · {data.reason}</span>}
        </div>
      </div>
      <span className="text-xs text-gray-600 shrink-0 hidden md:block">{formatRelative(at)}</span>
    </li>
  );
}

function SignupRow({ data, at }: { data: {
  id: string; name: string | null; email: string; image: string | null; plan: string;
}; at: string; }) {
  return (
    <li className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02]">
      <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 shrink-0">
        <UserPlus className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-white">مستخدم جديد انضم!</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
          <Link href={`/admin/users/${data.id}`} className="hover:text-accent-400 transition-colors">
            {data.name ?? data.email}
          </Link>
          <span className="text-gray-600" dir="ltr">{data.email}</span>
        </div>
      </div>
      <span className="text-xs text-gray-600 shrink-0 hidden md:block">{formatRelative(at)}</span>
    </li>
  );
}

function FilterTab({
  active, onClick, label, icon: Icon,
}: {
  active: boolean; onClick: () => void; label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all",
        active
          ? "bg-accent-400/15 text-accent-400 shadow-[inset_0_0_0_1px_rgba(254,228,64,0.3)]"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins}د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs}س`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `منذ ${days}ي`;
  return new Date(iso).toLocaleDateString("ar");
}
