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
  name: string;
  nameAr: string;
  gradient: string;
  emoji: string;
}

interface Category {
  id: string;
  label: string;
  items: ClothingItem[];
}

interface SelectedItem extends ClothingItem {
  categoryId: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const MALE_OUTFITS: ClothingItem[] = [
  { id: "urban-core",    name: "Urban Core",    nameAr: "Urban Core",    gradient: "from-zinc-900 to-zinc-700",    emoji: "🖤" },
  { id: "tokyo",         name: "Tokyo Morning", nameAr: "Tokyo Morning", gradient: "from-stone-800 to-stone-600",  emoji: "🌅" },
  { id: "silent-lux",   name: "Silent Luxury", nameAr: "Silent Luxury", gradient: "from-neutral-700 to-stone-500",emoji: "✨" },
  { id: "sad-boy",       name: "Sad Boy",       nameAr: "Sad Boy",       gradient: "from-slate-900 to-slate-700",  emoji: "🌧" },
  { id: "quiet-lux",    name: "Quiet Luxury",  nameAr: "Quiet Luxury",  gradient: "from-amber-900 to-yellow-700", emoji: "🍂" },
  { id: "post-goth",    name: "Post-Goth",     nameAr: "Post-Goth",     gradient: "from-purple-950 to-purple-800",emoji: "🕷" },
  { id: "performative", name: "Performative",  nameAr: "Performative",  gradient: "from-red-900 to-orange-700",   emoji: "🎭" },
  { id: "minimalist",   name: "Minimalist",    nameAr: "مينيمال",       gradient: "from-gray-700 to-gray-500",    emoji: "⬜" },
  { id: "grunge",        name: "Grunge",        nameAr: "غرانج",         gradient: "from-green-900 to-lime-900",   emoji: "🤘" },
  { id: "downtown",      name: "Downtown",      nameAr: "Downtown",      gradient: "from-blue-950 to-blue-800",    emoji: "🌆" },
  { id: "loser-core",   name: "Loser Core",    nameAr: "Loser Core",    gradient: "from-teal-900 to-cyan-800",    emoji: "😮" },
  { id: "asian-ug",     name: "Asian UG",      nameAr: "Asian UG",      gradient: "from-rose-900 to-pink-800",    emoji: "🌸" },
];

const FEMALE_OUTFITS: ClothingItem[] = [
  { id: "f-modern",     name: "Modern Chic",   nameAr: "Modern Chic",   gradient: "from-pink-900 to-rose-700",    emoji: "💗" },
  { id: "f-boho",       name: "Boho",          nameAr: "بوهيمي",        gradient: "from-amber-800 to-orange-600", emoji: "🌻" },
  { id: "f-y2k",        name: "Y2K",           nameAr: "Y2K",           gradient: "from-violet-900 to-fuchsia-700",emoji: "💜" },
  { id: "f-minimal",    name: "Minimal",       nameAr: "مينيمال",       gradient: "from-slate-700 to-gray-500",   emoji: "🤍" },
  { id: "f-romantic",   name: "Romantic",      nameAr: "رومانسي",       gradient: "from-red-800 to-pink-600",     emoji: "🌹" },
  { id: "f-street",     name: "Street Style",  nameAr: "Street Style",  gradient: "from-indigo-900 to-blue-700",  emoji: "🏙" },
  { id: "f-power",      name: "Power Suit",    nameAr: "Power Suit",    gradient: "from-stone-800 to-stone-600",  emoji: "💼" },
  { id: "f-athleisure", name: "Athleisure",    nameAr: "رياضي",         gradient: "from-cyan-900 to-teal-700",    emoji: "🏃" },
  { id: "f-evening",    name: "Evening",       nameAr: "سهرة",          gradient: "from-purple-900 to-indigo-700",emoji: "🌙" },
  { id: "f-casual",     name: "Casual",        nameAr: "كاجوال",        gradient: "from-green-800 to-emerald-600",emoji: "😊" },
];

const CATEGORIES: Category[] = [
  {
    id: "outerwear", label: "جاكيت وملابس خارجية",
    items: [
      { id: "ow-denim",   name: "Denim Jacket",   nameAr: "جاكيت جينز",    gradient: "from-blue-800 to-blue-600",    emoji: "🧥" },
      { id: "ow-leather", name: "Leather Jacket", nameAr: "جاكيت جلد",     gradient: "from-stone-900 to-stone-700",  emoji: "🖤" },
      { id: "ow-bomber",  name: "Bomber",         nameAr: "بومبر",          gradient: "from-olive-800 to-green-700",  emoji: "🫡" },
      { id: "ow-blazer",  name: "Blazer",         nameAr: "بليزر",          gradient: "from-gray-800 to-gray-600",    emoji: "🎩" },
      { id: "ow-hoodie",  name: "Hoodie",         nameAr: "هودي",           gradient: "from-neutral-800 to-gray-600", emoji: "👆" },
      { id: "ow-trench",  name: "Trench Coat",    nameAr: "تريتش كوت",     gradient: "from-amber-900 to-yellow-700", emoji: "🌧" },
    ],
  },
  {
    id: "tops", label: "توبات وقمصان",
    items: [
      { id: "t-white",  name: "White Tee",   nameAr: "تي شيرت أبيض",  gradient: "from-gray-200 to-gray-100",    emoji: "👕" },
      { id: "t-black",  name: "Black Tee",   nameAr: "تي شيرت أسود",  gradient: "from-zinc-900 to-zinc-700",    emoji: "🖤" },
      { id: "t-stripe", name: "Striped",     nameAr: "مخطط",           gradient: "from-blue-900 to-white",       emoji: "〰" },
      { id: "t-shirt",  name: "Shirt",       nameAr: "قميص",           gradient: "from-sky-800 to-sky-600",      emoji: "👔" },
      { id: "t-polo",   name: "Polo",        nameAr: "بولو",           gradient: "from-emerald-800 to-teal-600", emoji: "🎾" },
      { id: "t-sweat",  name: "Sweatshirt",  nameAr: "سويت شيرت",     gradient: "from-purple-900 to-violet-700",emoji: "🌀" },
    ],
  },
  {
    id: "bottoms", label: "بناطيل وتنانير",
    items: [
      { id: "b-black",  name: "Black Pants",  nameAr: "بنطلون أسود",   gradient: "from-zinc-950 to-zinc-800",    emoji: "🖤" },
      { id: "b-jeans",  name: "Blue Jeans",   nameAr: "جينز أزرق",     gradient: "from-blue-900 to-blue-600",    emoji: "👖" },
      { id: "b-cargo",  name: "Cargo",        nameAr: "كارجو",          gradient: "from-olive-900 to-green-800",  emoji: "🎒" },
      { id: "b-shorts", name: "Shorts",       nameAr: "شورت",           gradient: "from-stone-800 to-stone-600",  emoji: "🩳" },
      { id: "b-skirt",  name: "Mini Skirt",   nameAr: "تنورة قصيرة",   gradient: "from-pink-900 to-rose-700",    emoji: "💃" },
      { id: "b-wide",   name: "Wide Leg",     nameAr: "واسع",           gradient: "from-gray-800 to-gray-600",    emoji: "🌊" },
    ],
  },
  {
    id: "shoes", label: "أحذية",
    items: [
      { id: "s-sneak",  name: "Sneakers",    nameAr: "سنيكرز",         gradient: "from-white to-gray-200",       emoji: "👟" },
      { id: "s-boot",   name: "Boots",       nameAr: "بوت",            gradient: "from-stone-900 to-stone-700",  emoji: "🥾" },
      { id: "s-loafer", name: "Loafers",     nameAr: "لوفر",           gradient: "from-amber-900 to-brown-700",  emoji: "👞" },
      { id: "s-heel",   name: "Heels",       nameAr: "كعب عالي",       gradient: "from-red-900 to-rose-700",     emoji: "👠" },
      { id: "s-converse",name:"Converse",    nameAr: "كونفرس",         gradient: "from-red-800 to-white",        emoji: "⭐" },
      { id: "s-sandal", name: "Sandals",     nameAr: "صنادل",          gradient: "from-yellow-800 to-orange-600",emoji: "🌞" },
    ],
  },
  {
    id: "accessories", label: "إكسسوارات",
    items: [
      { id: "a-bag",    name: "Bag",         nameAr: "شنطة",           gradient: "from-brown-900 to-stone-700",  emoji: "👜" },
      { id: "a-hat",    name: "Hat",         nameAr: "قبعة",           gradient: "from-zinc-800 to-gray-600",    emoji: "🧢" },
      { id: "a-watch",  name: "Watch",       nameAr: "ساعة",           gradient: "from-yellow-700 to-amber-500", emoji: "⌚" },
      { id: "a-belt",   name: "Belt",        nameAr: "حزام",           gradient: "from-stone-900 to-amber-800",  emoji: "🔗" },
      { id: "a-scarf",  name: "Scarf",       nameAr: "إيشارب",         gradient: "from-red-900 to-rose-600",     emoji: "🧣" },
      { id: "a-glasses",name: "Sunglasses",  nameAr: "نظارة",          gradient: "from-gray-950 to-gray-700",    emoji: "🕶" },
    ],
  },
];

const GEN_COUNTS = [1, 2, 4];

// ── Clothing item card ────────────────────────────────────────────────────────

function ItemCard({
  item, isSelected, onToggle, rgb, size = "md",
}: {
  item: ClothingItem;
  isSelected: boolean;
  onToggle: () => void;
  rgb: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer flex-shrink-0",
        "group hover:scale-[1.03]",
        size === "sm" ? "w-10 h-10" : "aspect-[3/4] w-full"
      )}
      style={{
        borderColor: isSelected ? `rgb(${rgb})` : "transparent",
        boxShadow: isSelected ? `0 0 12px rgba(${rgb},0.4)` : undefined,
      }}
    >
      {/* Gradient background (placeholder for actual clothing image) */}
      <div className={cn("absolute inset-0 bg-gradient-to-b", item.gradient, "opacity-80")} />
      <div className="absolute inset-0 flex items-center justify-center text-2xl"
        style={{ fontSize: size === "sm" ? 14 : 22 }}>
        {item.emoji}
      </div>

