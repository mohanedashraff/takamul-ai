# Higgsfield Soul 2.0 — Research & Build Spec

> **Status**: Research complete. Ready for review before implementation.
> URL studied: https://higgsfield.ai/ai/image?model=soul-v2

---

## 1. What Soul 2.0 actually is

Higgsfield's proprietary, in-house foundation image model — **NOT** Nano Banana, **NOT** Flux, **NOT** SDXL. It's their own model trained for high-aesthetic, editorial, fashion-forward, culturally-aware photoreal output.

Use cases creators leverage it for:
- Fashion editorial / lookbooks
- Brand-consistent visual series (coffee brand, beauty brand…)
- Music artist promo content
- "Photodumps" — Instagram-style aesthetic feeds
- Character-consistent storytelling
- Cultural/subcultural visuals (Y2K, Asian nostalgia, SWAG era, Frutiger Aero…)

---

## 2. The 4 input axes that COMPOSE

Soul 2.0 is built around **four independent inputs that combine** to produce a single image. The user picks/configures any subset; each axis independently steers a different dimension of the output.

| Axis | What it controls | Default | Optional? |
|---|---|---|---|
| **Prompt** | Subject + scene description | empty | required |
| **Mood Board** | Visual aesthetic / style / vibe | "General" | optional |
| **Soul HEX (Color Signature)** | Color palette / grade | none | optional |
| **Soul ID (Character)** | Character identity to keep consistent | none | optional |

Plus utility settings (aspect, quality, variations, prompt-enhance toggle) on the bottom bar.

---

## 3. Mood Board picker (THE KEY PIECE)

**Title in modal**: "CREATE YOUR MOODBOARD"
**Description**: "Turn your references into a focused moodboard that defines style, tone, consistent details, and creative direction."

### 3a. Curated presets — 33 captured from live UI

Every entry has a `.webp` thumbnail at `https://cdn.higgsfield.ai/soul-v2-style/<uuid>.webp`. UUIDs and labels:

| # | Label | UUID |
|---|---|---|
| 1 | General | `f33d85f2-6521-4fa8-8e8f-894cfbdee578` |
| 2 | Warm ambient | `18e79fc7-3ce8-499b-a129-2daba3165707` |
| 3 | Y2K studio | `c1d13313-1a78-4f55-acd3-125e789d202f` |
| 4 | Swag era | `35702530-c33b-4259-84c8-170c7d043882` |
| 5 | Theatrical light | `2a79c49e-29cd-46b3-b60e-d6eed72b40ec` |
| 6 | Y2K street | `1235a986-ef50-4920-9ca1-0a9e2dee1768` |
| 7 | Flash editorial | `9f132343-278b-4fd1-b614-c11e07472cf5` |
| 8 | Old smartphone | `b7f45834-8736-4858-bba8-30029048e1e5` |
| 9 | Street photography | `bf3defc5-e184-4a21-bf1f-cae4a66ace97` |
| 10 | Asian nostalgia | `ddda68b0-a93b-43c0-a26f-bf0b3e683469` |
| 11 | Retro BW | `efe5394f-d88b-4587-8417-d22f462af786` |
| 12 | Subtle flash | `2134d88a-8e98-4f4a-9477-19a59343bd2d` |
| 13 | Surreal solarization | `776961b9-336d-4234-b569-bdd57021ffcf` |
| 14 | Digital camera | `4663f0a8-7e42-405d-ab2d-2f0fdceb5246` |
| 15 | Siren | `feec6fd0-995d-4491-adfe-12dc3a1abec1` |
| 16 | Mystique city | `06fd4ff1-b3e0-4ad6-ad00-bb91d2268ca5` |
| 17 | Candy pop | `bd012736-2b24-40fd-84b8-d73b0d2ebee4` |
| 18 | Double exposure | `e4057886-2c14-4a51-998d-26fa24a9941c` |
| 19 | 2000s band | `254355c4-d976-46b0-b066-baa1cc6dc8a1` |
| 20 | Frutiger aero | `ea15a9bb-ef1d-49ce-8d49-fd311f6ea270` |
| 21 | Drain | `4c796bd9-ee7e-476f-b588-083b3df529e1` |
| 22 | Extraterrestrial | `6938b497-ce2f-4d80-9760-00be2a2a3277` |
| 23 | Nature light | `f795f856-42c9-4f09-991f-ff3f5d1b7db4` |
| 24 | Editorial street style | `84b09184-9077-4f93-b4aa-1340f3641631` |
| 25 | New Indie | `200949a2-c394-468c-adbb-5a88a5b3105b` |
| 26 | Underwater | `3b6c09ce-e318-4cf3-82ca-770b4e1f753d` |
| 27 | 80s horror | `06e57621-847a-4a51-a10c-a607548a27e8` |
| 28 | Disposable camera | `00e8d173-cf5e-45c4-8896-23af3d8d37ce` |
| 29 | Neutral pastel film | `e70fc9f9-648e-4016-a411-7564fa47bab5` |
| 30 | Warm vivid film | `576fb6f0-e000-4da9-ba05-a4cc5f5e2462` |
| 31 | BW film | `30b6d8ca-1a73-429d-9a16-b19905d69756` |
| 32 | Warm contrast film | `fd7b86d1-e90f-4198-a429-c764bd9b1996` |
| 33 | Muted cool film | `c50c0350-dffe-49fc-acc4-e6fcfa5a6140` |

