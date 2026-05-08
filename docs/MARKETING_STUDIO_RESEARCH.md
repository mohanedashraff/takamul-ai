# Marketing Studio — Research & Build Plan

> Mapping Higgsfield's `/marketing-studio/product` and `/marketing-studio/app`
> 1‑to‑1 onto Yilow.ai. **Do not start building until the user signs off on this
> doc** — same workflow we used for `SOUL_V2_RESEARCH.md`.

Reference URLs:
- https://higgsfield.ai/marketing-studio/product
- https://higgsfield.ai/marketing-studio/app

---

## 1. The big picture — what Marketing Studio actually is

Higgsfield's Marketing Studio is a **structured, preset‑driven ad video
generator**. Users don't start from a blank prompt — they assemble a shot from
named "presets" that map to specific behaviours of the underlying video model:

```
PRODUCT photo  →  ┐
AVATAR photo   →  ┼──→  FORMAT × HOOK × SETTING  ──→  6–10s vertical/horizontal video ad
PROMPT (opt.)  →  ┘
```

The four pickers (`Format`, `Hook`, `Setting`, plus `Avatar` upload) are the
core of the UX. Each preset is illustrated with a short sample video so the
user knows exactly what they're picking — *show, don't tell*.

There are **two variants** of the studio, switched by the URL path:

| Variant       | URL                                | Subject          | Right column   | Format count        | Has Hook? | Has Setting? |
| ------------- | ---------------------------------- | ---------------- | -------------- | ------------------- | --------- | ------------ |
| **Product**   | `/marketing-studio/product`        | physical product | PRODUCT + AVATAR | 9                 | ✅ yes    | ✅ yes       |
| **App**       | `/marketing-studio/app`            | mobile/web app   | APP + AVATAR     | 1 (UGC only)      | ❌ no     | ❌ no        |

The App variant additionally shows a **Mobile / Desktop** toggle that picks the
device frame for the screencast.

Both variants share the same bottom prompt bar, gallery, generate flow, and
export options.

---

## 2. Higgsfield catalog (scraped 2026‑05)

### 2.1 — `Product` Formats (9 total)

| # | Display name      | Higgsfield slug              | Sample video URL                                                                            |
| - | ----------------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| 1 | UGC               | `ugc`                        | `https://static.higgsfield.ai/marketing-studio-presets/ugc.mp4`                             |
| 2 | Tutorial          | `ugc_how_to`                 | `https://static.higgsfield.ai/marketing-studio-presets/ugc_how_to.mp4`                      |
| 3 | Unboxing          | `ugc_unboxing`               | `https://static.higgsfield.ai/marketing-studio-presets/ugc_unboxing.mp4`                    |
| 4 | Hyper Motion      | `hyper-motion-mini`          | `https://static.higgsfield.ai/marketing-studio-presets/hyper-motion-mini.mp4`               |
| 5 | Product Review    | `product_review`             | `https://static.higgsfield.ai/marketing-studio-presets/product_review.mp4`                  |
| 6 | TV Spot           | `tv-spot-mini`               | `https://static.higgsfield.ai/marketing-studio-presets/tv-spot-mini.mp4`                    |
| 7 | Wild Card         | `wild_card`                  | `https://static.higgsfield.ai/marketing-studio-presets/wild_card.mp4`                       |
| 8 | UGC Virtual Try On| `ugc_virtual_try_on`         | `https://static.higgsfield.ai/marketing-studio-presets/ugc_virtual_try_on.mp4`              |
| 9 | Pro Virtual Try On| `virtual_try_on`             | `https://static.higgsfield.ai/marketing-studio-presets/virtual_try_on.mp4`                  |

The picker's modal title is **"PICK THE FORMAT THAT HITS"**.

### 2.2 — `Product` Hooks (9 captured of likely 20+)

Hooks are short scripted "first‑3‑seconds" actions designed to stop the scroll
on TikTok / Reels. Modal title: **"HOOKS THAT STOP THE SCROLL"**. Tabs: `All`
/ `Stunt` / `Subtle`.

