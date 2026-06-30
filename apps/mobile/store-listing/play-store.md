# Google Play Store listing — EyesTalk

Copy-paste source for the Play Console main store listing. Treat this file
as the canonical text; whenever the listing changes, update the file and
re-paste so the repo and the Play Console don't drift.

Package: `com.eyestalkapp.app`  ·  Initial track: **Open testing (beta)**

---

## App name (max 30)

```
EyesTalk
```

## Short description (max 80)

```
Real people, real place, now.
```

## Full description (max 4000)

```
EyesTalk turns the bar, café or coworking space you're already in into a
conversation. Check in with a QR code, see who else is around right now, send
a wave, match on shared interests — and chat without ever exchanging phone
numbers.

WHAT'S INSIDE

• Map of nearby venues — find what's open and how lively it is.
• One-tap check-in via QR code at the entrance. No friend lists, no follows.
• See people at the same venue as you, with the basics: nickname, age range,
  bio, interests. Stealth mode if you'd rather watch quietly.
• Send a "wave" or react with an emoji. If they wave back you can chat.
• Direct chats auto-expire 24h after you check out — what happens at the
  venue, stays at the venue.
• Venue-wide chat for the whole room: announcements, polls, mini contests
  and auctions powered by the venue.
• Tokens you earn by being active and use to take part in venue activities,
  request a song, claim a perk.
• Loyalty tiers from the venues you visit most.

YOUR PRIVACY

• Your precise location is only used to verify you're inside a venue.
  We don't track you in the background or build a location history.
• No third-party trackers, no advertising SDKs, no IDFA / Android Ad ID.
• You can delete your account from the app at any time
  (Profile → Settings → Delete account) and your data is anonymised
  immediately and purged within 30 days.

WHO IT'S FOR

• Locals who want to break the ice at their favourite spots.
• Travellers in a new city looking for who's around.
• Venues that want to turn anonymous walk-ins into a real community.

EyesTalk is currently in open beta in the United Arab Emirates. Feedback
goes a long way — write to us in the app or at admin@eyestalk.app.
```

## What's new (release notes, max 500) — for v0.1.4 / build 6

```
• Real "Delete my account" — the in-app option now actually removes your
  data (anonymised immediately, fully purged within 30 days).
• Cleaner permissions: the microphone permission is gone (we never used it).
• Brand-new landing on the website with privacy and account-deletion pages.
• Stability fixes for the venue map on Android.
```

## Graphic assets (Play Console → Main store listing → Graphics)

| Slot | Required size | File |
|---|---|---|
| App icon | 512×512 PNG (32-bit, no alpha) | derive from `apps/mobile/assets/icon.png` (already 1024×1024 — Play accepts auto-downscale, or resize to 512) |
| Feature graphic | **1024×500 PNG / JPG** (no alpha, no store badges, no device frames) | `apps/mobile/store-listing/assets/feature-graphic-1024x500.png` |
| Phone screenshots | 1080×2400 portrait, RGB, no alpha (current set, 8 frames) | `apps/mobile/store-listing/screenshots/android/01–08-*.png` |
| 7" tablet screenshots | optional | skip for first release |
| 10" tablet screenshots | optional | skip for first release |

> **Demo data note.** The screenshots are captured against a Dubai-themed demo
> dataset (3 venues — Sky Lounge DIFC, Cloud 9 Karaoke, Vault Billiards — and 3
> demo users Aria / Karim / Lina with a multilingual venue-general chat, active
> waves, an activities trio and bookable venue services). Run
> `node apps/web/scripts/seed-demo-data.mjs` to refresh that dataset before
> re-shooting; the script is idempotent.

### Phone screenshots — captions for Play Console

Upload them in this order; the captions go in the "Description" field that
appears under each screenshot in Play Console.

1. **Discover live venues around you** — `01-map-venues-nearby.png`
   (Caption: *Dark map, real-time venue pins, "you're here" banner the moment you check in.*)
2. **Walk in. You're connected.** — `02-venue-spotlight.png`
   (Caption: *Venue page with live "X here now", check-in confirmation and one-tap actions.*)
3. **See who's actually in the room** — `03-people-in-the-room.png`
   (Caption: *Stealth-friendly profiles — nickname, age range, interests. No real names.*)
