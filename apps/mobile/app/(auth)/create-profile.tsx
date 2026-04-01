import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { AGE_RANGES, INTEREST_OPTIONS, MAX_INTERESTS } from '@eyestalk/shared/constants';
import { colors, typography, spacing, shadows, radius } from '@/theme';

export default function CreateProfileScreen() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const totalSteps = 3;
  const progress = (step + 1) / totalSteps;

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, interest];
    });
  };

  const handleFinish = async () => {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;
    if (!user) {
      Alert.alert(t('common.error'), 'Not authenticated. Please sign in again.');
      setLoading(false);
      router.replace('/(auth)/sign-in');
      return;
    }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      nickname: nickname.trim(),
      age_range: ageRange,
      interests,
    });
    if (error) Alert.alert(t('common.error'), error.message);
    else router.replace('/(app)/map');
    setLoading(false);
  };

  const canProceed = step === 0
    ? nickname.trim().length >= 2
    : step === 1
      ? !!ageRange
      : interests.length >= 1;

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleFinish();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(124,111,247,0.06)', 'transparent']}
        style={styles.ambientGlow}
      />

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <LinearGradient
            colors={colors.gradient.primary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
        <Text style={styles.stepIndicator}>{step + 1}/{totalSteps}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t('profile.createTitle')}</Text>
        <Text style={styles.subtitle}>{t('profile.createSubtitle')}</Text>

        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.label}>{t('profile.nickname')}</Text>
            <Text style={styles.stepHint}>{t('profile.nicknameHint')}</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder={t('profile.nicknamePlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              maxLength={30}
              autoFocus
            />
            {nickname.trim().length >= 2 && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.label}>{t('profile.ageRange')}</Text>
            <Text style={styles.stepHint}>{t('profile.ageRangeHint')}</Text>
            <View style={styles.chipGrid}>
              {AGE_RANGES.map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[styles.chip, ageRange === range && styles.chipActive]}
                  onPress={() => setAgeRange(range)}
                >
                  <Text style={[styles.chipText, ageRange === range && styles.chipTextActive]}>
                    {range}
                  </Text>
                  {ageRange === range && <View style={styles.chipDot} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.label}>
              {t('profile.interests')} ({interests.length}/{MAX_INTERESTS})
            </Text>
            <Text style={styles.stepHint}>{t('profile.interestsHint')}</Text>
            <View style={styles.chipGrid}>
              {INTEREST_OPTIONS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[styles.chip, interests.includes(interest) && styles.chipActive]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[styles.chipText, interests.includes(interest) && styles.chipTextActive]}>
                    {t(`interests.${interest}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Button
            title={step < totalSteps - 1 ? t('profile.continue') : t('common.done')}
            onPress={handleNext}
            disabled={!canProceed}
            loading={loading}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  ambientGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  progressContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 60, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg,
  },
  progressBg: {
    flex: 1, height: 4, backgroundColor: colors.bg.surface, borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  stepIndicator: {
    color: colors.text.tertiary, fontSize: typography.size.bodySm,
    fontWeight: typography.weight.semibold,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  title: {
    fontSize: typography.size.displayLg, fontWeight: typography.weight.extrabold,
    color: colors.text.primary, letterSpacing: typography.letterSpacing.display,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.bodyMd, color: colors.text.secondary,
    marginBottom: spacing['3xl'],
  },
  stepContent: { position: 'relative' },
  stepHint: {
    fontSize: typography.size.bodySm, color: colors.text.tertiary,
    lineHeight: typography.size.bodySm * 1.5, marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.label, fontWeight: typography.weight.semibold,
    color: colors.text.secondary, marginBottom: spacing.md,
    textTransform: 'uppercase', letterSpacing: typography.letterSpacing.caps,
  },
  input: {
    height: 52, backgroundColor: colors.bg.tertiary, borderRadius: 14,
    paddingHorizontal: spacing.lg, fontSize: typography.size.bodyLg,
    color: colors.text.primary, borderWidth: 1, borderColor: colors.bg.surface,
  },
  checkmark: {
    position: 'absolute', right: 16, top: 44,
    color: colors.accent.success, fontSize: 20, fontWeight: '700',
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.bg.tertiary,
    borderWidth: 1, borderColor: colors.bg.surface,
  },
  chipActive: {
    backgroundColor: colors.accent.primary, borderColor: colors.accent.primary,
    ...shadows.glowPrimary,
  },
  chipText: { color: colors.text.secondary, fontSize: typography.size.bodyMd, fontWeight: typography.weight.medium },
  chipTextActive: { color: '#FFFFFF' },
  chipDot: {
    position: 'absolute', top: -2, right: -2,
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent.success,
  },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'], paddingTop: spacing.lg,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
  },
  backButton: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: colors.bg.secondary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  backText: { color: colors.text.primary, fontSize: 24 },
});
