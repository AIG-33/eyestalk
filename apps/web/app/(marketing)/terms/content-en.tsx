import { COMPANY } from '@/components/site/company-info';

export function TermsEN() {
  return (
    <>
      <p className="lead">
        These Terms of Service (the &quot;<strong>Terms</strong>&quot;) form a
        binding agreement between you (&quot;<strong>you</strong>&quot;,
        &quot;<strong>User</strong>&quot;) and{' '}
        <strong>{COMPANY.legalNameFull}</strong>, a Free Zone Company
        licensed by the {COMPANY.licenseAuthority} under commercial licence
        No. {COMPANY.licenseNumber} (UAE TRN {COMPANY.taxNumber}), the
        operator of {COMPANY.brand} (&quot;<strong>{COMPANY.brand}</strong>
        &quot;, &quot;<strong>we</strong>&quot;, &quot;<strong>us</strong>
        &quot;, &quot;<strong>our</strong>&quot;), governing your access to
        and use of the {COMPANY.brand} mobile applications, the website at{' '}
        <a href={COMPANY.url}>{COMPANY.url}</a>, the Venue Owner Panel, APIs,
        and any related services (collectively, the &quot;
        <strong>Service</strong>&quot;).
      </p>
      <p>
        <strong>
          Please read these Terms carefully. By creating an account,
          accessing, or using the Service you confirm that you have read,
          understood and agree to be bound by these Terms and by our{' '}
          <a href="/privacy">Privacy Policy</a>. If you do not agree, you
          must not use the Service.
        </strong>
      </p>

      <h2>1. Eligibility</h2>
      <p>
        1.1. You must be at least <strong>18 years old</strong> (or the age
        of majority in your jurisdiction, whichever is higher) and have
        full legal capacity to enter into a binding contract to use the
        Service. The Service is not directed at children, and we do not
        knowingly collect data from them. See our{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>
      <p>
        1.2. You may not use the Service if you are subject to economic
        sanctions administered by the United States, the European Union,
        the United Kingdom or any other applicable authority, or if
        applicable law prohibits you from receiving or using software or
        services originating from our operating entity.
      </p>
      <p>
        1.3. If you are using the Service on behalf of a venue or other
        organisation (including via the Venue Owner Panel), you represent
        and warrant that you are authorised to bind that organisation to
        these Terms.
      </p>

      <h2>2. The Service</h2>
      <p>
        2.1. {COMPANY.brand} is a <strong>real-time, location-based
        social application</strong> that helps people meet others who are
        physically present at the same venue (bars, clubs, lounges, karaoke
        rooms, bowling alleys, hookah lounges and similar). The Service
        offers, among other things:
      </p>
      <ul>
        <li>a live map of nearby venues and people checked in;</li>
        <li>
          check-in via QR code and / or geofence, with verification of
          physical presence;
        </li>
        <li>profile, photos, interests, social handles;</li>
        <li>
          waves, mutual matches, ephemeral chats (5-minute micro-chats and
          longer chats once matched);
        </li>
        <li>
          venue-side activities (polls, contests, tournaments, quests,
          auctions, announcements);
        </li>
        <li>
          a token economy used inside the Service for boosts, premium
          features and venue activities;
        </li>
        <li>
          a Venue Owner Panel for owners and staff to manage their venue,
          activities, services, loyalty, moderation and analytics.
        </li>
      </ul>
      <p>
        2.2. <strong>Honest presence is the product.</strong> You agree
        not to manipulate, spoof or falsify your geolocation, identity, or
        check-in status. The Service relies on accurate location data to
        function.
      </p>
      <p>
        2.3. <strong>Not a professional advisory service.</strong> The
        Service is provided for general social and recreational purposes.
        It is not a dating-safety, transportation, security or
        public-health service. Always exercise reasonable judgement and
        personal-safety precautions when meeting other people. We do not
        verify the identity, age, character or intentions of other Users.
      </p>
      <p>
        2.4. <strong>Third-party data.</strong> Some Service functionality
        depends on third-party providers (operating-system geolocation,
        push notification gateways, payment processors, hosting providers,
        map tile providers). The Service may be degraded or unavailable
        if a provider is interrupted or changes its terms.
      </p>

      <h2>3. Accounts &amp; Security</h2>
      <p>
        3.1. To use the Service you must register an account using a valid
        email address and a password, or via a supported third-party
        identity provider. You agree to provide accurate, current and
        complete information and to keep it up to date.
      </p>
      <p>
        3.2. You are responsible for safeguarding your credentials and
        for all activity that occurs under your account. Notify us
        immediately at <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>{' '}
        if you suspect unauthorised use.
      </p>
      <p>
        3.3. <strong>One person, one account.</strong> Sharing accounts,
        reselling access, impersonating other people, or operating
        multiple accounts to circumvent bans, quotas or trial limits is
        prohibited.
      </p>
      <p>
        3.4. <strong>Venue Owner accounts.</strong> Venue Owner accounts
        may only be used by the lawful operator of the venue or by an
        authorised representative. The Venue Owner is responsible for the
        conduct of any staff using their Venue Owner account.
      </p>

      <h2>4. Tokens, Subscriptions &amp; Billing</h2>
      <p>
        4.1. <strong>{COMPANY.brand} Tokens.</strong> &quot;Tokens&quot;
        are an internal, non-monetary unit of account used to pay for
        certain Service features (e.g., boosts, activities, premium
        features). Tokens have <strong>no cash value</strong>, are not
        legal tender, electronic money, securities or any other financial
        instrument, are non-transferable except as expressly permitted
        within the Service, and cannot be exchanged back for currency
        except as set out in section 5 (Refunds).
      </p>
      <p>
        4.2. <strong>Earning Tokens.</strong> You may receive Tokens for
        free (e.g., on registration, at check-ins, for completing
        activities) at our discretion. Token grants are promotional and
        may change at any time without notice.
      </p>
      <p>
        4.3. <strong>Token packs and subscriptions.</strong> You may
        purchase one-time Token packs or, where offered, recurring
        subscription plans that bundle Token allowances and additional
        features. Prices, plan composition and Token allowances are
        described on the pricing page and may change for future billing
        periods upon notice as described in section 13.
      </p>
      <p>
        4.4. <strong>Auto-renewal.</strong> Subscriptions automatically
        renew at the end of each billing period at the then-current price
        for that plan, until you cancel. You authorise us, through our
        payment processor, to charge your payment method on file for each
        renewal.
      </p>
      <p>
        4.5. <strong>Cancellation.</strong> You may cancel a subscription
        at any time from your account settings. Cancellation takes effect
        at the end of the current billing period; you retain access (and
        Tokens already granted) until that date. We do not provide
        pro-rated refunds for partial periods except where required by
        law or expressly stated in section 5.
      </p>
      <p>
        4.6. <strong>Failed payments.</strong> If a renewal payment
        fails, the subscription enters a grace period during which our
        payment processor retries the charge. If retries continue to
        fail, the subscription is cancelled and paid features (including
        the recurring Token grant) become unavailable.
      </p>
      <p>
        4.7. <strong>Payment processors.</strong> Payments are processed
        by our payment provider, which is PCI DSS Level 1 certified. We
        do not store full payment card numbers on our servers. By paying,
        you also agree to the payment provider&apos;s applicable terms.
      </p>
      <p>
        4.8. <strong>Taxes.</strong> Stated prices may exclude UAE value
        added tax (VAT), sales tax, withholding tax or similar duties,
        which our payment provider may collect and remit on our behalf
        where required by law. You are responsible for any taxes that
        apply to you personally.
      </p>
      <p>
        4.9. <strong>In-app purchases.</strong> Purchases made through
        Apple App Store or Google Play are subject to the additional
        terms of the relevant app store. Refunds for in-app purchases are
        handled by the app store in accordance with its policies.
      </p>
      <p>
        4.10. <strong>Token expiry.</strong> Tokens remain available
        while your account is in good standing. Upon termination or
        deletion of your account, all unused Tokens are forfeited without
        compensation, except where law requires otherwise.
      </p>

      <h2>5. Refunds &amp; Withdrawal</h2>
      <p>
        5.1. <strong>EU/EEA / UK consumers — right of withdrawal.</strong>{' '}
        If you are a consumer in the EU/EEA or the United Kingdom, you
        have a statutory right to withdraw from a contract for digital
        content or services within 14 days. By starting to use the
        Service (e.g., spending a Token, joining a paid activity,
        downloading premium content) you{' '}
        <strong>expressly request immediate performance</strong> and
        acknowledge that you <strong>lose your right of withdrawal</strong>{' '}
        for content already supplied. Until that point you may withdraw
        by emailing <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
      </p>
      <p>
        5.2. <strong>Token top-ups.</strong> Discretionary refunds for
        one-time Token purchases may be granted within 14 days of
        purchase provided that <strong>no Token from the purchased
        bundle has been spent</strong>.
      </p>
      <p>
        5.3. <strong>Subscriptions.</strong> Subscription fees are
        non-refundable except where required by law or where our Service
        has been materially unavailable for an extended period due to our
        fault.
      </p>
      <p>
        5.4. <strong>Activities and venue-side purchases are final.</strong>{' '}
        Tokens spent on activities, contests, auctions, services or
        bookings provided by Venue Owners are not refundable except where
        the Venue Owner cancels the activity or the law requires
        otherwise.
      </p>
      <p>
        5.5. To request a refund permitted by this section, email{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> from the
        address registered on your account, including the date of purchase
        and the amount. Approved refunds are returned to the original
        payment method within 10 business days of approval.
      </p>
      <p>
        5.6. <strong>Chargebacks.</strong> If you initiate a chargeback,
        dispute or reversal in respect of a payment that we believe in
        good faith was authorised, we may immediately suspend or
        terminate your account and forfeit any unused Tokens, in addition
        to any other remedy available at law.
      </p>

      <h2>6. User Content &amp; License to Us</h2>
      <p>
        6.1. <strong>Your content.</strong> &quot;<strong>User Content</strong>
        &quot; means any data you submit to or generate through the
        Service, including profile data, photos, messages, activity
        submissions, reports, venue listings (if you are a Venue Owner)
        and similar. As between you and us, you retain all rights you
        have in your User Content.
      </p>
      <p>
        6.2. <strong>License to us.</strong> You grant us a worldwide,
        non-exclusive, royalty-free, sublicensable license to host,
        store, reproduce, transmit, display, adapt and create derivative
        works of your User Content solely as necessary to operate,
        provide, secure, improve and promote the Service, including
        showing your profile and messages to the appropriate other Users
        and to Venue Owners as described in our Privacy Policy.
      </p>
      <p>
        6.3. <strong>Your representations.</strong> You represent and
        warrant that (a) you own or have all necessary rights in your
        User Content; (b) it does not infringe or violate the rights of
        any third party (including IP, privacy and data-protection
        rights); (c) it does not violate any law or regulation, or any
        of our rules in section 8; (d) any personal data of others is
        included only with that person&apos;s informed consent or another
        lawful basis; and (e) photos in your profile depict you and only
        you (or are clearly non-personal).
      </p>
      <p>
        6.4. <strong>Aggregated data.</strong> We may produce
        de-identified, aggregated statistics from User Content (e.g.,
        venue check-in patterns, activity participation trends) and use
        them for any purpose. Such aggregates do not identify you and are
        not your User Content.
      </p>

      <h2>7. Venues, Venue Owners and Activities</h2>
      <p>
        7.1. <strong>Venue Owners</strong> are independent businesses or
        their authorised representatives. {COMPANY.brand} acts as a
        technology platform between guests and Venue Owners. We are not a
        party to any contract for goods or services between a guest and a
        Venue Owner (e.g., reserving a table, booking a service, joining
        a paid activity).
      </p>
      <p>
        7.2. Venue Owners are responsible for the lawfulness of their
        venue listings, activities, announcements, services, prices and
        moderation decisions. Venue Owners undertake to comply with
        applicable consumer-protection, advertising, alcohol-licensing,
        gambling and similar laws in their jurisdiction.
      </p>
      <p>
        7.3. Activities (polls, contests, tournaments, quests, auctions,
        events) hosted by a Venue Owner must not constitute regulated
        gambling, lotteries or financial instruments. Venue Owners are
        solely responsible for compliance.
      </p>
      <p>
        7.4. We may, at our discretion and without liability, remove
        venues, activities or content, refund Tokens, suspend Users or
        Venue Owners, or otherwise intervene if a venue or activity is
        fraudulent, violates these Terms or applicable law, or is the
        subject of a credible complaint.
      </p>
      <p>
        7.5. <strong>No regulated activity.</strong> Tokens are not money,
        electronic money or securities; the Service is not a financial
        market, exchange, money-transmission service, or gambling
        operator (section 4.1).
      </p>

      <h2>8. Acceptable Use</h2>
      <p>You agree that you will not, and will not permit any third party to:</p>
      <ul>
        <li>use the Service for any unlawful purpose or in violation of these Terms;</li>
        <li>
          upload content that is illegal, defamatory, obscene, hateful,
          harassing, sexually explicit involving anyone other than the
          poster, infringing, that misappropriates trade secrets or that
          violates privacy;
        </li>
        <li>
          send unsolicited sexual content, sexually solicit minors,
          engage in commercial sex work, human trafficking, or any
          activity that exploits or endangers a child;
        </li>
        <li>
          impersonate any person or entity, including using photos that
          are not of you;
        </li>
        <li>
          spoof or falsify your geolocation, device identifiers or
          check-in status; create fake check-ins; abuse referral or
          reward mechanics;
        </li>
        <li>
          collect, scrape, harvest, mirror or otherwise extract data
          (including photos, profiles, messages or venue data) from the
          Service except via interfaces we expressly authorise;
        </li>
        <li>
          reverse-engineer, decompile, disassemble or attempt to derive
          source code, except to the extent applicable law forbids such
          restriction;
        </li>
        <li>
          circumvent, disable or interfere with security or rate-limiting
          features, attempt unauthorised access, or probe the Service
          for vulnerabilities without written permission;
        </li>
        <li>
          use the Service to train, fine-tune or evaluate any
          machine-learning model, or to build a competing product or
          dataset;
        </li>
        <li>
          send spam, unsolicited messages, recruit for multi-level
          marketing, or perform any form of network abuse;
        </li>
        <li>introduce malware, exploits or other harmful technology;</li>
        <li>
          resell, sublicense or commercially exploit access to the
          Service except as expressly permitted (e.g., the Venue Owner
          Panel for your own venue);
        </li>
        <li>
          use the Service to organise illegal gatherings, illegal sale of
          alcohol or controlled substances, or any unlawful activity at
          venues.
        </li>
      </ul>

      <h2>9. Reports, Moderation and Enforcement</h2>
      <p>
        9.1. We rely on a combination of automated tooling, User reports
        and human review to moderate content and behaviour. You agree
        that you may be banned, suspended, rate-limited, shadow-limited,
        have content removed or be required to verify your identity if
        we reasonably believe you have violated these Terms.
      </p>
      <p>
        9.2. <strong>Reports.</strong> You can report a User, message,
        venue or activity using in-product reporting. We do not disclose
        reporters&apos; identities to the reported party.
      </p>
      <p>
        9.3. <strong>Appeals.</strong> If you believe an enforcement
        action against you was wrong, you may appeal by emailing{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. We will
        review your appeal in good faith. We may decline to reinstate
        accounts that we reasonably believe pose a risk to other Users.
      </p>

      <h2>10. Intellectual Property</h2>
      <p>
        10.1. The Service, including all software, designs, trademarks,
        logos, algorithms, text, graphics and the arrangement thereof, is
        owned by us or our licensors and is protected by
        intellectual-property and other laws. Except for the limited
        rights expressly granted in these Terms, no rights are
        transferred to you.
      </p>
      <p>
        10.2. Subject to your continued compliance with these Terms, we
        grant you a limited, personal, non-exclusive, non-transferable,
        revocable license to access and use the Service for your
        personal, non-commercial purposes (and, for Venue Owners, for
        operating their venue through the Venue Owner Panel).
      </p>
      <p>
        10.3. <strong>Feedback.</strong> If you send us suggestions,
        ideas or feedback, you grant us a perpetual, irrevocable,
        worldwide, royalty-free license to use them for any purpose
        without obligation to you.
      </p>

      <h2>11. Copyright Complaints (DMCA / EU)</h2>
      <p>
        If you believe content on the Service infringes your copyright,
        send a notice to{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> including:
        (a) your physical or electronic signature; (b) identification of
        the copyrighted work; (c) identification of the allegedly
        infringing material and its location on the Service; (d) your
        contact information; (e) a statement that you have a good-faith
        belief that the use is not authorised by the rightsholder, its
        agent or the law; and (f) a statement, under penalty of perjury,
        that the information in the notice is accurate and that you are
        authorised to act on behalf of the rightsholder. We will respond
        to valid notices and may remove infringing material and terminate
        repeat infringers.
      </p>

      <h2>12. Privacy</h2>
      <p>
        Your use of the Service is also governed by our{' '}
        <a href="/privacy">Privacy Policy</a>, which describes how we
        collect, use and share personal data, your rights under
        applicable data-protection laws, and the processors we rely on.
      </p>

      <h2>13. Changes to the Service or these Terms</h2>
      <p>
        13.1. We may update, change or discontinue any part of the
        Service, including pricing, plan composition, Token costs,
        features and APIs, at any time, with reasonable notice where the
        change materially and adversely affects you.
      </p>
      <p>
        13.2. We may amend these Terms by posting an updated version at
        this URL and updating the &quot;Effective date&quot; above.
        Material changes will be notified to you via in-product notice or
        email at least 14 days before they take effect, except where a
        shorter period is required for legal or security reasons.
        Continued use of the Service after the effective date constitutes
        acceptance. If you do not agree to a change, you must stop using
        the Service and may cancel your subscription.
      </p>

      <h2>14. Suspension &amp; Termination</h2>
      <p>
        14.1. <strong>By you.</strong> You may stop using the Service and
        delete your account at any time from your account settings. Some
        data may be retained as described in the Privacy Policy.
      </p>
      <p>
        14.2. <strong>By us.</strong> We may suspend or terminate your
        access to all or part of the Service, with or without notice, if
        (a) you breach these Terms or any applicable law; (b) we believe
        your conduct creates legal, financial, security or reputational
        risk for {COMPANY.brand} or other Users; (c) a payment is
        reversed or disputed; or (d) we are required to do so by law or
        by a third-party provider on which the Service depends.
      </p>
      <p>
        14.3. <strong>Effect of termination.</strong> Upon termination,
        your right to use the Service ends immediately, your unused
        Tokens are forfeited (except where law requires otherwise), and
        any sections of these Terms that by their nature should survive
        (including sections 4–6, 10, 15–19) will survive.
      </p>

      <h2>15. Disclaimers</h2>
      <p>
        15.1. To the maximum extent permitted by applicable law, the
        Service and all content are provided <strong>&quot;AS IS&quot;</strong>{' '}
        and <strong>&quot;AS AVAILABLE&quot;</strong>, with all faults,
        and we <strong>expressly disclaim all warranties, express,
        implied, statutory or otherwise</strong>, including warranties of
        merchantability, fitness for a particular purpose, title,
        non-infringement, accuracy, security, uninterrupted or error-free
        operation, and any warranties arising from a course of dealing or
        usage of trade.
      </p>
      <p>
        15.2. <strong>Personal safety.</strong> The Service is not a
        background-check, identity-verification, security or
        public-safety service. We do not screen Users, do not verify
        identities or ages beyond the means available to us, and cannot
        predict the conduct of other Users. <strong>You are solely
        responsible for your interactions with other Users, both in the
        app and in person.</strong> Always exercise caution.
      </p>
      <p>
        15.3. <strong>Venues and third parties.</strong> We are not
        responsible for the conduct of Venue Owners, their staff or
        guests, the safety or quality of any venue, the accuracy of
        venue listings, or the availability of any service or product
        offered at a venue.
      </p>
      <p>
        15.4. Some jurisdictions do not allow the exclusion of certain
        warranties. To the extent such exclusions are not permitted, the
        disclaimers above apply to the maximum extent allowed by law and
        your statutory consumer rights are not affected.
      </p>

      <h2>16. Limitation of Liability</h2>
      <p>
        16.1. To the maximum extent permitted by applicable law, in no
        event will {COMPANY.brand}, its officers, directors, employees,
        affiliates, agents, suppliers or licensors be liable to you for
        any:
      </p>
      <ul>
        <li>indirect, incidental, special, consequential, exemplary or punitive damages;</li>
        <li>loss of profits, revenue, data, goodwill or business opportunities;</li>
        <li>
          personal injury, property damage or wrongful death arising
          from your use of the Service, your interaction with other
          Users (online or in person), or your visit to any venue;
        </li>
        <li>damages resulting from third-party content, Venue Owner content, or other Users&apos; conduct;</li>
        <li>
          damages resulting from unauthorised access to or alteration of
          your data, where caused by events outside our reasonable
          control;
        </li>
      </ul>
      <p>
        whether based on warranty, contract, tort (including negligence),
        strict liability or any other legal theory, and whether or not we
        have been advised of the possibility of such damages.
      </p>
      <p>
        16.2. <strong>Aggregate cap.</strong> Without limiting the
        foregoing, our total cumulative liability arising out of or
        relating to the Service or these Terms will not exceed the
        greater of (a) the amounts you paid to us for the Service in the{' '}
        <strong>three (3) months</strong> preceding the event giving rise
        to liability, or (b) USD 50.
      </p>
      <p>
        16.3. The limitations and exclusions in this section do not
        limit liability that cannot be limited under applicable law (such
        as, in some jurisdictions, liability for fraud, gross negligence
        or wilful misconduct, or for death or personal injury caused by
        negligence). If any limitation is held unenforceable, the
        remaining limitations remain in full force.
      </p>

      <h2>17. Governing Law &amp; Disputes</h2>
      <p>
        17.1. <strong>Informal resolution.</strong> Before bringing any
        formal claim, you agree to first contact us at{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> with a
        written description of your claim and to negotiate in good faith
        for at least <strong>30 days</strong>.
      </p>
      <p>
        17.2. <strong>Governing law.</strong> These Terms and any dispute
        arising out of or relating to them or to the Service will be
        governed by the laws of the {COMPANY.governingLaw}, excluding
        its conflict-of-laws rules and the UN Convention on Contracts
        for the International Sale of Goods.
      </p>
      <p>
        17.3. <strong>Venue.</strong> Subject to mandatory
        consumer-protection law that grants you the right to bring
        proceedings in your country of residence, the competent courts
        of {COMPANY.governingLawCourtsCity}, {COMPANY.governingLaw} will
        have exclusive jurisdiction over any dispute that is not subject
        to alternative dispute resolution.
      </p>
      <p>
        17.4. <strong>EU consumers.</strong> Nothing in this section
        deprives you of the protection of mandatory provisions of the
        law of your country of habitual residence. EU consumers may also
        use the European Commission&apos;s ODR platform at{' '}
        <a href="https://ec.europa.eu/consumers/odr">
          https://ec.europa.eu/consumers/odr
        </a>
        .
      </p>

      <h2>18. Operating Entity &amp; Notices</h2>
      <p>
        The Service is operated by{' '}
        <strong>{COMPANY.legalNameFull}</strong>, a Free Zone Company
        licensed by the {COMPANY.licenseAuthority} (commercial licence
        No. {COMPANY.licenseNumber}, UAE TRN {COMPANY.taxNumber}, D-U-N-S{' '}
        {COMPANY.dunsNumber}), with registered address at{' '}
        {COMPANY.address}. Legal notices to us must be sent to{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. Notices
        sent to you will be delivered to the email address on your
        account or posted in-product; such notices are deemed received on
        the day they are sent.
      </p>

      <h2>19. General</h2>
      <p>
        19.1. <strong>Entire agreement.</strong> These Terms, together
        with the Privacy Policy and any in-product terms presented at
        the time of use, are the entire agreement between you and us
        regarding the Service and supersede any prior agreements.
      </p>
      <p>
        19.2. <strong>Severability.</strong> If any provision is held
        unenforceable, that provision will be modified to the minimum
        extent necessary or severed, and the remaining provisions will
        remain in full force.
      </p>
      <p>
        19.3. <strong>No waiver.</strong> Our failure to enforce any
        right or provision is not a waiver of that right or provision.
      </p>
      <p>
        19.4. <strong>Assignment.</strong> You may not assign or
        transfer your rights or obligations under these Terms without
        our prior written consent. We may assign these Terms in
        connection with a merger, acquisition, reorganisation or sale of
        assets.
      </p>
      <p>
        19.5. <strong>Force majeure.</strong> We are not liable for any
        failure or delay caused by events beyond our reasonable control,
        including natural disasters, epidemics, war, civil unrest,
        strikes, internet or power outages, denial-of-service attacks,
        or acts of government.
      </p>
      <p>
        19.6. <strong>No third-party beneficiaries.</strong> These Terms
        do not create any third-party beneficiary rights.
      </p>
      <p>
        19.7. <strong>Language.</strong> The English-language version of
        these Terms is the controlling version. Translations are
        provided for convenience only.
      </p>

      <h2>20. Contact</h2>
      <p>Questions about these Terms can be sent to:</p>
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
        <br />
        Web: <a href={COMPANY.url}>{COMPANY.url}</a>
      </p>
    </>
  );
}
