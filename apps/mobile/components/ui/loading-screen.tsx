import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const LOGO = 120;
const NAVY = '#1B1464';
const PURPLE = '#7C6FF7';
const PURPLE_LIGHT = '#A29BFE';

export function LoadingScreen() {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameTranslateY = useRef(new Animated.Value(12)).current;
  const sloganOpacity = useRef(new Animated.Value(0)).current;
  const sloganTranslateY = useRef(new Animated.Value(8)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 30, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(nameOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(nameTranslateY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(sloganOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(sloganTranslateY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    pulseLoop.start();

    const makeRing = (anim: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]));
    const r1 = makeRing(ring1, 0);
    const r2 = makeRing(ring2, 1100);
    r1.start();
    r2.start();

    const barLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(barWidth, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
        Animated.timing(barWidth, { toValue: 0, duration: 800, easing: Easing.in(Easing.cubic), useNativeDriver: false }),
        Animated.delay(400),
      ]),
    );
    barLoop.start();

    return () => { pulseLoop.stop(); r1.stop(); r2.stop(); barLoop.stop(); };
  }, []);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.18] });

  const ringStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 0.15, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 2.2] }) }],
  });

  const animatedBarWidth = barWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 100] });

  return (
    <View style={s.container}>
      <View style={s.topDecor}>
        <View style={[s.decorCircle, s.decorTopLeft]} />
        <View style={[s.decorCircle, s.decorTopRight]} />
      </View>

      <View style={s.center}>
        <View style={s.logoWrap}>
          <Animated.View style={[s.ring, ringStyle(ring1)]} />
          <Animated.View style={[s.ring, ringStyle(ring2)]} />

          <Animated.View style={[s.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

          <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
            <Image source={require('@/assets/logo-purple.png')} style={s.logo} resizeMode="contain" />
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: nameOpacity, transform: [{ translateY: nameTranslateY }] }}>
          <Text style={s.appName}>
            <Text style={s.nameBold}>Eyes</Text>
            <Text style={s.nameLight}>Talk</Text>
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: sloganOpacity, transform: [{ translateY: sloganTranslateY }] }}>
          <View style={s.sloganLine} />
          <Text style={s.slogan}>Look up. Speak up. Link up.</Text>
        </Animated.View>
      </View>

      <View style={s.bottomArea}>
        <View style={s.barTrack}>
          <Animated.View style={[s.barFill, { width: animatedBarWidth }]} />
        </View>
      </View>

      <View style={s.bottomDecor}>
        <View style={[s.decorCircle, s.decorBottomLeft]} />
        <View style={[s.decorCircle, s.decorBottomRight]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  topDecor: { position: 'absolute', top: 0, left: 0, right: 0, height: SH * 0.3 },
  bottomDecor: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.25 },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  decorTopLeft: {
    width: 220, height: 220,
    backgroundColor: 'rgba(124,111,247,0.04)',
    top: -80, left: -60,
  },
  decorTopRight: {
    width: 140, height: 140,
    backgroundColor: 'rgba(162,155,254,0.05)',
    top: -20, right: -30,
  },
  decorBottomLeft: {
    width: 180, height: 180,
    backgroundColor: 'rgba(162,155,254,0.04)',
    bottom: -90, left: -40,
  },
  decorBottomRight: {
    width: 260, height: 260,
    backgroundColor: 'rgba(124,111,247,0.03)',
    bottom: -120, right: -80,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
  },

  logoWrap: {
    width: LOGO * 2.2,
    height: LOGO * 2.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ring: {
    position: 'absolute',
    width: LOGO * 1.4,
    height: LOGO * 1.4,
    borderRadius: LOGO * 0.7,
    borderWidth: 2,
    borderColor: PURPLE_LIGHT,
  },
  glow: {
    position: 'absolute',
    width: LOGO * 1.8,
    height: LOGO * 1.8,
    borderRadius: LOGO * 0.9,
    backgroundColor: PURPLE_LIGHT,
  },
  logo: {
    width: LOGO,
    height: LOGO,
  },

  appName: {
    fontSize: 38,
    letterSpacing: 1,
  },
  nameBold: {
    fontWeight: '900',
    color: NAVY,
  },
  nameLight: {
    fontWeight: '300',
    color: PURPLE,
  },

  sloganLine: {
    width: 40,
    height: 2,
    backgroundColor: PURPLE_LIGHT,
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 1,
  },
  slogan: {
    fontSize: 14,
    fontWeight: '800',
    color: PURPLE,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  bottomArea: {
    paddingBottom: 80,
    alignItems: 'center',
  },
  barTrack: {
    width: 100,
    height: 3,
    backgroundColor: 'rgba(124,111,247,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: 3,
    backgroundColor: PURPLE,
    borderRadius: 2,
  },
});
