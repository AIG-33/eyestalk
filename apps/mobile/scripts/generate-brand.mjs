/**
 * Generate EyesTalk brand assets in the new flat identity:
 *   a violet-gradient superellipse icon holding a white speech-bubble mark
 *   (glasses + eyes knocked out). Matches brand/svg + brand-tokens.json.
 *
 * Run from `apps/mobile`:
 *   node scripts/generate-brand.mjs
 *
 * Produces (under assets/):
 *   icon.png             1024  opaque gradient square + white mark (iOS)
 *   adaptive-icon.png    1024  transparent white mark (Android foreground)
 *   adaptive-icon-bg.png 1024  violet gradient (Android background)
 *   splash-icon.png      1024  gradient mark + soft glow (on #0D0D1A splash)
 *   favicon.png            48  mini gradient icon
 *   notification-icon.png  96  white silhouette (Android status bar)
 *   brand-logo.png       1024  showcase card to share
 */

import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'assets');

// ── Brand mark geometry (brand/svg, viewBox 220×170) ──
const BUBBLE =
  'M110 12 C 164 12 204 38 204 74 C 204 110 164 136 110 136 ' +
  'C 96 136 82.5 134.4 70 131.5 L 53 156 C 51.5 158 48.5 156.8 49.2 154.4 ' +
  'L 56 132.5 C 30 122 16 100 16 74 C 16 38 56 12 110 12 Z';
const CONNECTOR = 'M96 74 C 100 66 120 66 124 74 C 120 82 100 82 96 74 Z';
const MARK_W = 220;
const MARK_H = 170;

const PURPLE = '#7C6FF7';
const PURPLE_LIGHT = '#A29BFE';
const PURPLE_DEEP = '#5A4FE0';
const BLUE = '#4F6BF0';
const PINK = '#FF6B9D';
const SPLASH_BG = '#0D0D1A';

function markTransform(S, ratio) {
  const markW = S * ratio;
  const scale = markW / MARK_W;
  const markH = MARK_H * scale;
  const tx = (S - markW) / 2;
  const ty = (S - markH) / 2;
  return { scale, tx, ty };
}

/** White speech-bubble mark with the eyes/bridge knocked out (transparent). */
function whiteKnockoutMark(S, ratio, id = 'k') {
  const { scale, tx, ty } = markTransform(S, ratio);
  return `
    <defs>
      <mask id="${id}">
        <rect x="0" y="0" width="${MARK_W}" height="${MARK_H}" fill="#fff"/>
        <circle cx="74" cy="74" r="29" fill="#000"/>
        <circle cx="146" cy="74" r="29" fill="#000"/>
        <path d="${CONNECTOR}" fill="#000"/>
        <circle cx="74" cy="74" r="14.5" fill="#fff"/>
        <circle cx="146" cy="74" r="14.5" fill="#fff"/>
      </mask>
    </defs>
    <g transform="translate(${tx},${ty}) scale(${scale})">
      <path d="${BUBBLE}" fill="#FFFFFF" mask="url(#${id})"/>
    </g>`;
}

/** Gradient bubble with solid white eyes + gradient pupils (for dark splash). */
function gradientMark(S, ratio) {
  const { scale, tx, ty } = markTransform(S, ratio);
  return `
    <g transform="translate(${tx},${ty}) scale(${scale})">
      <path d="${BUBBLE}" fill="url(#grad)"/>
      <circle cx="74" cy="74" r="29" fill="#FFFFFF"/>
      <circle cx="146" cy="74" r="29" fill="#FFFFFF"/>
      <path d="${CONNECTOR}" fill="#FFFFFF"/>
      <circle cx="74" cy="74" r="14.5" fill="url(#grad)"/>
      <circle cx="146" cy="74" r="14.5" fill="url(#grad)"/>
    </g>`;
}

const GRAD_DEF = `
  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${PURPLE}"/>
    <stop offset="1" stop-color="${PURPLE_LIGHT}"/>
  </linearGradient>`;

/** Opaque violet-gradient square + white mark (iOS app icon — iOS masks corners). */
function iconSvg(S, ratio = 0.56) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    <defs>${GRAD_DEF}</defs>
    <rect width="${S}" height="${S}" fill="url(#grad)"/>
    ${whiteKnockoutMark(S, ratio, 'iconMask')}
  </svg>`;
}

/** Rounded gradient square + white mark (favicon / unmasked contexts). */
function roundedIconSvg(S, ratio = 0.6) {
  const r = S * 0.2237; // iOS superellipse approximation
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    <defs>${GRAD_DEF}</defs>
    <rect width="${S}" height="${S}" rx="${r}" ry="${r}" fill="url(#grad)"/>
    ${whiteKnockoutMark(S, ratio, 'favMask')}
  </svg>`;
}

