import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, type ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { LogoMark } from '@/components/ui/logo-mark';
import { useTheme, typography } from '@/theme';

interface Props {
  /** Font size of the "EyesTalk" wordmark. Mark scales relative to it. */
  fontSize?: number;
  /** Show the speech-bubble mark to the left of the wordmark. */
  showMark?: boolean;
  /** Show the breathing mint "live" dot after the wordmark. */
  liveDot?: boolean;
  /** Override the wordmark color for "Eyes" (defaults to theme text.primary). */
  primaryColor?: string;
  style?: ViewStyle;
}

/**
 * EyesTalk "live wordmark lockup" — gradient speech-bubble mark + two-tone
 * wordmark in Clash Display ("Eyes" white, "Talk" violet gradient) with a
 * breathing mint "live" dot. The brand's signature header lockup.
 */
export function Wordmark({
  fontSize = 22,
  showMark = true,
  liveDot = true,
  primaryColor,
  style,
}: Props) {
  const { c } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!liveDot) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, liveDot]);

  const dotOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const dotScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.25] });

  const markSize = Math.round(fontSize * 1.5);
  const dotSize = Math.max(6, Math.round(fontSize * 0.3));

  const wordStyle = [
    styles.word,
    { fontSize, lineHeight: Math.round(fontSize * 1.12) },
  ];

  return (
    <View style={[styles.row, style]}>
      {showMark && (
        <View style={[styles.markWrap, { marginRight: fontSize * 0.34 }]}>
          <View
            style={[
              styles.markGlow,
              {
                width: markSize * 1.05,
                height: markSize * 1.05,
                borderRadius: markSize,
              },
            ]}
          />
          <LogoMark size={markSize} gradient />
        </View>
      )}

      <Text style={[wordStyle, { color: primaryColor ?? c.text.primary }]}>
        Eyes
      </Text>
      {/* "Talk" in the primary gradient (#A29BFE → #7C6FF7) */}
      <MaskedView
        maskElement={<Text style={[wordStyle, { color: '#000' }]}>Talk</Text>}
      >
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          colors={['#A29BFE', '#7C6FF7']}
        >
          <Text style={[wordStyle, { opacity: 0 }]}>Talk</Text>
        </LinearGradient>
      </MaskedView>

      {liveDot && (
        <Animated.View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: c.accent.success,
              marginLeft: dotSize * 0.6,
              marginBottom: fontSize * 0.45,
              opacity: dotOpacity,
              transform: [{ scale: dotScale }],
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(124,111,247,0.45)',
    shadowColor: '#7C6FF7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 10,
  },
  word: {
    fontFamily: typography.family.display,
    letterSpacing: -1,
  },
  dot: {
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
});
