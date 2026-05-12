"use client";

// ════════════════════════════════════════════════════════════════
// Assist Chatbot — chat UI with streaming Claude responses
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's `/assist` page: a conversational
// interface to the entire Yilow tool catalogue. The user describes
// a creative goal, Claude recommends the right tool(s) with deep
// links the user can click directly.

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Loader2, Sparkles, RefreshCw, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const PERSIST_KEY = "yilow_assist_v1";
const MAX_TURNS   = 40;

interface ChatMessage {
  role:    "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "إعمل لي فيديو إعلان TikTok عمودي لمنتج جديد",
  "محتاج 9 لقطات سينمائية مختلفة لشخصية واحدة",
  "ابني شخصية افتراضية AI Influencer للـbrand بتاعتي",
  "حضّر قائمة منتج Amazon كاملة (main + secondary + A+)",
  "ولّد صور إديتوريال فاشن بستايل Y2K",
  "كيف أحوّل صورة منتج لـ3D figurine؟",
];

export function AssistChat() {
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [input,     setInput]     = useState<string>("");
  const [streaming, setStreaming] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── persistence ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PERSIST_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<{ messages: ChatMessage[] }>;
      if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(PERSIST_KEY, JSON.stringify({ messages })); } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [messages]);

  // Auto-scroll to bottom on every message change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, streaming]);

  // ── handlers ──────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const nextHistory = [...messages, userMsg].slice(-MAX_TURNS);
    setMessages(nextHistory);
    setInput("");
    setStreaming(true);
    // Push an empty assistant message that we'll fill via streaming
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const r = await fetch("/api/assist", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: nextHistory }),
      });
      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        throw new Error(errBody.error || "فشل الاتصال بالـAssist");
      }
      const reader = r.body?.getReader();
      if (!reader) throw new Error("لم نستلم رد streaming");
      const decoder = new TextDecoder("utf-8");
      let acc = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        acc += chunk;
        // Update the last assistant message with the accumulated text
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ";
      setError(msg);
      toast.error(msg);
      // Remove the empty assistant message we appended optimistically
      setMessages((m) => {
        if (m.length > 0 && m[m.length - 1]!.role === "assistant" && m[m.length - 1]!.content === "") {
          return m.slice(0, -1);
        }
        return m;
      });
    } finally {
      setStreaming(false);
    }
  };

  const onClear = () => {
    if (messages.length === 0) return;
    if (!confirm("هل تريد مسح المحادثة بالكامل؟")) return;
    setMessages([]);
    toast.success("تم مسح المحادثة");
  };

  // ── render ────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col">
      {/* Hero header (only when chat is empty) */}
      {messages.length === 0 && (
        <div className="relative pt-10 md:pt-14 pb-6 text-center px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-400/30 bg-accent-400/5 text-accent-400 text-xs font-black mb-5">
            <Bot className="w-3 h-3" />
            Assist
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-[1.4] max-w-3xl mx-auto">
            مش عارف تبدأ منين؟ <span className="text-accent-400">Yilow Assist</span> يدلّك
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            اكتب هدفك الإبداعي، وClaude يرشّحلك الأداة المناسبة + يديك link مباشر تبدأ منه.
          </p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-32"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            // Empty state — suggested prompts grid
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  type="button"
                  className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-accent-400/30 transition-colors text-right group"
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-accent-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <p className="text-sm text-white font-bold leading-relaxed">{p}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "flex gap-3",
                  m.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full shrink-0 flex items-center justify-center",
                  m.role === "user"
                    ? "bg-accent-400 text-black"
                    : "bg-white/10 text-accent-400 border border-accent-400/30",
                )}>
                  {m.role === "user" ? <MessageSquare className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-accent-400 text-black font-bold"
                    : "bg-white/[0.04] text-white border border-white/10",
                )}>
                  {m.role === "assistant" && m.content === "" && streaming ? (
                    <Loader2 className="w-4 h-4 animate-spin text-accent-400" />
                  ) : (
                    <MarkdownLite content={m.content} />
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-5 pointer-events-none" dir="rtl">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <div className="bento-card rounded-3xl border border-white/10 p-3 backdrop-blur-2xl bg-black/60 shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-end gap-2">
              {messages.length > 0 && (
                <button
                  onClick={onClear}
                  type="button"
                  aria-label="مسح المحادثة"
                  title="ابدأ محادثة جديدة"
                  className="w-10 h-10 shrink-0 rounded-xl border border-white/10 hover:bg-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Enter (without shift) sends; Shift+Enter inserts newline.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="اكتب هدفك الإبداعي هنا… (Enter للإرسال، Shift+Enter لسطر جديد)"
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none px-1 text-right max-h-32"
                dir="rtl"
                disabled={streaming}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || streaming}
                type="button"
                aria-label="إرسال"
                className={cn(
                  "w-10 h-10 shrink-0 rounded-xl font-black flex items-center justify-center transition-all",
                  !input.trim() || streaming
                    ? "bg-white/5 text-gray-600 cursor-not-allowed"
                    : "bg-accent-400 text-black hover:scale-[1.05] active:scale-95 shadow-[0_0_20px_rgba(254,228,64,0.35)]",
                )}
              >
                {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <div className="mt-2 px-2 text-[11px] text-red-400">{error}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tiny Markdown renderer ────────────────────────────────────────
// Just enough Markdown to render Claude's typical replies:
//   • [text](url) → clickable link
//   • **bold** → <strong>
//   • `code` → <code>
//   • newlines → <br>
//   • bullet "- " at line start → <li> (loose)
//
// Avoid bringing in a full Markdown library for this MVP; if the AI
// response complexity grows we'll swap in `react-markdown`.

function MarkdownLite({ content }: { content: string }) {
  // Process lines so bullets render as a list. Other inline formatting
  // is handled per-line.
  const lines = content.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.trim().startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-accent-400 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFmt(line.replace(/^\s*-\s*/, "")) }} />
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: inlineFmt(line) }} />;
      })}
    </div>
  );
}

// Inline formatter — converts safe-listed Markdown to HTML.
// Order matters: links first (they wrap text), then bold, then code,
// otherwise the regexes step on each other.
function inlineFmt(s: string): string {
  // Escape HTML special chars first so user-provided strings can't
  // inject markup. Then re-introduce only the patterns we recognise.
  const esc = s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc
    // [text](url) — only allow internal /paths or http(s) for safety
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text: string, url: string) => {
      const safeUrl = /^(https?:\/\/|\/)/.test(url) ? url : "#";
      const isInternal = safeUrl.startsWith("/");
      const target = isInternal ? "" : ` target="_blank" rel="noopener noreferrer"`;
      return `<a href="${safeUrl}"${target} class="text-accent-400 underline hover:no-underline font-bold">${text}</a>`;
    })
    // **bold**
    .replace(/\*\*([^*]+)\*\*/g, "<strong class=\"text-accent-400\">$1</strong>")
    // `code`
    .replace(/`([^`]+)`/g, "<code class=\"px-1 py-0.5 rounded bg-white/10 text-[12px] font-mono\">$1</code>");
}
