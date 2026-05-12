"use client";

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Sparkles, Loader2, X, ChevronDown,
  Download, Maximize2, Package, User, ImagePlus, Zap,
  Zap as HookIcon, MapPin, Smartphone, Monitor, AppWindow,
  Library, Save, Film, Apple, BookmarkPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  MARKETING_FORMATS, MARKETING_HOOKS, MARKETING_SETTINGS, MARKETING_AVATARS,
  MARKETING_RATIOS, MARKETING_RESOLUTIONS, MARKETING_DURATIONS, MARKETING_DEVICE_FRAMES,
  MARKETING_DEFAULTS, resolveMarketingEndpoint, computeMarketingCost, composeMarketingPrompt,
  getFormatsForVariant, getDefaultFormatId, formatSupportsHookAndSetting,
  type MarketingVariant, type MarketingFormat,
  type MarketingHookCategory, type MarketingSettingCategory,
  type MarketingDeviceFrame,
} from "@/lib/data/marketing";
import { uploadFile } from "@/lib/muapi";
import { runMuapiTool } from "@/lib/run-tool";
import { EnhancePromptButton } from "@/components/studio-shared/EnhancePromptButton";
import {
  AdvancedSettingsModal, AdvancedSettingsChip, ADVANCED_DEFAULTS,
  type AdvancedSettings,
} from "@/components/studio-shared/AdvancedSettingsModal";

const PERSIST_KEY    = "yilow_marketing_studio_v2";
const HISTORY_LIMIT  = 30;

interface MarketingAd {
  id:           string;
  url:          string;
  prompt:       string;          // composed prompt actually sent
  userPrompt:   string;          // raw text the user typed
  variant:      MarketingVariant;
  format:       string;          // format id
  hookId?:      string;
  settingId?:   string;
  ratio:        string;
  resolution:   string;
  duration:     number;
  deviceFrame?: MarketingDeviceFrame;
  timestamp:    number;
}

interface MarketingSavedProduct {
  id:           string;
  name:         string;
  description?: string;
  url?:         string;
  imageUrl:     string;
  screenshots:  string[];
  source:       string;
  category?:    string;
  createdAt:    string;
}

interface MarketingAdReference {
  id:        string;
  name:      string;
  mediaUrl:  string;
  mediaType: "video" | "image";
  thumbnail?: string;
  source:    string;
  createdAt: string;
}

interface MarketingStudioProps {
  variant?: MarketingVariant;     // controlled mode (e.g. /marketing/app)
}

