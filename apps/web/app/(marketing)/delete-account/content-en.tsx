import { COMPANY } from '@/components/site/company-info';

export function DeleteAccountEN() {
  return (
    <>
      <p className="lead">
        You can permanently delete your {COMPANY.brand} account and the
        personal data we hold about you at any time.
      </p>

      <h2>1. Delete from inside the app</h2>
      <ol>
        <li>
          Open <strong>{COMPANY.brand}</strong> on your device.
        </li>
        <li>
          Go to <strong>Profile → Settings → Delete account</strong>.
        </li>
        <li>Confirm the action when prompted.</li>
      </ol>
      <p>
        This is the fastest way and we recommend it. The deletion request is
        recorded immediately, you are signed out from all devices, your
        profile is anonymised at once, and identifying data is purged within
        30 days.
      </p>

      <h2>2. Request deletion without signing in</h2>
      <p>
        If you have lost access to your device or cannot sign in, send an
        email from the address registered to your account to{' '}
        <a href={`mailto:${COMPANY.email}?subject=Delete%20my%20account`}>
          {COMPANY.email}
        </a>{' '}
        with the subject &quot;Delete my account&quot;. We may ask one or two
        verification questions to confirm you are the account holder. We will
        action the request within 30 days, as required by UAE PDPL Art. 7 and
        GDPR Art. 17, and confirm by email when it is complete.
      </p>

      <h2>3. What gets deleted</h2>
      <ul>
        <li>
          Your <strong>profile</strong> — nickname, age range, gender, avatar,
          additional photos, bio, interests, social handles.
        </li>
        <li>
          Your <strong>account credentials</strong> — email, password hash and
          any third-party sign-in identifiers.
        </li>
        <li>
          <strong>Push notification tokens</strong> — you stop receiving any
          notifications immediately.
        </li>
        <li>
          <strong>Active sessions</strong> — you are signed out everywhere.
        </li>
      </ul>

      <h2>4. What we keep, and for how long</h2>
      <p>
        Some information is retained in an anonymised or aggregated form
        because we are required by law to keep it, or because it is needed to
        keep the Service safe and other users protected:
      </p>
      <ul>
        <li>
          <strong>Chat messages and venue posts you authored</strong> are
          de-linked from your identity (your messages appear from
          &quot;deleted_user&quot;) but kept up to 24 hours after the
          corresponding venue session ends, or up to 24 months when retained
          for moderation following a report. We do this to honour ongoing
          conversations of other users and to enforce our community rules.
        </li>
        <li>
          <strong>Reports submitted against or by you</strong> are kept up to
          24 months for repeat-offender enforcement, with your identity
          replaced by an anonymous handle.
        </li>
        <li>
          <strong>Token transactions and venue payments</strong> are retained
          for the period required by UAE tax and accounting law (typically up
          to 7 years), in an anonymised form linked only to a transaction
          reference.
        </li>
        <li>
          <strong>Backups</strong> — anonymised data may persist in our
          encrypted backups until the backup rotation cycle expires (up to 35
          days).
        </li>
      </ul>
      <p>
        After the retention windows above, the residual records are
        permanently purged.
      </p>

      <h2>5. Confirmation and timing</h2>
      <p>
        We act on the deletion request immediately by anonymising your live
        profile and signing you out. The full account purge (removal of
        authentication credentials and the profile row) is completed within
        30 days. We will not contact you about the Service after that, unless
        we are required to do so by law.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about deletion or data subject requests:
        <br />
        <strong>{COMPANY.legalNameFull}</strong>
        <br />
        {COMPANY.address}
        <br />
        Email:{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
      </p>
    </>
  );
}
