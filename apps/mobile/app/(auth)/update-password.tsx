import { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogoMark } from '@/components/ui/logo-mark';
import { useAuthStore } from '@/stores/auth.store';
import { colors, typography, spacing } from '@/theme';

export default function UpdatePasswordScreen() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const setRecovering = useAuthStore((s) => s.setRecovering);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!session) {
      setError(t('auth.recoverySessionMissing'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setRecovering(false);
    await supabase.auth.signOut();
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(124,111,247,0.20)', 'transparent']}
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
          <View style={styles.hero}>
            <LogoMark size={72} />
            <Text style={styles.title}>
              {done ? t('auth.passwordUpdated') : t('auth.newPasswordTitle')}
            </Text>
            <Text style={styles.subtitle}>
              {done
                ? t('auth.passwordUpdatedHint')
                : t('auth.newPasswordSubtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!done && (
              <>
                <Input
                  placeholder={t('auth.newPasswordPlaceholder')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                />
                <Input
                  placeholder={t('auth.newPasswordConfirmPlaceholder')}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  autoComplete="new-password"
                />
                <Button
                  title={t('auth.updatePassword')}
                  onPress={submit}
                  loading={loading}
                  disabled={!password || !confirm}
                />
              </>
            )}

            {done && (
              <Button
                title={t('auth.signIn')}
                onPress={() => router.replace('/(auth)/sign-in')}
              />
            )}

            {!done && (
              <TouchableOpacity
                style={styles.footer}
                onPress={() => {
                  setRecovering(false);
                  void supabase.auth.signOut();
                  router.replace('/(auth)/sign-in');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.footerText}>{t('auth.backToSignIn')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  flex: { flex: 1 },
  ambientGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 300,
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
  title: {
    fontSize: typography.size.displayLg,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.display,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: typography.size.bodyLg,
    color: colors.text.secondary,
    lineHeight: typography.size.bodyLg * 1.5,
    marginTop: spacing.md,
    maxWidth: 360,
  },
  form: { gap: spacing.sm },
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
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  footerText: {
    color: colors.accent.primaryLight,
    fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.medium,
  },
});
