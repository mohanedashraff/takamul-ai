"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Sparkles, Zap, Upload, ImageIcon, X,
  ChevronDown, Plus, RotateCcw, Download, Loader2, Check,
} from "lucide-react";
import type { Tool } from "@/lib/data/tools";
import type { STUDIO_CATEGORIES, ToolCategory } from "@/lib/data/tools";

// ── Types ─────────────────────────────────────────────────────────────────────

type Gender = "male" | "female";
type Phase  = "idle" | "processing" | "result";

interface ClothingItem {
  id: string;
  nameAr: string;
  img: string;       // Unsplash image URL
  gradient: string;  // fallback
}

interface Category { id: string; label: string; items: ClothingItem[] }
interface SelectedItem extends ClothingItem { categoryId: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

const CF = (uuid: string) =>
  `https://d2ol7oe51mr4n9.cloudfront.net/content_user_id/${uuid}`;

// ── Outfit presets ────────────────────────────────────────────────────────────

const MALE_OUTFITS: ClothingItem[] = [
  { id: "urban-core",    nameAr: "Urban Core",    gradient: "from-zinc-900 to-zinc-700",    img: CF("e9f0dfe5-cbbd-460f-ad91-fa5a2a2edd77.png") },
  { id: "tokyo",         nameAr: "Tokyo Morning", gradient: "from-stone-800 to-stone-600",  img: CF("dee5de5a-1e12-41f5-817e-99a66decec8d.png") },
  { id: "silent-lux",   nameAr: "Silent Luxury", gradient: "from-neutral-700 to-stone-500",img: CF("eed17a5d-7363-4996-b75f-1f5d0c78c2e9.png") },
  { id: "sad-boy",       nameAr: "Sade Boy",      gradient: "from-slate-900 to-slate-700",  img: CF("20f308a0-8cb0-4ae2-b6b9-9c69cce35e76.png") },
  { id: "quiet-lux",    nameAr: "Quiet Luxury",  gradient: "from-amber-900 to-yellow-700", img: CF("092e05af-107c-491f-ad16-5e7577eabf1c.png") },
  { id: "post-goth",    nameAr: "Post-Goth",     gradient: "from-purple-950 to-purple-800",img: CF("16cb5e89-7311-4bfe-900d-35652d6d879c.jpg") },
  { id: "performative", nameAr: "Performative",  gradient: "from-red-900 to-orange-700",   img: CF("3fbb42e5-0182-4e42-a1a6-e39915c7d0bb.png") },
  { id: "minimalist",   nameAr: "Minimalistic",  gradient: "from-gray-700 to-gray-500",    img: CF("edc88810-c2e3-416e-9974-bf6e81e41cb7.png") },
  { id: "loser-core",   nameAr: "Loser Core",    gradient: "from-teal-900 to-cyan-800",    img: CF("9874b45a-0570-4df3-8b7d-49a9d52f8d66.webp") },
  { id: "grunge",        nameAr: "Grunge",        gradient: "from-green-900 to-lime-900",   img: CF("028e99ec-1984-419b-aefd-9302a61c0a90.png") },
  { id: "downtown",      nameAr: "Downtown",      gradient: "from-blue-950 to-blue-800",    img: CF("8817021d-f52e-4144-acd7-04c6b071b723.png") },
  { id: "asian-ug",     nameAr: "Asian UG",      gradient: "from-rose-900 to-pink-800",    img: CF("5dd879c0-b536-4173-b1eb-0ee21bca28ee.webp") },
];

const FEMALE_OUTFITS: ClothingItem[] = [
  { id: "f-modern",     nameAr: "Modern Chic",   gradient: "from-pink-900 to-rose-700",     img: "" },
  { id: "f-boho",       nameAr: "بوهيمي",        gradient: "from-amber-800 to-orange-600",  img: "" },
  { id: "f-y2k",        nameAr: "Y2K",           gradient: "from-violet-900 to-fuchsia-700",img: "" },
  { id: "f-minimal",    nameAr: "Minimal",       gradient: "from-slate-700 to-gray-500",    img: "" },
  { id: "f-romantic",   nameAr: "رومانسي",       gradient: "from-red-800 to-pink-600",      img: "" },
  { id: "f-street",     nameAr: "Street Style",  gradient: "from-indigo-900 to-blue-700",   img: "" },
  { id: "f-power",      nameAr: "Power Suit",    gradient: "from-stone-800 to-stone-600",   img: "" },
  { id: "f-athleisure", nameAr: "رياضي",         gradient: "from-cyan-900 to-teal-700",     img: "" },
  { id: "f-evening",    nameAr: "سهرة",          gradient: "from-purple-900 to-indigo-700", img: "" },
  { id: "f-casual",     nameAr: "Casual",        gradient: "from-green-800 to-emerald-600", img: "" },
];

// ── Category items (individual pieces) ───────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    id: "outerwear", label: "جاكيت",
    items: [
      { id: "ow1", nameAr: "جينز Contrast", gradient: "from-blue-800 to-indigo-700",  img: CF("15e2cf01-f486-4979-a94c-56ed3419686e.jpg") },
      { id: "ow2", nameAr: "ويندبريكر أصفر",gradient: "from-yellow-700 to-amber-600", img: CF("41798135-ddf6-407c-936d-eadbf175b2cb.jpg") },
      { id: "ow3", nameAr: "فليس أبيض",     gradient: "from-gray-200 to-gray-400",    img: CF("36986791-750a-43ca-9f59-0c689f4179d7.jpg") },
      { id: "ow4", nameAr: "هودي فرو رمادي",gradient: "from-gray-700 to-gray-500",    img: CF("681022f1-c8a2-4ace-87b6-08c38a4321a7.jpg") },
      { id: "ow5", nameAr: "باركا كامو",    gradient: "from-green-900 to-green-700",  img: CF("03f17bf0-a4df-42b4-b56f-0c8e6d74097f.jpg") },
      { id: "ow6", nameAr: "فيست كامو",     gradient: "from-stone-800 to-green-800",  img: CF("936487f2-4247-43be-8cd9-f538c1a6e994.jpg") },
      { id: "ow7", nameAr: "بافر بني",      gradient: "from-amber-900 to-stone-700",  img: CF("af9cbe68-a8d9-4ba3-be17-e3115728af98.jpg") },
      { id: "ow8", nameAr: "جاكيت فرو بني", gradient: "from-stone-900 to-amber-800",  img: CF("0deb5e1c-40ed-40d7-9bfc-46c64e5eb3f7.jpg") },
    ],
  },
  {
    id: "tops", label: "توبات",
    items: [
      { id: "t1", nameAr: "تي شيرت أبيض", gradient: "from-gray-200 to-gray-400",    img: "" },
      { id: "t2", nameAr: "تي شيرت أسود", gradient: "from-zinc-900 to-zinc-700",    img: "" },
      { id: "t3", nameAr: "قميص",          gradient: "from-sky-800 to-sky-600",      img: "" },
      { id: "t4", nameAr: "بولو",          gradient: "from-emerald-800 to-teal-600", img: "" },
      { id: "t5", nameAr: "سويت شيرت",    gradient: "from-purple-900 to-violet-700",img: "" },
      { id: "t6", nameAr: "مخطط",          gradient: "from-blue-900 to-slate-700",   img: "" },
    ],
  },
  {
    id: "bottoms", label: "بناطيل",
    items: [
      { id: "b1", nameAr: "بنطلون أسود",  gradient: "from-zinc-950 to-zinc-800",    img: "" },
      { id: "b2", nameAr: "جينز أزرق",    gradient: "from-blue-900 to-blue-600",    img: "" },
      { id: "b3", nameAr: "كارجو",         gradient: "from-stone-900 to-green-800",  img: "" },
      { id: "b4", nameAr: "شورت",          gradient: "from-stone-800 to-stone-600",  img: "" },
      { id: "b5", nameAr: "تنورة",         gradient: "from-pink-900 to-rose-700",    img: "" },
      { id: "b6", nameAr: "واسع",          gradient: "from-gray-800 to-gray-600",    img: "" },
    ],
  },
  {
    id: "shoes", label: "أحذية",
    items: [
      { id: "s1", nameAr: "سنيكرز",       gradient: "from-gray-100 to-gray-300",    img: "" },
      { id: "s2", nameAr: "بوت",           gradient: "from-stone-900 to-stone-700",  img: "" },
      { id: "s3", nameAr: "لوفر",          gradient: "from-amber-900 to-stone-700",  img: "" },
      { id: "s4", nameAr: "كعب عالي",      gradient: "from-red-900 to-rose-700",     img: "" },
      { id: "s5", nameAr: "كونفرس",        gradient: "from-red-800 to-gray-300",     img: "" },
      { id: "s6", nameAr: "صنادل",         gradient: "from-yellow-800 to-orange-600",img: "" },
    ],
  },
  {
    id: "accessories", label: "إكسسوارات",
    items: [
      { id: "a1", nameAr: "شنطة",          gradient: "from-stone-900 to-stone-700",  img: "" },
      { id: "a2", nameAr: "قبعة",          gradient: "from-zinc-800 to-gray-600",    img: "" },
      { id: "a3", nameAr: "ساعة",          gradient: "from-yellow-700 to-amber-500", img: "" },
      { id: "a4", nameAr: "حزام",          gradient: "from-stone-900 to-amber-800",  img: "" },
      { id: "a5", nameAr: "إيشارب",        gradient: "from-red-900 to-rose-600",     img: "" },
      { id: "a6", nameAr: "نظارة",         gradient: "from-gray-950 to-gray-700",    img: "" },
    ],
  },
];

