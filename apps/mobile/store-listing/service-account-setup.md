# Granting Play Console access to our submit service account

We already have a service account JSON key checked in at
`apps/mobile/play-service-account.json` (gitignored, mode 600). It belongs
to:

```
eas-submit-eyestalk@eystalk.iam.gserviceaccount.com
```

When EAS calls the Play Developer API on our behalf, that account currently
gets **HTTP 403 — The caller does not have permission**. That means the
service account exists in Google Cloud but Play Console has not been told
"this account is allowed to manage app `com.eyestalkapp.app`".

This is a one-off setup. Once granted, all future `eas submit` calls work
without further intervention.

## Steps (≈ 3 minutes)

1. Sign in at <https://play.google.com/console> with the developer account
   that owns the EyesTalk app.
2. Top right, click the **gear icon** → **Users and permissions**.
3. **Invite new users** → enter the email
   `eas-submit-eyestalk@eystalk.iam.gserviceaccount.com`.
4. Under **App permissions**, click **Add app** and select **EyesTalk**.
5. For that app give the role **Release manager** (Google's recommended
   minimum for a CI/automation service account). If your console only
   offers granular permissions, the required ones are:
   * View app information and download bulk reports
   * Manage testing tracks (internal, closed, open)
   * Manage production releases  *(only if you eventually push to prod
     from CI; not needed for beta/internal)*
6. Account permissions tab (above app permissions): leave everything off.
7. **Invite user** → on the next screen, **Save changes**. Status will be
   *Active* immediately for service accounts (no email confirmation).

## Verifying

After you save, run from your Mac:

```bash
cd apps/mobile
eas submit --platform=android --profile=production --latest --non-interactive
```

If permissions are correct EAS will upload the AAB to the configured track
(in our case **Open testing / beta** with `releaseStatus: "draft"`). If you
still get a 403, the most common causes are:

* Wrong app selected in step 4 (must be the EyesTalk app, not a different
  one in the same console).
* The service account belongs to a Google Cloud project where the **Google
  Play Android Developer API** is disabled. To fix: open
  <https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com>,
  switch project to **eystalk** in the top bar, click **Enable**.
* Permissions saved without selecting an app — repeat step 4 explicitly.
