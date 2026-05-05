"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { Upload, X, FileImage, FileVideo, FileAudio, File, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { BaseNode } from "./BaseNode";
import { uploadFile } from "@/lib/muapi";
import { registerExecutor, type NodeOutput } from "../lib/graph-executor";

interface UploadedFile {
  name:    string;
  type:    string;
  /** remote (MuAPI-hosted) URL — what gets piped to downstream nodes */
  url:     string;
}

export function UploadNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [file,        setFile]        = useState<UploadedFile | null>((data?.file as UploadedFile) ?? null);
  const [localPreview, setLocalPreview] = useState<string>("");
  const [isDragging,  setIsDragging]  = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress,    setProgress]    = useState(0);

  // Sync to xyflow data so it survives Run All & persistence
  useEffect(() => {
    updateNodeData(id, { file });
  }, [id, file, updateNodeData]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleFile = useCallback(async (f: File) => {
    // Local preview shown immediately
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const localUrl = URL.createObjectURL(f);
    objectUrlRef.current = localUrl;
    setLocalPreview(localUrl);

    setIsUploading(true);
    setProgress(0);
    try {
      const { url } = await uploadFile(f, (p) => setProgress(p));
      setFile({ name: f.name, type: f.type, url });
      toast.success("تم الرفع");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الرفع");
      // keep local preview so user sees what they tried to upload
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLocalPreview("");
    setFile(null);
  }, []);

  const previewUrl = file?.url || localPreview;

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="w-8 h-8 text-cyan-400/50" />;
    if (type.startsWith("video/")) return <FileVideo className="w-8 h-8 text-amber-400/50" />;
    if (type.startsWith("audio/")) return <FileAudio className="w-8 h-8 text-emerald-400/50" />;
    return <File className="w-8 h-8 text-white/30" />;
  };

  return (
    <BaseNode id={id} type="upload" selected={selected} headerIcon={<Upload className="w-4 h-4" />}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-white/[0.06]">
          {(file?.type ?? "").startsWith("image/") || !file ? (
            <img src={previewUrl} alt={file?.name ?? ""} className="w-full h-32 object-cover" />
          ) : file.type.startsWith("video/") ? (
            <video src={previewUrl} className="w-full h-32 object-cover" muted />
          ) : (
            <div className="w-full h-24 bg-white/[0.03] flex flex-col items-center justify-center">
              {getFileIcon(file.type)}
              <span className="text-[10px] text-white/30 mt-2 max-w-[90%] truncate">{file.name}</span>
            </div>
          )}

          {/* upload progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-300">{progress}%</span>
            </div>
          )}

          {/* status badge */}
          {file && !isUploading && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/80 text-black">
              مرفوع
            </div>
          )}

          <button
            onClick={handleRemove}
            disabled={isUploading}
            className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg text-white/60 hover:text-red-400 transition-colors disabled:opacity-50"
            type="button"
            aria-label="إزالة"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full h-28 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${
            isDragging
              ? "border-cyan-400/50 bg-cyan-500/10"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
          }`}
        >
          <Upload className={`w-6 h-6 ${isDragging ? "text-cyan-400" : "text-white/20"} transition-colors`} />
          <span className="text-[11px] text-white/30">اسحب ملف أو اضغط للرفع</span>
        </div>
      )}
    </BaseNode>
  );
}

// ── Graph executor ────────────────────────────────────────────────────
registerExecutor("upload", async (node): Promise<NodeOutput> => {
  const file = node.data?.file as UploadedFile | undefined;
  if (!file?.url) throw new Error("Upload node has no file");

  const t = file.type ?? "";
  const type: NodeOutput["type"] =
    t.startsWith("image/") ? "image" :
    t.startsWith("video/") ? "video" :
    t.startsWith("audio/") ? "audio" : "any";

  return { type, value: file.url };
});
