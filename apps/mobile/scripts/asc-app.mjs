import crypto from "node:crypto";
import fs from "node:fs";

const KEY_ID = process.env.EXPO_ASC_KEY_ID;
const ISSUER_ID = process.env.EXPO_ASC_ISSUER_ID;
const KEY_PATH = process.env.EXPO_ASC_API_KEY_PATH;
const BUNDLE_ID = process.env.BUNDLE_ID || "com.eyestalkapp.app";
const APP_NAME = process.env.APP_NAME || "EyesTalk";
const SKU = process.env.SKU || "eyestalk-001";
const PRIMARY_LOCALE = process.env.PRIMARY_LOCALE || "en-US";

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

async function api(path, options = {}) {
  const token = makeJwt();
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
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

async function findApp() {
  const { status, json } = await api(
    `/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}`
  );
  if (status !== 200) {
    return { ok: false, status, json };
  }
  const app = (json.data || [])[0];
  return { ok: true, app };
}

async function findBundleId() {
  const { status, json } = await api(
    `/v1/bundleIds?filter[identifier]=${encodeURIComponent(BUNDLE_ID)}`
  );
  if (status !== 200) return { ok: false, status, json };
  const bid = (json.data || [])[0];
  return { ok: true, bundleId: bid };
}

async function createApp(bundleIdResourceId) {
  const body = {
    data: {
      type: "apps",
      attributes: {
        bundleId: BUNDLE_ID,
        name: APP_NAME,
        primaryLocale: PRIMARY_LOCALE,
        sku: SKU,
      },
      relationships: {
        bundleId: {
          data: { type: "bundleIds", id: bundleIdResourceId },
        },
      },
    },
  };
  return api(`/v1/apps`, { method: "POST", body: JSON.stringify(body) });
}

const cmd = process.argv[2] || "find";

if (cmd === "find") {
  const r = await findApp();
  console.log(JSON.stringify(r, null, 2));
} else if (cmd === "ensure") {
  const found = await findApp();
  if (found.ok && found.app) {
    console.log(
      JSON.stringify(
        { created: false, id: found.app.id, attributes: found.app.attributes },
        null,
        2
      )
    );
  } else {
    const b = await findBundleId();
    if (!b.ok || !b.bundleId) {
      console.log(
        JSON.stringify(
          { error: "bundleId not found in Apple Developer portal", detail: b },
          null,
          2
        )
      );
      process.exit(2);
    }
    const created = await createApp(b.bundleId.id);
    if (created.status >= 200 && created.status < 300) {
      console.log(
        JSON.stringify(
          { created: true, id: created.json.data.id, attributes: created.json.data.attributes },
          null,
          2
        )
      );
    } else {
      console.log(
        JSON.stringify({ error: "create failed", status: created.status, detail: created.json }, null, 2)
      );
      process.exit(3);
    }
  }
}
