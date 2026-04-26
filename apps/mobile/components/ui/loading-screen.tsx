import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogoMark } from '@/components/ui/logo-mark';
import { colors, typography, spacing } from '@/theme';

const { height: SH } = Dimensions.get('window');
const LOGO = 96;

export function LoadingScreen() {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameTranslateY = useRef(new Animated.Value(8)).current;
  const sloganOpacity = useRef(new Animated.Value(0)).current;
  const barProgress = useRef(new Animated.Value(0)).current;
  const haloPulse = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(nameOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(nameTranslateY, { toValue: 0, friction: 7, useNativeDriver: true }),
      ]),
      Animated.timing(sloganOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const halo = Animated.loop(
      Animated.sequence([
        Animated.timing(haloPulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(haloPulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    halo.start();

    const makeRing = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
    const r1 = makeRing(ring1, 0);
    const r2 = makeRing(ring2, 1200);
    r1.start();
    r2.start();

    const bar = Animated.loop(
      Animated.sequence([
        Animated.timing(barProgress, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
        Animated.timing(barProgress, { toValue: 0, duration: 700, easing: Easing.in(Easing.cubic), useNativeDriver: false }),
        Animated.delay(300),
      ]),
    );
    bar.start();

    return () => { halo.stop(); r1.stop(); r2.stop(); bar.stop(); };
  }, [barProgress, haloPulse, logoOpacity, logoScale, nameOpacity, nameTranslateY, ring1, ring2, sloganOpacity]);

  const haloScale = haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const haloOpacity = haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

  const ringStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.45, 0.2, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 2.4] }) }],
  });

  const barWidth = barProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });

  return (
    <View style={s.container}>
      <LinearGradient
        colors={[colors.bg.secondary, colors.bg.primary]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Ambient corner glows */}
      <View pointerEvents="none" style={s.cornerGlowTop}>
        <LinearGradient
          colors={['rgba(124,111,247,0.18)', 'rgba(124,111,247,0)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
        />
      </View>
      <View pointerEvents="none" style={s.cornerGlowBottom}>
        <LinearGradient
          colors={['rgba(255,107,157,0.12)', 'rgba(255,107,157,0)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.8, y: 1 }}
          end={{ x: 0.2, y: 0 }}
        />
      </View>

      <View style={s.center}>
        <View style={s.logoWrap}>
          {/* Pulsing rings */}
          <Animated.View style={[s.ring, ringStyle(ring1)]} />
          <Animated.View style={[s.ring, ringStyle(ring2)]} />

          {/* Halo glow behind the mark */}
          <Animated.View
            style={[
              s.halo,
              { opacity: haloOpacity, transform: [{ scale: haloScale }] },
            ]}
          />

          <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
            <LogoMark size={LOGO} color={colors.accent.primary} />
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: nameOpacity, transform: [{ translateY: nameTranslateY }] }}>
          <Text style={s.appName}>
            <Text style={s.nameStrong}>Eyes</Text>
            <Text style={s.nameLight}>Talk</Text>
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: sloganOpacity }}>
          <View style={s.sloganLine} />
          <Text style={s.slogan}>Look up · Speak up · Link up</Text>
        </Animated.View>
      </View>

      <View style={s.bottomArea}>
        <View style={s.barTrack}>
          <Animated.View style={[s.barFill, { width: barWidth }]}>
            <LinearGradient
              colors={colors.gradient.primary}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    overflow: 'hidden',
  },

  cornerGlowTop: {
    position: 'absolute',
    top: -SH * 0.15,
    left: -80,
    right: -80,
    height: SH * 0.45,
    opacity: 0.9,
  },
  cornerGlowBottom: {
    position: 'absolute',
    bottom: -SH * 0.15,
    left: -80,
    right: -80,
    height: SH * 0.4,
    opacity: 0.9,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
  },

  logoWrap: {
    width: LOGO * 2.4,
    height: LOGO * 2.4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  ring: {
    position: 'absolute',
    width: LOGO * 1.6,
    height: LOGO * 1.6,
    borderRadius: (LOGO * 1.6) / 2,
    borderWidth: 1.5,
    borderColor: colors.accent.primaryLight,
  },
  halo: {
    position: 'absolute',
    width: LOGO * 2,
    height: LOGO * 2,
    borderRadius: LOGO,
    backgroundColor: colors.accent.primary,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 24,
  },

  appName: {
    fontSize: typography.size.displayXl,
    letterSpacing: typography.letterSpacing.display,
    textAlign: 'center',
  },
  nameStrong: {
    fontFamily: typography.family.displayFallback,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
  },
  nameLight: {
    fontFamily: typography.family.displayFallback,
    fontWeight: typography.weight.regular,
    color: colors.accent.primaryLight,
  },

  sloganLine: {
    width: 36,
    height: 2,
    backgroundColor: colors.accent.primary,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 1,
    opacity: 0.7,
  },
  slogan: {
    fontSize: typography.size.bodySm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    letterSpacing: typography.letterSpacing.caps,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  bottomArea: {
    paddingBottom: 80,
    alignItems: 'center',
  },
  barTrack: {
    width: 120,
    height: 3,
    backgroundColor: 'rgba(124,111,247,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
});
