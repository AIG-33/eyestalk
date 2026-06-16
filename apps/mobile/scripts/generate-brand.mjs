/**
 * Generate every EyesTalk brand asset from a single source of truth: the
 * "glass on glow" identity — a frosted translucent glasses speech-bubble with
 * a soft white rim and royal-blue pupils, floating on a dark radial glow
 * (blue → violet → magenta), exactly matching brand/master-logo-1024.png.
 *
 * Run from `apps/mobile`:
 *   node scripts/generate-brand.mjs
 *
 * Produces (under assets/):
 *   icon.png             1024  opaque glow + glass mark (iOS app icon)
 *   adaptive-icon.png    1024  transparent glass mark in safe zone (Android fg)
 *   adaptive-icon-bg.png 1024  glow only (Android bg layer)
 *   splash-icon.png      1024  opaque glow + glass mark (cover splash)
 *   favicon.png            64  rounded mini icon
 *   notification-icon.png  96  white silhouette (Android status bar, alpha)
 *   brand-logo.png       1024  shareable showcase (== app icon)
 */

import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'assets');

// ── Brand mark geometry (viewBox 220×170) ──
const BUBBLE =
  'M110 12 C 164 12 204 38 204 74 C 204 110 164 136 110 136 ' +
  'C 96 136 82.5 134.4 70 131.5 L 53 156 C 51.5 158 48.5 156.8 49.2 154.4 ' +
  'L 56 132.5 C 30 122 16 100 16 74 C 16 38 56 12 110 12 Z';
const CONNECTOR = 'M96 74 C 100 66 120 66 124 74 C 120 82 100 82 96 74 Z';
const MARK_W = 220;
const MARK_H = 170;

// ── Palette (sampled from master-logo-1024.png) ──
const BG = '#0D0D1A';
const GLOW_BLUE = '#4F6BF0';
const GLOW_VIOLET = '#8B7DF0';
const GLOW_MAGENTA = '#C0407A';
const PUPIL = '#636DF3';
const PURPLE = '#7C6FF7';

function markTransform(S, ratio) {
  const markW = S * ratio;
  const scale = markW / MARK_W;
  const markH = MARK_H * scale;
  const tx = (S - markW) / 2;
  const ty = (S - markH) / 2;
  return { scale, tx, ty };
}

/** Dark radial glow background (blue TL → violet centre → magenta BR). */
function glowLayers(S) {
  return `
    <defs>
      <radialGradient id="gBlue" cx="0.30" cy="0.28" r="0.62">
        <stop offset="0" stop-color="${GLOW_BLUE}" stop-opacity="0.85"/>
        <stop offset="1" stop-color="${GLOW_BLUE}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="gMag" cx="0.72" cy="0.76" r="0.6">
        <stop offset="0" stop-color="${GLOW_MAGENTA}" stop-opacity="0.8"/>
        <stop offset="1" stop-color="${GLOW_MAGENTA}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="gVio" cx="0.5" cy="0.46" r="0.5">
        <stop offset="0" stop-color="${GLOW_VIOLET}" stop-opacity="0.65"/>
        <stop offset="1" stop-color="${GLOW_VIOLET}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${S}" height="${S}" fill="${BG}"/>
    <rect width="${S}" height="${S}" fill="url(#gBlue)"/>
    <rect width="${S}" height="${S}" fill="url(#gMag)"/>
    <rect width="${S}" height="${S}" fill="url(#gVio)"/>`;
}

/** Frosted-glass glasses mark. strokeBase scales with the mark. */
function glassMark(S, ratio) {
  const { scale, tx, ty } = markTransform(S, ratio);
  const sw = 2.6 / scale; // keep rim ~constant in px regardless of scale
  return `
    <g transform="translate(${tx},${ty}) scale(${scale})">
      <path d="${BUBBLE}" fill="rgba(255,255,255,0.13)"
            stroke="rgba(255,255,255,0.52)" stroke-width="${sw}"/>
      <circle cx="74" cy="74" r="29" fill="#FFFFFF"/>
      <circle cx="146" cy="74" r="29" fill="#FFFFFF"/>
      <path d="${CONNECTOR}" fill="#FFFFFF"/>
      <circle cx="74" cy="74" r="16" fill="${PUPIL}"/>
      <circle cx="146" cy="74" r="16" fill="${PUPIL}"/>
    </g>`;
}

