// ════════════════════════════════════════════════════════════════
// Arabic translation map for MuAPI templates and agents
// ════════════════════════════════════════════════════════════════
// Source data (English names + descriptions) is fetched from MuAPI;
// we map each known id/slug → Arabic copy here so the catalogue feels
// native. Anything not in the map falls back to the English name.

export interface ArMeta {
  /** Arabic display name */
  name: string;
  /** Optional one-liner Arabic description (50–120 chars). */
  description?: string;
}

// ── Workflow templates (48) — keyed by template id ────────────────
export const TEMPLATE_AR: Record<string, ArMeta> = {
  "872e133d-db5d-4871-b649-d01505d1a603": {
    name: "تجربة الملابس افتراضياً",
    description: "ارفع صورة العميل والملابس واحصل على لقطة موديل احترافية فوراً.",
  },
  "77013608-2c1d-4fa3-865c-c7a667f62c8b": {
    name: "تصوير من زوايا متعددة",
    description: "حوّل صورة واحدة إلى مجموعة لقطات بزوايا مختلفة بنفس الموديل.",
  },
  "0fb56847-2334-44d7-ab93-d2318cf3cc28": {
    name: "إعلان منتج عملاق بمؤثرات بصرية",
    description: "تحويل المنتج إلى مشهد سينمائي ضخم بمؤثرات إعلانية احترافية.",
  },
  "4e9cb328-0e88-48c9-b90c-328a5c677dad": {
    name: "سيلفي مع المشاهير",
    description: "اصنع صورة سيلفي واقعية لك مع أي شخصية مشهورة بضغطة زر.",
  },
  "0e4042ae-4628-487f-b571-5dd9d598df22": {
    name: "إعلانات UGC جاهزة",
    description: "إعلانات بأسلوب صانعي المحتوى لمنتجك جاهزة للنشر مباشرة.",
  },
  "cf0ccf45-f061-41fa-999a-0b7760b5bd32": {
    name: "تصوير وفيديو منتج متكامل",
    description: "صور احترافية وفيديو إعلاني للمنتج في مسار واحد.",
  },
  "77fb992f-fc25-47dd-9bbb-0c0d5331b3d0": {
    name: "صانع فيديو إعلان للمنتج",
    description: "حوّل صورة منتجك إلى فيديو إعلاني قصير بمؤثرات سينمائية.",
  },
  "1734b542-6ecd-4eee-9e28-582fa79c227e": {
    name: "فيديو منتج 360°",
    description: "دوران كامل للمنتج بزاوية 360 درجة مع موسيقى وحركة.",
  },
  "69a7db7c-2598-44fd-b0d3-ffb1490f8710": {
    name: "تحرير صور احترافي",
    description: "تنقيح وتعديل ألوان وإضاءة صور الأزياء بمستوى استوديو.",
  },
  "f9d988cf-00e5-49eb-9bdf-d34c7967274d": {
    name: "مولّد فيديو الأزياء",
    description: "حرّك صور الأزياء وحوّلها إلى فيديو رانواي على المنصات.",
  },
  "e2db61a8-a413-4d1b-bc4c-0c042fba5bf1": {
    name: "مخططات ثلاثية الأبعاد للمنازل",
    description: "تحويل المخططات المعمارية إلى رندر ثلاثي الأبعاد بالذكاء الاصطناعي.",
  },
  "44f95b14-7810-4196-9734-513d6d76031c": {
    name: "فيديو قصة بشخصية ثابتة",
    description: "فيديو قصة كامل بشخصية واحدة متناسقة عبر اللقطات.",
  },
  "63d42ee7-be47-4bbc-83f0-001d195a263f": {
    name: "محول الشعارات",
    description: "حوّل شعار علامتك التجارية إلى أنماط بصرية متعددة.",
  },
  "ba3bbf0b-cf88-4245-94f6-62fd49f5afde": {
    name: "استوديو تصوير الأثاث",
    description: "صور كتالوج للأثاث بإضاءة استوديو في خلفيات مختلفة.",
  },
  "e2cf2d9d-b70e-4f2f-93f8-31c36dd94e38": {
    name: "مصمم ديكور المنزل",
    description: "أعد تصميم أي غرفة بأنماط ديكور متنوعة بضغطة زر.",
  },
  "a4f87ada-dbb3-4932-b209-6f1a222ce872": {
    name: "صور من أحرف الكيبورد",
    description: "ابتكر صوراً فنية مبنية على رموز ولوحة المفاتيح.",
  },
  "a4cc68cb-5870-4f2d-86f5-82a53fbd10b4": {
    name: "إنشاء إعلان منتج بالذكاء الاصطناعي",
    description: "إعلان كامل لمنتجك بنص وصورة وفيديو في خطوة واحدة.",
  },
  "6b41af09-a40f-459f-8179-7ee3a90d300b": {
    name: "صور بورتريه أزياء احترافية",
    description: "بورتريه احترافي بأسلوب مجلات الأزياء العالمية.",
  },
  "d1990b4a-6ebf-4798-89de-c285c1332284": {
    name: "فيديو طفل يتحدث (فيرال)",
    description: "اصنع فيديو طفل أو شخصية تتحدث بكلامك بسلاسة كاملة.",
  },
  "cfe935c4-705f-4c86-b0ea-efdbac69e293": {
    name: "مولّد فيديو القرود",
    description: "اصنع فيديو ترفيهي بأسلوب قنوات القرود الفيرالية على تيك توك.",
  },
  "09f6e93a-c5d6-465f-8e8b-a2d286e16332": {
    name: "فيديو عرض منتج بالذكاء الاصطناعي",
    description: "فيديو احترافي يعرض منتجك بزوايا وحركات سينمائية.",
  },
  "2e13c7f0-0273-4ad7-b3dc-966741b08ffa": {
    name: "تصميم غلاف كتاب",
    description: "صمّم غلاف كتاب احترافي من فكرة أو ملخص بسيط.",
  },
  "9b0c064f-85e6-4525-add1-a9bfff025dd6": {
    name: "صانع أنيمي مستقل",
    description: "حوّل أفكارك إلى مشاهد أنيمي بأسلوب الاستوديوهات اليابانية.",
  },
  "fc3f2c5a-458d-43c9-811e-6a1c93d49061": {
    name: "مصور العقارات بالذكاء الاصطناعي",
    description: "صور احترافية للعقارات وكأنها صورت بمصور عقاري متخصص.",
  },
  "f9a30f99-93a6-467e-a3ee-f4c97577b1b4": {
    name: "حزمة محتوى المؤثرين",
    description: "حزمة محتوى متكاملة لحملة مؤثر على السوشيال ميديا.",
  },
  "0849ffba-248d-4608-b480-d0a7958d825f": {
    name: "صانع شخصية أكشن فيغر",
    description: "حوّل صورتك إلى شخصية أكشن فيغر بتغليف وتصميم احترافي.",
  },
  "7b319794-001a-485e-8baa-5415ee939361": {
    name: "تأثير الذاكرة المتحركة",
    description: "تأثير سينمائي يحرك الذكريات والصور القديمة بأسلوب فيرال.",
  },
  "c965b74d-a703-4464-b9ea-97977f1054ab": {
    name: "شبكة صور للأزواج",
    description: "صمم شبكة صور احترافية للأزواج على نمط مجلات الأزياء.",
  },
  "0fabec51-5639-4d2c-b388-91aff25bc8a2": {
    name: "موكاب منتج بنانو بنانا برو",
    description: "ضع منتجك على عبوات وموكاب احترافية بدقة عالية.",
  },
  "9b4b8013-3ffd-4b0f-93b2-2fad8b1a26b2": {
    name: "أنيميشن شعار ثلاثي الأبعاد",
    description: "حرّك شعارك بأسلوب ثلاثي الأبعاد سينمائي عالي الجودة.",
  },
  "622e1eca-5fa2-4fb7-b2cd-c37f31a46633": {
    name: "تجديد الديكور الداخلي",
    description: "غيّر ديكور أي مساحة داخلية بضغطة واحدة.",
  },
  "637a10eb-3c3c-4942-a945-76b42e3e7182": {
    name: "بطاقات كرة قدم مخصصة",
    description: "اصنع بطاقات لاعبي كرة قدم مخصصة باسمك وصورتك.",
  },
  "7846fa71-526f-4b17-a5b7-f0a23976cd8c": {
    name: "حملة تسويقية للأثاث",
    description: "حملة إعلانية متكاملة لمتجر أثاث في مشاهد متعددة.",
  },
  "ab3e25bb-ff0e-4df5-9932-b2e1b7e37341": {
    name: "إعادة تصميم المنتج",
    description: "أعد تصور منتجك بألوان ومواد وتركيبات متنوعة.",
  },
  "4e498fd2-6b24-42b5-80d4-c5fd090eeaae": {
    name: "فن قص الورق",
    description: "حوّل صورك إلى لوحات بأسلوب قص الورق الفني الياباني.",
  },
  "f6d105b3-f05c-4b43-a496-02bfb8d9bb6f": {
    name: "أنيميشن رقص بأسلوب كرتوني",
    description: "اصنع فيديو رقص لأي شخص بأسلوب كرتوني مرح.",
  },
  "f4928ed6-e2b5-4d3f-b213-6a16b442550e": {
    name: "تأثير العنقاء",
    description: "تأثير سينمائي ملحمي بأسلوب طائر العنقاء يطير من الصورة.",
  },
  "23503b41-52b8-4055-a8db-ca9b21e51d95": {
    name: "صانع المنحوتات بالذكاء الاصطناعي",
    description: "حوّل صور أو شخصيات إلى منحوتات رخامية واقعية.",
  },
  "f3d0258e-f42c-4b57-8019-af387db0326e": {
    name: "تجربة الباروكات على المانيكان",
    description: "ضع شعراً مستعاراً على مانيكان عرض المنتجات بدقة عالية.",
  },
  "a81c3c2c-4177-481c-b321-597dbf418278": {
    name: "تحويل أنماط الغرف",
    description: "حوّل غرفة من نمط لآخر — مودرن، كلاسيكي، اسكندنافي…",
  },
  "3ae4a0a1-42bf-4230-97e5-363e57ffd252": {
    name: "ستيجنغ افتراضي للأثاث",
    description: "أضف الأثاث افتراضياً للغرف الفارغة لاستعراض العقار.",
  },
  "85ea5ac7-2c65-458d-96a7-d595e8ee0ae2": {
    name: "بورتريه بتعريض ضوئي مزدوج",
    description: "صور بورتريه بأسلوب التعريض المزدوج الفني الفاخر.",
  },
  "77c8c9db-2790-4e76-b058-50930eae9057": {
    name: "بورتريه في الشوارع",
    description: "صور بورتريه واقعية في شوارع مختلفة حول العالم.",
  },
  "40200883-620f-4406-b3a3-76b54a7384d0": {
    name: "أنيميشن منتج عملاق",
    description: "اصنع فيديو يعرض منتجك بحجم عملاق في مشاهد سينمائية.",
  },
  "3c7f69d5-c149-495e-8d53-7f398d2ffd14": {
    name: "مصمم ديكور داخلي",
    description: "أعد تصميم أي غرفة بستايل احترافي يناسب ذوقك.",
  },
  "7041dd15-cf7a-45bc-83d8-4a8cb414a816": {
    name: "فيديو عرض مجوهرات",
    description: "فيديو احترافي يعرض المجوهرات بإضاءة سينمائية.",
  },
  "5ffb26a0-4ce2-49c2-b799-9d63c7609d5a": {
    name: "تجربة الأزياء الهندية افتراضياً",
    description: "تجربة الأزياء الهندية التقليدية على موديل افتراضي.",
  },
  "3e3ecf18-47ef-4c66-aa99-03c51c818950": {
    name: "ميسر الديكور الداخلي",
    description: "تصورات ديكور داخلي متنوعة بضغطة زر.",
  },
};