/** Transparent white mark for the Android adaptive-icon foreground. */
function adaptiveForegroundSvg(S, ratio = 0.42) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    ${whiteKnockoutMark(S, ratio, 'adMask')}
  </svg>`;
}

/** Plain violet-gradient fill for the Android adaptive-icon background. */
function adaptiveBgSvg(S) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    <defs>${GRAD_DEF}</defs>
    <rect width="${S}" height="${S}" fill="url(#grad)"/>
  </svg>`;
}

/** Transparent gradient mark + soft violet glow (splash on #0D0D1A). */
function splashSvg(S, ratio = 0.5) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    <defs>
      ${GRAD_DEF}
      <filter id="halo" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="${S * 0.05}"/>
      </filter>
    </defs>
    <g filter="url(#halo)">
      <circle cx="${S / 2}" cy="${S / 2}" r="${S * ratio * 0.62}" fill="${PURPLE}" opacity="0.40"/>
    </g>
    ${gradientMark(S, ratio)}
  </svg>`;
}

/** Monochrome white silhouette (Android notification icon — alpha only). */
function monoSvg(S, ratio = 0.74) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    ${whiteKnockoutMark(S, ratio, 'monoMask')}
  </svg>`;
}

/** Shareable showcase: dark card + ambient glow + gradient mark. */
function showcaseSvg(S) {
  const r = S * 0.08;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    <defs>
      ${GRAD_DEF}
      <radialGradient id="card" cx="0.5" cy="0.4" r="0.8">
        <stop offset="0" stop-color="#1A1830"/>
        <stop offset="1" stop-color="#0A0A14"/>
      </radialGradient>
      <filter id="amb" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="${S * 0.1}"/>
      </filter>
      <clipPath id="cardClip">
        <rect x="${S * 0.06}" y="${S * 0.06}" width="${S * 0.88}" height="${S * 0.88}" rx="${r}" ry="${r}"/>
      </clipPath>
    </defs>
    <rect width="${S}" height="${S}" fill="#0A0A14"/>
    <rect x="${S * 0.06}" y="${S * 0.06}" width="${S * 0.88}" height="${S * 0.88}"
          rx="${r}" ry="${r}" fill="url(#card)"/>
    <g clip-path="url(#cardClip)" filter="url(#amb)">
      <circle cx="${S * 0.34}" cy="${S * 0.34}" r="${S * 0.24}" fill="${PURPLE}" opacity="0.5"/>
      <circle cx="${S * 0.66}" cy="${S * 0.40}" r="${S * 0.2}" fill="${BLUE}" opacity="0.4"/>
      <circle cx="${S * 0.64}" cy="${S * 0.68}" r="${S * 0.24}" fill="${PINK}" opacity="0.38"/>
      <circle cx="${S * 0.36}" cy="${S * 0.68}" r="${S * 0.2}" fill="${PURPLE_DEEP}" opacity="0.36"/>
    </g>
    ${gradientMark(S, 0.48)}
  </svg>`;
}

async function render(svg, size, file, { flatten = false } = {}) {
  let img = sharp(Buffer.from(svg)).resize(size, size);
  if (flatten) img = img.flatten({ background: PURPLE });
  await img.png({ compressionLevel: 9 }).toFile(path.join(OUT, file));
  console.log(`✓ ${file}  (${size}×${size})`);
}

await fs.mkdir(OUT, { recursive: true });

// iOS app icon — opaque (no alpha)
await render(iconSvg(1024), 1024, 'icon.png', { flatten: true });
// Android adaptive icon — foreground mark inside the ~66% safe zone + bg layer
await render(adaptiveForegroundSvg(1024), 1024, 'adaptive-icon.png');
await render(adaptiveBgSvg(1024), 1024, 'adaptive-icon-bg.png');
// Splash mark on the dark splash backdrop
await render(splashSvg(1024), 1024, 'splash-icon.png');
// Web favicon (rounded mini icon)
await render(roundedIconSvg(64), 48, 'favicon.png');
// Android notification icon (monochrome)
await render(monoSvg(96), 96, 'notification-icon.png');
// Shareable showcase
await render(showcaseSvg(1024), 1024, 'brand-logo.png');

console.log('\nBrand assets generated (flat violet identity).');
