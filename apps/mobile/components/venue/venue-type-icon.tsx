import { View, Text, StyleSheet } from 'react-native';

const VENUE_ICONS: Record<string, string> = {
  karaoke: '🎤',
  nightclub: '🪩',
  sports_bar: '⚽',
  bowling: '🎳',
  billiards: '🎱',
  hookah: '💨',
  board_games: '🎲',
  arcade: '🕹️',
  standup: '🎭',
  live_music: '🎸',
  other: '📍',
};

interface Props {
  type: string;
  count: number;
}

export function VenueTypeIcon({ type, count }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{VENUE_ICONS[type] || '📍'}</Text>
      </View>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1929',
    borderWidth: 2,
    borderColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF6B6B',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFE',
    fontSize: 10,
    fontWeight: '700',
  },
});
