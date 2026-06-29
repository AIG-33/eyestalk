import type { MetadataRoute } from 'next';
import { COMPANY } from '@/components/site/company-info';
import { PUBLIC_ROUTES } from '@/components/site/site-nav';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: path === '/' ? COMPANY.url : `${COMPANY.url}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
