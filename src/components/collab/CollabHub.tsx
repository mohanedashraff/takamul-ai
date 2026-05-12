"use client";

/* ════════════════════════════════════════════════════════════════
   CollabHub — teams + shared workspaces page
   ════════════════════════════════════════════════════════════════
   Lists the user's teams + lets them create a new one, invite by
   email, and pick a team to switch into. Real-time presence + chat
   come in a follow-up — for now we focus on the team/membership
   primitives. */

import { useEffect, useState } from "react";
import { Users, Plus, Mail, Loader2, Check, ArrowUpRight } from "lucide-react";

interface Team {
  id:          string;
  name:        string;
  role:        "OWNER" | "ADMIN" | "MEMBER";
  memberCount: number;
  createdAt:   string;
}

interface InvitePending {
  id:      string;
  email:   string;
  role:    string;
  sentAt:  string;
}

export function CollabHub() {
  const [teams, setTeams]       = useState<Team[] | null>(null);
  const [active, setActive]     = useState<Team | null>(null);
  const [pending, setPending]   = useState<InvitePending[]>([]);
  const [newName, setNewName]   = useState("");
  const [inviteEmail, setInvEmail] = useState("");
  const [busy, setBusy]         = useState(false);

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((d) => {
        setTeams(d.teams ?? []);
        if ((d.teams ?? []).length > 0) setActive(d.teams[0]);
      })
      .catch(() => setTeams([]));
  }, []);

  useEffect(() => {
    if (!active) return;
    fetch(`/api/teams/${active.id}/invites`)
      .then((r) => r.json())
      .then((d) => setPending(d.invites ?? []))
      .catch(() => setPending([]));
  }, [active]);

  async function createTeam() {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/teams", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: newName.trim() }),
      });
      const data = await r.json();
      if (r.ok && data.team) {
        setTeams((t) => [data.team, ...(t ?? [])]);
        setActive(data.team);
        setNewName("");
      }
    } finally { setBusy(false); }
  }

  async function sendInvite() {
    if (!active || !inviteEmail.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/teams/${active.id}/invites`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await r.json();
      if (r.ok && data.invite) {
        setPending((p) => [data.invite, ...p]);
        setInvEmail("");
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
          <Users className="w-4 h-4" /> Collab
        </div>
        <h1 className="text-3xl font-bold">فرَق ومساحات تعاونية</h1>
        <p className="text-gray-400 text-sm mt-2">
          أنشئ فريق، اعزم زمايلك، وشاركوا الـSoul IDs والـMoodboards والـcanvases.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams list */}
        <aside className="lg:col-span-1 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h2 className="text-sm font-medium mb-3">الفِرَق</h2>
            {!teams && (
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> جاري التحميل…
              </div>
            )}
            {teams && teams.length === 0 && (
              <div className="text-xs text-gray-500">مفيش فِرَق لسة.</div>
            )}
            {teams && teams.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t)}
                className={`w-full text-right p-3 rounded-xl mb-2 transition-colors ${
                  active?.id === t.id
                    ? "bg-white text-black"
                    : "bg-white/[0.03] hover:bg-white/[0.06] text-gray-200"
                }`}
              >
                <div className="text-sm font-medium">{t.name}</div>
                <div className={`text-[11px] ${active?.id === t.id ? "text-black/60" : "text-gray-500"}`}>
                  {t.memberCount} عضو · دور: {t.role}
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h2 className="text-sm font-medium mb-3 flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> فريق جديد</h2>
            <div className="flex items-center gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="اسم الفريق"
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/20"
              />
              <button
                disabled={!newName.trim() || busy}
                onClick={createTeam}
                className="bg-white text-black text-xs px-3 py-2 rounded-xl font-medium hover:bg-white/90 disabled:opacity-50"
              >
                إنشاء
              </button>
            </div>
          </div>
        </aside>

        {/* Active team detail */}
        <section className="lg:col-span-2 space-y-3">
          {active ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{active.name}</h2>
                    <div className="text-xs text-gray-500 mt-1">{active.memberCount} عضو</div>
                  </div>
                  <a
                    href={`/spaces?team=${active.id}`}
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    افتح المساحات <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>

                <h3 className="text-sm font-medium mt-4 mb-2 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> دعوة عضو
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInvEmail(e.target.value)}
                    placeholder="email@company.com"
                    type="email"
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                  />
                  <button
                    disabled={!inviteEmail.includes("@") || busy}
                    onClick={sendInvite}
                    className="bg-white text-black text-xs px-3 py-2 rounded-xl font-medium hover:bg-white/90 disabled:opacity-50"
                  >
                    اعزم
                  </button>
                </div>
              </div>

              {pending.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <h3 className="text-sm font-medium mb-3">دعوات معلّقة</h3>
                  <ul className="space-y-2">
                    {pending.map((p) => (
                      <li key={p.id} className="flex items-center justify-between text-xs px-3 py-2 bg-white/[0.03] rounded-lg">
                        <span className="text-gray-300">{p.email}</span>
                        <span className="text-gray-500 flex items-center gap-1"><Check className="w-3 h-3" /> أُرسلت</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center text-sm text-gray-400">
              اختار فريق من الجنب أو أنشئ فريق جديد للبداية.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
