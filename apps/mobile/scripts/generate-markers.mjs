/**
 * Generate per-venue-type map-marker PNGs (emoji chip on an ambient-color
 * background) in proper density buckets, plus a static require() manifest.
 *
 * Run from `apps/mobile`:
 *   node scripts/generate-markers.mjs
 *
 * Why PNGs (not custom <View>): Android Google Maps SDK + Expo New
 * Architecture (SDK 54+, RN 0.81+) snapshots custom View markers to a
 * bitmap whose bounds are computed incorrectly — verified on emulator:
 * only the top-left corner of the view is visible. `<Marker image>` with
 * a bundled asset skips view→bitmap entirely and draws natively.
 *
 * Why @1x/@2x/@3x buckets: a single suffix-less PNG lands in the mdpi
 * drawable bucket, so BitmapFactory.decodeResource scales it by device
 * density (×2–3.5) and the marker becomes gigantic. With density variants
 * the OS picks the right bucket and the marker is exactly SIZE dp.
 *
 * Emoji artwork comes from Twemoji SVGs (fetched once, cached in
 * .twemoji-cache/), rasterized by sharp at exact pixel sizes.
 *
 * Produces assets/markers/venue-{type}-{sm,md,lg}[-selected|-active][@Nx].png
 * and lib/venue-marker-icons.ts (typed require manifest).
 */

import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'assets', 'markers');
const CACHE_DIR = path.resolve(__dirname, '.twemoji-cache');
const MANIFEST = path.resolve(__dirname, '..', 'lib', 'venue-marker-icons.ts');

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg';

// Must mirror VENUE_EMOJI (lib/venue-constants.ts) + venueAmbient (theme/tokens.ts).
const TYPES = {
  karaoke: { emoji: '🎤', colors: ['#FF6B9D', '#FFD93D'] },
  nightclub: { emoji: '🪩', colors: ['#7C6FF7', '#FF6B9D'] },
  sports_bar: { emoji: '⚽', colors: ['#00E5A0', '#00D4FF'] },
  bowling: { emoji: '🎳', colors: ['#00D4FF', '#7C6FF7'] },
  billiards: { emoji: '🎱', colors: ['#00E5A0', '#7C6FF7'] },
  hookah: { emoji: '💨', colors: ['#1E1E3F', '#2A2A5A'] },
  board_games: { emoji: '🎲', colors: ['#FFD93D', '#7C6FF7'] },
  arcade: { emoji: '🕹️', colors: ['#FF6B9D', '#00D4FF'] },
  standup: { emoji: '🎭', colors: ['#FFD93D', '#FF6B9D'] },
  live_music: { emoji: '🎵', colors: ['#7C6FF7', '#FF6B9D'] },
  other: { emoji: '📍', colors: ['#2A2A5A', '#161630'] },
};

// Marker diameter in dp per user "marker size" preference — must match
// SIZE_DP in LiveVenueMarker.tsx.
const SIZE_DP = { sm: 34, md: 44, lg: 56 };
const SCALES = [1, 2, 3];

// Ring per marker state (mirrors the old live ring colors).
const STATES = {
  default: { ring: 'rgba(255,255,255,0.55)', ringScale: 0.035 },
  selected: { ring: '#FFFFFF', ringScale: 0.07 },
  active: { ring: '#00E5A0', ringScale: 0.06 },
};

// Cluster badge: count is dynamic, so we bake a small set of label buckets.
// Must match clusterCountLabel() in lib/venue-marker-icons.ts consumers.
const CLUSTER_LABELS = ['2', '3', '4', '5', '6', '7', '8', '9', '10+', '20+', '50+', '99+'];
const CLUSTER_DP = 40;
const CLUSTER_PURPLE = '#7C6FF7';

/** Twemoji filename: hyphen-joined codepoints, U+FE0F dropped. */
function twemojiCode(emoji) {
  return [...emoji]
    .map((c) => c.codePointAt(0).toString(16))
    .filter((c) => c !== 'fe0f')
    .join('-');
}

