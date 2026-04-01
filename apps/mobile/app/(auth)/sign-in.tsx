import { useState } from 'react';
import { View, Text, Image, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors, typography, spacing, shadows } from '@/theme';

export default function SignInScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    else router.replace('/(app)/map');
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Ambient glow */}
      <LinearGradient
        colors={['rgba(124,111,247,0.12)', 'transparent']}
        style={styles.ambientGlow}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/logo-purple.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>EyesTalk</Text>
          <Text style={styles.tagline}>{t('auth.signInSubtitle')}</Text>
          <Text style={styles.hint}>{t('auth.signInHint')}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

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

          <Button
            title={t('auth.signIn')}
            onPress={handleSignIn}
            loading={loading}
            disabled={!email || !password}
          />
        </View>

        {/* Footer */}
        <TouchableOpacity
          style={styles.footer}
          onPress={() => router.push('/(auth)/sign-up')}
        >
          <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  ambientGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 300,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: typography.size.displayXl,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.display,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: typography.size.bodyMd,
    color: colors.text.secondary,
  },
  hint: {
    fontSize: typography.size.bodySm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: typography.size.bodySm * 1.5,
    paddingHorizontal: spacing['3xl'],
  },
  form: {
    gap: spacing.xs,
  },
  errorBanner: {
    backgroundColor: 'rgba(255,71,87,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.3)',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.accent.error,
    fontSize: typography.size.bodySm,
    textAlign: 'center',
  },
  footer: {
    marginTop: spacing['3xl'],
    alignItems: 'center',
  },
  footerText: {
    color: colors.accent.primaryLight,
    fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.medium,
  },
});