const GEN_COUNTS = [1, 2, 4];

// ── ItemCard ──────────────────────────────────────────────────────────────────

function ItemCard({ item, isSelected, onToggle, rgb, size = "md" }: {
  item: ClothingItem; isSelected: boolean; onToggle: () => void; rgb: string; size?: "sm" | "md";
}) {
  const [imgErr, setImgErr] = useState(!item.img);
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer group",
        "hover:scale-[1.03]",
        size === "sm" ? "w-10 h-10 shrink-0" : "aspect-[3/4] w-full",
      )}
      style={{
        borderColor: isSelected ? `rgb(${rgb})` : "transparent",
        boxShadow:   isSelected ? `0 0 12px rgba(${rgb},0.4)` : undefined,
      }}
    >
      {imgErr ? (
        <div className={cn("absolute inset-0 bg-gradient-to-b", item.gradient)} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.img} alt={item.nameAr}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgErr(true)} />
      )}

      {/* Label */}
      {size === "md" && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-1 pb-1 pt-4">
          <p className="text-white text-[9px] font-semibold text-center leading-tight truncate">{item.nameAr}</p>
        </div>
      )}

      {/* Checkmark */}
      {isSelected && (
        <div className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center z-10"
          style={{ backgroundColor: `rgb(${rgb})` }}>
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
      )}

      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
    </button>
  );
}

