'use client';

import { useState } from 'react';
import Image from 'next/image';
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
            src="/logo.png"
            alt="EyesTalk"
            width={80}
            height={80}
            className="mb-6"
          />
          <h1 className="text-4xl font-extrabold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
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
        </form>
      </div>
    </div>
  );
}
