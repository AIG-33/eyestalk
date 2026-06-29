import type { Metadata } from 'next';

/** Build a unique document title using the root layout template (`%s · EyesTalk`). */
export function pageTitle(title: string, description?: string): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
  };
}

/** Dashboard pages should not be indexed. */
export const DASHBOARD_ROBOTS: Metadata['robots'] = {
  index: false,
  follow: false,
};
