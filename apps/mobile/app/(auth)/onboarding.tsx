import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { appStorage } from '@/lib/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = [
  { key: 'step1', emoji: '📍', icon: 'map-outline' as const, gradient: ['#7C6FF7', '#A29BFE'] },
  { key: 'step2', emoji: '👀', icon: 'people-outline' as const, gradient: ['#FF6B9D', '#A29BFE'] },
  { key: 'step3', emoji: '💬', icon: 'chatbubbles-outline' as const, gradient: ['#00E5A0', '#00D4FF'] },
  { key: 'step4', emoji: '🎯', icon: 'flash-outline' as const, gradient: ['#FFD93D', '#FF6B9D'] },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const markSeen = () => appStorage.set('eyestalk_onboarding_seen', 'true');

  const handleNext = () => {
    if (currentIndex < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      markSeen();
      router.replace('/(auth)/sign-up');
    }
  };

  const handleSkip = () => {
    markSeen();
    router.replace('/(auth)/sign-in');
  };

  const renderItem = ({ item, index }: { item: typeof STEPS[0]; index: number }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <LinearGradient
        colors={[`${item.gradient[0]}15`, 'transparent']}
        style={styles.slideGlow}
      />
      <View style={[styles.emojiContainer, { shadowColor: item.gradient[0] }]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.title}>
        {t(`onboarding.${item.key}Title`)}
      </Text>
      <Text style={styles.description}>
        {t(`onboarding.${item.key}Desc`)}
      </Text>
    </View>
  );

  const isLast = currentIndex === STEPS.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>{t('onboarding.skipOnboarding')}</Text>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={STEPS}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(idx);
        }}
      />

      {/* Bottom */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {STEPS.map((_, i) => {
            const inputRange = [
              (i - 1) * SCREEN_WIDTH,
              i * SCREEN_WIDTH,
              (i + 1) * SCREEN_WIDTH,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity: dotOpacity },
                ]}
              />
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.nextBtn, shadows.glowPrimary]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={colors.gradient.primary}
            style={styles.nextBtnGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextText}>
              {isLast ? t('onboarding.getStarted') : t('common.next')}
            </Text>
            <Ionicons
              name={isLast ? 'rocket-outline' : 'arrow-forward'}
              size={20}
              color="#FFF"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  skipBtn: {
    position: 'absolute', top: 56, right: spacing.xl, zIndex: 10,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  skipText: {
    color: colors.text.tertiary, fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.medium,
  },
  slide: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  slideGlow: {
    position: 'absolute', top: '20%', width: 300, height: 300,
    borderRadius: 150, alignSelf: 'center',
  },
  emojiContainer: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing['3xl'],
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 24,
    elevation: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  emoji: { fontSize: 56 },
  title: {
    fontSize: typography.size.displayMd, fontWeight: typography.weight.extrabold,
    color: colors.text.primary, textAlign: 'center', marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.size.bodyLg, color: colors.text.secondary,
    textAlign: 'center', lineHeight: typography.size.bodyLg * 1.6,
  },
  bottom: {
    paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'],
    alignItems: 'center', gap: spacing.xl,
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: {
    height: 8, borderRadius: 4, backgroundColor: colors.accent.primary,
  },
  nextBtn: { width: '100%', borderRadius: radius.lg, overflow: 'hidden' },
  nextBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.lg,
  },
  nextText: {
    color: '#FFFFFF', fontSize: typography.size.headingSm,
    fontWeight: typography.weight.bold,
  },
});
