/**
 * App Store Connect listing helper for EyesTalk.
 *
 * Signs an ES256 JWT (aud: appstoreconnect-v1) the same way scripts/asc-app.mjs
 * does, then inspects and (optionally) populates the editable App Store version
 * localizations and appInfo localizations.
 *
 * Commands:
 *   inspect                  GET app, appInfos, versions, localizations (read-only)
 *   apply <listing.json>     PATCH the editable version localizations + appInfo
 *                            localizations from a JSON file. GET-before-PATCH,
 *                            idempotent, never submits for review.
 *
 * Env (with sensible defaults baked in for this repo):
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

// States that mean "this version row is editable and safe to write to".
const EDITABLE_STATES = new Set([
  "PREPARE_FOR_SUBMISSION",
  "DEVELOPER_REJECTED",
  "REJECTED",
  "METADATA_REJECTED",
  "INVALID_BINARY",
  "WAITING_FOR_REVIEW", // editable until actually in review in some cases
]);

async function getApp() {
  return api(`/v1/apps/${APP_ID}`);
}

async function getAppInfos() {
  return api(`/v1/apps/${APP_ID}/appInfos`);
}

async function getAppInfoLocalizations(appInfoId) {
  return api(
    `/v1/appInfos/${appInfoId}/appInfoLocalizations?limit=50`
  );
}

async function getVersions() {
  // Pull recent versions with state + platform.
  return api(
    `/v1/apps/${APP_ID}/appStoreVersions?limit=10&fields[appStoreVersions]=versionString,appStoreState,platform,createdDate,releaseType`
  );
}

async function getVersionLocalizations(versionId) {
  return api(
    `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=50`
  );
}

async function inspect() {
  const out = {};
  const app = await getApp();
  out.app = { status: app.status, data: app.json.data, errors: app.json.errors };

  const infos = await getAppInfos();
  out.appInfos = [];
  for (const info of infos.json.data || []) {
    const locs = await getAppInfoLocalizations(info.id);
    out.appInfos.push({
      id: info.id,
      attributes: info.attributes,
      localizations: (locs.json.data || []).map((l) => ({
        id: l.id,
        attributes: l.attributes,
      })),
    });
  }
  if (infos.status !== 200) out.appInfosError = infos.json;

  const versions = await getVersions();
  out.versions = [];
  for (const v of versions.json.data || []) {
    const locs = await getVersionLocalizations(v.id);
    out.versions.push({
      id: v.id,
      attributes: v.attributes,
      editable: EDITABLE_STATES.has(v.attributes?.appStoreState),
      localizations: (locs.json.data || []).map((l) => ({
        id: l.id,
        attributes: l.attributes,
      })),
    });
  }
  if (versions.status !== 200) out.versionsError = versions.json;

  console.log(JSON.stringify(out, null, 2));
}

function pickEditableVersion(versions) {
  return (versions || []).find((v) =>
    EDITABLE_STATES.has(v.attributes?.appStoreState)
  );
}

async function apply(listingPath) {
  const listing = JSON.parse(fs.readFileSync(listingPath, "utf8"));
  const result = { dryRun: false, appInfo: [], version: [] };

  // 1) appInfo localizations: name + subtitle
  const infos = await getAppInfos();
  // The appInfo whose state is editable; prefer the one with appStoreState in
  // an editable state, else fall back to the first.
  const editableInfo =
    (infos.json.data || []).find((i) =>
      EDITABLE_STATES.has(i.attributes?.appStoreState)
    ) || (infos.json.data || [])[0];

  if (!editableInfo) {
    result.appInfoError = { status: infos.status, body: infos.json };
  } else {
    result.appInfoId = editableInfo.id;
    result.appInfoState = editableInfo.attributes?.appStoreState;
    const locs = await getAppInfoLocalizations(editableInfo.id);
    const byLocale = new Map(
      (locs.json.data || []).map((l) => [l.attributes.locale, l])
    );
    for (const [locale, fields] of Object.entries(listing.appInfo || {})) {
      const existing = byLocale.get(locale);
      const attributes = {};
      if (fields.name !== undefined) attributes.name = fields.name;
      if (fields.subtitle !== undefined) attributes.subtitle = fields.subtitle;
      if (fields.privacyPolicyUrl !== undefined)
        attributes.privacyPolicyUrl = fields.privacyPolicyUrl;
      if (Object.keys(attributes).length === 0) continue;

      if (existing) {
        const before = {
          name: existing.attributes.name,
          subtitle: existing.attributes.subtitle,
          privacyPolicyUrl: existing.attributes.privacyPolicyUrl,
        };
        const patch = await api(`/v1/appInfoLocalizations/${existing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            data: {
              type: "appInfoLocalizations",
              id: existing.id,
              attributes,
            },
          }),
        });
        result.appInfo.push({
          locale,
          action: "patch",
          status: patch.status,
          before,
          after: attributes,
          error: patch.status >= 300 ? patch.json : undefined,
        });
      } else {
        const post = await api(`/v1/appInfoLocalizations`, {
          method: "POST",
          body: JSON.stringify({
            data: {
              type: "appInfoLocalizations",
              attributes: { locale, ...attributes },
              relationships: {
                appInfo: { data: { type: "appInfos", id: editableInfo.id } },
              },
            },
          }),
        });
        result.appInfo.push({
          locale,
          action: "create",
          status: post.status,
          after: attributes,
          error: post.status >= 300 ? post.json : undefined,
        });
      }
    }
  }

  // 2) appStoreVersion localizations
  const versions = await getVersions();
  const editableVersion = pickEditableVersion(versions.json.data || []);
  if (!editableVersion) {
    result.versionError = {
      message: "no editable appStoreVersion found",
      states: (versions.json.data || []).map((v) => ({
        version: v.attributes?.versionString,
        state: v.attributes?.appStoreState,
      })),
    };
  } else {
    result.versionId = editableVersion.id;
    result.versionState = editableVersion.attributes?.appStoreState;
    result.versionString = editableVersion.attributes?.versionString;
    const locs = await getVersionLocalizations(editableVersion.id);
    const byLocale = new Map(
      (locs.json.data || []).map((l) => [l.attributes.locale, l])
    );
    const VERSION_FIELDS = [
      "description",
      "keywords",
      "promotionalText",
      "supportUrl",
      "marketingUrl",
      "whatsNew",
    ];
    for (const [locale, fields] of Object.entries(listing.version || {})) {
      const attributes = {};
      for (const f of VERSION_FIELDS) {
        if (fields[f] !== undefined) attributes[f] = fields[f];
      }
      if (Object.keys(attributes).length === 0) continue;
      const existing = byLocale.get(locale);
      if (existing) {
        const before = {};
        for (const f of VERSION_FIELDS) before[f] = existing.attributes[f];
        const patch = await api(
          `/v1/appStoreVersionLocalizations/${existing.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              data: {
                type: "appStoreVersionLocalizations",
                id: existing.id,
                attributes,
              },
            }),
          }
        );
        result.version.push({
          locale,
          action: "patch",
          status: patch.status,
          before,
          after: attributes,
          error: patch.status >= 300 ? patch.json : undefined,
        });
      } else {
        const post = await api(`/v1/appStoreVersionLocalizations`, {
          method: "POST",
          body: JSON.stringify({
            data: {
              type: "appStoreVersionLocalizations",
              attributes: { locale, ...attributes },
              relationships: {
                appStoreVersion: {
                  data: { type: "appStoreVersions", id: editableVersion.id },
                },
              },
            },
          }),
        });
        result.version.push({
          locale,
          action: "create",
          status: post.status,
          after: attributes,
          error: post.status >= 300 ? post.json : undefined,
        });
      }
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

const cmd = process.argv[2] || "inspect";
if (cmd === "inspect") {
  await inspect();
} else if (cmd === "apply") {
  const file = process.argv[3];
  if (!file) {
    console.error("usage: node asc-listing.mjs apply <listing.json>");
    process.exit(1);
  }
  await apply(file);
} else {
  console.error("unknown command", cmd);
  process.exit(1);
}
