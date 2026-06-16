import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Wordmark } from '@/components/site/wordmark';

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(13,13,26,0.72)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center">
          <Wordmark fontSize={20} liveDot />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-5">
          <Link
            href="/#how"
            className="hidden text-sm font-medium transition-opacity hover:opacity-80 sm:inline-block"
            style={{ color: 'var(--text-secondary)' }}
          >
            How it works
          </Link>
          <Link
            href="/#features"
            className="hidden text-sm font-medium transition-opacity hover:opacity-80 sm:inline-block"
            style={{ color: 'var(--text-secondary)' }}
          >
            Features
          </Link>
          <Link
            href="/#venues"
            className="hidden text-sm font-medium transition-opacity hover:opacity-80 sm:inline-block"
            style={{ color: 'var(--text-secondary)' }}
          >
            For venues
          </Link>

          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-white glow-primary transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)',
              }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-white glow-primary transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)',
              }}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
