// Populate the Google Play store listing (text + graphics) for EyesTalk via the
// Android Publisher API v3 edits flow. Listing-only: this does NOT touch any
// release or track and does NOT publish the app.
//
// Usage:
//   node apps/mobile/scripts/play-listing.mjs            # run + commit
//   node apps/mobile/scripts/play-listing.mjs --dry-run  # stage everything, then DELETE the edit (no commit)
//
// Auth mirrors scripts/play-testing.mjs: a signed JWT minted from the
// service-account JSON, exchanged for an androidpublisher access token.

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_DIR = path.join(__dirname, "..");

const KEY_PATH =
  process.env.PLAY_SA_KEY_PATH ||
  path.join(MOBILE_DIR, "play-service-account.json");
const PACKAGE = process.env.ANDROID_PACKAGE || "com.eyestalkapp.app";
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const BASE = "https://androidpublisher.googleapis.com/androidpublisher/v3";
const UPLOAD_BASE =
  "https://androidpublisher.googleapis.com/upload/androidpublisher/v3";

const DRY_RUN = process.argv.includes("--dry-run");

// Play limits
const LIMITS = { title: 30, shortDescription: 80, fullDescription: 4000 };

// ----- content locations -----
const LISTING_MD = path.join(MOBILE_DIR, "store-listing", "play-store.md");
const SCREENSHOTS_DIR = path.join(
  MOBILE_DIR,
  "store-listing",
  "screenshots",
  "android"
);
const FEATURE_GRAPHIC = path.join(
  MOBILE_DIR,
  "store-listing",
  "assets",
  "feature-graphic-1024x500.png"
);
const ICON_SRC = path.join(MOBILE_DIR, "assets", "icon.png");

// ----------------------------------------------------------------------------
// auth (identical pattern to play-testing.mjs)
// ----------------------------------------------------------------------------
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
  const signature = crypto.sign(
    "RSA-SHA256",
    Buffer.from(signingInput),
    key.private_key
  );
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

async function uploadImage(token, editId, lang, imageType, filePath) {
  const data = fs.readFileSync(filePath);
  const res = await fetch(
    `${UPLOAD_BASE}/applications/${PACKAGE}/edits/${editId}/listings/${lang}/${imageType}?uploadType=media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "image/png",
      },
      body: data,
    }
  );
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

// ----------------------------------------------------------------------------
// content parsing
// ----------------------------------------------------------------------------
// Pull the first fenced ``` block that follows a heading matching `headingRe`.
function extractBlock(md, headingRe) {
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (headingRe.test(lines[i])) {
      // find the opening fence after the heading
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith("```")) j++;
      if (j >= lines.length) return null;
      const out = [];
      j++;
      while (j < lines.length && !lines[j].trim().startsWith("```")) {
        out.push(lines[j]);
        j++;
      }
      return out.join("\n").trim();
    }
  }
  return null;
}

// The full description in the md is hard-wrapped for readability. Google Play
// renders single newlines as line breaks, so we re-join wrapped lines within a
// paragraph back into a single line while preserving blank-line paragraph
// breaks and bullet items.
function unwrap(text) {
  const paras = text.split(/\n\s*\n/);
  return paras
    .map((para) => {
      const lines = para.split("\n");
      const merged = [];
      for (const raw of lines) {
        const line = raw.replace(/\s+$/, "");
        const isBullet = /^\s*•/.test(line);
        if (isBullet || merged.length === 0) {
          merged.push(line.trim());
        } else {
          // continuation of a wrapped line/bullet
          merged[merged.length - 1] += " " + line.trim();
        }
      }
      return merged.join("\n");
    })
    .join("\n\n");
}