The modal also has a search bar + tabs: **Curated** / **My Moodboards**.

### 3b. "Build your moodboard" flow

Modal title: **"Build your moodboard"**
Sub-text: **"Upload at least 5 photos to continue."**

Two upload sources side-by-side:
- **Upload from device** (file picker, [+] icon)
- **Upload from assets** (browse Higgsfield's asset library, image icon)

Below the upload zones, two hint rows:
- ✅ "20+ photos, one cohesive style, no faces."
- ❌ "Faces, mixed styles, blurry or low-quality images."

So the **hard minimum is 5 photos**, the **recommendation is 20+**. After uploading, the platform processes them into a personalized moodboard the user can save under "My Moodboards" and re-use.

---

## 4. Soul HEX (Color Signature) picker

**Title**: "CONTROL YOUR COLORS WITH SOUL HEX"
**Subtitle**: "Upload a reference image and let Soul HEX bring its colors in your own style"

### 4a. Curated palettes — 6 captured

Each preset has TWO visuals: a reference photo on top + a color strip swatch on the bottom.

| # | Label | Sample image |
|---|---|---|
| 1 | Film colors | `static.higgsfield.ai/soul-v2/2-1.jpg` |
| 2 | Lime Jam | `static.higgsfield.ai/soul-v2/2-2.jpg` |
| 3 | Candy pink | `static.higgsfield.ai/soul-v2/2-3.jpg` |
| 4 | Nostalgic blue | `static.higgsfield.ai/soul-v2/2-4.jpg` |
| 5 | Soft palette | `static.higgsfield.ai/soul-v2/2-5.jpg` |
| 6 | Black gloss | `static.higgsfield.ai/soul-v2/2-6.jpg` |

### 4b. "Upload & Create" flow

Big yellow CTA. Lets the user upload one (or up to 20 per docs) reference image(s); Soul HEX extracts the dominant color palette automatically and applies it. The user doesn't manually input HEX codes.

---

## 5. Soul ID (Character) picker

**Title**: "MAKE YOUR OWN CHARACTER"
**Subtitle**: "Upload photos from multiple angles to train your character. Then use the same consistent character across new images and videos."

CTA: **"Create character ✨"**

Filter tabs: **All / Soul / Soul 2.0 / Soul Cinema** + search bar.
Empty state: "No characters yet. Create your first one!"

Per docs: training requires **~20 photos minimum**, takes **~3 minutes**, then the character is reusable across unlimited generations.

---

## 6. Bottom shoot bar — full layout

```
┌─────────────────────────────────────────────────────────────┐
│ [+] Describe the scene you imagine                          │
│ [Soul 2.0 ▾] [📱 3:4] [♥ 1.5k] [✨ Off] [− 1/4 +] [🎬 Film colors]│
│                                  [+ CHARACTER] [GENERAL] [Generate]│
└─────────────────────────────────────────────────────────────┘
```

| Chip | Function |
|---|---|
| [+] | Attach reference image (Soul Reference — image-to-image guide) |
| **Prompt** | Scene description (textbox) |
| Soul 2.0 ▾ | Model picker (Soul / Soul 2.0 / Soul Cinema / Nano Banana / GPT Image / Seedream / etc.) |
| 📱 3:4 | Aspect ratio (1:1, 16:9, 9:16, 4:5, 3:4, 2:3, 21:9) |
| ♥ 1.5k | Quality: 1.5k (fastest) / 2k (best visual fidelity) |
| ✨ Off / On | Prompt enhancement toggle |
| − 1/4 + | Variations counter (1–4 images per generation) |
| 🎬 Film colors | **Soul HEX (Color Signature) chip** — opens picker |
| + CHARACTER | **Soul ID chip** — opens character picker |
| GENERAL | **Mood Board chip** — opens moodboard picker (shows current pick label) |
| Generate ✨ 0.125 | Submit (cost in credits) |

---

## 7. Replication plan for our platform

### 7a. Backend
**Reality check**: Higgsfield's Soul 2.0 model isn't on MuAPI. We have two paths:

**Path A — Approximate the look (RECOMMENDED first pass)**
Use `nano-banana-pro` (already on MuAPI) or `flux-pro` and inject a high-quality "Soul-style" descriptor into the prompt based on whichever Mood Board the user picks. Each of the 33 Mood Boards gets a curated descriptor fragment (e.g. "Y2K studio" → "early 2000s studio photography, hard flash, low-fi compact-camera aesthetic, glossy reflective vinyl backdrop, mtv-era styling, slight chromatic aberration"). This is what we already do for Soul Cinema.

**Path B — Direct Higgsfield API integration** (later)
If/when Higgsfield exposes their Soul 2.0 model via API (currently checking — they have an API but Soul 2.0 endpoint not yet documented publicly).

I recommend Path A now and B as a follow-up if pricing makes sense.

### 7b. Frontend — full UI clone

Build a **dedicated Soul 2.0 studio page** (`/soul`) with the same shoot-bar pattern as our Cinema Studio. Components needed:

1. **`SoulStudio.tsx`** — main page (gallery + bottom shoot bar)
2. **`MoodboardPicker.tsx`** — modal with 33 curated cards + "Build your moodboard" tab
3. **`BuildMoodboard.tsx`** — upload zone with 5-photo minimum gating + asset library option
4. **`ColorSignaturePicker.tsx`** — modal with 6 palette presets + "Upload & Create" reference-extraction
5. **`SoulIDPicker.tsx`** — character picker with "Create character" + saved characters list

### 7c. Data files

- `src/lib/data/soul.ts` — all 33 mood boards (id, name, descriptor, thumbnail) + 6 color palettes (id, name, hex array, thumbnail)
- Download all 33 mood-board thumbnails to `/public/soul/moodboards/<id>.webp`
- Download all 6 color-preset images to `/public/soul/colors/<id>.jpg`

### 7d. New API routes

- `POST /api/tools/soul/generate` — submits to nano-banana-pro with composed prompt (base + mood-board descriptor + color hint + character ref)
- `POST /api/tools/soul/moodboard` — accepts 5+ image URLs, stores as a "user moodboard" record (we don't actually train a model — we just average a descriptor or store the URLs as references for future runs)
- `POST /api/tools/soul/character` — accepts 20+ image URLs to "train" a Soul ID — for now stored as a reference set the model gets passed at generation time
- `POST /api/tools/soul/extract-colors` — takes one image, returns dominant HEX palette (we can do this client-side with a canvas-based color quantizer, or server-side with sharp+vibrant)

---

## 8. Open questions to confirm with the user before building

1. **Path A vs B?** — should we start with the nano-banana-pro descriptor approximation, or wait for direct Higgsfield integration?
2. **Studio depth** — full studio at `/soul` with gallery + shoot bar (like Cinema), OR simpler `/tools/soul-v2` page like our existing tools?
3. **Soul ID training** — since we can't actually fine-tune a model on the user's photos, should we:
   - (a) Just store the reference photos and pass the strongest 1–3 as `images_list` at generation time (works today)
   - (b) Fake it — say "training in progress" then on first use pass references through (works today, marketing-friendly)
   - (c) Wait until we wire a real LoRA-training backend (multi-week)
4. **Build my own moodboard** — do we want the same "store images as a custom preset, attach them to future generations" UX, or skip this for v1?

---

## 9. Trigger to start building

When the user replies "ابدأ نفّذ Soul v2" or similar, switch to building. Do NOT begin until this doc is reviewed.

The build will be substantial (~5 new components, 1 data file, 4 API routes, 39 thumbnail downloads, 1 new page route). Estimated time: 1 focused session.
