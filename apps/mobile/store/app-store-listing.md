# App Store Connect listing — EyesTalk (iOS)

Canonical source for the **App Store** (iOS) product page text. Mirrors the
tone of `apps/mobile/store-listing/play-store.md` but respects Apple's field
limits and conventions. Whenever the listing changes, update this file and
re-run the API push so the repo and App Store Connect don't drift.

- **App Store Connect app ID:** `6781209791`
- **Bundle ID:** `com.eyestalkapp.app`
- **Primary locale:** `en-US` · Secondary locale: `ru`
- **Editable version at time of writing:** `1.0` (`PREPARE_FOR_SUBMISSION`)
- **Push tool:** `node apps/mobile/scripts/asc-listing.mjs inspect | apply <json>`

Character limits (Apple): app name ≤ 30 · subtitle ≤ 30 · promotional text ≤
170 · keywords ≤ 100 (comma-separated, no spaces) · description ≤ 4000 ·
What's New ≤ 4000.

---

## en-US

### App name (≤ 30) — *currently `EyesTalk Social App`*

```
EyesTalk Social App
```

> Left unchanged via API. The shorter `EyesTalk` (8 chars) is preferred if the
> name is available to this account — change it manually in App Store Connect →
> App Information, since renaming can collide with another developer's app and
> is not safe to force through the API.

### Subtitle (≤ 30) — used 24

```
See who's here right now
```

### Promotional text (≤ 170) — used 136

```
Check in to a venue, see who's around right now, send a wave, and start a chat — in the room, not on a feed. Now available across the UAE.
```

### Keywords (≤ 100) — used 97

```
venue,nightlife,meet,hangout,bar,club,nearby,chat,checkin,people,lounge,karaoke,wave,local,events
```

> Deliberately excludes "social" and "app" (already in the app name) and avoids
> "dating" (EyesTalk is a venue social-discovery app, not a dating app).

### Description (≤ 4000)

```
EyesTalk turns the bar, club, lounge or karaoke room you're already in into a real conversation. Check in with a QR code or geofence, see who else is around right now, send a wave, match on shared interests — and chat without ever swapping phone numbers.

WHAT YOU CAN DO
• Discover venues nearby on a live map — see what's open and how lively it is right now.
• Check in with one tap via QR code or geofence. No friend lists, no follows, no feed.
• See the people at the same venue as you — nickname, age range, bio, interests. Turn on Stealth Mode if you'd rather watch quietly.
• Send a wave or react with an emoji. Wave back and you can start a chat.
• Micro-chats are timed and light; full chats open once you match — and everything auto-expires 24 hours after you leave the venue.
• Join the venue-wide room: announcements, polls, contests, tournaments and auctions hosted by the venue.
• Earn tokens by checking in and being active, then spend them on activities, song requests and perks.
• Build loyalty with the venues you visit most.

BUILT FOR THE ROOM YOU'RE IN
EyesTalk only works when you're actually somewhere. That's the whole point — honest, in-the-moment presence instead of an endless feed.

YOUR PRIVACY
• Your precise location is only used to verify you're inside a venue. We don't track you in the background or build a location history.
• No third-party trackers, no advertising SDKs, no IDFA.
• Delete your account anytime from Profile → Settings → Delete account. Your data is anonymised immediately and purged within 30 days.

WHO IT'S FOR
• Locals who want to break the ice at their favourite spots.
• Travellers in a new city looking for who's around.
• Venues that want to turn walk-ins into a community.

EyesTalk is available in the United Arab Emirates. We'd love your feedback — reach us in the app or at admin@eyestalk.app.
```

### What's New (≤ 4000) — *not applicable for the first version*

> Apple ignores "What's New" for an app's initial release, so it is left empty.
> For the first post-launch update, use notes like:

```
• Smoother venue map and faster check-ins.
• Polish across chats, waves and activities.
• Bug fixes and stability improvements.
```

### URLs

| Field | Value |
|---|---|
| Support URL | `https://eyestalk.app` |
| Marketing URL | `https://eyestalk.app` |
| Privacy Policy URL | `https://eyestalk.app/privacy` |

---

## ru

### App name (≤ 30)

```
EyesTalk Social App
```

### Subtitle (≤ 30) — used 23

```
Узнай, кто рядом сейчас
```

### Promotional text (≤ 170)

```
Отметьтесь в заведении, посмотрите, кто рядом прямо сейчас, помашите и начните чат — вживую, а не в ленте. Сейчас бета в ОАЭ.
```

### Keywords (≤ 100)

```
место,бар,клуб,рядом,чат,люди,караоке,лаундж,вечеринка,общение,тусовка,ночнаяжизнь
```

### Description (≤ 4000)

