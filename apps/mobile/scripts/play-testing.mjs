import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PATH =
  process.env.PLAY_SA_KEY_PATH ||
  path.join(__dirname, "..", "play-service-account.json");
const PACKAGE = process.env.ANDROID_PACKAGE || "com.eyestalkapp.app";
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const BASE = "https://androidpublisher.googleapis.com/androidpublisher/v3";

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getKey() {
  return JSON.parse(fs.readFileSync(KEY_PATH, "utf8"));
}

async function getAccessToken() {
  const key = getKey();
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: key.client_email,
    scope: SCOPE,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(
    JSON.stringify(claim)
  )}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(signingInput), key.private_key);
  const jwt = `${signingInput}.${b64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`token error ${res.status}: ${JSON.stringify(json)}`);
  }
  return json.access_token;
}

async function api(token, method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
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

async function main() {
  const cmd = process.argv[2] || "inspect";
  const token = await getAccessToken();

  if (cmd === "token") {
    console.log("OK got access token (len)", token.length);
    return;
  }

  // Create an edit (read-only inspection still needs an edit for tracks)
  const edit = await api(token, "POST", `/applications/${PACKAGE}/edits`);
  if (edit.status !== 200) {
    console.log(JSON.stringify({ step: "create-edit", ...edit }, null, 2));
    return;
  }
  const editId = edit.json.id;

  if (cmd === "inspect") {
    const tracks = await api(
      token,
      "GET",
      `/applications/${PACKAGE}/edits/${editId}/tracks`
    );
    console.log(JSON.stringify({ editId, tracks }, null, 2));
    // clean up the edit (delete, do not commit) so we change nothing
    await api(token, "DELETE", `/applications/${PACKAGE}/edits/${editId}`);
    return;
  }

  if (cmd === "testers") {
    const trackName = process.argv[3];
    const t = await api(
      token,
      "GET",
      `/applications/${PACKAGE}/edits/${editId}/testers/${trackName}`
    );
    console.log(JSON.stringify({ track: trackName, testers: t }, null, 2));
    await api(token, "DELETE", `/applications/${PACKAGE}/edits/${editId}`);
    return;
  }

  if (cmd === "track") {
    const trackName = process.argv[3];
    const t = await api(
      token,
      "GET",
      `/applications/${PACKAGE}/edits/${editId}/tracks/${trackName}`
    );
    console.log(JSON.stringify({ editId, track: t }, null, 2));
    await api(token, "DELETE", `/applications/${PACKAGE}/edits/${editId}`);
    return;
  }

  if (cmd === "release-draft") {
    // Create/replace a DRAFT release on a track (does NOT submit for review).
    // Usage: node play-testing.mjs release-draft <track> <versionCode> <name>
    const trackName = process.argv[3] || "production";
    const versionCode = process.argv[4];
    const releaseName = process.argv[5] || "1.0";
    if (!versionCode) {
      console.log("usage: release-draft <track> <versionCode> <name>");
      await api(token, "DELETE", `/applications/${PACKAGE}/edits/${editId}`);
      return;
    }
    const patch = await api(
      token,
      "PUT",
      `/applications/${PACKAGE}/edits/${editId}/tracks/${trackName}`,
      {
        track: trackName,
        releases: [
          {
            name: releaseName,
            versionCodes: [String(versionCode)],
            status: "draft",
          },
        ],
      }
    );
    if (patch.status !== 200) {
      console.log(JSON.stringify({ step: "patch-track", ...patch }, null, 2));
      await api(token, "DELETE", `/applications/${PACKAGE}/edits/${editId}`);
      return;
    }
    const commit = await api(
      token,
      "POST",
      `/applications/${PACKAGE}/edits/${editId}:commit`
    );
    console.log(JSON.stringify({ patched: patch.json, commit }, null, 2));
    return;
  }

  if (cmd === "promote") {
    // Promote a draft release on a track to "completed" so it becomes
    // available to testers. Usage: node play-testing.mjs promote <track> <versionCode>
    // NOTE: committing this edit publishes the release (sends for review).
    const trackName = process.argv[3] || "beta";
    const versionCode = process.argv[4] || "13";
    const releaseName = process.argv[5] || "0.1.9";
    const patch = await api(
      token,
      "PUT",
      `/applications/${PACKAGE}/edits/${editId}/tracks/${trackName}`,
      {
        track: trackName,
        releases: [
          {
            name: releaseName,
            versionCodes: [String(versionCode)],
            status: "completed",
          },
        ],
      }
    );
    if (patch.status !== 200) {
      console.log(JSON.stringify({ step: "patch-track", ...patch }, null, 2));
      await api(token, "DELETE", `/applications/${PACKAGE}/edits/${editId}`);
      return;
    }
    const commit = await api(
      token,
      "POST",
      `/applications/${PACKAGE}/edits/${editId}:commit`
    );
    console.log(JSON.stringify({ patched: patch.json, commit }, null, 2));
    return;
  }

  // Attach a Google Group (by email) as testers for a track.
  // Usage: node play-testing.mjs add-group <track> <group-email>
  // NOTE: The API only supports Google Groups, NOT individual email lists.
  if (cmd === "add-group") {
    const trackName = process.argv[3] || "beta";
    const groupEmail = process.argv[4];
    if (!groupEmail) {
      console.log("usage: add-group <track> <google-group-email>");
      await api(token, "DELETE", `/applications/${PACKAGE}/edits/${editId}`);
      return;
    }
    const put = await api(
      token,
      "PUT",
      `/applications/${PACKAGE}/edits/${editId}/testers/${trackName}`,
      { googleGroups: [groupEmail] }
    );
    if (put.status !== 200) {
      console.log(JSON.stringify({ step: "put-testers", ...put }, null, 2));
      await api(token, "DELETE", `/applications/${PACKAGE}/edits/${editId}`);
      return;
    }
    const commit = await api(
      token,
      "POST",
      `/applications/${PACKAGE}/edits/${editId}:commit`
    );
    console.log(JSON.stringify({ testers: put.json, commit }, null, 2));
    return;
  }

  await api(token, "DELETE", `/applications/${PACKAGE}/edits/${editId}`);
  console.log("unknown command", cmd);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