// ── AccordionSection ──────────────────────────────────────────────────────────

function AccordionSection({ category, selectedItems, onToggleItem, rgb }: {
  category: Category; selectedItems: SelectedItem[];
  onToggleItem: (item: ClothingItem, categoryId: string) => void; rgb: string;
}) {
  const [open, setOpen] = useState(false);
  const selCount = selectedItems.filter(s => s.categoryId === category.id).length;

  return (
    <div className="border-t border-white/8">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/4 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">{category.label}</span>
          {selCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `rgba(${rgb},0.2)`, color: `rgb(${rgb})` }}>
              {selCount}
            </span>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform duration-200", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
              <button className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-white/15
                flex flex-col items-center justify-center gap-1
                hover:border-white/30 hover:bg-white/5 transition-all">
                <Plus className="w-4 h-4 text-gray-500" />
                <span className="text-[9px] text-gray-600">ارفع</span>
              </button>
              {category.items.map(item => (
                <ItemCard key={item.id} item={item}
                  isSelected={selectedItems.some(s => s.id === item.id)}
                  onToggle={() => onToggleItem(item, category.id)}
                  rgb={rgb} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FashionDesignerWorkspace({ tool, config }: {
  tool: Tool; config: (typeof STUDIO_CATEGORIES)[ToolCategory];
}) {
  const router = useRouter();
  const rgb    = config.shadowColor;

  const [phase,          setPhase]          = useState<Phase>("idle");
  const [gender,         setGender]         = useState<Gender>("male");
  const [personPreview,  setPersonPreview]  = useState("");
  const [selectedItems,  setSelectedItems]  = useState<SelectedItem[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<string | null>(null);
  const [genCount,       setGenCount]       = useState(2);
  const [showSelected,   setShowSelected]   = useState(false);

  const personUrlRef  = useRef("");
  const personFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (personUrlRef.current) URL.revokeObjectURL(personUrlRef.current); }, []);

  const pickPerson = useCallback((f: File) => {
    if (personUrlRef.current) URL.revokeObjectURL(personUrlRef.current);
    const url = URL.createObjectURL(f);
    personUrlRef.current = url;
    setPersonPreview(url);
  }, []);

  const toggleItem = useCallback((item: ClothingItem, categoryId: string) => {
    setSelectedOutfit(null);
    setSelectedItems(prev => {
      const exists = prev.find(s => s.id === item.id);
      return exists ? prev.filter(s => s.id !== item.id) : [...prev, { ...item, categoryId }];
    });
  }, []);

  const selectOutfit = useCallback((outfit: ClothingItem) => {
    setSelectedOutfit(p => p === outfit.id ? null : outfit.id);
    setSelectedItems([]);
  }, []);

  const reset = () => { setSelectedItems([]); setSelectedOutfit(null); };

  const canGenerate  = !!personPreview && (!!selectedOutfit || selectedItems.length > 0);
  const outfits      = gender === "male" ? MALE_OUTFITS : FEMALE_OUTFITS;
  const totalSelected = selectedOutfit ? 1 : selectedItems.length;
  const activeOutfit  = outfits.find(o => o.id === selectedOutfit);

  return (
    // h-screen + overflow-hidden = fixed total height, no body scroll
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      <Navbar />

      {/* Below navbar */}
      <div className="flex flex-1 min-h-0 pt-16 md:pt-20">

        {/* ── RIGHT SIDEBAR (first in DOM = right side in RTL) ─────────────── */}
        <aside className="w-[288px] shrink-0 border-l border-white/5 bg-black/50 backdrop-blur-3xl
          flex flex-col overflow-hidden">

          {/* Gender toggle + Reset */}
          <div className="shrink-0 px-3 pt-3 pb-2.5 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center bg-white/6 border border-white/10 rounded-xl p-1 gap-1">
              {(["male", "female"] as const).map(g => (
                <button key={g}
                  onClick={() => { setGender(g); reset(); }}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                    gender === g ? "text-white" : "text-gray-500 hover:text-gray-300"
                  )}
                  style={gender === g ? {
                    backgroundColor: `rgba(${rgb},0.25)`,
                    border: `1px solid rgba(${rgb},0.4)`,
                  } : {}}>
                  {g === "male" ? "رجالي" : "حريمي"}
                </button>
              ))}
            </div>
            <button onClick={reset}
              className={cn(
                "w-8 h-8 rounded-xl border transition-all flex items-center justify-center",
                totalSelected > 0
                  ? "border-white/10 text-gray-400 hover:text-white hover:bg-white/8"
                  : "border-white/5 text-gray-700 cursor-not-allowed"
              )}>
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Selected items accordion */}
          <AnimatePresence initial={false}>
            {totalSelected > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden border-b border-white/5 shrink-0"
              >
                <button onClick={() => setShowSelected(s => !s)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-300">العناصر المختارة</span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-black"
                      style={{ backgroundColor: `rgb(${rgb})` }}>
                      {totalSelected}
                    </span>
                  </div>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-gray-500 transition-transform duration-200", showSelected && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {showSelected && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      transition={{ duration: 0.15 }} className="overflow-hidden">
                      <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                        {activeOutfit && (
                          <Chip label={activeOutfit.nameAr} onRemove={reset} rgb={rgb} />
                        )}
                        {selectedItems.map(item => (
                          <Chip key={item.id} label={item.nameAr}
                            onRemove={() => toggleItem(item, item.categoryId)} rgb={rgb} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Scrollable categories ── */}
          <div className="flex-1 min-h-0 overflow-y-auto hide-scroll">

            {/* Outfit presets */}
            <div className="border-b border-white/5 pb-3">
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm font-medium text-gray-200">طقم كامل</span>
                {selectedOutfit && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `rgba(${rgb},0.2)`, color: `rgb(${rgb})` }}>1</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5 px-3">
                {/* Custom upload slot */}
                <button className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-white/15
                  flex flex-col items-center justify-center gap-1
                  hover:border-white/30 hover:bg-white/5 transition-all">
                  <Plus className="w-4 h-4 text-gray-500" />
                  <span className="text-[9px] text-gray-600">ارفع</span>
                </button>
                {outfits.map(outfit => (
                  <ItemCard key={outfit.id} item={outfit}
                    isSelected={selectedOutfit === outfit.id}
                    onToggle={() => selectOutfit(outfit)}
                    rgb={rgb} />
                ))}
              </div>
            </div>

            {/* Individual categories */}
            {CATEGORIES.map(cat => (
              <AccordionSection key={cat.id} category={cat}
                selectedItems={selectedItems}
                onToggleItem={toggleItem}
                rgb={rgb} />
            ))}

            <div className="h-4" /> {/* bottom spacer */}
          </div>
        </aside>

        {/* ── MAIN LEFT AREA ───────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#060608]">

          {/* Top bar */}
          <div className="h-14 shrink-0 flex items-center gap-3 px-5 border-b border-white/5 bg-black/20 backdrop-blur-sm">
            <button onClick={() => router.back()}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10"
              style={{ backgroundColor: `rgba(${rgb},0.12)` }}>
              <tool.icon className={cn("w-4 h-4", config.colorClass)} />
            </div>
            <span className="text-white font-bold text-sm">{tool.title}</span>
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mr-auto"
              style={{ color: `rgb(${rgb})`, backgroundColor: `rgba(${rgb},0.1)` }}>
              <Zap className="w-3 h-3" /> {tool.credits} كريديت
            </span>
          </div>

          {/* Person image */}
          <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden p-6">
            <AnimatePresence mode="wait">

              {!personPreview && (
                <motion.div key="upload"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <input ref={personFileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickPerson(f); e.target.value = ""; }} />
                  <div onClick={() => personFileRef.current?.click()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) pickPerson(f); }}
                    onDragOver={e => e.preventDefault()}
                    className="flex flex-col items-center gap-5 cursor-pointer group">
                    <div className="w-64 h-80 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4
                      transition-all group-hover:scale-[1.01]"
                      style={{ borderColor: `rgba(${rgb},0.3)`, backgroundColor: "rgba(255,255,255,0.02)" }}>
                      <svg viewBox="0 0 80 120" className="w-16 h-24 opacity-20 fill-white">
                        <circle cx="40" cy="20" r="15" />
                        <path d="M15 50 Q15 35 40 35 Q65 35 65 50 L68 90 H52 L48 70 H32 L28 90 H12 Z" />
                        <path d="M12 90 L8 115 H22 L28 90" /><path d="M68 90 L72 115 H58 L52 90" />
                      </svg>
                      <div className="text-center px-4">
                        <p className="text-white font-bold mb-1">ارفع صورتك</p>
                        <p className="text-gray-500 text-sm">صورة كاملة للشخص</p>
                      </div>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                        style={{ borderColor: `rgba(${rgb},0.3)`, backgroundColor: `rgba(${rgb},0.07)` }}>
                        <Upload className="w-5 h-5" style={{ color: `rgb(${rgb})` }} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">PNG أو JPG · صورة الشخص واقفاً</p>
                  </div>
                </motion.div>
              )}

              {personPreview && phase === "idle" && (
                <motion.div key="person"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="relative h-full flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={personPreview} alt="الشخص"
                    className="max-w-full max-h-full object-contain rounded-2xl"
                    style={{ boxShadow: `0 0 40px rgba(${rgb},0.1)` }} />
                  <button onClick={() => personFileRef.current?.click()}
                    className="absolute top-3 right-3 text-xs px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm
                      border border-white/10 text-gray-400 hover:text-white transition-all flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3" /> تغيير
                  </button>
                  <input ref={personFileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickPerson(f); e.target.value = ""; }} />
                </motion.div>
              )}

              {phase === "processing" && (
                <motion.div key="processing"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="relative flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={personPreview} alt="" className="h-72 object-contain rounded-2xl blur-md opacity-25" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderTopColor: `rgb(${rgb})`, borderRightColor: `rgba(${rgb},0.3)` }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className={cn("w-6 h-6 animate-spin", config.colorClass)} />
                        </div>
                      </div>
                      <p className="text-white font-bold">جاري تطبيق الإطلالة...</p>
                    </div>
                  </div>
                  <div className="w-64 h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: `rgb(${rgb})` }}
                      initial={{ width: "0%" }} animate={{ width: "100%" }}
                      transition={{ duration: 3.5, ease: "linear" }} />
                  </div>
                </motion.div>
              )}

              {phase === "result" && (
                <motion.div key="result"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative h-full flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={personPreview} alt="النتيجة"
                    className="max-w-full max-h-full object-contain rounded-2xl"
                    style={{ filter: "hue-rotate(30deg) brightness(1.05) saturate(1.15)",
                      boxShadow: `0 0 50px rgba(${rgb},0.15)` }} />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white text-black font-bold hover:bg-gray-100 transition-colors">
                      <Download className="w-3 h-3" /> تحميل
                    </button>
                    <button onClick={() => setPhase("idle")}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-gray-300 hover:text-white transition-all">
                      <RotateCcw className="w-3 h-3" /> مجدداً
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ── Bottom Generate Bar ── */}
          <div className="shrink-0 px-6 py-3.5 border-t border-white/5 bg-black/40 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3">

              {/* Mini previews of selected items */}
              {totalSelected > 0 && (
                <div className="flex items-center gap-1.5">
                  {activeOutfit ? (
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2"
                      style={{ borderColor: `rgb(${rgb})` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={activeOutfit.img} alt={activeOutfit.nameAr} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    selectedItems.slice(0, 5).map(item => (
                      <div key={item.id} className="relative w-10 h-10 rounded-xl overflow-hidden border-2 group"
                        style={{ borderColor: `rgb(${rgb})` }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.img} alt={item.nameAr} className="w-full h-full object-cover" />
                        <button onClick={() => toggleItem(item, item.categoryId)}
                          className="absolute inset-0 bg-red-500/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ))
                  )}
                  {selectedItems.length > 5 && (
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xs text-gray-400 font-bold">
                      +{selectedItems.length - 5}
                    </div>
                  )}
                </div>
              )}

              {/* Gen count picker */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                {GEN_COUNTS.map(n => (
                  <button key={n} onClick={() => setGenCount(n)}
                    className={cn("w-8 h-7 rounded-lg text-sm font-bold transition-all",
                      genCount === n ? "text-black" : "text-gray-400 hover:text-gray-200")}
                    style={genCount === n ? { backgroundColor: `rgb(${rgb})` } : {}}>
                    {n}
                  </button>
                ))}
              </div>

              {/* Generate */}
              <button
                onClick={() => { if (!canGenerate) return; setPhase("processing"); setTimeout(() => setPhase("result"), 3500); }}
                disabled={!canGenerate}
                className={cn(
                  "h-11 px-7 rounded-2xl font-bold text-base flex items-center gap-2.5 transition-all duration-300",
                  canGenerate ? "text-white hover:scale-[1.02] hover:brightness-110 cursor-pointer" : "bg-white/5 text-gray-600 cursor-not-allowed"
                )}
                style={canGenerate ? {
                  backgroundColor: `rgba(${rgb},0.22)`,
                  border: `1px solid rgba(${rgb},0.5)`,
                  boxShadow: `0 0 24px rgba(${rgb},0.25)`,
                } : {}}
              >
                <Sparkles className="w-4 h-4" />
                توليد
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs font-black">
                  {genCount}
                </span>
              </button>
            </div>
            {!personPreview && <p className="text-center text-xs text-gray-600 mt-1.5">ارفع صورتك أولاً</p>}
            {personPreview && totalSelected === 0 && <p className="text-center text-xs text-gray-600 mt-1.5">اختر طقماً أو قطع من القائمة</p>}
          </div>
        </main>

      </div>
    </div>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, onRemove, rgb }: { label: string; onRemove: () => void; rgb: string }) {
  return (
    <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/8 border border-white/10 text-gray-300">
      {label}
      <button onClick={onRemove} className="mr-0.5 text-gray-500 hover:text-white transition-colors">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
