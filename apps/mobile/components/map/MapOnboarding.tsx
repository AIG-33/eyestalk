import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, typography, radius, spacing } from '@/theme';
import { appStorage } from '@/lib/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDING_KEY = 'eyestalk_map_onboarding_seen';

const STEPS = [
  { emoji: '🗺️', titleKey: 'mapOnboarding.step1Title', descKey: 'mapOnboarding.step1Desc' },
  { emoji: '📲', titleKey: 'mapOnboarding.step2Title', descKey: 'mapOnboarding.step2Desc' },
  { emoji: '👋', titleKey: 'mapOnboarding.step3Title', descKey: 'mapOnboarding.step3Desc' },
];

interface Props {
  onDismiss: () => void;
}

export function useMapOnboardingVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    appStorage.get(ONBOARDING_KEY).then((val) => {
      if (val !== 'true') setVisible(true);
    });
  }, []);

  const dismiss = () => {
    setVisible(false);
    appStorage.set(ONBOARDING_KEY, 'true');
  };

  return { visible, dismiss };
}

export function MapOnboarding({ onDismiss }: Props) {
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onDismiss();
    } else {
      setStep((s) => s + 1);
    }
  };

  const current = STEPS[step];

  return (
    <View style={styles.overlay}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? 'rgba(13,13,26,0.96)'
              : 'rgba(255,255,255,0.97)',
            borderColor: isDark
              ? 'rgba(124,111,247,0.2)'
              : 'rgba(0,0,0,0.08)',
          },
        ]}
      >
        <Text style={styles.emoji}>{current.emoji}</Text>

        <Text style={[styles.title, { color: c.text.primary }]}>
          {t(current.titleKey)}
        </Text>

        <Text style={[styles.desc, { color: c.text.secondary }]}>
          {t(current.descKey)}
        </Text>

        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === step ? c.accent.primary : c.text.tertiary,
                  width: i === step ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={isDark ? ['#7C6FF7', '#A29BFE'] : ['#6C5CE7', '#7C6FF7']}
            style={styles.btn}
          >
            <Text style={styles.btnText}>
              {isLast
                ? t('mapOnboarding.letsGo', { defaultValue: "Let's go!" })
                : t('common.next')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={onDismiss} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: c.text.tertiary }]}>
              {t('common.skip')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    width: SCREEN_WIDTH - 48,
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing['3xl'],
    borderRadius: radius['2xl'],
    alignItems: 'center',
    borderWidth: 1,
  },
  emoji: {
    fontSize: 52,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.headingLg,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: typography.letterSpacing.heading,
  },
  desc: {
    fontSize: typography.size.bodyMd,
    textAlign: 'center',
    lineHeight: typography.size.bodyMd * 1.5,
    marginBottom: spacing['2xl'],
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing['2xl'],
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  btn: {
    paddingHorizontal: spacing['3xl'],
    paddingVertical: 14,
    borderRadius: radius.lg,
    minWidth: 180,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: typography.size.bodyLg,
    fontWeight: typography.weight.bold,
  },
  skipBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: typography.size.bodyMd,
  },
});
