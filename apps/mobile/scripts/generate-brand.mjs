/**
 * Generate EyesTalk brand assets in the "glassmorphism" style:
 * a frosted-glass speech bubble (translucent fill + light rim) with the
 * dual-eye glasses, floating over ambient purple/blue/pink light.
 *
 * Run from `apps/mobile`:
 *   node scripts/generate-brand.mjs
 *
 * Produces (under assets/):
 *   icon.png            1024  opaque full scene (iOS app icon — no alpha)
 *   adaptive-icon.png   1024  transparent, mark in Android safe zone
 *   splash-icon.png     1024  transparent, mark + soft glow
 *   favicon.png           48  small mark
 *   notification-icon.png 96  white monochrome silhouette (Android status bar)
 *   brand-logo.png      1024  showcase (rounded card) to share
 */

import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'assets');

// ── Brand mark geometry (matches assets/logo-mark.svg, viewBox 220×170) ──
const BUBBLE =
  'M110 12 C 164 12 204 38 204 74 C 204 110 164 136 110 136 ' +
  'C 96 136 82.5 134.4 70 131.5 L 53 156 C 51.5 158 48.5 156.8 49.2 154.4 ' +
  'L 56 132.5 C 30 122 16 100 16 74 C 16 38 56 12 110 12 Z';
const CONNECTOR = 'M96 74 C 100 66 120 66 124 74 C 120 82 100 82 96 74 Z';
const MARK_W = 220;
const MARK_H = 170;

const PURPLE = '#7C6FF7';
const PURPLE_DEEP = '#5A4FE0';
const BLUE = '#4F6BF0';
const PINK = '#FF6B9D';
const BG_TOP = '#1A1830';
const BG_BOTTOM = '#0A0A14';

/**
 * Build the glass-bubble mark group, scaled to `markW` and centred in `S`.
 * @param {number} S      canvas size
 * @param {number} ratio  mark width as a fraction of the canvas
 * @param {object} opts   { mono?: boolean }
 */
function markGroup(S, ratio, { mono = false } = {}) {
  const markW = S * ratio;
  const scale = markW / MARK_W;
  const markH = MARK_H * scale;
  const tx = (S - markW) / 2;
  const ty = (S - markH) / 2;

  if (mono) {
    // Flat white silhouette (notification icon).
    return `
      <g transform="translate(${tx},${ty}) scale(${scale})">
        <path d="${BUBBLE}" fill="#FFFFFF"/>
        <circle cx="74" cy="74" r="29" fill="#000000"/>
        <circle cx="146" cy="74" r="29" fill="#000000"/>
        <circle cx="74" cy="74" r="15" fill="#FFFFFF"/>
        <circle cx="146" cy="74" r="15" fill="#FFFFFF"/>
      </g>`;
  }

  return `
    <g transform="translate(${tx},${ty}) scale(${scale})">
      <!-- frosted glass body: translucent fill + bright rim -->
      <g filter="url(#bubbleGlow)">
        <path d="${BUBBLE}" fill="rgba(255,255,255,0.12)"
              stroke="rgba(255,255,255,0.55)" stroke-width="3.4"/>
      </g>
      <!-- top sheen for the glass highlight -->
      <path d="${BUBBLE}" fill="url(#sheen)"/>
      <!-- eyes -->
      <circle cx="74" cy="74" r="29" fill="#FFFFFF"/>
      <circle cx="146" cy="74" r="29" fill="#FFFFFF"/>
      <path d="${CONNECTOR}" fill="#FFFFFF"/>
      <circle cx="74" cy="74" r="14.5" fill="url(#pupil)"/>
      <circle cx="146" cy="74" r="14.5" fill="url(#pupil)"/>
    </g>`;
}

