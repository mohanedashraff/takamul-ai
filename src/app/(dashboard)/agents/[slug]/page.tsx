"use client";

import React, { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2, ArrowRight, Send, Bot, User as UserIcon, Image as ImageIcon, X, Loader,
} from "lucide-react";
import toast from "react-hot-toast";
import { uploadFile } from "@/lib/muapi";
import { cn } from "@/lib/utils";

interface AgentMeta {
  agent_id:      string;
  name:          string;
  description?:  string;
  thumbnail?:    string;
  system_prompt?:string;
}

interface Msg {
  id:        string;
  role:      "user" | "assistant" | "system";
  content:   string;
  thoughts?: string;
  attachments?: string[];
  status?:   "pending" | "done" | "failed";
}

export default function AgentChatPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [agent,    setAgent]    = useState<AgentMeta | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const [convId,   setConvId]   = useState<string | null>(null);

  // Pending file attachments for the next message.
  const [pendingFiles,    setPendingFiles]    = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);

  // Load agent metadata.
  useEffect(() => {
    fetch(`/api/external-agents/by-slug/${slug}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) {
          toast.error(d.error);
        } else {
          setAgent(d);
        }
      })
      .catch(() => toast.error("فشل تحميل الوكيل"))
      .finally(() => setLoading(false));
  }, [slug]);

  // Auto-scroll on new messages.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setPendingFiles((p) => [...p, ...arr]);
    setPendingPreviews((p) => [...p, ...arr.map((f) => URL.createObjectURL(f))]);
  };
  const removePending = (idx: number) => {
    setPendingFiles((p) => p.filter((_, i) => i !== idx));
    setPendingPreviews((p) => {
      if (p[idx]) URL.revokeObjectURL(p[idx]);
      return p.filter((_, i) => i !== idx);
    });
  };

  const send = async () => {
    if (sending) return;
    const text = input.trim();
    if (!text && pendingFiles.length === 0) return;

    const userMsg: Msg = {
      id:          crypto.randomUUID(),
      role:        "user",
      content:     text,
      attachments: [],          // filled in below after upload
    };

    // Place a placeholder for the assistant reply right away.
    const replyId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      userMsg,
      { id: replyId, role: "assistant", content: "", status: "pending" },
    ]);
    setInput("");
    setSending(true);

    try {
      // 1. Upload any attachments via MuAPI storage.
      const attachmentUrls: string[] = [];
      for (const file of pendingFiles) {
        const { url } = await uploadFile(file);
        attachmentUrls.push(url);
      }
      // Update the user message in-place with real URLs.
      setMessages((m) => m.map((x) => x.id === userMsg.id ? { ...x, attachments: attachmentUrls } : x));
      setPendingFiles([]);
      pendingPreviews.forEach((u) => URL.revokeObjectURL(u));
      setPendingPreviews([]);

      // 2. Submit the chat call to muapi.
      const submit = await fetch(`/api/external-agents/by-slug/${slug}/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          message:         text,
          stream:          false,
          conversation_id: convId,
          attachments:     attachmentUrls,
        }),
      });
      const data = await submit.json().catch(() => ({}));
      if (!submit.ok) throw new Error(data.error || data.detail || "فشل الإرسال");

      const requestId: string | undefined = data.request_id || data.id;
      if (!requestId) throw new Error("لم يتم استلام معرف الطلب");

      // 3. Poll the prediction. Different agents return different shapes
      // — common ones are `{ messages: [{role, content}] }` or
      // `{ response: "..." }`.
      const out = await pollPrediction(requestId);
      const reply = pickAgentReply(out);
      const newConvId = (out as { conversation_id?: string })?.conversation_id ?? null;
      if (newConvId && !convId) setConvId(newConvId);

      setMessages((m) => m.map((x) => x.id === replyId
        ? { ...x, content: reply || "(لم يصل رد)", status: "done" }
        : x,
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطأ";
      toast.error(message);
      setMessages((m) => m.map((x) => x.id === replyId
        ? { ...x, content: message, status: "failed" }
        : x,
      ));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="site-container py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
      </div>
    );
  }
  if (!agent) {
    return (
      <div className="site-container py-20 text-center space-y-4">
        <p className="text-gray-400">الوكيل غير متوفر</p>
        <Link href="/agents" className="text-accent-400 font-bold">→ كل الوكلاء</Link>
      </div>
    );
  }

  return (
    <div className="site-container py-6 pb-24 flex flex-col h-[calc(100vh-80px)]">
      <Link
        href="/agents"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors mb-4"
      >
        <ArrowRight className="w-4 h-4" />
        كل الوكلاء
      </Link>

      {/* Agent header */}
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.02] mb-4">
        <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center overflow-hidden shrink-0">
          {agent.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={agent.thumbnail} alt={agent.name} className="w-full h-full object-cover" />
          ) : (
            <Bot className="w-6 h-6 text-violet-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black text-white truncate">{agent.name}</h1>
          {agent.description && (
            <p className="text-[11px] text-gray-500 line-clamp-2">{agent.description}</p>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-white/[0.02] border border-white/10 rounded-2xl p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8 text-gray-500">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-violet-400" />
            </div>
            <p className="text-sm font-bold text-white mb-1">ابدأ المحادثة مع {agent.name}</p>
            <p className="text-xs">اطلب أي مهمة في تخصصه — هيرد بأفضل ما يقدر.</p>
          </div>
        ) : (
          messages.map((m) => <Bubble key={m.id} m={m} />)
        )}
      </div>

      {/* Composer */}
      {/* Attachment previews */}
      {pendingPreviews.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {pendingPreviews.map((src, i) => (
            <div key={i} className="relative w-14 h-14 rounded-lg border border-white/10 overflow-hidden group shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removePending(i)}
                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                type="button"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-end gap-2 bg-white/[0.04] border border-white/10 rounded-2xl px-3 py-2 focus-within:border-accent-400/40 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          multiple
          hidden
          onChange={(e) => { onPickFiles(e.target.files); e.target.value = ""; }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-400 transition-colors shrink-0"
          aria-label="إرفاق ملف"
          type="button"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={`اكتب رسالة لـ ${agent.name}…`}
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none py-2 px-2 resize-none"
          style={{ maxHeight: 200 }}
          dir="auto"
        />
        <button
          onClick={send}
          disabled={sending || (!input.trim() && pendingFiles.length === 0)}
          className={cn(
            "h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0",
            sending || (!input.trim() && pendingFiles.length === 0)
              ? "bg-white/5 text-gray-600 cursor-not-allowed"
              : "bg-accent-400 text-black hover:scale-[1.05] active:scale-95",
          )}
          type="button"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

async function pollPrediction(requestId: string): Promise<unknown> {
  const deadline = Date.now() + 5 * 60 * 1000; // 5-min cap for chat
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    const r = await fetch(`/api/v1/predictions/${requestId}/result`, { cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    const status = String(data.status ?? "").toLowerCase();
    if (!status || status === "completed" || status === "succeeded" || status === "success" || status === "done") {
      return data;
    }
    if (status === "failed" || status === "error") {
      throw new Error(data.error || data.detail || "فشل الرد");
    }
  }
  throw new Error("انتهت المهلة");
}

function pickAgentReply(out: unknown): string {
  if (!out || typeof out !== "object") return "";
  const o = out as Record<string, unknown>;
  // Prefer explicit messages array (the agents endpoint convention).
  const msgs = (o.messages ?? o.outputs) as Array<{ role?: string; content?: string }> | undefined;
  if (Array.isArray(msgs) && msgs.length) {
    const last = [...msgs].reverse().find((m) => m.role === "assistant" || !m.role);
    if (last?.content) return String(last.content);
  }
  if (typeof o.response === "string") return o.response;
  if (typeof o.output === "string")   return o.output;
  if (typeof o.text === "string")     return o.text;
  return "";
}

// ── Message bubble ──────────────────────────────────────────────────

function Bubble({ m }: { m: Msg }) {
  const isUser = m.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
          isUser
            ? "bg-accent-400/15 text-accent-400 border-accent-400/30"
            : "bg-violet-500/15 text-violet-400 border-violet-500/30",
        )}
      >
        {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={cn("flex-1 min-w-0 max-w-[85%]", isUser && "text-right")}>
        {(m.attachments ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1.5">
            {(m.attachments ?? []).map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={u} alt="" className="w-20 h-20 rounded-lg object-cover border border-white/10" />
            ))}
          </div>
        )}
        <div
          className={cn(
            "inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
            isUser ? "bg-accent-400/10 text-white border border-accent-400/20"
                   : "bg-white/[0.04] text-gray-100 border border-white/10",
          )}
        >
          {m.status === "pending" ? (
            <span className="flex items-center gap-2 text-gray-400">
              <Loader className="w-3.5 h-3.5 animate-spin" />
              جاري الرد…
            </span>
          ) : (
            m.content || <span className="text-gray-500 italic">(فارغ)</span>
          )}
        </div>
      </div>
    </div>
  );
}
