// ════════════════════════════════════════════════════════════════
// Soul 2.0 — full data layer (mirrors the reference platform's Soul 2.0 page)
// ════════════════════════════════════════════════════════════════
// Three orthogonal axes that compose into a single image generation:
//
//   • Mood Board (style / aesthetic)        — one of 33 curated presets,
//                                              or a user-built moodboard
//                                              from ≥5 reference images.
//   • Color Signature / Soul HEX (palette)  — one of 6 curated palettes,
//                                              or auto-extracted from an
//                                              uploaded reference image.
//   • Soul ID (character identity)          — a saved character trained
//                                              on ≥20 photos of the user
//                                              or any subject.
//
// Plus utility settings (aspect ratio, quality, prompt-enhance toggle,
// 1–4 variations counter) that match the reference platform's bottom shoot-bar.
//
// The English `descriptor` for each preset is what gets concatenated
// into the muapi prompt — DON'T translate that field. The `name`
// (Arabic) and `englishName` are display-only.

// ── Aspect ratios (matches the reference platform's picker) ─────────────────────
export const SOUL_ASPECTS = [
  { id: "1:1",  label: "1:1",  aspect: [1,  1]  },
  { id: "3:4",  label: "3:4",  aspect: [3,  4]  },
  { id: "4:3",  label: "4:3",  aspect: [4,  3]  },
  { id: "9:16", label: "9:16", aspect: [9,  16] },
  { id: "16:9", label: "16:9", aspect: [16, 9]  },
  { id: "4:5",  label: "4:5",  aspect: [4,  5]  },
  { id: "2:3",  label: "2:3",  aspect: [2,  3]  },
  { id: "21:9", label: "21:9" },
] as const;

// ── Quality tiers ────────────────────────────────────────────────────
// Mirrors the reference platform 1:1: only 2 user-facing tiers,
// labelled 1.5K (backend 720p) and 2K (backend 1080p). The "4K" tier
// we used to expose was a nice-to-have but the underlying Soul model
// doesn't render meaningfully better above 1080p, so we drop it to
// match the reference's two-tier UX.
export const SOUL_QUALITIES = [
  { id: "1.5k", label: "1.5K — أسرع وأرخص"                       },
  { id: "2k",   label: "2K — موصى به",        recommended: true   },
] as const;

// ────────────────────────────────────────────────────────────────────
// MOOD BOARDS (33 curated presets)
// ────────────────────────────────────────────────────────────────────
//
// Each preset has:
//   id          — slug, used in URLs and as the picker key
//   name        — Arabic display name
//   englishName — English label (matches the reference)
//   descriptor  — full reference-grade prompt fragment that captures
//                 the aesthetic in language image models respond to
//   thumbnail   — local mp4/webp path under /public/soul/moodboards/
//
// The descriptors were distilled from the visual look of each preset on
// the reference + their public blog explanations of what each style is
// known for. They're written to be chained at the END of the user's
// prompt so the subject stays first (where image models weight it
// heaviest) and the aesthetic layers on top.

export interface MoodBoardPreset {
  id:          string;
  name:        string;
  englishName: string;
  descriptor:  string;
  thumbnail:   string;
}

