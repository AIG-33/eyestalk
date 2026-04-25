import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { COMPANY } from '@/components/site/company-info';

export const metadata: Metadata = {
  title: 'EyesTalk — From a glance to a conversation',
  description:
    'Meet the people around you in real time. Check in to a venue, see who is here right now, send a wave, and start a chat. EyesTalk is the location-based social app for bars, clubs, lounges, karaoke and more.',
  openGraph: {
    title: 'EyesTalk — From a glance to a conversation',
    description:
      'Real-time, location-based social app for venues. See who is here, wave, chat.',
    url: COMPANY.url,
    siteName: COMPANY.brand,
    type: 'website',
  },
};

const features: { emoji: string; title: string; body: string }[] = [
  {
    emoji: '🗺️',
    title: 'Discover venues nearby',
    body: 'A live map of bars, clubs, karaoke rooms, lounges and more — with how many people are checked in right now.',
  },
  {
    emoji: '📍',
    title: 'Check in by QR + geofence',
    body: 'Scan the venue QR or arrive within the geofence to check in. Honest presence — only people who are actually here show up.',
  },
  {
    emoji: '👀',
    title: 'See who is around you',
    body: 'Browse the people checked in to your venue, send a wave, and discover mutual interests without ever leaving the room.',
  },
  {
    emoji: '💬',
    title: 'Micro-chats that auto-expire',
    body: '5-minute timed chats with a message limit, plus full chats once you match. Everything fades when you leave the venue.',
  },
  {
    emoji: '🎉',
    title: 'Activities that fit the night',
    body: 'Polls, quests, tournaments, contests and auctions hosted by the venue — earn tokens and join in for the fun.',
  },
  {
    emoji: '🛡️',
    title: 'Safety by design',
    body: 'Block, report, age-gated content, ephemeral chats, and venue-side moderation. Strong defaults, friendly tone.',
  },
];

const steps: { num: string; title: string; body: string }[] = [
  {
    num: '1',
    title: 'Find a venue',
    body: 'Open the map and pick a place near you — see the venue type, vibe, and how busy it is right now.',
  },
  {
    num: '2',
    title: 'Check in',
    body: 'Scan the QR or step into the geofence. Your presence is live for as long as you are there — no longer.',
  },
  {
    num: '3',
    title: 'Wave & chat',
    body: 'See who is around, send a wave, match, and start a micro-chat. Real conversations that begin from a glance.',
  },
];

