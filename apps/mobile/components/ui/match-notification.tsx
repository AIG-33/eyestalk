import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

interface Props {
  matchedNickname: string;
  chatId: string;
  onDismiss: () => void;
}

export function MatchNotification({ matchedNickname, chatId, onDismiss }: Props) {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(4000),
      Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => onDismiss());
  }, []);

  const handlePress = () => {
    onDismiss();
    router.push(`/(app)/chat/${chatId}` as any);
  };

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ scale }] }]}>
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.9}>
        <Text style={styles.emoji}>✨</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>It's a match!</Text>
          <Text style={styles.subtitle}>
            {matchedNickname} {t('chats.chatRequest').toLowerCase()}
          </Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 60, left: 16, right: 16, zIndex: 200,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#6C5CE7', borderRadius: 20, padding: 16,
    shadowColor: '#6C5CE7', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  emoji: { fontSize: 28 },
  textContainer: { flex: 1 },
  title: { color: '#FFFFFE', fontSize: 18, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  arrow: { color: '#FFFFFE', fontSize: 24, fontWeight: '700' },
});