4. **Chat with everyone in the venue** — `04-venue-chat.png`
   (Caption: *Venue announcements, multilingual group chat, taps to wave at anyone.*)
5. **Vote, compete, win — right here** — `05-activities-live.png`
   (Caption: *Live polls, contests and auctions hosted by the venue.*)
6. **Your stealth-friendly profile** — `06-profile-tokens.png`
   (Caption: *Nickname + interests + token balance. Earn tokens by checking in.*)
7. **One inbox for venue + 1-on-1 chats** — `07-chats-inbox.png`
   (Caption: *"You're both here now" highlights venue rooms and people you can meet right now.*)
8. **You decide who sees you** — `08-stealth-status.png`
   (Caption: *Toggle visibility, set your status — "Want to chat", "Looking for company", or stay hidden.*)

## Categorization (Play Console answers)

| Field | Value |
|---|---|
| App or game | App |
| Category | Social |
| Tags | Social, Local, Chat, Dating-adjacent (NOT a dating app) |
| Email | admin@eyestalk.app |
| Phone | (optional) |
| Website | https://eyestalk.app |
| Privacy policy URL | https://eyestalk.app/privacy |

## Data safety form — answers cheat-sheet

Use these answers verbatim in Play Console → App content → Data safety.

**1. Data collection and security**

* Does your app collect or share any user data? — **Yes**
* Is all of the user data collected by your app encrypted in transit? — **Yes**
* Do you provide a way for users to request that their data is deleted? — **Yes** (URL: `https://eyestalk.app/delete-account`)

**2. Data types collected (Yes / No / Purpose)**

| Category | Type | Collected? | Shared? | Optional? | Purpose |
|---|---|---|---|---|---|
| Personal info | Name (nickname) | Yes | Yes (other users in same venue) | No | App functionality, account |
| Personal info | Email | Yes | No | No | Account |
| Personal info | User IDs | Yes | No | No | Account, security |
| Personal info | Other info (bio, interests, social handles) | Yes | Yes (other users in same venue) | Yes | App functionality |
| Photos and videos | Photos | Yes | Yes (avatar/profile photos) | Yes | App functionality |
| Location | Approximate location | Yes | No | No | App functionality |
| Location | Precise location | Yes | No | No | App functionality (geofence verification) |
| Messages | Other in-app messages | Yes | Yes (chat partners + venue chat) | No | App functionality |
| App activity | App interactions | Yes | No | No | Analytics, fraud prevention |
| App info & performance | Crash logs | Yes | No | No | Diagnostics |
| App info & performance | Diagnostics | Yes | No | No | Diagnostics |
| Device or other IDs | Device or other IDs | Yes | No | No | Push notification delivery, abuse prevention |

Everything else: **Not collected**.

**3. Tracking**

* Do you transfer user data outside the app for advertising / cross-app tracking? — **No**
* Do you use any third-party SDKs that may track users? — **No**

## App content — additional answers

* Privacy policy: https://eyestalk.app/privacy
* App access: **Restricted — login required.** Provide reviewer credentials
  (Play Console → App content → App access → "All or some functionality is
  restricted"):
  - Username/email: `aria@demo.eyestalk.app`
  - Password: `EyesTalkDemo!2026`
  - Instructions: this account is pre-checked-in to a Dubai venue ("Sky Lounge
    DIFC (Test)"), so the full experience (map, people in the room, venue chat,
    live activities, 1-on-1 chats) is visible without being physically on-site.
    Sign in with email/password on the first screen.
* Ads: contains no ads.
* Content rating questionnaire — IARC: see `content-rating.md` (UAE / GCC).
* Target audience: 18+ (mature audience). The app is not for children.
* Government app: No.
* Financial features: No (in-app token economy is non-monetary; no real money transfers between users).
* Health: No.
* News: No.
* COVID-19 contact tracing / status: No.
* Data safety: filled per the cheat-sheet above.

## In-app purchases

None at the moment. (Tokens are awarded by venues / activity, not purchased.)
If we add monetisation later we update this section.

## Contact details

* Email: `admin@eyestalk.app`
* Website: `https://eyestalk.app`
* Privacy policy: `https://eyestalk.app/privacy`
* Account deletion: `https://eyestalk.app/delete-account`
