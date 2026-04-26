/**
 * Generate brand PNG assets from inline SVG.
 *
 * Run from `apps/mobile`:
 *   node scripts/generate-icons.mjs
 *
 * Produces:
 *   assets/icon.png             1024×1024  iOS app icon (gradient bg + halo + light bubble)
 *   assets/adaptive-icon.png    1024×1024  Android adaptive foreground (mark on transparent, safe-zone-sized)
 *   assets/splash-icon.png      1024×1024  Splash mark (transparent, paired with bg colour)
 *   assets/notification-icon.png  96×96    Android silhouette (white mark on transparent)
 *   assets/favicon.png            48×48    Legacy expo favicon
 */

import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, '..', 'assets');

// ─── Mark geometry (matches Design/assets/logo-mark.svg) ────────────
//
// viewBox 220×170. Visual bounding box (including tail) lives at:
//   x: 16 → 204   (width 188, midpoint 110)
//   y: 12 → 156   (height 144, midpoint 84)
//
// We anchor on the bbox midpoint so the mark looks visually centred
// no matter the canvas size.
const MARK_BBOX = { cx: 110, cy: 84 };

/** Build a transform that centres the mark on a square `canvas` at `scale`. */
function centeredTransform(canvas, scale) {
  const tx = canvas / 2 - MARK_BBOX.cx * scale;
  const ty = canvas / 2 - MARK_BBOX.cy * scale;
  return `translate(${tx},${ty}) scale(${scale})`;
}

/** The mark itself, parameterised by colours. */
function markPaths({ bubble, eyeBg, pupil, sclera = '#FFFFFF' }) {
  return `
    <path d="M110 12 C 164 12 204 38 204 74 C 204 110 164 136 110 136 C 96 136 82.5 134.4 70 131.5 L 53 156 C 51.5 158 48.5 156.8 49.2 154.4 L 56 132.5 C 30 122 16 100 16 74 C 16 38 56 12 110 12 Z" fill="${bubble}"/>
    <circle cx="74" cy="74" r="29" fill="${sclera}"/>
    <circle cx="146" cy="74" r="29" fill="${sclera}"/>
    <path d="M96 74 C 100 66 120 66 124 74 C 120 82 100 82 96 74 Z" fill="${sclera}"/>
    <circle cx="74" cy="74" r="14.5" fill="${pupil}"/>
    <circle cx="146" cy="74" r="14.5" fill="${pupil}"/>
    ${eyeBg ? `` : ''}
  `;
}

// ─── Compositions ────────────────────────────────────────────────────

// iOS app icon — full brand. Square (iOS auto-rounds), opaque.
const APP_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2A1F6E"/>
      <stop offset="1" stop-color="#0D0826"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.55">
      <stop offset="0"   stop-color="#7C6FF7" stop-opacity="0.55"/>
      <stop offset="0.6" stop-color="#7C6FF7" stop-opacity="0.18"/>
      <stop offset="1"   stop-color="#7C6FF7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <ellipse cx="512" cy="512" rx="440" ry="380" fill="url(#halo)"/>
  <g transform="${centeredTransform(1024, 2.8)}">
    ${markPaths({ bubble: '#A29BFE', pupil: '#1B1464' })}
  </g>
</svg>`;

// Splash: just the brand mark on transparent (canvas paints bg colour).
const SPLASH_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <g transform="${centeredTransform(1024, 2.6)}">
    ${markPaths({ bubble: '#7C6FF7', pupil: '#7C6FF7' })}
  </g>
</svg>`;

// Adaptive (Android) foreground — sized to fit the 66% safe zone.
// Android masks the foreground heavily so the art must stay smaller.
const ADAPTIVE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <g transform="${centeredTransform(1024, 1.95)}">
    ${markPaths({ bubble: '#A29BFE', pupil: '#1B1464' })}
  </g>
</svg>`;

// Notification (Android) — silhouette of just the bubble outline. Pure white,
// transparent bg. Android tints by `expo-notifications.color`.
const NOTIF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <g transform="${centeredTransform(96, 0.34)}">
    <path d="M110 12 C 164 12 204 38 204 74 C 204 110 164 136 110 136 C 96 136 82.5 134.4 70 131.5 L 53 156 C 51.5 158 48.5 156.8 49.2 154.4 L 56 132.5 C 30 122 16 100 16 74 C 16 38 56 12 110 12 Z" fill="#FFFFFF"/>
  </g>
</svg>`;

// Favicon — small, transparent, brand mark only.
const FAVICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <g transform="${centeredTransform(48, 0.18)}">
    ${markPaths({ bubble: '#7C6FF7', pupil: '#7C6FF7' })}
  </g>
</svg>`;

async function render(svg, outName, { size, flatten }) {
  let pipeline = sharp(Buffer.from(svg)).resize(size, size);
  if (flatten) {
    // iOS app icon must be opaque RGB (no transparency).
    pipeline = pipeline.flatten({ background: '#0D0826' });
  }
  await pipeline.png().toFile(path.join(ASSETS, outName));
  console.log(`✓ ${outName}  (${size}×${size})`);
}

await render(APP_ICON_SVG,  'icon.png',              { size: 1024, flatten: true  });
await render(ADAPTIVE_SVG,  'adaptive-icon.png',     { size: 1024, flatten: false });
await render(SPLASH_SVG,    'splash-icon.png',       { size: 1024, flatten: false });
await render(NOTIF_SVG,     'notification-icon.png', { size: 96,   flatten: false });
await render(FAVICON_SVG,   'favicon.png',           { size: 48,   flatten: false });

console.log('\nAll icons regenerated from SVG sources.');
