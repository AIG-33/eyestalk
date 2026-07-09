// Import venues from Overture Maps Places (open data, CDLA Permissive 2.0)
// into the EyesTalk `venues` table as 'unclaimed' venues.
//
// Unclaimed venues have no owner, show up on the map immediately, and are
// fully check-in-ready (QR code + general chat are created by DB trigger).
// A business can later claim ownership via the in-app claim flow.
//
// Step 1 — download a city extract (bbox = west,south,east,north):
//
//   pipx run overturemaps download --bbox=55.20,25.10,55.40,25.30 \
//     -f geojson --type=place -o dubai-places.geojson
//
// Step 2 — import it:
//
//   node apps/web/scripts/import-overture-places.mjs dubai-places.geojson
//   node apps/web/scripts/import-overture-places.mjs dubai-places.geojson --dry-run
//   node apps/web/scripts/import-overture-places.mjs dubai-places.geojson --min-confidence=0.6
//
// Idempotent: rows are keyed by (external_source, external_id); already
// imported places are skipped, so claimed/edited venues are never clobbered.
//
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// ─── Env loader (same convention as seed-demo-data.mjs) ─────────────────────

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, '..', '.env.local');

function loadEnv(p) {
  const out = {};
  for (const raw of readFileSync(p, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = loadEnv(envPath);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const filePath = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const minConfidence = Number(
  (args.find((a) => a.startsWith('--min-confidence=')) || '').split('=')[1] || 0.5,
);

if (!filePath) {
  console.error('Usage: node import-overture-places.mjs <places.geojson> [--dry-run] [--min-confidence=0.5]');
  process.exit(1);
}

// ─── Overture category → EyesTalk venue_type ─────────────────────────────────
// Only social / hangout categories are imported; everything else is skipped
// (we don't want pharmacies and car washes on a nightlife map).

const EXACT = {
  karaoke: 'karaoke',
  karaoke_bar: 'karaoke',
  karaoke_box: 'karaoke',
  night_club: 'nightclub',
  nightclub: 'nightclub',
  dance_club: 'nightclub',
  sports_bar: 'sports_bar',
  bowling_alley: 'bowling',
  bowling: 'bowling',
  pool_hall: 'billiards',
  billiards: 'billiards',
  pool_billiards: 'billiards',
  hookah_lounge: 'hookah',
  hookah_bar: 'hookah',
  shisha_bar: 'hookah',
  board_game_cafe: 'board_games',
  arcade: 'arcade',
  amusement_arcade: 'arcade',
  video_game_arcade: 'arcade',
  comedy_club: 'standup',
  live_music_venue: 'live_music',
  music_venue: 'live_music',
  jazz_and_blues: 'live_music',
  restaurant: 'restaurant',
  cafe: 'cafe',
  coffee_shop: 'cafe',
  bar: 'bar',
  pub: 'bar',
  gastropub: 'bar',
  wine_bar: 'bar',
  cocktail_bar: 'bar',
  beer_garden: 'bar',
  brewery: 'bar',
  gym: 'gym',
  fitness_center: 'gym',
  coworking_space: 'coworking',
  beauty_salon: 'beauty_salon',
  hair_salon: 'beauty_salon',
  nail_salon: 'beauty_salon',
  spa: 'beauty_salon',
  hotel: 'hotel',
  lounge: 'lounge',
  hookah_cafe: 'hookah',
  food_court: 'food_court',
};

// Fallback rules for the long tail (e.g. "italian_restaurant", "tiki_bar").
const SUFFIX_RULES = [
  ['_restaurant', 'restaurant'],
  ['_bar', 'bar'],
  ['_pub', 'bar'],
  ['_cafe', 'cafe'],
  ['_club', 'nightclub'],
  ['_lounge', 'lounge'],
  ['_hotel', 'hotel'],
];

function mapCategory(primary) {
  if (!primary) return null;
  const cat = String(primary).toLowerCase();
  if (EXACT[cat]) return EXACT[cat];
  for (const [suffix, type] of SUFFIX_RULES) {
    if (cat.endsWith(suffix)) return type;
  }
  return null;
}

// ─── Feature → venue row ─────────────────────────────────────────────────────

function first(v) {
  return Array.isArray(v) ? v[0] : v;
}

function featureToVenue(feature) {
  const p = feature.properties || {};
  const geom = feature.geometry;
  if (!geom || geom.type !== 'Point') return null;

  const confidence = typeof p.confidence === 'number' ? p.confidence : 1;
  if (confidence < minConfidence) return null;

  const name = p.names?.primary || p['@name'] || p.name;
  if (!name || String(name).trim().length < 2) return null;

  const type = mapCategory(p.categories?.primary || p.category);
  if (!type) return null;

  const [lng, lat] = geom.coordinates;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const addr = first(p.addresses) || {};
  const addressParts = [addr.freeform, addr.locality, addr.region].filter(Boolean);
  const address = addressParts.join(', ') || String(name).trim();

  const phone = first(p.phones) || null;
  const website = first(p.websites) || null;

  return {
    name: String(name).trim().slice(0, 100),
    type,
    address: address.slice(0, 300),
    latitude: Math.round(lat * 1e6) / 1e6,
    longitude: Math.round(lng * 1e6) / 1e6,
    geofence_radius: 75,
    venue_kind: 'unclaimed',
    owner_id: null,
    external_source: 'overture',
    external_id: p.id || feature.id,
    // Phone/website power future owner verification (call/SMS to the listed number).
    settings: { imported: true, phone, website, confidence },
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Reading ${filePath}...`);
  const geojson = JSON.parse(readFileSync(resolve(filePath), 'utf8'));
  const features = geojson.features || [];
  console.log(`${features.length} features in file`);

  const seen = new Set();
  const venues = [];
  const typeCounts = {};

  for (const f of features) {
    const v = featureToVenue(f);
    if (!v || !v.external_id || seen.has(v.external_id)) continue;
    seen.add(v.external_id);
    venues.push(v);
    typeCounts[v.type] = (typeCounts[v.type] || 0) + 1;
  }

  console.log(`${venues.length} venues matched social categories (min confidence ${minConfidence}):`);
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type.padEnd(14)} ${count}`);
  }

  if (venues.length === 0) {
    console.log('Nothing to import.');
    return;
  }

  if (dryRun) {
    console.log('\nDry run — sample rows:');
    for (const v of venues.slice(0, 10)) {
      console.log(`  [${v.type}] ${v.name} — ${v.address} (${v.latitude}, ${v.longitude})`);
    }
    return;
  }

  // Skip already-imported places so re-imports never clobber claimed venues.
  const existing = new Set();
  const ids = venues.map((v) => v.external_id);
  for (let i = 0; i < ids.length; i += 500) {
    const { data, error } = await sb
      .from('venues')
      .select('external_id')
      .eq('external_source', 'overture')
      .in('external_id', ids.slice(i, i + 500));
    if (error) throw new Error(`Failed to check existing venues: ${error.message}`);
    for (const row of data || []) existing.add(row.external_id);
  }

  const fresh = venues.filter((v) => !existing.has(v.external_id));
  console.log(`${existing.size} already imported, inserting ${fresh.length} new venues...`);

  let inserted = 0;
  // Small batches: the on_venue_created trigger creates a QR code + chat per row.
  for (let i = 0; i < fresh.length; i += 100) {
    const batch = fresh.slice(i, i + 100);
    const { error } = await sb.from('venues').insert(batch);
    if (error) throw new Error(`Insert failed at batch ${i / 100}: ${error.message}`);
    inserted += batch.length;
    process.stdout.write(`\r  inserted ${inserted}/${fresh.length}`);
  }

  console.log(`\nDone. ${inserted} venues imported as 'unclaimed'.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