// ── Agents (5 featured + 37 templates) — keyed by agent_id slug ───
export const AGENT_AR: Record<string, ArMeta> = {
  // Featured
  instapostcrafter: {
    name: "صانع منشورات إنستجرام",
    description: "صياغة منشورات إنستجرام راقية ومتفاعلة من فكرتك وصورتك.",
  },
  architectovisualparafachadas: {
    name: "مهندس واجهات بصرية",
    description: "تصميم واجهات معمارية وعرض بصري احترافي للمشاريع.",
  },
  magipromobuddy: {
    name: "رفيق إعلانات Magi",
    description: "مساعد ودود يصمم إعلانات وعروض ترويجية بأسلوب طبيعي.",
  },
  redditcowriterpro: {
    name: "كاتب ريديت برو",
    description: "صياغة منشورات ريديت محسّنة لجذب التفاعل والوصول.",
  },
  proteedesignstudio: {
    name: "استوديو تصميم التيشيرتات",
    description: "خبير تصميم تيشيرتات بأفكار قابلة للطباعة وعالية الأثر.",
  },

  // Templates
  podcastforge: {
    name: "صانع البودكاست",
    description: "إنتاج صوتي وبصري متكامل لحلقات البودكاست بجودة عالية.",
  },
  veggietalkcreator: {
    name: "صانع فيديوهات الخضار الناطقة",
    description: "محتوى فيرال للخضار والفواكه الناطقة على المنصات.",
  },
  youtubethumbnailpro: {
    name: "محترف ثامبنيلز يوتيوب",
    description: "ثامبنيلز يوتيوب جاذبة للنقر بأسلوب صانعي المحتوى الكبار.",
  },
  alternaterealityvisionist: {
    name: "رؤى الواقع البديل",
    description: "تحويل صورك إلى نسخ من عوالم موازية مذهلة.",
  },
  cineframeanimator: {
    name: "محرّك اللقطات السينمائية",
    description: "تحويل أي صورة إلى لقطة متحركة سينمائية واقعية.",
  },
  sunoprompterpro: {
    name: "محترف برومبتات Suno",
    description: "صياغة برومبتات احترافية لتوليد موسيقى بـ Suno.",
  },
  brainrotforge: {
    name: "صانع البرين روت",
    description: "محتوى تيك توك إدماني بأسلوب البرين روت الفيرال.",
  },
  paradoxloomagent: {
    name: "وكيل المفارقات",
    description: "استشاري عالي المستوى يربط نواياك بحلول دقيقة.",
  },
  emailcontentmaestro: {
    name: "خبير محتوى البريد الإلكتروني",
    description: "صياغة رسائل إيميل مقنعة ومخصصة لعلامتك التجارية.",
  },
  personalassistantpro: {
    name: "المساعد الشخصي الاحترافي",
    description: "مساعد ذكي يتذكر تفضيلاتك ويرتب مهامك اليومية.",
  },
  pettranslatorbot: {
    name: "مترجم لغة الحيوانات الأليفة",
    description: "ترجمة تعبيرات حيوانك الأليف ومساعدتك على التواصل معه.",
  },
  captioncrafterpro: {
    name: "صانع الكابشن الاحترافي",
    description: "كابشن متناسق مع علامتك لكل صورة أو فيديو.",
  },
  monkeyvlogbot: {
    name: "بوت فلوغ القرود",
    description: "محتوى مرح بشخصيات القرود لمنصات الفيديو القصيرة.",
  },
  monkeycommentarybot: {
    name: "بوت تعليقات القرود",
    description: "تعليقات ذكية ومرحة بأسلوب القرود الناقدة.",
  },
  facelesstubearchitect: {
    name: "مهندس قنوات يوتيوب بدون وجه",
    description: "بناء وكتابة وتحسين قنوات يوتيوب بدون ظهور.",
  },
  redditstoryvideomaker: {
    name: "صانع فيديوهات قصص ريديت",
    description: "تحويل قصص ريديت إلى فيديوهات منتجة بالكامل.",
  },
  comicstripcrafter: {
    name: "صانع القصص المصورة",
    description: "قصص مصورة بشخصيات ثابتة على عدة لوحات بأسلوب احترافي.",
  },
  startupideaarchitect: {
    name: "مهندس أفكار الستارت أب",
    description: "صقل وتحقق فكرتك التجارية بمنهجية ومستوى استشاري.",
  },
  gourmetguide: {
    name: "دليل الطهاة",
    description: "وصفات شخصية ومتنوعة تتناسب مع ذوقك ومتطلباتك.",
  },
  celebrityselfiestudio: {
    name: "استوديو سيلفي المشاهير",
    description: "سيلفي واقعي مع المشاهير بإضاءة وزوايا احترافية.",
  },
  viralreelideaalchemist: {
    name: "كيميائي أفكار الريلز الفيرال",
    description: "أفكار ريلز فيرال جاهزة للتنفيذ مبنية على علامتك.",
  },
  aijudge: {
    name: "القاضي الذكي",
    description: "حكم سريع وممتع في النزاعات والنقاشات بأسلوب طريف.",
  },
  brutallyhonestbot: {
    name: "بوت الصراحة المطلقة",
    description: "إجابات صريحة بدون فلاتر أو تجميل.",
  },
  innervoicelens: {
    name: "عدسة الصوت الداخلي",
    description: "ارفع صورة واحصل على مونولوج داخلي ساخر للشخص فيها.",
  },
  realityvsexpectationsbot: {
    name: "بوت التوقع مقابل الواقع",
    description: "كابشن فيرال بأسلوب «التوقع vs الواقع» من صورك.",
  },
  foodmoodgenie: {
    name: "جني المزاج الغذائي",
    description: "أخبره بمزاجك ويرشح لك الطعام والوصفة المناسبة.",
  },
  cinematicselfiemaker: {
    name: "صانع السيلفي السينمائي",
    description: "سيلفي بأسلوب الكاميرات الأمامية السينمائية الفاخرة.",
  },
  futurescope: {
    name: "ناظور المستقبل",
    description: "تنبؤات ممتعة بمستقبلك بناءً على شخصيتك واهتماماتك.",
  },
  miniaturehistorymaestro: {
    name: "خبير التاريخ المصغر",
    description: "قصص تاريخية لأي قطعة أثرية أو صورة قديمة.",
  },
  tshirtdesigner: {
    name: "مصمم تيشيرتات",
    description: "تصميم تيشيرتات بجودة طباعة عالية من برومبت نصي.",
  },
  seedancecompanion20: {
    name: "رفيق Seedance 2.0",
    description: "تجهيز برومبتات مثالية لتوليد فيديوهات Seedance.",
  },
  streetwiseinterviewbot: {
    name: "بوت مقابلات الشارع",
    description: "مراسل ميداني يجري مقابلات شارع جذابة وممتعة.",
  },
  memesmithai: {
    name: "حداد الميمز",
    description: "صناعة ميمز بدقة وأسلوب يتماشى مع الترند.",
  },
  claudecraftagent: {
    name: "وكيل ClaudeCraft",
    description: "استشاري متعدد المهارات لتنفيذ مشاريعك الإبداعية.",
  },
  cineforgesceneartisan: {
    name: "حرفي مشاهد سينمائية",
    description: "صياغة مشاهد سينمائية بمعايير الإنتاج الكبيرة.",
  },
  viralreelbuilder1: {
    name: "صانع ريلز فيرال",
    description: "تحويل فكرتك إلى ريل قصير فيرال بسكريبت ولقطات وكابشن.",
  },
  nanobananaultimatearchitect: {
    name: "مهندس نانو بنانا الأمثل",
    description: "تصميم وتعديل وتحويل الصور بدقة عالية بنانو بنانا.",
  },
};

