/**
 * Generate venue map-marker PNGs from inline SVG.
 *
 * Run from `apps/mobile`:
 *   node scripts/generate-markers.mjs
 *
 * Why PNGs (not custom <View>): Android Google Maps SDK + Expo New
 * Architecture (SDK 54+, RN 0.81+) snapshots custom View markers to a
 * bitmap whose bounds are computed incorrectly, clipping the marker.
 * `<Marker image={require(...)} />` skips view→bitmap entirely and
 * draws the PNG natively.
 *
 * Produces (under assets/markers/):
 *   venue.png            132×132   default purple rounded square + EyesTalk eyes
 *   venue-selected.png   132×132   default + white outer ring
 *   venue-active.png     132×132   default + green ring (for active checkins)
 */

import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'assets', 'markers');

const SIZE = 132; // 44dp @ 3x density — reasonable default
const PURPLE = '#7C6FF7';
const PURPLE_DARK = '#5A4FE0';
const WHITE = '#FFFFFF';
const GREEN = '#00E5A0';
const NAVY = '#1B1464';

/**
 * Build the EyesTalk eyes mark, sized to fit the marker centre.
 * Original mark viewBox: 220×170; we extract just the eyes (no bubble).
 *
 * Eye centres (from logo-mark.svg): left (74,74), right (146,74), r=29
 * We crop to 44 ≤ x ≤ 176 (132 wide), 45 ≤ y ≤ 103 (58 tall).
 */
function eyesMark({ size, color = WHITE }) {
  // Source eye box: 132 wide × 58 tall, anchored at (110, 74).
  // We scale it to ~46% of marker size; centred horizontally and vertically.
  const w = size * 0.55;
  const h = w * (58 / 132);
  const tx = (size - w) / 2 - 44 * (w / 132);
  const ty = (size - h) / 2 - 45 * (h / 58);
  const sx = w / 132;
  const sy = h / 58;
  return `
    <g transform="translate(${tx},${ty}) scale(${sx},${sy})">
      <circle cx="74" cy="74" r="29" fill="${color}"/>
      <circle cx="146" cy="74" r="29" fill="${color}"/>
      <path d="M96 74 C 100 66 120 66 124 74 C 120 82 100 82 96 74 Z" fill="${color}"/>
      <circle cx="74" cy="74" r="14.5" fill="${NAVY}"/>
      <circle cx="146" cy="74" r="14.5" fill="${NAVY}"/>
    </g>
  `;
}

function venueSvg({ ringColor, ringWidth }) {
  const pad = ringWidth ?? 0;
  const innerSize = SIZE - pad * 2 - 4; // 4px breathing room for outer shadow
  const innerXY = (SIZE - innerSize) / 2;
  const radius = innerSize * 0.18;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${PURPLE}"/>
          <stop offset="1" stop-color="${PURPLE_DARK}"/>
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      ${ringColor && ringWidth ? `
        <rect x="${pad / 2}" y="${pad / 2}"
              width="${SIZE - pad}" height="${SIZE - pad}"
              rx="${(SIZE - pad) * 0.18}" ry="${(SIZE - pad) * 0.18}"
              fill="${ringColor}"/>
      ` : ''}
      <g filter="url(#shadow)">
        <rect x="${innerXY}" y="${innerXY}"
              width="${innerSize}" height="${innerSize}"
              rx="${radius}" ry="${radius}"
              fill="url(#bg)"/>
      </g>
      ${eyesMark({ size: SIZE })}
    </svg>
  `;
}

const VARIANTS = [
  { name: 'venue.png',          opts: { ringColor: null, ringWidth: 0 } },
  { name: 'venue-selected.png', opts: { ringColor: WHITE, ringWidth: 8 } },
  { name: 'venue-active.png',   opts: { ringColor: GREEN, ringWidth: 6 } },
];

await fs.mkdir(OUT_DIR, { recursive: true });

for (const { name, opts } of VARIANTS) {
  const svg = venueSvg(opts);
  await sharp(Buffer.from(svg))
    .resize(SIZE, SIZE)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, name));
  console.log(`✓ ${name}  (${SIZE}×${SIZE})`);
}

console.log('\nMarkers generated.');
