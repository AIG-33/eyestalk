#!/usr/bin/env bash
#
# Capture Google Play store screenshots from a running Android emulator.
#
# Requirements:
#   * adb (we picked up the one on $PATH; should be inside Android SDK)
#   * one Android emulator booted, with EyesTalk dev/preview build installed
#     and signed in as a test user that has joined a venue (so the screens
#     are populated)
#
# Output:
#   apps/mobile/store-listing/screenshots/android/SCREEN_NAME.png
#
# Play Store rules for phone screenshots (as of Apr 2026):
#   * 16:9 or 9:16 aspect ratio
#   * 320–3840 px on the longer side
#   * 2–8 screenshots per language
#   * PNG or JPEG, no transparency
#
# Usage:
#   bash apps/mobile/scripts/play-store-screenshots.sh
#   bash apps/mobile/scripts/play-store-screenshots.sh map people chat profile
#
# Each frame waits 4s after a screen route is opened to let images / map
# tiles / animations settle before the screen is captured.

set -euo pipefail

PKG="${PKG:-com.eyestalkapp.app}"
OUT_DIR="${OUT_DIR:-$(cd "$(dirname "$0")/.." && pwd)/store-listing/screenshots/android}"
SETTLE_MS="${SETTLE_MS:-4000}"

mkdir -p "$OUT_DIR"

ensure_adb() {
  if ! command -v adb >/dev/null 2>&1; then
    echo "adb not on PATH. Run: source ~/.bash_profile" >&2
    exit 1
  fi
  local devices
  devices=$(adb devices | awk 'NR>1 && $2=="device" {print $1}' | head -1)
  if [[ -z "${devices}" ]]; then
    echo "No emulator/device attached. Start one with 'pnpm emulator'." >&2
    exit 1
  fi
  echo "Using device: ${devices}"
}

open_route() {
  local route="$1"
  local deeplink="exp+eyestalk://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081/--/${route}"
  adb shell am start -W -a android.intent.action.VIEW -d "${deeplink}" >/dev/null
  sleep $((SETTLE_MS / 1000))
}

capture() {
  local name="$1"
  local out="${OUT_DIR}/${name}.png"
  adb exec-out screencap -p > "${out}"
  echo "  ↳ saved ${out}"
}

shoot() {
  local screen_name="$1"
  local route="${2:-}"
  echo "[${screen_name}]"
  if [[ -n "${route}" ]]; then
    open_route "${route}"
  fi
  capture "${screen_name}"
}

ensure_adb

TARGETS=("$@")
if [[ ${#TARGETS[@]} -eq 0 ]]; then
  TARGETS=(map people chat profile)
fi

for s in "${TARGETS[@]}"; do
  case "$s" in
    map)         shoot 01-map         "(app)/(tabs)/map" ;;
    people)     shoot 02-people      "(app)/venue/demo/people" ;;
    chat)        shoot 03-chat        "(app)/(tabs)/chats" ;;
    profile)     shoot 04-profile     "(app)/(tabs)/profile" ;;
    activities)  shoot 05-activities  "(app)/venue/demo/activities" ;;
    achievements)shoot 06-achievements "(app)/achievements" ;;
    *) shoot "$s" ;;
  esac
done

echo
echo "Done. ${#TARGETS[@]} screenshot(s) in ${OUT_DIR}"
echo
echo "Quick sanity check:"
ls -lh "${OUT_DIR}" || true
