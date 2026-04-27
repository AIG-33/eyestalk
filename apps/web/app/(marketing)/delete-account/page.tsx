import type { Metadata } from 'next';
import { COMPANY } from '@/components/site/company-info';
import { LegalPage, resolveLang } from '@/components/site/legal-page';
import { DeleteAccountEN } from './content-en';
import { DeleteAccountRU } from './content-ru';

export const metadata: Metadata = {
  title: 'Delete your account — EyesTalk',
  description: `How to permanently delete your ${COMPANY.brand} account and the associated personal data.`,
  robots: { index: true, follow: true },
};

export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang = resolveLang(sp.lang ?? 'en');

  return (
    <LegalPage
      title={lang === 'ru' ? 'Удаление аккаунта' : 'Delete your account'}
      meta={
        lang === 'ru'
          ? 'Право на удаление · UAE PDPL ст. 7 · GDPR ст. 17'
          : 'Right to erasure · UAE PDPL Art. 7 · GDPR Art. 17'
      }
      lang={lang}
      basePath="/delete-account"
      defaultLang="en"
    >
      {lang === 'ru' ? <DeleteAccountRU /> : <DeleteAccountEN />}
    </LegalPage>
  );
}
