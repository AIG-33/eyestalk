import { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MICRO_CHAT_DURATION_MINUTES, MICRO_CHAT_MESSAGE_LIMIT } from '@eyestalk/shared/constants';
import { useTheme, typography, spacing, radius, type ThemeColors } from '@/theme';

interface Props {
  expiresAt: string | null;
  messageCount: number;
  onExtend: () => void;
  extendCost: number;
}

export function MicroChatTimer({ expiresAt, messageCount, onExtend, extendCost }: Props) {
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
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
      <View style={s.expiredContainer}>
        <Text style={s.expiredText}>{t('microChat.expired')}</Text>
        <TouchableOpacity style={s.extendButton} onPress={onExtend}>
          <Text style={s.extendText}>
            {t('microChat.extend', { cost: extendCost })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.container, isLow && s.containerWarning]}>
      <Text style={[s.timerText, isLow && s.timerWarning]}>⏱ {timeLeft}</Text>
      <Text style={s.separator}>·</Text>
      <Text style={[s.messagesText, messagesLeft <= 3 && s.timerWarning]}>
        {t('microChat.messagesLeft', { count: Math.max(0, messagesLeft) })}
      </Text>
    </View>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    container: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: spacing.sm, gap: spacing.sm, backgroundColor: c.bg.secondary,
      borderBottomWidth: 1, borderBottomColor: borderColor,
    },
    containerWarning: { backgroundColor: `${c.accent.error}1A` },
    timerText: { color: c.text.secondary, fontSize: typography.size.bodySm, fontWeight: typography.weight.semibold },
    timerWarning: { color: c.accent.error },
    separator: { color: c.text.tertiary, fontSize: typography.size.bodySm },
    messagesText: { color: c.text.secondary, fontSize: typography.size.bodySm },
    expiredContainer: {
      alignItems: 'center', padding: spacing.lg, gap: spacing.md,
      backgroundColor: c.bg.secondary, borderBottomWidth: 1, borderBottomColor: borderColor,
    },
    expiredText: { color: c.accent.error, fontSize: typography.size.bodyMd, fontWeight: typography.weight.semibold },
    extendButton: {
      backgroundColor: c.accent.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md,
    },
    extendText: { color: '#FFFFFF', fontSize: typography.size.bodyMd, fontWeight: typography.weight.bold },
  });
}
