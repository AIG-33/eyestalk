import { useState } from 'react';
import { View, TextInput, Text, StyleSheet, type TextInputProps } from 'react-native';
import { colors, component, typography } from '@/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? component.input.borderError
    : focused
      ? component.input.borderFocus
      : component.input.borderDefault;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, { borderColor }, style]}
        placeholderTextColor={component.input.placeholderColor}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        {...rest}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    color: colors.text.secondary,
    fontSize: typography.size.bodySm,
    fontWeight: typography.weight.semibold,
    marginBottom: 8,
    letterSpacing: typography.letterSpacing.small,
  },
  input: {
    height: component.input.height,
    backgroundColor: component.input.bgColor,
    borderWidth: 1,
    borderRadius: component.input.radius,
    paddingHorizontal: 16,
    fontSize: typography.size.bodyLg,
    color: colors.text.primary,
  },
  error: {
    color: colors.accent.error,
    fontSize: typography.size.bodySm,
    marginTop: 6,
  },
});