export const MOODBOARDS: MoodBoardPreset[] = [
  {
    id: "general", name: "عام", englishName: "General",
    descriptor: "balanced editorial photograph, neutral cinematic grade, professional color science, soft natural lighting",
    thumbnail: "/soul/moodboards/general.webp",
  },
  {
    id: "warm-ambient", name: "دفء محيطي", englishName: "Warm ambient",
    descriptor: "warm ambient glow, golden tungsten light spill, soft amber haze, intimate evening warmth, painterly skin tones",
    thumbnail: "/soul/moodboards/warm-ambient.webp",
  },
  {
    id: "y2k-studio", name: "ستوديو Y2K", englishName: "Y2K studio",
    descriptor: "early 2000s studio fashion shoot, glossy vinyl backdrop, hard direct flash, MTV-era styling, slight chromatic aberration, bold saturation",
    thumbnail: "/soul/moodboards/y2k-studio.webp",
  },
  {
    id: "swag-era", name: "حقبة السواج", englishName: "Swag era",
    descriptor: "early 2010s hip-hop tumblr aesthetic, gold chains, designer streetwear, urban backdrop, slightly overexposed, swag-era cultural mood",
    thumbnail: "/soul/moodboards/swag-era.webp",
  },
  {
    id: "theatrical-light", name: "إضاءة مسرحية", englishName: "Theatrical light",
    descriptor: "theatrical stage lighting, dramatic single-source key, deep falloff into black, painterly chiaroscuro, sculpted highlights, oil-painting depth",
    thumbnail: "/soul/moodboards/theatrical-light.webp",
  },
  {
    id: "y2k-street", name: "شارع Y2K", englishName: "Y2K street",
    descriptor: "early 2000s urban street style, low-rise denim, baby tees, tinted lenses, harsh on-camera flash, lo-fi compact-camera grain",
    thumbnail: "/soul/moodboards/y2k-street.webp",
  },
  {
    id: "flash-editorial", name: "فلاش إديتوريال", englishName: "Flash editorial",
    descriptor: "high-fashion direct flash editorial, hard shadows, bright keylight, magazine-cover styling, crisp focus, deep saturation",
    thumbnail: "/soul/moodboards/flash-editorial.webp",
  },
  {
    id: "old-smartphone", name: "موبايل قديم", englishName: "Old smartphone",
    descriptor: "early 2010s smartphone photo aesthetic, compressed dynamic range, slight blur, mobile-camera color science, soft jpeg artifacts, candid framing",
    thumbnail: "/soul/moodboards/old-smartphone.webp",
  },
  {
    id: "street-photography", name: "تصوير شوارع", englishName: "Street photography",
    descriptor: "documentary street photography, candid moment, 35mm reportage feel, naturalistic light, slight motion blur, urban authenticity",
    thumbnail: "/soul/moodboards/street-photography.webp",
  },
  {
    id: "asian-nostalgia", name: "حنين آسيوي", englishName: "Asian nostalgia",
    descriptor: "1990s East Asian film photography aesthetic, soft pastel grade, dreamy diffusion, Hong Kong/Tokyo street nostalgia, gentle film grain",
    thumbnail: "/soul/moodboards/asian-nostalgia.webp",
  },
  {
    id: "retro-bw", name: "أبيض وأسود ريترو", englishName: "Retro BW",
    descriptor: "vintage black-and-white photography, rich silver tones, deep blacks, gentle highlight rolloff, mid-century editorial mood, fine grain",
    thumbnail: "/soul/moodboards/retro-bw.webp",
  },
  {
    id: "subtle-flash", name: "فلاش هادئ", englishName: "Subtle flash",
    descriptor: "soft refined on-camera flash, gentle shadow falloff, polished editorial finish, balanced exposure, modern fashion magazine look",
    thumbnail: "/soul/moodboards/subtle-flash.webp",
  },
  {
    id: "surreal-solarization", name: "تشمس سريالي", englishName: "Surreal solarization",
    descriptor: "experimental darkroom solarization effect, partially inverted tonal map, dreamlike halos around highlights, surreal monochrome palette",
    thumbnail: "/soul/moodboards/surreal-solarization.webp",
  },
  {
    id: "digital-camera", name: "كاميرا ديجيتال", englishName: "Digital camera",
    descriptor: "early digital point-and-shoot aesthetic, slight noise, fixed-color rendering, mid-2000s digicam flatness, casual snapshot framing",
    thumbnail: "/soul/moodboards/digital-camera.webp",
  },
  {
    id: "siren", name: "سيرين", englishName: "Siren",
    descriptor: "mysterious alluring siren mood, ocean blues, glassy reflections, ethereal subject, soft underwater diffusion, otherworldly cool palette",
    thumbnail: "/soul/moodboards/siren.webp",
  },
  {
    id: "mystique-city", name: "مدينة غامضة", englishName: "Mystique city",
    descriptor: "enigmatic urban atmosphere, neon haze, rain-slick reflections, late-night cinematic noir, anonymous architectural backdrop",
    thumbnail: "/soul/moodboards/mystique-city.webp",
  },
  {
    id: "candy-pop", name: "كاندي بوب", englishName: "Candy pop",
    descriptor: "bright saturated pop palette, bubblegum pink and electric blue, glossy plastic textures, mid-2000s teen-magazine cheer, hyper-color",
    thumbnail: "/soul/moodboards/candy-pop.webp",
  },
  {
    id: "double-exposure", name: "تعريض مزدوج", englishName: "Double exposure",
    descriptor: "artistic double exposure photograph, two scenes overlapping, ghosted silhouettes, dreamlike layering, gallery-quality composite",
    thumbnail: "/soul/moodboards/double-exposure.webp",
  },
  {
    id: "2000s-band", name: "فرقة الألفية", englishName: "2000s band",
    descriptor: "2000s indie rock band promo aesthetic, moody black backgrounds, eyeliner styling, grungy texture, tour-poster framing, MTV2 era",
    thumbnail: "/soul/moodboards/2000s-band.webp",
  },
  {
    id: "frutiger-aero", name: "فروتيجر إيرو", englishName: "Frutiger aero",
    descriptor: "Frutiger Aero design language, glossy translucent UI textures, cyan-blue skies, optimistic Web 2.0 aesthetic, dolphins-and-grass-fields utopia",
    thumbnail: "/soul/moodboards/frutiger-aero.webp",
  },
  {
    id: "drain", name: "درين", englishName: "Drain",
    descriptor: "drain underground aesthetic, melancholic late-night mood, fluorescent industrial light, washed-out skin tones, basement-show energy",
    thumbnail: "/soul/moodboards/drain.webp",
  },
  {
    id: "extraterrestrial", name: "خارج الأرض", englishName: "Extraterrestrial",
    descriptor: "extraterrestrial scifi mood, alien lighting, otherworldly metallic textures, surreal cosmic palette, futuristic hyperreal",
    thumbnail: "/soul/moodboards/extraterrestrial.webp",
  },
  {
    id: "nature-light", name: "ضوء طبيعي", englishName: "Nature light",
    descriptor: "natural outdoor sunlight, golden hour glow, organic foliage, breathable airy atmosphere, painterly highlights, no studio gear",
    thumbnail: "/soul/moodboards/nature-light.webp",
  },
  {
    id: "editorial-street-style", name: "ستايل شوارع راقي", englishName: "Editorial street style",
    descriptor: "high-fashion editorial street style, magazine cover composition, designer styling shot on the street, sharp focus, polished but candid",
    thumbnail: "/soul/moodboards/editorial-street-style.webp",
  },
  {
    id: "new-indie", name: "إندي حديث", englishName: "New Indie",
    descriptor: "contemporary indie aesthetic, muted desaturated tones, lo-fi authenticity, Gen Z editorial, painterly slight haze, casual but composed",
    thumbnail: "/soul/moodboards/new-indie.webp",
  },
  {
    id: "underwater", name: "تحت الماء", englishName: "Underwater",
    descriptor: "submerged underwater photograph, refracted caustic light, suspended bubbles, fluid aquamarine palette, weightless ethereal pose",
    thumbnail: "/soul/moodboards/underwater.webp",
  },
  {
    id: "80s-horror", name: "رعب الثمانينيات", englishName: "80s horror",
    descriptor: "1980s slasher film aesthetic, deep magenta and teal grading, VHS scan lines, fog-machine atmosphere, motel-noir framing, retro horror tension",
    thumbnail: "/soul/moodboards/80s-horror.webp",
  },
  {
    id: "disposable-camera", name: "كاميرا للاستعمال", englishName: "Disposable camera",
    descriptor: "single-use disposable camera aesthetic, bright on-camera flash, soft 35mm grain, slight focus drift, party-snapshot mood, candid intimacy",
    thumbnail: "/soul/moodboards/disposable-camera.webp",
  },
  {
    id: "neutral-pastel-film", name: "فيلم باستيل محايد", englishName: "Neutral pastel film",
    descriptor: "Kodak Portra-style neutral pastel film stock, soft natural skin tones, gentle highlight rolloff, painterly mid-tones, refined editorial",
    thumbnail: "/soul/moodboards/neutral-pastel-film.webp",
  },
  {
    id: "warm-vivid-film", name: "فيلم دافئ نابض", englishName: "Warm vivid film",
    descriptor: "warm vivid analog film stock, saturated golden hues, lush mid-day color, painterly contrast, summer-editorial richness",
    thumbnail: "/soul/moodboards/warm-vivid-film.webp",
  },
  {
    id: "bw-film", name: "فيلم أبيض وأسود", englishName: "BW film",
    descriptor: "classic 35mm black-and-white film stock, deep silver tonal range, fine grain, artisan darkroom finish, timeless documentary quality",
    thumbnail: "/soul/moodboards/bw-film.webp",
  },
  {
    id: "warm-contrast-film", name: "فيلم تباين دافئ", englishName: "Warm contrast film",
    descriptor: "warm high-contrast color film, deep amber shadows, glowing skin highlights, painterly chiaroscuro, cinematic celluloid look",
    thumbnail: "/soul/moodboards/warm-contrast-film.webp",
  },
  {
    id: "muted-cool-film", name: "فيلم بارد هادئ", englishName: "Muted cool film",
    descriptor: "muted cool film stock, desaturated steel-blue palette, soft overcast light, melancholic Scandinavian editorial mood, pristine grain",
    thumbnail: "/soul/moodboards/muted-cool-film.webp",
  },

  // ── Extended catalog — adds 73 entries to reach 1:1 parity with the
  //    industry-leading style library (106 total). Names + concept come
  //    from the reference platform's public catalog; descriptors are
  //    expanded by us into the prompt-engineering grammar that nano-
  //    banana-pro responds well to (subject-first, then aesthetic, then
  //    finishing cues). Thumbnails left empty for now — picker shows a
  //    text fallback when missing. (Sourced from research/05_CATALOGS
  //    /soul-styles.md, kept private under docs/.)

  // ── Outfit + selfie ────────────────────────────────────────────────
  { id: "0-5-outfit", name: "إطلالة 0.5", englishName: "0.5 Outfit",
    descriptor: "wide-angle waist-down outfit shot, casual candid framing, slight lens distortion, effortlessly cool street look",
    thumbnail: "" },
  { id: "0-5-selfie", name: "سيلفي 0.5", englishName: "0.5 Selfie",
    descriptor: "front-camera half-body mirror selfie, unfiltered fit, real-life lighting, authentic everyday energy",
    thumbnail: "" },
  { id: "ring-selfie", name: "سيلفي الخاتم", englishName: "RingSelfie",
    descriptor: "manicured-hand selfie, glossy lips, ring-light catch in the eyes, casual flex composition, maximal sparkle impact",
    thumbnail: "" },
  { id: "elevator-mirror", name: "مرآة المصعد", englishName: "Elevator Mirror",
    descriptor: "elevator mirror selfie, narrow framing, harsh overhead light, candid late-night-out energy, reflective metal surfaces",
    thumbnail: "" },
  { id: "shoe-check", name: "فحص الحذاء", englishName: "Shoe Check",
    descriptor: "ground-up shoe-focus shot, top-down or low-angle composition, hard shadow, surreal scale emphasising the footwear",
    thumbnail: "" },
  { id: "nail-check", name: "فحص الأظافر", englishName: "Nail Check",
    descriptor: "macro hand close-up showcasing nail art, rings and finger jewellery, soft beauty light, precision beauty composition",
    thumbnail: "" },
  { id: "grillz-selfie", name: "سيلفي الجريلز", englishName: "Grillz Selfie",
    descriptor: "flash-heavy close-up of teeth and grills, bold attitude, underground luxury aesthetic, raw street confidence",
    thumbnail: "" },

  // ── 2000s / Y2K ────────────────────────────────────────────────────
  { id: "2000s-cam", name: "كاميرا الألفينات", englishName: "2000s Cam",
    descriptor: "early-2000s paparazzi flash camera, low-rise wardrobe, rhinestones, nostalgic pre-iPhone glam, slight chromatic aberration",
    thumbnail: "" },
  { id: "2000s-fashion", name: "أزياء الألفينات", englishName: "2000s Fashion",
    descriptor: "Y2K maximalist fashion, shiny textures, low-rise denim, total throwback styling, high-attitude pose",
    thumbnail: "" },
  { id: "y2k", name: "واي 2 كيه", englishName: "Y2K",
    descriptor: "early-2000s gloss and glitter aesthetic, baby tees, flip phones, hyper-saturated maximalism, shiny reboot energy",
    thumbnail: "" },
  { id: "y2k-posters", name: "ملصقات Y2K", englishName: "Y2K Posters",
    descriptor: "early-2000s teen-poster wall aesthetic, chrome text, airbrushed skin, floating objects, internet bedroom collage",
    thumbnail: "" },

  // ── 90s ─────────────────────────────────────────────────────────────
  { id: "90s-grain", name: "حبيبية التسعينات", englishName: "90s Grain",
    descriptor: "90s film grain texture, warm tonal palette, soft blur, retro nostalgic mood, mid-decade editorial energy",
    thumbnail: "" },
  { id: "90s-editorial", name: "إيديتوريال التسعينات", englishName: "90s Editorial",
    descriptor: "1990s fashion magazine editorial, film grain, soft blur, moody color, pure nostalgia, supermodel-era styling",
    thumbnail: "" },

  // ── Locations / vibes ──────────────────────────────────────────────
  { id: "amalfi-summer", name: "صيف أمالفي", englishName: "Amalfi Summer",
    descriptor: "Amalfi coast summer light, lemon-yellow accents, sunkissed Mediterranean skin, linen fluttering on cobblestone",
    thumbnail: "" },
  { id: "tokyo-streetstyle", name: "أزياء شوارع طوكيو", englishName: "Tokyo Streetstyle",
    descriptor: "Tokyo street fashion, layered silhouettes, sharp tailoring, fearless color, neon-tinged urban runway",
    thumbnail: "" },
  { id: "tokyo-drift", name: "طوكيو دريفت", englishName: "tokyo drift",
    descriptor: "Tokyo drift street-racing aesthetic, neon underglow, parking-garage haze, kinetic late-night energy",
    thumbnail: "" },
  { id: "mt-fuji", name: "جبل فوجي", englishName: "Mt. Fuji",
    descriptor: "Mt. Fuji backdrop, postcard surrealism, crystal-blue sky, iconic mountain symmetry, conbini-store foreground drama",
    thumbnail: "" },
  { id: "subway", name: "المترو", englishName: "Subway",
    descriptor: "underground subway platform, cold fluorescent overhead, urban grit, fleeting commuter intimacy",
    thumbnail: "" },
  { id: "escalator", name: "السلم المتحرك", englishName: "Escalator",
    descriptor: "mall escalator gliding shot, structured outfit, paparazzi-style smooth motion, mid-decade editorial framing",
    thumbnail: "" },
  { id: "library", name: "المكتبة", englishName: "Library",
    descriptor: "cozy library interior, soft incandescent reading lamps, timeless knits, quiet academic power",
    thumbnail: "" },
  { id: "gallery", name: "معرض فني", englishName: "Gallery",
    descriptor: "minimalist art gallery, neutral white walls, museum lighting, polished framing of the subject as artwork",
    thumbnail: "" },
  { id: "office-beach", name: "شاطئ المكتب", englishName: "Office beach",
    descriptor: "corporate-meets-coastal aesthetic, suits on sand, sun-bleached spreadsheets, chaotic surreal mashup",
    thumbnail: "" },
  { id: "swords-hill", name: "تل السيوف", englishName: "Swords Hill",
    descriptor: "high-fantasy mountain slope, capes and steel, wind-blown drama, part legend part editorial",
    thumbnail: "" },
  { id: "night-beach", name: "شاطئ ليلي", englishName: "Night Beach",
    descriptor: "moonlit beach, dark silhouettes, salt-air haze, intimate slightly-unreal coastal atmosphere",
    thumbnail: "" },
  { id: "sunset-beach", name: "شاطئ الغروب", englishName: "Sunset beach",
    descriptor: "golden-hour beach, sky melting purple to peach, warm rim light, effortless pose unaware of the sun",
    thumbnail: "" },
  { id: "sunbathing", name: "تشمس", englishName: "Sunbathing",
    descriptor: "sunbathing scene, clear turquoise water, woven beach bag, towel texture, heat-soaked skin tones",
    thumbnail: "" },
  { id: "sea-breeze", name: "نسيم البحر", englishName: "Sea breeze",
    descriptor: "windswept seaside portrait, salt-air haze, hair caught mid-movement, breathable open-coast atmosphere",
    thumbnail: "" },
  { id: "rainy-day", name: "يوم ممطر", englishName: "Rainy Day",
    descriptor: "moody rainy day, reflections in wet pavement, soft sweaters, slow cinematic quiet",
    thumbnail: "" },
  { id: "foggy-morning", name: "صباح ضبابي", englishName: "Foggy Morning",
    descriptor: "foggy morning portrait, muted colors, blurred horizon, dreamlike stillness in the early hours",
    thumbnail: "" },
  { id: "flight-mode", name: "وضع الطيران", englishName: "Flight mode",
    descriptor: "modern airport terminal, glassy travel atmosphere, structured wardrobe, designed-to-feel-transient mood",
    thumbnail: "" },
  { id: "street-view", name: "منظر الشارع", englishName: "Street view",
    descriptor: "wide street-view composition, candid pedestrians, layered urban depth, documentary feel",
    thumbnail: "" },
  { id: "crossing-street", name: "عبور الشارع", englishName: "Crossing the street",
    descriptor: "boss-walk pedestrian crossing, overhead angle, harsh midday shadows, perfect mid-step framing",
    thumbnail: "" },
  { id: "sitting-street", name: "جلسة الشارع", englishName: "Sitting on the Street",
    descriptor: "laid-back kerb-side seated pose, candid cool, consciously unbothered urban grit",
    thumbnail: "" },
  { id: "505-room", name: "غرفة 505", englishName: "505room",
    descriptor: "moody hotel-room number 505 vibe, low warm bedside light, intimate after-hours composition",
    thumbnail: "" },
  { id: "afterparty-cam", name: "كاميرا ما بعد الحفلة", englishName: "afterparty cam",
    descriptor: "afterparty handheld camera, smudged eyeliner, blown-out flash, blurry post-midnight chaos",
    thumbnail: "" },
  { id: "cocktail", name: "كوكتيل", englishName: "cocktail",
    descriptor: "cocktail bar setting, dim amber light, glass highlights, intimate refined nightlife mood",
    thumbnail: "" },
  { id: "birthday-mess", name: "فوضى عيد الميلاد", englishName: "birthday mess",
    descriptor: "candid birthday party aftermath, confetti spill, smudged cake icing, joyful organized chaos",
    thumbnail: "" },
  { id: "dmv", name: "دي إم في", englishName: "dmv",
    descriptor: "DMV waiting-room aesthetic, cold fluorescent light, deadpan staring composition, uncanny banal humor",
    thumbnail: "" },
  { id: "eating-food", name: "تناول الطعام", englishName: "Eating Food",
    descriptor: "candid eating-mid-bite shot, food-blog overhead or three-quarter framing, glossy texture, intimate appetite",
    thumbnail: "" },
  { id: "movie", name: "سينمائي", englishName: "Movie",
    descriptor: "film-still composition, anamorphic widescreen feel, motivated dramatic lighting, character-actor framing",
    thumbnail: "" },
  { id: "mount-view", name: "إطلالة الجبل", englishName: "mount view",
    descriptor: "elevated mountain-view portrait, expansive landscape backdrop, crisp altitude light, painterly horizon depth",
    thumbnail: "" },

  // ── Lighting / cameras ─────────────────────────────────────────────
  { id: "iphone", name: "آيفون", englishName: "iPhone",
    descriptor: "casual iPhone photo aesthetic, natural HDR glow, soft computational rendering, intimate everyday framing",
    thumbnail: "" },
  { id: "realistic", name: "واقعي", englishName: "Realistic",
    descriptor: "no-filter photoreal capture, natural light, true-to-life skin texture, fabric and pore detail",
    thumbnail: "" },
  { id: "digitalcam", name: "كاميرا رقمية", englishName: "DigitalCam",
    descriptor: "early-2000s digital point-and-shoot aesthetic, harsh on-camera flash, timestamp corner, raw lo-fi color",
    thumbnail: "" },
  { id: "cctv", name: "كاميرا مراقبة", englishName: "CCTV",
    descriptor: "low-resolution surveillance camera footage, grainy raw realism, fixed wide-angle perspective, deadpan framing",
    thumbnail: "" },
  { id: "fisheye", name: "عين السمكة", englishName: "Fisheye",
    descriptor: "fisheye lens distortion, exaggerated foreground, stretched-to-infinity background, playful exaggerated proportions",
    thumbnail: "" },
  { id: "fisheye-twin", name: "عين السمكة التوأم", englishName: "Fish-eye twin",
    descriptor: "twin-fisheye composition, dual subjects mirrored across the frame, surreal symmetric distortion",
    thumbnail: "" },
  { id: "360-cam", name: "كاميرا 360°", englishName: "360 cam",
    descriptor: "wraparound 360-degree perspective, immersive warped framing, everything bent into the lens",
    thumbnail: "" },
  { id: "spotlight", name: "دائرة الضوء", englishName: "Spotlight",
    descriptor: "single hard spotlight, deep falloff into black, paparazzi-flash icon energy, sculptural face shadows",
    thumbnail: "" },
  { id: "overexposed", name: "إضاءة مبالغة", englishName: "Overexposed",
    descriptor: "deliberately overexposed exposure, washed-out whites, crushed detail, accidental-but-intentional aesthetic",
    thumbnail: "" },
  { id: "vintage-photobooth", name: "كشك صور كلاسيكي", englishName: "Vintage PhotoBooth",
    descriptor: "vintage photobooth strip aesthetic, flash-lit nostalgia, grain and glare, kiss of analog chaos",
    thumbnail: "" },
  { id: "static-glow", name: "بريق ثابت", englishName: "static glow",
    descriptor: "soft static-tube glow, vintage CRT halo, low-contrast magnetic glow framing the subject",
    thumbnail: "" },
  { id: "nicotine-glow", name: "بريق نيكوتين", englishName: "Nicotine glow",
    descriptor: "warm yellowed nicotine-stained glow, hazy interior, late-night smoke-soaked palette",
    thumbnail: "" },
  { id: "hallway-noir", name: "ممر نوار", englishName: "hallway noir",
    descriptor: "noir-lit hallway portrait, hard shadows from overhead lamps, suspenseful corridor framing",
    thumbnail: "" },
  { id: "night-rider", name: "راكب الليل", englishName: "Night rider",
    descriptor: "midnight motorcycle aesthetic, headlight glare, neon highway reflections, lone-rider mystique",
    thumbnail: "" },
  { id: "chrome-exit", name: "خروج كرومي", englishName: "chrome exit",
    descriptor: "chrome architectural exit aesthetic, mirrored surfaces, futuristic cold lighting, sharp metallic reflections",
    thumbnail: "" },

  // ── Beauty / makeup ────────────────────────────────────────────────
  { id: "babydoll-makeup", name: "مكياج بايبي دول", englishName: "Babydoll MakeUp",
    descriptor: "fluttery lashes, pouty lips, porcelain skin, hyper-feminine babydoll glow",
    thumbnail: "" },
  { id: "object-makeup", name: "مكياج الأشياء", englishName: "Object Makeup",
    descriptor: "collage-style face composition, makeup applied over an everyday object, surreal duplicated colors",
    thumbnail: "" },
  { id: "glazed-doll", name: "بشرة الدمية", englishName: "Glazed doll skin makeup",
    descriptor: "high-shine glazed doll skin, dewy reflections, doll-like flawless finish, beauty-editorial close-up",
    thumbnail: "" },
  { id: "bleached-brows", name: "حواجب مبيضة", englishName: "Bleached Brows",
    descriptor: "bleached-out brows, futuristic facial blank canvas, alien-glam minimalism, bold sculptural makeup",
    thumbnail: "" },
  { id: "hairclips", name: "مشابك الشعر", englishName: "HairClips",
    descriptor: "playful hair-clip styling, chunky pearl-lined accessories, framing the face with precision",
    thumbnail: "" },

  // ── Aesthetic / mood subcultures ───────────────────────────────────
  { id: "bimbocore", name: "بيمبو كور", englishName: "Bimbocore",
    descriptor: "bimbocore hyperfeminine maximalism, glossed lips, tiny skirts, pink overload, plastic-fantastic confidence",
    thumbnail: "" },
  { id: "coquette-core", name: "كوكيت كور", englishName: "Coquette core",
    descriptor: "coquette aesthetic, soft focus, bows and lace daydreams, sweetness laced with irony",
    thumbnail: "" },
  { id: "fairycore", name: "فيري كور", englishName: "Fairycore",
    descriptor: "glittery woodland fantasy, soft pastels, magical sparkles, enchanted innocence",
    thumbnail: "" },
  { id: "gorpcore", name: "غورب كور", englishName: "Gorpcore",
    descriptor: "technical outdoor gorpcore, color-blocked gear, bulky sneakers, function-as-fashion runway energy",
    thumbnail: "" },
  { id: "indie-sleaze", name: "إندي سليز", englishName: "Indie sleaze",
    descriptor: "flash-lit indie-sleaze chaos, smudged eyeliner, blurry rebellion, raw nightlife tumblr-era energy",
    thumbnail: "" },
  { id: "tumblr", name: "تمبلر", englishName: "Tumblr",
    descriptor: "grainy tumblr aesthetic, soft blur, blue-tinted melancholy, curated emotional charge",
    thumbnail: "" },
  { id: "quiet-luxury", name: "فخامة هادئة", englishName: "Quiet luxury",
    descriptor: "quiet luxury aesthetic, restrained palette, hand-tailored fabrics, understated wealth, neutral-tone refinement",
    thumbnail: "" },
  { id: "japandi", name: "ياباندي", englishName: "Japandi",
    descriptor: "japandi minimalism, clean lines, natural light, serene balance of form and function",
    thumbnail: "" },
  { id: "geominimal", name: "جيومينيمال", englishName: "Geominimal",
    descriptor: "geominimal aesthetic, clean geometric overlays, sharp modernist composition, rigorous minimalism",
    thumbnail: "" },
  { id: "selfcare", name: "العناية بالنفس", englishName: "Selfcare",
    descriptor: "self-care ritual scene, candles, skincare bottles, robes, glowing peace in muted tones",
    thumbnail: "" },
  { id: "fashion-show", name: "عرض الأزياء", englishName: "FashionShow",
    descriptor: "backstage fashion-show energy, runway flashes, bold looks, chaos-meets-couture composition",
    thumbnail: "" },
  { id: "editorial-street-style-2", name: "ستايل شوارع راقي 2", englishName: "Editorial street style",
    descriptor: "high-fashion street-style editorial, magazine-cover composition, designer styling shot on the street",
    thumbnail: "" },
  { id: "green-editorial", name: "إيديتوريال أخضر", englishName: "green editorial",
    descriptor: "monochromatic green editorial, lush palette focus, fashion-magazine composition with single-color theme",
    thumbnail: "" },
  { id: "burgundy-suit", name: "بدلة بورجندي", englishName: "burgundy suit",
    descriptor: "monochromatic burgundy suit study, rich wine palette, tailored sharpness, polished single-color editorial",
    thumbnail: "" },
  { id: "brick-shade", name: "ظل القرميد", englishName: "brick shade",
    descriptor: "warm brick-toned palette, terracotta and clay reds, urban back-alley shade composition",
    thumbnail: "" },
  { id: "bike-mafia", name: "عصابة الدراجات", englishName: "Bike mafia",
    descriptor: "biker-gang aesthetic, leather jackets, group composition with chrome-bike backdrop, late-night swagger",
    thumbnail: "" },

  // ── Surreal / arty ─────────────────────────────────────────────────
  { id: "2049", name: "٢٠٤٩", englishName: "2049",
    descriptor: "2049 dystopian-future aesthetic, smog haze, neon underglow, holographic billboard light, lonely cinematic distance",
    thumbnail: "" },
  { id: "fireproof", name: "مقاوم للنار", englishName: "Fireproof",
    descriptor: "fire-and-light surreal aesthetic, suspended sparks, embers floating around the subject, controlled chaos energy",
    thumbnail: "" },
  { id: "clouded-dream", name: "حلم ضبابي", englishName: "Clouded Dream",
    descriptor: "clouded dreamlike portrait, soft-focus haze, suspended weightlessness, surreal atmospheric volume",
    thumbnail: "" },
  { id: "double-take", name: "نظرة مزدوجة", englishName: "Double take",
    descriptor: "double-take optical-illusion composition, mirrored gestures, surreal repetition that bends perception",
    thumbnail: "" },
  { id: "duplicate", name: "مزدوج", englishName: "Duplicate",
    descriptor: "duplicate echoed figures, mirrored forms or repeated poses, surreal symmetric layered composition",
    thumbnail: "" },
  { id: "red-balloon", name: "بالون أحمر", englishName: "Red balloon",
    descriptor: "single bright-red balloon as scene anchor, surreal narrative composition, painterly contrast against muted environment",
    thumbnail: "" },
  { id: "long-legs", name: "أرجل طويلة", englishName: "Long legs",
    descriptor: "elongated stretched-leg proportions, runway-style drama, low-angle exaggeration, stylised editorial figure",
    thumbnail: "" },
  { id: "giant-people", name: "أشخاص عمالقة", englishName: "Giant People",
    descriptor: "giant-scale subject in regular environment, surreal proportion play, urban-city scale composition",
    thumbnail: "" },
  { id: "giant-accessory", name: "إكسسوار عملاق", englishName: "Giant Accessory",
    descriptor: "exaggerated oversized accessory dominating the frame, surreal scale, editorial drama focused on the object",
    thumbnail: "" },
  { id: "too-big", name: "ضخم جداً!", englishName: "Help It's Too Big",
    descriptor: "subject overwhelmed by an oversized object, comedic scale mismatch, surreal proportion editorial",
    thumbnail: "" },
  { id: "creatures", name: "مخلوقات", englishName: "Creatures",
    descriptor: "animalistic creature features fused with human edge, eerie beautiful hybrid composition",
    thumbnail: "" },
  { id: "angel-wings", name: "أجنحة الملاك", englishName: "Angel Wings",
    descriptor: "soft delicate angel-wing accents, dreamy weightless composition, ethereal halo light",
    thumbnail: "" },
  { id: "pixelated-face", name: "وجه بكسلي", englishName: "PixeletedFace",
    descriptor: "deliberately pixelated face overlay, retro-glitch aesthetic, early-internet dream composition",
    thumbnail: "" },
  { id: "paper-face", name: "وجه ورقي", englishName: "Paper Face",
    descriptor: "torn-paper collage face composition, mixed-media textures, raw artistic edges, gallery-grade craft",
    thumbnail: "" },
  { id: "mixed-media", name: "وسائط مختلطة", englishName: "Mixed Media",
    descriptor: "mixed-media collage layers, photo paint text and texture combined, chaotic-elegance composition",
    thumbnail: "" },
  { id: "artwork", name: "عمل فني", englishName: "Artwork",
    descriptor: "framed gallery-artwork composition, painterly depth, still-life of emotion texture and light",
    thumbnail: "" },
  { id: "graffiti", name: "جرافيتي", englishName: "Graffiti",
    descriptor: "graffiti-textured backdrop, spray-paint bold lines, rebellious color, raw urban canvas energy",
    thumbnail: "" },
  { id: "glitch", name: "جلتش", englishName: "Glitch",
    descriptor: "intentional glitch aesthetic, pixel drag, color distortion, digital noise, beautiful errors mid-motion",
    thumbnail: "" },
  { id: "invertethereal", name: "عكس إيثيري", englishName: "Invertethereal",
    descriptor: "inverted-tone ethereal portrait, ghostly hues, dreamlike light turned inside out, surreal monochrome",
    thumbnail: "" },
  { id: "medieval", name: "قرون وسطى", englishName: "Medieval",
    descriptor: "medieval-era styling, chainmail and velvet, candlelit court intrigue, cinematic period weight",
    thumbnail: "" },
  { id: "sand", name: "رمال", englishName: "Sand",
    descriptor: "sculptural windswept dune composition, neutral tones, survivalist edge, high-fashion-lost-in-desert mood",
    thumbnail: "" },
  { id: "avant-garde", name: "طليعي", englishName: "Avant-garde",
    descriptor: "avant-garde sculptural beauty, unexpected silhouettes, bold shapes that speak in silent statements",
    thumbnail: "" },
  { id: "rhyme-blues", name: "إيقاع وبلوز", englishName: "Rhyme & blues",
    descriptor: "R&B late-night editorial, deep blue palette, neon accent, soulful intimate close-up",
    thumbnail: "" },
  { id: "blackout-fit", name: "إطلالة بلاكاوت", englishName: "blackout fit",
    descriptor: "head-to-toe blackout outfit study, deep-shadow palette, stark silhouette, sculptural fashion focus",
    thumbnail: "" },
  { id: "its-french", name: "أناقة فرنسية", englishName: "It's french",
    descriptor: "Parisian French chic styling, effortless tailored neutrals, café-side composition, understated cool",
    thumbnail: "" },
  { id: "through-the-glass", name: "خلف الزجاج", englishName: "Through The Glass",
    descriptor: "shot through fogged-up window or café pane, observed-not-staged framing, intimate quiet voyeurism",
    thumbnail: "" },
  { id: "7-aphex", name: "7 أفيكس", englishName: "7\\",
    descriptor: "Aphex-Twin-inspired distorted realism, eerie edits, glitch undertones, cult-classic experimental weirdness",
    thumbnail: "" },
  { id: "sunburnt", name: "محروق الشمس", englishName: "Sunburnt",
    descriptor: "sunburnt golden-skin study, harsh midday glare, deep tan tones, summer aftermath warmth",
    thumbnail: "" },
];

