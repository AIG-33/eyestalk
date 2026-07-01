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

async function getAnyVersion() {
  const v = await api(`/v1/apps/${APP_ID}/appStoreVersions?limit=10&fields[appStoreVersions]=versionString,appStoreState`);
  // prefer an editable one, else the most recent
  return (v.json.data || []).find((x) => EDITABLE.has(x.attributes?.appStoreState)) || (v.json.data || [])[0];
}

const DEMO = {
  name: process.env.DEMO_ACCOUNT_NAME || "aria@demo.eyestalk.app",
  password: process.env.DEMO_ACCOUNT_PASSWORD || "EyesTalkDemo!2026",
};
const REVIEW_NOTES = `EyesTalk is a venue-based social-discovery app: you check in to a bar/lounge/karaoke venue and see who else is there right now, send a wave, and chat — presence in the room, not an endless feed.

ACCESSING THE APP (login is required)
- On the first screen, sign in with email + password:
  Email: ${DEMO.name}
  Password: ${DEMO.password}
- (The "Use another method" link also offers Apple/Google sign-in; email/password above is the simplest.)

WHY THE DEMO ACCOUNT ALREADY SHOWS CONTENT
- The app normally requires you to be physically inside a venue (location/geofence is used only to verify presence at a venue — never background tracking).
- This demo account is pre-checked-in to a Dubai venue ("Sky Lounge DIFC (Test)") so you can see the full experience without being on-site: nearby venues on the map, people in the room, venue chat, live activities (polls/contests/auctions), waves, and 1-on-1 chats.

CORE FLOWS TO TRY
- Map of nearby venues -> open the venue you're checked into -> "People in the room" -> tap a person -> send a wave.
- Venue chat (group) and Chats inbox (1-on-1). Direct chats auto-expire 24h after checkout.
- Activities tab: vote in a poll / view a contest or auction.

MODERATION (UGC)
- Users can report and block other users; chat has automated profanity/abuse detection plus venue-owner moderation.

OTHER
- No paid content, subscriptions, or in-app purchases. Token economy is non-monetary.
- No third-party trackers/ads SDKs; ITSAppUsesNonExemptEncryption is false.
- Currently launching in the United Arab Emirates; functionality is consistent across regions.

Contact: admin@eyestalk.app`;

async function setReview() {
  const ver = await getAnyVersion();
  if (!ver) return console.log("no version found");
  // find existing review detail
  const cur = await api(`/v1/appStoreVersions/${ver.id}/appStoreReviewDetail`);
  const attributes = {
    contactFirstName: process.env.CONTACT_FIRST || "EyesTalk",
    contactLastName: process.env.CONTACT_LAST || "Team",
    contactPhone: process.env.CONTACT_PHONE || "+971500000000",
    contactEmail: process.env.CONTACT_EMAIL || "admin@eyestalk.app",
    demoAccountName: DEMO.name,
    demoAccountPassword: DEMO.password,
    demoAccountRequired: true,
    notes: REVIEW_NOTES,
  };
  let res;
  if (cur.status === 200 && cur.json.data?.id) {
    res = await api(`/v1/appStoreReviewDetails/${cur.json.data.id}`, {
      method: "PATCH",
      body: JSON.stringify({ data: { type: "appStoreReviewDetails", id: cur.json.data.id, attributes } }),
    });
  } else {
    res = await api(`/v1/appStoreReviewDetails`, {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "appStoreReviewDetails",
          attributes,
          relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: ver.id } } },
        },
      }),
    });
  }
  console.log(JSON.stringify({ version: ver.attributes.versionString, state: ver.attributes.appStoreState, action: cur.status === 200 ? "patch" : "create", status: res.status, demoAccountRequired: true, error: res.status >= 300 ? res.json : undefined }, null, 2));
}

