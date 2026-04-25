'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (oauthError) {
      setError(oauthError.message || t('oauthError'));
      setGoogleLoading(false);
    }
    // On success Supabase redirects the browser → no extra navigation needed.
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'linear-gradient(135deg, #7C6FF7, #FF6B9D)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <Image
            src="/logo-mark.svg"
            alt="EyesTalk"
            width={84}
            height={84}
            priority
            className="mb-6"
            style={{ filter: 'drop-shadow(0 0 24px rgba(124,111,247,0.55))' }}
          />
          <h1 className="text-4xl font-extrabold tracking-tight"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.5px',
            }}
          >
            EyesTalk
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            {t('venueOwnerLogin')}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {t('venueOwnerHint')}
          </p>
        </div>

        {/* Social sign-in */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 font-semibold py-3.5 rounded-2xl transition-all disabled:opacity-50"
            style={{
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: 15,
              height: 56,
            }}
          >
            <GoogleIcon />
            <span>
              {googleLoading ? '...' : t('continueWithGoogle')}
            </span>
            <span style={{ width: 18 }} />
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {t('or')}
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              style={{ height: 52 }}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              style={{ height: 52 }}
              required
            />
          </div>

          {error && (
            <div className="rounded-xl p-3 text-sm text-center"
              style={{
                backgroundColor: 'rgba(255,71,87,0.1)',
                border: '1px solid rgba(255,71,87,0.3)',
                color: 'var(--accent-error)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold py-4 rounded-2xl text-white transition-all disabled:opacity-40 glow-primary"
            style={{
              background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)',
              fontSize: 16,
            }}
          >
            {loading ? '...' : t('signIn')}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/forgot-password"
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('forgotPassword')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.806.54-1.8368.8595-3.0477.8595-2.344 0-4.3282-1.5832-5.0364-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
      <path d="M3.9636 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.9636 10.71z" fill="#FBBC05"/>
      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.3459l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.9636 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z" fill="#EA4335"/>
    </svg>
  );
}
