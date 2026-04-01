import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';

interface Props {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = radius.md, style }: Props) {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.bg.surface,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

export function VenueCardSkeleton() {
  return (
    <View style={skStyles.venueCard}>
      <Skeleton width={40} height={40} borderRadius={12} />
      <View style={skStyles.venueCardLines}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
  );
}

export function PersonCardSkeleton() {
  return (
    <View style={skStyles.personCard}>
      <Skeleton width={56} height={56} borderRadius={28} />
      <Skeleton width="60%" height={12} style={{ marginTop: 8 }} />
      <Skeleton width="40%" height={10} style={{ marginTop: 4 }} />
    </View>
  );
}

export function ChatListSkeleton() {
  return (
    <View style={skStyles.chatItem}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={skStyles.chatLines}>
        <Skeleton width="50%" height={14} />
        <Skeleton width="80%" height={10} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={skStyles.profileContainer}>
      <Skeleton width={100} height={100} borderRadius={50} />
      <Skeleton width={120} height={18} style={{ marginTop: 16 }} />
      <Skeleton width={180} height={12} style={{ marginTop: 8 }} />
      <View style={skStyles.profileTags}>
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width={80} height={24} borderRadius={12} />
        <Skeleton width={50} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

const skStyles = StyleSheet.create({
  venueCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.bg.secondary, borderRadius: radius.lg,
    padding: 16, marginBottom: 8,
  },
  venueCardLines: { flex: 1, gap: 6 },
  personCard: {
    alignItems: 'center', padding: 16,
    backgroundColor: colors.bg.secondary, borderRadius: radius.lg,
  },
  chatItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16,
  },
  chatLines: { flex: 1, gap: 4 },
  profileContainer: { alignItems: 'center', paddingTop: 40 },
  profileTags: {
    flexDirection: 'row', gap: 8, marginTop: 16,
  },
});