| # | Hook              | Vibe                                                        |
| - | ----------------- | ----------------------------------------------------------- |
| 1 | Product Hit       | Object slams onto the product / product slams into frame    |
| 2 | Spicy             | Suggestive / risqué reveal                                  |
| 3 | Interview         | Person addressing camera, talking‑head intro                |
| 4 | Random Object Mic | Holding a random object as if it were a microphone          |
| 5 | Product Crash     | Product violently crashes into something                    |
| 6 | Blizzard          | Snow/wind blasts past the product                           |
| 7 | Camera Bump       | Sudden camera shake on reveal                               |
| 8 | Product Dodge     | Product dodges an incoming object                           |
| 9 | Epic Fail         | Pratfall / something goes wrong (comedic)                   |

> The list is virtualized in their UI; we couldn't scroll past 9. Higgsfield's
> ad copy implies "20+". When we build, we add the captured 9 first and leave
> the array open — easy to extend later.

### 2.3 — `Product` Settings (14 captured)

Settings are the **environment / location** the shot takes place in. Modal
title: **"SETTINGS THAT SET THE SCENE"**.

| #  | Setting        | Notes                                       |
| -- | -------------- | ------------------------------------------- |
| 1  | Bedroom        | Domestic, lifestyle vibe                    |
| 2  | Airplane Wing  | Travel / adventurous                        |
| 3  | Nature         | Outdoors, hike, organic                     |
| 4  | Roofing        | Rooftop / urban                             |
| 5  | Gym            | Fitness                                     |
| 6  | Volcano Rim    | Dramatic / epic                             |
| 7  | Bathroom       | Beauty / personal care                      |
| 8  | Tiny Reviewer  | Miniature scale gimmick                     |
| 9  | Kitchen        | Food / appliances                           |
| 10 | Car Roof       | On top of a moving car                      |
| 11 | In Car         | POV inside vehicle                          |
| 12 | Street         | Urban candid                                |
| 13 | Office         | Professional / B2B                          |
| 14 | Train Surf     | Riding atop a train (stunt)                 |

### 2.4 — `App` variant differences

