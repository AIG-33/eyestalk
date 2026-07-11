'use client';

import { useCallback } from 'react';

/**
 * Tries to open the native app via the custom scheme. If the app is installed
 * the OS switches to it before the fallback timer fires; otherwise we send the
 * user to the right store for their platform.
 */
export function OpenInAppButton({
  venueId,
  appStoreUrl,
  playStoreUrl,
  label,
}: {
  venueId: string;
  appStoreUrl: string;
  playStoreUrl: string;
  label: string;
}) {
  const handleOpen = useCallback(() => {
    const deepLink = `eyestalk://venue/${venueId}?invite=1`;
    const ua =
      typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const storeUrl = isIOS ? appStoreUrl : isAndroid ? playStoreUrl : null;

    const start = Date.now();
    const timer = window.setTimeout(() => {
      // If we are still here after the deep-link attempt, the app is likely
      // not installed — send mobile users to the store.
      if (storeUrl && Date.now() - start < 2000) {
        window.location.href = storeUrl;
      }
    }, 1200);

    const clear = () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', clear);
    };
    document.addEventListener('visibilitychange', clear);

    window.location.href = deepLink;
  }, [venueId, appStoreUrl, playStoreUrl]);

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="inline-flex h-14 items-center justify-center rounded-2xl px-7 text-base font-bold text-white glow-primary transition-opacity hover:opacity-95"
      style={{
        background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)',
        minWidth: 240,
      }}
    >
      {label}
    </button>
  );
}
