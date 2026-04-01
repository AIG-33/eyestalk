import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from './avatar';
import { Button } from './button';
import { colors, typography, spacing, shadows } from '@/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  myAvatar: string | null;
  myName: string;
  theirAvatar: string | null;
  theirName: string;
  venueName: string;
  chatId: string;
  onDismiss: () => void;
}

export function MatchOverlay({
  myAvatar, myName, theirAvatar, theirName, venueName, chatId, onDismiss,
}: Props) {
  const { t } = useTranslation();

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const leftX = useRef(new Animated.Value(-SCREEN_WIDTH / 2)).current;
  const rightX = useRef(new Animated.Value(SCREEN_WIDTH / 2)).current;
  const textScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const particleScale = useRef(new Animated.Value(0)).current;
  const particleOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(leftX, { toValue: -40, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.spring(rightX, { toValue: 40, tension: 60, friction: 10, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(particleScale, { toValue: 1.5, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(particleOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(particleOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.spring(textScale, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.timing(buttonsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleChat = () => {
    onDismiss();
    router.push(`/(app)/chat/${chatId}` as any);
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
      <LinearGradient
        colors={['rgba(13,13,26,0.95)', 'rgba(13,13,26,0.98)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Particle burst */}
      <Animated.View style={[styles.particleBurst, {
        transform: [{ scale: particleScale }],
        opacity: particleOpacity,
      }]}>
        <LinearGradient
          colors={colors.gradient.match}
          style={styles.particleCircle}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Avatars converging */}
      <View style={styles.avatarRow}>
        <Animated.View style={{ transform: [{ translateX: leftX }] }}>
          <View style={[styles.avatarWrapper, shadows.glowPrimary]}>
            <Avatar uri={myAvatar} name={myName} size="xl" />
          </View>
        </Animated.View>
        <Animated.View style={{ transform: [{ translateX: rightX }] }}>
          <View style={[styles.avatarWrapper, shadows.glowPink]}>
            <Avatar uri={theirAvatar} name={theirName} size="xl" />
          </View>
        </Animated.View>
      </View>

      {/* Text */}
      <Animated.View style={[styles.textContainer, {
        transform: [{ scale: textScale }],
        opacity: textOpacity,
      }]}>
        <Text style={styles.matchTitle}>{t('match.title')}</Text>
        <Text style={styles.matchSubtitle}>
          {t('match.subtitle', { venue: venueName })}
        </Text>
        <Text style={styles.matchHint}>{t('match.hint')}</Text>
      </Animated.View>

      {/* Actions */}
      <Animated.View style={[styles.actions, { opacity: buttonsOpacity }]}>
        <Button title={`💬  ${t('match.startChat')}`} onPress={handleChat} />
        <TouchableOpacity style={styles.laterBtn} onPress={onDismiss}>
          <Text style={styles.laterText}>{t('match.later')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  particleBurst: {
    position: 'absolute', alignSelf: 'center',
  },
  particleCircle: {
    width: 200, height: 200, borderRadius: 100, opacity: 0.3,
  },
  avatarRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing['3xl'],
  },
  avatarWrapper: {
    borderRadius: 70, overflow: 'hidden',
  },
  textContainer: {
    alignItems: 'center', marginBottom: spacing['3xl'],
  },
  matchTitle: {
    fontSize: typography.size.displayLg, fontWeight: typography.weight.extrabold,
    color: colors.text.primary, marginBottom: spacing.sm,
  },
  matchSubtitle: {
    fontSize: typography.size.bodyLg, color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  matchHint: {
    fontSize: typography.size.bodyMd, color: colors.text.tertiary,
    textAlign: 'center', lineHeight: typography.size.bodyMd * 1.5,
    paddingHorizontal: spacing['3xl'],
  },
  actions: {
    width: SCREEN_WIDTH - spacing.xl * 2,
  },
  laterBtn: {
    marginTop: spacing.lg, alignItems: 'center', padding: spacing.md,
  },
  laterText: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.medium,
  },
});
