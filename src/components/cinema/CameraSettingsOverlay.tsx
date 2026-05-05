"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { CAMERAS, LENSES, FOCAL_LENGTHS, APERTURES } from "@/lib/data/cinema";
import { ScrollColumn } from "./ScrollColumn";

export interface CameraConfig {
  cameraId:   string;
  lensId:     string;
  focal:      number;
  apertureId: string;
}

export interface CameraSettingsOverlayProps {
  open:    boolean;
  config:  CameraConfig;
  onChange:(c: CameraConfig) => void;
  onClose: () => void;
}

export function CameraSettingsOverlay({ open, config, onChange, onClose }: CameraSettingsOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={onClose}
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative bento-card rounded-3xl border border-white/10 p-6 md:p-8 max-w-5xl w-[94%] max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-white">إعدادات الكاميرا</h3>
                <p className="text-xs text-gray-500 mt-0.5">اختر تجهيزاتك السينمائية</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl border border-white/10 hover:bg-white/5 flex items-center justify-center transition-colors shrink-0"
                aria-label="إغلاق"
                type="button"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Columns row — center, gap-6, scroll horizontally on small screens */}
            <div className="flex items-start justify-center gap-4 md:gap-6 overflow-x-auto pb-2 no-scrollbar">
              <ScrollColumn
                title="الكاميرا"
                items={CAMERAS}
                selectedId={config.cameraId}
                onChange={(id) => onChange({ ...config, cameraId: id as string })}
              />
              <ScrollColumn
                title="العدسة"
                items={LENSES}
                selectedId={config.lensId}
                onChange={(id) => onChange({ ...config, lensId: id as string })}
              />
              <ScrollColumn
                title="البُعد البؤري"
                items={FOCAL_LENGTHS.map((f) => ({ id: f.id, name: f.label, label: f.label }))}
                selectedId={config.focal}
                onChange={(id) => onChange({ ...config, focal: id as number })}
              />
              <ScrollColumn
                title="فتحة العدسة"
                items={APERTURES.map((a) => ({ id: a.id, name: a.label, label: a.label, thumbnail: a.thumbnail }))}
                selectedId={config.apertureId}
                onChange={(id) => onChange({ ...config, apertureId: id as string })}
              />
            </div>

            <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-end">
              <button
                onClick={onClose}
                className="h-11 px-8 rounded-xl bg-accent-400 text-black font-black text-sm hover:scale-[1.02] active:scale-95 transition-transform"
                type="button"
              >
                تم
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