async function fetchTwemoji(emoji) {
  const code = twemojiCode(emoji);
  const cached = path.join(CACHE_DIR, `${code}.svg`);
  try {
    return await fs.readFile(cached);
  } catch {
    const res = await fetch(`${TWEMOJI_BASE}/${code}.svg`);
    if (!res.ok) throw new Error(`twemoji ${code} → HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(cached, buf);
    return buf;
  }
}

function chipSvg({ px, colors, ring, ringScale }) {
  const radius = px * 0.28;
  const rw = Math.max(1, px * ringScale);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${colors[0]}"/>
          <stop offset="1" stop-color="${colors[1]}"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${px}" height="${px}" rx="${radius}" ry="${radius}" fill="url(#bg)"/>
      <rect x="${rw / 2}" y="${rw / 2}" width="${px - rw}" height="${px - rw}"
            rx="${radius - rw / 2}" ry="${radius - rw / 2}"
            fill="none" stroke="${ring}" stroke-width="${rw}"/>
    </svg>
  `;
}

function clusterSvg({ px, label }) {
  const radius = px * 0.2;
  const rw = Math.max(1, px * 0.0375);
  const fontSize = px * (label.length >= 3 ? 0.3 : 0.36);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}">
      <rect x="0" y="0" width="${px}" height="${px}" rx="${radius}" ry="${radius}" fill="${CLUSTER_PURPLE}"/>
      <rect x="${rw}" y="${rw}" width="${px - rw * 2}" height="${px - rw * 2}"
            rx="${radius - rw}" ry="${radius - rw}"
            fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="${rw}"/>
      <text x="50%" y="50%" dy="0.36em" text-anchor="middle"
            font-family="Helvetica, Arial, sans-serif" font-weight="bold"
            font-size="${fontSize}" fill="#FFFFFF">${label}</text>
    </svg>
  `;
}

await fs.mkdir(OUT_DIR, { recursive: true });

// Remove PNGs from previous schemes.
for (const f of await fs.readdir(OUT_DIR).catch(() => [])) {
  if (f.endsWith('.png')) await fs.rm(path.join(OUT_DIR, f));
}

let count = 0;
for (const [type, { emoji, colors }] of Object.entries(TYPES)) {
  const emojiSvg = await fetchTwemoji(emoji);
  for (const [sizeKey, dp] of Object.entries(SIZE_DP)) {
    for (const [state, { ring, ringScale }] of Object.entries(STATES)) {
      for (const scale of SCALES) {
        const px = dp * scale;
        const emojiPx = Math.round(px * 0.58);
        const emojiPng = await sharp(emojiSvg, { density: 300 })
          .resize(emojiPx, emojiPx, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        const suffix = state === 'default' ? '' : `-${state}`;
        const at = scale === 1 ? '' : `@${scale}x`;
        const file = `venue-${type}-${sizeKey}${suffix}${at}.png`;
        await sharp(Buffer.from(chipSvg({ px, colors, ring, ringScale })))
          .composite([{ input: emojiPng, gravity: 'centre' }])
          .png({ compressionLevel: 9 })
          .toFile(path.join(OUT_DIR, file));
        count++;
      }
    }
  }
}

for (const label of CLUSTER_LABELS) {
  const slug = label.replace('+', 'plus');
  for (const scale of SCALES) {
    const at = scale === 1 ? '' : `@${scale}x`;
    await sharp(Buffer.from(clusterSvg({ px: CLUSTER_DP * scale, label })))
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT_DIR, `cluster-${slug}${at}.png`));
    count++;
  }
}

// ─── Typed require() manifest (Metro needs static requires) ───────────────
const sizeName = { sm: 'small', md: 'medium', lg: 'large' };
const lines = [];
lines.push('// AUTO-GENERATED by scripts/generate-markers.mjs — do not edit by hand.');
lines.push('// Per-venue-type marker chips (emoji on ambient background) in @1x/@2x/@3x');
lines.push('// density buckets, drawn natively via <Marker image> on Android.');
lines.push('');
lines.push("import type { MarkerSize } from '@/stores/ui.store';");
lines.push('');
lines.push("export type MarkerIconState = 'default' | 'selected' | 'active';");
lines.push('');
lines.push('export const VENUE_MARKER_ICONS: Record<');
lines.push('  string,');
lines.push('  Record<MarkerSize, Record<MarkerIconState, number>>');
lines.push('> = {');
for (const type of Object.keys(TYPES)) {
  lines.push(`  ${type}: {`);
  for (const sizeKey of Object.keys(SIZE_DP)) {
    lines.push(`    ${sizeName[sizeKey]}: {`);
    for (const state of Object.keys(STATES)) {
      const suffix = state === 'default' ? '' : `-${state}`;
      lines.push(
        `      ${state}: require('../assets/markers/venue-${type}-${sizeKey}${suffix}.png'),`,
      );
    }
    lines.push('    },');
  }
  lines.push('  },');
}
lines.push('};');
lines.push('');
lines.push('// Pre-rendered cluster badges (Android cannot snapshot dynamic <View>');
lines.push('// markers reliably). Buckets: exact 2–9, then 10+/20+/50+/99+.');
lines.push('export const CLUSTER_ICONS: Record<string, number> = {');
for (const label of CLUSTER_LABELS) {
  const slug = label.replace('+', 'plus');
  lines.push(`  '${label}': require('../assets/markers/cluster-${slug}.png'),`);
}
lines.push('};');
lines.push('');
lines.push('/** Map a live cluster count onto one of the pre-rendered label buckets. */');
lines.push('export function clusterCountLabel(count: number): string {');
lines.push('  if (count <= 9) return String(count);');
lines.push("  if (count < 20) return '10+';");
lines.push("  if (count < 50) return '20+';");
lines.push("  if (count < 99) return '50+';");
lines.push("  return '99+';");
lines.push('}');
lines.push('');
await fs.writeFile(MANIFEST, lines.join('\n'));

console.log(`✓ ${count} PNGs → assets/markers/`);
console.log(`✓ manifest → lib/venue-marker-icons.ts`);
