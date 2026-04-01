import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { haptic } from '@/lib/haptics';
import { colors, component, typography, shadows, opacity } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title, onPress, variant = 'primary', disabled, loading, style, fullWidth = true,
}: Props) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (variant === 'danger') haptic.warning();
    else haptic.light();
    onPress();
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[fullWidth && { width: '100%' }, style]}
      >
        <LinearGradient
          colors={[colors.accent.primary, colors.accent.primaryLight]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[
            styles.primary,
            shadows.glowPrimary,
            isDisabled && { opacity: opacity.disabled },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryText}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles = {
    secondary: styles.secondary,
    ghost: styles.ghost,
    danger: styles.danger,
  };
  const textStyles = {
    secondary: styles.secondaryText,
    ghost: styles.ghostText,
    danger: styles.dangerText,
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        variantStyles[variant],
        fullWidth && { width: '100%' },
        isDisabled && { opacity: opacity.disabled },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent.primaryLight} />
      ) : (
        <Text style={textStyles[variant]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primary: {
    height: component.button.primaryHeight,
    borderRadius: component.button.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: typography.size.headingSm,
    fontWeight: typography.weight.bold,
  },
  secondary: {
    height: component.button.secondaryHeight,
    borderRadius: component.button.radius,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent.primary,
    backgroundColor: 'transparent',
  },
  secondaryText: {
    color: colors.accent.primaryLight,
    fontSize: typography.size.headingSm,
    fontWeight: typography.weight.semibold,
  },
  ghost: {
    height: component.button.ghostHeight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,111,247,0.1)',
  },
  ghostText: {
    color: colors.accent.primaryLight,
    fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.semibold,
  },
  danger: {
    height: component.button.secondaryHeight,
    borderRadius: component.button.radius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.error,
    ...shadows.glowError,
  },
  dangerText: {
    color: '#FFFFFF',
    fontSize: typography.size.headingSm,
    fontWeight: typography.weight.bold,
  },
});
