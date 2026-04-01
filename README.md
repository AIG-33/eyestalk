# EyesTalk

**From a glance to a conversation** — a location-based social app that connects people at venues in real-time.

## Architecture

Monorepo powered by [Turborepo](https://turbo.build/) + [pnpm workspaces](https://pnpm.io/workspaces).

```
apps/
  mobile/     # React Native + Expo (iOS & Android)
  web/        # Next.js 15 — API routes + Venue Owner Panel

packages/
  shared/     # Constants, validators (Zod), TypeScript types
  supabase/   # Migrations, seed data, Edge Functions
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.81, Expo SDK 54, Expo Router v5 |
| State | Zustand, TanStack Query v5 |
| Backend | Next.js 15 (App Router, Route Handlers) on Vercel |
| Database | Supabase PostgreSQL + PostGIS |
| Auth | Supabase Auth (email/password) |
| Realtime | Supabase Realtime (Postgres Changes, Presence, Broadcast) |
| Storage | Supabase Storage (avatars) |
| Edge | Supabase Edge Functions (auto-checkout, cleanup, moderation) |
| Web Panel | Next.js + Tailwind CSS + Recharts |
| i18n | i18next (mobile), next-intl (web) — EN/RU |
| CI/CD | GitHub Actions, EAS Build, Vercel |

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Expo CLI (`npx expo`)
- A [Supabase](https://supabase.com) project (cloud — no local Docker needed)
- A [Vercel](https://vercel.com) account

### 1. Supabase Setup (Cloud)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
2. Enable the **PostGIS** extension:
   - Dashboard → Database → Extensions → search "postgis" → Enable
3. Run the initial migration:
   - Dashboard → SQL Editor → New query
   - Paste the contents of `packages/supabase/migrations/00001_initial_schema.sql`
   - Click "Run" — this creates all tables, RLS policies, the `avatars` storage bucket, and Realtime subscriptions
4. (Optional) Seed test data:
   - Register a test user via your app or Dashboard → Authentication → Users → Add user
   - Copy the user UUID
   - Open `packages/supabase/seed.sql`, replace `YOUR_USER_UUID_HERE` with the actual UUID
   - Run the modified SQL in Dashboard → SQL Editor
5. Copy your project credentials:
   - Dashboard → Settings → API
   - Note the **Project URL**, **anon key**, and **service_role key**

### 2. Vercel Setup

1. Import the repo into Vercel, set the root directory to `apps/web`
2. Add environment variables in Vercel project settings:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Deploy — Vercel will build and host the API + Venue Panel

### 3. Mobile App Setup

```bash
# Install dependencies
pnpm install

# Create env file
cp apps/mobile/.env.example apps/mobile/.env.local
```

Edit `apps/mobile/.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=https://your-vercel-domain.vercel.app/api/v1
```

```bash
# Start Expo dev server
pnpm dev:mobile
```

### 4. Supabase Auth Settings

In Dashboard → Authentication → Settings:
- **Site URL**: `https://your-vercel-domain.vercel.app`
- **Redirect URLs**: add `eyestalk://` (for mobile deep linking)
- Enable **Email** provider, disable email confirmations for dev

### Custom Fonts

Place the following font files in `apps/mobile/assets/fonts/`:

- `ClashDisplay-Bold.otf`, `ClashDisplay-Semibold.otf`
- `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf`
- `SpaceGrotesk-Medium.ttf`, `SpaceGrotesk-Bold.ttf`

Download from [Google Fonts](https://fonts.google.com/) (Inter, Space Grotesk) and [Fontshare](https://www.fontshare.com/fonts/clash-display) (Clash Display).

## Development

```bash
# Mobile app (Expo)
pnpm dev:mobile

# Web venue panel (Next.js) — for local testing before push
pnpm dev:web

# Type-check all packages
pnpm typecheck

# Lint all packages
pnpm lint
```

## Project Structure

### Mobile App (`apps/mobile`)

```
app/
  (auth)/           # Sign in, sign up, create profile, onboarding
  (app)/
    (tabs)/          # Map, Chats, Profile (tab navigation)
    venue/[id]/      # Venue detail, people, chat, activities
    venue/check-in   # QR code scanner
    chat/[id]        # Direct chat
    edit-profile     # Edit profile
    tokens           # Token balance & history
    settings         # App settings

components/
  ui/               # Button, Input, Card, Tag, Avatar, Skeleton, etc.
  chat/             # IcebreakerBar, MicroChatTimer
  venue/            # VenueStatusSheet, VenueTypeIcon

hooks/              # useAuth, useChat, useCheckin, useLocation, useProfile, etc.
stores/             # Zustand stores (auth, checkin, match, ui)
theme/              # Design tokens (colors, typography, spacing, shadows)
lib/                # Supabase client, API client, realtime, haptics, push
i18n/               # EN/RU translations
```

### Web Panel (`apps/web`)

```
app/
  (auth)/login       # Venue owner login
  (venue-panel)/
    dashboard/       # Overview, analytics, activities, moderation,
                     # QR codes, settings, live screen, create venue
  api/v1/            # REST endpoints: venues, checkins, chats,
                     # interests, reports, tokens, activities, venue-admin
```

### API Routes

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/v1/venues` | GET | Nearby venues (PostGIS) |
| `/api/v1/checkins` | GET, POST | Active check-in, create check-in |
| `/api/v1/interests` | GET, POST | Send/list mutual interests |
| `/api/v1/chats` | GET, POST | List/create direct chats |
| `/api/v1/tokens` | GET | Token balance & history |
| `/api/v1/reports` | POST | Submit user reports |
| `/api/v1/activities` | GET, POST | List/create venue activities |
| `/api/v1/venue-admin/[id]` | GET | Venue dashboard stats |

## Key Features

- **Venue Discovery** — Map with live venues and active user counts
- **QR Check-In** — Scan venue QR + geolocation verification
- **People** — See who's here, send waves, get matches
- **Micro-Chat** — 5-minute timed chats with message limits
- **Activities** — Polls, contests, tournaments, challenges, quests, auctions
- **Token Economy** — Earn by checking in, spend on boosts and premium features
- **Stealth Mode** — Dims UI for discreet usage in dark environments
- **Ephemeral Chats** — Auto-expire 24h after venue checkout
- **Safety** — Report, block, auto-moderation, RLS policies
- **Onboarding** — 4-step walkthrough for new users
- **Haptic Feedback** — Tactile responses on key actions (iOS)

## Design System

Dark-first UI with glassmorphism, neon glow effects, and ambient venue-colored gradients. Design tokens centralized in `apps/mobile/theme/tokens.ts`.

## Deployment

- **Mobile**: EAS Build (`apps/mobile/eas.json`) — development, preview, production profiles
- **Web + API**: Vercel — auto-deploy on push to main
- **Database**: Supabase cloud project (no local Docker)
- **Edge Functions**: Deploy via Supabase CLI: `npx supabase functions deploy --project-ref YOUR_PROJECT_REF`

## Languages

English and Russian supported out of the box. Translation files:
- Mobile: `apps/mobile/i18n/locales/{en,ru}.json`
- Web: `apps/web/i18n/locales/{en,ru}.json`

## License

Private — All rights reserved.
