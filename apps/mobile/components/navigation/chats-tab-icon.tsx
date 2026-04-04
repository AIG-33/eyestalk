import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useChatTabBadges } from '@/hooks/use-chat-tab-badges';

const CHAT_ICONS = {
  outline: 'chatbubbles-outline' as const,
  filled: 'chatbubbles' as const,
};

function formatBadge(n: number) {
  if (n <= 0) return '';
  if (n > 99) return '99+';
  return String(n);
}

export function ChatsTabIcon({ focused }: { focused: boolean }) {
  const { c } = useTheme();
  const { data } = useChatTabBadges();
  const unreadMessages = data?.unreadMessages ?? 0;
  const unreadWaves = data?.unreadWaves ?? 0;

  const iconName = focused ? CHAT_ICONS.filled : CHAT_ICONS.outline;
  const iconColor = focused ? c.accent.primary : c.text.tertiary;

  const waveLabel = formatBadge(unreadWaves);
  const msgLabel = formatBadge(unreadMessages);

  return (
    <View style={styles.wrap}>
      {unreadWaves > 0 && waveLabel ? (
        <View
          style={[
            styles.badge,
            styles.badgeLeft,
            styles.badgeWave,
            { borderColor: c.bg.secondary },
          ]}
        >
          <Text style={styles.badgeText}>{waveLabel}</Text>
        </View>
      ) : null}
      <Ionicons name={iconName} size={focused ? 26 : 24} color={iconColor} />
      {unreadMessages > 0 && msgLabel ? (
        <View
          style={[
            styles.badge,
            styles.badgeRight,
            styles.badgeMsg,
            { borderColor: c.bg.secondary },
          ]}
        >
          <Text style={styles.badgeText}>{msgLabel}</Text>
        </View>
      ) : null}
      {focused && (
        <View
          style={[
            styles.glowDot,
            { backgroundColor: c.accent.primary },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 2,
  },
  badgeLeft: {
    top: -2,
    left: -4,
  },
  badgeRight: {
    top: -2,
    right: -4,
  },
  badgeWave: {
    backgroundColor: '#F5A623',
  },
  badgeMsg: {
    backgroundColor: '#FF4757',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  glowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 3,
  },
});