- **Format**: only `UGC` is offered. Modal still has the same "PICK THE FORMAT THAT HITS" header but contains a single tile.
- **Hook chip**: removed entirely.
- **Setting chip**: removed entirely.
- **Right column upload slots**: `APP` (replaces "PRODUCT") + `AVATAR`.
- **Extra control**: a `Mobile` / `Desktop` combobox that picks the device chrome for the screencast.
- **Cost**: ~100/156 credits (vs Product's ~90.75) — App variant is slightly more expensive because it composites a device frame.
- **Bottom shoot bar otherwise identical** to Product variant.

### 2.5 — Layout (both variants)

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  Header (Yilow nav)                                             │
 ├─────────────────────────────────────────────────────────────────┤
 │                                                                 │
 │   [ STUDIO TITLE — "Marketing Studio" ]                         │
 │   [ Subtitle / persuasion line                ]                 │
 │                                                                 │
 │   ┌── Gallery / past generations grid ──────────┐               │
 │   │                                             │               │
 │   │  past ad cards…  past ad cards…  past…      │               │
 │   │                                             │               │
 │   └─────────────────────────────────────────────┘               │
 │                                                                 │
 ├─────────────────────────────────────────────────────────────────┤
 │  ┌─ BOTTOM SHOOT BAR (sticky) ─────────────────────────────┐    │
 │  │                                                         │    │
 │  │  [ prompt textarea ]                                    │    │
 │  │                                                         │    │
 │  │  [⊕Product][⊕Avatar][⊕Extras]  [Format▾] [Hook▾]       │    │
 │  │  [Setting▾] [Aspect▾] [Quality▾] [Duration▾]           │    │
 │  │                                                         │    │
 │  │                          ┊                  [Generate] │    │
 │  └─────────────────────────────────────────────────────────┘    │
 └─────────────────────────────────────────────────────────────────┘
```

The right column on Higgsfield is actually **PRODUCT + AVATAR upload slots,
inline in the bar**. It is *not* a separate panel — it lives inside the
shoot bar. (Our existing Yilow component already does this — good.)

---

## 3. Where Yilow stands today (audit)

Files inspected:
- `src/components/marketing/MarketingStudio.tsx`
- `src/lib/data/marketing.ts`
- `src/app/(dashboard)/marketing/page.tsx`
- `src/lib/data/tools.ts` (the `marketing-studio` tool entry)

### What we **already** have ✅

| Feature                        | Status                                                            |
| ------------------------------ | ----------------------------------------------------------------- |
| `/marketing` route             | ✅ wired through the dashboard layout                             |
| Hero + Arabic copy             | ✅ "إعلانات احترافية في دقائق"                                  |
| Sticky bottom shoot bar        | ✅                                                                 |
| Prompt textarea (RTL)          | ✅                                                                 |
| Upload slot — Product image    | ✅ via `uploadFile`                                                |
| Upload slot — Avatar image     | ✅ via `uploadFile`                                                |
| Upload slot — Extras (≤6)      | ✅                                                                 |
| Format dropdown (gallery)      | ✅ portal modal with hover‑play preview videos                     |
| Avatar gallery (8 presets)     | ✅                                                                 |
| Aspect chip                    | ✅ 9:16, 3:4, 1:1, 4:3, 16:9                                       |
| Quality chip                   | ✅ 720p / 1080p                                                    |
| Duration chip                  | ✅ 4–15s                                                           |
| MuAPI integration              | ✅ `seedance-2-vip-omni-reference` / `sd-2-vip-omni-reference-1080p` |
| History persistence            | ✅ `localStorage` (30 items)                                       |
| Fullscreen viewer              | ✅                                                                 |
| Cost preview (credits)         | ✅ inline on the Generate button                                   |

### What's **missing** vs Higgsfield ❌

| Gap                                              | Severity   | Notes                                                      |
| ------------------------------------------------ | ---------- | ---------------------------------------------------------- |
| **Hook picker — entire feature missing**         | 🔴 blocker | No chip, no modal, no data. Required for parity.           |
| **Setting picker — entire feature missing**      | 🔴 blocker | No chip, no modal, no data.                                |
| **Format catalog — only 6 of 9**                 | 🟠 major   | Missing: Wild Card, UGC Virtual Try On, Pro Virtual Try On |
| **App variant route — doesn't exist**            | 🟠 major   | No `/marketing/app` (or equivalent). Need separate flow.   |
| **Mobile/Desktop toggle (App variant only)**     | 🟠 major   | Required for App parity                                    |
| **Variant routing (Product vs App)**             | 🟠 major   | Currently a single page; needs a tab/segment               |
| **Hook & Setting tabs (`All`/`Stunt`/`Subtle`)** | 🟡 minor   | Filter UI inside Hook modal                                |
| **Format modal labels in Arabic**                | 🟡 minor   | Currently mixes Arabic + English; tighten                  |
| **Composing prompt from preset descriptors**     | 🔴 blocker | Once we add Hook+Setting we must compose a final prompt    |
| **Persist Hook & Setting in `MarketingAd`**      | 🟡 minor   | Add to history schema + chip on past cards                 |
| **Higgsfield CDN dependency**                    | 🟡 minor   | We currently link `d3adwkbyhxyrtq.cloudfront.net` directly; should mirror to `/public/marketing/` like Soul did |

### Less obvious gaps

1. **Our format slugs don't match Higgsfield's actual preset slugs.** We use
   `tv-spot`, they use `tv-spot-mini`. We use `ugc`, they use `ugc`. The video
   preset URL we send to MuAPI's `video_files: [...]` field probably needs to
   be the *exact* Higgsfield CDN URL for that preset to behave correctly. We
   should normalize on the Higgsfield slug as the canonical id.

2. **The `images_list` order matters.** Higgsfield's omni‑reference model
   appears to use the first image as the *subject* (product) and subsequent
   images as identity references. We currently send `[productImage,
   avatarImage, ...extras]` which is correct, but undocumented. Lock this in
   a comment.

3. **Cost formula** — ours: `ceil(duration * 0.675 * 100)` for 1080p. Higgsfield
   shows ~90 credits for the default 5s/1080p Product. Our formula gives
   `ceil(5 * 0.675 * 100) = 338` — way off. Need to refit either the
   coefficient or the unit (probably we want `90` not `338`).

4. **Generate gate** — Higgsfield requires: prompt OR (product + format).
   Ours requires only `prompt.trim()`. Loosen so a user with product+format
   selected can hit Generate without typing.

---

## 4. Build plan (for user approval)

### 4.1 — Data layer — `src/lib/data/marketing.ts`

Replace current 6‑format array with a richer schema:

```ts
export interface MarketingFormat {
  id: string;                 // matches Higgsfield slug (e.g. "ugc_how_to")
  variant: "product" | "app"; // which studio variant offers it
  name: string;               // Arabic display
  englishName: string;
  desc: string;               // short Arabic
  videoUrl: string;           // local-mirrored from /public/marketing/formats/
}

export interface MarketingHook {
  id: string;
  name: string;       // Arabic
  englishName: string;
  category: "stunt" | "subtle";
  videoUrl: string;
  promptInjection: string;  // appended to user prompt
}

export interface MarketingSetting {
  id: string;
  name: string;       // Arabic
  englishName: string;
  videoUrl: string;
  promptInjection: string;
}

export interface MarketingAvatar { /* unchanged */ }
```

Catalog sizes after this build:
- `MARKETING_FORMATS` — **9 Product** + **1 App** (de‑dup'd UGC) = 10 entries with `variant` field
- `MARKETING_HOOKS` — start with 9 captured, schema supports adding more
- `MARKETING_SETTINGS` — 14 captured

### 4.2 — Asset mirroring

Mirror the Higgsfield CDN files to `/public/marketing/`:

```
/public/marketing/
  formats/
    ugc.mp4
    ugc_how_to.mp4
    ugc_unboxing.mp4
    hyper-motion-mini.mp4
    product_review.mp4
    tv-spot-mini.mp4
    wild_card.mp4
    ugc_virtual_try_on.mp4
    virtual_try_on.mp4
  hooks/
    product_hit.mp4
    spicy.mp4
    interview.mp4
    random_object_mic.mp4
    product_crash.mp4
    blizzard.mp4
    camera_bump.mp4
    product_dodge.mp4
    epic_fail.mp4
  settings/
    bedroom.mp4
    airplane_wing.mp4
    nature.mp4
    roofing.mp4
    gym.mp4
    volcano_rim.mp4
    bathroom.mp4
    tiny_reviewer.mp4
    kitchen.mp4
    car_roof.mp4
    in_car.mp4
    street.mp4
    office.mp4
    train_surf.mp4
```

(Same pattern as Soul — keep us independent of Higgsfield's CDN.)

### 4.3 — Routes

| Route                        | Component               | Notes                            |
| ---------------------------- | ----------------------- | -------------------------------- |
| `/marketing`                 | `<MarketingStudio variant="product" />` | default; redirects from `/marketing/product` |
| `/marketing/app`             | `<MarketingStudio variant="app" />`     | App variant                      |

A small **segmented control** at the top of the page (`Product | App`) lets
users flip between variants without losing prompt/uploads in localStorage.

### 4.4 — UI components to add

- `<HookPicker />` — modal portal mirroring `FormatGalleryDropdown` shape;
  with `All / Stunt / Subtle` tabs.
- `<SettingPicker />` — same shape, no tabs (just a grid).
- `<DeviceFrameChip />` — visible only when `variant === "app"`. Two values:
  Mobile / Desktop.
- Reuse `<FormatGalleryDropdown>` for both variants — pass it the filtered
  catalog: `MARKETING_FORMATS.filter(f => f.variant === variant)`.

### 4.5 — Prompt composition

When the user has selected Format + Hook + Setting, the final prompt sent to
MuAPI becomes:

```
{user prompt}.
{hook.promptInjection}.
Set in {setting.englishName}: {setting.promptInjection}.
{format.desc} style.
```

This gives the omni‑reference model meaningful guidance without forcing the
user to write that themselves.

### 4.6 — `MarketingAd` history schema additions

```ts
interface MarketingAd {
  id, url, prompt, format, ratio, resolution, duration, timestamp,
  variant: "product" | "app",
  hookId?: string,
  settingId?: string,
  deviceFrame?: "mobile" | "desktop",  // app variant only
}
```

### 4.7 — Cost formula refit

Replace the current line:

```ts
const cost = Math.ceil((resolution === "1080p" ? duration * 0.675 : duration * 0.3) * 100);
```

with something that matches the Higgsfield reference (~90 cr at 5s/1080p
Product, ~100 cr at 5s/1080p App):

```ts
const base = resolution === "1080p" ? 18 : 8;     // per-second
const variantMul = variant === "app" ? 1.10 : 1;  // App slightly pricier
const cost = Math.ceil(duration * base * variantMul);
```

(Numbers go in `tools.ts` `credits` field too — keep them aligned.)

### 4.8 — Translations review

Run a final pass to make sure no English copy ships in the modals:
- Format modal title — currently "اختر قالب الإعلان" ✅
- Hook modal title — needs "اختر هوك الإعلان" + tabs in Arabic ("الكل / مثير / هادئ")
- Setting modal title — needs "اختر مكان التصوير"
- Avatar modal — currently "اختر العارض" ✅
- All chip labels — Arabic only, no fallback English in the active label

### 4.9 — Out of scope (for this iteration)

- More than the 9 captured Hooks. Catalog is open; extending later is just a data PR.
- "Generate across formats" gallery showcase at the bottom of Higgsfield's page (we already show user history; that's enough).
- Server‑side webhook for completion (we still poll).
- Avatar training (the ability to upload a personal avatar reference set, like Soul ID for marketing). Higgsfield doesn't offer this yet either.

---

## 5. Open questions for the user

1. **Variant switcher placement** — segmented control at the top of `/marketing`,
   or two distinct links in the navbar (`/marketing` + `/marketing/app`)?
   Recommendation: one page with a segmented control to keep the navbar tidy.
2. **Hook + Setting required?** On Higgsfield neither is required. Confirm we
   match (i.e. defaults are `null`, user can ship without).
3. **Cost formula** — sign off on the new `duration * 18` (1080p) / `duration * 8`
   (720p) coefficients, or pin a different number?
4. **Asset mirroring** — OK to download all ~32 MP4s into `/public/marketing/`
   like we did for Soul? It costs us ~50 MB but makes us independent of
   Higgsfield's CDN.
5. **App preview frame** — do we want to render the user's app screenshot
   inside an actual iPhone/MacBook frame (extra `sharp` compositing on the
   server) or just pass a "render in mobile device frame" hint to the model?
   Higgsfield does the latter.

---

## 6. Phasing

If approved, build order is:

1. **Phase A — Data + assets.** Mirror MP4s, write the new catalog, add
   `prompt_injection` strings.
2. **Phase B — Pickers.** Add `HookPicker`, `SettingPicker`, wire to chips.
3. **Phase C — Variant routing.** Convert `MarketingStudio` to take a
   `variant` prop, add the App route, add the segmented control, gate the
   pickers by variant.
4. **Phase D — Prompt composition + cost refit + history schema.**
5. **Phase E — Translation pass + visual polish (chip ordering, modal
   tabs in Arabic).**

Estimated effort: ~1 focused day.

---

**Ready to build on your "go" — same as Soul.** No code yet. Confirm the open
questions above (or just say "تمام يلا") and I'll start with Phase A.
