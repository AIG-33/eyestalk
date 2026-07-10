/**
 * Generate app icon / splash / favicon variants from the raster master logo
 * (brand/master-logo-1024.png — speech-bubble "glasses" on a violet→magenta
 * glow). Unlike generate-brand.mjs (which draws the mark from SVG paths),
 * this derives everything from the raster:
 *
 *   - the bubble mark is extracted with an edge flood-fill mask (background
 *     luminance < LUM_THR connected to the canvas border), lightly feathered;
 *   - the glow background is rebuilt as a synthetic gradient sampled from the
 *     master, so the Android adaptive background layer has no bubble ghost.
 *
 * Run from `apps/mobile`:
 *   node scripts/generate-icons-from-master.mjs
 *
 * Produces:
 *   assets/icon.png               1024  master as-is, opaque (iOS app icon)
 *   assets/adaptive-icon.png      1024  extracted bubble in 66% safe zone (Android fg)
 *   assets/adaptive-icon-bg.png   1024  synthetic glow (Android bg layer)
 *   assets/splash-icon.png        1024  glow + bubble at 46% width, opaque (cover splash)
 *   assets/favicon.png              64  rounded mini icon
 *   assets/brand-logo.png         1024  showcase (== app icon)
 *   ../web/public/logo.png         512  rounded icon (auth pages)
 *   ../web/public/apple-touch-icon.png  180  square opaque
 */

import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..', '..');
const MASTER = path.join(REPO, 'brand', 'master-logo-1024.png');
const ASSETS = path.resolve(__dirname, '..', 'assets');
const WEB_PUB = path.join(REPO, 'apps', 'web', 'public');

const LUM_THR = 130; // background/bubble luminance boundary for the flood fill
const BG = '#0D0D1A'; // matches master's corner colour

// ── Load master ──
const master = sharp(MASTER).resize(1024, 1024);
const { data, info } = await master
  .clone()
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;

// ── Bubble mask: flood-fill dark background from the borders ──
const isBg = new Uint8Array(W * H);
{
  const lum = (p) =>
    0.299 * data[p * 3] + 0.587 * data[p * 3 + 1] + 0.114 * data[p * 3 + 2];
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const p = stack.pop();
    if (isBg[p] || lum(p) >= LUM_THR) continue;
    isBg[p] = 1;
    const x = p % W;
    const y = (p / W) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < W - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - W);
    if (y < H - 1) stack.push(p + W);
  }
}

const mask = Buffer.alloc(W * H);
let minX = W, maxX = 0, minY = H, maxY = 0;
for (let p = 0; p < W * H; p++) {
  if (!isBg[p]) {
    mask[p] = 255;
    const x = p % W;
    const y = (p / W) | 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}
const bbox = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };

// Feathered alpha, joined onto master RGB, cropped to the bubble.
// (Separate pipelines: sharp would otherwise apply extract before joinChannel.)
const feathered = await sharp(mask, { raw: { width: W, height: H, channels: 1 } })
  .blur(1.2)
  .toColourspace('b-w') // keep single channel; blur otherwise promotes to sRGB
  .raw()
  .toBuffer();
const rgbaPng = await sharp(Buffer.from(data), { raw: { width: W, height: H, channels: 3 } })
  .joinChannel(feathered, { raw: { width: W, height: H, channels: 1 } })
  .png()
  .toBuffer();
const bubblePng = await sharp(rgbaPng).extract(bbox).png().toBuffer();

/** Bubble resized to `widthRatio` of a transparent square canvas, centred. */
async function bubbleOnCanvas(size, widthRatio) {
  const w = Math.round(size * widthRatio);
  const h = Math.round((w * bbox.height) / bbox.width);
  const resized = await sharp(bubblePng).resize(w, h).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: resized,
        left: Math.round((size - w) / 2),
        top: Math.round((size - h) / 2),
      },
    ])
    .png();
}

/** Synthetic glow background, colours sampled from the master. */
function glowSvg(S) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
  <defs>
    <radialGradient id="gVio" cx="0.30" cy="0.32" r="0.62">
      <stop offset="0" stop-color="#4A4090" stop-opacity="0.92"/>
      <stop offset="1" stop-color="#4A4090" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gMag" cx="0.78" cy="0.80" r="0.58">
      <stop offset="0" stop-color="#A34568" stop-opacity="0.88"/>
      <stop offset="1" stop-color="#A34568" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="${BG}"/>
  <rect width="${S}" height="${S}" fill="url(#gVio)"/>
  <rect width="${S}" height="${S}" fill="url(#gMag)"/>
</svg>`;
}

function roundedMaskSvg(S) {
  const r = S * 0.2237;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" rx="${r}" ry="${r}" fill="#fff"/></svg>`,
  );
}

async function save(pipeline, file) {
  const out = file.startsWith('web:')
    ? path.join(WEB_PUB, file.slice(4))
    : path.join(ASSETS, file);
  await pipeline.png({ compressionLevel: 9 }).toFile(out);
  console.log(`✓ ${path.relative(REPO, out)}`);
}

// iOS app icon + showcase — the master itself, opaque.
await save(master.clone().removeAlpha(), 'icon.png');
await save(master.clone().removeAlpha(), 'brand-logo.png');

// Android adaptive: extracted bubble in the 66% safe zone + glow bg layer.
await save(await bubbleOnCanvas(1024, 0.60), 'adaptive-icon.png');
await save(sharp(Buffer.from(glowSvg(1024))).resize(1024, 1024), 'adaptive-icon-bg.png');

// Splash (resizeMode cover): glow + bubble at 46% width so tall screens don't crop it.
{
  const glow = await sharp(Buffer.from(glowSvg(1024))).resize(1024, 1024).png().toBuffer();
  const mark = await (await bubbleOnCanvas(1024, 0.46)).toBuffer();
  await save(
    sharp(glow).composite([{ input: mark }]).flatten({ background: BG }),
    'splash-icon.png',
  );
}

// Favicon — rounded mini icon.
await save(
  master.clone().resize(64, 64).composite([{ input: roundedMaskSvg(64), blend: 'dest-in' }]),
  'favicon.png',
);

// Web rasters: rounded logo for auth pages, square apple-touch-icon.
await save(
  master.clone().resize(512, 512).composite([{ input: roundedMaskSvg(512), blend: 'dest-in' }]),
  'web:logo.png',
);
await save(master.clone().resize(180, 180).removeAlpha(), 'web:apple-touch-icon.png');

console.log('\nAll icons regenerated from brand/master-logo-1024.png.');
