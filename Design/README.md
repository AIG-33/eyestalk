# EyesTalk Design System

> **From a glance to a conversation** — a location-based social app that connects people at venues in real-time.

EyesTalk is a mobile-first social app that lives at bars, clubs, karaoke rooms, lounges, bowling alleys, hookah spots, arcades and live-music venues. Users **check in** to a venue (via QR + geofence), see **who's around right now**, send **waves**, and start **micro-chats** that auto-expire when they leave.

The brand is built for **dark, low-light, ambient environments**. Visuals lean into **glassmorphism, neon glow, soft gradients, and purple-as-hero-color** — the screen has to look great glowing on a table at 1am in a club.

---

## Sources used to build this system

- **Codebase** (read-only, mounted): `EyesTalk/`
  - `apps/mobile/` — React Native + Expo (the primary product, iOS & Android)
  - `apps/web/` — Next.js 15 (Venue Owner Panel + REST API)
  - `apps/mobile/theme/tokens.ts` — canonical token source
  - `apps/web/app/globals.css` — web token mirror
  - `apps/mobile/i18n/locales/en.json`, `ru.json` — copy + tone reference
  - `apps/mobile/components/ui/*` — Button, Card, Input, Tag, Avatar
  - `apps/mobile/components/{map,chat,venue}/*` — domain components
  - `apps/mobile/assets/logo-purple.png`, `logo-light.png`, `icon.png`

No Figma file was provided. Everything below is derived from the live code.

---

## Products in scope

| Surface | Stack | Audience | Key screens |
|---|---|---|---|
| **Mobile app** | React Native, Expo SDK 54, Expo Router | End users at venues | Map, Venue, People, Direct chat, Profile, Tokens, Onboarding |
| **Venue Owner Panel** (web) | Next.js 15, Tailwind | Venue staff / owners | Dashboard, Analytics, QR codes, Activities, Moderation |

The mobile app is the hero. The web panel is a back-office tool that reuses the same color palette but with desktop layout conventions.

---

## Index

```
README.md                     ← you are here
SKILL.md                      ← agent skill manifest (cross-compatible w/ Agent Skills)
colors_and_type.css           ← CSS variables for color + type + spacing + motion
fonts/                        ← Inter (regular/medium/semibold/bold)
assets/
  logo-original-purple.png    ← the *current* mark (navy speech bubble + glasses)
  logo-original-light.png
  app-icon-original.png
  splash-icon-original.png
  logo-redesigned.svg         ← refreshed wordmark (purple gradient + mint live dot)
  logo-redesigned-mark.svg    ← icon-only version
preview/                      ← cards rendered in the Design System tab
  _card.css                   ← shared card scaffold
  color-* type-* spacing-* component-* brand-*.html
ui_kits/
  mobile/                       ← (see ui_kits/mobile/README.md)
  web/                          ← Venue Owner Panel — Dashboard, Live Screen,
                                  Analytics, Activities, QR Codes
slides/                         ← (none — no deck template provided)
```

---

## Content fundamentals

EyesTalk's voice is **warm, casual, present-tense, and a little flirty** — it talks like a friend at the next table, not a marketing department. Copy is built around the moment of being *somewhere right now* with *people right now*.

**Tone & POV**
- **You-led**, never "we" the company. _"You're checked in!"_, _"See who's around you right now"_, _"Tap to view balance"_.
- **Present tense, active verbs.** _"Discover venues near you"_, _"Find where the action is"_, _"Meet people & have fun"_.
- **Sentence case everywhere.** No Title Case in body or buttons. Buttons are short verbs: `Sign In`, `Check In`, `Continue`, `Let's go!`.
- **Hint copy is reassuring, not corporate.** _"This is how others will see you. You can change it anytime."_ — explanations always include the "you can undo it" out.

