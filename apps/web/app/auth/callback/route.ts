import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Supabase PKCE callback.
 * Used by `resetPasswordForEmail` (and any other email-link flows that pass
 * `redirectTo: <origin>/auth/callback?next=/...`).
 *
 * Exchanges the `code` query param for a session cookie, then forwards to `next`.
 * Falls back to /login if the exchange fails so the user can request another link.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
