import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, typography } from '@/theme';

type Variant = 'intention' | 'venue' | 'filter' | 'status';

interface Props {
  label: string;
  variant?: Variant;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}

export function Tag({ label, variant = 'intention', active, onPress, color }: Props) {
  const Wrapper = onPress ? TouchableOpacity : View;

  const bg = (() => {
    if (variant === 'filter') return active ? colors.tag.filterActive.bg : colors.tag.filter.bg;
    if (variant === 'status') return color || colors.accent.primary;
    if (variant === 'venue') return colors.tag.venue.bg;
    return colors.tag.intention.bg;
  })();

  const textColor = (() => {
    if (variant === 'filter') return active ? colors.tag.filterActive.text : colors.tag.filter.text;
    if (variant === 'status') return '#FFFFFF';
    if (variant === 'venue') return colors.tag.venue.text;
    return colors.tag.intention.text;
  })();

  const borderColor = variant === 'filter' && !active ? colors.tag.filter.border : 'transparent';

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.tag,
        { backgroundColor: bg, borderColor },
        variant === 'status' && styles.statusTag,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusTag: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: typography.size.bodySm,
    fontWeight: typography.weight.semibold,
  },
});
