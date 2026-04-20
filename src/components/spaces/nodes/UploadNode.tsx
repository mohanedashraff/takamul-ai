"use client";

import React, { useState, useCallback, useRef } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { Upload, X, FileImage, FileVideo, FileAudio, File } from "lucide-react";
import { BaseNode } from "./BaseNode";

export function UploadNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; type: string; url: string } | null>(
    (data?.file as { name: string; type: string; url: string }) || null
  );
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (f: File) => {
      const url = URL.createObjectURL(f);
      const fileData = { name: f.name, type: f.type, url };
      setFile(fileData);
      updateNodeData(id, { file: fileData });
    },
    [id, updateNodeData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setFile(null);
    updateNodeData(id, { file: null });
  }, [id, updateNodeData]);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="w-8 h-8 text-cyan-400/50" />;
    if (type.startsWith("video/")) return <FileVideo className="w-8 h-8 text-amber-400/50" />;
    if (type.startsWith("audio/")) return <FileAudio className="w-8 h-8 text-emerald-400/50" />;
    return <File className="w-8 h-8 text-white/30" />;
  };

  return (
    <BaseNode
      id={id}
      type="upload"
      selected={selected}
      headerIcon={<Upload className="w-4 h-4" />}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {file ? (
        <div className="relative rounded-xl overflow-hidden border border-white/[0.06]">
          {file.type.startsWith("image/") ? (
            <img src={file.url} alt={file.name} className="w-full h-32 object-cover" />
          ) : (
            <div className="w-full h-24 bg-white/[0.03] flex flex-col items-center justify-center">
              {getFileIcon(file.type)}
              <span className="text-[10px] text-white/30 mt-2 max-w-[90%] truncate">{file.name}</span>
            </div>
          )}
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg text-white/60 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-full h-28 rounded-xl border-2 border-dashed cursor-pointer
            flex flex-col items-center justify-center gap-2 transition-all
            ${isDragging
              ? "border-cyan-400/50 bg-cyan-500/10"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
            }
          `}
        >
          <Upload className={`w-6 h-6 ${isDragging ? "text-cyan-400" : "text-white/20"} transition-colors`} />
          <span className="text-[11px] text-white/30 ">
            اسحب ملف أو اضغط للرفع
          </span>
        </div>
      )}
    </BaseNode>
  );
}