export default function LandingPage() {
  return (
    <>
      {/* HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Ambient glow halo */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.22] blur-[140px]"
          style={{
            background: 'linear-gradient(135deg, #7C6FF7, #FF6B9D)',
          }}
        />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-5 pb-20 pt-20 text-center sm:pt-28">
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: 'rgba(124,111,247,0.35)',
              background: 'rgba(124,111,247,0.10)',
              color: 'var(--accent-light)',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full glow-success"
              style={{ background: 'var(--accent-success)' }}
            />
            Now in private beta
          </div>

          <h1
            className="max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
          >
            From a glance to a{' '}
            <span className="text-gradient-primary">conversation</span>
          </h1>

          <p
            className="mt-6 max-w-2xl text-lg sm:text-xl"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}
          >
            EyesTalk is a real-time, location-based social app. Check in to a
            venue, see who is here right now, send a wave, and start a chat —
            in the room, not on a feed.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center rounded-2xl px-7 text-base font-bold text-white glow-primary transition-opacity hover:opacity-95"
              style={{
                background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)',
                minWidth: 220,
              }}
            >
              Join the venue panel
            </Link>
            <Link
              href="#how"
              className="inline-flex h-14 items-center justify-center rounded-2xl border px-7 text-base font-semibold transition-colors"
              style={{
                borderColor: 'rgba(255,255,255,0.12)',
                color: 'var(--text-primary)',
                minWidth: 220,
              }}
            >
              See how it works
            </Link>
          </div>

          <p
            className="mt-5 text-xs"
            style={{ color: 'var(--text-tertiary)', letterSpacing: '0.4px' }}
          >
            iOS &amp; Android apps coming soon · No location tracking outside venues
          </p>

          {/* Glassy preview slab */}
          <div
            className="mt-16 grid w-full max-w-4xl gap-4 rounded-3xl border p-5 sm:grid-cols-3"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
            }}
          >
            <PreviewStat
              dot="success"
              label="People here now"
              value="42"
              hint="🪩 Onyx Club · live"
            />
            <PreviewStat
              dot="pink"
              label="Mutual matches today"
              value="7"
              hint="3 new in last hour"
            />
            <PreviewStat
              dot="warn"
              label="Tokens earned"
              value="🪙 1,250"
              hint="From check-ins & quests"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS ─────────────────────────────────── */}
      <section id="how" className="relative px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="How it works"
            title="Three steps from arriving to talking"
            sub="EyesTalk only works when you are actually somewhere. That is the whole point."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.num}
                className="rounded-3xl border p-7 transition-colors"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-extrabold text-white glow-primary"
                  style={{
                    background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {s.num}
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-2 text-sm"
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES ─────────────────────────────────────── */}
      <section id="features" className="relative px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Features"
            title="Built for the room you are in"
            sub="Designed to look great glowing on a table at 1am — with real safeguards behind the scenes."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-3xl border p-6 transition-colors"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="text-3xl">{f.emoji}</div>
                <h3
                  className="mt-4 text-lg font-bold"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {f.title}
                </h3>
                <p
                  className="mt-2 text-sm"
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR VENUES ───────────────────────────────────── */}
      <section id="venues" className="relative px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <div
            className="relative overflow-hidden rounded-3xl border p-10 md:p-14"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-[320px] w-[320px] rounded-full opacity-30 blur-[100px]"
              style={{
                background: 'linear-gradient(135deg, #7C6FF7, #FF6B9D)',
              }}
            />

            <div className="relative z-10 grid gap-12 md:grid-cols-2">
              <div>
                <div
                  className="eyebrow mb-3"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  For venues
                </div>
                <h2
                  className="text-3xl font-extrabold tracking-tight sm:text-4xl"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.5px',
                    lineHeight: 1.1,
                  }}
                >
                  Turn your room into the night people remember
                </h2>
                <p
                  className="mt-4 max-w-md text-base"
                  style={{
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  Run polls, quests and contests live. See who is here in real
                  time. Send announcements straight to checked-in guests.
                  Track loyalty and reward your regulars — all from one panel.
                </p>
                <Link
                  href="/login"
                  className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-bold text-white glow-primary transition-opacity hover:opacity-95"
                  style={{
                    background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)',
                  }}
                >
                  Open the venue panel
                </Link>
              </div>

              <ul className="space-y-3">
                <BulletItem
                  emoji="🪪"
                  title="QR check-in"
                  body="Print, place, done. Geofence guards against fakes."
                />
                <BulletItem
                  emoji="📊"
                  title="Live analytics"
                  body="People here, check-ins over time, peak hours, loyalty tiers."
                />
                <BulletItem
                  emoji="🎯"
                  title="Activities & announcements"
                  body="Polls, contests, tournaments, quests — and direct messages to guests in the room."
                />
                <BulletItem
                  emoji="🛡️"
                  title="Moderation built in"
                  body="Resolve reports, ban abusers, keep the room safe."
                />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA ────────────────────────────────────── */}
      <section className="relative px-5 pb-24 pt-6">
        <div
          className="mx-auto flex max-w-4xl flex-col items-center rounded-3xl border px-8 py-14 text-center"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <Image
            src="/logo-mark.svg"
            alt="EyesTalk"
            width={64}
            height={64}
            style={{
              filter: 'drop-shadow(0 0 24px rgba(124,111,247,0.55))',
            }}
          />
          <h2
            className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
            }}
          >
            Ready when the night is.
          </h2>
          <p
            className="mt-3 max-w-lg text-base"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
          >
            Be the first to know when EyesTalk launches in your city. Venue
            owners can sign in to the panel today.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-bold text-white glow-primary transition-opacity hover:opacity-95"
              style={{
                background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)',
                minWidth: 200,
              }}
            >
              Sign in
            </Link>
            <a
              href={`mailto:${COMPANY.email}?subject=EyesTalk%20launch%20in%20my%20city`}
              className="inline-flex h-12 items-center justify-center rounded-2xl border px-6 text-sm font-semibold transition-colors"
              style={{
                borderColor: 'rgba(255,255,255,0.12)',
                color: 'var(--text-primary)',
                minWidth: 200,
              }}
            >
              Get in touch
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── helpers ──────────────────────────────────────────── */

function SectionHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div
        className="eyebrow mb-3"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {eyebrow}
      </div>
      <h2
        className="text-3xl font-extrabold tracking-tight sm:text-4xl"
        style={{
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.5px',
          lineHeight: 1.15,
        }}
      >
        {title}
      </h2>
      <p
        className="mx-auto mt-4 max-w-xl text-base"
        style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
      >
        {sub}
      </p>
    </div>
  );
}

function PreviewStat({
  dot,
  label,
  value,
  hint,
}: {
  dot: 'success' | 'pink' | 'warn';
  label: string;
  value: string;
  hint: string;
}) {
  const dotColor =
    dot === 'success'
      ? 'var(--accent-success)'
      : dot === 'pink'
        ? 'var(--accent-pink)'
        : 'var(--accent-warning)';
  const dotGlow =
    dot === 'success'
      ? 'glow-success'
      : dot === 'pink'
        ? 'glow-pink'
        : 'glow-warn';
  return (
    <div className="text-left">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${dotGlow}`}
          style={{ background: dotColor }}
        />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {label}
        </span>
      </div>
      <div
        className="mt-2 text-3xl font-extrabold"
        style={{
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.5px',
        }}
      >
        {value}
      </div>
      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        {hint}
      </div>
    </div>
  );
}

function BulletItem({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <li
      className="flex gap-4 rounded-2xl border p-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="text-2xl leading-none">{emoji}</div>
      <div>
        <div
          className="text-sm font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </div>
        <div
          className="text-xs"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}
        >
          {body}
        </div>
      </div>
    </li>
  );
}
