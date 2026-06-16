/**
 * Generate the Google Play "Feature graphic" (1024×500, 24-bit PNG, no alpha)
 * in the new EyesTalk glass identity: a frosted glass plaque with dual ambient
 * glows, the glasses speech-bubble mark, the Eyes/Talk wordmark + mint dot, and
 * the tagline "From a glance to a conversation".
 *
 * Brand-correct text requires the Clash Display font to be visible to librsvg.
 * Run from `apps/mobile` with a fontconfig that points at assets/fonts:
 *
 *   FONTCONFIG_FILE=/tmp/etfc.conf node scripts/generate-feature-graphic.mjs
 *
 * Output: store-listing/assets/feature-graphic-1024x500.png
 */

import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(
  __dirname,
  '..',
  'store-listing',
  'assets',
  'feature-graphic-1024x500.png',
);

const W = 1024;
const H = 500;

// ── Brand palette ──
const PURPLE = '#7C6FF7';
const PURPLE_LIGHT = '#A29BFE';
const BLUE = '#4F6BF0';
const MAGENTA = '#C44D86';
const MINT = '#22D3A0';
const BG = '#0A0A12';
const SLOGAN_COLOR = '#CBCCDD';

// ── Brand mark geometry (viewBox 220×170) ──
const BUBBLE =
  'M110 12 C 164 12 204 38 204 74 C 204 110 164 136 110 136 ' +
  'C 96 136 82.5 134.4 70 131.5 L 53 156 C 51.5 158 48.5 156.8 49.2 154.4 ' +
  'L 56 132.5 C 30 122 16 100 16 74 C 16 38 56 12 110 12 Z';
const CONNECTOR = 'M96 74 C 100 66 120 66 124 74 C 120 82 100 82 96 74 Z';
const MARK_W = 220;
const MARK_H = 170;

const FONT = "'Clash Display','Space Grotesk',sans-serif";

const buf = (svg) => Buffer.from(svg);

/** Frosted-glass glasses mark, scaled to a given pixel height. */
function glassMarkSvg(px) {
  const scale = px / MARK_H;
  const w = Math.ceil(MARK_W * scale);
  const h = Math.ceil(MARK_H * scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${MARK_W} ${MARK_H}">
    <g>
      <path d="${BUBBLE}" fill="rgba(201,196,255,0.20)" stroke="rgba(255,255,255,0.55)" stroke-width="2.5"/>
      <circle cx="74" cy="74" r="29" fill="#FFFFFF"/>
      <circle cx="146" cy="74" r="29" fill="#FFFFFF"/>
      <path d="${CONNECTOR}" fill="#FFFFFF"/>
      <circle cx="74" cy="74" r="14.5" fill="${PURPLE}"/>
      <circle cx="146" cy="74" r="14.5" fill="${PURPLE}"/>
      <path d="M94 104 Q 110 120 126 104" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>
    </g>
  </svg>`;
}

/** EyesTalk wordmark + mint dot, transparent, generous canvas (trimmed later). */
function wordmarkSvg() {
  const fs = 150;
  const cw = 900;
  const ch = 220;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}">
    <defs>
      <linearGradient id="talk" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${PURPLE_LIGHT}"/>
        <stop offset="1" stop-color="${PURPLE}"/>
      </linearGradient>
    </defs>
    <text x="10" y="160" font-family="${FONT}" font-weight="700" font-size="${fs}" letter-spacing="-5">
      <tspan fill="#FFFFFF">Eyes</tspan><tspan fill="url(#talk)">Talk</tspan>
    </text>
  </svg>`;
}

/** Standalone mint "live" dot. */
function dotSvg(r) {
  const s = r * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <circle cx="${r}" cy="${r}" r="${r}" fill="${MINT}"/>
  </svg>`;
}

/** Tagline, transparent, trimmed later. */
function sloganSvg() {
  const fs = 46;
  const cw = 1000;
  const ch = 110;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}">
    <text x="10" y="70" font-family="${FONT}" font-weight="500" font-size="${fs}"
          letter-spacing="0.3" fill="${SLOGAN_COLOR}">From a glance to a conversation</text>
  </svg>`;
}

/** Full-bleed coloured glow background (blue → violet → magenta), no dark margin. */
function backgroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2A2563"/>
        <stop offset="0.5" stop-color="#352251"/>
        <stop offset="1" stop-color="#3C1E40"/>
      </linearGradient>
      <filter id="soft" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="150"/>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#base)"/>
    <g filter="url(#soft)">
      <circle cx="250" cy="250" r="430" fill="${BLUE}" opacity="0.42"/>
      <circle cx="540" cy="180" r="360" fill="${PURPLE}" opacity="0.38"/>
      <circle cx="800" cy="300" r="430" fill="${MAGENTA}" opacity="0.40"/>
    </g>
  </svg>`;
}

async function trimmed(svg) {
  return sharp(buf(svg))
    .trim({ threshold: 1 })
    .png()
    .toBuffer({ resolveWithObject: true });
}

async function main() {
  const markPx = 150;
  const dotR = 14;
  const [mark, wordmark, dot] = await Promise.all([
    trimmed(glassMarkSvg(markPx)),
    trimmed(wordmarkSvg()),
    sharp(buf(dotSvg(dotR))).png().toBuffer({ resolveWithObject: true }),
  ]);

  const gap = 34; // mark ↔ wordmark
  const lockW = mark.info.width + gap + wordmark.info.width;
  const lockH = Math.max(mark.info.height, wordmark.info.height);

  const lockTop = Math.round((H - lockH) / 2);
  const lockLeft = Math.round((W - lockW) / 2);
  const markTop = lockTop + Math.round((lockH - mark.info.height) / 2);
  const wordTop = lockTop + Math.round((lockH - wordmark.info.height) / 2);

  const wordLeft = lockLeft + mark.info.width + gap;
  const dotLeft = wordLeft + wordmark.info.width - dotR;
  const dotTop = wordTop + Math.round(wordmark.info.height * 0.06);

  const base = sharp(buf(backgroundSvg()));
  const out = await base
    .composite([
      { input: mark.data, left: lockLeft, top: markTop },
      { input: wordmark.data, left: wordLeft, top: wordTop },
      { input: dot.data, left: dotLeft, top: dotTop },
    ])
    .flatten({ background: BG })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(out).removeAlpha().toFile(OUT);
  console.log(`✓ feature graphic → ${OUT} (${W}×${H})`);
}

main();