export const DEFAULT_MOODBOARD = MOODBOARDS[0]!.id; // "general"

// ────────────────────────────────────────────────────────────────────
// Curated 21-style picks (mirrors the reference's prominent picker)
// ────────────────────────────────────────────────────────────────────
// The reference platform highlights 21 hand-picked moodboards across 3
// themes in a prominent picker (instead of dumping all 106 at once).
// We mirror that by tagging each preset with its theme — the picker
// shows the curated 21 by default with a "Browse all 106" expansion.

export type CuratedTheme = "mood" | "styles" | "camera";

export const CURATED_PICKS: Record<CuratedTheme, string[]> = {
  // 6 mood-driven highlights
  mood:   ["asian-nostalgia", "double-exposure", "surreal-solarization", "siren", "swag-era", "mystique-city"],
  // 10 style-system highlights
  styles: ["warm-ambient", "y2k-street", "subtle-flash", "theatrical-light", "editorial-street-style",
           "flash-editorial", "candy-pop", "2000s-band", "frutiger-aero", "drain"],
  // 5 camera/finish highlights
  camera: ["retro-bw", "y2k-studio", "street-photography", "digital-camera", "old-smartphone"],
};

/** Flat list of all 21 curated style ids (for quick lookups). */
export const CURATED_FLAT: string[] = [
  ...CURATED_PICKS.mood,
  ...CURATED_PICKS.styles,
  ...CURATED_PICKS.camera,
];

