import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography, spacing } from '@/theme';

interface EmptyStateProps {
  emoji?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  hint?: string;
  children?: React.ReactNode;
}

export function EmptyState({ emoji, icon, title, hint, children }: EmptyStateProps) {
  const { c } = useTheme();

  return (
    <View style={styles.container}>
      {emoji ? (
        <Text style={styles.emoji}>{emoji}</Text>
      ) : icon ? (
        <Ionicons name={icon} size={56} color={c.text.tertiary} style={styles.icon} />
      ) : null}

      <Text style={[styles.title, { color: c.text.primary }]}>{title}</Text>

      {hint ? (
        <Text style={[styles.hint, { color: c.text.secondary }]}>{hint}</Text>
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  icon: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.headingMd,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: typography.size.bodyMd,
    textAlign: 'center',
    lineHeight: typography.size.bodyMd * 1.5,
  },
});
