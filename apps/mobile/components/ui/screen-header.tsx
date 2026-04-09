import { type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography, spacing } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  rightAction?: ReactNode;
  onBack?: () => void;
  /** Center the title between back button and right action */
  centered?: boolean;
}

export function ScreenHeader({ title, rightAction, onBack, centered = true }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { c, isDark } = useTheme();

  const handleBack = onBack ?? (() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/map');
  });

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        onPress={handleBack}
        style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color={c.text.primary} />
      </TouchableOpacity>

      <Text
        style={[
          styles.title,
          { color: c.text.primary },
          centered && styles.titleCentered,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>

      {rightAction ? (
        <View style={styles.rightSlot}>{rightAction}</View>
      ) : (
        <View style={styles.rightPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size.headingMd,
    fontWeight: typography.weight.extrabold,
    flexShrink: 1,
  },
  titleCentered: {
    flex: 1,
    textAlign: 'center',
  },
  rightSlot: {
    width: 36,
    alignItems: 'flex-end',
  },
  rightPlaceholder: {
    width: 36,
  },
});
