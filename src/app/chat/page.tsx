"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import toast from "react-hot-toast";
import {
  Plus, MessageSquare, Send, Sparkles, Terminal, FileText, Image as ImageIcon,
  ChevronDown, Check, Trash2, ArrowRight, PanelRightClose, PanelRightOpen,
  Loader2, Bot, User as UserIcon,
} from "lucide-react";
import { CHAT_MODELS, DEFAULT_MODEL_ID } from "@/lib/chat-models";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { icon: Terminal,  title: "كتابة سكريبت بايثون",   desc: "لتحليل البيانات من ملف CSV"             },
  { icon: FileText,  title: "تلخيص مستند",            desc: "استخراج النقاط الرئيسية من التقرير"     },
  { icon: Sparkles,  title: "عصف ذهني",                desc: "أفكار لحملة تسويقية جديدة"              },
  { icon: ImageIcon, title: "تحليل صورة",              desc: "استخراج النصوص ووصف المحتوى"            },
];

interface ConversationListItem {
  id:        string;
  title:     string;
  model:     string;
  updatedAt: string;
  _count:    { messages: number };
}

interface Message {
  id:        string;
  role:      "user" | "assistant" | "system";
  content?:  string;
  parts?:    Array<{ type: string; text?: string }>;
}

export default function ChatPage() {
  const router = useRouter();

  // ── Conversations state ──────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConvId,  setActiveConvId]  = useState<string | null>(null);
  const [loadingConv,   setLoadingConv]   = useState(false);
  const [initialMessages, setInitialMessages] = useState<Message[] | null>(null);

  const [activeModelId, setActiveModelId] = useState<string>(DEFAULT_MODEL_ID);
  const [modelOpen,     setModelOpen]     = useState(false);
  // Default the conversations sidebar to OPEN on desktop, CLOSED on
  // mobile/tablet — at < md its 280px panel covers the main column.
  const [sidebarOpen,   setSidebarOpen]   = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768;
  });
  const activeModel = CHAT_MODELS.find((m) => m.id === activeModelId) ?? CHAT_MODELS[0]!;

  // ── Load conversations on mount ───────────────────────────────────────
  const refreshConvs = async () => {
    try {
      const r = await fetch("/api/conversations", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setConversations(data.conversations ?? []);
    } catch {}
  };
  useEffect(() => { refreshConvs(); }, []);

  // ── Chat state — Vercel AI SDK ───────────────────────────────────────
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          conversationId: activeConvIdRef.current ?? undefined,
          model:          activeModelId,
        }),
      }),
    [activeModelId],
  );

  // useChat doesn't accept conversationId as a reactive prop, so we mirror
  // it in a ref that the transport reads on each request.
  const activeConvIdRef = useRef<string | null>(null);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  const { messages, sendMessage, setMessages, status } = useChat({
    transport,
    messages: (initialMessages as never) ?? undefined,
    onFinish: () => {
      // Ensure new conversation appears in the sidebar after the first reply.
      refreshConvs();
    },
    onError: (err) => {
      toast.error(err.message || "خطأ في المحادثة");
    },
  });

  // Reset useChat state when initialMessages reload (e.g., switching conversation).
  useEffect(() => {
    if (initialMessages !== null) {
      setMessages(initialMessages as never);
    }
  }, [initialMessages, setMessages]);

  const streaming = status === "streaming" || status === "submitted";

  // ── Active conversation switching ─────────────────────────────────────
  const openConversation = async (id: string) => {
    if (id === activeConvId) return;
    setLoadingConv(true);
    setActiveConvId(id);
    try {
      const r = await fetch(`/api/conversations/${id}`, { cache: "no-store" });
      if (!r.ok) throw new Error("فشل تحميل المحادثة");
      const data = await r.json();
      const conv = data.conversation;
      setActiveModelId(conv.model);
      const msgs: Message[] = (conv.messages ?? []).map((m: { id: string; role: string; content: string }) => ({
        id:      m.id,
        role:    m.role.toLowerCase() as "user" | "assistant" | "system",
        content: m.content,
        parts:   [{ type: "text", text: m.content }],
      }));
      setInitialMessages(msgs);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setLoadingConv(false);
    }
  };

  const startNewConversation = () => {
    setActiveConvId(null);
    setInitialMessages([]);
    setMessages([]);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("هل تريد حذف هذه المحادثة نهائياً؟")) return;
    try {
      const r = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("فشل الحذف");
      if (id === activeConvId) startNewConversation();
      refreshConvs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    }
  };

  // ── Composer ──────────────────────────────────────────────────────────
  const [input, setInput] = useState("");
  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    await sendMessage({ text });
  };

  return (
    <div className="h-screen w-full bg-[#050508] overflow-hidden flex flex-col font-sans" dir="rtl">
      <div className="flex-1 flex overflow-hidden relative">

        {/* Back button */}
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={() => router.push("/")}
            className="p-3 bg-[#111118]/80 backdrop-blur-3xl border border-white/[0.04] shadow-2xl rounded-2xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-all group pointer-events-auto"
            title="الرئيسية"
          >
            <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Sidebar — conversations */}
        <aside
          className={cn(
            "shrink-0 border-l border-white/5 bg-black/30 backdrop-blur-2xl flex flex-col transition-all duration-300",
            sidebarOpen ? "w-[280px]" : "w-0 overflow-hidden",
          )}
        >
          <div className="p-4 border-b border-white/5">
            <button
              onClick={startNewConversation}
              className="w-full h-10 rounded-xl bg-accent-400/15 border border-accent-400/30 text-accent-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent-400/25 transition-colors"
            >
              <Plus className="w-4 h-4" /> محادثة جديدة
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 hide-scroll">
            {conversations.length === 0 ? (
              <div className="px-4 py-12 text-center text-xs text-gray-500">
                لا يوجد محادثات بعد
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className={cn(
                    "w-full text-right px-4 py-3 flex items-start gap-2 group hover:bg-white/[0.03] transition-colors border-r-2",
                    activeConvId === c.id ? "border-accent-400 bg-white/[0.03]" : "border-transparent",
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-gray-500 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{c.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {c._count.messages} رسالة · {formatDate(c.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition"
                    aria-label="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main column */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          {/* Top bar */}
          <div className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-white/5 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
                title="المحادثات"
              >
                {sidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
              </button>
              <span className="text-white font-bold text-sm">Yilow AI</span>
            </div>

            {/* Model picker */}
            <div className="relative">
              <button
                onClick={() => setModelOpen((v) => !v)}
                className="flex items-center gap-2 h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/80 font-bold hover:bg-white/[0.08] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent-400" />
                {activeModel.label}
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>
              {modelOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setModelOpen(false)} />
                  <div className="absolute top-full mt-2 left-0 z-40 w-64 bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-1.5">
                    {CHAT_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setActiveModelId(m.id); setModelOpen(false); }}
                        className={cn(
                          "w-full text-right px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors",
                          activeModelId === m.id ? "bg-accent-400/15 text-accent-400" : "text-gray-300 hover:bg-white/5",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold">{m.label}</div>
                          <div className="text-[10px] text-gray-500 truncate">{m.provider}</div>
                        </div>
                        {activeModelId === m.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-12 py-8">
            {loadingConv ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-accent-400" />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState onPick={(s) => setInput(s)} />
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m as Message} />
                ))}
                {streaming && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {activeModel.label} يكتب…
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Composer */}
          <form onSubmit={onSubmit} className="shrink-0 px-4 md:px-12 pb-6 pt-3 border-t border-white/5 bg-black/30 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 bg-white/[0.04] border border-white/10 rounded-2xl px-3 py-2 focus-within:border-accent-400/40 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSubmit();
                    }
                  }}
                  placeholder="اسأل أي سؤال أو اطلب مساعدة…"
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none py-2 px-2 resize-none"
                  style={{ maxHeight: 200 }}
                />
                <button
                  type="submit"
                  disabled={streaming || !input.trim()}
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                    streaming || !input.trim()
                      ? "bg-white/5 text-gray-600 cursor-not-allowed"
                      : "bg-accent-400 text-black hover:scale-[1.05] active:scale-95",
                  )}
                >
                  {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-2 text-center">
                Yilow AI قد ينتج معلومات غير دقيقة — تحقق دائماً من المصدر.
              </p>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="max-w-2xl w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent-400/10 border border-accent-400/30 flex items-center justify-center mx-auto mb-5">
          <Bot className="w-9 h-9 text-accent-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">إزيك! إيه اللي ممكن أساعدك فيه؟</h2>
        <p className="text-gray-500 mb-8">اسأل في أي حاجة، تحليل، برمجة، تلخيص، أفكار…</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => onPick(`${s.title} — ${s.desc}`)}
              className="text-right p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-accent-400/30 hover:bg-white/[0.05] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-accent-400 transition-colors">
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{s.title}</p>
                  <p className="text-xs text-gray-500 truncate">{s.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  // AI SDK v5+ uses parts[]; older messages have content. Support both.
  const text = message.parts
    ? message.parts.map((p) => p.text ?? "").join("")
    : message.content ?? "";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
          isUser ? "bg-accent-400/15 text-accent-400 border border-accent-400/30" : "bg-violet-500/15 text-violet-400 border border-violet-500/30",
        )}
      >
        {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={cn("flex-1 min-w-0 max-w-[85%]", isUser && "text-right")}>
        <div
          className={cn(
            "inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
            isUser ? "bg-accent-400/10 text-white border border-accent-400/20" : "bg-white/[0.04] text-gray-100 border border-white/10",
          )}
        >
          {text || <span className="text-gray-500 italic">(فارغ)</span>}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
  const diffDays = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "أمس";
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return d.toLocaleDateString("ar");
}
