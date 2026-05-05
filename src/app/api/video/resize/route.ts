// ════════════════════════════════════════════════════════════════
// POST /api/video/resize — change a video's aspect ratio with FFmpeg
// ════════════════════════════════════════════════════════════════
// Body (JSON): { video_url: string, ratio: "16:9" | "9:16" | "1:1" | "4:3" | "21:9" }
// Returns:     { url: string }
//
// We download the source, run ffmpeg locally to crop+pad to the target
// aspect, then upload the result through MuAPI's upload endpoint so we
// get a stable public URL. ffmpeg must be installed on the server
// (apt-get install -y ffmpeg).

import { z } from "zod";
import { spawn } from "node:child_process";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime    = "nodejs";
export const maxDuration = 300;

const RATIO_MAP: Record<string, [number, number]> = {
  "16:9": [16, 9],
  "9:16": [9, 16],
  "1:1":  [1,  1],
  "4:3":  [4,  3],
  "3:4":  [3,  4],
  "21:9": [21, 9],
};

const Schema = z.object({
  video_url: z.string().url(),
  ratio:     z.enum(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"]),
  /** crop = zoom-and-crop to fill | pad = letterbox to preserve full frame */
  mode:      z.enum(["crop", "pad"]).default("crop"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const muKey = process.env.MU_API_KEY;
  if (!muKey) return jsonError("Storage not configured", 503);

  // Pull the source video into a temp dir so ffmpeg can read it.
  const dir = await mkdtemp(join(tmpdir(), "yilow-resize-"));
  const srcPath = join(dir, "src.mp4");
  const outPath = join(dir, "out.mp4");

  try {
    const dl = await fetch(parsed.data.video_url);
    if (!dl.ok) throw new Error(`فشل تحميل الفيديو (${dl.status})`);
    const srcBuf = Buffer.from(await dl.arrayBuffer());
    await writeFile(srcPath, srcBuf);

    // Pick a target width that's a multiple of 2 (libx264 requirement).
    const [rw, rh] = RATIO_MAP[parsed.data.ratio]!;
    const targetW  = 1080;
    const targetH  = Math.round((targetW * rh) / rw / 2) * 2;

    // Build ffmpeg args. crop = scale to cover then crop center;
    // pad = scale to fit, then letterbox with black bars.
    const filter = parsed.data.mode === "crop"
      ? `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH}`
      : `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:color=black`;

    await runFfmpeg([
      "-y",
      "-i", srcPath,
      "-vf", filter,
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "23",
      "-c:a", "copy",
      "-movflags", "+faststart",
      outPath,
    ]);

    // Upload the result to MuAPI storage so it gets a public URL.
    const outBuf = await readFile(outPath);
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(outBuf)], { type: "video/mp4" }), `resized-${Date.now()}.mp4`);
    const up = await fetch("https://api.muapi.ai/api/v1/upload_file", {
      method:  "POST",
      headers: { "x-api-key": muKey },
      body:    form,
    });
    if (!up.ok) throw new Error(`فشل رفع الناتج (${up.status})`);
    const data = await up.json().catch(() => ({}));
    const url = data.url || data.file_url || data.fileUrl;
    if (!url) throw new Error("لم يتم استلام رابط الناتج");

    return jsonOk({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Resize failed";
    return jsonError(message, 500);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
    });
  });
}
