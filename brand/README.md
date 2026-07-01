# EyesTalk — Brand Media Kit

> **Spot. Talk. Vibe.** Logo, wordmark, app icon, favicons, background and full brand spec — everything needed to replace the identity across the website and the app.

This kit is a handoff package. Hand it to the implementing agent together with `brand-tokens.json` (machine-readable) and this README.

---

## 1. What's inside

```
eyestalk-brand-kit/
├── README.md                      ← this file (human spec)
├── brand-tokens.json              ← machine-readable colors / fonts / gradients
├── background.css                 ← drop-in CSS for the ambient backdrop
├── svg/                           ← VECTOR source of truth (scale to any size)
│   ├── mark-flat.svg              · primary icon, flat violet #7C6FF7
│   ├── mark-gradient.svg          · icon with primary gradient fill
│   ├── mark-white.svg             · mono white (knockout eyes) — for dark/photo bg
│   ├── mark-black.svg             · mono dark (#0D0D1A) — for light bg
│   ├── wordmark-on-dark.svg       · mark + "EyesTalk" (Eyes white / Talk gradient)
│   ├── wordmark-on-light.svg      · mark + "EyesTalk" in dark ink, for light bg
│   └── background-ambient.svg     · the glow backdrop, vector
└── png/                           ← raster exports (ready to ship)
    ├── mark-flat-1024 / 512 / 256.png    · transparent, flat violet
    ├── mark-gradient-1024.png            · transparent, gradient
    ├── mark-white-1024.png               · transparent, white mono
    ├── app-icon-1024 / 512 / 180.png     · iOS/Android home-screen icon
    ├── favicon-64 / 32.png               · browser favicon
    ├── background-1920x1080.png          · ambient backdrop, raster
    ├── logo-glass-mark.png               · GLASS icon hero (composited on dark)
    └── logo-glass-wordmark.png           · GLASS wordmark hero + live dot + font
```

**Source of truth = the SVGs.** PNGs are convenience exports. Regenerate PNGs from SVG at any size you need.

---

## 2. The mark

A **speech bubble holding two eyes** behind a glasses bridge. Tail sits bottom-left. Keep the two pupils and the bridge — they're what make it read as "eyes + talk", not a generic chat bubble. Never stretch; the bubble's 220 × 170 proportion is fixed. Minimum clear space around the mark = the height of one eye.

| Use case | File |
|---|---|
| App icon (iOS/Android) | `png/app-icon-*.png` |
| Favicon | `png/favicon-*.png` |
| In-app top bar / header (dark) | `svg/mark-flat.svg` or `mark-gradient.svg` |
| On a photo or busy bg | `svg/mark-white.svg` |
| On light/print | `svg/mark-black.svg` |
| Splash / marketing hero (dark) | `png/logo-glass-mark.png` |

---

## 3. Wordmark

Lockup = mark + **EyesTalk** set in **Clash Display Bold**, letter-spacing `-3 to -4px`. "Eyes" is white, "Talk" uses the primary gradient (`#A29BFE → #7C6FF7`). An optional **mint `#00E5A0` "live" dot** trails the word and pulses (1.8s ease-in-out) — the brand's signature breathing motion. See `logo-glass-wordmark.png` for the finished look.

The SVGs carry live text — they render correctly once **Clash Display** is loaded (see fonts below).

---

## 4. Colors

| Role | Hex |
|---|---|
| **bg / primary** (never flat #000) | `#0D0D1A` |
| bg / secondary | `#161630` |
| bg / tertiary | `#1E1E3F` |
| bg / surface | `#2A2A5A` |
| **accent / primary** (hero violet) | `#7C6FF7` |
| accent / primary-light | `#A29BFE` |
| accent / success · online · live | `#00E5A0` |
| accent / pink · matches | `#FF6B9D` |
| accent / warning · tokens | `#FFD93D` |
| accent / error | `#FF4757` |
| accent / info | `#00D4FF` |
| text / primary | `#E8E8F0` |
| text / secondary | `#A0A0B8` |
| text / tertiary | `#5A5A78` |

**Primary gradient:** `linear-gradient(135deg, #7C6FF7 0%, #A29BFE 100%)`
**Glow halo:** `box-shadow: 0 0 15px rgba(124,111,247,0.40), 0 0 30px rgba(124,111,247,0.15)`

---

## 5. Fonts

| Family | Use | Load |
|---|---|---|
| **Clash Display** (600/700) | wordmark, titles, big numbers | `https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap` |
| **Inter** (400–700) | body / UI | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap` |
| **Space Grotesk** (500–700) | token amounts, numerics | `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap` |

> Clash Display is **not on Google Fonts** — load it from Fontshare (link above). For offline/app bundling, download the Clash Display Bold `.woff2`/`.otf` from fontshare.com and self-host.

---

## 6. Background

The signature "glow in a dark room" backdrop. Base is **always `#0D0D1A`** (slightly indigo, never `#000`), with soft radial washes of violet, pink and a touch of mint.

- Drop-in: `background.css` → class `.eyestalk-bg` (full glow) or `.eyestalk-bg--soft` (top-only purple wash for auth/profile).
- Assets: `svg/background-ambient.svg` (vector) and `png/background-1920x1080.png` (raster).

---

## 7. Do / Don't

**Do** — keep the mint dot for "live/online" moments · pair violet with the glow halo on hero elements · use white mark on photos · keep sentence case in copy.
**Don't** — recolor the bubble outside the palette · stretch or rotate the mark · put the glass treatment on a white background (glass needs the dark) · add a drop shadow to the flat mark on light bg · use flat `#000` as a background.
