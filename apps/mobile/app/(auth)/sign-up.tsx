import { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { signInWithProvider, isAppleSignInAvailable } from '@/lib/oauth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogoMark } from '@/components/ui/logo-mark';
import { colors, typography, spacing, radius } from '@/theme';

type Mode = 'choose' | 'email';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) setError(err.message);
    else router.replace('/(auth)/create-profile');
    setLoading(false);
  };

  const handleProvider = async (provider: 'apple' | 'google') => {
    setOauthLoading(provider);
    setError('');
    try {
      const { session, cancelled } = await signInWithProvider(provider);
      if (cancelled) return;
      if (session) router.replace('/(auth)/create-profile');
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('auth.oauthError');
      setError(msg);
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Pink-to-purple ambient glow — sign-up gets the match gradient hint */}
      <LinearGradient
        colors={['rgba(255,107,157,0.18)', 'rgba(124,111,247,0.10)', 'transparent']}
        style={styles.ambientGlow}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <LogoMark size={84} />
            <Text style={styles.heroLine}>{t('auth.createAccount')}</Text>
            <Text style={styles.tagline}>{t('auth.signUpHint')}</Text>
          </View>

          <View style={styles.flex} />

          {/* Auth panel */}
          <View style={styles.panel}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {mode === 'choose' ? (
              <>
                {isAppleSignInAvailable && (
                  <SocialButton
                    icon="logo-apple"
                    label={t('auth.continueWithApple')}
                    loading={oauthLoading === 'apple'}
                    disabled={oauthLoading !== null}
                    onPress={() => handleProvider('apple')}
                  />
                )}
                <SocialButton
                  icon="logo-google"
                  label={t('auth.continueWithGoogle')}
                  loading={oauthLoading === 'google'}
                  disabled={oauthLoading !== null}
                  onPress={() => handleProvider('google')}
                />

                <Button
                  title={t('auth.signUpWithEmail')}
                  onPress={() => setMode('email')}
                />

                <Text style={styles.legal}>
                  {t('auth.agreementPrefix')}{' '}
                  <Text style={styles.legalLink}>{t('auth.terms')}</Text>
                  {' · '}
                  <Text style={styles.legalLink}>{t('auth.privacy')}</Text>
                </Text>

                <TouchableOpacity
                  style={styles.footer}
                  onPress={() => router.push('/(auth)/sign-in')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerText}>{t('auth.hasAccount')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Input
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <Input
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <Input
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                <Button
                  title={t('auth.signUp')}
                  onPress={handleSignUp}
                  loading={loading}
                  disabled={!email || !password || !confirmPassword}
                />

                <TouchableOpacity
                  style={styles.footer}
                  onPress={() => setMode('choose')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerText}>{t('auth.useAnotherMethod')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

interface SocialButtonProps {
  icon: 'logo-apple' | 'logo-google';
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function SocialButton({ icon, label, loading, disabled, onPress }: SocialButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.socialBtn,
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : (
        <>
          <Ionicons name={icon} size={20} color={colors.text.primary} />
          <Text style={styles.socialBtnText}>{label}</Text>
          <View style={styles.socialIconSpacer} />
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  flex: { flex: 1 },
  ambientGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 320,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl + spacing.sm,
    paddingTop: 110,
    paddingBottom: spacing['3xl'],
  },
  hero: {
    alignItems: 'flex-start',
    marginBottom: spacing['3xl'],
  },
  heroLine: {
    fontSize: typography.size.displayXl,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.display,
    lineHeight: typography.size.displayXl * 1.05,
    marginTop: spacing.lg,
  },
  tagline: {
    fontSize: typography.size.bodyLg,
    color: colors.text.secondary,
    lineHeight: typography.size.bodyLg * 1.5,
    marginTop: spacing.lg,
    maxWidth: 320,
  },
  panel: {
    gap: spacing.sm,
  },
  socialBtn: {
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    backgroundColor: colors.glass.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  socialBtnText: {
    color: colors.text.primary,
    fontSize: typography.size.headingSm,
    fontWeight: typography.weight.semibold,
  },
  socialIconSpacer: { width: 20 },
  legal: {
    marginTop: spacing.md,
    color: colors.text.tertiary,
    fontSize: typography.size.bodySm,
    textAlign: 'center',
    lineHeight: typography.size.bodySm * 1.5,
  },
  legalLink: {
    color: colors.accent.primaryLight,
    fontWeight: typography.weight.medium,
  },
  errorBanner: {
    backgroundColor: 'rgba(255,71,87,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.30)',
    borderRadius: 14,
    padding: spacing.md,
  },
  errorText: {
    color: colors.accent.error,
    fontSize: typography.size.bodySm,
    textAlign: 'center',
  },
  footer: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  footerText: {
    color: colors.accent.primaryLight,
    fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.medium,
  },
});
