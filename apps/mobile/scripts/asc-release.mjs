/**
 * App Store Connect release-metadata helper for EyesTalk.
 *
 * Reuses the EXACT same ES256 JWT auth as scripts/asc-listing.mjs (aud:
 * appstoreconnect-v1), then sets the two pieces of "release" metadata that the
 * listing script does NOT touch:
 *   1. Primary / secondary App Store categories on the editable appInfo.
 *   2. The Age Rating questionnaire (ageRatingDeclaration).
 *
 * It is read-before-write, idempotent, and NEVER submits the app or version
 * for review. It never touches the build/binary selection.
 *
 * Commands:
 *   inspect      Dump categories, the editable appInfo's category relationships
 *                and the current ageRatingDeclaration attributes (read-only).
 *   categories   Print the iOS appCategories tree (ids only) (read-only).
 *   apply        GET-before-PATCH set categories (step 1) + age rating (step 2).
 *   pricing      Inspect current price schedule / try to set Free (best-effort).
 *
 * Env (defaults baked in for this repo, same as asc-listing.mjs):
 *   ASC_KEY_ID, ASC_ISSUER_ID, ASC_API_KEY_PATH, ASC_APP_ID
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KEY_ID = process.env.ASC_KEY_ID || "TRS8NZAGX5";
const ISSUER_ID =
  process.env.ASC_ISSUER_ID || "31303d35-0acc-4d1a-89d4-872e31f2b28f";
const KEY_PATH =
  process.env.ASC_API_KEY_PATH ||
  path.join(__dirname, "..", "credentials", "AppStoreConnect_ApiKey.p8");
const APP_ID = process.env.ASC_APP_ID || "6781209791";

// ---- Desired category ids (iOS appCategories use stable, human-readable ids).
const PRIMARY_CATEGORY_ID = process.env.ASC_PRIMARY_CATEGORY || "SOCIAL_NETWORKING";
const SECONDARY_CATEGORY_ID = process.env.ASC_SECONDARY_CATEGORY || "LIFESTYLE";

// ---- Desired, TRUTHFUL age-rating answers for EyesTalk.
// Source: apps/mobile/store/app-store-listing.md ("Age rating questionnaire
// guidance") and apps/mobile/store-listing/content-rating.md.
// Keys are only written if they actually exist on the live declaration (so the
// script stays robust to Apple's evolving age-rating schema). Enum values use
// Apple's frequency scale: NONE | INFREQUENT_OR_MILD | FREQUENT_OR_INTENSE.
const DESIRED_AGE_RATING = {
  // --- Frequency enums: NONE | INFREQUENT_OR_MILD | FREQUENT_OR_INTENSE ---
  // Violence — none of any kind.
  violenceCartoonOrFantasy: "NONE",
  violenceRealistic: "NONE",
  violenceRealisticProlongedGraphicOrSadistic: "NONE",
  gunsOrOtherWeapons: "NONE",
  // Sexual content — none.
  sexualContentOrNudity: "NONE",
  sexualContentGraphicAndNudity: "NONE",
  // Profanity / mature / horror / medical — none.
  profanityOrCrudeHumor: "NONE",
  matureOrSuggestiveThemes: "NONE",
  horrorOrFearThemes: "NONE",
  medicalOrTreatmentInformation: "NONE",
  // Alcohol / tobacco / drugs — infrequent/mild (venues may serve alcohol).
  alcoholTobaccoOrDrugUseOrReferences: "INFREQUENT_OR_MILD",
  // Gambling/contests frequency — none. Token auctions are deterministic.
  gamblingSimulated: "NONE",
  contests: "NONE",

  // --- Booleans ---
  gambling: false, // no real-money gambling
  gamblingAndContests: false, // legacy boolean (only written if present)
  lootBox: false, // no loot boxes / paid randomized rewards
  advertising: false, // no third-party ads / ad SDKs / IDFA
  healthOrWellnessTopics: false, // not a health/wellness app
  parentalControls: false, // app does not provide parental controls
  ageAssurance: false, // no in-app age-assurance/verification mechanism
  // App HAS user-generated content + messaging/chat — these drive the 17+
  // rating and are why moderation/blocking/reporting must exist (they do).
  userGeneratedContent: true,
  messagingAndChat: true,
  // No unrestricted browsing — in-app browser only opens our own legal pages.
  unrestrictedWebAccess: false,
  // Not a kids-category app.
  kidsAgeBand: null,
};

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function makeJwt() {
  const privateKey = fs.readFileSync(KEY_PATH, "utf8");
  const header = { alg: "ES256", kid: KEY_ID, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1200,
    aud: "appstoreconnect-v1",
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(
    JSON.stringify(payload)
  )}`;
  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${b64url(signature)}`;
}

async function api(p, options = {}) {
  const token = makeJwt();
  const res = await fetch(`https://api.appstoreconnect.apple.com${p}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

const EDITABLE_STATES = new Set([
  "PREPARE_FOR_SUBMISSION",
  "DEVELOPER_REJECTED",
  "REJECTED",
  "METADATA_REJECTED",
  "INVALID_BINARY",
  "WAITING_FOR_REVIEW",
]);

async function getAppInfos() {
  return api(`/v1/apps/${APP_ID}/appInfos`);
}

function pickEditableAppInfo(infos) {
  return (
    (infos || []).find((i) => EDITABLE_STATES.has(i.attributes?.appStoreState)) ||
    (infos || [])[0]
  );
}

// All iOS appCategories (parents + subcategories), id-only.
async function getCategories() {
  return api(
    `/v1/appCategories?limit=200&exists[parent]=false&include=subcategories&fields[appCategories]=platforms,subcategories`
  );
}

async function getAppInfoCategories(appInfoId) {
  return api(
    `/v1/appInfos/${appInfoId}?include=primaryCategory,secondaryCategory&fields[appInfos]=primaryCategory,secondaryCategory`
  );
}

async function getAgeRatingDeclaration(appInfoId) {
  return api(`/v1/appInfos/${appInfoId}/ageRatingDeclaration`);
}

async function inspect() {
  const out = {};

  const infos = await getAppInfos();
  const info = pickEditableAppInfo(infos.json.data);
  out.appInfo = {
    id: info?.id,
    state: info?.attributes?.appStoreState,
    error: infos.status >= 300 ? infos.json : undefined,
  };

  // Categories the app currently has set.
  if (info) {
    const cat = await getAppInfoCategories(info.id);
    out.appInfo.currentCategories = {
      status: cat.status,
      primaryCategory:
        cat.json.data?.relationships?.primaryCategory?.data?.id ?? null,
      secondaryCategory:
        cat.json.data?.relationships?.secondaryCategory?.data?.id ?? null,
    };

    const ard = await getAgeRatingDeclaration(info.id);
    out.ageRatingDeclaration = {
      status: ard.status,
      id: ard.json.data?.id ?? null,
      attributes: ard.json.data?.attributes ?? null,
      error: ard.status >= 300 ? ard.json : undefined,
    };
  }

  // Available iOS categories (so we can confirm the ids exist).
  const cats = await getCategories();
  out.availableCategories = (cats.json.data || [])
    .filter((c) => (c.attributes?.platforms || []).includes("IOS"))
    .map((c) => ({
      id: c.id,
      subcategories: (c.relationships?.subcategories?.data || []).map((s) => s.id),
    }));
  if (cats.status >= 300) out.availableCategoriesError = cats.json;

  console.log(JSON.stringify(out, null, 2));
}

async function categories() {
  const cats = await getCategories();
  for (const c of cats.json.data || []) {
    if (!(c.attributes?.platforms || []).includes("IOS")) continue;
    const subs = (c.relationships?.subcategories?.data || []).map((s) => s.id);
    console.log(c.id + (subs.length ? `  →  [${subs.join(", ")}]` : ""));
  }
  if (cats.status >= 300) console.error(JSON.stringify(cats.json, null, 2));
}

async function applyCategories(appInfoId, result) {
  const before = await getAppInfoCategories(appInfoId);
  const beforePrimary =
    before.json.data?.relationships?.primaryCategory?.data?.id ?? null;
  const beforeSecondary =
    before.json.data?.relationships?.secondaryCategory?.data?.id ?? null;

  const needsWrite =
    beforePrimary !== PRIMARY_CATEGORY_ID ||
    beforeSecondary !== SECONDARY_CATEGORY_ID;

  if (!needsWrite) {
    result.categories = {
      action: "noop",
      status: 200,
      before: { primary: beforePrimary, secondary: beforeSecondary },
      after: { primary: beforePrimary, secondary: beforeSecondary },
    };
    return;
  }

  const patch = await api(`/v1/appInfos/${appInfoId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "appInfos",
        id: appInfoId,
        relationships: {
          primaryCategory: {
            data: { type: "appCategories", id: PRIMARY_CATEGORY_ID },
          },
          secondaryCategory: {
            data: { type: "appCategories", id: SECONDARY_CATEGORY_ID },
          },
        },
      },
    }),
  });

  // Verify via re-GET.
  const after = await getAppInfoCategories(appInfoId);
  result.categories = {
    action: "patch",
    status: patch.status,
    before: { primary: beforePrimary, secondary: beforeSecondary },
    after: {
      primary: after.json.data?.relationships?.primaryCategory?.data?.id ?? null,
      secondary:
        after.json.data?.relationships?.secondaryCategory?.data?.id ?? null,
    },
    error: patch.status >= 300 ? patch.json : undefined,
  };
}

async function applyAgeRating(appInfoId, result) {
  const current = await getAgeRatingDeclaration(appInfoId);
  if (current.status >= 300 || !current.json.data) {
    result.ageRating = {
      action: "error",
      status: current.status,
      error: current.json,
    };
    return;
  }
  const ardId = current.json.data.id;
  const before = current.json.data.attributes || {};

  // Only set keys that actually exist on the live declaration AND that we have
  // a truthful answer for — robust to Apple's evolving schema.
  const attributes = {};
  const changed = {};
  for (const [key, value] of Object.entries(DESIRED_AGE_RATING)) {
    if (!(key in before)) continue; // skip keys Apple doesn't expose
    attributes[key] = value;
    if (before[key] !== value) changed[key] = { from: before[key], to: value };
  }

  if (Object.keys(attributes).length === 0) {
    result.ageRating = {
      action: "noop",
      status: 200,
      note: "no overlapping known attribute keys",
      liveKeys: Object.keys(before),
    };
    return;
  }

  const patch = await api(`/v1/ageRatingDeclarations/${ardId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: { type: "ageRatingDeclarations", id: ardId, attributes },
    }),
  });

  const after = await getAgeRatingDeclaration(appInfoId);
  result.ageRating = {
    action: "patch",
    declarationId: ardId,
    status: patch.status,
    changed,
    sent: attributes,
    afterAttributes: after.json.data?.attributes ?? null,
    error: patch.status >= 300 ? patch.json : undefined,
  };
}

async function apply() {
  const result = {};
  const infos = await getAppInfos();
  const info = pickEditableAppInfo(infos.json.data);
  if (!info) {
    console.error(JSON.stringify({ error: "no appInfo found", infos: infos.json }, null, 2));
    process.exit(1);
  }
  result.appInfoId = info.id;
  result.appInfoState = info.attributes?.appStoreState;

  await applyCategories(info.id, result);
  await applyAgeRating(info.id, result);

  console.log(JSON.stringify(result, null, 2));
}

async function pricing() {
  const out = {};
  // Current price schedule (manual relationships).
  const sched = await api(
    `/v1/apps/${APP_ID}/appPriceSchedule?include=baseTerritory,manualPrices`
  );
  out.appPriceSchedule = { status: sched.status, data: sched.json.data, error: sched.status >= 300 ? sched.json : undefined };
  console.log(JSON.stringify(out, null, 2));
}

const cmd = process.argv[2] || "inspect";
if (cmd === "inspect") {
  await inspect();
} else if (cmd === "categories") {
  await categories();
} else if (cmd === "apply") {
  await apply();
} else if (cmd === "pricing") {
  await pricing();
} else {
  console.error("unknown command", cmd);
  console.error("usage: node asc-release.mjs [inspect|categories|apply|pricing]");
  process.exit(1);
}