function defs(S) {
  return `
    <defs>
      <radialGradient id="bgGrad" cx="0.5" cy="0.42" r="0.8">
        <stop offset="0" stop-color="${BG_TOP}"/>
        <stop offset="1" stop-color="${BG_BOTTOM}"/>
      </radialGradient>
      <linearGradient id="pupil" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${PURPLE}"/>
        <stop offset="1" stop-color="${BLUE}"/>
      </linearGradient>
      <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.30"/>
        <stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0.05"/>
        <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
      </linearGradient>
      <filter id="ambient" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="${S * 0.11}"/>
      </filter>
      <filter id="bubbleGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="0" stdDeviation="${S * 0.028}"
                      flood-color="${PURPLE}" flood-opacity="0.85"/>
      </filter>
      <filter id="softHalo" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="${S * 0.06}"/>
      </filter>
    </defs>`;
}

/** Ambient blurred light blobs (purple / blue / pink). */
function ambientGlows(S) {
  return `
    <g filter="url(#ambient)">
      <circle cx="${S * 0.30}" cy="${S * 0.30}" r="${S * 0.28}" fill="${PURPLE}" opacity="0.55"/>
      <circle cx="${S * 0.64}" cy="${S * 0.38}" r="${S * 0.24}" fill="${BLUE}" opacity="0.42"/>
      <circle cx="${S * 0.66}" cy="${S * 0.70}" r="${S * 0.28}" fill="${PINK}" opacity="0.40"/>
      <circle cx="${S * 0.34}" cy="${S * 0.68}" r="${S * 0.22}" fill="${PURPLE_DEEP}" opacity="0.38"/>
    </g>`;
}

/** Full opaque scene (app icon). */
function sceneSvg(S, ratio = 0.6) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    ${defs(S)}
    <rect width="${S}" height="${S}" fill="url(#bgGrad)"/>
    ${ambientGlows(S)}
    ${markGroup(S, ratio)}
  </svg>`;
}

/** Transparent mark with a soft purple halo (splash / adaptive icon). */
function markSvg(S, ratio = 0.5) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    ${defs(S)}
    <g filter="url(#softHalo)">
      <circle cx="${S / 2}" cy="${S / 2}" r="${S * ratio * 0.6}" fill="${PURPLE}" opacity="0.45"/>
    </g>
    ${markGroup(S, ratio)}
  </svg>`;
}

/** Monochrome white silhouette (Android notification icon). */
function monoSvg(S, ratio = 0.7) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    ${markGroup(S, ratio, { mono: true })}
  </svg>`;
}

/** Showcase card to share with the team. */
function showcaseSvg(S) {
  const r = S * 0.08;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    ${defs(S)}
    <rect width="${S}" height="${S}" fill="${BG_BOTTOM}"/>
    <rect x="${S * 0.06}" y="${S * 0.06}" width="${S * 0.88}" height="${S * 0.88}"
          rx="${r}" ry="${r}" fill="url(#bgGrad)"/>
    <g clip-path="url(#card)">
      ${ambientGlows(S)}
    </g>
    <clipPath id="card">
      <rect x="${S * 0.06}" y="${S * 0.06}" width="${S * 0.88}" height="${S * 0.88}" rx="${r}" ry="${r}"/>
    </clipPath>
    ${markGroup(S, 0.5)}
  </svg>`;
}

async function render(svg, size, file, { flatten = false } = {}) {
  let img = sharp(Buffer.from(svg)).resize(size, size);
  if (flatten) img = img.flatten({ background: BG_BOTTOM });
  await img.png({ compressionLevel: 9 }).toFile(path.join(OUT, file));
  console.log(`✓ ${file}  (${size}×${size})`);
}

await fs.mkdir(OUT, { recursive: true });

// iOS app icon — must be opaque (no alpha channel)
await render(sceneSvg(1024, 0.6), 1024, 'icon.png', { flatten: true });
// Android adaptive foreground — keep mark inside the ~62% safe zone
await render(markSvg(1024, 0.5), 1024, 'adaptive-icon.png');
// Splash mark on #0D0D1A backdrop
await render(markSvg(1024, 0.52), 1024, 'splash-icon.png');
// Web favicon
await render(markSvg(64, 0.74), 48, 'favicon.png');
// Android notification icon (monochrome)
await render(monoSvg(96, 0.72), 96, 'notification-icon.png');
// Shareable showcase
await render(showcaseSvg(1024), 1024, 'brand-logo.png');

console.log('\nBrand assets generated.');
