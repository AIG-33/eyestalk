// Batch import up to N seed social venues for each of the top tourism cities.
//
// Uses Overture Maps Places (open data, CDLA Permissive 2.0), not Google/Apple
// Places, so imported venue rows can be stored in our database safely.
//
// Examples:
//   # Smoke test first 2 cities; no Supabase env required and no DB writes
//   node apps/web/scripts/import-top-tourism-cities.mjs --limit-cities=2
//
//   # Import 100 seed venues for every configured city (requires explicit apply)
//   node apps/web/scripts/import-top-tourism-cities.mjs --apply --limit-per-city=100
//
//   # Import selected cities only
//   node apps/web/scripts/import-top-tourism-cities.mjs --apply --cities=Dubai,London,Tokyo
//
//   # Reuse existing GeoJSON files in apps/web/.data/overture-places/
//   node apps/web/scripts/import-top-tourism-cities.mjs --skip-download --dry-run
//
//   # Print planned download/import commands without executing anything
//   node apps/web/scripts/import-top-tourism-cities.mjs --plan --limit-cities=3
//
// Requirements:
//   - overturemaps CLI available on PATH for downloads, or pass --skip-download
//     with pre-existing GeoJSON files.
//     Install: pipx install overturemaps
//   - For real import (--apply): NEXT_PUBLIC_SUPABASE_URL and
//     SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local.
//
// Note: Overture Places does not provide a reliable public footfall ranking.
// These are deterministic "seed venues" selected by social category priority,
// source confidence, and useful contact metadata, not exact most-visited venues.

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { TOP_TOURISM_CITIES } from './top-tourism-cities.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
const defaultDataDir = resolve(here, '../.data/overture-places');
const importScript = resolve(here, 'import-overture-places.mjs');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const dryRun = !apply;
const planOnly = args.includes('--plan');
const skipDownload = args.includes('--skip-download');
const forceDownload = args.includes('--force-download');
const downloadOnly = args.includes('--download-only');
const keepFiles = args.includes('--keep-files');
const venuesPerCity = Number(
  (
    args.find((a) => a.startsWith('--limit-per-city=')) ||
    args.find((a) => a.startsWith('--venues-per-city=')) ||
    ''
  ).split('=')[1] || 100,
);
const limitCities = Number((args.find((a) => a.startsWith('--limit-cities=')) || '').split('=')[1] || 0);
const minConfidence = Number((args.find((a) => a.startsWith('--min-confidence=')) || '').split('=')[1] || 0.5);
const dataDir = resolve((args.find((a) => a.startsWith('--data-dir=')) || '').split('=').slice(1).join('=') || defaultDataDir);
const cityFilterRaw = (args.find((a) => a.startsWith('--cities=')) || '').split('=').slice(1).join('=');

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function bboxFor(city) {
  const latDelta = city.radiusKm / 111.32;
  const lngDelta = city.radiusKm / (111.32 * Math.cos(city.lat * Math.PI / 180));
  return [
    city.lng - lngDelta,
    city.lat - latDelta,
    city.lng + lngDelta,
    city.lat + latDelta,
  ].map((n) => Number(n.toFixed(6)));
}

function run(cmd, cmdArgs, options = {}) {
  const result = spawnSync(cmd, cmdArgs, {
    cwd: repoRoot,
    stdio: 'inherit',
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${cmd} ${cmdArgs.join(' ')} failed with exit code ${result.status}`);
  }
}

function selectCities() {
  let cities = TOP_TOURISM_CITIES;
  if (cityFilterRaw) {
    const wanted = new Set(cityFilterRaw.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean));
    cities = cities.filter((c) => wanted.has(c.city.toLowerCase()) || wanted.has(slugify(c.city)));
  }
  if (limitCities > 0) cities = cities.slice(0, limitCities);
  return cities;
}

async function main() {
  if (args.includes('--dry-run')) {
    console.warn('--dry-run is now the default; pass --apply only when you are ready to write to Supabase.');
  }
  if (apply && planOnly) {
    console.error('--apply cannot be combined with --plan.');
    process.exit(1);
  }
  if (!Number.isFinite(venuesPerCity) || venuesPerCity <= 0) {
    console.error('--limit-per-city must be a positive number.');
    process.exit(1);
  }

  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  const cities = selectCities();
  if (cities.length === 0) {
    console.error('No cities selected. Check --cities value.');
    process.exit(1);
  }

  console.log(`Selected ${cities.length} cities; target ${venuesPerCity} seed venues/city; min confidence ${minConfidence}.`);
  console.log(`Data dir: ${dataDir}`);
  if (planOnly) console.log('Plan only: no downloads and no database writes.');
  if (dryRun) console.log('Dry run: no database writes. Pass --apply to insert into Supabase.');
  if (skipDownload) console.log('Skip download: using existing GeoJSON files.');

  let completed = 0;
  const failed = [];
  for (const city of cities) {
    const slug = `${String(city.rank).padStart(3, '0')}-${slugify(city.city)}`;
    const outFile = resolve(dataDir, `${slug}.geojson`);
    const stateFile = `${outFile}.state`;
    const bbox = bboxFor(city);

    console.log(`\n[${city.rank}/100] ${city.city}, ${city.country}`);
    console.log(`bbox=${bbox.join(',')}`);

    if (planOnly) {
      console.log([
        'overturemaps',
        'download',
        '--bbox', bbox.join(','),
        '-f', 'geojson',
        '--type=place',
        '-o', outFile,
      ].join(' '));
      console.log([
        process.execPath,
        importScript,
        outFile,
        `--limit=${venuesPerCity}`,
        `--min-confidence=${minConfidence}`,
        `--city=${city.city}`,
        '--dry-run',
      ].join(' '));
      completed += 1;
      continue;
    }

    // One city failing (bad download, transient error) must not abort the run.
    try {
      if (!skipDownload && (forceDownload || !existsSync(outFile))) {
        run('overturemaps', [
          'download',
          '--bbox', bbox.join(','),
          '-f', 'geojson',
          '--type', 'place',
          '-o', outFile,
        ]);
      } else if (!existsSync(outFile)) {
        throw new Error(`Missing ${outFile}; rerun without --skip-download or download the extract first.`);
      } else {
        console.log(`Using existing ${outFile}`);
      }

      if (!downloadOnly) {
        const importArgs = [
          importScript,
          outFile,
          `--limit=${venuesPerCity}`,
          `--min-confidence=${minConfidence}`,
          `--city=${city.city}`,
        ];
        if (dryRun) importArgs.push('--dry-run');
        run(process.execPath, importArgs);

        // City extracts are 100-600 MB each; keep them all and the disk fills
        // up long before city #100. Delete after a successful import unless
        // the caller explicitly wants to keep them.
        if (apply && !keepFiles) {
          rmSync(outFile, { force: true });
          rmSync(stateFile, { force: true });
        }
      }

      completed += 1;
    } catch (err) {
      console.error(`FAILED ${city.city}: ${err.message || err}`);
      failed.push(city.city);
      // A truncated/partial file would poison the next retry — remove it.
      rmSync(outFile, { force: true });
      rmSync(stateFile, { force: true });
    }
  }

  console.log(`\nDone. Processed ${completed}/${cities.length} cities${downloadOnly ? ' (download only)' : ''}.`);
  if (failed.length > 0) {
    console.log(`Failed cities (${failed.length}): ${failed.join(', ')}`);
    console.log(`Retry with: --apply --cities=${failed.join(',')}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`\n${err.message || err}`);
  console.error('\nIf overturemaps is missing, install it with: pipx install overturemaps');
  process.exit(1);
});
