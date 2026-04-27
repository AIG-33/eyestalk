import { COMPANY } from '@/components/site/company-info';

export function PrivacyEN() {
  return (
    <>
      <p className="lead">
        This Privacy Policy explains how {COMPANY.legalNameFull} (
        &quot;{COMPANY.brand}&quot;, &quot;we&quot;, &quot;us&quot;,
        &quot;our&quot;) collects, uses, shares and protects personal data of
        users of the {COMPANY.brand} mobile applications, the website at{' '}
        <a href={COMPANY.url}>{COMPANY.url}</a>, the Venue Owner Panel and
        related services (together, the &quot;Service&quot;). Please read it
        together with our <a href="/terms">Terms of Service</a>.
      </p>
      <p>
        By creating an account or using the Service you confirm that you have
        read this Policy. If you do not agree, please do not use the Service.
      </p>

      <h2>1. Who is the data controller</h2>
      <p>
        The data controller is <strong>{COMPANY.legalNameFull}</strong>, a
        Free Zone Company licensed by the {COMPANY.licenseAuthority} under
        commercial licence No. {COMPANY.licenseNumber}, UAE Federal Tax
        Authority TRN {COMPANY.taxNumber}, D-U-N-S {COMPANY.dunsNumber},
        registered at {COMPANY.address}. Contact:{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
      </p>
      <p>
        For users in the United Arab Emirates this Policy is intended to
        comply with <strong>UAE Federal Decree-Law No. 45 of 2021 on the
        Protection of Personal Data</strong> (&quot;<strong>PDPL</strong>&quot;)
        and the regulations issued thereunder. For users in the European
        Economic Area, the United Kingdom and Switzerland, this Policy is
        intended to comply with the General Data Protection Regulation
        (Regulation (EU) 2016/679, &quot;<strong>GDPR</strong>&quot;) and the
        UK GDPR. For users in California we follow the California Consumer
        Privacy Act, as amended by the CPRA (&quot;<strong>CCPA</strong>&quot;).
      </p>

      <h2>2. The data we collect</h2>
      <h3>2.1. Information you give us</h3>
      <ul>
        <li>
          <strong>Account data</strong> — email address and password (stored
          as a salted hash by our identity provider). Optionally a third-party
          sign-in identifier if you use one.
        </li>
        <li>
          <strong>Profile data</strong> — nickname, age range, gender (if
          provided), avatar photo, additional photos, short bio, interests,
          industry, hobbies, favourite movie / band, &quot;about me&quot;,
          optional public social handles (Instagram, Telegram, LinkedIn).
        </li>
        <li>
          <strong>Venue Owner data</strong> — venue name, type, address,
          coordinates, geofence radius, business description, logo, QR code
          configuration, services and slots, loyalty tiers, announcements.
        </li>
        <li>
          <strong>User content</strong> — chat messages, waves, activity
          submissions (poll votes, contest entries, bids), reports and
          moderation requests you submit.
        </li>
        <li>
          <strong>Payment-related data</strong> — handled by our payment
          processor; we receive only a transaction reference, amount, status
          and last four digits / brand of the card. We do not see or store
          full card numbers.
        </li>
      </ul>
      <h3>2.2. Information we collect automatically</h3>
      <ul>
        <li>
          <strong>Approximate &amp; precise geolocation</strong> — used to
          show nearby venues, verify check-ins inside a venue&apos;s geofence,
          and tag your active session to a venue. Precise location is only
          captured while the app is in use and you have granted the relevant
          OS permission. We do not record continuous location history.
        </li>
        <li>
          <strong>Presence data</strong> — your current check-in status (which
          venue you are at, when you arrived, when you checked out) and
          activity status (online / in-venue / away).
        </li>
        <li>
          <strong>Device &amp; technical data</strong> — IP address, device
          model, OS and version, app version, locale, time zone, push
          notification token, crash and diagnostic logs, network type.
        </li>
        <li>
          <strong>Usage data</strong> — events such as opening a screen,
          sending a wave, joining an activity, spending tokens. Used to
          operate features, prevent abuse and improve the Service.
        </li>
        <li>
          <strong>Cookies and similar technologies</strong> — on the website
          and Venue Owner Panel we use strictly necessary cookies (session,
          authentication, CSRF), and storage required for the app to work.
          See section 11.
        </li>
      </ul>
      <h3>2.3. Information from others</h3>
      <p>
        We may receive information from venues you check in to (e.g. that you
        scanned their QR code), and from users who interact with you (e.g.
        reports about your behaviour). If you sign in with a third-party
        identity provider, we receive the identifiers and basic profile data
        that you authorise that provider to share.
      </p>
      <h3>2.4. Special category data</h3>
      <p>
        We do not ask for special categories of personal data (such as data
        revealing race, political opinions, health, religious beliefs,
        biometric data for unique identification, or sexual orientation). If
        you choose to disclose such data in your profile or chats, you do so
        at your own risk and you give us your explicit consent (Art. 9(2)(a)
        GDPR / Art. 5 PDPL) to host that content for the purpose of providing
        the Service. We do not use facial recognition on your photos.
      </p>

      <h2>3. Why we use your data and the legal basis</h2>
      <p>We process your personal data for the following purposes:</p>
      <ul>
        <li>
          <strong>To provide the Service</strong> — create your account,
          authenticate you, show nearby venues, run check-ins, deliver
          messages, run activities, manage tokens, operate the Venue Owner
          Panel.
          <br />
          <em>
            Legal basis: performance of a contract (Art. 6(1)(b) GDPR;
            Art. 4(2) PDPL).
          </em>
        </li>
        <li>
          <strong>To process geolocation</strong> — verify check-ins inside
          venue geofences and show what is around you.
          <br />
          <em>
            Legal basis: your explicit OS-level consent (Art. 6(1)(a) GDPR;
            Art. 6 PDPL) and performance of a contract.
          </em>
        </li>
        <li>
          <strong>To keep the Service safe</strong> — detect, investigate and
          prevent abuse, fraud, harassment and security incidents; enforce
          our Terms; respond to reports; moderate content; ban repeat
          offenders.
          <br />
          <em>
            Legal basis: legitimate interests (Art. 6(1)(f) GDPR;
            Art. 4(7) PDPL) and legal obligations (Art. 6(1)(c) GDPR).
          </em>
        </li>
        <li>
          <strong>To support and communicate with you</strong> — answer your
          requests, send service emails (password resets, security alerts,
          policy changes), and send push notifications about events you opted
          into.
          <br />
          <em>Legal basis: contract and legitimate interests.</em>
        </li>
        <li>
          <strong>To process payments and prevent fraud</strong>.
          <br />
          <em>
            Legal basis: contract and legal obligations (UAE tax / accounting
            rules).
          </em>
        </li>
        <li>
          <strong>To analyse and improve the Service</strong> — measure
          feature usage, debug issues, build aggregated statistics. We
          aggregate or pseudonymise data wherever possible.
          <br />
          <em>Legal basis: legitimate interests.</em>
        </li>
        <li>
          <strong>To comply with the law</strong> — respond to lawful
          requests from competent authorities, retain records required by
          tax or anti-money-laundering rules.
          <br />
          <em>Legal basis: legal obligations (Art. 6(1)(c) GDPR).</em>
        </li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal data, and we do{' '}
        <strong>not</strong> use it to train third-party AI models.
      </p>

      <h2>4. How long we keep your data</h2>
      <ul>
        <li>
          <strong>Account &amp; profile</strong> — for the life of your
          account. After you delete your account, identifiable data is
          removed within 30 days, except where we must keep it to (a) resolve
          disputes (up to 3 years), (b) meet legal, tax or accounting
          obligations (up to the period required by law), or (c) prevent
          fraud and abuse on the Service.
        </li>
        <li>
          <strong>Check-in records</strong> — kept while you are checked in
          and archived for up to 12 months for analytics and abuse
          prevention.
        </li>
        <li>
          <strong>Chats</strong> — venue and direct chats automatically
          expire 24 hours after you check out of the venue, unless we are
          required to preserve a message in connection with a report or a
          legal obligation. After expiry, message content is deleted from
          our active databases.
        </li>
        <li>
          <strong>Reports &amp; moderation records</strong> — kept up to 24
          months to support repeat-offender enforcement.
        </li>
        <li>
          <strong>Technical logs</strong> — up to 12 months.
        </li>
        <li>
          <strong>Payment records</strong> — for the period required by
          applicable UAE tax law (typically up to 7 years under UAE Federal
          Decree-Law No. 47 of 2022 on Corporate Tax and the VAT
          regulations).
        </li>
      </ul>

      <h2>5. Who we share data with</h2>
      <p>
        We do not sell your personal data. We share it only with the
        following categories of recipients, under written contracts that
        require them to protect your data:
      </p>
      <ul>
        <li>
          <strong>Other users</strong> — your profile (nickname, age range,
          avatar, photos, bio, interests, social handles you chose to make
          public) is visible to other users who are checked in at the same
          venue, and to people you chat or match with.
        </li>
        <li>
          <strong>Venue Owners</strong> — venues you check in to receive
          aggregated and individual presence data (your nickname and avatar,
          arrival time) about guests in their venue, and contents of
          messages you send to general venue chat or activities.
        </li>
        <li>
          <strong>Cloud hosting and backend (Supabase / AWS / Vercel)</strong>{' '}
          — for storing data, running APIs and authentication. Data may be
          processed on servers located outside the United Arab Emirates,
          including in the European Economic Area and the United States.
        </li>
        <li>
          <strong>Payment processors</strong> — to process top-ups and
          subscriptions. Payment processors are PCI DSS Level 1 certified
          and we never receive full card data.
        </li>
        <li>
          <strong>Push notification providers</strong> (Apple Push
          Notification service, Firebase Cloud Messaging) — to deliver push
          notifications to your device.
        </li>
        <li>
          <strong>Email delivery providers</strong> — to send service emails
          (password recovery, account notifications).
        </li>
        <li>
          <strong>Crash and analytics providers</strong> — to receive
          aggregated, pseudonymised diagnostics about app stability and
          feature usage.
        </li>
        <li>
          <strong>Legal &amp; safety</strong> — competent state authorities
          where required by law, and our professional advisers (lawyers,
          accountants, auditors), bound by confidentiality.
        </li>
        <li>
          <strong>Successors</strong> — in case of merger, acquisition,
          reorganisation or sale of assets, your data may be transferred to
          the successor entity, subject to this Policy or a notice of
          changes.
        </li>
      </ul>

      <h2>6. International data transfers</h2>
      <p>
        Some of our service providers are located outside the United Arab
        Emirates or your country of residence. Where your data is
        transferred to a country that does not provide an equivalent level
        of protection, we rely on appropriate safeguards such as the
        European Commission&apos;s Standard Contractual Clauses, the UAE
        Data Office model clauses (where issued), and additional technical
        measures (encryption in transit and at rest). By using the Service
        you consent to such transfers, to the extent permitted by
        applicable law.
      </p>

      <h2>7. How we protect your data</h2>
      <p>We use a combination of organisational and technical measures:</p>
      <ul>
        <li>TLS encryption for data in transit;</li>
        <li>encryption at rest for backups and selected stores;</li>
        <li>strict access controls and least-privilege roles;</li>
        <li>row-level security in our database, scoped per user;</li>
        <li>rate-limiting and abuse detection;</li>
        <li>regular backups and incident-response procedures.</li>
      </ul>
      <p>
        No system can be fully secure. We will notify you and the relevant
        regulator of a personal-data breach where required by law.
      </p>

      <h2>8. Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>
          <strong>Access</strong> the personal data we hold about you;
        </li>
        <li>
          <strong>Rectify</strong> inaccurate or incomplete data;
        </li>
        <li>
          <strong>Erase</strong> your account and personal data (subject to
          retention requirements in section 4);
        </li>
        <li>
          <strong>Restrict</strong> or <strong>object to</strong> certain
          processing, including based on legitimate interests;
        </li>
        <li>
          <strong>Withdraw consent</strong> at any time, without affecting
          processing carried out before withdrawal;
        </li>
        <li>
          <strong>Data portability</strong> — receive a copy of data you
          provided to us in a structured, machine-readable format;
        </li>
        <li>
          <strong>Lodge a complaint</strong> with a competent supervisory
          authority — for example, the <strong>UAE Data Office</strong>{' '}
          (federal regulator under PDPL), or the supervisory authority in
          your EU/EEA member state.
        </li>
      </ul>
      <p>
        To exercise any right, write to{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> from the
        email registered to your account. We will respond within 30 days
        (extendable as permitted by applicable law). We may need to verify
        your identity before acting on a request. If you believe we have
        not handled your request properly, you can complain to your local
        supervisory authority.
      </p>

      <h2>9. California (CCPA / CPRA) privacy rights</h2>
      <p>
        If you are a California resident, you have additional rights to
        know, delete, correct and limit the use of certain sensitive
        personal information, and to opt out of any &quot;sharing&quot; of
        personal information for cross-context behavioural advertising. We{' '}
        <strong>do not sell or share</strong> your personal information for
        such advertising. To exercise your rights, contact us at{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. We will not
        discriminate against you for exercising these rights.
      </p>

      <h2>10. Children</h2>
      <p>
        The Service is not directed at children under 18. We do not
        knowingly collect personal data from children under 18 (or under 16
        in the EEA / UK). If you believe a minor has registered, please
        contact us at{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> and we will
        remove the account.
      </p>

      <h2>11. Cookies and storage</h2>
      <p>
        Our website and Venue Owner Panel use cookies and similar storage
        for authentication, security (CSRF protection, session integrity),
        language preference and theme preference. These are{' '}
        <strong>strictly necessary</strong> cookies and do not require
        consent under EU rules. We do not use third-party advertising
        cookies. The mobile app uses local storage on your device for
        authentication tokens and offline caches; clearing app data will
        sign you out.
      </p>

      <h2>12. Automated decision-making</h2>
      <p>
        We do not make decisions producing legal effects on you, or
        similarly significantly affecting you, based solely on automated
        processing. We do use automated tools for spam filtering, abuse
        detection and recommendations, but human review is available before
        we permanently disable an account.
      </p>

      <h2>13. Profiles, chats and messages — visibility</h2>
      <ul>
        <li>
          Your profile is visible only to people checked in at the same
          venue and to direct chat partners.
        </li>
        <li>
          Direct chats are visible only to participants. They auto-expire
          24 hours after you check out, unless preserved due to a report.
        </li>
        <li>
          General venue chat messages are visible to everyone checked in to
          that venue and to the Venue Owner.
        </li>
        <li>
          Reports you submit are visible to our moderation team and the
          Venue Owner of the relevant venue, but not to the reported user
          (we do not disclose the reporter&apos;s identity).
        </li>
      </ul>

      <h2>14. Mobile app permissions</h2>
      <p>
        The {COMPANY.brand} mobile app requests the following operating-system
        permissions. Each is requested only when the related feature is used,
        and you can revoke any of them at any time from your device settings.
      </p>
      <ul>
        <li>
          <strong>Location (precise &amp; approximate)</strong> — used while
          the app is open to show nearby venues on the map and to verify that
          you are inside a venue&apos;s geofence when you check in. We do not
          collect background location and we do not build a continuous
          location history.
        </li>
        <li>
          <strong>Camera</strong> — used solely to scan QR codes for venue
          check-in. We do not record photos or video and we do not access the
          microphone.
        </li>
        <li>
          <strong>Photos / media library</strong> — used only when you choose
          to set or replace your profile picture or upload an additional
          profile photo.
        </li>
        <li>
          <strong>Push notifications</strong> — used to deliver in-app event
          notifications you opted into (waves, mutual interests, venue
          announcements). You can disable them in OS settings without
          affecting other features.
        </li>
      </ul>
      <p>
        We <strong>do not</strong> request permissions for the microphone,
        contacts, calendar, body sensors, SMS, call logs, accounts beyond
        sign-in, advertising ID, or files outside what you explicitly upload.
      </p>

      <h2>15. Account deletion (Google Play / Apple App Store)</h2>
      <p>
        You can delete your account and the personal data we hold about you
        at any time:
      </p>
      <ul>
        <li>
          <strong>Inside the app</strong> — open <em>Profile → Settings →
          Delete account</em> and confirm. Your profile is anonymised
          immediately and the residual data is purged within 30 days.
        </li>
        <li>
          <strong>From the web</strong>, including without signing in — visit{' '}
          <a href="/delete-account">{COMPANY.url}/delete-account</a> for the
          full instructions and contact route.
        </li>
      </ul>
      <p>
        We comply with the Google Play User Data policy (account deletion
        from Apr 2024) and the Apple App Store guideline 5.1.1(v) (in-app
        account deletion since Jun 2022).
      </p>

      <h2>16. Tracking and advertising</h2>
      <p>
        We <strong>do not track you</strong> across other companies&apos; apps
        and websites. We do not use third-party advertising SDKs, we do not
        share data with advertising networks, and we do not use your data
        for behavioural advertising. The advertising identifier (Apple IDFA /
        Android Advertising ID) is not collected. Under Apple App Tracking
        Transparency we declare &quot;Data Not Linked to You: None&quot; and
        &quot;Data Used to Track You: None&quot;.
      </p>

      <h2>17. Changes to this Policy</h2>
      <p>
        We may update this Policy from time to time. The current version
        and effective date are shown at the top of the page. Material
        changes will be notified to you via in-product notice or email at
        least 14 days before they take effect. Continued use of the Service
        after the effective date constitutes acceptance of the updated
        Policy.
      </p>

      <h2>18. Contact</h2>
      <p>
        Questions, requests and complaints regarding this Policy or your
        personal data:
      </p>
      <p>
        <strong>{COMPANY.legalNameFull}</strong>
        <br />
        {COMPANY.address}
        <br />
        Commercial Licence No.: {COMPANY.licenseNumber} (
        {COMPANY.licenseAuthority})
        <br />
        UAE TRN: {COMPANY.taxNumber}
        <br />
        D-U-N-S: {COMPANY.dunsNumber}
        <br />
        Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
      </p>
    </>
  );
}