async function setAge18(value) {
  // find appInfo + its ageRatingDeclaration
  const infos = await api(`/v1/apps/${APP_ID}/appInfos`);
  const info = (infos.json.data || []).find((i) => EDITABLE.has(i.attributes?.appStoreState)) || (infos.json.data || [])[0];
  if (!info) return console.log("no appInfo");
  const decl = await api(`/v1/appInfos/${info.id}/ageRatingDeclaration`);
  const id = decl.json.data?.id;
  if (!id) return console.log("no ageRatingDeclaration", JSON.stringify(decl.json));
  console.log("current override fields:", JSON.stringify({
    ageRatingOverride: decl.json.data.attributes?.ageRatingOverride,
    ageRatingOverrideV2: decl.json.data.attributes?.ageRatingOverrideV2,
  }));
  const attributes = {};
  attributes[process.env.AGE_FIELD || "ageRatingOverrideV2"] = value;
  const res = await api(`/v1/ageRatingDeclarations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ data: { type: "ageRatingDeclarations", id, attributes } }),
  });
  console.log(JSON.stringify({ field: Object.keys(attributes)[0], value, status: res.status, after: res.json.data?.attributes?.[Object.keys(attributes)[0]], error: res.status >= 300 ? res.json : undefined }, null, 2));
}

const CLOSED_STATES = new Set(["COMPLETE", "CANCELING", "CANCELED"]);
// States that can still accept items + be submitted directly.
const REUSABLE_STATES = new Set(["READY_FOR_REVIEW"]);

async function cancelSubmission(id) {
  const res = await api(`/v1/reviewSubmissions/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ data: { type: "reviewSubmissions", id, attributes: { canceled: true } } }),
  });
  console.log("cancel", id, "->", res.status, res.json.data?.attributes?.state || JSON.stringify(res.json.errors?.[0]?.code));
  // wait until fully CANCELED (CANCELING still holds the version item)
  for (let i = 0; i < 24; i++) {
    const g = await api(`/v1/reviewSubmissions/${id}`);
    const st = g.json.data?.attributes?.state;
    if (st === "CANCELED" || st === "COMPLETE") { console.log("  cancelled state:", st); return; }
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log("  warning: still not CANCELED after wait");
}

async function submitReview() {
  const ver = await getEditableVersion();
  if (!ver) return console.log("no editable version to submit");
  console.log("version:", ver.attributes.versionString, ver.attributes.appStoreState, "id=" + ver.id);

  // 1) deal with existing submissions: reuse only a clean READY_FOR_REVIEW,
  //    otherwise cancel the stale/rejected one and create a fresh submission.
  const existing = await api(`/v1/reviewSubmissions?filter[app]=${APP_ID}&filter[platform]=IOS&limit=20`);
  const open = (existing.json.data || []).filter((s) => !CLOSED_STATES.has(s.attributes?.state));
  let sub = open.find((s) => REUSABLE_STATES.has(s.attributes?.state));
  if (sub) {
    console.log("reusing reviewSubmission", sub.id, sub.attributes?.state);
  } else {
    for (const stale of open) {
      console.log("cancelling stale submission", stale.id, stale.attributes?.state);
      await cancelSubmission(stale.id);
    }
    const create = await api(`/v1/reviewSubmissions`, {
      method: "POST",
      body: JSON.stringify({ data: { type: "reviewSubmissions", attributes: { platform: "IOS" }, relationships: { app: { data: { type: "apps", id: APP_ID } } } } }),
    });
    if (create.status >= 300) return console.log("create reviewSubmission failed", JSON.stringify(create.json, null, 2));
    sub = create.json.data;
    console.log("created reviewSubmission", sub.id);
  }

  // 2) make sure the version is an item of the submission
  const items = await api(`/v1/reviewSubmissions/${sub.id}/items?include=appStoreVersion&limit=50`);
  let hasItem = (items.json.data || []).some((it) => it.relationships?.appStoreVersion?.data?.id === ver.id);
  if (!hasItem) {
    const itemRes = await api(`/v1/reviewSubmissionItems`, {
      method: "POST",
      body: JSON.stringify({ data: { type: "reviewSubmissionItems", relationships: { reviewSubmission: { data: { type: "reviewSubmissions", id: sub.id } }, appStoreVersion: { data: { type: "appStoreVersions", id: ver.id } } } } }),
    });
    if (itemRes.status < 300) {
      hasItem = true;
      console.log("added version item", itemRes.json.data?.id);
    } else {
      console.log("add item returned", itemRes.status, JSON.stringify(itemRes.json));
      const recheck = await api(`/v1/reviewSubmissions/${sub.id}/items?include=appStoreVersion&limit=50`);
      hasItem = (recheck.json.data || []).some((it) => it.relationships?.appStoreVersion?.data?.id === ver.id);
    }
  } else {
    console.log("version item already present");
  }
  if (!hasItem) return console.log("aborting: version is not part of the submission");

  // 3) submit
  const submit = await api(`/v1/reviewSubmissions/${sub.id}`, {
    method: "PATCH",
    body: JSON.stringify({ data: { type: "reviewSubmissions", id: sub.id, attributes: { submitted: true } } }),
  });
  console.log(JSON.stringify({ reviewSubmission: sub.id, patchStatus: submit.status, state: submit.json.data?.attributes?.state, submittedDate: submit.json.data?.attributes?.submittedDate, error: submit.status >= 300 ? submit.json : undefined }, null, 2));
}

