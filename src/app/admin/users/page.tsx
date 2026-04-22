"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Search, Loader2, Shield, Crown, Ban, CheckCircle, MoreHorizontal,
  Zap, Filter, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isBanned: boolean;
  bannedReason: string | null;
  creditsBalance: number;
  creditsLimit: number;
  createdAt: string;
  _count: { generations: number; chatConversations: number; spaces: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [bannedFilter, setBannedFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  async function fetchUsers() {
    setLoading(true);
    const params = new URLSearchParams();
    if (query)        params.set("q", query);
    if (planFilter)   params.set("plan", planFilter);
    if (roleFilter)   params.set("role", roleFilter);
    if (bannedFilter) params.set("banned", bannedFilter);
    const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, planFilter, roleFilter, bannedFilter]);

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">المستخدمون</h1>
          <p className="text-gray-400">إدارة حسابات المنصة</p>
        </div>
        <div className="text-sm font-bold text-gray-400">
          <span className="text-white tabular-nums">{users.length.toLocaleString("en")}</span> مستخدم
        </div>
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
              placeholder="بحث بالاسم أو الإيميل..."
              className="w-full h-10 bg-black/40 border border-white/10 rounded-lg pr-10 pl-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent-400"
            />
          </div>
          <FilterSelect
            value={planFilter}
            onChange={setPlanFilter}
            placeholder="كل الخطط"
            options={[
              { value: "FREE", label: "مجاني" },
              { value: "BASIC", label: "أساسي" },
              { value: "PRO", label: "PRO" },
              { value: "ENTERPRISE", label: "ENTERPRISE" },
            ]}
          />
          <FilterSelect
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="كل الأدوار"
            options={[
              { value: "USER", label: "مستخدم" },
              { value: "ADMIN", label: "أدمن" },
              { value: "SUPER_ADMIN", label: "سوبر أدمن" },
            ]}
          />
          <FilterSelect
            value={bannedFilter}
            onChange={setBannedFilter}
            placeholder="الحالة"
            options={[
              { value: "false", label: "نشط" },
              { value: "true", label: "محظور" },
            ]}
          />
          {(query || planFilter || roleFilter || bannedFilter) && (
            <button
              onClick={() => { setQuery(""); setPlanFilter(""); setRoleFilter(""); setBannedFilter(""); }}
              className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1"
            >
              <X className="w-3 h-3" /> مسح
            </button>
          )}
        </CardContent>
      </Card>

      {/* Users table */}
      <Card className="border-border-glass">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-20 text-center text-gray-500">لا توجد نتائج</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-right">المستخدم</th>
                  <th className="px-4 py-3 text-right">الدور</th>
                  <th className="px-4 py-3 text-right">الخطة</th>
                  <th className="px-4 py-3 text-right">الكريديت</th>
                  <th className="px-4 py-3 text-right">العمليات</th>
                  <th className="px-4 py-3 text-right">التسجيل</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className={cn("hover:bg-white/[0.02] transition-colors", u.isBanned && "opacity-60")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <MiniAvatar user={u} />
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{u.name ?? "—"}</div>
                          <div className="text-xs text-gray-500 truncate" dir="ltr">{u.email}</div>
                        </div>
                        {u.isBanned && <span title="محظور"><Ban className="w-4 h-4 text-red-400" /></span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={u.plan} />
                    </td>
                    <td className="px-4 py-3 tabular-nums font-bold text-accent-400">
                      {u.creditsBalance.toLocaleString("en")}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-400">
                      {u._count.generations.toLocaleString("en")}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString("ar")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(u)}
                        className="text-xs font-bold text-accent-400 hover:text-white transition-colors"
                      >
                        إدارة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Edit modal */}
      {selected && (
        <UserEditModal
          user={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────
function UserEditModal({
  user, onClose, onUpdated,
}: {
  user: AdminUser;
  onClose: () => void;
  onUpdated: (u: Partial<AdminUser> & { id: string }) => void;
}) {
  const [role, setRole]             = useState(user.role);
  const [plan, setPlan]             = useState(user.plan);
  const [creditsDelta, setCreditsDelta] = useState<string>("");
  const [isBanned, setIsBanned]     = useState(user.isBanned);
  const [bannedReason, setBannedReason] = useState(user.bannedReason ?? "");
  const [saving, setSaving]         = useState(false);

  async function save() {
    setSaving(true);
    const delta = Number(creditsDelta);
    const body: Record<string, unknown> = { role, plan, isBanned };
    if (!Number.isNaN(delta) && delta !== 0) body.creditsDelta = delta;
    if (isBanned) body.bannedReason = bannedReason || null;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "حدث خطأ");
        return;
      }
      toast.success("تم الحفظ");
      onUpdated(data.user);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0a0a0b] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <MiniAvatar user={user} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white">{user.name ?? user.email}</div>
            <div className="text-xs text-gray-500" dir="ltr">{user.email}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Role */}
          <Field label="الدور">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="w-full h-11 bg-black/40 border border-white/10 rounded-lg px-3 text-white text-sm focus:outline-none focus:border-accent-400"
            >
              <option value="USER">USER — مستخدم عادي</option>
              <option value="ADMIN">ADMIN — أدمن</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN — سوبر أدمن</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">تغيير الدور يتطلب صلاحيات SUPER_ADMIN</p>
          </Field>

          {/* Plan */}
          <Field label="الخطة">
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as typeof plan)}
              className="w-full h-11 bg-black/40 border border-white/10 rounded-lg px-3 text-white text-sm focus:outline-none focus:border-accent-400"
            >
              <option value="FREE">FREE — مجاني</option>
              <option value="BASIC">BASIC — أساسي</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
          </Field>

          {/* Credits */}
          <Field label={`الرصيد الحالي: ${user.creditsBalance.toLocaleString("en")} كريديت`}>
            <div className="flex gap-2">
              <input
                type="number"
                value={creditsDelta}
                onChange={(e) => setCreditsDelta(e.target.value)}
                placeholder="+500 لمنح / -500 لخصم"
                className="flex-1 h-11 bg-black/40 border border-white/10 rounded-lg px-3 text-white text-sm focus:outline-none focus:border-accent-400"
              />
              <Button variant="glass" onClick={() => setCreditsDelta("1000")}>+1000</Button>
              <Button variant="glass" onClick={() => setCreditsDelta("10000")}>+10k</Button>
            </div>
          </Field>

          {/* Ban toggle */}
          <Field label="حالة الحساب">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isBanned}
                onChange={(e) => setIsBanned(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className={cn("text-sm font-bold", isBanned ? "text-red-400" : "text-green-400")}>
                {isBanned ? "محظور من استخدام المنصة" : "نشط"}
              </span>
            </label>
            {isBanned && (
              <input
                type="text"
                value={bannedReason}
                onChange={(e) => setBannedReason(e.target.value)}
                placeholder="سبب الحظر (اختياري)"
                className="mt-3 w-full h-11 bg-red-500/5 border border-red-500/20 rounded-lg px-3 text-white text-sm focus:outline-none focus:border-red-500"
              />
            )}
          </Field>
        </div>

        <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button variant="cosmic" onClick={save} disabled={saving} className="px-6">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ التعديلات"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Bits ─────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-400 mb-2">{label}</label>
      {children}
    </div>
  );
}