// ────────────────────────────────────────────────────────────────────
// COLOR SIGNATURES (Soul HEX) — 6 curated palettes
// ────────────────────────────────────────────────────────────────────
//
// Each palette has:
//   • A reference photograph that visually anchors the look (the same
//     image the reference shows in the picker)
//   • A 6-color HEX swatch that summarises the palette
//   • A descriptor fragment for the prompt
//
// HEX values were sampled from the reference platform's reference images — chosen
// to capture both the dominant tones and the "accent" tones that give
// each palette its personality.

export interface ColorPalette {
  id:          string;
  name:        string;
  englishName: string;
  descriptor:  string;
  hexes:       string[];      // 6 representative HEX colors, dominant first
  reference:   string;        // /soul/colors/<file>
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: "film-colors", name: "ألوان فيلم", englishName: "Film colors",
    descriptor: "balanced classic 35mm film color palette, naturalistic skin tones, gentle saturation, painterly highlight roll-off",
    hexes: ["#7a8b6b", "#d8c8a8", "#3e4a3a", "#a89878", "#1a2a18", "#e8d8b8"],
    reference: "/soul/colors/ref-1.jpg",
  },
  {
    id: "lime-jam", name: "ليم جام", englishName: "Lime Jam",
    descriptor: "fresh lime green meadow palette, sky-blue accents, breathable outdoor airy atmosphere, vibrant saturated nature",
    hexes: ["#a8c878", "#7a9858", "#6890b8", "#a0b0c8", "#d8e8a0", "#2c4030"],
    reference: "/soul/colors/ref-2.jpg",
  },
  {
    id: "candy-pink", name: "كاندي بينك", englishName: "Candy pink",
    descriptor: "candy pink and bubblegum palette, glossy magenta highlights, pop magazine vibrance, sweet feminine energy",
    hexes: ["#e8a8b8", "#d88098", "#f0c8d0", "#a85878", "#1c1010", "#e8d8c8"],
    reference: "/soul/colors/ref-3.jpg",
  },
  {
    id: "nostalgic-blue", name: "أزرق حنين", englishName: "Nostalgic blue",
    descriptor: "deep nostalgic ultramarine blue palette, crimson red accent, magazine-editorial contrast, painterly studio mood",
    hexes: ["#2848a0", "#c83828", "#e8b0a0", "#1a2860", "#3a3838", "#d8d0b8"],
    reference: "/soul/colors/ref-4.jpg",
  },
  {
    id: "soft-palette", name: "باستيل ناعم", englishName: "Soft palette",
    descriptor: "soft neutral pastel palette, cream and powder pink, gentle desaturation, refined whisper-quiet editorial mood",
    hexes: ["#e8d8c8", "#d0c0b0", "#a89890", "#787068", "#403838", "#f0e8e0"],
    reference: "/soul/colors/ref-5.jpg",
  },
  {
    id: "black-gloss", name: "بلاك جلوس", englishName: "Black gloss",
    descriptor: "high-contrast black gloss palette, deep concrete grays, polished steel reflections, sculptural architectural mood",
    hexes: ["#1c1c1c", "#3c3c38", "#787068", "#a89888", "#5c4c3c", "#080808"],
    reference: "/soul/colors/ref-6.jpg",
  },
];

