# Web UI Kit · EyesTalk Venue Owner Panel

Recreated from `apps/web/app/(venue-panel)/dashboard/*` in the EyesTalk monorepo (Next.js 15 App Router + Tailwind + Supabase + next-intl).

## Layout
Sidebar (248px) + main content area, matching the live `<DashboardSidebar>` layout exactly:
- 28px navy bubble logo + EyesTalk wordmark
- Venue switcher button
- 10 nav items with their real icons (📊📺📈🎯🎟️📢🏆🛡️📱⚙️) and i18n labels lifted from `i18n/locales/en.json`
- Sign-out at the bottom in `--accent-error` red

## Screens included
1. **Dashboard** — 3 stat cards (Active Users · Total Check-ins · Active Activities) + 4 quick-link cards. Mirrors `dashboard/page.tsx`.
2. **Live Screen** — full-bleed presentation mode for the bar TV: large venue name + clock + giant active-user/activity counts + 4 activity cards with countdowns + pulsing live dot. Mirrors `dashboard/live-screen/page.tsx`.
3. **Analytics** — 4 KPI stats + check-ins-over-time area chart + Top Activities horizontal bars + Peak Hours histogram. Inspired by `dashboard/analytics/`.
4. **Activities** — list of 6 activities (poll, contest, challenge, tournament, quest, auction) with type/participants/token cost/status pills. Mirrors `dashboard/activities/page.tsx`.
5. **QR Codes** — grid of 3 QR cards with synthetic QR pattern, zone label, status pill, Download/Print buttons. Mirrors `dashboard/qr-codes/page.tsx`.

## What's faked / out of scope
- **Static data only.** Real app pulls from Supabase via `createClient()` and Realtime channels.
- **Synthetic QR pattern.** Real app uses `qrcode.react` + canvas export with venue name footer and `eyestalk://checkin/{code}` deep-link payload.
- **No light theme toggle.** Real app supports both via `<ThemeProvider>` + `data-theme="light"` overrides in `globals.css`. The kit only shows dark.
- **No language switcher.** Real app uses `next-intl` for EN/RU; kit shows EN strings only.
- **No mobile nav.** Real sidebar slides in at <768px; kit assumes desktop width.
- **Skipped screens:** `services/` (calendar + slot generator), `loyalty/`, `moderation/`, `announcements/`, `settings/`, `create-venue/`, `qr-codes/[id]/scan/`. Easy to add — same primitives.
