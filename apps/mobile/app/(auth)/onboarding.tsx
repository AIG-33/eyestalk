import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { appStorage } from '@/lib/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LogoMark } from '@/components/ui/logo-mark';
import { colors, typography, spacing, radius, shadows } from '@/theme';

// One screen instead of a 4-slide carousel: show all the value at a glance and
// get the user to the map as fast as possible.
const FEATURES = [
  { key: 'step1', emoji: '📍', gradient: ['#7C6FF7', '#A29BFE'] },
  { key: 'step2', emoji: '👀', gradient: ['#FF6B9D', '#A29BFE'] },
  { key: 'step3', emoji: '💬', gradient: ['#00E5A0', '#00D4FF'] },
  { key: 'step4', emoji: '🎯', gradient: ['#FFD93D', '#FF6B9D'] },
] as const;

export default function OnboardingScreen() {
  const { t } = useTranslation();

  const markSeen = () => appStorage.set('eyestalk_onboarding_seen', 'true');

  const handleGetStarted = () => {
    markSeen();
    router.replace('/(auth)/sign-up');
  };

  const handleSignIn = () => {
    markSeen();
    router.replace('/(auth)/sign-in');
  };

  const handleExplore = () => {
    markSeen();
    router.replace('/(app)/map' as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(124,111,247,0.20)', 'transparent']}
        style={styles.ambientGlow}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LogoMark size={72} glass />
          <Text style={styles.heroTitle}>{t('onboarding.heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('onboarding.heroSubtitle')}</Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.key} style={styles.featureRow}>
              <View style={[styles.featureIcon, { shadowColor: f.gradient[0] }]}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>{t(`onboarding.${f.key}Title`)}</Text>
                <Text style={styles.featureDesc}>{t(`onboarding.${f.key}Desc`)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.ctaBtn, shadows.glowPrimary]}
          onPress={handleGetStarted}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={colors.gradient.primary}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaText}>{t('onboarding.getStarted')}</Text>
            <Ionicons name="rocket-outline" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exploreBtn} onPress={handleExplore} activeOpacity={0.8}>
          <Ionicons name="map-outline" size={18} color={colors.accent.primaryLight} />
          <Text style={styles.exploreText}>{t('onboarding.exploreFirst')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSignIn} activeOpacity={0.7}>
          <Text style={styles.signInText}>{t('auth.hasAccount')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 320,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl + spacing.sm,
    paddingTop: 96,
    paddingBottom: spacing.xl,
  },
  hero: { alignItems: 'flex-start', marginBottom: spacing['3xl'] },
  heroTitle: {
    fontSize: typography.size.displayLg,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.display,
    marginTop: spacing.xl,
  },
  heroSubtitle: {
    fontSize: typography.size.bodyLg,
    color: colors.text.secondary,
    lineHeight: typography.size.bodyLg * 1.5,
    marginTop: spacing.md,
    maxWidth: 320,
  },
  features: { gap: spacing.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  featureIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(124,111,247,0.12)',
    borderWidth: 1, borderColor: 'rgba(124,111,247,0.25)',
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  featureEmoji: { fontSize: 28 },
  featureTextCol: { flex: 1 },
  featureTitle: {
    fontSize: typography.size.headingSm,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: typography.size.bodyMd,
    color: colors.text.secondary,
    lineHeight: typography.size.bodyMd * 1.4,
  },
  bottom: {
    paddingHorizontal: spacing.xl + spacing.sm,
    paddingBottom: spacing['4xl'],
    gap: spacing.lg,
    alignItems: 'center',
  },
  ctaBtn: { width: '100%', borderRadius: radius.lg, overflow: 'hidden' },
  ctaGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.lg,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: typography.size.headingSm,
    fontWeight: typography.weight.bold,
  },
  exploreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, width: '100%', paddingVertical: spacing.md,
    borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.accent.primary,
  },
  exploreText: {
    color: colors.accent.primaryLight,
    fontSize: typography.size.bodyLg,
    fontWeight: typography.weight.semibold,
  },
  signInText: {
    color: colors.text.tertiary,
    fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.medium,
  },
});
