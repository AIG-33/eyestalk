import Link from 'next/link';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { COMPANY } from '@/components/site/company-info';
import { OpenInAppButton } from './open-in-app-button';

export const dynamic = 'force-dynamic';

/** Store + deep-link targets (bundle/package: com.eyestalkapp.app). */
const APP_STORE_URL = 'https://apps.apple.com/app/id6781209791';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.eyestalkapp.app';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VENUE_EMOJI: Record<string, string> = {
  karaoke: '🎤',
  nightclub: '🪩',
  sports_bar: '⚽',
  bowling: '🎳',
  billiards: '🎱',
  hookah: '💨',
  board_games: '🎲',
  arcade: '🕹️',
  standup: '🎭',
  live_music: '🎵',
  restaurant: '🍽️',
  cafe: '☕',
  bar: '🍸',
  gym: '🏋️',
  coworking: '💼',
  beauty_salon: '💅',
  hotel: '🏨',
  lounge: '🛋️',
  event_space: '🎪',
  food_court: '🍔',
  other: '📍',
};

type PublicVenue = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  address: string | null;
  logo_url: string | null;
  cover_url: string | null;
  venue_kind: string | null;
  is_active: boolean;
};

function prettyType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function getVenue(id: string): Promise<PublicVenue | null> {
  if (!UUID_RE.test(id)) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('venues')
    .select(
      'id, name, type, description, address, logo_url, cover_url, venue_kind, is_active',
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !data || data.is_active === false) return null;
  return data as PublicVenue;
}

