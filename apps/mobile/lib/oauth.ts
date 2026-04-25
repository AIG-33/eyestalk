/**
 * Social sign-in helpers for EyesTalk.
 *
 * Strategy:
 *  - **Apple on iOS** uses the native `expo-apple-authentication` flow → we
 *    receive an identity token and exchange it via `signInWithIdToken`.
 *    This satisfies App Store guideline 4.8 (must offer native Sign in
 *    with Apple when other social providers are present).
 *  - **Apple on Android / web** and **Google everywhere** use the standard
 *    Supabase web OAuth flow, opened in a system auth session via
 *    `expo-web-browser`. Supabase is configured with `flowType: 'pkce'`,
 *    so we exchange the returned `code` for a session.
 *
 * Required Supabase Dashboard setup (one-off, not in code):
 *  - Authentication → Providers → Apple: enable, set Services ID, key + team.
 *  - Authentication → Providers → Google: enable, set OAuth client ID/secret.
 *  - Add redirect URL `eyestalk://auth/callback` to the allow-list.
 */

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'apple' | 'google';

export interface OAuthResult {
  session: Session | null;
  cancelled: boolean;
}

const REDIRECT_PATH = 'auth/callback';

function getRedirectUrl(): string {
  // `eyestalk://auth/callback` on native, https://… on web fallback.
  return Linking.createURL(REDIRECT_PATH);
}

export async function signInWithProvider(
  provider: OAuthProvider,
): Promise<OAuthResult> {
  if (provider === 'apple' && Platform.OS === 'ios') {
    return signInWithAppleNative();
  }
  return signInWithBrowser(provider);
}

/** Native Sign in with Apple (iOS only). */
async function signInWithAppleNative(): Promise<OAuthResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple did not return an identity token.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;
    return { session: data.session, cancelled: false };
  } catch (e: unknown) {
    if (
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as { code: string }).code === 'ERR_REQUEST_CANCELED'
    ) {
      return { session: null, cancelled: true };
    }
    throw e;
  }
}

/** Browser-based OAuth via Supabase + WebBrowser auth session. */
async function signInWithBrowser(provider: OAuthProvider): Promise<OAuthResult> {
  const redirectTo = getRedirectUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    throw error ?? new Error('Supabase did not return an authorize URL.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success' || !result.url) {
    return { session: null, cancelled: true };
  }

  const { params, errorCode } = parseRedirectUrl(result.url);
  if (errorCode) {
    throw new Error(errorCode);
  }

  // PKCE flow → exchange `code` for a session.
  if (params.code) {
    const { data: exchange, error: xErr } =
      await supabase.auth.exchangeCodeForSession(params.code);
    if (xErr) throw xErr;
    return { session: exchange.session, cancelled: false };
  }

  // Implicit flow (fallback) → tokens are in the URL fragment.
  if (params.access_token && params.refresh_token) {
    const { data: setData, error: setErr } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (setErr) throw setErr;
    return { session: setData.session, cancelled: false };
  }

  return { session: null, cancelled: true };
}

interface ParsedRedirect {
  params: Record<string, string>;
  errorCode?: string;
}

function parseRedirectUrl(rawUrl: string): ParsedRedirect {
  const parsed = Linking.parse(rawUrl);
  // Tokens may live in the query string (PKCE) or the fragment (implicit).
  const queryParams = (parsed.queryParams ?? {}) as Record<string, string>;
  let fragmentParams: Record<string, string> = {};

  const hashIndex = rawUrl.indexOf('#');
  if (hashIndex !== -1) {
    const hash = rawUrl.slice(hashIndex + 1);
    fragmentParams = Object.fromEntries(new URLSearchParams(hash));
  }

  const params = { ...queryParams, ...fragmentParams };
  return {
    params,
    errorCode: params.error_description || params.error,
  };
}

/** Useful for the UI: hide Apple button on Android (Google-only flow). */
export const isAppleSignInAvailable = Platform.OS === 'ios';
