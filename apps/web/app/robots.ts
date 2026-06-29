import type { MetadataRoute } from 'next';
import { COMPANY } from '@/components/site/company-info';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/login',
        '/forgot-password',
        '/update-password',
        '/auth/',
        '/api/',
      ],
    },
    sitemap: `${COMPANY.url}/sitemap.xml`,
  };
}
