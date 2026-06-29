/**
 * App Store Connect media/build helper for EyesTalk.
 *
 * Same ES256 JWT auth as asc-listing.mjs / asc-release.mjs. Used to:
 *   build-status                 list recent builds + processing state
 *   attach-build <buildNumber>   select a processed build for the editable version
 *   upload-screens <dir>         upload iPhone 6.9" screenshots to the en-US
 *                                localization of the editable version (idempotent:
 *                                clears the existing 6.9" set first)
 *
 * Reads key from ASC_API_KEY_PATH (default apps/mobile/credentials/...).
 * Never submits for review.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_ID = process.env.ASC_KEY_ID || "TRS8NZAGX5";
const ISSUER_ID = process.env.ASC_ISSUER_ID || "31303d35-0acc-4d1a-89d4-872e31f2b28f";
const KEY_PATH =
  process.env.ASC_API_KEY_PATH ||
  path.join(__dirname, "..", "credentials", "AppStoreConnect_ApiKey.p8");
const APP_ID = process.env.ASC_APP_ID || "6781209791";
const BASE = "https://api.appstoreconnect.apple.com";
const SCREENSHOT_DISPLAY_TYPE = "APP_IPHONE_67"; // 1290x2796 (largest iPhone type in this API)

function b64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function makeJwt() {
  const privateKey = fs.readFileSync(KEY_PATH, "utf8");
  const header = { alg: "ES256", kid: KEY_ID, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: ISSUER_ID, iat: now, exp: now + 1200, aud: "appstoreconnect-v1" };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = crypto.sign("sha256", Buffer.from(signingInput), { key: privateKey, dsaEncoding: "ieee-p1363" });
  return `${signingInput}.${b64url(signature)}`;
}
async function api(p, options = {}) {
  const res = await fetch(`${BASE}${p}`, {
    ...options,
    headers: { Authorization: `Bearer ${makeJwt()}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { status: res.status, json };
}

const EDITABLE = new Set(["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED", "INVALID_BINARY"]);

async function getEditableVersion() {
  const v = await api(`/v1/apps/${APP_ID}/appStoreVersions?limit=10&fields[appStoreVersions]=versionString,appStoreState`);
  const ver = (v.json.data || []).find((x) => EDITABLE.has(x.attributes?.appStoreState));
  return ver;
}

async function buildStatus() {
  const r = await api(`/v1/builds?filter[app]=${APP_ID}&limit=10&sort=-uploadedDate&fields[builds]=version,processingState,uploadedDate`);
  for (const b of r.json.data || []) {
    console.log(`build#${b.attributes?.version}  ${b.attributes?.processingState}  ${b.attributes?.uploadedDate}  id=${b.id}`);
  }
}

async function attachBuild(buildNumber) {
  const ver = await getEditableVersion();
  if (!ver) return console.log("no editable version");
  const r = await api(`/v1/builds?filter[app]=${APP_ID}&limit=20&sort=-uploadedDate&fields[builds]=version,processingState`);
  const build = (r.json.data || []).find((b) => String(b.attributes?.version) === String(buildNumber));
  if (!build) return console.log(`build ${buildNumber} not found`);
  if (build.attributes?.processingState !== "VALID") {
    return console.log(`build ${buildNumber} not VALID yet (state=${build.attributes?.processingState})`);
  }
  const patch = await api(`/v1/appStoreVersions/${ver.id}/relationships/build`, {
    method: "PATCH",
    body: JSON.stringify({ data: { type: "builds", id: build.id } }),
  });
  console.log(JSON.stringify({ version: ver.attributes.versionString, attachedBuild: buildNumber, status: patch.status, error: patch.status >= 300 ? patch.json : undefined }, null, 2));
}

async function getEnUsLocalization(versionId) {
  const locs = await api(`/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=50`);
  return (locs.json.data || []).find((l) => l.attributes.locale === "en-US");
}

async function clearExistingSet(localizationId) {
  const sets = await api(`/v1/appStoreVersionLocalizations/${localizationId}/appScreenshotSets?limit=50`);
  for (const s of sets.json.data || []) {
    if (s.attributes?.screenshotDisplayType === SCREENSHOT_DISPLAY_TYPE) {
      await api(`/v1/appScreenshotSets/${s.id}`, { method: "DELETE" });
      console.log(`  deleted existing ${SCREENSHOT_DISPLAY_TYPE} set ${s.id}`);
    }
  }
}

async function uploadScreens(dir) {
  const ver = await getEditableVersion();
  if (!ver) return console.log("no editable version");
  const loc = await getEnUsLocalization(ver.id);
  if (!loc) return console.log("no en-US localization");
  await clearExistingSet(loc.id);

  const setRes = await api(`/v1/appScreenshotSets`, {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "appScreenshotSets",
        attributes: { screenshotDisplayType: SCREENSHOT_DISPLAY_TYPE },
        relationships: { appStoreVersionLocalization: { data: { type: "appStoreVersionLocalizations", id: loc.id } } },
      },
    }),
  });
  if (setRes.status >= 300) return console.log("create set failed", JSON.stringify(setRes.json));
  const setId = setRes.json.data.id;
  console.log(`created ${SCREENSHOT_DISPLAY_TYPE} set ${setId}`);

  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".png")).sort();
  for (const f of files) {
    const full = path.join(dir, f);
    const buf = fs.readFileSync(full);
    // 1) reserve
    const reserve = await api(`/v1/appScreenshots`, {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "appScreenshots",
          attributes: { fileName: f, fileSize: buf.length },
          relationships: { appScreenshotSet: { data: { type: "appScreenshotSets", id: setId } } },
        },
      }),
    });
    if (reserve.status >= 300) { console.log(`reserve ${f} failed`, JSON.stringify(reserve.json)); continue; }
    const ssId = reserve.json.data.id;
    const ops = reserve.json.data.attributes.uploadOperations || [];
    // 2) upload bytes per operation
    for (const op of ops) {
      const headers = {};
      for (const h of op.requestHeaders || []) headers[h.name] = h.value;
      const slice = buf.subarray(op.offset, op.offset + op.length);
      const put = await fetch(op.url, { method: op.method, headers, body: slice });
      if (!put.ok) { console.log(`  PUT ${f} op failed ${put.status}`); }
    }
    // 3) commit with checksum
    const md5 = crypto.createHash("md5").update(buf).digest("hex");
    const commit = await api(`/v1/appScreenshots/${ssId}`, {
      method: "PATCH",
      body: JSON.stringify({ data: { type: "appScreenshots", id: ssId, attributes: { uploaded: true, sourceFileChecksum: md5 } } }),
    });
    console.log(`  ${f} -> ${commit.status === 200 ? "OK" : "ERR " + JSON.stringify(commit.json)}`);
  }
}

const cmd = process.argv[2];
if (cmd === "build-status") await buildStatus();
else if (cmd === "attach-build") await attachBuild(process.argv[3]);
else if (cmd === "upload-screens") await uploadScreens(process.argv[3] || path.join(__dirname, "..", "store-listing", "screenshots", "ios"));
else console.log("usage: build-status | attach-build <num> | upload-screens [dir]");