async function getLiveCount(id: string): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', id)
      .eq('status', 'active');
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const venue = await getVenue(id);

  if (!venue) {
    return {
      title: 'Venue not found',
      description: 'This EyesTalk venue link is invalid or no longer active.',
      robots: { index: false, follow: false },
    };
  }

  const title = `${venue.name} · EyesTalk`;
  const description = venue.description?.trim()
    ? venue.description
    : `Join ${venue.name}${
        venue.address ? ` — ${venue.address}` : ''
      } on EyesTalk. Check in, see who's here right now, and start chatting.`;
  const image = venue.cover_url || venue.logo_url || undefined;
  const url = `${COMPANY.url}/venue/${venue.id}`;

  return {
    title: venue.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: COMPANY.brand,
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function VenueInvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await getVenue(id);

  if (!venue) {
    return (
      <div
        className="flex min-h-screen flex-col"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-5 py-24">
          <div className="mx-auto max-w-md text-center">
            <div className="text-6xl">🕵️</div>
            <h1
              className="mt-6 text-3xl font-extrabold tracking-tight"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.5px',
              }}
            >
              Venue not found
            </h1>
            <p
              className="mt-3 text-base"
              style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
            >
              This invite link is invalid, or the venue is no longer active on
              EyesTalk. Get the app and explore venues near you.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href={APP_STORE_URL}
                className="inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-bold text-white glow-primary transition-opacity hover:opacity-95"
                style={{
                  background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)',
                  minWidth: 180,
                }}
              >
                Download on iOS
              </a>
              <a
                href={PLAY_STORE_URL}
                className="inline-flex h-12 items-center justify-center rounded-2xl border px-6 text-sm font-semibold transition-colors"
                style={{
                  borderColor: 'rgba(255,255,255,0.12)',
                  color: 'var(--text-primary)',
                  minWidth: 180,
                }}
              >
                Get it on Android
              </a>
            </div>
            <p className="mt-6 text-sm">
              <Link
                href="/"
                className="underline hover:opacity-80"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Back to eyestalk.app
              </Link>
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const liveCount = await getLiveCount(venue.id);
  const emoji = VENUE_EMOJI[venue.type] || '📍';
  const kindBadge =
    venue.venue_kind === 'popup'
      ? { label: '🎉 Pop-up', color: '#D9A400', bg: 'rgba(255,217,61,0.14)' }
      : venue.venue_kind === 'community'
        ? { label: 'Community', color: 'var(--accent-info)', bg: 'rgba(0,212,255,0.12)' }
        : venue.venue_kind === 'unclaimed'
          ? { label: 'Unclaimed', color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.08)' }
          : null;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 -z-0 h-[480px] w-[820px] -translate-x-1/2 rounded-full opacity-[0.20] blur-[140px]"
            style={{ background: 'linear-gradient(135deg, #7C6FF7, #FF6B9D)' }}
          />

          <div className="relative z-10 mx-auto max-w-5xl px-5 pb-16 pt-14 sm:pt-20">
            {/* Cover / hero card */}
            <div
              className="relative overflow-hidden rounded-3xl border"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'var(--bg-secondary)',
              }}
            >
              <div className="relative h-56 w-full sm:h-72">
                {venue.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={venue.cover_url}
                    alt={venue.name}
                    className="h-full w-full object-cover opacity-80"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(124,111,247,0.28), rgba(255,107,157,0.16))',
                    }}
                  >
                    <span className="text-7xl">{emoji}</span>
                  </div>
                )}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(13,13,26,0) 30%, var(--bg-secondary) 100%)',
                  }}
                />
              </div>

              <div className="relative px-6 pb-8 pt-4 sm:px-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: 'rgba(124,111,247,0.12)',
                      color: 'var(--accent-light)',
                    }}
                  >
                    {emoji} {prettyType(venue.type)}
                  </span>
                  {kindBadge && (
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: kindBadge.bg, color: kindBadge.color }}
                    >
                      {kindBadge.label}
                    </span>
                  )}
                  {liveCount > 0 && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        background: 'rgba(0,229,160,0.14)',
                        color: 'var(--accent-success)',
                      }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full glow-success"
                        style={{ background: 'var(--accent-success)' }}
                      />
                      {liveCount} here now
                    </span>
                  )}
                </div>

                <h1
                  className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {venue.name}
                </h1>

                {venue.address && (
                  <p
                    className="mt-3 flex items-center gap-2 text-base"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span aria-hidden>📍</span>
                    {venue.address}
                  </p>
                )}

                {venue.description && (
                  <p
                    className="mt-4 max-w-2xl text-base"
                    style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
                  >
                    {venue.description}
                  </p>
                )}

                {/* CTAs */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <OpenInAppButton
                    venueId={venue.id}
                    appStoreUrl={APP_STORE_URL}
                    playStoreUrl={PLAY_STORE_URL}
                    label="Open in app"
                  />
                  <div className="flex gap-3">
                    <a
                      href={APP_STORE_URL}
                      className="inline-flex h-14 items-center justify-center rounded-2xl border px-6 text-sm font-semibold transition-colors"
                      style={{
                        borderColor: 'rgba(255,255,255,0.12)',
                        color: 'var(--text-primary)',
                      }}
                    >
                       App Store
                    </a>
                    <a
                      href={PLAY_STORE_URL}
                      className="inline-flex h-14 items-center justify-center rounded-2xl border px-6 text-sm font-semibold transition-colors"
                      style={{
                        borderColor: 'rgba(255,255,255,0.12)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      ▶ Google Play
                    </a>
                  </div>
                </div>

                <p
                  className="mt-5 text-xs"
                  style={{ color: 'var(--text-tertiary)', letterSpacing: '0.3px' }}
                >
                  Open this invite on your phone to jump straight into the venue.
                  Check in to join the room, see who&apos;s here, and start
                  chatting.
                </p>
              </div>
            </div>

            {/* How joining works */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <StepCard
                num="1"
                title="Open in EyesTalk"
                body="Tap “Open in app” — the link takes you straight to this venue. No app yet? Grab it from the store."
              />
              <StepCard
                num="2"
                title="Check in"
                body="Confirm you're here by geofence, QR, or a venue code. Guests can browse; a free account unlocks joining."
              />
              <StepCard
                num="3"
                title="Meet the room"
                body="See who's checked in right now, send a wave, join the venue chat and activities — all while you're there."
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function StepCard({
  num,
  title,
  body,
}: {
  num: string;
  title: string;
  body: string;
}) {
  return (
    <div
      className="rounded-3xl border p-6"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl text-base font-extrabold text-white glow-primary"
        style={{
          background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {num}
      </div>
      <h3
        className="text-lg font-bold"
        style={{
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.2px',
        }}
      >
        {title}
      </h3>
      <p
        className="mt-2 text-sm"
        style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}
      >
        {body}
      </p>
    </div>
  );
}
