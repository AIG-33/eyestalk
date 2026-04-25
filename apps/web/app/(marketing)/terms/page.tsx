import type { Metadata } from 'next';
import { COMPANY } from '@/components/site/company-info';
import { LegalPage, resolveLang } from '@/components/site/legal-page';
import { TermsEN } from './content-en';
import { TermsRU } from './content-ru';

export const metadata: Metadata = {
  title: 'Terms of Service — EyesTalk',
  description: `The legal agreement between you and ${COMPANY.brand} for using the Service.`,
};

export default async function TermsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  // Terms of Service default language — English (controlling version)
  const lang = resolveLang(sp.lang ?? 'en');

  return (
    <LegalPage
      title={lang === 'ru' ? 'Условия использования' : 'Terms of Service'}
      meta={
        lang === 'ru'
          ? `Версия ${COMPANY.termsVersion} · Редакция от ${COMPANY.termsEffectiveDateRu}`
          : `Version ${COMPANY.termsVersion} · Effective ${COMPANY.termsEffectiveDate}`
      }
      lang={lang}
      basePath="/terms"
      defaultLang="en"
    >
      {lang === 'ru' ? <TermsRU /> : <TermsEN />}
    </LegalPage>
  );
}