      {/* Name label at bottom */}
      {size === "md" && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-4">
          <p className="text-white text-[9px] font-semibold leading-tight text-center truncate">{item.nameAr}</p>
        </div>
      )}

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `rgb(${rgb})` }}>
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/8 transition-colors" />
    </button>
  );
}

// ── Accordion section ─────────────────────────────────────────────────────────

function AccordionSection({
  category, selectedItems, onToggleItem, rgb,
}: {
  category: Category;
  selectedItems: SelectedItem[];
  onToggleItem: (item: ClothingItem, categoryId: string) => void;
  rgb: string;
}) {
  const [open, setOpen] = useState(true);
  const selectedCount = selectedItems.filter(s => s.categoryId === category.id).length;

  return (
    <div className="border-t border-white/8">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-3 hover:bg-white/4 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">{category.label}</span>
          {selectedCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `rgba(${rgb},0.2)`, color: `rgb(${rgb})` }}>
              {selectedCount}
            </span>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
              {/* Upload custom item */}
              <button className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-1 hover:border-white/30 hover:bg-white/5 transition-all">
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

export function FashionDesignerWorkspace({ tool, config }: { tool: Tool; config: (typeof STUDIO_CATEGORIES)[ToolCategory] }) {
  const router = useRouter();
  const rgb    = config.shadowColor;

  const [phase,         setPhase]         = useState<Phase>("idle");
  const [gender,        setGender]        = useState<Gender>("male");
  const [personPreview, setPersonPreview] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedOutfit,setSelectedOutfit]= useState<string | null>(null);
  const [genCount,      setGenCount]      = useState(2);
  const [showSelected,  setShowSelected]  = useState(false);

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
      if (exists) return prev.filter(s => s.id !== item.id);
      return [...prev, { ...item, categoryId }];
    });
  }, []);

  const selectOutfit = useCallback((outfit: ClothingItem) => {
    if (selectedOutfit === outfit.id) {
      setSelectedOutfit(null);
    } else {
      setSelectedOutfit(outfit.id);
      setSelectedItems([]);
    }
  }, [selectedOutfit]);

  const reset = () => {
    setSelectedItems([]);
    setSelectedOutfit(null);
  };

  const canGenerate = personPreview && (selectedOutfit || selectedItems.length > 0);
  const outfits = gender === "male" ? MALE_OUTFITS : FEMALE_OUTFITS;
  const totalSelected = selectedOutfit ? 1 : selectedItems.length;

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-16 md:pt-20">

        {/* ── MAIN LEFT AREA ───────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#060608] relative">

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

          {/* Person image area */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
            <AnimatePresence mode="wait">

              {/* No person uploaded */}
              {!personPreview && phase === "idle" && (
                <motion.div key="upload-person"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <input ref={personFileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickPerson(f); e.target.value = ""; }} />
                  <div
                    onClick={() => personFileRef.current?.click()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) pickPerson(f); }}
                    onDragOver={e => e.preventDefault()}
                    className="flex flex-col items-center gap-5 cursor-pointer group"
                  >
                    <div className="relative w-64 h-80 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all group-hover:scale-[1.01]"
                      style={{ borderColor: `rgba(${rgb},0.3)`, backgroundColor: "rgba(255,255,255,0.02)" }}>
                      {/* Silhouette */}
                      <svg viewBox="0 0 80 120" className="w-16 h-24 opacity-20 fill-white">
                        <circle cx="40" cy="20" r="15" />
                        <path d="M15 50 Q15 35 40 35 Q65 35 65 50 L68 90 H52 L48 70 H32 L28 90 H12 Z" />
                        <path d="M12 90 L8 115 H22 L28 90" />
                        <path d="M68 90 L72 115 H58 L52 90" />
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
                    <p className="text-xs text-gray-600">PNG أو JPG · صورة كاملة للشخص واقفاً</p>
                  </div>
                </motion.div>
              )}

              {/* Person uploaded — show photo */}
              {personPreview && phase === "idle" && (
                <motion.div key="person-photo"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative h-full flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={personPreview} alt="الشخص"
                    className="max-w-full max-h-full object-contain rounded-2xl"
                    style={{ maxHeight: "calc(100vh - 280px)" }} />
                  {/* Change photo button */}
                  <button
                    onClick={() => personFileRef.current?.click()}
                    className="absolute top-3 right-3 text-xs px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white hover:bg-black/80 transition-all flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3" /> تغيير الصورة
                  </button>
                  <input ref={personFileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickPerson(f); e.target.value = ""; }} />
                </motion.div>
              )}

              {/* Processing */}
              {phase === "processing" && (
                <motion.div key="processing"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="relative">
                    {personPreview && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={personPreview} alt="" className="h-72 object-contain rounded-2xl blur-sm opacity-30" />
                    )}
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

              {/* Result */}
              {phase === "result" && (
                <motion.div key="result"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative h-full flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={personPreview} alt="النتيجة"
                    className="max-w-full max-h-full object-contain rounded-2xl"
                    style={{
                      maxHeight: "calc(100vh - 280px)",
                      filter: "hue-rotate(30deg) brightness(1.05) saturate(1.15)",
                    }} />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white text-black font-bold hover:bg-gray-100 transition-colors">
                      <Download className="w-3 h-3" /> تحميل
                    </button>
                    <button onClick={() => setPhase("idle")}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-gray-300 hover:text-white hover:bg-black/80 transition-all">
                      <RotateCcw className="w-3 h-3" /> مجدداً
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ── BOTTOM GENERATE BAR ──────────────────────────────────────────── */}
          <div className="shrink-0 px-6 py-4 border-t border-white/5 bg-black/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 justify-center">

              {/* Selected items mini previews */}
              {totalSelected > 0 && (
                <div className="flex items-center gap-1.5">
                  {selectedOutfit ? (
                    <div className={cn("w-10 h-10 rounded-xl border-2 overflow-hidden bg-gradient-to-b relative",
                      outfits.find(o => o.id === selectedOutfit)?.gradient)}
                      style={{ borderColor: `rgb(${rgb})` }}>
                      <span className="absolute inset-0 flex items-center justify-center text-lg">
                        {outfits.find(o => o.id === selectedOutfit)?.emoji}
                      </span>
                    </div>
                  ) : (
                    selectedItems.slice(0, 5).map(item => (
                      <div key={item.id}
                        className={cn("w-10 h-10 rounded-xl border-2 overflow-hidden bg-gradient-to-b relative", item.gradient)}
                        style={{ borderColor: `rgb(${rgb})` }}>
                        <span className="absolute inset-0 flex items-center justify-center text-base">{item.emoji}</span>
                        <button onClick={() => toggleItem(item, item.categoryId)}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <X className="w-2.5 h-2.5 text-white" />
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

              {/* Generate button */}
              <button
                onClick={() => {
                  if (!canGenerate) return;
                  setPhase("processing");
                  setTimeout(() => setPhase("result"), 3500);
                }}
                disabled={!canGenerate}
                className={cn(
                  "h-11 px-7 rounded-2xl font-bold text-base flex items-center gap-2.5 transition-all duration-300",
                  canGenerate
                    ? "text-white hover:scale-[1.02] hover:brightness-110 cursor-pointer"
                    : "bg-white/5 text-gray-600 cursor-not-allowed"
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
            {!personPreview && (
              <p className="text-center text-xs text-gray-600 mt-2">ارفع صورتك أولاً ثم اختر إطلالتك</p>
            )}
            {personPreview && totalSelected === 0 && (
              <p className="text-center text-xs text-gray-600 mt-2">اختر طقماً أو قطع ملابس من القائمة</p>
            )}
          </div>
        </main>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────────────── */}
        <aside className="w-[300px] shrink-0 border-r border-white/5 bg-black/50 backdrop-blur-3xl flex flex-col overflow-hidden">

          {/* Gender toggle + Reset */}
          <div className="shrink-0 px-3 pt-4 pb-3 flex items-center justify-between border-b border-white/5">
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
                "text-xs px-3 py-1.5 rounded-xl border transition-all",
                totalSelected > 0
                  ? "text-gray-400 border-white/10 hover:text-white hover:bg-white/5"
                  : "text-gray-700 border-white/5 cursor-not-allowed"
              )}>
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Selected items pill bar */}
          <AnimatePresence>
            {totalSelected > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-white/5"
              >
                <button
                  onClick={() => setShowSelected(s => !s)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/4 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-300">العناصر المختارة</span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: `rgb(${rgb})` }}>
                      {totalSelected}
                    </span>
                  </div>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-gray-500 transition-transform", showSelected && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {showSelected && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      className="overflow-hidden px-3 pb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {selectedOutfit && (
                          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/8 border border-white/10 text-gray-300">
                            {outfits.find(o => o.id === selectedOutfit)?.emoji} {outfits.find(o => o.id === selectedOutfit)?.nameAr}
                            <button onClick={reset} className="mr-1 text-gray-500 hover:text-white">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {selectedItems.map(item => (
                          <div key={item.id}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/8 border border-white/10 text-gray-300">
                            {item.emoji} {item.nameAr}
                            <button onClick={() => toggleItem(item, item.categoryId)} className="mr-1 text-gray-500 hover:text-white">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrollable categories */}
          <div className="flex-1 overflow-y-auto hide-scroll">

            {/* Outfit presets section */}
            <div className="border-b border-white/8">
              <div className="flex items-center justify-between px-3 py-3">
                <span className="text-sm font-medium text-gray-200">طقم كامل</span>
                {selectedOutfit && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `rgba(${rgb},0.2)`, color: `rgb(${rgb})` }}>1</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
                {/* Upload custom outfit */}
                <button className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-1 hover:border-white/30 hover:bg-white/5 transition-all">
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

            {/* Individual category accordions */}
            {CATEGORIES.map(cat => (
              <AccordionSection key={cat.id} category={cat}
                selectedItems={selectedItems}
                onToggleItem={toggleItem}
                rgb={rgb} />
            ))}

          </div>
        </aside>

      </div>
    </div>
  );
}
