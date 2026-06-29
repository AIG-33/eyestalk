import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { HEADER_NAV } from '@/components/site/site-nav';
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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex shrink-0 items-center">
          <Wordmark fontSize={20} liveDot />
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex xl:gap-2"
          aria-label="Main navigation"
        >
          {HEADER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium transition-opacity hover:opacity-80 xl:px-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav
            className="flex items-center gap-2 lg:hidden"
            aria-label="Quick navigation"
          >
            <Link
              href="/services"
              className="hidden text-sm font-medium transition-opacity hover:opacity-80 sm:inline-block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Services
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              Contact
            </Link>
          </nav>

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
        </div>
      </div>
    </header>
  );
}
