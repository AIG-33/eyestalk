import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MICRO_CHAT_DURATION_MINUTES, MICRO_CHAT_MESSAGE_LIMIT } from '@eyestalk/shared/constants';

interface Props {
  expiresAt: string | null;
  messageCount: number;
  onExtend: () => void;
  extendCost: number;
}

export function MicroChatTimer({ expiresAt, messageCount, onExtend, extendCost }: Props) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('0:00');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;

  const messagesLeft = MICRO_CHAT_MESSAGE_LIMIT - messageCount;
  const isLow = messagesLeft <= 3 || (timeLeft && parseInt(timeLeft) <= 1);

  if (expired) {
    return (
      <View style={styles.expiredContainer}>
        <Text style={styles.expiredText}>{t('microChat.expired')}</Text>
        <TouchableOpacity style={styles.extendButton} onPress={onExtend}>
          <Text style={styles.extendText}>
            {t('microChat.extend', { cost: extendCost })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, isLow && styles.containerWarning]}>
      <Text style={[styles.timerText, isLow && styles.timerWarning]}>⏱ {timeLeft}</Text>
      <Text style={styles.separator}>·</Text>
      <Text style={[styles.messagesText, messagesLeft <= 3 && styles.timerWarning]}>
        {t('microChat.messagesLeft', { count: Math.max(0, messagesLeft) })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6, gap: 8, backgroundColor: '#1A1929',
    borderBottomWidth: 1, borderBottomColor: '#2A2940',
  },
  containerWarning: { backgroundColor: 'rgba(255,107,107,0.1)' },
  timerText: { color: '#A7A9BE', fontSize: 13, fontWeight: '600' },
  timerWarning: { color: '#FF6B6B' },
  separator: { color: '#2A2940', fontSize: 13 },
  messagesText: { color: '#A7A9BE', fontSize: 13 },
  expiredContainer: {
    alignItems: 'center', padding: 16, gap: 12,
    backgroundColor: '#1A1929', borderBottomWidth: 1, borderBottomColor: '#2A2940',
  },
  expiredText: { color: '#FF6B6B', fontSize: 14, fontWeight: '600' },
  extendButton: {
    backgroundColor: '#6C5CE7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
  },
  extendText: { color: '#FFFFFE', fontSize: 14, fontWeight: '700' },
});
