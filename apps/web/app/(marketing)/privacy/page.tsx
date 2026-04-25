import type { Metadata } from 'next';
import { COMPANY } from '@/components/site/company-info';
import { LegalPage, resolveLang } from '@/components/site/legal-page';
import { PrivacyEN } from './content-en';
import { PrivacyRU } from './content-ru';

export const metadata: Metadata = {
  title: 'Privacy Policy — EyesTalk',
  description: `How ${COMPANY.brand} collects, uses and protects your personal data.`,
};

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  // Privacy Policy default language — English (controlling version)
  const lang = resolveLang(sp.lang ?? 'en');

  return (
    <LegalPage
      title={lang === 'ru' ? 'Политика конфиденциальности' : 'Privacy Policy'}
      meta={
        lang === 'ru'
          ? `Версия ${COMPANY.privacyVersion} · Редакция от ${COMPANY.privacyEffectiveDateRu}`
          : `Version ${COMPANY.privacyVersion} · Effective ${COMPANY.privacyEffectiveDate}`
      }
      lang={lang}
      basePath="/privacy"
      defaultLang="en"
    >
      {lang === 'ru' ? <PrivacyRU /> : <PrivacyEN />}
    </LegalPage>
  );
}
