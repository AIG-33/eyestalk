import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, typography, spacing, radius, type ThemeColors } from '@/theme';

interface Props {
  onSelect: (question: string) => void;
}

export function IcebreakerBar({ onSelect }: Props) {
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);

  const questions = [
    t('icebreakers.q1'),
    t('icebreakers.q2'),
    t('icebreakers.q3'),
  ];

  return (
    <View style={s.container}>
      <Text style={s.title}>{t('icebreakers.title')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {questions.map((q, i) => (
          <TouchableOpacity key={i} style={s.chip} onPress={() => onSelect(q)}>
            <Text style={s.chipText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    container: {
      paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: borderColor,
    },
    title: {
      color: c.accent.primary, fontSize: typography.size.bodySm, fontWeight: typography.weight.bold,
      paddingHorizontal: spacing.lg, marginBottom: spacing.sm,
      textTransform: 'uppercase', letterSpacing: typography.letterSpacing.small,
    },
    scroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
    chip: {
      backgroundColor: c.bg.secondary, borderRadius: radius.lg,
      paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
      borderWidth: 1, borderColor: c.accent.primary,
      maxWidth: 200,
    },
    chipText: { color: c.text.primary, fontSize: typography.size.bodySm, lineHeight: 18 },
  });
}