function loadListings() {
  const md = fs.readFileSync(LISTING_MD, "utf8");
  const title = extractBlock(md, /^##\s*App name/i);
  const shortDescription = extractBlock(md, /^##\s*Short description/i);
  const fullRaw = extractBlock(md, /^##\s*Full description/i);
  if (!title || !shortDescription || !fullRaw) {
    throw new Error("Failed to parse title/short/full from play-store.md");
  }
  const fullDescription = unwrap(fullRaw);

  const enUS = { title, shortDescription, fullDescription };

  // Only add ru-RU if the md actually contains a Russian listing section.
  const ruTitle = extractBlock(md, /^##\s*(App name|Название).*\(ru/i);
  const listings = { "en-US": enUS };
  if (ruTitle) {
    listings["ru-RU"] = {
      title: ruTitle,
      shortDescription: extractBlock(md, /^##\s*Short.*\(ru/i),
      fullDescription: unwrap(extractBlock(md, /^##\s*Full.*\(ru/i) || ""),
    };
  }
  return listings;
}

function validate(listing, lang) {
  for (const field of Object.keys(LIMITS)) {
    const len = (listing[field] || "").length;
    if (len === 0) throw new Error(`${lang}.${field} is empty`);
    if (len > LIMITS[field]) {
      throw new Error(
        `${lang}.${field} is ${len} chars, exceeds limit ${LIMITS[field]}`
      );
    }
  }
}

// Generate a 512x512 hi-res icon from the 1024x1024 source using macOS sips.
function makeIcon512() {
  const out = path.join(os.tmpdir(), `eyestalk-icon-512-${Date.now()}.png`);
  execFileSync("sips", ["-z", "512", "512", ICON_SRC, "--out", out], {
    stdio: "ignore",
  });
  return out;
}

function screenshotFiles() {
  return fs
    .readdirSync(SCREENSHOTS_DIR)
    .filter((f) => /^\d{2}.*\.png$/i.test(f))
    .sort()
    .map((f) => path.join(SCREENSHOTS_DIR, f));
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------
async function main() {
  const report = { package: PACKAGE, dryRun: DRY_RUN, locales: {}, images: {} };

  const listings = loadListings();
  for (const [lang, l] of Object.entries(listings)) {
    validate(l, lang);
  }

  const token = await getAccessToken();

  const edit = await api(token, "POST", `/applications/${PACKAGE}/edits`);
  if (edit.status !== 200) {
    throw new Error(`create-edit failed: ${JSON.stringify(edit)}`);
  }
  const editId = edit.json.id;
  report.editId = editId;

  let tmpIcon;
  try {
    // 1) listing text
    for (const [lang, l] of Object.entries(listings)) {
      const put = await api(
        token,
        "PUT",
        `/applications/${PACKAGE}/edits/${editId}/listings/${lang}`,
        {
          language: lang,
          title: l.title,
          shortDescription: l.shortDescription,
          fullDescription: l.fullDescription,
        }
      );
      if (put.status !== 200) {
        throw new Error(`put listing ${lang} failed: ${JSON.stringify(put)}`);
      }
      report.locales[lang] = {
        title: l.title,
        titleLen: l.title.length,
        shortLen: l.shortDescription.length,
        fullLen: l.fullDescription.length,
      };
    }

    // 2) graphics — only on en-US (the default listing)
    const lang = "en-US";
    tmpIcon = makeIcon512();

    const imagePlan = [
      { type: "icon", files: [tmpIcon] },
      { type: "featureGraphic", files: [FEATURE_GRAPHIC] },
      { type: "phoneScreenshots", files: screenshotFiles() },
    ];

    for (const { type, files } of imagePlan) {
      // idempotent: clear existing images of this type first
      const del = await api(
        token,
        "DELETE",
        `/applications/${PACKAGE}/edits/${editId}/listings/${lang}/${type}`
      );
      if (del.status !== 200 && del.status !== 204) {
        throw new Error(`deleteall ${type} failed: ${JSON.stringify(del)}`);
      }
      const uploaded = [];
      for (const f of files) {
        const up = await uploadImage(token, editId, lang, type, f);
        if (up.status !== 200) {
          throw new Error(
            `upload ${type} ${path.basename(f)} failed: ${JSON.stringify(up)}`
          );
        }
        uploaded.push({
          file: path.basename(f),
          id: up.json?.image?.id,
          sha256: up.json?.image?.sha256,
        });
      }
      report.images[type] = uploaded;
    }

    // 3) commit (or delete on dry-run)
    if (DRY_RUN) {
      await api(token, "DELETE", `/applications/${PACKAGE}/edits/${editId}`);
      report.commit = { status: "dry-run (edit deleted, nothing committed)" };
    } else {
      const commit = await api(
        token,
        "POST",
        `/applications/${PACKAGE}/edits/${editId}:commit`
      );
      if (commit.status !== 200) {
        throw new Error(`commit failed: ${JSON.stringify(commit)}`);
      }
      report.commit = { status: commit.status, id: commit.json.id };
    }
  } catch (err) {
    // best-effort cleanup so we don't leave a dangling edit
    try {
      await api(token, "DELETE", `/applications/${PACKAGE}/edits/${editId}`);
    } catch {}
    throw err;
  } finally {
    if (tmpIcon) {
      try {
        fs.unlinkSync(tmpIcon);
      } catch {}
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