**Specific patterns from the i18n bundle**
- Tagline: **"From a glance to a conversation"** — the entire brand promise, used on sign-in, sign-up, map header, splash.
- Status confirmation: **"You're checked in!"** / **"You're here"** — exclamation marks on positive moments, never on errors.
- Empty states are 3 lines: title (what's missing) → hint (why) → numbered steps (how to fix). e.g. _"No chats yet"_ → _"Check in to a venue and start meeting people around you"_ → `1. Find a venue → 2. Scan QR → 3. Wave`.
- Onboarding is **emoji-led**: 📍 Find venues → 👀 Check in → 💬 Connect → 🎯 Have fun. Emoji here are real product emoji (🪩 club, 🎤 karaoke, 🎱 billiards) and act as iconography for venue type.
- Russian (ru) is a first-class peer to English. Every string is bilingual. Avoid English-specific puns; copy is short enough to translate cleanly.
- Microcopy uses **the bar/club idiom**, lightly: _"who's around"_, _"the action is"_, _"send a wave"_, _"open to chat"_. Never slang that dates ("vibes", "rizz") and never gendered.
- **Soft urgency** for ephemeral mechanics: _"Your venue chats will expire in 24 hours"_, _"5-minute timed chats with message limits"_. Time is part of the product, so copy names it.
- Numbers and tokens use the 🪙 emoji inline: _"🪙 1,250"_. The token economy is gamified but never described as "points".
- **Errors are short and human**: _"Check-in failed"_, _"Not enough tokens."_, _"Try another date — tap a day with a green dot."_

**Do**
- Lead with what the user gets ("See who's around") not what we built ("Real-time presence layer").
- Use emoji for venue/activity *types*, never as decoration in body copy.
- Include a hint line under labels in settings — see profile screen for the pattern.

**Don't**
- "We" / "our team" / "EyesTalk users".
- Sentence-final periods in single-line buttons or labels.
- ALL CAPS except in tracked-out eyebrow labels (section headers in profile/chat).

---

## Visual foundations

EyesTalk is **dark-first**. The light theme exists but the brand was designed for the dark. Read every visual rule below as "in the dark theme" first; light is a desaturated mirror.

### Palette
A single **deep indigo-to-near-black background ramp** (`#0D0D1A` → `#161630` → `#1E1E3F` → `#2A2A5A`) carries the whole UI. The hero accent is a **violet** `#7C6FF7` with a softer companion `#A29BFE` — these are always paired in a 135° gradient. Three semantic accents punch the dark: **`#00E5A0` mint** (success / online / live), **`#FF6B9D` pink** (matches / hearts), **`#FFD93D` gold** (premium / tokens / warning). Plus error red `#FF4757` and info cyan `#00D4FF`. Saturation is high; the palette is **neon-on-midnight**, not pastel.

### Type
**Display**: Clash Display (extrabold, tight tracking — `-0.5px`). Used for the wordmark, screen titles, big numbers.
**Body**: Inter, full weight range 400/500/600/700. Used everywhere else.
**Accent**: Space Grotesk, occasional — token amounts, code-like numerics.
Eyebrow labels are uppercase Inter SemiBold with `1.5px` tracking. Display copy gets **negative tracking** (`-0.2 to -0.5px`); body is neutral; small caps get **positive** (`+0.3 to 1.5px`).

### Backgrounds & atmosphere
- **No flat #000.** The base is always `#0D0D1A` (slightly indigo). This matters under glow effects.
- **Ambient gradients**: a soft purple radial wash at the top of every auth/profile screen (`rgba(124,111,247,0.08)` → transparent over 250–300px). This is the brand "glow at the top of the room".
- **Venue ambient palettes** (in `tokens.ts`): each venue type has a 2-stop gradient (e.g. nightclub = purple→pink, karaoke = pink→gold, sports_bar = mint→cyan). Used to tint headers and bottom-sheet backdrops by context.
- **No textures, no grain, no patterns, no illustrations.** The brand stays clean — atmosphere comes from light, not surface texture.
- **No full-bleed imagery in the app shell.** Photos appear inside avatars, photo grids, and venue cards only.

### Glow & shadow systems
EyesTalk has **two parallel shadow systems** that both apply at once on hero elements:
1. **Drop shadows** — black, four steps (`sm/md/lg/xl`), `y: 2/4/8/16`, opacity ramp `0.2 → 0.5`. Stays subtle.
2. **Colored glows** — `box-shadow: 0 0 15px rgba(brand,0.4), 0 0 30px rgba(brand,0.15)`. The double-stop matters: tight inner halo + soft outer wash. Available in primary/success/pink/error variants. Apply to: primary buttons, active checkin badges, status dots, focus rings, FAB, tab bar active dot.

### Glassmorphism
Cards over the map use **glass surfaces**: `background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.08)`. On hover, border lifts to `0.12`. Behind glass we expect the dark theme to show through — **never use glass on white**.

### Borders, radii, cards
- **Default card border**: `1px rgba(255,255,255,0.06)` — almost invisible, just enough to separate from bg.
- **Radii**: `4 / 8 / 12 / 16 / 20 / 24 / pill`. Cards use `xl=20` (user) or `2xl=24` (venue). Buttons use `lg=16`. Tags & filter chips use full pill. Inputs use `14px` (one-off, between `md` and `lg`). Avatars are perfect circles.
- **Chat bubbles** have asymmetric radii: own messages = `20/20/20/4` (tail bottom-right), peer = `20/20/4/20` (tail bottom-left).

### Hover, press, focus
- **Hover (web)**: lift glass border opacity from `0.08 → 0.12`; otherwise no transform.
- **Press**: React Native uses `activeOpacity={0.7}` on list rows, `0.85` on cards, `0.8` on primary buttons. No scale-down — it would compete with the haptic. Web mirrors with `opacity: 0.85` on press.
- **Focus**: `border-color: var(--accent-primary); box-shadow: var(--glow-primary);` — input gets the brand glow on focus. This is the moment the brand feels most "alive".
- **Disabled**: opacity `0.4`. No graying.

### Capsules vs protection gradients
- **Tags / chips / status dots**: pill capsules with translucent brand-tinted bg (e.g. `rgba(124,111,247,0.15)` + text `#A29BFE`). No borders unless filter-style.
- **Top bar over map**: vertical gradient mask `bg → bg @60% → transparent` so map shows through but text stays legible. This is the *protection gradient* pattern — used wherever a fixed UI sits over content.

### Transparency & blur
Used **sparingly**:
- Map top bar: protection gradient (no blur in code, just rgba steps).
- Glass cards: `rgba(255,255,255,0.08)` no blur (RN limitation; web could add `backdrop-filter: blur(20px)`).
- Bottom sheet backdrop: `rgba(0,0,0,0.6)` flat dim.
Light theme uses much softer transparencies (`0.03–0.08`) to keep the cleaner look.

### Animation
- Standard transition: **250ms** with cubic-bezier(0.4, 0, 0.2, 1). Quick: 150ms. Emphasis: 400ms. Dramatic: 600ms.
- **Pulsing** is the brand's signature motion — the active checkin badge breathes (1.8s in / 1.8s out, sine ease) on a glow + scale loop. Online dots, live markers, and the QR button reuse it.
- **Slide-up** (16px → 0, 250ms ease-out) for sheets, modals, toasts.
- No bouncy springs anywhere — motion is calm, not playful. The exception is the onboarding emoji bubble shadow.

### Layout rules
- **Spacing scale**: `2/4/8/12/16/20/24/32/48`. Page horizontal padding is almost always `xl=20`. Inter-section gap: `lg=16` to `2xl=24`.
- **Hit targets**: primary `56`, secondary `48`, compact `44`, list-item row `64`, tab-bar item `56`. Below 44 is forbidden.
- **Tab bar**: `60 + safe-area`. Sits below content. Active icon bumps `24 → 26` and grows a tiny `4×4` glow dot underneath.
- **Top bar**: `56` content + safe-area. Logo + tagline left, single circular action button right (gradient pill, 48×48).
- **Bottom sheets**: `2xl=24` top radius, `40×4` handle in `#2A2A5A`, full backdrop dim.
- **Page-level vertical rhythm**: hero header → primary action → secondary list → tertiary actions, each separated by `xl/2xl` of vertical space.

### Imagery
When real photos appear (avatars, venue logos, user photo grid), they are **un-treated** — no filter, no grain. The dark UI around them does the warming. Avatars sit on a **gradient ring** in brand colors when the user has an active status; otherwise plain.

---

## Iconography

EyesTalk uses **three** icon systems in concert:

1. **Ionicons** (via `@expo/vector-icons`) — the entire mobile app's icon set. Outline variants for default, filled for active/focused. Stroke ~1.75px equivalent. This is the system to mirror in any new screen. Examples in the codebase: `map-outline / map`, `chatbubbles-outline / chatbubbles`, `person-outline / person`, `qr-code`, `chevron-forward`, `locate-outline`, `settings-outline`, `create-outline`, `wallet-outline`, `trophy-outline`, `globe-outline`, `moon-outline`, `sunny-outline`, `log-out-outline`, `business-outline`, `flash-outline`, `hand-right-outline`, `images-outline`, `megaphone-outline`, `camera`, `lock-closed`.

2. **Real Unicode emoji** — used as *category iconography* for venue types and activity types. **This is a brand decision, not laziness.** The emoji ARE the venue-type icons — they translate without localisation, work at marker scale on the map, and feel native in a casual social context. The full set lives in `apps/mobile/lib/venue-constants.ts`:
   - **Venues**: 🎤 karaoke · 🪩 nightclub · ⚽ sports_bar · 🎳 bowling · 🎱 billiards · 💨 hookah · 🎲 board_games · 🕹️ arcade · 🎭 standup · 🎵 live_music · 📍 other
   - **Activities**: 🗳️ poll · 🏆 contest · ⚔️ tournament · 🎯 challenge · 📜 quest · 💰 auction · 🎉 event
   - **Token**: 🪙
   - **Onboarding steps**: 📍 👀 💬 🎯
   Emoji should be allowed to render in the system emoji font (do not replace with custom SVGs).

3. **Brand mark** — the EyesTalk logo (speech bubble + dual-eye glasses), used in the app shell top bar, splash, and auth screens. Full PNG and SVG redesigned versions live in `assets/`. The mark is **never** used inline in copy.

**Do not introduce**: Lucide, Heroicons, Feather, FontAwesome, Material Icons, or hand-drawn SVG icons. Stick to Ionicons + the official emoji palette above. If a needed icon is missing, pick the closest Ionicons match before drawing.

**CDN for prototypes**: `https://unpkg.com/ionicons@7/dist/svg/<name>.svg` or the Ionicons web component (`<ion-icon name="map-outline">`) work in HTML mocks.

---

## Quick reference

| Need | Token |
|---|---|
| Page background | `var(--bg-primary)` |
| Card background | `var(--bg-secondary)` |
| Primary button | `background: var(--gradient-primary); box-shadow: var(--glow-primary);` |
| Live / online indicator | `background: var(--accent-success); box-shadow: var(--glow-success);` |
| Match accent | `var(--accent-pink)` |
| Premium / token | `var(--accent-warning)` (gold `#FFD93D`) |
| Tagline / hint text | `color: var(--fg-2);` |
| Eyebrow / section header | `.eyebrow` class — uppercase, `1.5px` tracking, `var(--fg-3)` |
| Body | `font-family: var(--font-body); color: var(--fg-1);` |
| Display title | `font-family: var(--font-display); font-weight: 800; letter-spacing: -0.5px;` |
| Standard transition | `transition: all 250ms var(--ease-standard);` |

---

## Caveats & substitutions

- **Clash Display** (display family) and **Space Grotesk** (accent family) `.otf` files were **not** included in the codebase repo (only `Inter-*.ttf` was). Both are loaded via Google Fonts / Fontshare CDN in the preview HTML files — flagged for the user to drop the real font files into `fonts/` if they want offline parity.
- **No Figma** was attached. All visual rules were inferred from `tokens.ts`, `globals.css`, and component source. If a Figma exists with additional rules (e.g. animation curves, illustration library), please attach it.
- **No deck template** was provided, so `slides/` is intentionally absent.
- **Russian copy** was not deeply audited — bilingual structure is in place, but native-RU review is recommended before shipping system-level rewrites.
