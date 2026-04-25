'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
    setTimeout(() => router.push('/dashboard'), 1500);
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
            {done ? t('passwordUpdated') : t('newPasswordTitle')}
          </h1>
          {!done && (
            <p
              className="mt-2 text-center"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('newPasswordSubtitle')}
            </p>
          )}
        </div>

        {hasSession === false && !done && (
          <div
            className="rounded-xl p-4 text-sm text-center mb-4"
            style={{
              backgroundColor: 'rgba(255,71,87,0.1)',
              border: '1px solid rgba(255,71,87,0.3)',
              color: 'var(--accent-error)',
            }}
          >
            {t('recoverySessionMissing')}
          </div>
        )}

        {!done && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t('newPassword')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ height: 52 }}
                required
                autoFocus
                autoComplete="new-password"
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t('confirmNewPassword')}
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-field"
                style={{ height: 52 }}
                required
                autoComplete="new-password"
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
              disabled={loading || !password || !confirm || hasSession === false}
              className="w-full font-bold py-4 rounded-2xl text-white transition-all disabled:opacity-40 glow-primary"
              style={{
                background: 'linear-gradient(135deg, #7C6FF7, #A29BFE)',
                fontSize: 16,
              }}
            >
              {loading ? '...' : t('updatePassword')}
            </button>
          </form>
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
