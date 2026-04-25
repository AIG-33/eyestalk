# EyesTalk Mobile · UI Kit

High-fidelity recreation of the React Native + Expo app, rendered as web HTML using the design tokens in `../../colors_and_type.css`.

## Files
- `index.html` — interactive click-thru: Onboarding → Sign-in → Map → Venue sheet → Chat → Profile.
- `Frame.jsx` — iPhone-style device shell + status bar.
- `Onboarding.jsx`, `SignIn.jsx`, `Map.jsx`, `VenueSheet.jsx`, `Chat.jsx`, `Profile.jsx`, `Tokens.jsx` — screen components.
- `Components.jsx` — buttons, tags, avatars, list rows, tab bar.

## Source of truth
- `EyesTalk/apps/mobile/theme/tokens.ts`
- `EyesTalk/apps/mobile/components/{ui,map,chat,venue}/*`
- `EyesTalk/apps/mobile/i18n/locales/en.json` (copy)
- `EyesTalk/apps/mobile/lib/venue-constants.ts` (emoji + ambient palette per venue type)

## Coverage
Visual recreation only — navigation is fake (state is held in a single `view` state). No real Supabase calls, no real Mapbox layer (an SVG mock stands in).
