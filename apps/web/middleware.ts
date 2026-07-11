import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Canonical host redirect: apex (eyestalk.app) -> www.eyestalk.app.
  // The `matcher` below excludes /.well-known/*, so the Universal / App Links
  // association files are served directly on the apex domain (200, no redirect),
  // while every other page keeps a single canonical www URL for SEO.
  const host = request.headers.get('host');
  if (host === 'eyestalk.app') {
    const redirectUrl = `https://www.eyestalk.app${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(redirectUrl, 308);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