function FilterSelect({
  value, onChange, placeholder, options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-white text-sm focus:outline-none focus:border-accent-400 min-w-[130px]"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, { label: string; cls: string; icon?: React.ComponentType<{className?:string}> }> = {
    USER:        { label: "مستخدم",     cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
    ADMIN:       { label: "أدمن",       cls: "bg-red-500/10 text-red-400 border-red-500/20", icon: Shield },
    SUPER_ADMIN: { label: "سوبر أدمن",  cls: "bg-red-500/15 text-red-300 border-red-500/30", icon: Crown },
  };
  const c = cfg[role] ?? cfg.USER;
  const Icon = c.icon;
  return (
    <span className={cn("px-2 py-1 rounded-md text-[10px] font-black border inline-flex items-center gap-1", c.cls)}>
      {Icon && <Icon className="w-2.5 h-2.5" />}
      {c.label}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const cfg: Record<string, string> = {
    FREE: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    BASIC: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    PRO: "bg-accent-400/15 text-accent-400 border-accent-400/30",
    ENTERPRISE: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  const label: Record<string, string> = {
    FREE: "مجاني", BASIC: "أساسي", PRO: "PRO", ENTERPRISE: "ENTERPRISE",
  };
  return (
    <span className={cn("px-2 py-1 rounded-md text-[10px] font-black border", cfg[plan] ?? cfg.FREE)}>
      {label[plan] ?? plan}
    </span>
  );
}

function MiniAvatar({ user }: { user: { name: string | null; email: string; image: string | null } }) {
  const initials = (user.name ?? user.email).split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  if (user.image) return <img src={user.image} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />;
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-500 to-accent-400 text-black font-black flex items-center justify-center text-xs shrink-0">
      {initials}
    </div>
  );
}