// ── Field-name translations ───────────────────────────────────────
// Maps common MuAPI input field keys → Arabic labels. Used by the
// template runner so the auto-generated form reads natively.
export const FIELD_AR: Record<string, string> = {
  prompt:           "الوصف النصي",
  negative_prompt:  "ما يجب تجنّبه",
  image_url:        "الصورة",
  image:            "الصورة",
  image_url_2:      "صورة إضافية",
  image_url_3:      "صورة ثالثة",
  reference_image:  "صورة مرجعية",
  reference_image_url: "صورة مرجعية",
  source_image:     "الصورة المصدر",
  source_image_url: "الصورة المصدر",
  start_image:      "الإطار الأول",
  end_image:        "الإطار الأخير",
  video_url:        "الفيديو",
  audio_url:        "الملف الصوتي",
  audio:            "الملف الصوتي",
  text:             "النص",
  title:            "العنوان",
  caption:          "الكابشن",
  description:      "الوصف",
  voice:            "الصوت",
  voice_id:         "الصوت",
  language:         "اللغة",
  duration:         "المدة (ثوانٍ)",
  duration_seconds: "المدة (ثوانٍ)",
  aspect_ratio:     "نسبة الأبعاد",
  ratio:            "نسبة الأبعاد",
  resolution:       "الدقة",
  width:            "العرض",
  height:           "الارتفاع",
  seed:             "البذرة (Seed)",
  steps:            "عدد الخطوات",
  guidance:         "قوة التوجيه",
  guidance_scale:   "قوة التوجيه",
  cfg:              "قوة التوجيه",
  cfg_scale:        "قوة التوجيه",
  num_outputs:      "عدد المخرجات",
  num_images:       "عدد الصور",
  style:            "النمط",
  model:            "الموديل",
  upscale:          "التحسين",
  scale:            "معامل التكبير",
  format:           "الصيغة",
  output_format:    "صيغة المخرج",
  fps:              "عدد الإطارات/ث",
  speed:            "السرعة",
  pitch:            "الحدة الصوتية",
  stability:        "الثبات الصوتي",
  similarity:       "تطابق الصوت",
  clarity:          "الوضوح",
  style_strength:   "قوة النمط",
  background:       "الخلفية",
  lighting:         "الإضاءة",
  product_name:     "اسم المنتج",
  brand:            "العلامة التجارية",
  garment:          "قطعة الملابس",
  garment_image:    "صورة الملابس",
  garment_image_url:"صورة الملابس",
  person_image:     "صورة الشخص",
  person_image_url: "صورة الشخص",
};

export function tField(key: string): string {
  return FIELD_AR[key] ?? key.replace(/_/g, " ");
}

export function tTemplate(id: string, fallback?: { name?: string; description?: string }) {
  const ar = TEMPLATE_AR[id];
  return {
    name:        ar?.name        ?? fallback?.name        ?? "قالب",
    description: ar?.description ?? fallback?.description ?? "",
  };
}

export function tAgent(slug: string, fallback?: { name?: string; description?: string }) {
  const ar = AGENT_AR[slug];
  return {
    name:        ar?.name        ?? fallback?.name        ?? "وكيل",
    description: ar?.description ?? fallback?.description ?? "",
  };
}
