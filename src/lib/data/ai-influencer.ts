// ════════════════════════════════════════════════════════════════
// AI Influencer Studio — character-builder data layer
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's `/ai-influencer-studio` page 1:1:
//   • 4 panels: Core (always visible) + Face / Body / Style (advanced)
//   • 22 subcategories, 143 individual options
//   • Compose function turns the picked options into a single English
//     prompt that gets fed to nano-banana-pro
//
// The schema and option lists were extracted from the reference
// platform's live picker (TanStack Query cache walk). Full cited
// data lives privately under docs/reference-research/04_STUDIOS/ai-influencer.md.
//
// Each option is just a label string — no UUID needed because we're
// composing a prompt, not calling the reference's UUID-keyed backend.

import type { LucideIcon } from "lucide-react";
import {
  User, Sparkles, Eye, Smile, Ear, Hand, Footprints,
  Scissors, Palette, Image as ImageIcon, Heart, Skull,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

/** A single subcategory like "Character Type" or "Eye Color". */
export interface InfluencerSubcategory {
  /** Stable id used in the config object the picker writes to. */
  id:          string;
  /** Arabic display name. */
  name:        string;
  /** English label shown under the Arabic name. */
  englishName: string;
  /** Optional one-liner help text shown under the title. */
  hint?:       string;
  /** "single" = pick one (radio); "multi" = pick zero-or-more (chips). */
  selection:   "single" | "multi";
  /** Allowed option labels — these are the strings that get baked into
   *  the composed prompt. */
  options:     InfluencerOption[];
  /** When true, the subcategory is shown collapsed by default (advanced). */
  advanced?:   boolean;
  /** Visual style hint for the renderer. "card" = big square thumbnail
   *  card (default for visual-rich categories like skin/eye color, body
   *  type, hair). "chip" = compact text pill (default for everything
   *  else). */
  display?:    "card" | "chip";
}

/** A single option inside a subcategory. The renderer uses
 *  `thumbnail` > `swatch` > label-only in that order. */
export interface InfluencerOption {
  id:        string;
  label:     string;
  /** Proxied Higgsfield CDN URL for the option thumbnail. */
  thumbnail?: string;
  /** Solid hex color — used for skin / eye color swatches. */
  swatch?:   string;
}

/** A panel groups related subcategories. */
export interface InfluencerPanel {
  id:          "core" | "face" | "body" | "style";
  name:        string;
  englishName: string;
  icon:        LucideIcon;
  /** Total option count across all subcategories — for the header chip. */
  count:       number;
  subcategories: InfluencerSubcategory[];
}

/** Output: the picked-options config the user assembles in the UI.
 *  Keys match `InfluencerSubcategory.id`; values are the picked option
 *  ids. Multi-select subcategories store `string[]`. */
export type InfluencerConfig = Record<string, string | string[] | undefined>;

// ── Helper for option lists ────────────────────────────────────────
// ── Thumbnail map (UUIDs from Higgsfield's CDN, proxied) ────────────
//
// Every entry maps a key (which we look up by `${subcategoryId}.${optionId}`
// OR by raw uuid lookup) to a UUID we proxy via /api/cdn/c/. The
// catalog came from Higgsfield's production bundle.

const TH_BASE = "/api/cdn/c/ai_influencer_option";

/** UUID → option key lookup for the 116 thumbnails we have. */
const TH: Record<string, string> = {
  // Character Type (12 of 13)
  "ct.human":         "977e0927-1320-426b-9de3-e3a3434dbe7a",
  "ct.ant":           "d950aa8c-7f58-4277-9f7c-a4c0f073ae99",
  "ct.bee":           "20b90c9f-d11f-4816-ad7d-f7f388a5a8b0",
  "ct.octopus":       "cf21cfdb-7f25-49b2-8554-2192046aac83",
  "ct.crocodile":     "79073855-12ba-4339-85ce-dc99ecf4d14c",
  "ct.iguana":        "5c237648-205d-484d-80e6-baa1c71d9b17",
  "ct.lizard":        "039958ce-ec7c-465f-a285-935802b2525d",
  "ct.alien":         "077efffe-f459-4dd2-a5a7-064caeca5c10",
  "ct.beetle":        "704f1cb5-f833-4758-9f99-ba9fe6e2ed53",
  "ct.reptile":       "cd38cb79-b638-43f3-b546-d31849b6fe05",
  "ct.amphibian":     "d0667019-3b2f-41f6-a09c-5461a5c5b7e0",
  "ct.elf":           "f5e66aec-8b11-48b0-904b-6c84eb07349e",
  "ct.mantis":        "feb723e6-fed4-4e6b-965d-38f50ac4f8d6",
  // Ethnicity (5 of 6 — Asian missing on Higgsfield's side too)
  "eo.african":         "22d1da5f-5581-4030-9a14-c8dc61c40abc",
  "eo.european":        "b92e05ee-79a1-4c22-ba32-400c17eb9df3",
  "eo.indian":          "35cff943-7efb-40cd-a168-dbb1f7cdbebb",
  "eo.middle-eastern":  "0f49e0cd-7b30-4bb3-94c5-792d684a4492",
  "eo.mixed":           "a992a191-6c13-46e2-991d-f5219b1f5f09",
  // Eye Color (12 of 13)
  "ec.black":       "cc87aaa5-568e-4485-ad17-925378e14040",
  "ec.purple":      "6cb9d132-30d8-4325-83f5-10e8094e85a7",
  "ec.green":       "dba6cbbb-557a-4d71-b5ab-720b5791282c",
  "ec.white":       "e6c522cd-c482-44d5-b0fd-d938ac3cdc4e",
  "ec.brown":       "67ef9f67-0c21-4d78-8044-561792277b4f",
  "ec.solid-void":  "5cbd08f7-8c6a-48c4-aa93-d796fe97b8ec",
  "ec.blind-empty": "72969f70-ed33-4f69-ae34-61df12f24dda",
  "ec.deep-brown":  "3bc13ca9-defe-4fea-a473-2a6e17cbc521",
  "ec.blue":        "15e8f960-c44b-43ae-aafb-4fd79556c420",
  "ec.amber":       "4fa90e64-f060-4407-9d1f-ed8b23723c46",
  "ec.red":         "0f422982-0f63-460e-a459-2a2fd48f6ee0",
  "ec.grey":        "cdfa6a1f-c914-44c9-afea-0a0771feeb54",
  // Skin Conditions (9 of 9)
  "sc.vitiligo":     "bf0f7520-a41a-46b9-b41c-7dc030c22b8b",
  "sc.pigmentation": "a9e6b3c8-9ab5-4fe3-8b99-5c5fbfa9665c",
  "sc.freckles":     "a657e9c1-02b6-4083-a058-5f78e56a77ac",
  "sc.birthmarks":   "4210a458-66a4-4850-a0ec-5ae20f2214e8",
  "sc.scars":        "9d28dcde-2709-4fa8-8f61-8a76798b0e1f",
  "sc.burns":        "427cee67-8074-4640-ba06-51e4a5bf7ee3",
  "sc.albinism":     "6069e93f-31ce-4840-8e48-c81daee56be0",
  "sc.cracked":      "e0fd17ab-f4bd-4950-9fdf-691a98b021c3",
  "sc.wrinkled":     "26f07d76-57a7-4975-b18b-80a5fa2137c5",
  // Eyes Type (3 of 3)
  "et.human":       "ce3bb1ff-d120-4539-8aea-51bacb9e96f9",
  "et.reptile":     "76b1c85d-dba3-43d6-b6b0-27f2923bdab8",
  "et.mechanical":  "6d7dfd84-741d-4757-9bab-a3ff7cb28612",
  // Eyes Details (4 of 4)
  "ed.different-colors": "199bb0e7-41e8-40af-aae7-77c0c659b260",
  "ed.blind":            "a1b256a6-45a1-4008-adff-fb0fa1b52c30",
  "ed.scarred":          "25f40e63-e0b8-4470-aac8-b3b00465f0ac",
  "ed.glowing":          "a6a19585-e8ae-4b5b-8334-f0f24248735d",
  // Mouth & Teeth (7 of 7)
  "mt.small-mouth":     "739d39d2-acc7-44b5-82e9-4d3c7bd8a1cc",
  "mt.large-mouth":     "1baa22a5-87fe-49ce-8094-a35669ae367a",
  "mt.no-teeth":        "dad0081e-4011-4420-9a95-6a9b96e5c8d9",
  "mt.different-teeth": "517e33c9-82ff-4de3-9d38-8205b26e0985",
  "mt.sharp-teeth":     "d44ff654-3b53-4f44-bf54-1c8d0d5c4291",
  "mt.forked-tongue":   "adb9bb83-1db6-41cc-9933-bae88b72739d",
  "mt.two-tongues":     "43aeb851-4c2e-4c3b-b556-21b425eefc75",
  // Ears (3 of 4 — Wing Ears not in Higgsfield's catalog)
  "ea.human":      "d7a9fd58-5eb3-4e3f-ad56-67bbf3655463",
  "ea.elf":        "e9b3d421-6cfb-41f9-af4a-fc3649238b91",
  "ea.no-ears":    "562abb29-5f61-4485-83e5-470797a8e591",
  // Horns (3 of 3)
  "ho.small":   "9664d380-e818-418e-a42d-f5bf4f1dc19a",
  "ho.big":     "4a4792eb-215a-4d78-b294-3f0e6bd54c04",
  "ho.antlers": "a7c647b3-c37b-4ecb-a61f-52442e1cad89",
  // Face Skin Material (6 of 6)
  "fm.human":     "34d672df-7b82-4b08-b298-4e484ee2d8a2",
  "fm.scales":    "dfb106df-8549-4758-a9fe-d405f956dc13",
  "fm.fur":       "b041790f-27b1-491e-900a-df7b44b0c0c3",
  "fm.amphibian": "e471f0b4-7a41-4999-bc8d-9f9f6e030e4c",
  "fm.fish":      "a349307d-dad9-4e4d-98ec-cd84094067a7",
  "fm.metallic":  "cde0fbeb-0556-4881-9e9e-1d4c5a5cf067",
  // Face Surface Pattern (6 of 7 — cowhide missing on Higgsfield's side too)
  "fp.solid":   "6eb4dcc1-340e-431a-aa43-d0bb65c5a663",
  "fp.stripes": "552e411d-50e7-4059-9417-4029209e2ce7",
  "fp.spots":   "76956a73-32c1-4997-873d-a14611b5c5ce",
  "fp.chess":   "13a86fbf-bdac-4e0b-9119-6e1932cf9986",
  "fp.veins":   "2ae5db69-112d-497b-9b7b-ea63c0a2cc87",
  "fp.giraffe": "9919ff37-6261-454d-a26e-40cc5d8d7e53",
  // Body Type (7 of 7)
  "bt.slim":     "dadf681a-d007-4ac7-96f0-cb14673687b5",
  "bt.lean":     "142ea702-6816-4933-8f42-4b65cade3a8c",
  "bt.athletic": "d077688b-6a9a-4cb5-9bfb-b62c06fc7f2b",
  "bt.muscular": "16b7cb85-e2b6-42ac-8d22-30edb28d8eb2",
  "bt.curvy":    "2bb2fe58-8099-4d62-97f5-5742e564a31f",
  "bt.heavy":    "c6198edf-f21d-4e3e-9ac5-d4a3333ceb6f",
  "bt.skinny":   "b8109486-db80-4bef-b2c6-3f823cde5eb7",
  // Left Arm (6 of 6 — "cute" mapped to the "pink prosthetic" preview)
  "la.normal":     "d8b70b8b-07fe-4056-b654-40144f0abf13",
  "la.cute":       "2896f074-69bb-4ac7-be86-7203c33ac5b6",
  "la.robotic":    "f168d95a-5744-46d7-ac2f-039a0e7d78ff",
  "la.prosthetic": "da1534dc-1166-44e6-8f38-8c7d5f172fa8",
  "la.mechanical": "335cc7d7-a1bc-45d0-9d35-f897c081d60b",
  "la.none":       "a9c17f68-ee40-450b-9f82-4cce5b7d4ccc",
  // Right Arm (6 of 6)
  "ra.normal":     "030fe9e3-b4b6-490b-a1fa-163680682b89",
  "ra.cute":       "259eac0d-f054-4b09-9101-f09934d07663",
  "ra.robotic":    "1e0fdb91-e757-419e-9f40-250b084904cc",
  "ra.prosthetic": "d1db6a3f-cbfd-43f8-97ab-002341774488",
  "ra.mechanical": "4bcab738-e4b9-4831-9612-c3263ce9cbae",
  "ra.none":       "764b52a2-006b-46e0-a649-5c71e8cd9915",
  // Left Leg (6 of 6)
  "ll.normal":     "eb416e7d-63c5-40df-86a9-6787c5784ef5",
  "ll.cute":       "5d927e55-999a-4319-90de-4723bed162fb",
  "ll.robotic":    "1daebe83-c57e-4594-b6e0-f35b1608fbdd",
  "ll.prosthetic": "d7e4fbd7-4eed-497d-b627-9b50adc1d1fd",
  "ll.mechanical": "a709b1c0-7f65-42dd-b24c-a81f3ca4d666",
  "ll.none":       "2137532d-0b3b-4c60-8930-f608135c73c2",
  // Right Leg (6 of 6)
  "rl.normal":     "61905af5-e21a-48d9-90ad-b87d47d6858b",
  "rl.cute":       "4d22f534-f865-49a4-9327-dfd082b0fb79",
  "rl.robotic":    "475314c9-5b3e-4c60-a14d-fffda3c5c852",
  "rl.prosthetic": "9d2bda1f-bd7e-4acb-9c17-87e8528efa1d",
  "rl.mechanical": "e8e31345-3d33-4608-ab56-87ce4d185d77",
  "rl.none":       "5b3674c7-0c91-4af4-b9c2-e0c352466c01",
  // Hair (8 of 8)
  "ha.bald":      "ca8b2954-900c-424f-9fda-acc5c37d58dd",
  "ha.short":     "383399be-fe36-4196-9b45-f328cf40eb1e",
  "ha.long":      "9145dee8-7136-4ee9-a464-20268fed4a37",
  "ha.afro":      "7fc8fcc7-310f-406c-94c2-c4fc56568d40",
  "ha.punk":      "a6555ba9-bd9b-4839-898d-3758e9788d18",
  "ha.fur":       "1de2b775-27ed-4465-a930-f8cb2d73bd9f",
  "ha.tentacles": "b3c8c28b-c19d-49bf-8223-42a5e3a66edb",
  "ha.spines":    "35fd3acc-eda0-4b00-a19a-32ad85ce7766",
  // Accessories (5 of 5)
  "ac.tattoos":        "2c4a9764-5449-4c78-a5c1-d6b13034d222",
  "ac.piercing":       "587f72de-6688-441a-8696-77bd251fa138",
  "ac.scarification":  "855ceb60-0637-4266-909b-2713bb459da7",
  "ac.symbols":        "3bdb0c00-765a-4405-b037-bd064c39309c",
  "ac.cyber-markings": "123f2efe-cd4b-42a9-89e7-db1a49ebf089",
};

const opt = (id: string, label: string): InfluencerOption => ({ id, label });
/** Option helper with a swatch hex — used for skin/eye color. */
const optS = (id: string, label: string, swatch: string): InfluencerOption =>
  ({ id, label, swatch });
/** Option helper with a real Higgsfield thumbnail. The key is one of
 *  the TH map keys (e.g. "ct.human" / "ec.black"). */
const optT = (id: string, label: string, thumbKey: string): InfluencerOption => {
  const uuid = TH[thumbKey];
  return uuid
    ? { id, label, thumbnail: `${TH_BASE}/${uuid}.webp` }
    : { id, label };
};

// ── Panel 1 — Core (always visible, 7 subcategories, 61 options) ──
const CORE_SUBS: InfluencerSubcategory[] = [
  {
    id:        "character_type",
    name:      "نوع الشخصية",
    englishName: "Character Type",
    selection: "single",
    display:   "card",
    options: [
      optT("human",     "Human",     "ct.human"),
      optT("ant",       "Ant",       "ct.ant"),
      optT("bee",       "Bee",       "ct.bee"),
      optT("octopus",   "Octopus",   "ct.octopus"),
      optT("crocodile", "Crocodile", "ct.crocodile"),
      optT("iguana",    "Iguana",    "ct.iguana"),
      optT("lizard",    "Lizard",    "ct.lizard"),
      optT("alien",     "Alien",     "ct.alien"),
      optT("beetle",    "Beetle",    "ct.beetle"),
      optT("reptile",   "Reptile",   "ct.reptile"),
      optT("amphibian", "Amphibian", "ct.amphibian"),
      optT("elf",       "Elf",       "ct.elf"),
      optT("mantis",    "Mantis",    "ct.mantis"),
    ],
  },
  {
    id:        "gender",
    name:      "النوع",
    englishName: "Gender",
    selection: "single",
    options: [
      opt("female",     "Female"),
      opt("male",       "Male"),
      opt("trans-man",  "Trans man"),
      opt("trans-woman","Trans woman"),
      opt("non-binary", "Non-binary"),
    ],
  },
  {
    id:        "ethnicity_origin",
    name:      "الأصل العرقي",
    englishName: "Ethnicity / Origin Base",
    selection: "single",
    display:   "card",
    options: [
      optT("african",       "African",        "eo.african"),
      opt ("asian",         "Asian"),
      optT("european",      "European",       "eo.european"),
      optT("indian",        "Indian",         "eo.indian"),
      optT("middle-eastern","Middle Eastern", "eo.middle-eastern"),
      optT("mixed",         "Mixed",          "eo.mixed"),
    ],
  },
  {
    id:        "skin_color",
    name:      "لون البشرة",
    englishName: "Skin Color",
    selection: "single",
    display:   "card",
    options: [
      optS("pitch-black", "Pitch black",    "#0a0a0a"),
      optS("black",       "Black",          "#2b1d12"),
      optS("white",       "White",          "#f3e7da"),
      optS("purple",      "Purple",         "#7a3b9c"),
      optS("brown",       "Brown",          "#6e4a2a"),
      optS("olive",       "Olive",          "#a98152"),
      optS("grey",        "Grey",           "#8b8b8b"),
      optS("green",       "Green",          "#4a8a52"),
      optS("blue",        "Blue",           "#3f6fa3"),
      optS("red",         "Red",            "#a64036"),
      opt ("mixed",       "Mixed colors"),
      opt ("custom",      "Pick own color"),
    ],
  },
  {
    id:        "eye_color",
    name:      "لون العين",
    englishName: "Eye Color",
    selection: "single",
    display:   "card",
    options: [
      optT("black",        "Black",               "ec.black"),
      optT("purple",       "Purple",              "ec.purple"),
      optT("green",        "Green",               "ec.green"),
      optT("white",        "White",               "ec.white"),
      optT("brown",        "Brown",               "ec.brown"),
      optT("solid-void",   "Black (Solid:Void)",  "ec.solid-void"),
      optT("blind-empty",  "White (Blind:Empty)", "ec.blind-empty"),
      optT("deep-brown",   "Deep Brown",          "ec.deep-brown"),
      optT("blue",         "Blue",                "ec.blue"),
      optT("amber",        "Amber",               "ec.amber"),
      optT("red",          "Red",                 "ec.red"),
      optT("grey",         "Grey",                "ec.grey"),
      opt ("custom",       "Pick own color"),
    ],
  },
  {
    id:        "skin_conditions",
    name:      "حالات البشرة",
    englishName: "Skin Conditions",
    hint:      "اختياري — يمكن اختيار أكثر من حالة",
    selection: "multi",
    display:   "card",
    options: [
      optT("vitiligo",    "Vitiligo",          "sc.vitiligo"),
      optT("pigmentation","Pigmentation",      "sc.pigmentation"),
      optT("freckles",    "Freckles",          "sc.freckles"),
      optT("birthmarks",  "Birthmarks",        "sc.birthmarks"),
      optT("scars",       "Scars",             "sc.scars"),
      optT("burns",       "Burns",             "sc.burns"),
      optT("albinism",    "Albinism",          "sc.albinism"),
      optT("cracked",     "Cracked / dry skin","sc.cracked"),
      optT("wrinkled",    "Wrinkled skin",     "sc.wrinkled"),
    ],
  },
  {
    id:        "age",
    name:      "العمر",
    englishName: "Age",
    selection: "single",
    options: [
      opt("adult",  "Adult"),
      opt("mature", "Mature"),
      opt("senior", "Senior"),
    ],
  },
];

// ── Panel 2 — Face (advanced, 7 subcategories, 34 options) ────────
const FACE_SUBS: InfluencerSubcategory[] = [
  {
    id:        "eyes_type",
    name:      "نوع العين",
    englishName: "Eyes — Type",
    advanced:  true,
    selection: "single",
    display:   "card",
    options: [
      optT("human",      "Human",      "et.human"),
      optT("reptile",    "Reptile",    "et.reptile"),
      optT("mechanical", "Mechanical", "et.mechanical"),
    ],
  },
  {
    id:        "eyes_details",
    name:      "تفاصيل العين",
    englishName: "Eyes — Details",
    advanced:  true,
    selection: "multi",
    display:   "card",
    options: [
      optT("different-colors","Different eye colors", "ed.different-colors"),
      optT("blind",           "Blind eye",            "ed.blind"),
      optT("scarred",         "Scarred eye",          "ed.scarred"),
      optT("glowing",         "Glowing eye",          "ed.glowing"),
    ],
  },
  {
    id:        "mouth_teeth",
    name:      "الفم والأسنان",
    englishName: "Mouth & Teeth",
    advanced:  true,
    selection: "multi",
    display:   "card",
    options: [
      optT("small-mouth",     "Small mouth",     "mt.small-mouth"),
      optT("large-mouth",     "Large mouth",     "mt.large-mouth"),
      optT("no-teeth",        "No teeth",        "mt.no-teeth"),
      optT("different-teeth", "Different teeth", "mt.different-teeth"),
      optT("sharp-teeth",     "Sharp teeth",     "mt.sharp-teeth"),
      optT("forked-tongue",   "Forked tongue",   "mt.forked-tongue"),
      optT("two-tongues",     "Two tongues",     "mt.two-tongues"),
    ],
  },
  {
    id:        "ears",
    name:      "الأذنين",
    englishName: "Ears",
    advanced:  true,
    selection: "single",
    display:   "card",
    options: [
      optT("human",    "Human",     "ea.human"),
      optT("elf",      "Elf",       "ea.elf"),
      optT("no-ears",  "No Ears",   "ea.no-ears"),
      opt ("wing",     "Wing Ears"),
    ],
  },
  {
    id:        "horns",
    name:      "القرون",
    englishName: "Horns",
    advanced:  true,
    selection: "single",
    display:   "card",
    options: [
      optT("small",   "Small Horns", "ho.small"),
      optT("big",     "Big Horns",   "ho.big"),
      optT("antlers", "Antlers",     "ho.antlers"),
    ],
  },
  {
    id:        "face_skin_material",
    name:      "خامة جلد الوجه",
    englishName: "Face Skin Material",
    advanced:  true,
    selection: "single",
    display:   "card",
    options: [
      optT("human",      "Human skin",     "fm.human"),
      optT("scales",     "Scales",         "fm.scales"),
      optT("fur",        "Fur",            "fm.fur"),
      optT("amphibian",  "Amphibian skin", "fm.amphibian"),
      optT("fish",       "Fish skin",      "fm.fish"),
      optT("metallic",   "Metallic",       "fm.metallic"),
    ],
  },
  {
    id:        "face_surface_pattern",
    name:      "نمط سطح الوجه",
    englishName: "Surface Pattern",
    advanced:  true,
    selection: "single",
    display:   "card",
    options: [
      optT("solid",     "Solid",           "fp.solid"),
      optT("stripes",   "Stripes",         "fp.stripes"),
      optT("spots",     "Spots",           "fp.spots"),
      optT("chess",     "Chess pattern",   "fp.chess"),
      optT("veins",     "Veins visible",   "fp.veins"),
      optT("giraffe",   "Giraffe pattern", "fp.giraffe"),
      opt ("cowhide",   "Cowhide Pattern"),
    ],
  },
];

// ── Panel 3 — Body (advanced, 5 subcategories, 31 options) ────────
//
// Arms and legs share the same shape but each side has its own
// thumbnails (Higgsfield previews each limb individually). We use
// per-side helpers so the picker shows the correct side's preview.

const armOptions = (side: "la" | "ra"): InfluencerOption[] => [
  optT("normal",     "Normal arm",     `${side}.normal`),
  optT("cute",       "Cute arm",       `${side}.cute`),
  optT("robotic",    "Robotic arm",    `${side}.robotic`),
  optT("prosthetic", "Prosthetic arm", `${side}.prosthetic`),
  optT("mechanical", "Mechanical arm", `${side}.mechanical`),
  optT("none",       "None",           `${side}.none`),
];
const legOptions = (side: "ll" | "rl"): InfluencerOption[] => [
  optT("normal",     "Normal leg",     `${side}.normal`),
  optT("cute",       "Cute leg",       `${side}.cute`),
  optT("robotic",    "Robotic leg",    `${side}.robotic`),
  optT("prosthetic", "Prosthetic leg", `${side}.prosthetic`),
  optT("mechanical", "Mechanical leg", `${side}.mechanical`),
  optT("none",       "None",           `${side}.none`),
];

const BODY_SUBS: InfluencerSubcategory[] = [
  {
    id:        "body_type",
    name:      "طراز الجسم",
    englishName: "Body Type",
    advanced:  true,
    selection: "single",
    display:   "card",
    options: [
      optT("slim",     "Slim",     "bt.slim"),
      optT("lean",     "Lean",     "bt.lean"),
      optT("athletic", "Athletic", "bt.athletic"),
      optT("muscular", "Muscular", "bt.muscular"),
      optT("curvy",    "Curvy",    "bt.curvy"),
      optT("heavy",    "Heavy",    "bt.heavy"),
      optT("skinny",   "Skinny",   "bt.skinny"),
    ],
  },
  {
    id:        "left_arm",
    name:      "الذراع اليسرى",
    englishName: "Left Arm",
    advanced:  true,
    selection: "single",
    display:   "card",
    options:   armOptions("la"),
  },
  {
    id:        "right_arm",
    name:      "الذراع اليمنى",
    englishName: "Right Arm",
    advanced:  true,
    selection: "single",
    display:   "card",
    options:   armOptions("ra"),
  },
  {
    id:        "left_leg",
    name:      "الساق اليسرى",
    englishName: "Left Leg",
    advanced:  true,
    selection: "single",
    display:   "card",
    options:   legOptions("ll"),
  },
  {
    id:        "right_leg",
    name:      "الساق اليمنى",
    englishName: "Right Leg",
    advanced:  true,
    selection: "single",
    display:   "card",
    options:   legOptions("rl"),
  },
];

// ── Panel 4 — Style (advanced, 3 subcategories, 17 options) ───────
const STYLE_SUBS: InfluencerSubcategory[] = [
  {
    id:        "hair",
    name:      "الشعر",
    englishName: "Hair / Head Growth",
    advanced:  true,
    selection: "single",
    display:   "card",
    options: [
      optT("bald",      "Bald",           "ha.bald"),
      optT("short",     "Short hair",     "ha.short"),
      optT("long",      "Long hair",      "ha.long"),
      optT("afro",      "Afro",           "ha.afro"),
      optT("punk",      "Punk hairstyle", "ha.punk"),
      optT("fur",       "Fur",            "ha.fur"),
      optT("tentacles", "Tentacles",      "ha.tentacles"),
      optT("spines",    "Spines",         "ha.spines"),
    ],
  },
  {
    id:        "accessories",
    name:      "إكسسوارات وعلامات",
    englishName: "Accessories & Markings",
    advanced:  true,
    selection: "multi",
    display:   "card",
    options: [
      optT("tattoos",        "Tattoos",            "ac.tattoos"),
      optT("piercing",       "Piercing",           "ac.piercing"),
      optT("scarification",  "Scarification",      "ac.scarification"),
      optT("symbols",        "Symbols / markings", "ac.symbols"),
      optT("cyber-markings", "Cyber markings",     "ac.cyber-markings"),
    ],
  },
  {
    id:        "rendering_style",
    name:      "أسلوب الرسم",
    englishName: "Rendering Style",
    advanced:  true,
    selection: "single",
    options: [
      opt("hyper-realistic","Hyper-realistic"),
      opt("anime",          "Anime"),
      opt("cartoon",        "Cartoon"),
      opt("2d-illustration","2D illustration"),
    ],
  },
];

// ── Final panel list ───────────────────────────────────────────────
//
// Counts equal sum of options across each panel's subcategories — the
// reference platform's totals were 61 / 34 / 31 / 17 → grand total 143.

function countOptions(subs: InfluencerSubcategory[]): number {
  return subs.reduce((s, sub) => s + sub.options.length, 0);
}

export const INFLUENCER_PANELS: InfluencerPanel[] = [
  {
    id:            "core",
    name:          "الأساسي",
    englishName:   "Core",
    icon:          User,
    subcategories: CORE_SUBS,
    count:         countOptions(CORE_SUBS),
  },
  {
    id:            "face",
    name:          "الوجه",
    englishName:   "Face",
    icon:          Eye,
    subcategories: FACE_SUBS,
    count:         countOptions(FACE_SUBS),
  },
  {
    id:            "body",
    name:          "الجسم",
    englishName:   "Body",
    icon:          Hand,
    subcategories: BODY_SUBS,
    count:         countOptions(BODY_SUBS),
  },
  {
    id:            "style",
    name:          "الستايل",
    englishName:   "Style",
    icon:          Palette,
    subcategories: STYLE_SUBS,
    count:         countOptions(STYLE_SUBS),
  },
];

/** Total option count across all panels — should be 143 to match the
 *  reference. Use as a sanity check / display in the UI. */
export const TOTAL_INFLUENCER_OPTIONS = INFLUENCER_PANELS.reduce((s, p) => s + p.count, 0);

// ── Defaults ───────────────────────────────────────────────────────
//
// Sensible "neutral" baseline so the picker isn't empty on first load
// — every shoot picks SOMETHING for the always-visible Core fields.
export const INFLUENCER_DEFAULTS: InfluencerConfig = {
  character_type:    "human",
  gender:            "female",
  ethnicity_origin:  "middle-eastern",
  skin_color:        "olive",
  eye_color:         "deep-brown",
  age:               "adult",
  rendering_style:   "hyper-realistic",
};

// ── Aspect ratio + resolution (matches reference) ─────────────────
//
// Reference defaults to 9:16 portrait at 2K (height × width = 2752 × 1536).

export const INFLUENCER_ASPECTS = [
  { id: "9:16",  label: "9:16 — عمودي",       w: 1536, h: 2752 },
  { id: "1:1",   label: "1:1 — مربع",          w: 2048, h: 2048 },
  { id: "3:4",   label: "3:4 — عمودي قصير",    w: 1536, h: 2048 },
  { id: "4:3",   label: "4:3",                 w: 2048, h: 1536 },
  { id: "16:9",  label: "16:9 — أفقي",         w: 2752, h: 1536 },
] as const;

export const INFLUENCER_RESOLUTIONS = [
  { id: "2k", label: "2K — موصى به", recommended: true },
  { id: "4k", label: "4K — أعلى جودة"                  },
] as const;

// ── Prompt composer ────────────────────────────────────────────────
//
// Turns the structured config into a richly-templated English prompt.
// Order matters: subject definition → physical traits → finishing
// cues. We follow the same recipe the reference's docs noted:
//
//   "A {age} {character_type} {gender} of {ethnicity_origin} origin
//    with {skin_color} {face_skin_material} skin and {face_surface_pattern}
//    pattern, {eye_color} {eyes_type} eyes, {mouth}, {ears} ears,
//    {hair} hair, {body_type} build, {left_arm} left arm and
//    {right_arm} right arm, {accessories}, rendered in {rendering_style}
//    style"

function lookup(panels: InfluencerPanel[], subId: string, optId?: string | string[]): string | undefined {
  if (!optId) return undefined;
  for (const panel of panels) {
    const sub = panel.subcategories.find((s) => s.id === subId);
    if (!sub) continue;
    if (Array.isArray(optId)) {
      const labels = optId
        .map((id) => sub.options.find((o) => o.id === id)?.label)
        .filter((l): l is string => !!l);
      return labels.length > 0 ? labels.join(", ") : undefined;
    }
    return sub.options.find((o) => o.id === optId)?.label;
  }
  return undefined;
}

export function composeInfluencerPrompt(config: InfluencerConfig): string {
  const get = (subId: string) => lookup(INFLUENCER_PANELS, subId, config[subId]);

  const charType  = get("character_type")    ?? "human";
  const gender    = get("gender")            ?? "female";
  const age       = get("age")               ?? "adult";
  const ethnicity = get("ethnicity_origin");
  const skinColor = get("skin_color");
  const skinMat   = get("face_skin_material");
  const surface   = get("face_surface_pattern");
  const eyeColor  = get("eye_color");
  const eyesType  = get("eyes_type");
  const eyesDet   = get("eyes_details");
  const mouth     = get("mouth_teeth");
  const ears      = get("ears");
  const horns     = get("horns");
  const hair      = get("hair");
  const body      = get("body_type");
  const leftArm   = get("left_arm");
  const rightArm  = get("right_arm");
  const leftLeg   = get("left_leg");
  const rightLeg  = get("right_leg");
  const accessories = get("accessories");
  const skinCond  = get("skin_conditions");
  const render    = get("rendering_style") ?? "hyper-realistic";

  // Build the noun-phrase subject. We adapt the language to make the
  // sentence read well even when many fields are empty.
  const subject = `A ${age.toLowerCase()} ${charType.toLowerCase()} ${gender.toLowerCase()}` +
    (ethnicity ? ` of ${ethnicity} origin` : "");

  const skinFragments: string[] = [];
  if (skinColor) skinFragments.push(`${skinColor.toLowerCase()} skin`);
  if (skinMat && skinMat !== "Human skin") skinFragments.push(`${skinMat.toLowerCase()} texture`);
  if (surface && surface !== "Solid") skinFragments.push(`${surface.toLowerCase()} pattern`);
  if (skinCond) skinFragments.push(`with ${skinCond.toLowerCase()}`);
  const skinPart = skinFragments.length > 0 ? `, ${skinFragments.join(", ")}` : "";

  const eyeFragments: string[] = [];
  if (eyeColor) eyeFragments.push(`${eyeColor.toLowerCase()}`);
  if (eyesType && eyesType !== "Human") eyeFragments.push(`${eyesType.toLowerCase()}-type`);
  const eyePart = eyeFragments.length > 0
    ? `, ${eyeFragments.join(" ")} eyes${eyesDet ? ` (${eyesDet.toLowerCase()})` : ""}`
    : "";

  const featurePieces: string[] = [];
  if (mouth)  featurePieces.push(mouth.toLowerCase());
  if (ears && ears !== "Human") featurePieces.push(`${ears.toLowerCase()} ears`);
  if (horns)  featurePieces.push(horns.toLowerCase());
  if (hair)   featurePieces.push(`${hair.toLowerCase()} hair`);
  const featurePart = featurePieces.length > 0 ? `, ${featurePieces.join(", ")}` : "";

  const bodyPieces: string[] = [];
  if (body) bodyPieces.push(`${body.toLowerCase()} build`);
  if (leftArm  && leftArm  !== "Normal arm") bodyPieces.push(`${leftArm.toLowerCase()} (left)`);
  if (rightArm && rightArm !== "Normal arm") bodyPieces.push(`${rightArm.toLowerCase()} (right)`);
  if (leftLeg  && leftLeg  !== "Normal leg") bodyPieces.push(`${leftLeg.toLowerCase()} (left leg)`);
  if (rightLeg && rightLeg !== "Normal leg") bodyPieces.push(`${rightLeg.toLowerCase()} (right leg)`);
  const bodyPart = bodyPieces.length > 0 ? `, ${bodyPieces.join(", ")}` : "";

  const accessoryPart = accessories ? `, ${accessories.toLowerCase()}` : "";

  // Finishing cues — enforce portrait composition + high quality.
  const finishing =
    `, rendered in ${render.toLowerCase()} style. ` +
    "Professional portrait composition, three-quarter framing, head and upper body, " +
    "natural studio lighting, ultra-detailed, sharp focus, 8K finishing. " +
    "No text, no watermarks, no logos.";

  return subject + skinPart + eyePart + featurePart + bodyPart + accessoryPart + finishing;
}

// ── Cost ──────────────────────────────────────────────────────────
//
// The reference platform charges 200 credits per AI Influencer
// generation regardless of res/aspect. We mirror that flat rate.
export const INFLUENCER_COST = 12;          // 12 credits — about 6× cheaper
                                             // than the reference for early demand.

// ── Yilow-original starter presets ────────────────────────────────
// Two hand-tuned influencer configs we ship as one-click quick-start
// options in the left sidebar of /ai-influencer. They're Yilow-
// original characters (not from any other platform).
//
// • Onyx   — confident male, urban editorial, mid-30s
// • Skyler — radiant female, soft fashion, mid-20s
//
// The InfluencerStudio reads `INFLUENCER_PRESETS` on mount and shows
// each preset as a thumbnail card with "Load" → applies the config
// to the picker form.

export interface InfluencerPreset {
  id:         string;
  name:       string;
  nameAr:     string;
  /** One-line vibe description shown under the name. */
  tagline:    string;
  /** Public thumbnail URL — we host these in /public/influencer-presets/. */
  thumbnail:  string;
  /** Full picker config the preset loads into. */
  config:     InfluencerConfig;
}

export const INFLUENCER_PRESETS: InfluencerPreset[] = [
  {
    id:        "onyx",
    name:      "Onyx",
    nameAr:    "أونيكس",
    tagline:   "Confident male · urban editorial · mid-30s",
    thumbnail: "/influencer-presets/onyx.png",
    config: {
      character_type:    "human",
      gender:            "male",
      ethnicity_origin:  "middle-eastern",
      skin_color:        "tan",
      eye_color:         "deep-brown",
      age:               "adult",
      hair:              "short-black-fade",
      body_type:         "athletic",
      face_skin_material:"matte",
      mouth:             "neutral-firm",
      ears:              "normal",
      accessories:       ["minimal-chain", "watch"],
      rendering_style:   "hyper-realistic",
    },
  },
  {
    id:        "skyler",
    name:      "Skyler",
    nameAr:    "سكايلر",
    tagline:   "Radiant female · soft fashion · mid-20s",
    thumbnail: "/influencer-presets/skyler.png",
    config: {
      character_type:    "human",
      gender:            "female",
      ethnicity_origin:  "mediterranean",
      skin_color:        "olive",
      eye_color:         "hazel",
      age:               "young-adult",
      hair:              "long-brown-wavy",
      body_type:         "slim",
      face_skin_material:"luminous",
      mouth:             "soft-smile",
      ears:              "normal",
      accessories:       ["small-hoop-earrings"],
      rendering_style:   "hyper-realistic",
    },
  },
];

/** Apply a preset on top of an existing config. Preset values win, but
 *  any field the user already customised before clicking the preset
 *  stays only when the preset doesn't override it. */
export function applyInfluencerPreset(
  current: InfluencerConfig,
  preset:  InfluencerPreset,
): InfluencerConfig {
  return { ...current, ...preset.config };
}