// ────────────────────────────────────────────────────────────────────
// Prompt builder
// ────────────────────────────────────────────────────────────────────
//
// Composes the final English prompt the image model sees. Order is
// engineered to match how the reference prompt-grammar weights inputs:
//
//   1. user prompt          (subject, action, scene)
//   2. character notes      (Soul ID — when present)
//   3. moodboard descriptor (style / aesthetic)
//   4. color descriptor     (Soul HEX palette)
//   5. universal Soul cues  (cinematic grade, editorial finish)

export interface BuildSoulPromptOpts {
  basePrompt: string;
  moodboardId?: string;
  paletteId?:   string;
  /** Free-text character note (e.g. "the same young Asian woman from the reference"). */
  characterHint?: string;
  /** When the user has uploaded their own moodboard, pass the descriptor we
   *  derived from the upload. Falls back to the curated preset. */
  customMoodboardDescriptor?: string;
  /** When the user has uploaded a custom Soul HEX reference, the extracted
   *  HEX values get summarised here. Falls back to the curated palette. */
  customPaletteHexes?: string[];
}

export function buildSoulPrompt(opts: BuildSoulPromptOpts): string {
  const moodboard = opts.moodboardId ? MOODBOARDS.find((m) => m.id === opts.moodboardId) : undefined;
  const palette   = opts.paletteId    ? COLOR_PALETTES.find((p) => p.id === opts.paletteId)    : undefined;

  const moodFragment =
    opts.customMoodboardDescriptor?.trim() ||
    moodboard?.descriptor || "";

  const paletteFragment =
    opts.customPaletteHexes && opts.customPaletteHexes.length > 0
      ? `dominant color palette of ${opts.customPaletteHexes.slice(0, 6).join(", ")}, with these tones used in skin highlights, fabric, and background`
      : palette?.descriptor || "";

  return [
    opts.basePrompt.trim(),
    opts.characterHint?.trim(),
    moodFragment,
    paletteFragment,
    "ultra-realistic editorial photograph, fashion-grade composition, magazine-quality lighting, painterly skin tones, high dynamic range, 8K finishing",
  ].filter(Boolean).join(", ");
}

// ── Defaults for a fresh shoot bar ──────────────────────────────────
export const SOUL_DEFAULTS = {
  aspect:     "3:4"        as string,
  quality:    "2k"         as string,
  variations: 1            as number,
  enhancePrompt: true      as boolean,
  moodboardId: DEFAULT_MOODBOARD,
  paletteId:   ""          as string,   // no palette = let the moodboard drive it
};