/** White silhouette mark (knockout eyes) for mono / notification. */
function whiteKnockoutMark(S, ratio, id = 'k') {
  const { scale, tx, ty } = markTransform(S, ratio);
  return `
    <defs>
      <mask id="${id}">
        <rect x="0" y="0" width="${MARK_W}" height="${MARK_H}" fill="#fff"/>
        <circle cx="74" cy="74" r="29" fill="#000"/>
        <circle cx="146" cy="74" r="29" fill="#000"/>
        <path d="${CONNECTOR}" fill="#000"/>
        <circle cx="74" cy="74" r="16" fill="#fff"/>
        <circle cx="146" cy="74" r="16" fill="#fff"/>
      </mask>
    </defs>
    <g transform="translate(${tx},${ty}) scale(${scale})">
      <path d="${BUBBLE}" fill="#FFFFFF" mask="url(#${id})"/>
    </g>`;
}

/** Opaque square: glow + glass mark (iOS icon, splash, showcase). */
function iconSvg(S, ratio = 0.56) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    ${glowLayers(S)}
    ${glassMark(S, ratio)}
  </svg>`;
}

/** Rounded square version (web app icon / favicon — unmasked contexts). */
function roundedIconSvg(S, ratio = 0.58) {
  const r = S * 0.2237;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    <defs>
      <clipPath id="round"><rect width="${S}" height="${S}" rx="${r}" ry="${r}"/></clipPath>
    </defs>
    <g clip-path="url(#round)">
      ${glowLayers(S)}
      ${glassMark(S, ratio)}
    </g>
  </svg>`;
}

/** Transparent glass mark in the adaptive-icon safe zone (Android foreground). */
function adaptiveForegroundSvg(S, ratio = 0.40) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    ${glassMark(S, ratio)}
  </svg>`;
}

/** Glow only — Android adaptive background layer. */
function glowBgSvg(S) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    ${glowLayers(S)}
  </svg>`;
}

/** White silhouette (alpha only) — Android notification icon. */
function monoSvg(S, ratio = 0.74) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
    ${whiteKnockoutMark(S, ratio, 'monoMask')}
  </svg>`;
}

async function render(svg, size, file, { flatten = false } = {}) {
  let img = sharp(Buffer.from(svg)).resize(size, size);
  if (flatten) img = img.flatten({ background: BG });
  await img.png({ compressionLevel: 9 }).toFile(path.join(OUT, file));
  console.log(`✓ ${file}  (${size}×${size})`);
}

// ── Shared scalable SVGs (web + mobile + brand kit) ──

/** Bare frosted glass mark (transparent, viewBox 220×170). */
function bareMarkSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_W} ${MARK_H}" fill="none">
  <path d="${BUBBLE}" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.55)" stroke-width="2.6"/>
  <circle cx="74" cy="74" r="29" fill="#FFFFFF"/>
  <circle cx="146" cy="74" r="29" fill="#FFFFFF"/>
  <path d="${CONNECTOR}" fill="#FFFFFF"/>
  <circle cx="74" cy="74" r="16" fill="${PUPIL}"/>
  <circle cx="146" cy="74" r="16" fill="${PUPIL}"/>
</svg>
`;
}

/** Single-colour silhouette mark with knocked-out eyes (viewBox 220×170). */
function silhouetteMarkSvg(fill) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_W} ${MARK_H}" fill="none">
  <defs>
    <mask id="k">
      <rect x="0" y="0" width="${MARK_W}" height="${MARK_H}" fill="#fff"/>
      <circle cx="74" cy="74" r="29" fill="#000"/>
      <circle cx="146" cy="74" r="29" fill="#000"/>
      <path d="${CONNECTOR}" fill="#000"/>
      <circle cx="74" cy="74" r="16" fill="#fff"/>
      <circle cx="146" cy="74" r="16" fill="#fff"/>
    </mask>
  </defs>
  <path d="${BUBBLE}" fill="${fill}" mask="url(#k)"/>
