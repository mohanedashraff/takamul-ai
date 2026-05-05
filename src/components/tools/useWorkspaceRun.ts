"use client";

// ════════════════════════════════════════════════════════════════
// useWorkspaceRun — common runner for custom tool workspaces
// ════════════════════════════════════════════════════════════════
// All the bespoke workspaces (Inpaint, Sketch, Outpaint, Angle, …)
// share the same execution lifecycle:
//   1. (optional) upload local Files to MuAPI storage → URLs
//   2. submit to MuAPI via executeTool, with per-status progress
//   3. surface { phase, progress, result, resultUrl } to the UI
//   4. on failure → toast + revert phase
//
// Each workspace passes in its tool + a `run({ files, values })` payload
// where `files` are local Files to upload first and `values` are
// already-URL-encoded fields (prompts, model id, ratio, etc.).

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import type { Tool } from "@/lib/data/tools";
import { executeTool, isExecutable } from "@/lib/execute-tool";
import { uploadFile, type MuapiResult } from "@/lib/muapi";

export type WorkspacePhase = "idle" | "ready" | "processing" | "result";

export interface RunArgs {
  /** Local files to upload first. Keys are the muapi payload field names
   *  (or `paramMap` keys defined on the tool's muapi binding). */
  files?:    Record<string, File | Blob | null | undefined>;
  /** Pre-resolved values (already URLs, prompts, numbers, …). */
  values?:   Record<string, unknown>;
  /** Extra fields persisted to the DB `inputs` column (audit/debug). */
  extraDb?:  Record<string, unknown>;
}

export interface UseWorkspaceRun {
  phase:        WorkspacePhase;
  setPhase:     (p: WorkspacePhase) => void;
  progress:     string;
  result:       MuapiResult | null;
  /** First usable URL (image, video, …) from the muapi result. */
  resultUrl:    string | null;
  /** All URLs returned by muapi (for tools that return galleries). */
  resultUrls:   string[];
  /** Last error message — kept around so workspaces can render it. */
  errorMessage: string;
  /** Kick off a run. Returns the resolved result or throws. */
  run:          (args: RunArgs) => Promise<MuapiResult | null>;
  /** Reset state to idle (call on "new run" / reset buttons). */
  reset:        () => void;
}

export function useWorkspaceRun(tool: Tool): UseWorkspaceRun {
  const [phase,        setPhase]        = useState<WorkspacePhase>("idle");
  const [progress,     setProgress]     = useState("");
  const [result,       setResult]       = useState<MuapiResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const run = useCallback(async (args: RunArgs): Promise<MuapiResult | null> => {
    if (!isExecutable(tool)) {
      const msg = "هذه الأداة لم تُربط بعد بالـ AI backend";
      toast.error(msg);
      setErrorMessage(msg);
      return null;
    }

    setPhase("processing");
    setProgress("جاري التحضير…");
    setResult(null);
    setErrorMessage("");

    try {
      const values: Record<string, unknown> = { ...(args.values ?? {}) };

      // 1. Upload local files first
      if (args.files) {
        for (const [field, file] of Object.entries(args.files)) {
          if (!file) continue;
          const file2 = file as File;
          setProgress(`جاري رفع ${file2.name || field}…`);
          const { url } = await uploadFile(file2);
          values[field] = url;
        }
      }

      // 2. Pre-select first model if caller didn't choose one
      if (!values.model && tool.muapi?.models[0]?.id) {
        values.model = tool.muapi.models[0].id;
      }

      // 3. Submit + poll
      setProgress("جاري التوليد بالذكاء الاصطناعي…");
      const { result: r } = await executeTool(
        tool,
        { ...values, ...(args.extraDb ?? {}) },
        { onStatus: (s) => setProgress(statusToArabic(s)) },
      );

      setResult(r);
      setPhase("result");
      toast.success("تم بنجاح ✨");
      return r;
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      toast.error(message);
      setErrorMessage(message);
      setPhase("ready");
      return null;
    } finally {
      setProgress("");
    }
  }, [tool]);

  const reset = useCallback(() => {
    setPhase("idle");
    setProgress("");
    setResult(null);
    setErrorMessage("");
  }, []);

  const resultUrls = collectUrls(result);
  const resultUrl  = resultUrls[0] ?? null;

  return {
    phase, setPhase,
    progress, result,
    resultUrl, resultUrls,
    errorMessage,
    run, reset,
  };
}

// ── helpers ──────────────────────────────────────────────────────────

function statusToArabic(s: string): string {
  switch (s) {
    case "queued":
    case "pending":    return "في قائمة الانتظار…";
    case "processing":
    case "running":    return "جاري التوليد…";
    case "completed":  return "تم!";
    default:            return "جاري المعالجة…";
  }
}

function collectUrls(r: MuapiResult | null): string[] {
  if (!r) return [];
  const out: string[] = [];
  if (typeof r.url === "string" && r.url) out.push(r.url);
  if (typeof r.output === "string" && r.output) out.push(r.output);
  if (Array.isArray(r.urls)) out.push(...r.urls.filter((u): u is string => typeof u === "string"));
  if (Array.isArray(r.outputs)) {
    for (const o of r.outputs) {
      if (typeof o === "string") out.push(o);
      else if (typeof o === "object" && o && "url" in o) {
        const u = (o as { url?: unknown }).url;
        if (typeof u === "string") out.push(u);
      }
    }
  }
  return Array.from(new Set(out));
}

/** Pull the first usable URL out of a MuAPI result. Shared by workspaces. */
export function pickFirstUrl(r: MuapiResult | null | undefined): string | null {
  if (!r) return null;
  if (typeof r.url === "string" && r.url) return r.url;
  if (Array.isArray(r.urls) && r.urls[0]) return r.urls[0];
  if (Array.isArray(r.outputs) && r.outputs.length) {
    const first = r.outputs[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first && "url" in first) {
      return (first as { url: string }).url;
    }
  }
  if (typeof r.output === "string") return r.output;
  return null;
}

/** Pull every URL from a MuAPI result — used by gallery-style workspaces (multi-scene, what's-next). */
export function pickAllUrls(r: MuapiResult | null | undefined): string[] {
  if (!r) return [];
  const out: string[] = [];
  if (typeof r.url === "string" && r.url) out.push(r.url);
  if (typeof r.output === "string" && r.output) out.push(r.output);
  if (Array.isArray(r.urls)) out.push(...r.urls.filter((u): u is string => typeof u === "string"));
  if (Array.isArray(r.outputs)) {
    for (const o of r.outputs) {
      if (typeof o === "string") out.push(o);
      else if (typeof o === "object" && o && "url" in o) {
        const u = (o as { url?: unknown }).url;
        if (typeof u === "string") out.push(u);
      }
    }
  }
  return Array.from(new Set(out));
}

/** Convert a canvas to a PNG Blob (used by mask-drawing workspaces). */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Failed to encode canvas"));
      resolve(blob);
    }, "image/png");
  });
}

/** Wrap a Blob into a File so uploadFile() can give it a proper filename. */
export function blobToFile(blob: Blob, name: string): File {
  return new File([blob], name, { type: blob.type || "application/octet-stream" });
}
