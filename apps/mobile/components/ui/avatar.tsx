import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, component } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Status = 'online' | 'inVenue' | 'away' | 'stealth' | null;

interface Props {
  uri: string | null;
  name: string;
  size?: Size;
  status?: Status;
}

export function Avatar({ uri, name, size = 'md', status = null }: Props) {
  const safeName = name?.trim?.() ? name : '?';
  const dim = component.avatar[size];
  const showRing = status && status !== 'stealth' && (size === 'md' || size === 'lg' || size === 'xl');
  const ringWidth = size === 'md' ? 2 : 3;

  const statusColor = status === 'online'
    ? colors.status.online
    : status === 'inVenue'
      ? colors.status.inVenue
      : colors.status.away;

  const ringSize = dim + ringWidth * 2 + 4;

  return (
    <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
      {showRing && (
        <View
          style={[
            styles.ring,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderWidth: ringWidth,
              borderColor: statusColor,
            },
          ]}
        />
      )}
      {uri ? (
        <Image source={{ uri }} style={[styles.image, { width: dim, height: dim, borderRadius: dim / 2 }]} />
      ) : (
        <LinearGradient
          colors={colors.gradient.primary}
          style={[styles.fallback, { width: dim, height: dim, borderRadius: dim / 2 }]}
        >
          <Text style={[styles.initial, { fontSize: dim * 0.4 }]}>
            {safeName.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
      )}
      {status === 'online' && size !== 'xs' && (
        <View
          style={[
            styles.statusDot,
            {
              width: dim * 0.25,
              height: dim * 0.25,
              borderRadius: dim * 0.125,
              backgroundColor: colors.status.online,
              borderWidth: 2,
              borderColor: colors.bg.primary,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute' },
  image: { backgroundColor: colors.bg.tertiary },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#FFFFFF', fontWeight: '700' },
  statusDot: { position: 'absolute' },
});
