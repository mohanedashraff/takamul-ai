// ════════════════════════════════════════════════════════════════
// POST /api/assist — chat assistant streaming endpoint
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's `/assist` page: a Claude-powered
// chat assistant that knows the entire Yilow tool catalogue and helps
// the user pick the right studio / tool for their goal.
//
// MVP scope: conversational guidance only. Claude responds with
// recommendations + deep links (e.g. "حسناً، لإعلان TikTok عمودي
// استخدم [Marketing Studio](/marketing) مع mode=ugc + setting=street").
// We DON'T have it dispatch generations directly yet — that's phase 2.
//
// Body : { messages: { role: "user" | "assistant"; content: string }[] }
// Reply: streaming text/plain (incremental tokens)

import { z } from "zod";
import { streamText } from "ai";
import { aiModel, isAiConfigured } from "@/lib/ai-provider";
import { auth } from "@/auth";
import { jsonError } from "@/lib/api";
import { ALL_TOOLS_FLAT } from "@/lib/data/tools";

export const runtime    = "nodejs";
export const maxDuration = 60;

const Schema = z.object({
  messages: z.array(z.object({
    role:    z.enum(["user", "assistant"]),
    content: z.string().min(1).max(10_000),
  })).min(1).max(40),
});

// ── System prompt — Yilow tool guide ──────────────────────────────
//
// Built ONCE at module load from the tool catalogue. Each tool
// contributes a one-line "id — title — desc — route" so Claude can
// recommend specific deep links accurately without us having to
// maintain a parallel doc.

function buildToolCatalogSection(): string {
  return ALL_TOOLS_FLAT
    .map((t) => {
      const route = t.customRoute ?? `/tools/${t.id}`;
      return `- ${t.id} — ${t.title} (${t.categoryName}) — ${t.desc} — Route: ${route}`;
    })
    .join("\n");
}

const SYSTEM_PROMPT = `You are the Yilow.ai in-app assistant. The user is on a Saudi Arabian / pan-Arab AI generation platform — Arabic-first, tailored to MENA creators, covering image / video / audio generation, viral effects, marketing studios, and consistent characters.

Your job:
1. Understand the user's CREATIVE GOAL in natural language (Arabic or English).
2. Recommend the RIGHT Yilow tool / studio for the job.
3. Embed deep links as Markdown links so the user can click directly. Example: [Marketing Studio](/marketing).
4. When relevant, recommend a sequence of tools (e.g. generate character in Soul → animate in Cinema → make ad in Marketing).
5. If the user asks something the platform doesn't support yet, say so honestly and suggest the closest workflow.
6. Reply primarily in Arabic (the user's expected language is Arabic, dialect-flexible). Code/tool names stay in English.

DO NOT:
- Generate images / videos yourself — only recommend tools.
- Make up tools or routes that don't exist (use the catalogue below).
- Ask for credentials or sensitive data.
- Be verbose — keep replies tight, 2-6 sentences typically. Use bullet
  lists when comparing 2+ tools. Always include at least one clickable link.

YILOW TOOL CATALOGUE:
${buildToolCatalogSection()}

KEY STUDIOS:
- /soul — Soul Studio (إديتوريال فاشن، 138 ستايل + Soul ID character refs)
- /cinema — Cinema Studio (سينمائي، كاميرا/عدسة/Genre + Contact Sheet)
- /marketing — Marketing Studio (إعلانات UGC، 9 hooks + 14 settings + 38 avatars)
- /ai-influencer — AI Influencer Studio (143 اختيار شخصية)
- /product-photoshoot — Product Photoshoot (10 modes تصوير منتج)
- /marketplace-cards — Marketplace Cards (13 أصل لـAmazon listing)
- /edit — Edit Canvas (تعديل صورة موحد)

GENERAL ROUTES:
- /tools — كل الأدوات
- /spaces — مكتبة المستخدم
- /pricing — الأسعار

When uncertain which tool fits, ask ONE clarifying question, then recommend.`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  if (!isAiConfigured()) {
    return jsonError("Assist غير مُعدّ حالياً — أضف OPENROUTER_API_KEY إلى البيئة.", 503);
  }

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { messages } = parsed.data;

  // Stream tokens back so the UI can paint the response as it arrives
  // (better perceived latency vs waiting for the full reply).
  const result = streamText({
    model:       aiModel("anthropic/claude-sonnet-4.5"),
    system:      SYSTEM_PROMPT,
    messages:    messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: 0.6,
  });

  return result.toTextStreamResponse();
}
