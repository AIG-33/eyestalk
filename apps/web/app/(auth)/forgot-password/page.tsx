'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/update-password`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setSentTo(email);
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'linear-gradient(135deg, #7C6FF7, #FF6B9D)' }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-12">
          <Image
            src="/logo.png"
            alt="EyesTalk"
            width={80}
            height={80}
            className="mb-6"
          />
          <h1
            className="text-4xl font-extrabold tracking-tight text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            {sentTo ? t('resetEmailSent') : t('forgotTitle')}
          </h1>
          <p
            className="mt-2 text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            {sentTo
              ? t('resetEmailSentHint', { email: sentTo })
              : t('forgotSubtitle')}
          </p>
        </div>

        {!sentTo ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
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
                autoFocus
              />
            </div>

            {error && (
              <div
                className="rounded-xl p-3 text-sm text-center"
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
              disabled={loading || !email}
              className="w-full font-bold py-4 rounded-2xl text-white transition-all disabled:opacity-40 glow-primary"
              style={{
                background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)',
                fontSize: 16,
              }}
            >
              {loading ? '...' : t('sendResetLink')}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setSentTo(null);
                setEmail('');
              }}
              className="w-full font-semibold py-3 rounded-2xl transition-all"
              style={{
                background: 'rgba(124,111,247,0.1)',
                color: 'var(--accent-primary-light)',
                fontSize: 14,
              }}
            >
              {t('sendResetLink')}
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="text-sm font-medium"
            style={{ color: 'var(--accent-primary-light)' }}
          >
            {t('backToSignIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