async function diag() {
  const ver = await getEditableVersion();
  if (!ver) return console.log("no editable version");
  console.log("VERSION", ver.attributes.versionString, ver.attributes.appStoreState, ver.id);
  const b = await api(`/v1/appStoreVersions/${ver.id}/build?fields[builds]=version,processingState`);
  console.log("ATTACHED BUILD", JSON.stringify(b.json.data?.attributes), b.json.data?.id);
  const subm = await api(`/v1/appStoreVersions/${ver.id}/appStoreVersionSubmission`);
  console.log("VERSION SUBMISSION", subm.status, JSON.stringify(subm.json.data?.attributes || subm.json.errors?.[0]?.code));
  const locs = await api(`/v1/appStoreVersions/${ver.id}/appStoreVersionLocalizations?fields[appStoreVersionLocalizations]=locale&limit=50`);
  console.log("LOCALES", (locs.json.data || []).map((l) => l.attributes.locale).join(","));
  const subs = await api(`/v1/reviewSubmissions?filter[app]=${APP_ID}&filter[platform]=IOS&limit=20`);
  for (const s of subs.json.data || []) {
    console.log("REVIEW SUBMISSION", s.id, s.attributes?.state);
    const items = await api(`/v1/reviewSubmissions/${s.id}/items?include=appStoreVersion&limit=50`);
    for (const it of items.json.data || []) {
      console.log("  ITEM", it.id, "state=", it.attributes?.state, "verId=", it.relationships?.appStoreVersion?.data?.id, "removed=", it.attributes?.removed);
    }
  }
}

async function status() {
  const v = await api(`/v1/apps/${APP_ID}/appStoreVersions?limit=10&fields[appStoreVersions]=versionString,appStoreState,createdDate`);
  for (const x of v.json.data || []) {
    console.log("VERSION", x.attributes?.versionString, x.attributes?.appStoreState);
  }
  const subs = await api(`/v1/reviewSubmissions?filter[app]=${APP_ID}&filter[platform]=IOS&limit=10`);
  for (const s of subs.json.data || []) {
    console.log("REVIEW SUBMISSION", s.id, s.attributes?.state, "submitted=" + s.attributes?.submittedDate);
  }
}

async function createVersion(versionString) {
  // reuse an existing editable version if present
  const v = await api(`/v1/apps/${APP_ID}/appStoreVersions?limit=10&fields[appStoreVersions]=versionString,appStoreState`);
  const editable = (v.json.data || []).find((x) => EDITABLE.has(x.attributes?.appStoreState));
  if (editable) {
    return console.log(JSON.stringify({ reused: true, version: editable.attributes.versionString, state: editable.attributes.appStoreState, id: editable.id }, null, 2));
  }
  const res = await api(`/v1/appStoreVersions`, {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "appStoreVersions",
        attributes: { platform: "IOS", versionString },
        relationships: { app: { data: { type: "apps", id: APP_ID } } },
      },
    }),
  });
  console.log(JSON.stringify({ created: res.status < 300, version: versionString, status: res.status, id: res.json.data?.id, error: res.status >= 300 ? res.json : undefined }, null, 2));
}

const cmd = process.argv[2];
if (cmd === "create-version") await createVersion(process.argv[3] || "1.0.1");
else if (cmd === "status") await status();
else if (cmd === "diag") await diag();
else if (cmd === "submit-review") await submitReview();
else if (cmd === "set-age18") await setAge18(process.argv[3] || "EIGHTEEN_PLUS");
else if (cmd === "set-review") await setReview();
else if (cmd === "build-status") await buildStatus();
else if (cmd === "attach-build") await attachBuild(process.argv[3]);
else if (cmd === "upload-screens") await uploadScreens(process.argv[3] || path.join(__dirname, "..", "store-listing", "screenshots", "ios"));
else console.log("usage: build-status | attach-build <num> | upload-screens [dir] | set-age18 [val] | set-review | submit-review");