export function MarketingStudio({ variant: variantProp }: MarketingStudioProps = {}) {
  // ── variant: controlled by route (App), otherwise toggleable in the page header
  const [variant, setVariant] = useState<MarketingVariant>(variantProp ?? "product");
  useEffect(() => { if (variantProp) setVariant(variantProp); }, [variantProp]);

  // ── selections ────────────────────────────────────────────────────
  const [prompt,           setPrompt]           = useState("");
  const [formatId,         setFormatId]         = useState<string>(getDefaultFormatId(variant));
  const [hookId,           setHookId]           = useState<string | null>(null);
  const [settingId,        setSettingId]        = useState<string | null>(null);
  const [ratio,            setRatio]            = useState<string>(MARKETING_DEFAULTS.ratio);
  const [resolution,       setResolution]       = useState<string>(MARKETING_DEFAULTS.resolution);
  const [duration,         setDuration]         = useState<number>(MARKETING_DEFAULTS.duration);
  const [deviceFrame,      setDeviceFrame]      = useState<MarketingDeviceFrame>(MARKETING_DEFAULTS.deviceFrame);
  const [productImage,     setProductImage]     = useState<string | null>(null);
  const [avatarImage,      setAvatarImage]      = useState<string | null>(null);
  const [extraImages,      setExtraImages]      = useState<string[]>([]);

  const [isUploading,      setIsUploading]      = useState<"product" | "avatar" | "extras" | null>(null);
  const [isGenerating,     setIsGenerating]     = useState(false);
  const [progress,         setProgress]         = useState("");
  const [history,          setHistory]          = useState<MarketingAd[]>([]);
  const [openMenu,         setOpenMenu]         = useState<
    null | "format" | "hook" | "setting" | "avatar" | "ratio" | "res" | "dur" | "device"
  >(null);
  const [fullscreen,       setFullscreen]       = useState<string | null>(null);
  const [advanced,         setAdvanced]         = useState<AdvancedSettings>(ADVANCED_DEFAULTS);
  const [advancedOpen,     setAdvancedOpen]     = useState(false);
  // Click-to-Ad URL flow — paste a product URL and we auto-extract the
  // hero image + description. Mirrors the reference platform's
  // `feature: "click_to_ad"` shortcut. urlFetching shows a tiny spinner.
  const [productUrl,       setProductUrl]       = useState<string>("");
  const [urlFetching,      setUrlFetching]      = useState<boolean>(false);

  // Saved Products + Ad References libraries.
  const [productLibraryOpen, setProductLibraryOpen] = useState(false);
  const [adRefsOpen,         setAdRefsOpen]         = useState(false);
  const [savedProducts,      setSavedProducts]      = useState<MarketingSavedProduct[]>([]);
  const [savedAdRefs,        setSavedAdRefs]        = useState<MarketingAdReference[]>([]);

  const productInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef  = useRef<HTMLInputElement>(null);
  const extrasInputRef  = useRef<HTMLInputElement>(null);

  // Hydrate saved libraries on mount.
  useEffect(() => {
    fetch("/api/marketing/products")
      .then((r) => r.json())
      .then((d) => setSavedProducts(d.products ?? []))
      .catch(() => {});
    fetch("/api/marketing/ad-references")
      .then((r) => r.json())
      .then((d) => setSavedAdRefs(d.references ?? []))
      .catch(() => {});
  }, []);

  async function saveCurrentProduct() {
    if (!productImage) {
      toast.error("ارفع صورة المنتج أو اعمل Click-to-Ad الأول");
      return;
    }
    const name = window.prompt("اسم وصفي للمنتج") ?? "";
    if (!name.trim()) return;
    try {
      const r = await fetch("/api/marketing/products", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        name.trim(),
          imageUrl:    productImage,
          url:         productUrl || undefined,
          description: prompt || undefined,
          source:      productUrl ? "url-fetch" : "manual",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "فشل الحفظ");
      setSavedProducts((p) => [d.product, ...p]);
      toast.success("اتحفظ في مكتبتك ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الحفظ");
    }
  }

  function loadSavedProduct(p: MarketingSavedProduct) {
    setProductImage(p.imageUrl);
    if (p.url)  setProductUrl(p.url);
    if (p.description && !prompt.trim()) setPrompt(p.description);
    setProductLibraryOpen(false);
    toast.success(`اتحمّل: ${p.name}`);
  }

  async function importAppStoreUrl() {
    const url = window.prompt("الصق رابط من apps.apple.com");
    if (!url) return;
    try {
      const r = await fetch("/api/marketing/products/import-app-store", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "فشل استيراد التطبيق");
      const p = d.product as MarketingSavedProduct;
      setProductImage(p.imageUrl);
      if (p.url) setProductUrl(p.url);
      if (p.description) setPrompt((cur) => cur || p.description!);
      toast.success(`اتحمّل: ${p.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الاستيراد");
    }
  }

  function pickAdReference(ref: MarketingAdReference) {
    // Drop it into the extra-images strip so the executor passes it
    // along as inspiration. The MuAPI generators all accept extra
    // image URLs as references.
    if (extraImages.includes(ref.mediaUrl)) {
      toast("المرجع موجود بالفعل في الإعلان");
    } else {
      setExtraImages((x) => [...x, ref.mediaUrl]);
      toast.success(`أُضيف كمرجع: ${ref.name}`);
    }
    setAdRefsOpen(false);
  }

  async function saveCurrentAsAdReference() {
    if (history.length === 0) {
      toast.error("اعمل إعلان واحد على الأقل عشان تحفظه كمرجع");
      return;
    }
    const last = history[0]!;
    const name = window.prompt("اسم وصفي للمرجع") ?? "";
    if (!name.trim()) return;
    try {
      const r = await fetch("/api/marketing/ad-references", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         name.trim(),
          mediaUrl:     last.url,
          mediaType:    last.url.match(/\.(mp4|webm|mov)(\?|$)/i) ? "video" : "image",
          source:       "previous-job",
          generationId: last.id,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "فشل الحفظ");
      setSavedAdRefs((p) => [d.reference, ...p]);
      toast.success("اتحفظ كمرجع ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الحفظ");
    }
  }

  // ── on variant change, re-pick a valid default format ─────────────
  useEffect(() => {
    const formatsForVariant = getFormatsForVariant(variant);
    if (!formatsForVariant.find((f) => f.id === formatId)) {
      setFormatId(getDefaultFormatId(variant));
    }
  }, [variant, formatId]);

  // ── enforce hook/setting whitelist by format ──────────────────────
  // The reference platform restricts hook_id / setting_id to the UGC
  // family + product_review only. When the user picks a format that
  // doesn't support them (e.g. tv-spot-mini, wild_card), we silently
  // clear any active hook/setting selection so the payload stays valid.
  const formatAllowsHookAndSetting = formatSupportsHookAndSetting(formatId);
  useEffect(() => {
    if (!formatAllowsHookAndSetting) {
      if (hookId)    setHookId(null);
      if (settingId) setSettingId(null);
    }
  }, [formatAllowsHookAndSetting, hookId, settingId]);

  // ── persistence ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (typeof p.prompt === "string") setPrompt(p.prompt);
      if (p.variant === "product" || p.variant === "app") {
        // only honour stored variant when route doesn't control it
        if (!variantProp) setVariant(p.variant);
      }
      if (p.formatId)      setFormatId(p.formatId);
      if (p.hookId !== undefined)    setHookId(p.hookId);
      if (p.settingId !== undefined) setSettingId(p.settingId);
      if (p.ratio)         setRatio(p.ratio);
      if (p.resolution)    setResolution(p.resolution);
      if (typeof p.duration === "number") setDuration(p.duration);
      if (p.deviceFrame)   setDeviceFrame(p.deviceFrame);
      if (p.productImage)  setProductImage(p.productImage);
      if (p.avatarImage)   setAvatarImage(p.avatarImage);
      if (Array.isArray(p.extraImages)) setExtraImages(p.extraImages);
      if (Array.isArray(p.history))     setHistory(p.history);
      if (p.advanced)      setAdvanced(p.advanced);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify({
          prompt, variant, formatId, hookId, settingId,
          ratio, resolution, duration, deviceFrame,
          productImage, avatarImage, extraImages, history, advanced,
        }));
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [
    prompt, variant, formatId, hookId, settingId,
    ratio, resolution, duration, deviceFrame,
    productImage, avatarImage, extraImages, history, advanced,
  ]);

  // ── derived ───────────────────────────────────────────────────────
  const formatsForVariant = useMemo(() => getFormatsForVariant(variant), [variant]);
  const format  = useMemo(
    () => formatsForVariant.find((f) => f.id === formatId) ?? formatsForVariant[0]!,
    [formatsForVariant, formatId],
  );
  const hook    = useMemo(() => MARKETING_HOOKS.find((h) => h.id === hookId)    ?? undefined, [hookId]);
  const setting = useMemo(() => MARKETING_SETTINGS.find((s) => s.id === settingId) ?? undefined, [settingId]);
  const cost    = useMemo(
    () => computeMarketingCost({ duration, resolution, variant }),
    [duration, resolution, variant],
  );

  // ── upload handlers ───────────────────────────────────────────────
  const upload = async (file: File, slot: "product" | "avatar" | "extras") => {
    setIsUploading(slot);
    try {
      const { url } = await uploadFile(file);
      if (slot === "product")      setProductImage(url);
      else if (slot === "avatar")  setAvatarImage(url);
      else                         setExtraImages((x) => [...x, url].slice(0, 6));
      toast.success("تم الرفع");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الرفع");
    } finally {
      setIsUploading(null);
    }
  };

  // ── Click-to-Ad: fetch product metadata from a URL ────────────────
  // Calls /api/tools/marketing/fetch-url which scrapes Open Graph
  // metadata. We use the returned hero image as productImage (only if
  // the user hasn't uploaded one) and prepend the title + description
  // to the prompt for richer context.
  const onFetchUrl = async () => {
    const trimmed = productUrl.trim();
    if (!trimmed || urlFetching) return;
    let parsed: URL;
    try { parsed = new URL(trimmed); }
    catch { toast.error("الرابط غير صحيح"); return; }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      toast.error("لازم http(s)"); return;
    }
    setUrlFetching(true);
    try {
      const r = await fetch("/api/tools/marketing/fetch-url", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url: trimmed }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "فشل تحميل الرابط");
      // Use the OG image as productImage iff the user hasn't uploaded one.
      if (d.imageUrl && !productImage) setProductImage(d.imageUrl);
      // Build a one-line context snippet from title + description and
      // prepend it to the prompt — but only if the prompt doesn't
      // already contain it (avoid double-stamping on repeated fetches).
      const contextPieces = [d.title, d.description].filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0);
      const contextLine = contextPieces.join(" — ");
      if (contextLine && !prompt.includes(contextLine)) {
        setPrompt((p) => p.trim() ? `${contextLine}\n\n${p}` : contextLine);
      }
      toast.success(d.imageUrl ? "تم جلب صورة وبيانات المنتج" : "تم جلب البيانات");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل جلب الرابط");
    } finally {
      setUrlFetching(false);
    }
  };

  // ── generate ──────────────────────────────────────────────────────
  const canGenerate = prompt.trim().length > 0 || (productImage && format);

  const onGenerate = async () => {
    if (!canGenerate || isGenerating) return;

    // Step 1 — assemble the base prompt from user text + selected
    // hook / setting / format injection. This is what the user sees
    // in the chips.
    const composedPrompt = composeMarketingPrompt({
      userPrompt: prompt,
      format,
      hook,
      setting,
      deviceFrame: variant === "app" ? deviceFrame : undefined,
      variant,
    });

    // Step 2 — server-side LLM enhancement. The reference platform
    // does this transparently and exposes the result as the
    // `enhanced_prompt` field. We mirror it: try Claude (via
    // /api/ai/enhance-prompt with the marketing system prompt); if
    // the call fails, fall back to the composed prompt without
    // blocking the user from generating.
    setIsGenerating(true);
    setProgress("جاري تحسين الـprompt…");
    let enhancedPrompt = composedPrompt;
    try {
      const r = await fetch("/api/ai/enhance-prompt", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt: composedPrompt, variant: "marketing" }),
      });
      if (r.ok) {
        const d = await r.json();
        if (typeof d?.enhanced === "string" && d.enhanced.trim().length > 0) {
          enhancedPrompt = d.enhanced.trim();
        }
      }
    } catch { /* enhancement is best-effort — fall back silently */ }

    const endpoint   = resolveMarketingEndpoint(resolution);
    const imagesList = [productImage, avatarImage, ...extraImages].filter(Boolean) as string[];
    const payload: Record<string, unknown> = {
      prompt:       enhancedPrompt,
      aspect_ratio: ratio,
      duration,
      images_list:  imagesList,
      video_files:  [format.videoUrl],
    };
    if (advanced.negativePrompt.trim()) payload.negative_prompt = advanced.negativePrompt.trim();
    if (typeof advanced.seed === "number") payload.seed = advanced.seed;

    setProgress("جاري التوليد…");

    try {
      const { result } = await runMuapiTool({
        toolId:       "marketing-studio",
        endpoint,
        payload,
        inputsForDb:  {
          // Save both the composed prompt and the LLM-enhanced version
          // so we can debug differences later. enhanced_prompt mirrors
          // the reference platform's exposed payload field.
          prompt: composedPrompt, userPrompt: prompt,
          enhanced_prompt: enhancedPrompt,
          variant, formatId, hookId, settingId,
          ratio, resolution, duration,
          deviceFrame: variant === "app" ? deviceFrame : null,
          imagesList,
        },
        pollOptions: {
          onStatus: (s) => setProgress(statusToArabic(s)),
        },
      });
      const url = pickUrl(result);
      if (!url) throw new Error("لم يتم استلام الناتج");

      const ad: MarketingAd = {
        id:           crypto.randomUUID(),
        url,
        prompt:       composedPrompt,
        userPrompt:   prompt,
        variant,
        format:       formatId,
        hookId:       hookId ?? undefined,
        settingId:    settingId ?? undefined,
        ratio, resolution, duration,
        deviceFrame:  variant === "app" ? deviceFrame : undefined,
        timestamp:    Date.now(),
      };
      setHistory((h) => [ad, ...h].slice(0, HISTORY_LIMIT));
      toast.success("تم إنشاء الإعلان 🎯");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل التوليد");
    } finally {
      setIsGenerating(false);
      setProgress("");
    }
  };

  // ── render ────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-[calc(100vh-80px)] pb-44">
      {/* Hero */}
      <div className="relative pt-10 md:pt-16 pb-6 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-400/30 bg-accent-400/5 text-accent-400 text-xs font-black mb-5">
          <Megaphone className="w-3 h-3" />
          استوديو التسويق
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-5 leading-[1.5] md:leading-[1.4] max-w-3xl mx-auto">
          إعلانات احترافية <span className="text-accent-400">في دقائق</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          منتجك أو تطبيقك + شخصية + قوالب جاهزة (UGC، فتح صندوق، شرح، مراجعة) — والذكاء الاصطناعي يعمل الباقي.
        </p>

        {/* Variant segmented control (only when route doesn't lock it) */}
        {!variantProp && (
          <div className="mt-6 inline-flex items-center gap-1 p-1 rounded-2xl border border-white/10 bg-white/[0.03]">
            <VariantTab
              active={variant === "product"}
              onClick={() => setVariant("product")}
              icon={<Package className="w-3.5 h-3.5" />}
              label="منتج"
            />
            <VariantTab
              active={variant === "app"}
              onClick={() => setVariant("app")}
              icon={<AppWindow className="w-3.5 h-3.5" />}
              label="تطبيق"
            />
          </div>
        )}
      </div>

      {/* History gallery */}
      {history.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto px-4">
          {history.map((ad) => {
            const fmt = MARKETING_FORMATS.find((f) => f.id === ad.format);
            return (
              <motion.div
                key={ad.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative bento-card rounded-2xl overflow-hidden border border-white/10 group"
              >
                <div className="relative bg-black aspect-[9/16] sm:aspect-video">
                  <video
                    src={ad.url}
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setFullscreen(ad.url)}
                      className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80"
                      type="button"
                      aria-label="ملء الشاشة"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                    </button>
                    <a
                      href={ad.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center hover:bg-black/80"
                      aria-label="تنزيل"
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                    </a>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-accent-400/90 text-black">
                      {fmt?.englishName ?? ad.format}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-white font-bold line-clamp-2 mb-1">{ad.userPrompt || ad.prompt}</p>
                  <p className="text-[10px] text-gray-500">
                    {ad.ratio} · {ad.resolution} · {ad.duration}s
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <div className="w-24 h-24 rounded-full border-2 border-accent-400/30 bg-accent-400/5 flex items-center justify-center mb-6">
            <Megaphone className="w-12 h-12 text-accent-400" />
          </div>
          <p className="text-white text-lg font-bold mb-1">جاهز لأول إعلان؟</p>
          <p className="text-gray-500 text-sm max-w-xs">
            ارفع {variant === "app" ? "صور تطبيقك" : "منتجك"}، اختار قالب، اكتب وصفك، واضغط <span className="text-accent-400 font-bold">إنشاء</span>.
          </p>
        </div>
      )}

      {/* ── Bottom prompt bar ─────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-5 pointer-events-none" dir="rtl">
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <div className="bento-card rounded-3xl border border-white/10 p-3 md:p-4 backdrop-blur-2xl bg-black/60 shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
            {/* Extra image pills */}
            {extraImages.length > 0 && (
              <div className="flex gap-2 mb-2.5 px-1 overflow-x-auto no-scrollbar">
                {extraImages.map((src, i) => (
                  <div key={i} className="relative shrink-0 w-12 h-12 rounded-lg border border-white/10 overflow-hidden group/pill">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setExtraImages((x) => x.filter((_, j) => j !== i))}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover/pill:opacity-100 flex items-center justify-center"
                      aria-label="إزالة"
                      type="button"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Click-to-Ad: paste a product URL → auto-fill image + context.
                Mirrors the reference platform's `feature: "click_to_ad"`
                shortcut. The fetcher runs server-side and parses Open
                Graph metadata. Only shown for the Product variant — the
                App variant has its own product flow. */}
            {variant === "product" && (
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <input
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onFetchUrl(); } }}
                  placeholder="أو الصق رابط صفحة المنتج… (Click-to-Ad)"
                  className="flex-1 min-w-[200px] h-9 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-400/40 text-right"
                  dir="rtl"
                  inputMode="url"
                  disabled={urlFetching}
                />
                <button
                  onClick={onFetchUrl}
                  disabled={!productUrl.trim() || urlFetching}
                  type="button"
                  className={cn(
                    "h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0",
                    !productUrl.trim() || urlFetching
                      ? "bg-white/5 text-gray-600 cursor-not-allowed"
                      : "bg-accent-400/15 border border-accent-400/40 text-accent-400 hover:bg-accent-400/25",
                  )}
                  title="جلب صورة المنتج وبياناته من الرابط"
                >
                  {urlFetching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      جلب
                    </>
                  )}
                </button>
                <button
                  onClick={() => setProductLibraryOpen(true)}
                  type="button"
                  className="h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white shrink-0"
                  title="مكتبة المنتجات المحفوظة"
                >
                  <Library className="w-3.5 h-3.5" />
                  مكتبة ({savedProducts.length})
                </button>
                {productImage && (
                  <button
                    onClick={saveCurrentProduct}
                    type="button"
                    className="h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 shrink-0"
                    title="احفظ المنتج الحالي في مكتبتك"
                  >
                    <Save className="w-3.5 h-3.5" />
                    حفظ
                  </button>
                )}
              </div>
            )}
            {/* App-variant shortcut: import App Store metadata in one click. */}
            {variant === "app" && (
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <button
                  onClick={importAppStoreUrl}
                  type="button"
                  className="h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white"
                >
                  <Apple className="w-3.5 h-3.5" />
                  استورد من App Store
                </button>
                <button
                  onClick={() => setProductLibraryOpen(true)}
                  type="button"
                  className="h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white"
                >
                  <Library className="w-3.5 h-3.5" />
                  مكتبة ({savedProducts.length})
                </button>
              </div>
            )}
            {/* Ad-references shortcut row (shown for both variants). */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <button
                onClick={() => setAdRefsOpen(true)}
                type="button"
                className="h-8 px-2.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300"
                title="استخدم إعلان قديم أو مرفوع كمرجع للنوع/الإيقاع"
              >
                <Film className="w-3 h-3" />
                مراجع إعلانات ({savedAdRefs.length})
              </button>
              {history.length > 0 && (
                <button
                  onClick={saveCurrentAsAdReference}
                  type="button"
                  className="h-8 px-2.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] text-emerald-300"
                  title="احفظ آخر إعلان كمرجع للجلسات القادمة"
                >
                  <BookmarkPlus className="w-3 h-3" />
                  احفظ كمرجع
                </button>
              )}
            </div>

            <div className="flex items-start gap-2 mb-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  variant === "app"
                    ? "اوصف الإعلان… مثال: شخص يستعرض ميزات التطبيق بحماس في 5 ثواني"
                    : "اوصف الإعلان… مثال: امرأة تستخدم المنتج وتعرض فوائده في 3 ثواني"
                }
                rows={2}
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none px-1 text-right"
                style={{ maxHeight: 200 }}
                dir="rtl"
              />
              <EnhancePromptButton
                prompt={prompt}
                variant="marketing"
                onResult={setPrompt}
                disabled={isGenerating}
                compact
                className="shrink-0"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Upload slots */}
              <UploadSlot
                icon={variant === "app" ? AppWindow : Package}
                tip={variant === "app" ? "صورة التطبيق (شاشة)" : "صورة المنتج"}
                fileUrl={productImage}
                isLoading={isUploading === "product"}
                onClear={() => setProductImage(null)}
                onClick={() => productInputRef.current?.click()}
              />
              <input
                ref={productInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "product"); e.target.value = ""; }}
              />

              <UploadSlot
                icon={User}
                tip="صورة العارض/الشخصية"
                fileUrl={avatarImage}
                isLoading={isUploading === "avatar"}
                onClear={() => setAvatarImage(null)}
                onClick={() => avatarInputRef.current?.click()}
              />
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "avatar"); e.target.value = ""; }}
              />

              <UploadSlot
                icon={ImagePlus}
                tip={`صور مرجعية إضافية (${extraImages.length}/6)`}
                fileUrl={null}
                isLoading={isUploading === "extras"}
                onClear={null}
                onClick={() => extraImages.length < 6 && extrasInputRef.current?.click()}
                disabled={extraImages.length >= 6}
              />
              <input
                ref={extrasInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "extras"); e.target.value = ""; }}
              />

              {/* Format mega-dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === "format" ? null : "format")}
                  className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/[0.03] text-xs font-bold text-white flex items-center gap-2"
                  type="button"
                >
                  <span className="text-gray-500">قالب:</span>
                  {format.name}
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
                {openMenu === "format" && (
                  <FormatGalleryDropdown
                    formats={formatsForVariant}
                    selected={formatId}
                    onPick={(id) => { setFormatId(id); setOpenMenu(null); }}
                    onClose={() => setOpenMenu(null)}
                  />
                )}
              </div>

              {/* Hook picker — Product variant + format must support hooks.
                  When the chosen format doesn't allow hooks (tv-spot,
                  wild_card, virtual_try_on, product_showcase) we
                  visually disable the chip with an explanatory tooltip
                  so the user understands why it isn't clickable. */}
              {variant === "product" && (
                <div className="relative">
                  <button
                    onClick={() => formatAllowsHookAndSetting && setOpenMenu(openMenu === "hook" ? null : "hook")}
                    disabled={!formatAllowsHookAndSetting}
                    className={cn(
                      "h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-colors",
                      formatAllowsHookAndSetting
                        ? "border-white/10 hover:bg-white/[0.03] text-white"
                        : "border-white/[0.04] text-gray-600 opacity-50 cursor-not-allowed",
                    )}
                    type="button"
                    title={formatAllowsHookAndSetting
                      ? "اختر هوك (الـ3 ثواني الأولى)"
                      : "الهوك متاح فقط مع UGC / مراجعة منتج / فتح صندوق / تجربة UGC / شرح"}
                  >
                    <HookIcon className="w-3 h-3 text-accent-400" />
                    <span className="text-gray-500">هوك:</span>
                    {hook?.name ?? "بدون"}
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>
                  {openMenu === "hook" && formatAllowsHookAndSetting && (
                    <HookPickerDropdown
                      selected={hookId}
                      onPick={(id) => { setHookId(id); setOpenMenu(null); }}
                      onClose={() => setOpenMenu(null)}
                    />
                  )}
                </div>
              )}

              {/* Setting picker — same whitelist as the Hook picker */}
              {variant === "product" && (
                <div className="relative">
                  <button
                    onClick={() => formatAllowsHookAndSetting && setOpenMenu(openMenu === "setting" ? null : "setting")}
                    disabled={!formatAllowsHookAndSetting}
                    className={cn(
                      "h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-colors",
                      formatAllowsHookAndSetting
                        ? "border-white/10 hover:bg-white/[0.03] text-white"
                        : "border-white/[0.04] text-gray-600 opacity-50 cursor-not-allowed",
                    )}
                    type="button"
                    title={formatAllowsHookAndSetting
                      ? "اختر مكان السيناريو"
                      : "المكان متاح فقط مع UGC / مراجعة منتج / فتح صندوق / تجربة UGC / شرح"}
                  >
                    <MapPin className="w-3 h-3 text-accent-400" />
                    <span className="text-gray-500">مكان:</span>
                    {setting?.name ?? "بدون"}
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>
                  {openMenu === "setting" && formatAllowsHookAndSetting && (
                    <SettingPickerDropdown
                      selected={settingId}
                      onPick={(id) => { setSettingId(id); setOpenMenu(null); }}
                      onClose={() => setOpenMenu(null)}
                    />
                  )}
                </div>
              )}

              {/* Device frame — App variant only */}
              {variant === "app" && (
                <SimpleChip
                  label="جهاز"
                  value={deviceFrame}
                  options={MARKETING_DEVICE_FRAMES.map((d) => ({ value: d.id, label: d.label }))}
                  onChange={(v) => setDeviceFrame(v as MarketingDeviceFrame)}
                  icon={deviceFrame === "mobile" ? <Smartphone className="w-3 h-3 text-accent-400" /> : <Monitor className="w-3 h-3 text-accent-400" />}
                />
              )}

              {/* Avatar preset */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === "avatar" ? null : "avatar")}
                  className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/[0.03] text-xs font-bold text-white flex items-center gap-2"
                  type="button"
                >
                  <span className="text-gray-500">عارض:</span>
                  {MARKETING_AVATARS.find((a) => a.thumbnail === avatarImage)?.name ?? "اختر"}
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
                {openMenu === "avatar" && (
                  <AvatarGalleryDropdown
                    selected={avatarImage}
                    onPick={(url) => { setAvatarImage(url); setOpenMenu(null); }}
                    onClose={() => setOpenMenu(null)}
                  />
                )}
              </div>

              {/* Simple chips */}
              <SimpleChip
                label="نسبة"
                value={ratio}
                options={MARKETING_RATIOS.map((r) => ({ value: r.id, label: r.label }))}
                onChange={setRatio}
              />
              <SimpleChip
                label="جودة"
                value={resolution}
                options={MARKETING_RESOLUTIONS.map((r) => ({ value: r.id, label: r.label }))}
                onChange={setResolution}
              />
              <SimpleChip
                label="مدة"
                value={String(duration)}
                options={MARKETING_DURATIONS.map((d) => ({ value: String(d), label: `${d}s` }))}
                onChange={(v) => setDuration(Number(v))}
              />

              {/* Advanced settings (negative prompt + seed) */}
              <AdvancedSettingsChip value={advanced} onClick={() => setAdvancedOpen(true)} />

              <div className="flex-1" />

              {/* Generate button */}
              <button
                onClick={onGenerate}
                disabled={!canGenerate || isGenerating}
                className={cn(
                  "h-10 px-5 rounded-xl font-black text-sm flex items-center gap-2 transition-all whitespace-nowrap",
                  !canGenerate || isGenerating
                    ? "bg-white/5 text-gray-600 cursor-not-allowed"
                    : "bg-accent-400 text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_24px_rgba(254,228,64,0.35)]",
                )}
                type="button"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {progress || "جاري التوليد…"}</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    إنشاء
                    <span className="inline-flex items-center gap-0.5 text-[10px] opacity-75 px-1.5 py-0.5 rounded bg-black/20">
                      <Zap className="w-2.5 h-2.5" />{cost}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AdvancedSettingsModal
        open={advancedOpen}
        value={advanced}
        onChange={setAdvanced}
        onClose={() => setAdvancedOpen(false)}
        fields={["negativePrompt", "seed"]}
        suggestedNegativePrompt="blurry, low quality, watermark, text, distorted hands, deformed face"
      />

      {/* Fullscreen */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setFullscreen(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
              onClick={() => setFullscreen(null)}
              aria-label="إغلاق"
              type="button"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <video src={fullscreen} controls autoPlay loop className="max-w-full max-h-full rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Saved Products library modal ────────────────────────── */}
      <AnimatePresence>
        {productLibraryOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setProductLibraryOpen(false)}
          >
            <div
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-white">مكتبة المنتجات</h3>
                <button
                  onClick={() => setProductLibraryOpen(false)}
                  className="text-gray-500 hover:text-white"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {savedProducts.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-12">
                    لسة مفيش منتجات محفوظة — اعمل Click-to-Ad أو ارفع صورة، وبعدين اضغط &quot;حفظ&quot;.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {savedProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => loadSavedProduct(p)}
                        className="text-right rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.16] transition overflow-hidden"
                      >
                        <div className="aspect-square bg-black/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2">
                          <div className="text-xs font-medium truncate">{p.name}</div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {p.source === "app-store" ? "App Store" : p.source === "url-fetch" ? "Click-to-Ad" : "Manual"}
                            {p.category ? ` · ${p.category}` : ""}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Ad References modal ───────────────────────────────────── */}
      <AnimatePresence>
        {adRefsOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setAdRefsOpen(false)}
          >
            <div
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-white">مراجع الإعلانات</h3>
                <button
                  onClick={() => setAdRefsOpen(false)}
                  className="text-gray-500 hover:text-white"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {savedAdRefs.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-12">
                    لسة مفيش مراجع — اعمل إعلان وبعدين اضغط &quot;احفظ كمرجع&quot;.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {savedAdRefs.map((ref) => (
                      <button
                        key={ref.id}
                        onClick={() => pickAdReference(ref)}
                        className="text-right rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.16] transition overflow-hidden"
                      >
                        <div className="aspect-video bg-black/40">
                          {ref.mediaType === "video" ? (
                            <video
                              src={ref.mediaUrl}
                              muted loop playsInline
                              className="w-full h-full object-cover"
                              onMouseEnter={(e) => e.currentTarget.play()}
                              onMouseLeave={(e) => e.currentTarget.pause()}
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ref.thumbnail || ref.mediaUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-2">
                          <div className="text-xs font-medium truncate">{ref.name}</div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {ref.mediaType === "video" ? "فيديو" : "صورة"} · {ref.source === "previous-job" ? "إعلان سابق" : "رفع"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────

function VariantTab({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "h-9 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-all",
        active
          ? "bg-accent-400 text-black shadow-[0_0_24px_rgba(254,228,64,0.35)]"
          : "text-gray-300 hover:text-white hover:bg-white/5",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function UploadSlot({
  icon: Icon, tip, fileUrl, isLoading, onClick, onClear, disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tip: string;
  fileUrl: string | null;
  isLoading?: boolean;
  onClick: () => void;
  onClear: (() => void) | null;
  disabled?: boolean;
}) {
  if (fileUrl) {
    return (
      <div className="relative w-10 h-10 rounded-xl border border-accent-400/40 overflow-hidden group" title={tip}>
        <img src={fileUrl} alt="" className="w-full h-full object-cover" />
        {onClear && (
          <button
            onClick={onClear}
            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            aria-label="إزالة"
            type="button"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      title={tip}
      className={cn(
        "w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center transition-colors",
        disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5",
      )}
      type="button"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-accent-400" /> : <Icon className="w-4 h-4 text-gray-300" />}
    </button>
  );
}

/**
 * Renders into <body> via a portal so the dropdown isn't clipped by
 * the bottom bar's `backdrop-blur` / `rounded-3xl` stacking context.
 *
 * Returns false on the server (SSR), true after hydration on the client.
 * Uses `useSyncExternalStore` so the hook is lint-clean (no setState
 * inside a useEffect mount-flag pattern).
 */
const PORTAL_SUBSCRIBE = () => () => {};
const PORTAL_CLIENT_SNAP = () => true;
const PORTAL_SERVER_SNAP = () => false;

function usePortalReady() {
  return useSyncExternalStore(PORTAL_SUBSCRIBE, PORTAL_CLIENT_SNAP, PORTAL_SERVER_SNAP);
}

function FormatGalleryDropdown({
  formats, selected, onPick, onClose,
}: {
  formats: MarketingFormat[];
  selected: string;
  onPick:  (id: string) => void;
  onClose: () => void;
}) {
  const ready = usePortalReady();
  if (!ready) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[80]" onClick={onClose} aria-hidden />
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[90] w-[640px] max-w-[94vw] bg-bg-primary border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-3"
        style={{ bottom: 110 }}
      >
        <div className="flex items-center justify-between px-1 pb-2 mb-2 border-b border-white/5">
          <h4 className="text-sm font-black text-white">اختر قالب الإعلان</h4>
          <button
            onClick={onClose}
            className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors"
            type="button"
          >
            إغلاق
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1">
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => onPick(f.id)}
              className={cn(
                "text-right rounded-xl overflow-hidden border transition-all hover:scale-[1.02]",
                selected === f.id ? "border-accent-400/60 ring-1 ring-accent-400/40" : "border-white/10",
              )}
              type="button"
            >
              <div className="relative aspect-video bg-black">
                <video
                  src={f.videoUrl}
                  muted loop playsInline
                  onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                  onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                  className="w-full h-full object-cover"
                />
                {selected === f.id && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-accent-400 text-black">
                    مختار
                  </span>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-bold text-white">{f.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{f.englishName}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
}

function HookPickerDropdown({
  selected, onPick, onClose,
}: {
  selected: string | null;
  onPick:  (id: string | null) => void;
  onClose: () => void;
}) {
  const ready = usePortalReady();
  const [tab, setTab] = useState<"all" | MarketingHookCategory>("all");
  if (!ready) return null;

  const filtered = tab === "all"
    ? MARKETING_HOOKS
    : MARKETING_HOOKS.filter((h) => h.category === tab);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[80]" onClick={onClose} aria-hidden />
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[90] w-[640px] max-w-[94vw] bg-bg-primary border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-3"
        style={{ bottom: 110 }}
      >
        <div className="flex items-center justify-between px-1 pb-2 mb-2 border-b border-white/5">
          <div>
            <h4 className="text-sm font-black text-white">هوكس توقف الـ Scroll</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">افتتاحية تخطف الانتباه في أول ٣ ثواني</p>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors"
            type="button"
          >
            إغلاق
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-3 px-1">
          <HookTab active={tab === "all"}    onClick={() => setTab("all")}    label="الكل"  />
          <HookTab active={tab === "stunt"}  onClick={() => setTab("stunt")}  label="مثير"  />
          <HookTab active={tab === "subtle"} onClick={() => setTab("subtle")} label="هادئ" />
          <div className="flex-1" />
          {selected && (
            <button
              onClick={() => onPick(null)}
              className="text-[10px] font-bold text-gray-500 hover:text-white px-2 py-1 transition-colors"
              type="button"
            >
              مسح الاختيار
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[480px] overflow-y-auto pr-1">
          {filtered.map((h) => (
            <button
              key={h.id}
              onClick={() => onPick(h.id)}
              className={cn(
                "text-right rounded-xl overflow-hidden border transition-all hover:scale-[1.02]",
                selected === h.id ? "border-accent-400/60 ring-1 ring-accent-400/40" : "border-white/10",
              )}
              type="button"
            >
              <div className="relative aspect-[3/4] bg-black">
                <video
                  src={h.videoUrl}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                  onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                  className="w-full h-full object-cover"
                />
                {selected === h.id && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-accent-400 text-black">
                    مختار
                  </span>
                )}
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-black/60 text-white/80">
                  {h.category === "stunt" ? "مثير" : "هادئ"}
                </span>
              </div>
              <div className="p-2">
                <p className="text-xs font-bold text-white">{h.name}</p>
                <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{h.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
}

function HookTab({
  active, onClick, label,
}: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "h-7 px-3 rounded-lg text-[11px] font-bold transition-colors",
        active ? "bg-accent-400/15 text-accent-400" : "text-gray-400 hover:text-white hover:bg-white/5",
      )}
    >
      {label}
    </button>
  );
}

function SettingPickerDropdown({
  selected, onPick, onClose,
}: {
  selected: string | null;
  onPick:  (id: string | null) => void;
  onClose: () => void;
}) {
  const ready = usePortalReady();
  const [tab, setTab] = useState<"all" | MarketingSettingCategory>("all");
  if (!ready) return null;

  const filtered = tab === "all"
    ? MARKETING_SETTINGS
    : MARKETING_SETTINGS.filter((s) => s.category === tab);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[80]" onClick={onClose} aria-hidden />
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[90] w-[760px] max-w-[94vw] bg-bg-primary border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-3"
        style={{ bottom: 110 }}
      >
        <div className="flex items-center justify-between px-1 pb-2 mb-2 border-b border-white/5">
          <div>
            <h4 className="text-sm font-black text-white">أماكن تصنع المشهد</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">اختر بيئة الإعلان</p>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors"
            type="button"
          >
            إغلاق
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-3 px-1">
          <HookTab active={tab === "all"}         onClick={() => setTab("all")}         label="الكل"     />
          <HookTab active={tab === "realistic"}   onClick={() => setTab("realistic")}   label="واقعي"    />
          <HookTab active={tab === "unrealistic"} onClick={() => setTab("unrealistic")} label="غير واقعي" />
          <div className="flex-1" />
          {selected && (
            <button
              onClick={() => onPick(null)}
              className="text-[10px] font-bold text-gray-500 hover:text-white px-2 py-1 transition-colors"
              type="button"
            >
              مسح الاختيار
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[480px] overflow-y-auto pr-1">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => onPick(s.id)}
              className={cn(
                "text-right rounded-xl overflow-hidden border transition-all hover:scale-[1.02]",
                selected === s.id ? "border-accent-400/60 ring-1 ring-accent-400/40" : "border-white/10",
              )}
              type="button"
            >
              <div className="relative aspect-[3/4] bg-black">
                <video
                  src={s.videoUrl}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                  onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                  className="w-full h-full object-cover"
                />
                {selected === s.id && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-accent-400 text-black">
                    مختار
                  </span>
                )}
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-black/60 text-white/80">
                  {s.category === "realistic" ? "واقعي" : "غير واقعي"}
                </span>
              </div>
              <div className="p-2">
                <p className="text-xs font-bold text-white">{s.name}</p>
                <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
}

function AvatarGalleryDropdown({
  selected, onPick, onClose,
}: {
  selected: string | null;
  onPick:  (url: string) => void;
  onClose: () => void;
}) {
  const ready = usePortalReady();
  if (!ready) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[80]" onClick={onClose} aria-hidden />
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[90] w-[420px] max-w-[94vw] bg-bg-primary border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-3"
        style={{ bottom: 110 }}
      >
        <div className="flex items-center justify-between px-1 pb-2 mb-2 border-b border-white/5">
          <h4 className="text-sm font-black text-white">اختر العارض</h4>
          <button
            onClick={onClose}
            className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors"
            type="button"
          >
            إغلاق
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MARKETING_AVATARS.map((a) => {
            // Avatars without a thumbnail asset render a gradient-initial
            // fallback + a "قريباً" badge. They're shown so the picker
            // matches the full reference roster (38 entries) but tapping
            // them is a no-op until we drop in real images.
            const hasThumb = !!a.thumbnail;
            const isPicked = hasThumb && selected === a.thumbnail;
            const initial  = a.name.charAt(0).toUpperCase();
            const tint     = a.gender === "female"
              ? "from-pink-500/30 to-purple-500/20"
              : "from-blue-500/30 to-cyan-500/20";
            return (
              <button
                key={a.id}
                onClick={() => { if (hasThumb) onPick(a.thumbnail); }}
                disabled={!hasThumb}
                className={cn(
                  "rounded-xl overflow-hidden border transition-all relative",
                  hasThumb ? "hover:scale-[1.05]" : "opacity-60 cursor-not-allowed",
                  isPicked ? "border-accent-400/60 ring-1 ring-accent-400/40" : "border-white/10",
                )}
                type="button"
                title={hasThumb ? a.name : `${a.name} — صورة قريباً`}
              >
                {hasThumb ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={a.thumbnail} alt={a.name} className="w-full aspect-square object-cover" />
                ) : (
                  <div
                    className={cn(
                      "w-full aspect-square flex items-center justify-center bg-gradient-to-br text-white font-black text-2xl",
                      tint,
                    )}
                    aria-hidden
                  >
                    {initial}
                  </div>
                )}
                {!hasThumb && (
                  <span className="absolute top-1 right-1 px-1 py-0.5 rounded text-[8px] font-black bg-black/70 text-gray-300 border border-white/10">
                    قريباً
                  </span>
                )}
                <div className="px-2 py-1.5 text-center">
                  <p className="text-[10px] font-bold text-white">{a.name}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body,
  );
}

function SimpleChip({
  label, value, options, onChange, icon,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const active = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-10 px-3 rounded-xl border border-white/10 hover:bg-white/[0.03] text-xs font-bold text-white flex items-center gap-1.5"
        type="button"
      >
        {icon}
        <span className="text-gray-500">{label}:</span>
        {active?.label ?? value}
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute bottom-full mb-2 right-0 z-40 min-w-[180px] bg-bg-primary border border-white/10 rounded-xl shadow-2xl p-1 max-h-72 overflow-y-auto">
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={cn(
                  "w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                  o.value === value ? "bg-accent-400/15 text-accent-400" : "text-gray-300 hover:bg-white/5",
                )}
                type="button"
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
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

function pickUrl(r: { url?: string; urls?: string[]; outputs?: unknown }): string | null {
  if (typeof r.url === "string" && r.url) return r.url;
  if (Array.isArray(r.urls) && r.urls[0]) return r.urls[0];
  if (Array.isArray(r.outputs) && r.outputs.length) {
    const first = r.outputs[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first && "url" in first) return (first as { url: string }).url;
  }
  return null;
}
