import { View, StyleSheet, type ViewStyle, type ViewProps } from 'react-native';
import { colors, component, shadows, radius } from '@/theme';

type Variant = 'user' | 'venue' | 'activity' | 'glass';

interface Props extends ViewProps {
  variant?: Variant;
  style?: ViewStyle;
  children: React.ReactNode;
}

export function Card({ variant = 'user', style, children, ...rest }: Props) {
  return (
    <View style={[variantStyles[variant], style]} {...rest}>
      {children}
    </View>
  );
}

const variantStyles: Record<Variant, ViewStyle> = {
  user: {
    backgroundColor: component.card.userBg,
    borderWidth: 1,
    borderColor: component.card.userBorder,
    borderRadius: component.card.userRadius,
    padding: 16,
    ...shadows.lg,
  },
  venue: {
    backgroundColor: 'rgba(22,22,48,0.7)',
    borderWidth: 1,
    borderColor: component.card.venueBorder,
    borderRadius: component.card.venueRadius,
    padding: 20,
    ...shadows.lg,
  },
  activity: {
    backgroundColor: component.card.activityBg,
    borderRadius: component.card.activityRadius,
    padding: 12,
    ...shadows.md,
  },
  glass: {
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: radius.xl,
    padding: 16,
    ...shadows.lg,
  },
};
