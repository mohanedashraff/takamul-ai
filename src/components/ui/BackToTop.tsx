"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

/**
 * Floating button that appears after scrolling > 400px and scrolls
 * smoothly to the top on click. Mounted globally in the root layout.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > 400);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 20 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="العودة للأعلى"
          className="fixed bottom-6 left-6 md:bottom-8 md:left-8 z-[60] w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center group"
          style={{
            background: "linear-gradient(135deg, rgba(254,228,64,0.95), rgba(244,196,48,0.9))",
            boxShadow: "0 8px 32px rgba(254,228,64,0.35), 0 0 0 1px rgba(254,228,64,0.3)",
          }}
          whileHover={{ scale: 1.08, boxShadow: "0 12px 40px rgba(254,228,64,0.55)" }}
          whileTap={{ scale: 0.94 }}
        >
          <ArrowUp className="w-5 h-5 md:w-6 md:h-6 text-black stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
          {/* pulse ring */}
          <span className="absolute inset-0 rounded-full bg-accent-400/40 animate-ping opacity-30" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