```
EyesTalk превращает бар, клуб, лаундж или караоке, где вы уже находитесь, в живое общение. Отметьтесь по QR-коду или геолокации, посмотрите, кто рядом прямо сейчас, отправьте «привет» и начните чат — не обмениваясь номерами телефонов.

ЧТО МОЖНО ДЕЛАТЬ
• Находите заведения рядом на живой карте — что открыто и насколько там оживлённо прямо сейчас.
• Отмечайтесь одним касанием по QR-коду или геозоне. Без списков друзей, подписок и ленты.
• Смотрите, кто находится в том же заведении — никнейм, возрастной диапазон, описание, интересы. Включите режим Стелс, если хотите наблюдать незаметно.
• Отправьте «привет» или реакцию эмодзи. Помашут в ответ — можно начинать чат.
• Микро-чаты ограничены по времени; полноценные чаты открываются после взаимного интереса, а вся переписка исчезает через 24 часа после ухода из заведения.
• Присоединяйтесь к общему чату заведения: объявления, опросы, конкурсы, турниры и аукционы от заведения.
• Зарабатывайте токены за чек-ины и активность и тратьте их на активности, заказ песен и бонусы.
• Накапливайте лояльность в заведениях, которые посещаете чаще всего.

ВАША ПРИВАТНОСТЬ
• Точная геолокация используется только для подтверждения, что вы внутри заведения. Мы не отслеживаем вас в фоне и не храним историю перемещений.
• Никаких сторонних трекеров, рекламных SDK и IDFA.
• Удалите аккаунт в любой момент: Профиль → Настройки → Удалить аккаунт. Данные обезличиваются сразу и полностью удаляются в течение 30 дней.

ДЛЯ КОГО
• Для местных, кто хочет легко знакомиться в любимых местах.
• Для путешественников в новом городе.
• Для заведений, которые хотят превратить гостей в сообщество.

EyesTalk сейчас в бета-версии в ОАЭ. Будем рады вашим отзывам — в приложении или на admin@eyestalk.app.
```

### URLs

| Field | Value |
|---|---|
| Support URL | `https://eyestalk.app` |
| Marketing URL | `https://eyestalk.app` |
| Privacy Policy URL | `https://eyestalk.app/privacy` |

---

## Categorization (suggested — confirm manually in App Store Connect)

| Field | Suggested value | Notes |
|---|---|---|
| Primary category | **Social Networking** | Core function: presence + chat at venues. |
| Secondary category | **Lifestyle** | Nightlife / going-out discovery. |
| Age rating | **17+** | Social app with user-generated content + chat, and venues that may serve alcohol. Aligns with the 18+ "mature audience" target used for Google Play. Set via the Age Rating questionnaire (see below). |

## Age rating questionnaire guidance (App Store)

Answer truthfully in App Store Connect → App Information → Age Rating. Baseline
answers (mirror of `apps/mobile/store-listing/content-rating.md`):

- Cartoon / Fantasy / Realistic violence: **None**
- Sexual content or nudity: **None**
- Profanity or crude humor: **None** (chat profanity is filtered + moderated)
- Alcohol, tobacco, or drug use or references: **Infrequent/Mild** — venues
  listed may serve alcohol; the app does not promote or depict use.
- Mature/Suggestive themes: **None**
- Horror/Fear, Medical, Gambling: **None** (token auctions are deterministic
  highest-bid, no chance, non-monetary — not gambling)
- **Unrestricted web access:** **No** (in-app browser only opens our own legal
  pages)
- **User-generated content / capable of social interactions:** **Yes** — this
  pushes the rating to **17+** and requires moderation, blocking and reporting
  (all present in-app).

---

## What is pushed via API vs. manual

**Pushed by `asc-listing.mjs apply`** (editable draft version `1.0` + appInfo):

- `appStoreVersionLocalizations`: `description`, `keywords`, `promotionalText`,
  `supportUrl`, `marketingUrl` for `en-US` (PATCH) and `ru` (created).
- `appInfoLocalizations`: `subtitle` + `privacyPolicyUrl` for `en-US` (PATCH)
  and `name` + `subtitle` + `privacyPolicyUrl` for `ru` (created).
- `whatsNew` is intentionally **not** set (ignored for a first release).

**Manual steps that the API cannot/should not do here:**

1. **Screenshots** — required, must be captured from the running iOS app
   (see asset inventory below). None of the existing assets are valid iOS
   screenshots.
2. **App icon** — `apps/mobile/assets/icon.png` is already 1024×1024 with no
   alpha; the icon ships inside the build, so no separate marketing-icon upload
   is needed for modern submissions.
3. **App name change** to `EyesTalk` (only if available to this account).
4. **Primary/Secondary category** confirmation.
5. **Age Rating questionnaire**.
6. **Export compliance** — `ITSAppUsesNonExemptEncryption: false` is already in
   `app.json`, so this should auto-resolve, but confirm at submission.
7. **Pricing & availability** (left untouched).
8. **Submit for App Review** (explicitly NOT done by automation).

---

## Required iOS screenshot specs (capture from the app)

App Store requires at least one 6.5"/6.7"/6.9" iPhone screenshot set. iPad is
**not** required (`app.json` → `ios.supportsTablet: false`).

| Display | Pixel size (portrait) | Required? |
|---|---|---|
| 6.9" iPhone (16 Pro Max / 15 Pro Max class) | 1320×2868 **or** 1290×2796 | Yes (one of the large sizes) |
| 6.7" iPhone | 1290×2796 | Accepted as the large size |
| 6.5" iPhone | 1242×2688 | Optional fallback |
| 5.5" iPhone | 1242×2208 | Optional |
| iPad | — | Not required (tablet unsupported) |

> The existing `apps/mobile/store-listing/screenshots/android/*.png` are
> **1080×2400 (Android aspect)** and cannot be used for iOS. Re-shoot on an iOS
> simulator/device against the Dubai demo dataset
> (`node apps/web/scripts/seed-demo-data.mjs`). The 8 Android frames are a good
> storyboard to reproduce: map, venue spotlight, people in the room, venue
> chat, live activities, profile/tokens, chats inbox, stealth status.