</svg>
`;
}

/** Wordmark lockup: rounded glow icon + Eyes/Talk text. `light` for light bg. */
function wordmarkLockupSvg({ light = false } = {}) {
  const eyes = light ? '#0D0D1A' : '#FFFFFF';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 200" fill="none">
  <defs>
    <linearGradient id="talk" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#A29BFE"/>
      <stop offset="1" stop-color="#7C6FF7"/>
    </linearGradient>
    <radialGradient id="wBlue" cx="0.30" cy="0.28" r="0.62">
      <stop offset="0" stop-color="${GLOW_BLUE}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${GLOW_BLUE}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="wMag" cx="0.72" cy="0.76" r="0.6">
      <stop offset="0" stop-color="${GLOW_MAGENTA}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${GLOW_MAGENTA}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="wRound"><rect x="10" y="20" width="160" height="160" rx="40" ry="40"/></clipPath>
  </defs>
  <g clip-path="url(#wRound)">
    <rect x="10" y="20" width="160" height="160" fill="${BG}"/>
    <rect x="10" y="20" width="160" height="160" fill="url(#wBlue)"/>
    <rect x="10" y="20" width="160" height="160" fill="url(#wMag)"/>
  </g>
  <g transform="translate(40,52) scale(0.43)">
    <path d="${BUBBLE}" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.6)" stroke-width="6"/>
    <circle cx="74" cy="74" r="29" fill="#FFFFFF"/>
    <circle cx="146" cy="74" r="29" fill="#FFFFFF"/>
    <path d="${CONNECTOR}" fill="#FFFFFF"/>
    <circle cx="74" cy="74" r="16" fill="${PUPIL}"/>
    <circle cx="146" cy="74" r="16" fill="${PUPIL}"/>
  </g>
  <text x="200" y="130" font-family="'Clash Display','Space Grotesk','Inter',sans-serif" font-weight="700" font-size="108" letter-spacing="-4">
    <tspan fill="${eyes}">Eyes</tspan><tspan fill="url(#talk)">Talk</tspan>
  </text>
</svg>
`;
}

async function writeSvgEverywhere() {
  const repo = path.resolve(__dirname, '..', '..', '..');
  const webPub = path.join(repo, 'apps', 'web', 'public');
  const mobAssets = OUT;
  const brandSvg = path.join(repo, 'brand', 'svg');

  const mark = bareMarkSvg();
  const mono = silhouetteMarkSvg('#FFFFFF');
  const black = silhouetteMarkSvg('#0D0D1A');
  const appIcon = roundedIconSvg(512, 0.58);
  const wmDark = wordmarkLockupSvg({ light: false });
  const wmLight = wordmarkLockupSvg({ light: true });

  const writes = [
    // web/public
    [path.join(webPub, 'logo-mark.svg'), mark],
    [path.join(webPub, 'logo-mark-mono.svg'), mono],
    [path.join(webPub, 'logo-app-icon.svg'), appIcon],
    [path.join(webPub, 'favicon.svg'), appIcon],
    [path.join(webPub, 'logo-wordmark.svg'), wmDark],
    // mobile assets
    [path.join(mobAssets, 'logo-mark.svg'), mark],
    [path.join(mobAssets, 'logo-mark-mono.svg'), mono],
    [path.join(mobAssets, 'logo-wordmark.svg'), wmDark],
    // brand kit
    [path.join(brandSvg, 'mark-gradient.svg'), mark],
    [path.join(brandSvg, 'mark-white.svg'), mono],
    [path.join(brandSvg, 'mark-black.svg'), black],
    [path.join(brandSvg, 'mark-flat.svg'), appIcon],
    [path.join(brandSvg, 'wordmark-on-dark.svg'), wmDark],
    [path.join(brandSvg, 'wordmark-on-light.svg'), wmLight],
  ];
  for (const [file, svg] of writes) {
    await fs.writeFile(file, svg);
    console.log(`✓ ${path.relative(repo, file)}`);
  }

  // Web raster logo (used on auth pages etc.)
  await sharp(Buffer.from(appIcon))
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(webPub, 'logo.png'));
  console.log('✓ apps/web/public/logo.png  (512×512)');

  // Apple touch icon (Safari/iOS home screen needs a raster PNG)
  await sharp(Buffer.from(appIcon))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toFile(path.join(webPub, 'apple-touch-icon.png'));
  console.log('✓ apps/web/public/apple-touch-icon.png  (180×180)');
}

await fs.mkdir(OUT, { recursive: true });

// iOS app icon — opaque glow + glass mark
await render(iconSvg(1024), 1024, 'icon.png', { flatten: true });
// Android adaptive icon — glass mark foreground + glow background layer
await render(adaptiveForegroundSvg(1024), 1024, 'adaptive-icon.png');
await render(glowBgSvg(1024), 1024, 'adaptive-icon-bg.png');
// Splash — full glow + mark (resizeMode cover)
await render(iconSvg(1024, 0.46), 1024, 'splash-icon.png', { flatten: true });
// Web/mobile favicon (rounded mini icon)
await render(roundedIconSvg(128), 64, 'favicon.png');
// Android notification icon (monochrome white)
await render(monoSvg(96), 96, 'notification-icon.png');
// Shareable showcase (== app icon)
await render(iconSvg(1024), 1024, 'brand-logo.png', { flatten: true });

// Shared scalable SVGs across web + mobile + brand kit
await writeSvgEverywhere();

console.log('\nBrand assets generated (glass-on-glow identity).');
