---
name: eyestalk-design
description: Use this skill to generate well-branded interfaces and assets for EyesTalk, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

# EyesTalk Design Skill

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map of this skill

```
README.md             ← brand overview · content · visual · iconography
colors_and_type.css   ← drop-in CSS variables (color, type, spacing, motion)
fonts/                ← Inter (regular/medium/semibold/bold)
assets/               ← logos (original + redesigned mark/wordmark), app/splash icons
preview/              ← reference cards (one concept per file)
ui_kits/mobile/       ← React/JSX recreation of the mobile app screens
```

## Hard rules that make designs feel like EyesTalk

1. **Dark first.** `#0D0D1A` page bg, never flat black. Light theme exists but is the secondary mode.
2. **One hero color: violet.** `#7C6FF7` paired with `#A29BFE` in a 135° gradient on every primary action.
3. **Glow halos, not heavy shadows.** Primary CTAs, status dots, focused inputs all carry a `0 0 15px rgba(124,111,247,0.4), 0 0 30px rgba(124,111,247,0.15)` halo. The double-stop is the look.
4. **Glass cards on dark.** Surfaces over the map use `rgba(255,255,255,0.08)` + `1px rgba(255,255,255,0.08)` border. Never glass on white.
5. **Voice is "you", present tense, sentence case.** Tagline: *From a glance to a conversation.* Errors are short and human. No "we" / "our team".
6. **Venue-type icons are emoji**, not custom SVGs. 🪩 nightclub · 🎤 karaoke · ⚽ sports · 🎳 bowling · 🎱 billiards · 💨 hookah · 🎲 board · 🕹️ arcade · 🎵 live music. Token = 🪙.
7. **App-shell icons are Ionicons** (outline default, filled active).
8. **Hit targets ≥ 44.** Primary buttons are 56h, secondary 48h. Press = activeOpacity 0.7–0.85 (no scale).
9. **Pulsing is the brand's signature motion.** 1.8s sine ease in/out on the live check-in badge, online dots, FAB.
10. **No textures, grain, illustration, or full-bleed photography in the shell.** Atmosphere comes from light + gradient washes only.
