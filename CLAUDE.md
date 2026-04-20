# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Stack snapshot

- **Next.js 16.2** (App Router) + **React 19.2** + **TypeScript 5** (strict). `@/*` → `src/*`.
- **Tailwind v4** via `@tailwindcss/postcss` (no `tailwind.config.ts` — theme lives in `src/app/globals.css`).
- **Prisma 7** client generated to `src/generated/prisma` (non-standard — import from there, not `@prisma/client` directly once the schema is fleshed out). Schema at `prisma/schema.prisma` is currently a stub (no models yet). DB config is in `prisma.config.ts`, not `package.json`.
- **NextAuth v5 beta** (`next-auth@5.0.0-beta`) — API surface differs from v4 docs.
- **AI SDK v6** (`ai`, `@ai-sdk/react`) — major-version breaking changes from v3/v4 guides.
- **Tiptap v3** for rich text, **@xyflow/react v12** (aliased via `reactflow` 11 also installed — prefer `@xyflow/react`), **Zustand** + **Jotai** both present, **Radix UI** primitives, **Framer Motion**, **Sonner** + **react-hot-toast**.

Because several core packages are on new majors (Next 16, React 19, Prisma 7, NextAuth 5, AI SDK 6, Tiptap 3), **consult `node_modules/<pkg>/dist/docs/` or the package README before relying on training-data API shapes** — see `AGENTS.md`.

## Commands

```bash
npm run dev     # next dev (Turbopack by default in Next 16)
npm run build   # next build
npm run start   # next start (prod)
npm run lint    # eslint (flat config in eslint.config.mjs)
```

No test runner, no typecheck script — run `npx tsc --noEmit` to type-check. No `prisma` npm script either; use `npx prisma generate` / `npx prisma migrate dev` directly (config picked up from `prisma.config.ts`, which loads `.env` via `dotenv/config`).

Windows note: the repo lives under a path with a space (`H:\Projects\takamul ai`). Quote paths in shell commands.

## Architecture

**Arabic-first RTL app.** Root layout (`src/app/layout.tsx`) hardcodes `lang="ar" dir="rtl"` and the Alexandria font — keep that in mind when adding locale-aware UI. Design tokens (`bg-bg-primary`, brand colors) are defined as CSS variables in `globals.css` and consumed via Tailwind utilities.

**Route layout (actual, not the aspirational one in `docs/FILE_STRUCTURE.md`):**
- `src/app/page.tsx` — landing.
- `src/app/(dashboard)/` — route group with its own `layout.tsx` (Navbar + centered container). Contains `dashboard/`, `tools/[toolId]/`, `spaces/[id]/`, `agents/`.
- `src/app/studio/[category]/` — studio surfaces with their own layout.
- `src/app/tool/[toolId]/`, `src/app/spaces/`, `src/app/chat/`, `src/app/login/`, `src/app/register/`, `src/app/pricing/` — top-level pages.
- `src/app/api/app/[...path]/route.ts` and `src/app/api/workflow/[...path]/route.ts` — **catch-all proxies** to `https://api.muapi.ai/{app,workflow}/...`, forwarding method/body/query and injecting `x-api-key` from `MU_API_KEY`. This is the main backend integration pattern — the frontend calls these Next routes; they relay to MuAPI. Don't bypass the proxy from the client (the key would leak).

**Tool catalog** lives in `src/lib/data/tools.ts` and `src/lib/data/agents.ts` as in-memory arrays of `Tool` objects (id, title, desc, icon, preview image/video, credit cost). These drive the dynamic `[toolId]` pages. Arabic copy is baked into these records.

**Components** are grouped by surface under `src/components/` (`home/`, `layout/`, `spaces/`, `tools/`, `ui/`) plus top-level `Navbar.tsx` / `Footer.tsx`. There is no `src/hooks`, `src/stores`, `src/types`, or `src/i18n` directory yet despite what `docs/FILE_STRUCTURE.md` claims — that doc describes the planned end state, not current reality.

**Docs in `docs/` are Arabic design docs and planning artifacts**, not a factual description of the current code. Treat them as intent/spec, not ground truth. `docs/ARCHITECTURE.md` references services (Stripe, S3, Redis, OpenAI/Stability/Replicate/ElevenLabs, a credit system, NextAuth wiring) that are **not yet implemented** in `src/`. If a task touches one of these areas, assume you're building it for the first time and check what actually exists before assuming a pattern.

## Project rules (from `docs/README.md`)

- UI copy is Arabic RTL first, with English as a secondary concern.
- No mocks/placeholders — every tool is expected to be fully functional end-to-end.
- Every tool has a credit cost (see `credits` field in `src/lib/data/tools.ts`) and is expected to deduct from a user balance once the credit system is wired.
