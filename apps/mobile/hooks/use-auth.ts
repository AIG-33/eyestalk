import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';

const RECOVERY_PATH = 'reset-password';

/**
 * Try to extract the OAuth/PKCE `code` from a deep-link URL.
 * Supabase sends recovery links of the form:
 *   eyestalk://reset-password?code=...
 * We also tolerate an extra `auth/` segment for safety.
 */
function extractRecoveryCode(rawUrl: string): string | null {
  try {
    const parsed = Linking.parse(rawUrl);
    const path = (parsed.path ?? '').replace(/^\/+/, '');
    const isRecoveryPath =
      path === RECOVERY_PATH || path.endsWith(`/${RECOVERY_PATH}`);
    const code = parsed.queryParams?.code;
    if (!isRecoveryPath || typeof code !== 'string' || !code) return null;
    return code;
  } catch {
    return null;
  }
}

export function useAuthListener() {
  const setSession = useAuthStore((s) => s.setSession);
  const setRecovering = useAuthStore((s) => s.setRecovering);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (event === 'PASSWORD_RECOVERY') {
          setRecovering(true);
          router.replace('/(auth)/update-password');
        }
        if (event === 'SIGNED_OUT') {
          setRecovering(false);
        }
      },
    );

    const handleUrl = async (url: string | null) => {
      if (!url) return;
      const code = extractRecoveryCode(url);
      if (!code) return;
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        // Surface as recovery-missing on the update screen via flag reset
        setRecovering(false);
        return;
      }
      // Belt-and-suspenders: even if PASSWORD_RECOVERY didn't fire, route there.
      setRecovering(true);
      router.replace('/(auth)/update-password');
    };

    Linking.getInitialURL().then(handleUrl);
    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      linkingSub.remove();
    };
  }, [setSession, setRecovering]);
}
