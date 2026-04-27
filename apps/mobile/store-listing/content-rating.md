# Play Console content rating questionnaire — answer guide

EyesTalk is a venue-based social/chat app. Suggested answers below are the
truthful baseline; tweak them only if your jurisdiction or new feature
changes the truth. The end result should be a **PEGI 12 / ESRB Teen / IARC
12+** rating.

## Category

* **Social Networking and Communication** (NOT "Reference, News, or
  Educational" and NOT "Dating, Romance, or Casual" — EyesTalk is not a
  dating app, it's a venue social discovery app, and Google distinguishes
  the two.)

## Violence

* Realistic violence: **No**
* Cartoon violence: **No**
* Sexual violence: **No**

## Sexuality

* Sexual content / nudity: **No**
* References to sexual activity: **No**

## Profanity

* Crude humor: **No**
* Profanity: **No**
* The app filters profanity in chat: **Yes** (we have automated abuse
  detection + reports + moderation by venue owners)

## Drugs / alcohol / tobacco

* References: **Yes — venues that we list may serve alcohol** (the app is
  used at bars, lounges, cafes). We do not promote or glamorise alcohol
  use; we list venues factually.
* Realistic depictions: **No**

## Gambling

* Real-money gambling: **No**
* Simulated gambling: **No**
* In-app token auctions are NOT gambling — they are deterministic
  highest-bid wins, no chance element, tokens cannot be redeemed for
  real-world value.

## User-generated content (UGC) — IMPORTANT

* Does your app allow users to interact / share content with each other?
  **Yes**
* Are users able to share location with each other? **Limited — only
  venue presence ("at this venue right now"), never coordinates.**
* Do you have a way to moderate UGC? **Yes — automated profanity / abuse
  detection, in-app reporting flow, venue-owner moderation, account
  bans for repeat offenders.**
* Do you have a way to block / mute users? **Yes (in-app block).**

## Miscellaneous

* Sharing of personal info beyond username: **Optional — users may
  choose to display Instagram, Telegram, TikTok handles on their
  profile. Always opt-in.**
* Digital purchases: **No** (token economy is non-monetary in v0.1.x)
* Unrestricted internet access: **No** (in-app browser only opens our
  own legal pages)

## Recommended target age

* **18+** in store listing (mature audience), to align with the venue
  context (some venues serve alcohol).

## Disclaimer to include in your privacy policy

Already in `apps/web/app/(marketing)/privacy/content-en.tsx`:
- Section 14 (Mobile permissions): we explicitly do not request mic /
  contacts / etc.
- Section 15 (Account deletion): in-app + public URL.
- Section 16 (Tracking and advertising): we don't track.
