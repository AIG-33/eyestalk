import { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity,
  ScrollView, Linking, Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogoMark } from '@/components/ui/logo-mark';
import { colors, typography, spacing } from '@/theme';

const RESEND_COOLDOWN_S = 30;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_S);
    const id = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(id); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const sendLink = async () => {
    setLoading(true);
    setError('');
    const redirectTo = ExpoLinking.createURL('reset-password');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSentTo(email);
    startCooldown();
  };

  const openMail = async () => {
    try {
      const url = Platform.OS === 'ios' ? 'message://' : 'mailto:';
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('mailto:');
      }
    } catch {
      Alert.alert(t('auth.openMailApp'), '');
    }
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
              {sentTo ? t('auth.resetEmailSent') : t('auth.forgotTitle')}
            </Text>
            <Text style={styles.subtitle}>
              {sentTo
                ? t('auth.resetEmailSentHint', { email: sentTo })
                : t('auth.forgotSubtitle')}
            </Text>
            {!sentTo && (
              <Text style={styles.hint}>{t('auth.forgotHint')}</Text>
            )}
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!sentTo && (
              <>
                <Input
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <Button
                  title={t('auth.sendResetLink')}
                  onPress={sendLink}
                  loading={loading}
                  disabled={!email}
                />
              </>
            )}

            {sentTo && (
              <>
                <Button
                  title={t('auth.openMailApp')}
                  onPress={openMail}
                />
                <Button
                  title={
                    cooldown > 0
                      ? t('auth.resendInSeconds', { seconds: cooldown })
                      : t('auth.resend')
                  }
                  variant="ghost"
                  onPress={sendLink}
                  loading={loading}
                  disabled={cooldown > 0}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.footer}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.footerText}>{t('auth.backToSignIn')}</Text>
            </TouchableOpacity>
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
  hint: {
    fontSize: typography.size.bodySm,
    color: colors.text.tertiary,
    lineHeight: typography.size.bodySm * 1.5,
    marginTop: spacing.sm,
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
